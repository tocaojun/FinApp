-- 创建保险资产支持
-- 功能：添加保险资产类型和相关表结构，支持重疾险等保险产品管理

-- 第一部分：添加保险资产类型
INSERT INTO finapp.asset_types (id, code, name, category, description, is_active, created_at, location_dimension)
VALUES 
    (gen_random_uuid(), 'CRITICAL_ILLNESS', '重疾险', 'INSURANCE', '重大疾病保险产品', true, CURRENT_TIMESTAMP, 'global'),
    (gen_random_uuid(), 'LIFE_INSURANCE', '寿险', 'INSURANCE', '人寿保险产品', true, CURRENT_TIMESTAMP, 'global'),
    (gen_random_uuid(), 'ACCIDENT_INSURANCE', '意外险', 'INSURANCE', '意外伤害保险产品', true, CURRENT_TIMESTAMP, 'global'),
    (gen_random_uuid(), 'MEDICAL_INSURANCE', '医疗险', 'INSURANCE', '医疗保险产品', true, CURRENT_TIMESTAMP, 'global')
ON CONFLICT (code) DO NOTHING;

-- 第二部分：创建保险产品详情表
CREATE TABLE IF NOT EXISTS finapp.insurance_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 基本保险信息
    policy_number VARCHAR(100), -- 保单号
    insurance_company VARCHAR(200) NOT NULL, -- 保险公司
    insurance_type VARCHAR(50) NOT NULL, -- 保险类型：CRITICAL_ILLNESS, LIFE_INSURANCE, ACCIDENT_INSURANCE等
    
    -- 保障信息
    coverage_amount DECIMAL(15,2) NOT NULL, -- 保额
    coverage_period VARCHAR(50), -- 保障期限：终身/定期
    coverage_start_date DATE, -- 保障开始日期
    coverage_end_date DATE, -- 保障结束日期（如果是定期）
    
    -- 缴费信息
    premium_amount DECIMAL(15,2) NOT NULL, -- 保费金额
    premium_frequency VARCHAR(20) NOT NULL, -- 缴费频率：MONTHLY, QUARTERLY, ANNUALLY, LUMP_SUM
    premium_period INTEGER, -- 缴费期限（年）
    premium_start_date DATE, -- 缴费开始日期
    premium_end_date DATE, -- 缴费结束日期
    
    -- 现金价值信息
    current_cash_value DECIMAL(15,2) DEFAULT 0, -- 当前现金价值
    guaranteed_cash_value DECIMAL(15,2) DEFAULT 0, -- 保证现金价值
    dividend_cash_value DECIMAL(15,2) DEFAULT 0, -- 分红现金价值
    cash_value_update_date DATE, -- 现金价值更新日期
    
    -- 受益人信息
    beneficiary_info JSONB, -- 受益人信息
    
    -- 其他信息
    policy_status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, LAPSED, SURRENDERED, CLAIMED
    is_participating BOOLEAN DEFAULT false, -- 是否分红险
    waiting_period INTEGER DEFAULT 90, -- 等待期（天）
    
    -- 元数据
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- 约束
    CONSTRAINT chk_insurance_details_premium_frequency 
        CHECK (premium_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUALLY', 'LUMP_SUM')),
    CONSTRAINT chk_insurance_details_policy_status 
        CHECK (policy_status IN ('ACTIVE', 'LAPSED', 'SURRENDERED', 'CLAIMED')),
    CONSTRAINT chk_insurance_details_coverage_amount_positive 
        CHECK (coverage_amount > 0),
    CONSTRAINT chk_insurance_details_premium_amount_positive 
        CHECK (premium_amount > 0),
    CONSTRAINT chk_insurance_details_cash_value_non_negative 
        CHECK (current_cash_value >= 0 AND guaranteed_cash_value >= 0 AND dividend_cash_value >= 0)
);

-- 创建索引
CREATE INDEX idx_insurance_details_asset_id ON finapp.insurance_details(asset_id);
CREATE INDEX idx_insurance_details_policy_number ON finapp.insurance_details(policy_number);
CREATE INDEX idx_insurance_details_insurance_type ON finapp.insurance_details(insurance_type);
CREATE INDEX idx_insurance_details_policy_status ON finapp.insurance_details(policy_status);
CREATE INDEX idx_insurance_details_insurance_company ON finapp.insurance_details(insurance_company);

-- 第三部分：创建保险缴费记录表
CREATE TABLE IF NOT EXISTS finapp.insurance_premium_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insurance_detail_id UUID NOT NULL REFERENCES finapp.insurance_details(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES finapp.transactions(id), -- 关联交易记录
    
    -- 缴费信息
    payment_date DATE NOT NULL,
    premium_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    payment_method VARCHAR(50), -- 支付方式
    
    -- 缴费期数
    payment_period INTEGER, -- 第几期缴费
    is_overdue BOOLEAN DEFAULT false,
    overdue_days INTEGER DEFAULT 0,
    
    -- 状态
    payment_status VARCHAR(20) DEFAULT 'PAID', -- PAID, PENDING, OVERDUE, WAIVED
    
    -- 元数据
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT chk_premium_payments_amount_positive CHECK (premium_amount > 0),
    CONSTRAINT chk_premium_payments_status CHECK (payment_status IN ('PAID', 'PENDING', 'OVERDUE', 'WAIVED')),
    CONSTRAINT chk_premium_payments_overdue_days_non_negative CHECK (overdue_days >= 0)
);

-- 创建索引
CREATE INDEX idx_insurance_premium_payments_insurance_id ON finapp.insurance_premium_payments(insurance_detail_id);
CREATE INDEX idx_insurance_premium_payments_date ON finapp.insurance_premium_payments(payment_date);
CREATE INDEX idx_insurance_premium_payments_status ON finapp.insurance_premium_payments(payment_status);
CREATE INDEX idx_insurance_premium_payments_transaction_id ON finapp.insurance_premium_payments(transaction_id);

-- 第四部分：创建现金价值历史表
CREATE TABLE IF NOT EXISTS finapp.insurance_cash_value_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insurance_detail_id UUID NOT NULL REFERENCES finapp.insurance_details(id) ON DELETE CASCADE,
    
    -- 现金价值信息
    valuation_date DATE NOT NULL,
    guaranteed_cash_value DECIMAL(15,2) NOT NULL,
    dividend_cash_value DECIMAL(15,2) DEFAULT 0,
    total_cash_value DECIMAL(15,2) GENERATED ALWAYS AS (guaranteed_cash_value + dividend_cash_value) STORED,
    
    -- 累计缴费
    total_premium_paid DECIMAL(15,2) DEFAULT 0,
    
    -- 收益率计算
    yield_rate DECIMAL(8,4), -- 年化收益率
    
    -- 元数据
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT chk_cash_value_history_values_non_negative 
        CHECK (guaranteed_cash_value >= 0 AND dividend_cash_value >= 0 AND total_premium_paid >= 0),
    CONSTRAINT chk_cash_value_history_unique_date 
        UNIQUE (insurance_detail_id, valuation_date)
);

-- 创建索引
CREATE INDEX idx_insurance_cash_value_history_insurance_id ON finapp.insurance_cash_value_history(insurance_detail_id);
CREATE INDEX idx_insurance_cash_value_history_date ON finapp.insurance_cash_value_history(valuation_date);

-- 第五部分：创建保险资产视图（用于统一查询）
CREATE OR REPLACE VIEW finapp.v_insurance_assets AS
SELECT 
    a.id as asset_id,
    a.symbol,
    a.name as asset_name,
    at.name as asset_type_name,
    id_detail.id as insurance_detail_id,
    id_detail.policy_number,
    id_detail.insurance_company,
    id_detail.insurance_type,
    id_detail.coverage_amount,
    id_detail.coverage_period,
    id_detail.coverage_start_date,
    id_detail.coverage_end_date,
    id_detail.premium_amount,
    id_detail.premium_frequency,
    id_detail.premium_period,
    id_detail.premium_start_date,
    id_detail.premium_end_date,
    id_detail.current_cash_value,
    id_detail.guaranteed_cash_value,
    id_detail.dividend_cash_value,
    id_detail.cash_value_update_date,
    id_detail.policy_status,
    id_detail.is_participating,
    id_detail.waiting_period,
    a.currency,
    a.created_at,
    id_detail.updated_at
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
JOIN finapp.insurance_details id_detail ON a.id = id_detail.asset_id
WHERE at.category = 'INSURANCE' 
    AND a.is_active = true 
    AND id_detail.policy_status = 'ACTIVE';

-- 第六部分：创建保险统计视图
CREATE OR REPLACE VIEW finapp.v_insurance_summary AS
SELECT 
    p.id as portfolio_id,
    p.name as portfolio_name,
    COUNT(DISTINCT ia.asset_id) as total_policies,
    SUM(ia.coverage_amount) as total_coverage_amount,
    SUM(ia.current_cash_value) as total_cash_value,
    SUM(ia.premium_amount * 
        CASE ia.premium_frequency 
            WHEN 'MONTHLY' THEN 12
            WHEN 'QUARTERLY' THEN 4
            WHEN 'ANNUALLY' THEN 1
            ELSE 0
        END) as annual_premium_amount,
    COUNT(CASE WHEN ia.policy_status = 'ACTIVE' THEN 1 END) as active_policies,
    COUNT(CASE WHEN ia.is_participating = true THEN 1 END) as participating_policies
FROM finapp.portfolios p
LEFT JOIN finapp.portfolio_positions pp ON p.id = pp.portfolio_id
LEFT JOIN finapp.v_insurance_assets ia ON pp.asset_id = ia.asset_id
WHERE p.is_active = true
GROUP BY p.id, p.name;

-- 第七部分：添加触发器，自动更新现金价值历史
CREATE OR REPLACE FUNCTION finapp.update_insurance_cash_value_history()
RETURNS TRIGGER AS $$
BEGIN
    -- 当现金价值更新时，自动记录历史
    IF (OLD.current_cash_value IS DISTINCT FROM NEW.current_cash_value OR 
        OLD.guaranteed_cash_value IS DISTINCT FROM NEW.guaranteed_cash_value OR 
        OLD.dividend_cash_value IS DISTINCT FROM NEW.dividend_cash_value) THEN
        
        INSERT INTO finapp.insurance_cash_value_history (
            insurance_detail_id,
            valuation_date,
            guaranteed_cash_value,
            dividend_cash_value,
            total_premium_paid,
            notes
        ) VALUES (
            NEW.id,
            COALESCE(NEW.cash_value_update_date, CURRENT_DATE),
            NEW.guaranteed_cash_value,
            NEW.dividend_cash_value,
            (SELECT COALESCE(SUM(premium_amount), 0) 
             FROM finapp.insurance_premium_payments 
             WHERE insurance_detail_id = NEW.id AND payment_status = 'PAID'),
            '自动记录现金价值变更'
        )
        ON CONFLICT (insurance_detail_id, valuation_date) 
        DO UPDATE SET 
            guaranteed_cash_value = EXCLUDED.guaranteed_cash_value,
            dividend_cash_value = EXCLUDED.dividend_cash_value,
            total_premium_paid = EXCLUDED.total_premium_paid,
            notes = EXCLUDED.notes;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS tr_insurance_cash_value_history ON finapp.insurance_details;
CREATE TRIGGER tr_insurance_cash_value_history
    AFTER UPDATE ON finapp.insurance_details
    FOR EACH ROW
    EXECUTE FUNCTION finapp.update_insurance_cash_value_history();

-- 第八部分：添加注释
COMMENT ON TABLE finapp.insurance_details IS '保险产品详情表，存储保险产品的基本信息、保障信息、缴费信息和现金价值';
COMMENT ON TABLE finapp.insurance_premium_payments IS '保险缴费记录表，记录每次保费缴纳的详细信息';
COMMENT ON TABLE finapp.insurance_cash_value_history IS '保险现金价值历史表，跟踪现金价值的变化情况';
COMMENT ON VIEW finapp.v_insurance_assets IS '保险资产视图，提供保险产品的综合信息查询';
COMMENT ON VIEW finapp.v_insurance_summary IS '保险统计视图，按投资组合汇总保险资产情况';

-- 验证创建结果
SELECT 'Insurance asset types' as item, COUNT(*) as count FROM finapp.asset_types WHERE category = 'INSURANCE';
SELECT 'Insurance tables created' as item, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'finapp' AND table_name LIKE '%insurance%';
SELECT 'Insurance views created' as item, COUNT(*) as count FROM information_schema.views WHERE table_schema = 'finapp' AND table_name LIKE '%insurance%';