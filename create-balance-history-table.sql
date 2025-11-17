-- 创建余额型理财产品历史记录表
CREATE TABLE IF NOT EXISTS finapp.balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES finapp.positions(id) ON DELETE CASCADE,
    balance DECIMAL(15, 8) NOT NULL,
    previous_balance DECIMAL(15, 8),
    change_amount DECIMAL(15, 8) GENERATED ALWAYS AS (balance - COALESCE(previous_balance, balance)) STORED,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('MANUAL_UPDATE', 'TRANSACTION', 'INTEREST', 'DIVIDEND', 'FEE')),
    update_date DATE NOT NULL DEFAULT CURRENT_DATE,
    update_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_by UUID REFERENCES finapp.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_balance_history_position_id ON finapp.balance_history(position_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_date ON finapp.balance_history(update_date);
CREATE INDEX IF NOT EXISTS idx_balance_history_position_date ON finapp.balance_history(position_id, update_date);

-- 创建触发器函数，自动更新 updated_at
CREATE OR REPLACE FUNCTION finapp.update_balance_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_balance_history_updated_at ON finapp.balance_history;
CREATE TRIGGER trigger_update_balance_history_updated_at
    BEFORE UPDATE ON finapp.balance_history
    FOR EACH ROW
    EXECUTE FUNCTION finapp.update_balance_history_updated_at();

-- 创建视图，方便查询余额变化历史
CREATE OR REPLACE VIEW finapp.balance_history_view AS
SELECT 
    bh.id,
    bh.position_id,
    p.portfolio_id,
    a.name as asset_name,
    a.symbol as asset_symbol,
    bh.balance,
    bh.previous_balance,
    bh.change_amount,
    bh.change_type,
    bh.update_date,
    bh.update_time,
    bh.notes,
    u.email as updated_by_email,
    bh.created_at,
    bh.updated_at,
    -- 计算收益率
    CASE 
        WHEN bh.previous_balance IS NOT NULL AND bh.previous_balance > 0 
        THEN (bh.change_amount / bh.previous_balance * 100)
        ELSE 0
    END as return_percentage
FROM finapp.balance_history bh
JOIN finapp.positions p ON bh.position_id = p.id
JOIN finapp.assets a ON p.asset_id = a.id
LEFT JOIN finapp.users u ON bh.created_by = u.id
ORDER BY bh.update_date DESC, bh.update_time DESC;

-- 添加注释
COMMENT ON TABLE finapp.balance_history IS '余额型理财产品历史记录表';
COMMENT ON COLUMN finapp.balance_history.position_id IS '持仓ID';
COMMENT ON COLUMN finapp.balance_history.balance IS '当前余额';
COMMENT ON COLUMN finapp.balance_history.previous_balance IS '上一次余额';
COMMENT ON COLUMN finapp.balance_history.change_amount IS '变化金额（自动计算）';
COMMENT ON COLUMN finapp.balance_history.change_type IS '变化类型：MANUAL_UPDATE-手动更新, TRANSACTION-交易, INTEREST-利息, DIVIDEND-分红, FEE-费用';
COMMENT ON COLUMN finapp.balance_history.update_date IS '更新日期';
COMMENT ON COLUMN finapp.balance_history.update_time IS '更新时间';
COMMENT ON COLUMN finapp.balance_history.notes IS '备注';