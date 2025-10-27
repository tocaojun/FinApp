-- ============================================
-- 多资产类型架构升级
-- Migration: 005_multi_asset_types
-- Description: 为不同资产类型创建专用详情表
-- ============================================

-- 1. 股票详情表
CREATE TABLE IF NOT EXISTS finapp.stock_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 行业分类
    sector VARCHAR(100),
    industry VARCHAR(100),
    
    -- 市值和股本
    market_cap DECIMAL(20, 2),
    shares_outstanding BIGINT,
    
    -- 财务指标
    pe_ratio DECIMAL(10, 2),
    pb_ratio DECIMAL(10, 2),
    dividend_yield DECIMAL(5, 2),
    
    -- 公司信息
    company_website VARCHAR(200),
    headquarters VARCHAR(200),
    founded_year INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_details_asset ON finapp.stock_details(asset_id);
CREATE INDEX idx_stock_details_sector ON finapp.stock_details(sector);
CREATE INDEX idx_stock_details_industry ON finapp.stock_details(industry);

COMMENT ON TABLE finapp.stock_details IS '股票详情表';
COMMENT ON COLUMN finapp.stock_details.sector IS '行业板块';
COMMENT ON COLUMN finapp.stock_details.industry IS '细分行业';

-- 2. 基金详情表
CREATE TABLE IF NOT EXISTS finapp.fund_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 基金类型
    fund_type VARCHAR(50) NOT NULL,
    fund_category VARCHAR(50),
    
    -- 费用
    management_fee DECIMAL(5, 2),
    custodian_fee DECIMAL(5, 2),
    subscription_fee DECIMAL(5, 2),
    redemption_fee DECIMAL(5, 2),
    
    -- 净值信息
    nav DECIMAL(20, 4),
    nav_date DATE,
    accumulated_nav DECIMAL(20, 4),
    
    -- 规模和期限
    fund_size DECIMAL(20, 2),
    inception_date DATE,
    
    -- 管理信息
    fund_manager VARCHAR(200),
    fund_company VARCHAR(200),
    
    -- 投资限制
    min_investment DECIMAL(20, 2),
    min_redemption DECIMAL(20, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fund_details_asset ON finapp.fund_details(asset_id);
CREATE INDEX idx_fund_details_type ON finapp.fund_details(fund_type);

COMMENT ON TABLE finapp.fund_details IS '基金详情表';
COMMENT ON COLUMN finapp.fund_details.fund_type IS '基金类型: equity, bond, hybrid, money_market, index';
COMMENT ON COLUMN finapp.fund_details.nav IS '最新净值';

-- 3. 债券详情表
CREATE TABLE IF NOT EXISTS finapp.bond_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 债券类型
    bond_type VARCHAR(50) NOT NULL,
    credit_rating VARCHAR(10),
    
    -- 票面信息
    face_value DECIMAL(20, 2) NOT NULL,
    coupon_rate DECIMAL(5, 2) NOT NULL,
    coupon_frequency VARCHAR(20),
    
    -- 期限信息
    issue_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    years_to_maturity DECIMAL(5, 2),
    
    -- 收益率
    yield_to_maturity DECIMAL(5, 2),
    current_yield DECIMAL(5, 2),
    
    -- 发行信息
    issuer VARCHAR(200),
    issue_price DECIMAL(20, 2),
    issue_size DECIMAL(20, 2),
    
    -- 赎回条款
    callable BOOLEAN DEFAULT false,
    call_date DATE,
    call_price DECIMAL(20, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bond_details_asset ON finapp.bond_details(asset_id);
CREATE INDEX idx_bond_details_type ON finapp.bond_details(bond_type);
CREATE INDEX idx_bond_details_maturity ON finapp.bond_details(maturity_date);

COMMENT ON TABLE finapp.bond_details IS '债券详情表';
COMMENT ON COLUMN finapp.bond_details.bond_type IS '债券类型: government, corporate, municipal, convertible';
COMMENT ON COLUMN finapp.bond_details.coupon_rate IS '票面利率 (%)';

-- 4. 期货详情表
CREATE TABLE IF NOT EXISTS finapp.futures_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 期货类型
    futures_type VARCHAR(50) NOT NULL,
    underlying_asset VARCHAR(200),
    
    -- 合约信息
    contract_month VARCHAR(10) NOT NULL,
    contract_size DECIMAL(20, 4),
    tick_size DECIMAL(20, 8),
    tick_value DECIMAL(20, 2),
    
    -- 交易信息
    trading_hours VARCHAR(100),
    last_trading_date DATE,
    delivery_date DATE,
    delivery_method VARCHAR(50),
    
    -- 保证金
    initial_margin DECIMAL(20, 2),
    maintenance_margin DECIMAL(20, 2),
    margin_rate DECIMAL(5, 2),
    
    -- 限制
    position_limit INTEGER,
    daily_price_limit DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_futures_details_asset ON finapp.futures_details(asset_id);
CREATE INDEX idx_futures_details_type ON finapp.futures_details(futures_type);
CREATE INDEX idx_futures_details_month ON finapp.futures_details(contract_month);

COMMENT ON TABLE finapp.futures_details IS '期货详情表';
COMMENT ON COLUMN finapp.futures_details.futures_type IS '期货类型: commodity, financial, index, currency';
COMMENT ON COLUMN finapp.futures_details.contract_month IS '合约月份 (YYYYMM)';

-- 5. 理财产品详情表
CREATE TABLE IF NOT EXISTS finapp.wealth_product_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 产品类型
    product_type VARCHAR(50) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    
    -- 收益信息
    expected_return DECIMAL(5, 2),
    min_return DECIMAL(5, 2),
    max_return DECIMAL(5, 2),
    return_type VARCHAR(20),
    
    -- 期限信息
    issue_date DATE NOT NULL,
    start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    lock_period INTEGER,
    
    -- 投资限制
    min_investment DECIMAL(20, 2),
    max_investment DECIMAL(20, 2),
    investment_increment DECIMAL(20, 2),
    
    -- 发行信息
    issuer VARCHAR(200),
    product_code VARCHAR(50),
    
    -- 赎回条款
    early_redemption BOOLEAN DEFAULT false,
    redemption_fee DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wealth_details_asset ON finapp.wealth_product_details(asset_id);
CREATE INDEX idx_wealth_details_type ON finapp.wealth_product_details(product_type);
CREATE INDEX idx_wealth_details_risk ON finapp.wealth_product_details(risk_level);

COMMENT ON TABLE finapp.wealth_product_details IS '理财产品详情表';
COMMENT ON COLUMN finapp.wealth_product_details.product_type IS '产品类型: fixed_income, floating, structured';
COMMENT ON COLUMN finapp.wealth_product_details.risk_level IS '风险等级: R1, R2, R3, R4, R5';

-- 6. 国债详情表
CREATE TABLE IF NOT EXISTS finapp.treasury_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 国债类型
    treasury_type VARCHAR(50) NOT NULL,
    term_type VARCHAR(20),
    
    -- 票面信息
    face_value DECIMAL(20, 2) NOT NULL,
    coupon_rate DECIMAL(5, 2) NOT NULL,
    coupon_frequency VARCHAR(20),
    
    -- 期限信息
    issue_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    term_years INTEGER,
    
    -- 发行信息
    issue_price DECIMAL(20, 2),
    issue_number VARCHAR(50),
    
    -- 收益信息
    yield_to_maturity DECIMAL(5, 2),
    
    -- 交易信息
    tradable BOOLEAN DEFAULT true,
    min_holding_period INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treasury_details_asset ON finapp.treasury_details(asset_id);
CREATE INDEX idx_treasury_details_type ON finapp.treasury_details(treasury_type);
CREATE INDEX idx_treasury_details_maturity ON finapp.treasury_details(maturity_date);

COMMENT ON TABLE finapp.treasury_details IS '国债详情表';
COMMENT ON COLUMN finapp.treasury_details.treasury_type IS '国债类型: savings, book_entry, certificate';
COMMENT ON COLUMN finapp.treasury_details.term_type IS '期限类型: short_term, medium_term, long_term';

-- 7. 添加资产类型（如果不存在）
INSERT INTO finapp.asset_types (code, name, category, description)
VALUES 
  ('FUND', '基金', 'fund', '包括股票型、债券型、混合型等基金'),
  ('BOND', '债券', 'bond', '包括企业债、政府债等'),
  ('FUTURES', '期货', 'futures', '商品期货、金融期货等'),
  ('WEALTH', '理财产品', 'wealth', '银行理财、券商理财等'),
  ('TREASURY', '国债', 'treasury', '国家发行的债券')
ON CONFLICT (code) DO NOTHING;

-- 8. 创建视图：完整资产信息
CREATE OR REPLACE VIEW finapp.v_assets_full AS
SELECT 
  a.*,
  at.name as asset_type_name,
  at.code as asset_type_code,
  m.name as market_name,
  
  -- 股票详情
  sd.sector,
  sd.industry,
  sd.market_cap,
  sd.pe_ratio,
  sd.pb_ratio,
  sd.dividend_yield,
  
  -- 基金详情
  fd.fund_type,
  fd.management_fee,
  fd.nav,
  fd.nav_date,
  
  -- 债券详情
  bd.bond_type,
  bd.coupon_rate as bond_coupon_rate,
  bd.maturity_date as bond_maturity_date,
  
  -- 期货详情
  ftd.futures_type,
  ftd.contract_month,
  ftd.initial_margin,
  
  -- 理财产品详情
  wpd.product_type as wealth_product_type,
  wpd.expected_return,
  wpd.maturity_date as wealth_maturity_date,
  
  -- 国债详情
  td.treasury_type,
  td.coupon_rate as treasury_coupon_rate,
  td.maturity_date as treasury_maturity_date

FROM finapp.assets a
LEFT JOIN finapp.asset_types at ON a.asset_type_id = at.id
LEFT JOIN finapp.markets m ON a.market_id = m.id
LEFT JOIN finapp.stock_details sd ON a.id = sd.asset_id
LEFT JOIN finapp.fund_details fd ON a.id = fd.asset_id
LEFT JOIN finapp.bond_details bd ON a.id = bd.asset_id
LEFT JOIN finapp.futures_details ftd ON a.id = ftd.asset_id
LEFT JOIN finapp.wealth_product_details wpd ON a.id = wpd.asset_id
LEFT JOIN finapp.treasury_details td ON a.id = td.asset_id;

COMMENT ON VIEW finapp.v_assets_full IS '完整资产信息视图，包含所有类型的详情';

-- 9. 迁移现有股票数据
INSERT INTO finapp.stock_details (asset_id, sector, industry)
SELECT 
  a.id,
  a.sector,
  a.industry
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
WHERE at.code = 'STOCK'
  AND (a.sector IS NOT NULL OR a.industry IS NOT NULL)
ON CONFLICT (asset_id) DO NOTHING;

-- 10. 创建更新触发器
CREATE OR REPLACE FUNCTION finapp.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stock_details_updated_at BEFORE UPDATE ON finapp.stock_details
    FOR EACH ROW EXECUTE FUNCTION finapp.update_updated_at_column();

CREATE TRIGGER update_fund_details_updated_at BEFORE UPDATE ON finapp.fund_details
    FOR EACH ROW EXECUTE FUNCTION finapp.update_updated_at_column();

CREATE TRIGGER update_bond_details_updated_at BEFORE UPDATE ON finapp.bond_details
    FOR EACH ROW EXECUTE FUNCTION finapp.update_updated_at_column();

CREATE TRIGGER update_futures_details_updated_at BEFORE UPDATE ON finapp.futures_details
    FOR EACH ROW EXECUTE FUNCTION finapp.update_updated_at_column();

CREATE TRIGGER update_wealth_product_details_updated_at BEFORE UPDATE ON finapp.wealth_product_details
    FOR EACH ROW EXECUTE FUNCTION finapp.update_updated_at_column();

CREATE TRIGGER update_treasury_details_updated_at BEFORE UPDATE ON finapp.treasury_details
    FOR EACH ROW EXECUTE FUNCTION finapp.update_updated_at_column();

-- 完成
SELECT 'Multi-asset type architecture migration completed successfully!' as status;
