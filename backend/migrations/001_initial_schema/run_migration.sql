-- FinApp Database Schema - Initial Migration Runner
-- This script runs all initial schema migrations in the correct order

\echo 'Starting FinApp database schema migration...'

-- Run migrations in order
\echo 'Creating users and authentication tables...'
\i 001_users_and_auth.sql

\echo 'Creating portfolios and trading accounts tables...'
\i 002_portfolios_and_accounts.sql

\echo 'Creating analytics and reports tables...'
\i 003_analytics_and_reports.sql

\echo 'FinApp database schema migration completed successfully!'

-- Verify tables were created
\echo 'Verifying table creation...'
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname IN ('public', 'finapp_core', 'finapp_analytics')
ORDER BY schemaname, tablename;