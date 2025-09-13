-- FinApp Database Seed Data - Test Data (Final Corrected Version)
-- Migration: 002_seed_data
-- Description: Insert test data matching exact table structure

\echo 'Inserting final corrected test data...';

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
    
    -- Insert sample positions (using correct column names)
    IF aapl_asset_id IS NOT NULL AND us_portfolio_id IS NOT NULL AND us_account_id IS NOT NULL THEN
        position_id := gen_random_uuid();
        INSERT INTO positions (id, portfolio_id, trading_account_id, asset_id, quantity, average_cost, total_cost, currency, first_purchase_date, last_transaction_date)
        VALUES (position_id, us_portfolio_id, us_account_id, aapl_asset_id, 100, 175.50, 17550.00, 'USD', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '30 days')
        ON CONFLICT (portfolio_id, trading_account_id, asset_id) DO NOTHING;
        
        -- Insert buy transaction for AAPL
        transaction_id := gen_random_uuid();
        INSERT INTO transactions (id, portfolio_id, trading_account_id, asset_id, transaction_type, quantity, price, total_amount, currency, transaction_date, notes)
        VALUES (transaction_id, us_portfolio_id, us_account_id, aapl_asset_id, 'buy', 100, 175.50, 17550.00, 'USD', CURRENT_DATE - INTERVAL '30 days', '买入苹果股票')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF tsla_asset_id IS NOT NULL AND us_portfolio_id IS NOT NULL AND us_account_id IS NOT NULL THEN
        position_id := gen_random_uuid();
        INSERT INTO positions (id, portfolio_id, trading_account_id, asset_id, quantity, average_cost, total_cost, currency, first_purchase_date, last_transaction_date)
        VALUES (position_id, us_portfolio_id, us_account_id, tsla_asset_id, 50, 245.80, 12290.00, 'USD', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '20 days')
        ON CONFLICT (portfolio_id, trading_account_id, asset_id) DO NOTHING;
        
        -- Insert buy transaction for TSLA
        transaction_id := gen_random_uuid();
        INSERT INTO transactions (id, portfolio_id, trading_account_id, asset_id, transaction_type, quantity, price, total_amount, currency, transaction_date, notes)
        VALUES (transaction_id, us_portfolio_id, us_account_id, tsla_asset_id, 'buy', 50, 245.80, 12290.00, 'USD', CURRENT_DATE - INTERVAL '20 days', '买入特斯拉股票')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF ping_an_asset_id IS NOT NULL AND test_portfolio_id IS NOT NULL AND test_account_id IS NOT NULL THEN
        position_id := gen_random_uuid();
        INSERT INTO positions (id, portfolio_id, trading_account_id, asset_id, quantity, average_cost, total_cost, currency, first_purchase_date, last_transaction_date)
        VALUES (position_id, test_portfolio_id, test_account_id, ping_an_asset_id, 1000, 12.30, 12300.00, 'CNY', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '15 days')
        ON CONFLICT (portfolio_id, trading_account_id, asset_id) DO NOTHING;
        
        -- Insert buy transaction for 平安银行
        transaction_id := gen_random_uuid();
        INSERT INTO transactions (id, portfolio_id, trading_account_id, asset_id, transaction_type, quantity, price, total_amount, currency, transaction_date, notes)
        VALUES (transaction_id, test_portfolio_id, test_account_id, ping_an_asset_id, 'buy', 1000, 12.30, 12300.00, 'CNY', CURRENT_DATE - INTERVAL '15 days', '买入平安银行股票')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Sample positions and transactions created successfully';
END $$;

-- Insert exchange rates (using correct column structure)
INSERT INTO exchange_rates (from_currency, to_currency, rate, rate_date, data_source)
VALUES 
    ('USD', 'CNY', 7.2500, CURRENT_DATE, 'manual'),
    ('CNY', 'USD', 0.1379, CURRENT_DATE, 'manual'),
    ('HKD', 'CNY', 0.9280, CURRENT_DATE, 'manual'),
    ('CNY', 'HKD', 1.0776, CURRENT_DATE, 'manual'),
    ('USD', 'HKD', 7.8000, CURRENT_DATE, 'manual'),
    ('HKD', 'USD', 0.1282, CURRENT_DATE, 'manual')
ON CONFLICT (from_currency, to_currency, rate_date) DO UPDATE SET
    rate = EXCLUDED.rate;

\echo 'Final corrected test data inserted successfully!';