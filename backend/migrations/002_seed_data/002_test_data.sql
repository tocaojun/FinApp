-- FinApp Database Seed Data - Test Data
-- Migration: 002_test_data.sql
-- Description: Insert test data for development and testing

\echo 'Inserting test data...'

-- Create test users
DO $$
DECLARE
    admin_role_id UUID;
    user_role_id UUID;
    viewer_role_id UUID;
    test_user_id UUID;
    demo_user_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO user_role_id FROM roles WHERE name = 'user';
    SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';

    -- Insert test users
    INSERT INTO users (email, username, password_hash, first_name, last_name, is_active, is_verified, email_verified_at)
    VALUES 
        ('admin@finapp.com', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaQJqO5B8NvL4tebw2oP4.6nu', '管理员', '用户', true, true, CURRENT_TIMESTAMP),
        ('test@finapp.com', 'testuser', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaQJqO5B8NvL4tebw2oP4.6nu', '测试', '用户', true, true, CURRENT_TIMESTAMP),
        ('demo@finapp.com', 'demouser', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaQJqO5B8NvL4tebw2oP4.6nu', '演示', '用户', true, true, CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO NOTHING
    RETURNING id;

    -- Get user IDs
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@finapp.com';
    SELECT id INTO test_user_id FROM users WHERE email = 'test@finapp.com';
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@finapp.com';

    -- Assign roles to users
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES 
        (admin_user_id, admin_role_id, admin_user_id),
        (test_user_id, user_role_id, admin_user_id),
        (demo_user_id, user_role_id, admin_user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Create test portfolios
    INSERT INTO portfolios (user_id, name, description, base_currency, is_default)
    VALUES 
        (test_user_id, '主投资组合', '我的主要投资组合', 'CNY', true),
        (test_user_id, '美股投资组合', '专门投资美股的组合', 'USD', false),
        (demo_user_id, '演示投资组合', '演示用投资组合', 'CNY', true)
    ON CONFLICT (user_id, name) DO NOTHING;

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

END $$;

-- Insert sample trading accounts and transactions
DO $$
DECLARE
    test_portfolio_id UUID;
    demo_portfolio_id UUID;
    us_portfolio_id UUID;
    test_account_id UUID;
    demo_account_id UUID;
    us_account_id UUID;
    aapl_asset_id UUID;
    tsla_asset_id UUID;
    pinganbk_asset_id UUID;
    etf300_asset_id UUID;
    high_liquidity_tag_id UUID;
BEGIN
    -- Get portfolio IDs
    SELECT p.id INTO test_portfolio_id 
    FROM portfolios p 
    JOIN users u ON p.user_id = u.id 
    WHERE u.email = 'test@finapp.com' AND p.name = '主投资组合';
    
    SELECT p.id INTO us_portfolio_id 
    FROM portfolios p 
    JOIN users u ON p.user_id = u.id 
    WHERE u.email = 'test@finapp.com' AND p.name = '美股投资组合';
    
    SELECT p.id INTO demo_portfolio_id 
    FROM portfolios p 
    JOIN users u ON p.user_id = u.id 
    WHERE u.email = 'demo@finapp.com' AND p.name = '演示投资组合';

    -- Get asset IDs
    SELECT id INTO aapl_asset_id FROM assets WHERE symbol = 'AAPL';
    SELECT id INTO tsla_asset_id FROM assets WHERE symbol = 'TSLA';
    SELECT id INTO pinganbk_asset_id FROM assets WHERE symbol = '000001';
    SELECT id INTO etf300_asset_id FROM assets WHERE symbol = '510300';
    
    -- Get liquidity tag ID
    SELECT id INTO high_liquidity_tag_id FROM liquidity_tags WHERE name = '高流动性';

    -- Insert trading accounts
    INSERT INTO trading_accounts (portfolio_id, name, account_type, broker_name, currency, initial_balance, current_balance)
    VALUES 
        (test_portfolio_id, 'A股账户', 'broker', '华泰证券', 'CNY', 100000.00, 95000.00),
        (us_portfolio_id, '美股账户', 'broker', '富途证券', 'USD', 15000.00, 14200.00),
        (demo_portfolio_id, '演示账户', 'broker', '演示券商', 'CNY', 50000.00, 48000.00)
    ON CONFLICT DO NOTHING
    RETURNING id;

    -- Get account IDs
    SELECT ta.id INTO test_account_id 
    FROM trading_accounts ta 
    WHERE ta.portfolio_id = test_portfolio_id AND ta.name = 'A股账户';
    
    SELECT ta.id INTO us_account_id 
    FROM trading_accounts ta 
    WHERE ta.portfolio_id = us_portfolio_id AND ta.name = '美股账户';
    
    SELECT ta.id INTO demo_account_id 
    FROM trading_accounts ta 
    WHERE ta.portfolio_id = demo_portfolio_id AND ta.name = '演示账户';

    -- Insert sample transactions
    INSERT INTO transactions (portfolio_id, trading_account_id, asset_id, transaction_type, quantity, price, total_amount, fees, currency, transaction_date, liquidity_tag_id, notes)
    VALUES 
        -- Test user A股交易
        (test_portfolio_id, test_account_id, pinganbk_asset_id, 'buy', 1000, 12.50, 12500.00, 5.00, 'CNY', '2024-01-15', high_liquidity_tag_id, '建仓平安银行'),
        (test_portfolio_id, test_account_id, etf300_asset_id, 'buy', 2000, 4.20, 8400.00, 3.00, 'CNY', '2024-01-20', high_liquidity_tag_id, '购买沪深300ETF'),
        
        -- Test user 美股交易
        (us_portfolio_id, us_account_id, aapl_asset_id, 'buy', 10, 150.00, 1500.00, 1.00, 'USD', '2024-01-10', high_liquidity_tag_id, '购买苹果股票'),
        (us_portfolio_id, us_account_id, tsla_asset_id, 'buy', 5, 200.00, 1000.00, 1.00, 'USD', '2024-01-25', high_liquidity_tag_id, '购买特斯拉股票'),
        
        -- Demo user 交易
        (demo_portfolio_id, demo_account_id, pinganbk_asset_id, 'buy', 500, 12.80, 6400.00, 3.00, 'CNY', '2024-02-01', high_liquidity_tag_id, '演示交易')
    ON CONFLICT DO NOTHING;

    -- Insert corresponding positions
    INSERT INTO positions (portfolio_id, trading_account_id, asset_id, quantity, average_cost, total_cost, currency, first_purchase_date, last_transaction_date)
    VALUES 
        (test_portfolio_id, test_account_id, pinganbk_asset_id, 1000, 12.505, 12505.00, 'CNY', '2024-01-15', '2024-01-15'),
        (test_portfolio_id, test_account_id, etf300_asset_id, 2000, 4.2015, 8403.00, 'CNY', '2024-01-20', '2024-01-20'),
        (us_portfolio_id, us_account_id, aapl_asset_id, 10, 150.10, 1501.00, 'USD', '2024-01-10', '2024-01-10'),
        (us_portfolio_id, us_account_id, tsla_asset_id, 5, 200.20, 1001.00, 'USD', '2024-01-25', '2024-01-25'),
        (demo_portfolio_id, demo_account_id, pinganbk_asset_id, 500, 12.806, 6403.00, 'CNY', '2024-02-01', '2024-02-01')
    ON CONFLICT (portfolio_id, trading_account_id, asset_id) DO NOTHING;

    -- Insert sample cash flows for IRR calculation
    INSERT INTO cash_flows (portfolio_id, trading_account_id, flow_type, amount, currency, flow_date, description)
    VALUES 
        (test_portfolio_id, test_account_id, 'inflow', 100000.00, 'CNY', '2024-01-01', '初始资金投入'),
        (test_portfolio_id, test_account_id, 'outflow', 12505.00, 'CNY', '2024-01-15', '购买平安银行'),
        (test_portfolio_id, test_account_id, 'outflow', 8403.00, 'CNY', '2024-01-20', '购买沪深300ETF'),
        (us_portfolio_id, us_account_id, 'inflow', 15000.00, 'USD', '2024-01-01', '初始资金投入'),
        (us_portfolio_id, us_account_id, 'outflow', 1501.00, 'USD', '2024-01-10', '购买苹果股票'),
        (us_portfolio_id, us_account_id, 'outflow', 1001.00, 'USD', '2024-01-25', '购买特斯拉股票')
    ON CONFLICT DO NOTHING;

END $$;

-- Insert sample asset prices
INSERT INTO asset_prices (asset_id, price_date, close_price, currency, data_source)
SELECT 
    a.id,
    CURRENT_DATE,
    CASE 
        WHEN a.symbol = 'AAPL' THEN 175.43
        WHEN a.symbol = 'TSLA' THEN 248.50
        WHEN a.symbol = '000001' THEN 13.20
        WHEN a.symbol = '510300' THEN 4.35
        ELSE 100.00
    END,
    a.currency,
    'test_data'
FROM assets a
WHERE a.symbol IN ('AAPL', 'TSLA', '000001', '510300')
ON CONFLICT (asset_id, price_date) DO NOTHING;

\echo 'Test data inserted successfully!';