-- 016_multi_currency_cash.sql
-- 多币种现金管理数据库迁移
-- 支持一个交易账户持有多种货币的现金余额

-- 创建账户现金余额表（按币种分别存储）
CREATE TABLE IF NOT EXISTS finapp.account_cash_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trading_account_id UUID NOT NULL REFERENCES finapp.trading_accounts(id) ON DELETE CASCADE,
  currency VARCHAR(3) NOT NULL, -- ISO 4217 货币代码
  cash_balance DECIMAL(20,8) DEFAULT 0.00,
  available_balance DECIMAL(20,8) DEFAULT 0.00,
  frozen_balance DECIMAL(20,8) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 确保每个账户的每种货币只有一条记录
  UNIQUE(trading_account_id, currency)
);

-- 修改现金流水表，增加货币字段
ALTER TABLE finapp.cash_transactions 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'CNY',
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6), -- 如果涉及汇率转换
ADD COLUMN IF NOT EXISTS base_currency_amount DECIMAL(20,8); -- 基础货币金额

-- 为新表创建索引
CREATE INDEX IF NOT EXISTS idx_account_cash_balances_account_id ON finapp.account_cash_balances(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_account_cash_balances_currency ON finapp.account_cash_balances(currency);
CREATE INDEX IF NOT EXISTS idx_account_cash_balances_updated ON finapp.account_cash_balances(last_updated);

-- 为现金流水表的新字段创建索引
CREATE INDEX IF NOT EXISTS idx_cash_transactions_currency ON finapp.cash_transactions(currency);

-- 迁移现有数据：从 trading_accounts 的现金字段迁移到新的多币种表
INSERT INTO finapp.account_cash_balances (
  trading_account_id, 
  currency, 
  cash_balance, 
  available_balance, 
  frozen_balance
)
SELECT 
  id as trading_account_id,
  currency,
  COALESCE(cash_balance, 0) as cash_balance,
  COALESCE(available_balance, 0) as available_balance,
  COALESCE(frozen_balance, 0) as frozen_balance
FROM finapp.trading_accounts 
WHERE currency IS NOT NULL
ON CONFLICT (trading_account_id, currency) DO NOTHING;

-- 更新现有现金流水记录的货币字段
UPDATE finapp.cash_transactions ct
SET currency = ta.currency
FROM finapp.trading_accounts ta
WHERE ct.trading_account_id = ta.id 
AND ct.currency IS NULL;

-- 创建视图：账户现金汇总（包含所有币种）
CREATE OR REPLACE VIEW finapp.v_account_cash_summary AS
SELECT 
  ta.id as trading_account_id,
  ta.name as account_name,
  ta.account_type,
  ta.broker_name,
  p.name as portfolio_name,
  p.base_currency as portfolio_base_currency,
  
  -- 现金余额汇总（按币种）
  json_agg(
    json_build_object(
      'currency', acb.currency,
      'cash_balance', acb.cash_balance,
      'available_balance', acb.available_balance,
      'frozen_balance', acb.frozen_balance,
      'last_updated', acb.last_updated
    ) ORDER BY acb.currency
  ) as currency_balances,
  
  -- 总币种数
  count(acb.currency) as currency_count,
  
  -- 主要货币余额（账户默认货币）
  COALESCE(main_balance.cash_balance, 0) as main_currency_balance,
  ta.currency as main_currency
  
FROM finapp.trading_accounts ta
JOIN finapp.portfolios p ON ta.portfolio_id = p.id
LEFT JOIN finapp.account_cash_balances acb ON ta.id = acb.trading_account_id
LEFT JOIN finapp.account_cash_balances main_balance ON (
  ta.id = main_balance.trading_account_id 
  AND ta.currency = main_balance.currency
)
WHERE ta.is_active = true
GROUP BY ta.id, ta.name, ta.account_type, ta.broker_name, ta.currency,
         p.name, p.base_currency, main_balance.cash_balance;

-- 创建函数：获取账户特定货币的现金余额
CREATE OR REPLACE FUNCTION finapp.get_account_cash_balance(
  p_trading_account_id UUID,
  p_currency VARCHAR(3)
) RETURNS TABLE (
  cash_balance DECIMAL(20,8),
  available_balance DECIMAL(20,8),
  frozen_balance DECIMAL(20,8)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(acb.cash_balance, 0::DECIMAL(20,8)),
    COALESCE(acb.available_balance, 0::DECIMAL(20,8)),
    COALESCE(acb.frozen_balance, 0::DECIMAL(20,8))
  FROM finapp.account_cash_balances acb
  WHERE acb.trading_account_id = p_trading_account_id 
    AND acb.currency = p_currency;
    
  -- 如果没有记录，返回零值
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::DECIMAL(20,8), 0::DECIMAL(20,8), 0::DECIMAL(20,8);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：更新账户现金余额
CREATE OR REPLACE FUNCTION finapp.update_account_cash_balance(
  p_trading_account_id UUID,
  p_currency VARCHAR(3),
  p_amount_change DECIMAL(20,8),
  p_transaction_type VARCHAR(20) DEFAULT 'ADJUSTMENT'
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance DECIMAL(20,8);
  v_new_balance DECIMAL(20,8);
BEGIN
  -- 获取当前余额
  SELECT cash_balance INTO v_current_balance
  FROM finapp.account_cash_balances
  WHERE trading_account_id = p_trading_account_id AND currency = p_currency;
  
  -- 如果没有记录，创建新记录
  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
    INSERT INTO finapp.account_cash_balances (
      trading_account_id, currency, cash_balance, available_balance, frozen_balance
    ) VALUES (
      p_trading_account_id, p_currency, 0, 0, 0
    );
  END IF;
  
  -- 计算新余额
  v_new_balance := v_current_balance + p_amount_change;
  
  -- 检查余额不能为负（除非是特殊交易类型）
  IF v_new_balance < 0 AND p_transaction_type NOT IN ('OVERDRAFT', 'MARGIN') THEN
    RAISE EXCEPTION '余额不足: 当前余额 %, 尝试变更 %', v_current_balance, p_amount_change;
  END IF;
  
  -- 更新余额
  UPDATE finapp.account_cash_balances 
  SET 
    cash_balance = v_new_balance,
    available_balance = GREATEST(0, v_new_balance - frozen_balance),
    last_updated = NOW(),
    updated_at = NOW()
  WHERE trading_account_id = p_trading_account_id AND currency = p_currency;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器函数：自动更新 last_updated
CREATE OR REPLACE FUNCTION finapp.update_cash_balance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_cash_balance_timestamp ON finapp.account_cash_balances;
CREATE TRIGGER trigger_update_cash_balance_timestamp
  BEFORE UPDATE ON finapp.account_cash_balances
  FOR EACH ROW
  EXECUTE FUNCTION finapp.update_cash_balance_timestamp();

-- 添加表和字段注释
COMMENT ON TABLE finapp.account_cash_balances IS '账户多币种现金余额表';
COMMENT ON COLUMN finapp.account_cash_balances.currency IS 'ISO 4217 货币代码';
COMMENT ON COLUMN finapp.account_cash_balances.cash_balance IS '现金总余额';
COMMENT ON COLUMN finapp.account_cash_balances.available_balance IS '可用余额（总余额减去冻结余额）';
COMMENT ON COLUMN finapp.account_cash_balances.frozen_balance IS '冻结余额';

COMMENT ON COLUMN finapp.cash_transactions.currency IS '交易货币';
COMMENT ON COLUMN finapp.cash_transactions.exchange_rate IS '汇率（如果涉及货币转换）';
COMMENT ON COLUMN finapp.cash_transactions.base_currency_amount IS '基础货币金额';

-- 创建一些测试数据（为现有账户添加多币种余额）
-- 为港股账户添加 HKD 余额
INSERT INTO finapp.account_cash_balances (trading_account_id, currency, cash_balance, available_balance, frozen_balance)
SELECT 
  id as trading_account_id,
  'HKD' as currency,
  50000.00 as cash_balance,
  45000.00 as available_balance,
  5000.00 as frozen_balance
FROM finapp.trading_accounts 
WHERE broker_name LIKE '%港股%' OR account_type = 'hk_stock'
ON CONFLICT (trading_account_id, currency) DO NOTHING;

-- 为美股账户添加 USD 余额
INSERT INTO finapp.account_cash_balances (trading_account_id, currency, cash_balance, available_balance, frozen_balance)
SELECT 
  id as trading_account_id,
  'USD' as currency,
  10000.00 as cash_balance,
  9500.00 as available_balance,
  500.00 as frozen_balance
FROM finapp.trading_accounts 
WHERE broker_name LIKE '%美股%' OR account_type = 'us_stock'
ON CONFLICT (trading_account_id, currency) DO NOTHING;