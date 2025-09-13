-- 创建交易记录表
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    
    -- 交易基本信息
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'STOCK_BUY', 'STOCK_SELL', 'FUND_SUBSCRIBE', 'FUND_REDEEM',
        'BOND_BUY', 'BOND_SELL', 'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE',
        'DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST', 'FEE', 'TRANSFER_IN', 'TRANSFER_OUT'
    )),
    side VARCHAR(20) NOT NULL CHECK (side IN ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL')),
    
    -- 交易数量和价格
    quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
    price DECIMAL(20, 8) NOT NULL CHECK (price > 0),
    total_amount DECIMAL(20, 2) NOT NULL,
    fees DECIMAL(20, 2) DEFAULT 0 CHECK (fees >= 0),
    currency VARCHAR(3) NOT NULL,
    
    -- 交易时间
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    settled_at TIMESTAMP WITH TIME ZONE,
    
    -- 附加信息
    notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    liquidity_tag VARCHAR(20) CHECK (liquidity_tag IN ('HIGH', 'MEDIUM', 'LOW', 'ILLIQUID')),
    
    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'EXECUTED' CHECK (status IN ('PENDING', 'EXECUTED', 'SETTLED', 'CANCELLED', 'FAILED')),
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建现金流记录表
CREATE TABLE IF NOT EXISTS cash_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    
    -- 现金流信息
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    flow_type VARCHAR(20) NOT NULL CHECK (flow_type IN ('INFLOW', 'OUTFLOW')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('INVESTMENT', 'DIVIDEND', 'FEE', 'TRANSFER', 'OTHER')),
    
    -- 时间和描述
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建交易标签表
CREATE TABLE IF NOT EXISTS transaction_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- HEX color code
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建交易和标签的关联表
CREATE TABLE IF NOT EXISTS transaction_tag_mappings (
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES transaction_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_trading_account_id ON transactions(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_transactions_executed_at ON transactions(executed_at);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_side ON transactions(side);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_liquidity_tag ON transactions(liquidity_tag);
CREATE INDEX IF NOT EXISTS idx_transactions_total_amount ON transactions(total_amount);
CREATE INDEX IF NOT EXISTS idx_transactions_tags ON transactions USING GIN(tags);

-- 现金流表索引
CREATE INDEX IF NOT EXISTS idx_cash_flows_transaction_id ON cash_flows(transaction_id);
CREATE INDEX IF NOT EXISTS idx_cash_flows_portfolio_id ON cash_flows(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_cash_flows_trading_account_id ON cash_flows(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_cash_flows_date ON cash_flows(date);
CREATE INDEX IF NOT EXISTS idx_cash_flows_flow_type ON cash_flows(flow_type);
CREATE INDEX IF NOT EXISTS idx_cash_flows_category ON cash_flows(category);

-- 交易标签表索引
CREATE INDEX IF NOT EXISTS idx_transaction_tags_user_id ON transaction_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_name ON transaction_tags(name);

-- 创建触发器以自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建触发器以自动计算 total_amount
CREATE OR REPLACE FUNCTION calculate_transaction_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount = NEW.quantity * NEW.price;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_transactions_total 
    BEFORE INSERT OR UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_transaction_total();

-- 插入系统默认标签
INSERT INTO transaction_tags (name, description, color, is_system) VALUES
('高频交易', '频繁买卖的交易', '#FF6B6B', TRUE),
('长期投资', '长期持有的投资', '#4ECDC4', TRUE),
('分红收入', '股息和分红收入', '#45B7D1', TRUE),
('费用支出', '交易费用和管理费', '#FFA07A', TRUE),
('资金调拨', '账户间资金转移', '#98D8C8', TRUE),
('定投计划', '定期投资计划', '#F7DC6F', TRUE),
('止损操作', '风险控制操作', '#BB8FCE', TRUE),
('获利了结', '盈利后卖出操作', '#85C1E9', TRUE)
ON CONFLICT (name) DO NOTHING;