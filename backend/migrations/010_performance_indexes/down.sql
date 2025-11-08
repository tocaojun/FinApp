-- 回滚性能优化索引

DROP INDEX IF EXISTS finapp.idx_user_roles_user_id_active CASCADE;
DROP INDEX IF EXISTS finapp.idx_user_roles_role_id_active CASCADE;
DROP INDEX IF EXISTS finapp.idx_role_permissions_role_id CASCADE;

DROP INDEX IF EXISTS finapp.idx_portfolios_user_id_sort_order CASCADE;
DROP INDEX IF EXISTS finapp.idx_positions_portfolio_id_active CASCADE;
DROP INDEX IF EXISTS finapp.idx_positions_asset_id CASCADE;
DROP INDEX IF EXISTS finapp.idx_positions_portfolio_user CASCADE;

DROP INDEX IF EXISTS finapp.idx_asset_prices_asset_date_desc CASCADE;
DROP INDEX IF EXISTS finapp.idx_asset_prices_asset_latest CASCADE;

DROP INDEX IF EXISTS finapp.idx_trading_accounts_user_id CASCADE;

DROP INDEX IF EXISTS finapp.idx_exchange_rates_currency_pair_date CASCADE;
DROP INDEX IF EXISTS finapp.idx_exchange_rates_latest CASCADE;

DROP INDEX IF EXISTS finapp.idx_users_email CASCADE;
DROP INDEX IF EXISTS finapp.idx_users_is_active CASCADE;

DROP INDEX IF EXISTS finapp.idx_roles_is_active CASCADE;

DROP INDEX IF EXISTS finapp.idx_positions_portfolio_quantity CASCADE;
