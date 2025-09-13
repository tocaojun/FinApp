-- FinApp Database Seed Data - Runner Script
-- This script runs all seed data migrations in the correct order

\echo 'Starting FinApp database seed data insertion...'

-- Run seed data scripts in order
\echo 'Inserting basic configuration data...'
\i 001_basic_config.sql

\echo 'Inserting test data...'
\i 002_test_data.sql

\echo 'FinApp database seed data insertion completed successfully!'

-- Show summary statistics
\echo 'Database summary:'
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Roles', COUNT(*) FROM roles
UNION ALL
SELECT 'Permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'Portfolios', COUNT(*) FROM portfolios
UNION ALL
SELECT 'Trading Accounts', COUNT(*) FROM trading_accounts
UNION ALL
SELECT 'Assets', COUNT(*) FROM assets
UNION ALL
SELECT 'Asset Types', COUNT(*) FROM asset_types
UNION ALL
SELECT 'Markets', COUNT(*) FROM markets
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Positions', COUNT(*) FROM positions
ORDER BY table_name;