-- Migration: 013_deposit_product_support.sql
-- Description: Add comprehensive support for deposit products (savings accounts, term deposits)
-- Author: AI Assistant
-- Date: 2025-11-17

-- 1. Create deposit product details table
CREATE TABLE IF NOT EXISTS finapp.deposit_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 基本信息
    deposit_type VARCHAR(50) NOT NULL CHECK (deposit_type IN ('DEMAND', 'TIME', 'NOTICE', 'STRUCTURED')),
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50),
    branch_name VARCHAR(100),
    
    -- 利率信息
    interest_rate DECIMAL(8, 6) NOT NULL, -- 年利率，支持到万分之一
    rate_type VARCHAR(20) DEFAULT 'FIXED' CHECK (rate_type IN ('FIXED', 'FLOATING')),
    compound_frequency VARCHAR(20) DEFAULT 'MATURITY' CHECK (compound_frequency IN ('DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'MATURITY')),
    
    -- 期限信息（定期存款）
    term_months INTEGER, -- 存款期限（月）
    start_date DATE,
    maturity_date DATE,
    auto_renewal BOOLEAN DEFAULT false,
    
    -- 金额限制
    min_deposit_amount DECIMAL(20, 8),
    max_deposit_amount DECIMAL(20, 8),
    deposit_increment DECIMAL(20, 8),
    
    -- 提前支取
    early_withdrawal_allowed BOOLEAN DEFAULT true,
    early_withdrawal_penalty_rate DECIMAL(8, 6), -- 提前支取罚息率
    notice_period_days INTEGER, -- 通知存款的通知期
    
    -- 其他特性
    deposit_insurance_covered BOOLEAN DEFAULT true,
    insurance_amount DECIMAL(20, 8) DEFAULT 500000, -- 存款保险金额
    special_features JSONB, -- 特殊功能：{"auto_transfer": true, "overdraft": false}
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indexes
CREATE INDEX idx_deposit_details_asset_id ON finapp.deposit_details(asset_id);
CREATE INDEX idx_deposit_details_deposit_type ON finapp.deposit_details(deposit_type);
CREATE INDEX idx_deposit_details_bank_name ON finapp.deposit_details(bank_name);
CREATE INDEX idx_deposit_details_maturity_date ON finapp.deposit_details(maturity_date);

-- 3. Add comments
COMMENT ON TABLE finapp.deposit_details IS '存款产品详情表';
COMMENT ON COLUMN finapp.deposit_details.deposit_type IS '存款类型: DEMAND=活期, TIME=定期, NOTICE=通知存款, STRUCTURED=结构性存款';
COMMENT ON COLUMN finapp.deposit_details.bank_name IS '银行名称';
COMMENT ON COLUMN finapp.deposit_details.account_number IS '账户号码';
COMMENT ON COLUMN finapp.deposit_details.interest_rate IS '年利率（小数形式，如0.035表示3.5%）';
COMMENT ON COLUMN finapp.deposit_details.rate_type IS '利率类型: FIXED=固定利率, FLOATING=浮动利率';
COMMENT ON COLUMN finapp.deposit_details.compound_frequency IS '复利频率: DAILY=日复利, MONTHLY=月复利, QUARTERLY=季复利, ANNUALLY=年复利, MATURITY=到期一次性付息';
COMMENT ON COLUMN finapp.deposit_details.term_months IS '存款期限（月数）';
COMMENT ON COLUMN finapp.deposit_details.auto_renewal IS '是否自动续存';
COMMENT ON COLUMN finapp.deposit_details.early_withdrawal_penalty_rate IS '提前支取罚息率';
COMMENT ON COLUMN finapp.deposit_details.notice_period_days IS '通知存款的通知期（天数）';

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION finapp.update_deposit_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deposit_details_updated_at
    BEFORE UPDATE ON finapp.deposit_details
    FOR EACH ROW
    EXECUTE FUNCTION finapp.update_deposit_details_updated_at();

-- 5. Create deposit interest calculation table
CREATE TABLE IF NOT EXISTS finapp.deposit_interest_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES finapp.positions(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 计息信息
    calculation_date DATE NOT NULL,
    principal_amount DECIMAL(20, 8) NOT NULL, -- 计息本金
    interest_rate DECIMAL(8, 6) NOT NULL, -- 适用利率
    days_count INTEGER NOT NULL, -- 计息天数
    interest_amount DECIMAL(20, 8) NOT NULL, -- 利息金额
    
    -- 计息方式
    calculation_method VARCHAR(20) DEFAULT 'ACTUAL_365' CHECK (calculation_method IN ('ACTUAL_365', 'ACTUAL_360', '30_360')),
    compound_frequency VARCHAR(20) NOT NULL,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'CALCULATED' CHECK (status IN ('CALCULATED', 'PAID', 'CANCELLED')),
    payment_date DATE,
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create indexes for interest records
CREATE INDEX idx_deposit_interest_position_id ON finapp.deposit_interest_records(position_id);
CREATE INDEX idx_deposit_interest_calculation_date ON finapp.deposit_interest_records(calculation_date);
CREATE INDEX idx_deposit_interest_status ON finapp.deposit_interest_records(status);

-- 7. Add comments for interest records
COMMENT ON TABLE finapp.deposit_interest_records IS '存款利息计算记录表';
COMMENT ON COLUMN finapp.deposit_interest_records.calculation_method IS '计息方法: ACTUAL_365=实际天数/365, ACTUAL_360=实际天数/360, 30_360=30/360';
COMMENT ON COLUMN finapp.deposit_interest_records.status IS '状态: CALCULATED=已计算, PAID=已支付, CANCELLED=已取消';

-- 8. Create deposit maturity alerts table
CREATE TABLE IF NOT EXISTS finapp.deposit_maturity_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES finapp.positions(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES finapp.assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES finapp.users(id) ON DELETE CASCADE,
    
    -- 到期信息
    maturity_date DATE NOT NULL,
    principal_amount DECIMAL(20, 8) NOT NULL,
    estimated_interest DECIMAL(20, 8),
    
    -- 提醒设置
    alert_days_before INTEGER DEFAULT 7, -- 提前几天提醒
    alert_date DATE NOT NULL,
    
    -- 处理选项
    renewal_option VARCHAR(20) DEFAULT 'MANUAL' CHECK (renewal_option IN ('AUTO', 'MANUAL', 'TRANSFER_TO_DEMAND')),
    new_term_months INTEGER, -- 续存期限
    
    -- 状态
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'NOTIFIED', 'PROCESSED', 'CANCELLED')),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create indexes for maturity alerts
CREATE INDEX idx_deposit_maturity_alerts_user_id ON finapp.deposit_maturity_alerts(user_id);
CREATE INDEX idx_deposit_maturity_alerts_alert_date ON finapp.deposit_maturity_alerts(alert_date);
CREATE INDEX idx_deposit_maturity_alerts_status ON finapp.deposit_maturity_alerts(status);

-- 10. Add sample deposit products
INSERT INTO finapp.assets (symbol, name, asset_type_id, currency, description, metadata, is_active)
SELECT 
    'DEPOSIT_ICBC_DEMAND',
    '工商银行活期存款',
    at.id,
    'CNY',
    '工商银行活期储蓄存款账户',
    '{
        "bank": "工商银行",
        "account_type": "活期",
        "deposit_insurance": true,
        "online_banking": true
    }'::jsonb,
    true
FROM finapp.asset_types at WHERE at.code = 'DEPOSIT'
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO finapp.assets (symbol, name, asset_type_id, currency, description, metadata, is_active)
SELECT 
    'DEPOSIT_ICBC_12M',
    '工商银行12个月定期存款',
    at.id,
    'CNY',
    '工商银行12个月整存整取定期存款',
    '{
        "bank": "工商银行",
        "account_type": "定期",
        "term": "12个月",
        "deposit_insurance": true
    }'::jsonb,
    true
FROM finapp.asset_types at WHERE at.code = 'DEPOSIT'
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO finapp.assets (symbol, name, asset_type_id, currency, description, metadata, is_active)
SELECT 
    'DEPOSIT_CCB_24M',
    '建设银行24个月定期存款',
    at.id,
    'CNY',
    '建设银行24个月整存整取定期存款',
    '{
        "bank": "建设银行",
        "account_type": "定期",
        "term": "24个月",
        "deposit_insurance": true
    }'::jsonb,
    true
FROM finapp.asset_types at WHERE at.code = 'DEPOSIT'
ON CONFLICT (symbol) DO NOTHING;

-- 11. Insert deposit details for sample products
INSERT INTO finapp.deposit_details (
    asset_id, deposit_type, bank_name, interest_rate, rate_type, 
    compound_frequency, min_deposit_amount, early_withdrawal_allowed,
    deposit_insurance_covered, insurance_amount
)
SELECT 
    a.id,
    'DEMAND',
    '工商银行',
    0.0030, -- 0.30%
    'FIXED',
    'DAILY',
    1.00,
    true,
    true,
    500000.00
FROM finapp.assets a 
WHERE a.symbol = 'DEPOSIT_ICBC_DEMAND'
ON CONFLICT DO NOTHING;

INSERT INTO finapp.deposit_details (
    asset_id, deposit_type, bank_name, interest_rate, rate_type,
    compound_frequency, term_months, min_deposit_amount, auto_renewal,
    early_withdrawal_allowed, early_withdrawal_penalty_rate,
    deposit_insurance_covered, insurance_amount
)
SELECT 
    a.id,
    'TIME',
    '工商银行',
    0.0275, -- 2.75%
    'FIXED',
    'MATURITY',
    12,
    50.00,
    false,
    true,
    0.0030, -- 按活期利率计息
    true,
    500000.00
FROM finapp.assets a 
WHERE a.symbol = 'DEPOSIT_ICBC_12M'
ON CONFLICT DO NOTHING;

INSERT INTO finapp.deposit_details (
    asset_id, deposit_type, bank_name, interest_rate, rate_type,
    compound_frequency, term_months, min_deposit_amount, auto_renewal,
    early_withdrawal_allowed, early_withdrawal_penalty_rate,
    deposit_insurance_covered, insurance_amount
)
SELECT 
    a.id,
    'TIME',
    '建设银行',
    0.0310, -- 3.10%
    'FIXED',
    'MATURITY',
    24,
    50.00,
    false,
    true,
    0.0030, -- 按活期利率计息
    true,
    500000.00
FROM finapp.assets a 
WHERE a.symbol = 'DEPOSIT_CCB_24M'
ON CONFLICT DO NOTHING;

-- 12. Create view for deposit products summary
CREATE OR REPLACE VIEW finapp.deposit_products_summary AS
SELECT 
    a.id as asset_id,
    a.symbol,
    a.name as product_name,
    a.currency,
    dd.deposit_type,
    dd.bank_name,
    dd.interest_rate,
    dd.rate_type,
    dd.term_months,
    dd.maturity_date,
    dd.auto_renewal,
    dd.early_withdrawal_allowed,
    dd.early_withdrawal_penalty_rate,
    dd.min_deposit_amount,
    dd.max_deposit_amount,
    dd.deposit_insurance_covered,
    dd.insurance_amount,
    
    -- 计算年化收益率显示
    CASE 
        WHEN dd.compound_frequency = 'DAILY' THEN 
            ROUND((POWER(1 + dd.interest_rate/365, 365) - 1) * 100, 4)
        WHEN dd.compound_frequency = 'MONTHLY' THEN 
            ROUND((POWER(1 + dd.interest_rate/12, 12) - 1) * 100, 4)
        WHEN dd.compound_frequency = 'QUARTERLY' THEN 
            ROUND((POWER(1 + dd.interest_rate/4, 4) - 1) * 100, 4)
        WHEN dd.compound_frequency = 'ANNUALLY' THEN 
            ROUND(dd.interest_rate * 100, 4)
        ELSE 
            ROUND(dd.interest_rate * 100, 4)
    END as effective_annual_rate_percent,
    
    a.is_active,
    a.created_at,
    dd.updated_at as details_updated_at
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
JOIN finapp.deposit_details dd ON a.id = dd.asset_id
WHERE at.code = 'DEPOSIT'
ORDER BY dd.bank_name, dd.deposit_type, dd.term_months;

-- 13. Add comment for the view
COMMENT ON VIEW finapp.deposit_products_summary IS '存款产品汇总视图，包含产品基本信息和详细参数';

-- Migration completed
SELECT 'Migration 013_deposit_product_support completed successfully' as status;