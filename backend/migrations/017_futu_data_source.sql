-- ================================================
-- 富途证券数据源集成
-- ================================================
-- 
-- 功能说明:
-- 1. 在 price_data_sources 表中注册富途证券数据源
-- 2. 更新 asset_prices 表以支持 price_source 字段
-- 3. 创建富途数据源的初始配置
--
-- 支持的金融产品:
-- - 股票 (STOCK): 港股、美股、A股
-- - ETF: 港股、美股、A股
-- - 期权 (OPTION): 港股、美股
-- - 期货 (FUTURE): 港股、美股、新加坡、日本
-- - 窝轮 (WARRANT): 港股
-- - 牛熊证 (CBBC): 港股
--
-- 市场覆盖:
-- - HK: 香港市场 (全产品支持)
-- - US: 美国市场 (股票、ETF、期权、期货)
-- - CN: 中国A股市场 (A股通股票、ETF)
-- - SG: 新加坡市场 (期货模拟)
-- - JP: 日本市场 (期货模拟)
-- ================================================

BEGIN;

-- ================================================
-- 第一步: 更新 asset_prices 表结构
-- ================================================

-- 检查 price_source 字段是否存在，如果不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'finapp' 
        AND table_name = 'asset_prices' 
        AND column_name = 'price_source'
    ) THEN
        ALTER TABLE finapp.asset_prices 
        ADD COLUMN price_source VARCHAR(100) DEFAULT 'MANUAL';
        
        COMMENT ON COLUMN finapp.asset_prices.price_source IS '价格数据来源: MANUAL(手动录入), YAHOO_FINANCE, EASTMONEY, TUSHARE, FUTU_API 等';
    END IF;
END $$;

-- 为已存在的数据设置默认的 price_source
UPDATE finapp.asset_prices 
SET price_source = COALESCE(data_source, 'MANUAL')
WHERE price_source IS NULL OR price_source = 'MANUAL';

-- 创建 price_source 索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_asset_prices_source 
ON finapp.asset_prices(price_source);

-- ================================================
-- 第二步: 在 price_data_sources 表中注册富途证券数据源
-- ================================================

-- 检查富途数据源是否已存在
DO $$
DECLARE
    v_futu_source_id UUID;
    v_stock_type_id UUID;
    v_etf_type_id UUID;
    v_option_type_id UUID;
    v_future_type_id UUID;
    v_warrant_type_id UUID;
BEGIN
    -- 检查是否已存在富途数据源
    SELECT id INTO v_futu_source_id
    FROM finapp.price_data_sources
    WHERE provider = 'futu' OR name = '富途证券';

    IF v_futu_source_id IS NULL THEN
        -- 插入富途证券数据源
        INSERT INTO finapp.price_data_sources (
            name,
            provider,
            api_endpoint,
            config,
            rate_limit,
            timeout_seconds,
            is_active,
            last_sync_status
        ) VALUES (
            '富途证券',
            'futu',
            'http://localhost:11111/api',
            jsonb_build_object(
                'description', '富途OpenAPI - 提供港股、美股、A股等多市场行情数据',
                'supports_products', ARRAY['STOCK', 'ETF', 'OPTION', 'FUTURE', 'WARRANT', 'CBBC'],
                'supports_markets', ARRAY['HK', 'US', 'CN', 'SG', 'JP'],
                'supports_countries', ARRAY['HK', 'US', 'CN', 'SG', 'JP'],
                'api_version', 'v9.4',
                'requires_opend', true,
                'opend_host', 'localhost',
                'opend_port', 11111,
                'enable_encryption', false,
                'max_kline_num', 1000,
                'default_rehab_type', 'FORWARD',
                'product_country_mapping', jsonb_build_object(
                    'STOCK', ARRAY['HK', 'US', 'CN'],
                    'ETF', ARRAY['HK', 'US', 'CN'],
                    'OPTION', ARRAY['HK', 'US'],
                    'FUTURE', ARRAY['HK', 'US', 'SG', 'JP'],
                    'WARRANT', ARRAY['HK'],
                    'CBBC', ARRAY['HK']
                ),
                'market_info', jsonb_build_object(
                    'HK', jsonb_build_object(
                        'name', '香港市场',
                        'timezone', 'Asia/Hong_Kong',
                        'currency', 'HKD',
                        'trading_hours', jsonb_build_object('open', '09:30', 'close', '16:00')
                    ),
                    'US', jsonb_build_object(
                        'name', '美国市场',
                        'timezone', 'America/New_York',
                        'currency', 'USD',
                        'trading_hours', jsonb_build_object('open', '09:30', 'close', '16:00')
                    ),
                    'CN', jsonb_build_object(
                        'name', '中国A股',
                        'timezone', 'Asia/Shanghai',
                        'currency', 'CNY',
                        'trading_hours', jsonb_build_object('open', '09:30', 'close', '15:00')
                    ),
                    'SG', jsonb_build_object(
                        'name', '新加坡市场',
                        'timezone', 'Asia/Singapore',
                        'currency', 'SGD',
                        'trading_hours', jsonb_build_object('open', '09:00', 'close', '17:00')
                    ),
                    'JP', jsonb_build_object(
                        'name', '日本市场',
                        'timezone', 'Asia/Tokyo',
                        'currency', 'JPY',
                        'trading_hours', jsonb_build_object('open', '09:00', 'close', '15:00')
                    )
                )
            ),
            60,  -- rate_limit: 每分钟60次请求
            30,  -- timeout_seconds: 30秒超时
            true, -- is_active
            'pending' -- last_sync_status
        )
        RETURNING id INTO v_futu_source_id;

        RAISE NOTICE '✅ 已创建富途证券数据源，ID: %', v_futu_source_id;
    ELSE
        RAISE NOTICE '⚠️  富途证券数据源已存在，ID: %', v_futu_source_id;
        
        -- 更新已存在的数据源配置
        UPDATE finapp.price_data_sources
        SET 
            config = jsonb_build_object(
                'description', '富途OpenAPI - 提供港股、美股、A股等多市场行情数据',
                'supports_products', ARRAY['STOCK', 'ETF', 'OPTION', 'FUTURE', 'WARRANT', 'CBBC'],
                'supports_markets', ARRAY['HK', 'US', 'CN', 'SG', 'JP'],
                'supports_countries', ARRAY['HK', 'US', 'CN', 'SG', 'JP'],
                'api_version', 'v9.4',
                'requires_opend', true,
                'opend_host', 'localhost',
                'opend_port', 11111,
                'enable_encryption', false,
                'max_kline_num', 1000,
                'default_rehab_type', 'FORWARD',
                'product_country_mapping', jsonb_build_object(
                    'STOCK', ARRAY['HK', 'US', 'CN'],
                    'ETF', ARRAY['HK', 'US', 'CN'],
                    'OPTION', ARRAY['HK', 'US'],
                    'FUTURE', ARRAY['HK', 'US', 'SG', 'JP'],
                    'WARRANT', ARRAY['HK'],
                    'CBBC', ARRAY['HK']
                ),
                'market_info', jsonb_build_object(
                    'HK', jsonb_build_object(
                        'name', '香港市场',
                        'timezone', 'Asia/Hong_Kong',
                        'currency', 'HKD',
                        'trading_hours', jsonb_build_object('open', '09:30', 'close', '16:00')
                    ),
                    'US', jsonb_build_object(
                        'name', '美国市场',
                        'timezone', 'America/New_York',
                        'currency', 'USD',
                        'trading_hours', jsonb_build_object('open', '09:30', 'close', '16:00')
                    ),
                    'CN', jsonb_build_object(
                        'name', '中国A股',
                        'timezone', 'Asia/Shanghai',
                        'currency', 'CNY',
                        'trading_hours', jsonb_build_object('open', '09:30', 'close', '15:00')
                    ),
                    'SG', jsonb_build_object(
                        'name', '新加坡市场',
                        'timezone', 'Asia/Singapore',
                        'currency', 'SGD',
                        'trading_hours', jsonb_build_object('open', '09:00', 'close', '17:00')
                    ),
                    'JP', jsonb_build_object(
                        'name', '日本市场',
                        'timezone', 'Asia/Tokyo',
                        'currency', 'JPY',
                        'trading_hours', jsonb_build_object('open', '09:00', 'close', '15:00')
                    )
                )
            ),
            api_endpoint = 'http://localhost:11111/api',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_futu_source_id;
        
        RAISE NOTICE '✅ 已更新富途证券数据源配置';
    END IF;

END $$;

-- ================================================
-- 第三步: 确保资产类型表中包含富途支持的类型
-- ================================================

-- 窝轮 (WARRANT)
INSERT INTO finapp.asset_types (code, name, category, description, location_dimension)
VALUES ('WARRANT', '窝轮', 'DERIVATIVES', '香港市场窝轮产品', 'market')
ON CONFLICT (code) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    location_dimension = EXCLUDED.location_dimension;

-- 牛熊证 (CBBC)
INSERT INTO finapp.asset_types (code, name, category, description, location_dimension)
VALUES ('CBBC', '牛熊证', 'DERIVATIVES', '香港市场牛熊证产品', 'market')
ON CONFLICT (code) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    location_dimension = EXCLUDED.location_dimension;

-- ================================================
-- 第四步: 创建富途数据源使用说明视图
-- ================================================

-- 创建或替换视图，展示富途数据源的配置信息
CREATE OR REPLACE VIEW finapp.v_futu_data_source_info AS
SELECT 
    ds.id,
    ds.name,
    ds.provider,
    ds.api_endpoint,
    ds.is_active,
    ds.last_sync_at,
    ds.last_sync_status,
    ds.config->>'description' as description,
    ds.config->>'api_version' as api_version,
    ds.config->'supports_products' as supported_products,
    ds.config->'supports_markets' as supported_markets,
    ds.config->'supports_countries' as supported_countries,
    ds.config->'product_country_mapping' as product_country_mapping,
    ds.config->'market_info' as market_info,
    ds.rate_limit,
    ds.timeout_seconds,
    ds.created_at,
    ds.updated_at
FROM finapp.price_data_sources ds
WHERE ds.provider = 'futu';

COMMENT ON VIEW finapp.v_futu_data_source_info IS '富途证券数据源配置信息视图';

-- ================================================
-- 第五步: 输出富途数据源的使用说明
-- ================================================

DO $$
DECLARE
    v_futu_id UUID;
BEGIN
    SELECT id INTO v_futu_id 
    FROM finapp.price_data_sources 
    WHERE provider = 'futu';
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '富途证券数据源已成功配置！';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '';
    RAISE NOTICE '数据源ID: %', v_futu_id;
    RAISE NOTICE '名称: 富途证券';
    RAISE NOTICE 'API端点: http://localhost:11111/api';
    RAISE NOTICE '';
    RAISE NOTICE '支持的金融产品:';
    RAISE NOTICE '  - STOCK (股票): 港股、美股、A股';
    RAISE NOTICE '  - ETF: 港股、美股、A股';
    RAISE NOTICE '  - OPTION (期权): 港股、美股';
    RAISE NOTICE '  - FUTURE (期货): 港股、美股、新加坡、日本';
    RAISE NOTICE '  - WARRANT (窝轮): 港股';
    RAISE NOTICE '  - CBBC (牛熊证): 港股';
    RAISE NOTICE '';
    RAISE NOTICE '支持的市场:';
    RAISE NOTICE '  - HK: 香港市场';
    RAISE NOTICE '  - US: 美国市场';
    RAISE NOTICE '  - CN: 中国A股市场';
    RAISE NOTICE '  - SG: 新加坡市场 (期货模拟)';
    RAISE NOTICE '  - JP: 日本市场 (期货模拟)';
    RAISE NOTICE '';
    RAISE NOTICE '使用前准备:';
    RAISE NOTICE '  1. 安装并启动富途OpenD程序';
    RAISE NOTICE '  2. 配置环境变量 FUTU_API_HOST 和 FUTU_API_PORT';
    RAISE NOTICE '  3. 确保OpenD运行在 localhost:11111';
    RAISE NOTICE '';
    RAISE NOTICE '查看详细配置:';
    RAISE NOTICE '  SELECT * FROM finapp.v_futu_data_source_info;';
    RAISE NOTICE '';
    RAISE NOTICE '====================================================';
END $$;

COMMIT;
