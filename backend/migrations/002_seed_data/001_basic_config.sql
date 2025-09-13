-- FinApp Database Seed Data - Basic Configuration
-- Migration: 001_basic_config.sql
-- Description: Insert basic configuration data (roles, permissions, asset types, markets, etc.)

\echo 'Inserting basic configuration data...'

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', '系统管理员，拥有所有权限'),
('user', '普通用户，拥有基本功能权限'),
('viewer', '只读用户，只能查看数据')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (name, resource, action, description) VALUES
-- User management
('users.create', 'users', 'create', '创建用户'),
('users.read', 'users', 'read', '查看用户信息'),
('users.update', 'users', 'update', '更新用户信息'),
('users.delete', 'users', 'delete', '删除用户'),

-- Portfolio management
('portfolios.create', 'portfolios', 'create', '创建投资组合'),
('portfolios.read', 'portfolios', 'read', '查看投资组合'),
('portfolios.update', 'portfolios', 'update', '更新投资组合'),
('portfolios.delete', 'portfolios', 'delete', '删除投资组合'),

-- Trading account management
('accounts.create', 'trading_accounts', 'create', '创建交易账户'),
('accounts.read', 'trading_accounts', 'read', '查看交易账户'),
('accounts.update', 'trading_accounts', 'update', '更新交易账户'),
('accounts.delete', 'trading_accounts', 'delete', '删除交易账户'),

-- Transaction management
('transactions.create', 'transactions', 'create', '创建交易记录'),
('transactions.read', 'transactions', 'read', '查看交易记录'),
('transactions.update', 'transactions', 'update', '更新交易记录'),
('transactions.delete', 'transactions', 'delete', '删除交易记录'),
('transactions.import', 'transactions', 'import', '批量导入交易记录'),

-- Asset management
('assets.create', 'assets', 'create', '创建资产'),
('assets.read', 'assets', 'read', '查看资产信息'),
('assets.update', 'assets', 'update', '更新资产信息'),
('assets.delete', 'assets', 'delete', '删除资产'),

-- Report management
('reports.create', 'reports', 'create', '创建报表'),
('reports.read', 'reports', 'read', '查看报表'),
('reports.update', 'reports', 'update', '更新报表'),
('reports.delete', 'reports', 'delete', '删除报表'),
('reports.export', 'reports', 'export', '导出报表'),

-- System administration
('system.config', 'system', 'config', '系统配置管理'),
('system.logs', 'system', 'logs', '查看系统日志'),
('system.backup', 'system', 'backup', '数据备份管理')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
WITH role_permission_mapping AS (
    SELECT 
        r.id as role_id,
        p.id as permission_id
    FROM roles r
    CROSS JOIN permissions p
    WHERE 
        (r.name = 'admin') OR
        (r.name = 'user' AND p.resource IN ('portfolios', 'trading_accounts', 'transactions', 'assets', 'reports') AND p.action != 'delete') OR
        (r.name = 'user' AND p.name = 'users.read') OR
        (r.name = 'user' AND p.name = 'users.update') OR
        (r.name = 'viewer' AND p.action = 'read')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id FROM role_permission_mapping
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Insert asset types
INSERT INTO asset_types (code, name, category, description) VALUES
('STOCK', '股票', 'equity', '普通股票'),
('ETF', '交易所交易基金', 'fund', '在交易所交易的指数基金'),
('MUTUAL_FUND', '共同基金', 'fund', '开放式基金'),
('BOND', '债券', 'fixed_income', '政府或企业债券'),
('OPTION', '期权', 'derivative', '股票期权合约'),
('FUTURE', '期货', 'derivative', '期货合约'),
('CRYPTO', '加密货币', 'crypto', '数字货币'),
('CASH', '现金', 'cash', '现金及现金等价物'),
('COMMODITY', '商品', 'commodity', '贵金属、原油等商品'),
('REIT', '房地产投资信托', 'real_estate', '房地产投资信托基金')
ON CONFLICT (code) DO NOTHING;

-- Insert major markets
INSERT INTO markets (code, name, country, currency, timezone, trading_hours) VALUES
('SSE', '上海证券交易所', 'CHN', 'CNY', 'Asia/Shanghai', '{"open": "09:30", "close": "15:00", "lunch_break": {"start": "11:30", "end": "13:00"}}'),
('SZSE', '深圳证券交易所', 'CHN', 'CNY', 'Asia/Shanghai', '{"open": "09:30", "close": "15:00", "lunch_break": {"start": "11:30", "end": "13:00"}}'),
('HKEX', '香港交易所', 'HKG', 'HKD', 'Asia/Hong_Kong', '{"open": "09:30", "close": "16:00", "lunch_break": {"start": "12:00", "end": "13:00"}}'),
('NYSE', '纽约证券交易所', 'USA', 'USD', 'America/New_York', '{"open": "09:30", "close": "16:00"}'),
('NASDAQ', '纳斯达克', 'USA', 'USD', 'America/New_York', '{"open": "09:30", "close": "16:00"}'),
('TSE', '东京证券交易所', 'JPN', 'JPY', 'Asia/Tokyo', '{"open": "09:00", "close": "15:00", "lunch_break": {"start": "11:30", "end": "12:30"}}'),
('LSE', '伦敦证券交易所', 'GBR', 'GBP', 'Europe/London', '{"open": "08:00", "close": "16:30"}'),
('FWB', '法兰克福证券交易所', 'DEU', 'EUR', 'Europe/Berlin', '{"open": "09:00", "close": "17:30"}')
ON CONFLICT (code) DO NOTHING;

-- Insert liquidity tags
INSERT INTO liquidity_tags (name, description, color, sort_order) VALUES
('高流动性', '大盘股、主要ETF等高流动性资产', '#22c55e', 1),
('中等流动性', '中盘股、部分基金等中等流动性资产', '#f59e0b', 2),
('低流动性', '小盘股、私募基金等低流动性资产', '#ef4444', 3),
('锁定期', '有锁定期限制的资产', '#8b5cf6', 4),
('不可交易', '暂停交易或退市的资产', '#6b7280', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert common benchmarks
INSERT INTO benchmarks (name, symbol, description, asset_class, currency) VALUES
('沪深300指数', 'CSI300', '沪深300指数，反映A股市场整体表现', 'equity', 'CNY'),
('上证指数', 'SHCOMP', '上海证券交易所综合股价指数', 'equity', 'CNY'),
('深证成指', 'SZCOMP', '深圳证券交易所成份股价指数', 'equity', 'CNY'),
('恒生指数', 'HSI', '香港恒生指数', 'equity', 'HKD'),
('标普500指数', 'SPX', '标准普尔500指数', 'equity', 'USD'),
('纳斯达克指数', 'IXIC', '纳斯达克综合指数', 'equity', 'USD'),
('日经225指数', 'N225', '日经225指数', 'equity', 'JPY'),
('富时100指数', 'UKX', '英国富时100指数', 'equity', 'GBP'),
('DAX指数', 'DAX', '德国DAX指数', 'equity', 'EUR')
ON CONFLICT (symbol) DO NOTHING;

-- Insert common exchange rates (base rates, will be updated by data sync)
INSERT INTO exchange_rates (from_currency, to_currency, rate_date, rate, data_source) VALUES
('USD', 'CNY', CURRENT_DATE, 7.2000, 'manual'),
('HKD', 'CNY', CURRENT_DATE, 0.9200, 'manual'),
('JPY', 'CNY', CURRENT_DATE, 0.0480, 'manual'),
('EUR', 'CNY', CURRENT_DATE, 7.8000, 'manual'),
('GBP', 'CNY', CURRENT_DATE, 9.1000, 'manual'),
('CNY', 'USD', CURRENT_DATE, 0.1389, 'manual'),
('CNY', 'HKD', CURRENT_DATE, 1.0870, 'manual'),
('CNY', 'JPY', CURRENT_DATE, 20.8333, 'manual'),
('CNY', 'EUR', CURRENT_DATE, 0.1282, 'manual'),
('CNY', 'GBP', CURRENT_DATE, 0.1099, 'manual')
ON CONFLICT (from_currency, to_currency, rate_date) DO NOTHING;

\echo 'Basic configuration data inserted successfully!';