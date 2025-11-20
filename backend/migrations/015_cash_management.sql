-- 015_cash_management.sql
-- 现金管理功能数据库迁移

-- 扩展 trading_accounts 表，添加现金管理字段
ALTER TABLE finapp.trading_accounts 
ADD COLUMN IF NOT EXISTS cash_balance DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS frozen_balance DECIMAL(15,2) DEFAULT 0.00;

-- 更新现有记录，将 current_balance 作为 cash_balance 的初始值
UPDATE finapp.trading_accounts 
SET 
  cash_balance = COALESCE(current_balance, 0.00),
  available_balance = COALESCE(current_balance, 0.00),
  frozen_balance = 0.00
WHERE cash_balance IS NULL;

-- 创建现金流水记录表
CREATE TABLE IF NOT EXISTS finapp.cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trading_account_id UUID NOT NULL REFERENCES finapp.trading_accounts(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL, -- DEPOSIT, WITHDRAW, INVESTMENT, REDEMPTION, TRANSFER
  amount DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description TEXT,
  reference_transaction_id UUID, -- 关联投资交易ID（如果有）
  metadata JSONB DEFAULT '{}', -- 额外信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为现金流水表创建索引
CREATE INDEX IF NOT EXISTS idx_cash_transactions_account_id ON finapp.cash_transactions(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON finapp.cash_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_created_at ON finapp.cash_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_reference ON finapp.cash_transactions(reference_transaction_id);

-- 添加现金流水表注释
COMMENT ON TABLE finapp.cash_transactions IS '现金流水记录表';
COMMENT ON COLUMN finapp.cash_transactions.transaction_type IS '交易类型：DEPOSIT-存入, WITHDRAW-取出, INVESTMENT-投资, REDEMPTION-赎回, TRANSFER-转账';
COMMENT ON COLUMN finapp.cash_transactions.amount IS '交易金额，正数表示流入，负数表示流出';
COMMENT ON COLUMN finapp.cash_transactions.balance_after IS '交易后账户余额';
COMMENT ON COLUMN finapp.cash_transactions.reference_transaction_id IS '关联的投资交易ID';

-- 添加 trading_accounts 表字段注释
COMMENT ON COLUMN finapp.trading_accounts.cash_balance IS '现金余额';
COMMENT ON COLUMN finapp.trading_accounts.available_balance IS '可用余额';
COMMENT ON COLUMN finapp.trading_accounts.frozen_balance IS '冻结余额（待结算等）';