-- 修改 transactions 表，添加缺失的字段
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS side VARCHAR(20) CHECK (side IN ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL')),
ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'EXECUTED' CHECK (status IN ('PENDING', 'EXECUTED', 'SETTLED', 'CANCELLED', 'FAILED')),
ADD COLUMN IF NOT EXISTS liquidity_tag VARCHAR(20) CHECK (liquidity_tag IN ('HIGH', 'MEDIUM', 'LOW', 'ILLIQUID')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 更新现有数据的 user_id（从 portfolios 表获取）
UPDATE transactions 
SET user_id = p.user_id 
FROM portfolios p 
WHERE transactions.portfolio_id = p.id 
AND transactions.user_id IS NULL;

-- 设置默认值
UPDATE transactions 
SET side = CASE 
    WHEN transaction_type IN ('STOCK_BUY', 'FUND_SUBSCRIBE', 'BOND_BUY', 'OPTION_BUY', 'DEPOSIT', 'DIVIDEND', 'INTEREST', 'TRANSFER_IN') THEN 'BUY'
    WHEN transaction_type IN ('STOCK_SELL', 'FUND_REDEEM', 'BOND_SELL', 'OPTION_SELL', 'WITHDRAWAL', 'FEE', 'TRANSFER_OUT') THEN 'SELL'
    ELSE 'BUY'
END
WHERE side IS NULL;

UPDATE transactions 
SET executed_at = COALESCE(transaction_date::timestamp with time zone, created_at)
WHERE executed_at IS NULL;

UPDATE transactions 
SET settled_at = settlement_date::timestamp with time zone
WHERE settled_at IS NULL AND settlement_date IS NOT NULL;

-- 修改 cash_flows 表，添加缺失的字段
ALTER TABLE cash_flows 
ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) CHECK (category IN ('INVESTMENT', 'DIVIDEND', 'FEE', 'TRANSFER', 'OTHER'));

-- 更新现有数据
UPDATE cash_flows 
SET date = flow_date::timestamp with time zone
WHERE date IS NULL;

UPDATE cash_flows 
SET category = CASE 
    WHEN flow_type = 'INFLOW' THEN 'INVESTMENT'
    WHEN flow_type = 'OUTFLOW' THEN 'FEE'
    ELSE 'OTHER'
END
WHERE category IS NULL;

-- 创建缺失的索引
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_executed_at ON transactions(executed_at);
CREATE INDEX IF NOT EXISTS idx_transactions_side ON transactions(side);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_liquidity_tag ON transactions(liquidity_tag);
CREATE INDEX IF NOT EXISTS idx_transactions_total_amount ON transactions(total_amount);

CREATE INDEX IF NOT EXISTS idx_cash_flows_date ON cash_flows(date);
CREATE INDEX IF NOT EXISTS idx_cash_flows_category ON cash_flows(category);

-- 创建或替换触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除现有触发器（如果存在）并重新创建
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建或替换计算总金额的触发器函数
CREATE OR REPLACE FUNCTION calculate_transaction_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount = NEW.quantity * COALESCE(NEW.price, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除现有触发器（如果存在）并重新创建
DROP TRIGGER IF EXISTS calculate_transactions_total ON transactions;
CREATE TRIGGER calculate_transactions_total 
    BEFORE INSERT OR UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_transaction_total();