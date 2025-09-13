-- FinApp Database Seed Data - Test Data (Fixed Version)
-- Migration: 002_seed_data
-- Description: Insert test data for development and testing

\echo 'Inserting test data...';

-- Insert test users
DO $$
DECLARE
    admin_role_id UUID;
    user_role_id UUID;
    test_user_id UUID;
    demo_user_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO user_role_id FROM roles WHERE name = 'user';
    
    -- Insert test user
    test_user_id := gen_random_uuid();
    INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, timezone, language, currency_preference, is_active, email_verified)
    VALUES (test_user_id, 'testuser', 'test@finapp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/goZ4Whq', '测试', '用户', '+86-13800138000', 'Asia/Shanghai', 'zh-CN', 'CNY', true, true)
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert demo user
    demo_user_id := gen_random_uuid();
    INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, timezone, language, currency_preference, is_active, email_verified)
    VALUES (demo_user_id, 'demouser', 'demo@finapp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/goZ4Whq', '演示', '用户', '+86-13900139000', 'Asia/Shanghai', 'zh-CN', 'CNY', true, true)
    ON CONFLICT (email) DO NOTHING;
    
    -- Get actual user IDs (in case of conflict)
    SELECT id INTO test_user_id FROM users WHERE email = 'test@finapp.com';
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@finapp.com';
    
    -- Assign roles to users
    INSERT INTO user_roles (user_id, role_id, granted_by)
    VALUES 
        (test_user_id, user_role_id, test_user_id),
        (demo_user_id, user_role_id, test_user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Test users created: test_user_id=%, demo_user_id=%', test_user_id, demo_user_id;
END $$;

-- Insert sample assets
DO $$
DECLARE
    stock_type_id UUID;
    etf_type_id UUID;
    sse_market_id UUID;
    nasdaq_market_id UUID;
    hkex_market_id UUID;
BEGIN
    -- Get asset type and market IDs
    SELECT id INTO stock_type_id FROM asset_types WHERE code = 'STOCK';
    SELECT id INTO etf_type_id FROM asset_types WHERE code = 'ETF';
    SELECT id INTO sse_market_id FROM markets WHERE code = 'SSE';
    SELECT id INTO nasdaq_market_id FROM markets WHERE code = 'NASDAQ';
    SELECT id INTO hkex_market_id FROM markets WHERE code = 'HKEX';

    -- Insert sample assets
    INSERT INTO assets (symbol, name, asset_type_id, market_id, currency, sector, industry, description)
    VALUES 
        -- A股
        ('000001', '平安银行', stock_type_id, sse_market_id, 'CNY', '金融', '银行', '中国平安银行股份有限公司'),
        ('000002', '万科A', stock_type_id, sse_market_id, 'CNY', '房地产', '房地产开发', '万科企业股份有限公司'),
        ('600036', '招商银行', stock_type_id, sse_market_id, 'CNY', '金融', '银行', '招商银行股份有限公司'),
        ('600519', '贵州茅台', stock_type_id, sse_market_id, 'CNY', '消费', '白酒', '贵州茅台酒股份有限公司'),
        
        -- 美股
        ('AAPL', 'Apple Inc.', stock_type_id, nasdaq_market_id, 'USD', '科技', '消费电子', '苹果公司'),
        ('MSFT', 'Microsoft Corporation', stock_type_id, nasdaq_market_id, 'USD', '科技', '软件', '微软公司'),
        ('GOOGL', 'Alphabet Inc.', stock_type_id, nasdaq_market_id, 'USD', '科技', '互联网', '谷歌母公司'),
        ('TSLA', 'Tesla, Inc.', stock_type_id, nasdaq_market_id, 'USD', '汽车', '电动汽车', '特斯拉公司'),
        
        -- 港股
        ('0700', '腾讯控股', stock_type_id, hkex_market_id, 'HKD', '科技', '互联网', '腾讯控股有限公司'),
        ('0941', '中国移动', stock_type_id, hkex_market_id, 'HKD', '通信', '电信运营', '中国移动有限公司'),
        
        -- ETF
        ('510300', '沪深300ETF', etf_type_id, sse_market_id, 'CNY', 'ETF', '指数基金', '华泰柏瑞沪深300ETF'),
        ('SPY', 'SPDR S&P 500 ETF', etf_type_id, nasdaq_market_id, 'USD', 'ETF', '指数基金', '标普500指数ETF')
    ON CONFLICT (symbol, market_id) DO NOTHING;

    RAISE NOTICE 'Sample assets inserted successfully';
END $$;

-- Insert test portfolios and trading accounts
DO $$
DECLARE
    test_user_id UUID;
    demo_user_id UUID;
    test_portfolio_id UUID;
    us_portfolio_id UUID;
    demo_portfolio_id UUID;
    test_account_id UUID;
    us_account_id UUID;
    demo_account_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO test_user_id FROM users WHERE email = 'test@finapp.com';
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@finapp.com';
    
    -- Insert portfolios
    test_portfolio_id := gen_random_uuid();
    us_portfolio_id := gen_random_uuid();
    demo_portfolio_id := gen_random_uuid();
    
    INSERT INTO portfolios (id, user_id, name, description, base_currency, risk_level, target_return, is_active)
    VALUES 
        (test_portfolio_id, test_user_id, '我的A股投资组合', '主要投资A股市场的蓝筹股和成长股', 'CNY', 'moderate', 0.12, true),
        (us_portfolio_id, test_user_id, '美股科技组合', '专注于美股科技股投资', 'USD', 'aggressive', 0.15, true),
        (demo_portfolio_id, demo_user_id, '演示投资组合', '用于演示的投资组合', 'CNY', 'conservative', 0.08, true)
    ON CONFLICT (user_id, name) DO NOTHING;
    
    -- Insert trading accounts
    test_account_id := gen_random_uuid();
    us_account_id := gen_random_uuid();
    demo_account_id := gen_random_uuid();
    
    INSERT INTO trading_accounts (id, portfolio_id, name, account_type, broker_name, currency, initial_balance, current_balance)
    VALUES
        (test_account_id, test_portfolio_id, 'A股账户', 'broker', '华泰证券', 'CNY', 100000.00, 95000.00),
        (us_account_id, us_portfolio_id, '美股账户', 'broker', '富途证券', 'USD', 15000.00, 14200.00),
        (demo_account_id, demo_portfolio_id, '演示账户', 'broker', '演示券商', 'CNY', 50000.00, 48000.00)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test portfolios and accounts created successfully';
END $$;

-- Insert sample asset prices
DO $$
DECLARE
    aapl_asset_id UUID;
    tsla_asset_id UUID;
    msft_asset_id UUID;
    ping_an_asset_id UUID;
BEGIN
    -- Get asset IDs
    SELECT id INTO aapl_asset_id FROM assets WHERE symbol = 'AAPL';
    SELECT id INTO tsla_asset_id FROM assets WHERE symbol = 'TSLA';
    SELECT id INTO msft_asset_id FROM assets WHERE symbol = 'MSFT';
    SELECT id INTO ping_an_asset_id FROM assets WHERE symbol = '000001';
    
    -- Insert recent price data
    INSERT INTO asset_prices (asset_id, price_date, open_price, high_price, low_price, close_price, volume, currency)
    VALUES 
        -- AAPL prices (last 5 days)
        (aapl_asset_id, CURRENT_DATE - INTERVAL '4 days', 175.00, 177.50, 174.20, 176.80, 45000000, 'USD'),
        (aapl_asset_id, CURRENT_DATE - INTERVAL '3 days', 176.80, 178.90, 175.60, 177.20, 42000000, 'USD'),
        (aapl_asset_id, CURRENT_DATE - INTERVAL '2 days', 177.20, 179.40, 176.80, 178.50, 38000000, 'USD'),
        (aapl_asset_id, CURRENT_DATE - INTERVAL '1 day', 178.50, 180.20, 177.90, 179.30, 41000000, 'USD'),
        (aapl_asset_id, CURRENT_DATE, 179.30, 181.00, 178.70, 180.45, 39000000, 'USD'),
        
        -- TSLA prices
        (tsla_asset_id, CURRENT_DATE - INTERVAL '4 days', 245.00, 250.20, 242.80, 248.60, 25000000, 'USD'),
        (tsla_asset_id, CURRENT_DATE - INTERVAL '3 days', 248.60, 252.40, 246.90, 250.80, 28000000, 'USD'),
        (tsla_asset_id, CURRENT_DATE - INTERVAL '2 days', 250.80, 255.60, 249.20, 253.40, 32000000, 'USD'),
        (tsla_asset_id, CURRENT_DATE - INTERVAL '1 day', 253.40, 258.90, 251.70, 256.20, 35000000, 'USD'),
        (tsla_asset_id, CURRENT_DATE, 256.20, 261.80, 254.50, 259.75, 31000000, 'USD'),
        
        -- 平安银行价格
        (ping_an_asset_id, CURRENT_DATE - INTERVAL '4 days', 12.50, 12.80, 12.35, 12.65, 15000000, 'CNY'),
        (ping_an_asset_id, CURRENT_DATE - INTERVAL '3 days', 12.65, 12.95, 12.50, 12.78, 18000000, 'CNY'),
        (ping_an_asset_id, CURRENT_DATE - INTERVAL '2 days', 12.78, 13.10, 12.60, 12.92, 22000000, 'CNY'),
        (ping_an_asset_id, CURRENT_DATE - INTERVAL '1 day', 12.92, 13.25, 12.80, 13.08, 19000000, 'CNY'),
        (ping_an_asset_id, CURRENT_DATE, 13.08, 13.40, 12.95, 13.22, 16000000, 'CNY')
    ON CONFLICT (asset_id, price_date) DO NOTHING;
    
    RAISE NOTICE 'Sample asset prices inserted successfully';
END $$;

\echo 'Test data inserted successfully!';