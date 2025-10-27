# FinApp 数据库架构说明

## 📊 数据库概览

### 数据库实例信息

| 属性 | 值 | 说明 |
|------|-----|------|
| **数据库名称** | `finapp_test` | 主数据库实例 |
| **所有者** | `finapp_user` | 数据库用户 |
| **字符编码** | `UTF8` | 支持多语言 |
| **连接字符串** | `postgresql://finapp_user:finapp_password@localhost:5432/finapp_test` | - |

### Schema 结构

```
finapp_test (数据库)
├── public (schema)      - PostgreSQL 默认 schema
├── finapp (schema)      - 主业务数据 ⭐
└── audit (schema)       - 审计日志
```

---

## ✅ 核心答案

### 交易数据和日志数据在同一个库中！

**数据库**: `finapp_test`  
**Schema**: `finapp`

所有业务数据（包括交易数据和同步日志）都存储在：
- **同一个数据库**: `finapp_test`
- **同一个 Schema**: `finapp`

---

## 📁 数据表分类

### 1️⃣ 用户和权限管理（7 张表）

| 表名 | 用途 | 记录数 |
|------|------|--------|
| `users` | 用户基本信息 | - |
| `user_sessions` | 用户会话 | - |
| `user_roles` | 用户角色关联 | - |
| `roles` | 角色定义 | - |
| `permissions` | 权限定义 | - |
| `role_permissions` | 角色权限关联 | - |
| `email_verification_tokens` | 邮箱验证令牌 | - |
| `password_reset_tokens` | 密码重置令牌 | - |

### 2️⃣ 投资组合和交易数据（9 张表）⭐

| 表名 | 用途 | 当前记录数 |
|------|------|-----------|
| `portfolios` | 投资组合 | 3 |
| `trading_accounts` | 交易账户 | - |
| `positions` | 持仓记录 | - |
| `transactions` | 交易记录 | 4 |
| `cash_flows` | 现金流 | - |
| `portfolio_snapshots` | 组合快照 | - |
| `position_snapshots` | 持仓快照 | - |
| `performance_metrics` | 绩效指标 | - |
| `transaction_tags` | 交易标签 | - |
| `transaction_tag_mappings` | 交易标签映射 | - |

### 3️⃣ 资产和市场数据（7 张表）

| 表名 | 用途 | 说明 |
|------|------|------|
| `assets` | 资产基础信息 | 股票、基金、债券等 |
| `asset_types` | 资产类型 | 股票、基金、债券分类 |
| `markets` | 市场信息 | 港股、A股、美股等 |
| `asset_prices` | 资产价格历史 | OHLC 数据 |
| `exchange_rates` | 汇率数据 | 货币兑换率 |
| `benchmarks` | 基准指数 | 沪深300、恒生指数等 |
| `benchmark_prices` | 基准价格 | 基准指数历史价格 |
| `option_details` | 期权详情 | 期权合约信息 |

### 4️⃣ 价格同步和日志（4 张表）⭐

| 表名 | 用途 | 当前记录数 |
|------|------|-----------|
| `price_data_sources` | 数据源配置 | 2 |
| `price_sync_tasks` | 同步任务 | 1 |
| `price_sync_logs` | 同步日志 | 9 |
| `price_sync_errors` | 同步错误 | - |

### 5️⃣ 标签和分类（4 张表）

| 表名 | 用途 | 说明 |
|------|------|------|
| `tags` | 标签 | 用户自定义标签 |
| `tag_categories` | 标签分类 | 标签分组 |
| `portfolio_tags` | 组合标签映射 | - |
| `liquidity_tags` | 流动性标签 | 高/中/低流动性 |

### 6️⃣ 报表和审计（3 张表）

| 表名 | 用途 | 说明 |
|------|------|------|
| `reports` | 报表定义 | 报表配置 |
| `report_executions` | 报表执行记录 | 报表生成历史 |
| `audit_logs` | 审计日志 | 操作审计 |

---

## 🗂️ 数据存储位置总结

### 交易相关数据

```
数据库: finapp_test
Schema: finapp
表:
  ├── transactions          (交易记录)
  ├── portfolios            (投资组合)
  ├── positions             (持仓)
  ├── trading_accounts      (交易账户)
  ├── cash_flows            (现金流)
  └── transaction_tags      (交易标签)
```

### 价格同步日志数据

```
数据库: finapp_test  (同一个库！)
Schema: finapp       (同一个 Schema！)
表:
  ├── price_sync_logs       (同步日志)
  ├── price_sync_errors     (同步错误)
  ├── price_sync_tasks      (同步任务)
  └── price_data_sources    (数据源配置)
```

### 资产价格数据

```
数据库: finapp_test  (同一个库！)
Schema: finapp       (同一个 Schema！)
表:
  ├── asset_prices          (资产价格历史)
  ├── assets                (资产信息)
  ├── asset_types           (资产类型)
  └── markets               (市场信息)
```

---

## 🔗 核心数据关系

### 交易数据流

```
users (用户)
  ↓
portfolios (投资组合)
  ↓
trading_accounts (交易账户)
  ↓
transactions (交易记录) ← 关联 assets (资产)
  ↓
positions (持仓)
```

### 价格数据流

```
price_data_sources (数据源)
  ↓
price_sync_tasks (同步任务)
  ↓
price_sync_logs (同步日志)
  ↓
asset_prices (资产价格) ← 同步的结果数据
```

### 完整的数据关系

```
                    finapp_test 数据库
                    finapp Schema
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   交易数据              价格数据           同步日志
        │                  │                  │
    transactions      asset_prices    price_sync_logs
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                    都在同一个库中！
```

---

## 📊 数据统计

### 当前数据量

```sql
-- 查看各表的记录数
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'finapp'
ORDER BY n_live_tup DESC;
```

### 当前已知数据

| 表名 | 记录数 |
|------|--------|
| `portfolios` | 3 |
| `transactions` | 4 |
| `price_sync_logs` | 9 |
| `price_sync_tasks` | 1 |
| `price_data_sources` | 2 |

---

## 🔍 常用查询

### 查询交易和价格数据的关联

```sql
-- 查看交易记录及其资产的最新价格
SELECT 
    t.transaction_date,
    t.transaction_type,
    a.symbol,
    a.name,
    t.quantity,
    t.price as transaction_price,
    ap.close_price as latest_price,
    ap.price_date as price_date
FROM finapp.transactions t
JOIN finapp.assets a ON t.asset_id = a.id
LEFT JOIN LATERAL (
    SELECT close_price, price_date
    FROM finapp.asset_prices
    WHERE asset_id = a.id
    ORDER BY price_date DESC
    LIMIT 1
) ap ON true
ORDER BY t.transaction_date DESC;
```

### 查看同步日志和生成的价格数据

```sql
-- 查看某次同步生成了多少价格记录
SELECT 
    l.id as log_id,
    l.started_at,
    l.status,
    l.total_records as logged_records,
    COUNT(ap.id) as actual_price_records
FROM finapp.price_sync_logs l
LEFT JOIN finapp.asset_prices ap 
    ON DATE(ap.created_at) = DATE(l.started_at)
WHERE l.started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY l.id, l.started_at, l.status, l.total_records
ORDER BY l.started_at DESC;
```

### 查看投资组合的完整数据

```sql
-- 查看投资组合、持仓、交易、价格的完整视图
SELECT 
    p.name as portfolio_name,
    ta.name as account_name,
    a.symbol,
    a.name as asset_name,
    pos.quantity,
    pos.average_cost,
    ap.close_price as current_price,
    (pos.quantity * ap.close_price) as market_value,
    (pos.quantity * ap.close_price - pos.total_cost) as unrealized_pnl
FROM finapp.portfolios p
JOIN finapp.trading_accounts ta ON ta.portfolio_id = p.id
JOIN finapp.positions pos ON pos.trading_account_id = ta.id
JOIN finapp.assets a ON pos.asset_id = a.id
LEFT JOIN LATERAL (
    SELECT close_price
    FROM finapp.asset_prices
    WHERE asset_id = a.id
    ORDER BY price_date DESC
    LIMIT 1
) ap ON true
WHERE p.is_active = true
  AND pos.is_active = true;
```

---

## 🎯 数据库设计特点

### 优点

1. **统一存储** ✅
   - 所有业务数据在同一个数据库中
   - 便于事务管理和数据一致性
   - 简化备份和恢复

2. **Schema 隔离** ✅
   - 使用 `finapp` schema 隔离业务数据
   - 使用 `audit` schema 隔离审计数据
   - 清晰的数据组织结构

3. **关系完整** ✅
   - 外键约束保证数据完整性
   - 级联删除避免孤立数据
   - 索引优化查询性能

4. **可扩展性** ✅
   - JSONB 字段支持灵活配置
   - 标签系统支持自定义分类
   - 元数据字段支持扩展信息

### 注意事项

1. **单点故障** ⚠️
   - 所有数据在一个数据库中
   - 需要做好备份策略
   - 建议配置主从复制

2. **性能考虑** ⚠️
   - 大量历史数据可能影响查询性能
   - 需要定期归档旧数据
   - 建议使用分区表

3. **数据增长** ⚠️
   - `asset_prices` 表会快速增长
   - `price_sync_logs` 需要定期清理
   - `audit_logs` 需要归档策略

---

## 📋 数据库维护建议

### 备份策略

```bash
# 每日全量备份
pg_dump -U finapp_user -d finapp_test -F c -f finapp_backup_$(date +%Y%m%d).dump

# 备份特定 schema
pg_dump -U finapp_user -d finapp_test -n finapp -F c -f finapp_schema_backup.dump
```

### 数据清理

```sql
-- 清理 90 天前的成功同步日志
DELETE FROM finapp.price_sync_logs
WHERE status = 'success'
  AND started_at < CURRENT_DATE - INTERVAL '90 days';

-- 清理 180 天前的审计日志
DELETE FROM finapp.audit_logs
WHERE created_at < CURRENT_DATE - INTERVAL '180 days';
```

### 性能优化

```sql
-- 分析表统计信息
ANALYZE finapp.transactions;
ANALYZE finapp.asset_prices;
ANALYZE finapp.price_sync_logs;

-- 重建索引
REINDEX TABLE finapp.asset_prices;

-- 清理死元组
VACUUM ANALYZE finapp.asset_prices;
```

---

## 🔐 访问控制

### 当前配置

```
数据库: finapp_test
用户: finapp_user
密码: finapp_password (开发环境)
权限: 完整的 CRUD 权限
```

### 生产环境建议

```sql
-- 创建只读用户（用于报表查询）
CREATE USER finapp_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE finapp_test TO finapp_readonly;
GRANT USAGE ON SCHEMA finapp TO finapp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA finapp TO finapp_readonly;

-- 创建应用用户（用于应用程序）
CREATE USER finapp_app WITH PASSWORD 'app_password';
GRANT CONNECT ON DATABASE finapp_test TO finapp_app;
GRANT USAGE ON SCHEMA finapp TO finapp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA finapp TO finapp_app;
```

---

## 📚 相关文档

- [系统配置信息](./config/system-config.md)
- [价格同步数据表结构](./PRICE_SYNC_DATABASE_SCHEMA.md)
- [Prisma Schema](./backend/prisma/schema.prisma)

---

**创建时间**: 2025-10-27  
**最后更新**: 2025-10-27  
**维护人员**: 开发团队  
**版本**: v1.0
