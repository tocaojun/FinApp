# FinApp 数据库优化策略

## 1. 索引优化策略

### 1.1 核心业务索引

#### 用户相关索引
```sql
-- 用户表核心索引（已创建）
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 复合索引优化
CREATE INDEX idx_users_active_login ON users(is_active, last_login_at) WHERE is_active = true;
```

#### 投资组合相关索引
```sql
-- 投资组合表索引（已创建）
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_is_active ON portfolios(is_active);
CREATE INDEX idx_portfolios_is_default ON portfolios(is_default);

-- 复合索引优化
CREATE INDEX idx_portfolios_user_active ON portfolios(user_id, is_active) WHERE is_active = true;
```

#### 持仓相关索引
```sql
-- 持仓表索引（已创建）
CREATE INDEX idx_positions_portfolio_id ON positions(portfolio_id);
CREATE INDEX idx_positions_asset_id ON positions(asset_id);
CREATE INDEX idx_positions_trading_account_id ON positions(trading_account_id);
CREATE INDEX idx_positions_quantity ON positions(quantity) WHERE quantity > 0;
CREATE INDEX idx_positions_is_active ON positions(is_active);

-- 性能优化索引
CREATE INDEX idx_positions_portfolio_asset ON positions(portfolio_id, asset_id) WHERE is_active = true;
CREATE INDEX idx_positions_account_asset ON positions(trading_account_id, asset_id) WHERE quantity > 0;
```

#### 交易相关索引
```sql
-- 交易表索引（已创建）
CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX idx_transactions_trading_account_id ON transactions(trading_account_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- 复合索引优化
CREATE INDEX idx_transactions_portfolio_date ON transactions(portfolio_id, transaction_date DESC);
CREATE INDEX idx_transactions_asset_date ON transactions(asset_id, transaction_date DESC);
CREATE INDEX idx_transactions_account_type_date ON transactions(trading_account_id, transaction_type, transaction_date DESC);
```

#### 资产价格索引
```sql
-- 资产价格表索引（已创建）
CREATE INDEX idx_asset_prices_asset_id ON asset_prices(asset_id);
CREATE INDEX idx_asset_prices_date ON asset_prices(price_date);

-- 性能关键索引
CREATE INDEX idx_asset_prices_asset_date ON asset_prices(asset_id, price_date DESC);
CREATE INDEX idx_asset_prices_latest ON asset_prices(asset_id, price_date DESC) WHERE price_date >= CURRENT_DATE - INTERVAL '30 days';
```

### 1.2 查询优化索引

#### 报表查询优化
```sql
-- 投资组合性能查询
CREATE INDEX idx_portfolio_performance ON performance_metrics(portfolio_id, metric_date DESC);

-- 资产分析查询
CREATE INDEX idx_asset_analysis ON assets(asset_type_id, market_id, sector);

-- 汇率查询优化
CREATE INDEX idx_exchange_rates_latest ON exchange_rates(from_currency, to_currency, rate_date DESC);
```

#### 分页查询优化
```sql
-- 交易历史分页
CREATE INDEX idx_transactions_pagination ON transactions(portfolio_id, transaction_date DESC, id);

-- 持仓历史分页
CREATE INDEX idx_position_snapshots_pagination ON position_snapshots(portfolio_id, snapshot_date DESC, id);
```

### 1.3 部分索引优化

```sql
-- 只为活跃数据创建索引
CREATE INDEX idx_active_portfolios ON portfolios(user_id, created_at) WHERE is_active = true;
CREATE INDEX idx_active_positions ON positions(portfolio_id, asset_id) WHERE is_active = true AND quantity > 0;
CREATE INDEX idx_recent_transactions ON transactions(portfolio_id, transaction_date) WHERE transaction_date >= CURRENT_DATE - INTERVAL '1 year';
CREATE INDEX idx_recent_prices ON asset_prices(asset_id, price_date) WHERE price_date >= CURRENT_DATE - INTERVAL '90 days';
```

## 2. 查询优化策略

### 2.1 常用查询模式

#### 投资组合概览查询
```sql
-- 优化前
SELECT p.*, COUNT(pos.id) as position_count, SUM(pos.total_cost) as total_value
FROM portfolios p
LEFT JOIN positions pos ON p.id = pos.portfolio_id
WHERE p.user_id = $1 AND p.is_active = true
GROUP BY p.id;

-- 优化后（使用预计算字段）
SELECT p.*, p.position_count, p.total_value
FROM portfolios p
WHERE p.user_id = $1 AND p.is_active = true;
```

#### 资产价格查询
```sql
-- 获取最新价格（优化版本）
SELECT DISTINCT ON (asset_id) asset_id, close_price, price_date
FROM asset_prices
WHERE asset_id = ANY($1) AND price_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY asset_id, price_date DESC;
```

### 2.2 预计算和缓存策略

#### 投资组合汇总数据
```sql
-- 创建物化视图
CREATE MATERIALIZED VIEW portfolio_summary AS
SELECT 
    p.id as portfolio_id,
    p.user_id,
    p.name,
    COUNT(pos.id) as position_count,
    SUM(pos.total_cost) as total_cost,
    SUM(pos.quantity * ap.close_price * er.rate) as current_value,
    (SUM(pos.quantity * ap.close_price * er.rate) - SUM(pos.total_cost)) as unrealized_pnl
FROM portfolios p
LEFT JOIN positions pos ON p.id = pos.portfolio_id AND pos.is_active = true
LEFT JOIN LATERAL (
    SELECT close_price 
    FROM asset_prices 
    WHERE asset_id = pos.asset_id 
    ORDER BY price_date DESC 
    LIMIT 1
) ap ON true
LEFT JOIN LATERAL (
    SELECT rate 
    FROM exchange_rates 
    WHERE from_currency = pos.currency AND to_currency = p.base_currency 
    ORDER BY rate_date DESC 
    LIMIT 1
) er ON true
WHERE p.is_active = true
GROUP BY p.id, p.user_id, p.name;

-- 创建刷新索引
CREATE INDEX idx_portfolio_summary_user ON portfolio_summary(user_id);
CREATE INDEX idx_portfolio_summary_portfolio ON portfolio_summary(portfolio_id);
```

## 3. 数据分区策略

### 3.1 时间分区

#### 资产价格表分区
```sql
-- 按月分区资产价格表
CREATE TABLE asset_prices_partitioned (
    LIKE asset_prices INCLUDING ALL
) PARTITION BY RANGE (price_date);

-- 创建分区
CREATE TABLE asset_prices_2025_01 PARTITION OF asset_prices_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE asset_prices_2025_02 PARTITION OF asset_prices_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- ... 继续创建其他月份分区
```

#### 交易记录分区
```sql
-- 按年分区交易记录
CREATE TABLE transactions_partitioned (
    LIKE transactions INCLUDING ALL
) PARTITION BY RANGE (transaction_date);

CREATE TABLE transactions_2025 PARTITION OF transactions_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### 3.2 自动分区管理

```sql
-- 创建自动分区函数
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
                    FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

## 4. 性能监控

### 4.1 慢查询监控

```sql
-- 启用慢查询日志
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1秒
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- 查询慢查询统计
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;
```

### 4.2 索引使用情况监控

```sql
-- 检查未使用的索引
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0 AND idx_tup_fetch = 0;

-- 检查索引效率
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    idx_tup_read::float / NULLIF(idx_scan, 0) as avg_tuples_per_scan
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY avg_tuples_per_scan DESC;
```

## 5. 维护策略

### 5.1 定期维护任务

```sql
-- 更新表统计信息
ANALYZE;

-- 重建索引（必要时）
REINDEX INDEX CONCURRENTLY idx_asset_prices_asset_date;

-- 清理过期数据
DELETE FROM asset_prices WHERE price_date < CURRENT_DATE - INTERVAL '2 years';
DELETE FROM audit_logs WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
```

### 5.2 自动维护脚本

```bash
#!/bin/bash
# 数据库维护脚本

# 更新统计信息
psql -c "ANALYZE;"

# 清理过期数据
psql -c "DELETE FROM asset_prices WHERE price_date < CURRENT_DATE - INTERVAL '2 years';"

# 刷新物化视图
psql -c "REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_summary;"

# 检查数据库大小
psql -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

## 6. 性能基准测试

### 6.1 基准查询

```sql
-- 投资组合查询基准
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*, ps.total_cost, ps.current_value
FROM portfolios p
JOIN portfolio_summary ps ON p.id = ps.portfolio_id
WHERE p.user_id = $1;

-- 交易历史查询基准
EXPLAIN (ANALYZE, BUFFERS)
SELECT t.*, a.symbol, a.name
FROM transactions t
JOIN assets a ON t.asset_id = a.id
WHERE t.portfolio_id = $1
ORDER BY t.transaction_date DESC
LIMIT 50;
```

### 6.2 性能目标

- 用户登录查询: < 50ms
- 投资组合概览: < 100ms
- 交易历史分页: < 200ms
- 资产价格查询: < 150ms
- 报表生成: < 2s

## 7. 扩展性考虑

### 7.1 读写分离

```sql
-- 配置读副本
-- 主库：写操作
-- 副本：读操作（报表、分析查询）
```

### 7.2 连接池配置

```javascript
// 应用层连接池配置
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finapp',
  user: 'finapp_user',
  password: 'password',
  max: 20,          // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

这个优化策略文档提供了全面的数据库性能优化指导，包括索引策略、查询优化、分区、监控和维护等方面。