-- FinApp Database Seed Data - Test Data (Corrected Version)
-- Migration: 002_seed_data
-- Description: Insert test data matching actual table structure

\echo 'Inserting corrected test data...';

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
    INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, timezone, language, currency_preference, is_active, is_verified)
    VALUES (test_user_id, 'testuser', 'test@finapp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/goZ4Whq', '测试', '用户', '+86-13800138000', 'Asia/Shanghai', 'zh-CN', 'CNY', true, true)
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert demo user
    demo_user_id := gen_random_uuid();
    INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, timezone, language, currency_preference, is_active, is_verified)
    VALUES (demo_user_id, 'demouser', 'demo@finapp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/goZ4Whq', '演示', '用户', '+86-13900139000', 'Asia/Shanghai', 'zh-CN', 'CNY', true, true)
    ON CONFLICT (email) DO NOTHING;
    
    -- Get actual user IDs (in case of conflict)
    SELECT id INTO test_user_id FROM users WHERE email = 'test@finapp.com';
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@finapp.com';
    
    -- Assign roles to users
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES 
        (test_user_id, user_role_id, test_user_id),
        (demo_user_id, user_role_id, test_user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Test users created: test_user_id=%, demo_user_id=%', test_user_id, demo_user_id;
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
    
    -- Insert portfolios (using actual column names)
    test_portfolio_id := gen_random_uuid();
    us_portfolio_id := gen_random_uuid();
    demo_portfolio_id := gen_random_uuid();
    
    INSERT INTO portfolios (id, user_id, name, description, base_currency, is_default, is_active)
    VALUES 
        (test_portfolio_id, test_user_id, '我的A股投资组合', '主要投资A股市场的蓝筹股和成长股', 'CNY', true, true),
        (us_portfolio_id, test_user_id, '美股科技组合', '专注于美股科技股投资', 'USD', false, true),
        (demo_portfolio_id, demo_user_id, '演示投资组合', '用于演示的投资组合', 'CNY', true, true)
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

-- Insert sample positions and transactions
DO $$
DECLARE
    test_user_id UUID;
    test_portfolio_id UUID;
    us_portfolio_id UUID;
    test_account_id UUID;
    us_account_id UUID;
    aapl_asset_id UUID;
    tsla_asset_id UUID;
    ping_an_asset_id UUID;
    position_id UUID;
    transaction_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO test_user_id FROM users WHERE email = 'test@finapp.com';
    SELECT id INTO test_portfolio_id FROM portfolios WHERE user_id = test_user_id AND name = '我的A股投资组合';
    SELECT id INTO us_portfolio_id FROM portfolios WHERE user_id = test_user_id AND name = '美股科技组合';
    SELECT id INTO test_account_id FROM trading_accounts WHERE portfolio_id = test_portfolio_id;
    SELECT id INTO us_account_id FROM trading_accounts WHERE portfolio_id = us_portfolio_id;
    SELECT id INTO aapl_asset_id FROM assets WHERE symbol = 'AAPL';
    SELECT id INTO tsla_asset_id FROM assets WHERE symbol = 'TSLA';
    SELECT id INTO ping_an_asset_id FROM assets WHERE symbol = '000001';
    
    -- Insert sample positions
    IF aapl_asset_id IS NOT NULL AND us_portfolio_id IS NOT NULL THEN
        position_id := gen_random_uuid();
        INSERT INTO positions (id, portfolio_id, asset_id, quantity, average_cost, current_price, currency)
        VALUES (position_id, us_portfolio_id, aapl_asset_id, 100, 175.50, 180.45, 'USD')
        ON CONFLICT DO NOTHING;
        
        -- Insert buy transaction for AAPL
        transaction_id := gen_random_uuid();
        INSERT INTO transactions (id, portfolio_id, trading_account_id, asset_id, transaction_type, quantity, price, total_amount, currency, transaction_date, notes)
        VALUES (transaction_id, us_portfolio_id, us_account_id, aapl_asset_id, 'buy', 100, 175.50, 17550.00, 'USD', CURRENT_DATE - INTERVAL '30 days', '买入苹果股票')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF tsla_asset_id IS NOT NULL AND us_portfolio_id IS NOT NULL THEN
        position_id := gen_random_uuid();
        INSERT INTO positions (id, portfolio_id, asset_id, quantity, average_cost, current_price, currency)
        VALUES (position_id, us_portfolio_id, tsla_asset_id, 50, 245.80, 259.75, 'USD')
        ON CONFLICT DO NOTHING;
        
        -- Insert buy transaction for TSLA
        transaction_id := gen_random_uuid();
        INSERT INTO transactions (id, portfolio_id, trading_account_id, asset_id, transaction_type, quantity, price, total_amount, currency, transaction_date, notes)
        VALUES (transaction_id, us_portfolio_id, us_account_id, tsla_asset_id, 'buy', 50, 245.80, 12290.00, 'USD', CURRENT_DATE - INTERVAL '20 days', '买入特斯拉股票')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF ping_an_asset_id IS NOT NULL AND test_portfolio_id IS NOT NULL THEN
        position_id := gen_random_uuid();
        INSERT INTO positions (id, portfolio_id, asset_id, quantity, average_cost, current_price, currency)
        VALUES (position_id, test_portfolio_id, ping_an_asset_id, 1000, 12.30, 13.22, 'CNY')
        ON CONFLICT DO NOTHING;
        
        -- Insert buy transaction for 平安银行
        transaction_id := gen_random_uuid();
        INSERT INTO transactions (id, portfolio_id, trading_account_id, asset_id, transaction_type, quantity, price, total_amount, currency, transaction_date, notes)
        VALUES (transaction_id, test_portfolio_id, test_account_id, ping_an_asset_id, 'buy', 1000, 12.30, 12300.00, 'CNY', CURRENT_DATE - INTERVAL '15 days', '买入平安银行股票')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Sample positions and transactions created successfully';
END $$;

-- Insert exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, rate_date)
VALUES 
    ('USD', 'CNY', 7.2500, CURRENT_DATE),
    ('CNY', 'USD', 0.1379, CURRENT_DATE),
    ('HKD', 'CNY', 0.9280, CURRENT_DATE),
    ('CNY', 'HKD', 1.0776, CURRENT_DATE),
    ('USD', 'HKD', 7.8000, CURRENT_DATE),
    ('HKD', 'USD', 0.1282, CURRENT_DATE)
ON CONFLICT (from_currency, to_currency, rate_date) DO UPDATE SET
    rate = EXCLUDED.rate,
    updated_at = CURRENT_TIMESTAMP;

\echo 'Corrected test data inserted successfully!';