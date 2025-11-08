-- 性能优化索引迁移
-- 优先级：P1-4 - 数据库查询性能优化

-- ============================================
-- 1. 权限检查查询优化索引
-- ============================================

-- 用户角色关联查询优化
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_active 
  ON finapp.user_roles(user_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id_active 
  ON finapp.user_roles(role_id) 
  WHERE is_active = true;

-- 角色权限关联查询优化
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id 
  ON finapp.role_permissions(role_id);

-- ============================================
-- 2. 投资组合和持仓查询优化
-- ============================================

-- 投资组合查询按用户和排序
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id_sort_order 
  ON finapp.portfolios(user_id, sort_order);

-- 持仓查询按投资组合
CREATE INDEX IF NOT EXISTS idx_positions_portfolio_id_active 
  ON finapp.positions(portfolio_id) 
  WHERE is_active = true;

-- 持仓查询按资产
CREATE INDEX IF NOT EXISTS idx_positions_asset_id 
  ON finapp.positions(asset_id);

-- 持仓查询按交易账户
CREATE INDEX IF NOT EXISTS idx_positions_trading_account 
  ON finapp.positions(trading_account_id) 
  WHERE is_active = true;

-- ============================================
-- 3. 资产价格查询优化
-- ============================================

-- 资产价格查询按资产和日期（最重要）
CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_date_desc 
  ON finapp.asset_prices(asset_id, price_date DESC);

-- ============================================
-- 4. 交易账户查询优化
-- ============================================

-- 交易账户按投资组合查询
CREATE INDEX IF NOT EXISTS idx_trading_accounts_portfolio_id 
  ON finapp.trading_accounts(portfolio_id);

-- ============================================
-- 5. 汇率缓存查询优化
-- ============================================

-- 汇率查询按源目标货币和日期
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_pair_date 
  ON finapp.exchange_rates(from_currency, to_currency, rate_date DESC);

-- 汇率查询按日期优化
CREATE INDEX IF NOT EXISTS idx_exchange_rates_rate_date 
  ON finapp.exchange_rates(rate_date DESC);

-- ============================================
-- 6. 用户查询优化
-- ============================================

-- 用户邮箱查询
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON finapp.users(email);

-- 用户激活状态
CREATE INDEX IF NOT EXISTS idx_users_is_active 
  ON finapp.users(id) 
  WHERE is_active = true;

-- ============================================
-- 7. 复合查询优化
-- ============================================

-- 权限检查的完整 JOIN 路径优化
CREATE INDEX IF NOT EXISTS idx_roles_is_active 
  ON finapp.roles(id) 
  WHERE is_active = true;

-- ============================================
-- 8. 统计和聚合查询优化
-- ============================================

-- 投资组合总值计算优化
CREATE INDEX IF NOT EXISTS idx_positions_portfolio_quantity 
  ON finapp.positions(portfolio_id, quantity) 
  WHERE is_active = true;

-- ============================================
-- 分析查询
-- ============================================

-- 查看创建的所有索引
-- SELECT indexname FROM pg_indexes 
-- WHERE schemaname = 'finapp' 
-- AND indexname LIKE 'idx_%' 
-- ORDER BY indexname;

-- 查看缺失的索引（PostgreSQL 建议）
-- SELECT * FROM pg_stat_user_indexes 
-- WHERE idx_scan = 0 
-- ORDER BY idx_blks_read DESC;
