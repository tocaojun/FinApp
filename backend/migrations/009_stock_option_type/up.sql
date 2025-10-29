-- ============================================
-- 股票期权资产类型
-- Migration: 009_stock_option_type
-- Description: 添加股票期权资产类型和详情表
-- ============================================

-- 1. 创建股票期权详情表
CREATE TABLE IF NOT EXISTS finapp.stock_option_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 标的股票信息
    underlying_stock_id UUID REFERENCES finapp.assets(id),
    underlying_stock_symbol VARCHAR(50),
    underlying_stock_name VARCHAR(200),
    
    -- 期权基本信息
    option_type VARCHAR(10) NOT NULL CHECK (option_type IN ('CALL', 'PUT')),
    strike_price DECIMAL(20, 8) NOT NULL,
    expiration_date DATE NOT NULL,
    
    -- 合约信息
    contract_size INTEGER DEFAULT 100,
    exercise_style VARCHAR(20) DEFAULT 'AMERICAN' CHECK (exercise_style IN ('AMERICAN', 'EUROPEAN', 'BERMUDA')),
    settlement_type VARCHAR(20) DEFAULT 'PHYSICAL' CHECK (settlement_type IN ('PHYSICAL', 'CASH')),
    
    -- 交易信息
    multiplier DECIMAL(10, 4) DEFAULT 1.0,
    trading_unit VARCHAR(20) DEFAULT '手',
    min_price_change DECIMAL(20, 8),
    
    -- 保证金和费用
    margin_requirement DECIMAL(20, 2),
    commission_rate DECIMAL(5, 4),
    
    -- 希腊字母（Greeks）- 风险指标
    delta DECIMAL(10, 6),
    gamma DECIMAL(10, 6),
    theta DECIMAL(10, 6),
    vega DECIMAL(10, 6),
    rho DECIMAL(10, 6),
    
    -- 波动率
    implied_volatility DECIMAL(10, 6),
    historical_volatility DECIMAL(10, 6),
    
    -- 定价相关
    premium_currency VARCHAR(10) DEFAULT 'CNY',
    intrinsic_value DECIMAL(20, 8),
    time_value DECIMAL(20, 8),
    
    -- 成本计算公式：行权价格 / 3.5
    cost_divisor DECIMAL(10, 2) DEFAULT 3.5,
    
    -- 备注
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_stock_option_details_asset ON finapp.stock_option_details(asset_id);
CREATE INDEX idx_stock_option_details_underlying ON finapp.stock_option_details(underlying_stock_id);
CREATE INDEX idx_stock_option_details_expiration ON finapp.stock_option_details(expiration_date);
CREATE INDEX idx_stock_option_details_strike ON finapp.stock_option_details(strike_price);
CREATE INDEX idx_stock_option_details_type ON finapp.stock_option_details(option_type);

-- 添加注释
COMMENT ON TABLE finapp.stock_option_details IS '股票期权详情表 - 挂钩股票价格的期权产品';
COMMENT ON COLUMN finapp.stock_option_details.underlying_stock_id IS '标的股票ID（关联assets表）';
COMMENT ON COLUMN finapp.stock_option_details.underlying_stock_symbol IS '标的股票代码';
COMMENT ON COLUMN finapp.stock_option_details.option_type IS '期权类型：CALL（看涨）或 PUT（看跌）';
COMMENT ON COLUMN finapp.stock_option_details.strike_price IS '行权价格';
COMMENT ON COLUMN finapp.stock_option_details.expiration_date IS '到期日';
COMMENT ON COLUMN finapp.stock_option_details.exercise_style IS '行权方式：AMERICAN（美式）、EUROPEAN（欧式）、BERMUDA（百慕大式）';
COMMENT ON COLUMN finapp.stock_option_details.settlement_type IS '结算方式：PHYSICAL（实物交割）、CASH（现金结算）';
COMMENT ON COLUMN finapp.stock_option_details.delta IS 'Delta：期权价格对标的资产价格变化的敏感度';
COMMENT ON COLUMN finapp.stock_option_details.gamma IS 'Gamma：Delta对标的资产价格变化的敏感度';
COMMENT ON COLUMN finapp.stock_option_details.theta IS 'Theta：期权价格对时间流逝的敏感度';
COMMENT ON COLUMN finapp.stock_option_details.vega IS 'Vega：期权价格对波动率变化的敏感度';
COMMENT ON COLUMN finapp.stock_option_details.rho IS 'Rho：期权价格对利率变化的敏感度';
COMMENT ON COLUMN finapp.stock_option_details.cost_divisor IS '成本计算除数（默认3.5），成本 = 行权价格 / cost_divisor';
COMMENT ON COLUMN finapp.stock_option_details.intrinsic_value IS '内在价值 = MAX(0, 标的价格 - 行权价格) for CALL';
COMMENT ON COLUMN finapp.stock_option_details.time_value IS '时间价值 = 期权价格 - 内在价值';

-- 2. 创建更新时间触发器
CREATE TRIGGER update_stock_option_details_updated_at
    BEFORE UPDATE ON finapp.stock_option_details
    FOR EACH ROW
    EXECUTE FUNCTION finapp.update_updated_at_column();

-- 3. 添加股票期权资产类型
INSERT INTO finapp.asset_types (code, name, category, description, is_active)
VALUES ('STOCK_OPTION', '股票期权', 'DERIVATIVE', '挂钩股票价格的期权产品，成本=行权价/3.5，价值=标的价格-行权价', true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- 4. 创建计算成本的函数
CREATE OR REPLACE FUNCTION finapp.calculate_stock_option_cost(
    p_strike_price DECIMAL,
    p_cost_divisor DECIMAL DEFAULT 3.5
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN p_strike_price / p_cost_divisor;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION finapp.calculate_stock_option_cost IS '计算股票期权成本：行权价格 / 除数（默认3.5）';

-- 5. 创建计算价值的函数
CREATE OR REPLACE FUNCTION finapp.calculate_stock_option_value(
    p_option_type VARCHAR,
    p_underlying_price DECIMAL,
    p_strike_price DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    IF p_option_type = 'CALL' THEN
        RETURN GREATEST(0, p_underlying_price - p_strike_price);
    ELSIF p_option_type = 'PUT' THEN
        RETURN GREATEST(0, p_strike_price - p_underlying_price);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION finapp.calculate_stock_option_value IS '计算股票期权价值：CALL = MAX(0, 标的价格 - 行权价)，PUT = MAX(0, 行权价 - 标的价格)';

-- 6. 创建视图：股票期权完整信息
CREATE OR REPLACE VIEW finapp.v_stock_options_full AS
SELECT 
    a.id,
    a.symbol,
    a.name,
    a.asset_type_id,
    a.market_id,
    a.currency,
    a.is_active,
    a.description,
    a.created_at,
    a.updated_at,
    
    -- 股票期权详情
    sod.underlying_stock_id,
    sod.underlying_stock_symbol,
    sod.underlying_stock_name,
    sod.option_type,
    sod.strike_price,
    sod.expiration_date,
    sod.contract_size,
    sod.exercise_style,
    sod.settlement_type,
    sod.multiplier,
    sod.trading_unit,
    sod.margin_requirement,
    sod.delta,
    sod.gamma,
    sod.theta,
    sod.vega,
    sod.rho,
    sod.implied_volatility,
    sod.cost_divisor,
    
    -- 计算字段
    finapp.calculate_stock_option_cost(sod.strike_price, sod.cost_divisor) as calculated_cost,
    
    -- 标的股票当前价格（从最新价格表获取）
    (SELECT close_price 
     FROM finapp.asset_prices 
     WHERE asset_id = sod.underlying_stock_id 
     ORDER BY price_date DESC 
     LIMIT 1) as underlying_current_price,
    
    -- 计算当前价值
    finapp.calculate_stock_option_value(
        sod.option_type,
        (SELECT close_price 
         FROM finapp.asset_prices 
         WHERE asset_id = sod.underlying_stock_id 
         ORDER BY price_date DESC 
         LIMIT 1),
        sod.strike_price
    ) as calculated_value,
    
    -- 到期天数
    (sod.expiration_date - CURRENT_DATE) as days_to_expiration,
    
    -- 是否价内
    CASE 
        WHEN sod.option_type = 'CALL' THEN
            (SELECT close_price FROM finapp.asset_prices 
             WHERE asset_id = sod.underlying_stock_id 
             ORDER BY price_date DESC LIMIT 1) > sod.strike_price
        WHEN sod.option_type = 'PUT' THEN
            (SELECT close_price FROM finapp.asset_prices 
             WHERE asset_id = sod.underlying_stock_id 
             ORDER BY price_date DESC LIMIT 1) < sod.strike_price
        ELSE false
    END as is_in_the_money

FROM finapp.assets a
INNER JOIN finapp.stock_option_details sod ON a.id = sod.asset_id
WHERE a.asset_type_id = (SELECT id FROM finapp.asset_types WHERE code = 'STOCK_OPTION');

COMMENT ON VIEW finapp.v_stock_options_full IS '股票期权完整信息视图，包含计算字段（成本、价值、到期天数等）';

-- 7. 创建示例数据（可选）
-- 假设已有股票 000001.SZ（平安银行）
DO $$
DECLARE
    v_stock_option_type_id UUID;
    v_underlying_stock_id UUID;
    v_market_id UUID;
    v_liquidity_tag_id UUID;
    v_stock_option_id UUID;
BEGIN
    -- 获取股票期权类型ID
    SELECT id INTO v_stock_option_type_id 
    FROM finapp.asset_types 
    WHERE code = 'STOCK_OPTION';
    
    -- 获取标的股票ID（平安银行）
    SELECT id INTO v_underlying_stock_id 
    FROM finapp.assets 
    WHERE symbol = '000001.SZ' 
    LIMIT 1;
    
    -- 获取市场ID
    SELECT id INTO v_market_id 
    FROM finapp.markets 
    WHERE code = 'SZSE' 
    LIMIT 1;
    
    -- 获取流动性标签ID
    SELECT id INTO v_liquidity_tag_id 
    FROM finapp.liquidity_tags 
    WHERE tag_name = '高流动性' 
    LIMIT 1;
    
    -- 只有在找到标的股票时才创建示例
    IF v_underlying_stock_id IS NOT NULL AND v_stock_option_type_id IS NOT NULL THEN
        -- 创建股票期权资产
        INSERT INTO finapp.assets (
            symbol, name, asset_type_id, market_id, currency, 
            risk_level, liquidity_tag, is_active, description
        ) VALUES (
            '000001-C-15.50-20251231',
            '平安银行看涨期权-行权价15.50-2025年12月',
            v_stock_option_type_id,
            v_market_id,
            'CNY',
            'HIGH',
            v_liquidity_tag_id,
            true,
            '平安银行股票看涨期权，行权价15.50元，2025年12月31日到期'
        )
        RETURNING id INTO v_stock_option_id;
        
        -- 创建股票期权详情
        INSERT INTO finapp.stock_option_details (
            asset_id,
            underlying_stock_id,
            underlying_stock_symbol,
            underlying_stock_name,
            option_type,
            strike_price,
            expiration_date,
            contract_size,
            exercise_style,
            settlement_type,
            multiplier,
            trading_unit,
            margin_requirement,
            delta,
            gamma,
            theta,
            vega,
            rho,
            implied_volatility,
            cost_divisor,
            premium_currency
        ) VALUES (
            v_stock_option_id,
            v_underlying_stock_id,
            '000001.SZ',
            '平安银行',
            'CALL',
            15.50,
            '2025-12-31',
            10000,
            'AMERICAN',
            'PHYSICAL',
            1.0,
            '手',
            5000.00,
            0.65,
            0.05,
            -0.02,
            0.15,
            0.08,
            0.25,
            3.5,
            'CNY'
        );
        
        RAISE NOTICE '已创建示例股票期权: %', v_stock_option_id;
    ELSE
        RAISE NOTICE '未找到标的股票或股票期权类型，跳过示例数据创建';
    END IF;
END $$;

-- 8. 授权
GRANT SELECT, INSERT, UPDATE, DELETE ON finapp.stock_option_details TO finapp_user;
GRANT SELECT ON finapp.v_stock_options_full TO finapp_user;
GRANT EXECUTE ON FUNCTION finapp.calculate_stock_option_cost TO finapp_user;
GRANT EXECUTE ON FUNCTION finapp.calculate_stock_option_value TO finapp_user;
