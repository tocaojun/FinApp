# 其他 CURRENT_TIMESTAMP 使用情况分析

## 概述

项目中有多处使用了 `CURRENT_TIMESTAMP`，需要评估哪些也需要应用时区修复。

---

## 时间戳类型分类

### 第一类：TIMESTAMP WITH TIME ZONE（推荐用于审计字段）

**特点**: 已经包含时区信息，不需要额外处理

**使用位置**:
- `005_multi_asset_types/up.sql`: created_at, updated_at
- `003_transactions_schema/up.sql`: created_at, updated_at
- `009_stock_option_type/up.sql`: created_at, updated_at
- `003_transactions_schema/alter_tables.sql`: updated_at

**现状**: ✅ 不需要修改 (时区信息已内置)

### 第二类：TIMESTAMP WITHOUT TIME ZONE(需要修复)

**特点**: 不包含时区信息，会直接使用 UTC

**使用位置**:
1. `008_price_sync_config/up.sql`
   - Line 27-28: created_at, updated_at (price_data_sources 表)
   - Line 67-68: created_at, updated_at (price_sync_tasks 表)
   - ✅ **Line 83: started_at (price_sync_logs 表)** - 已修复
   - Line 114: occurred_at (price_sync_errors 表)

2. `007_user_tags_system_pg.sql`
   - Line 14-15, 34-35, 48: created_at, updated_at

3. `004_assets_schema/up.sql`
   - Line 11-12, 24-25, 62-63, 92-93: created_at, updated_at

4. `007_user_tags_system.sql` (MySQL 格式)
   - Line 16-17: created_at, updated_at

5. `012_wealth_product_alerts/up.sql`
   - Line 14, 17-18: triggered_at, created_at, updated_at

6. `006_notifications_table.sql` (MySQL 格式)
   - 多处 created_at, updated_at

---

## 优先级分析

### 🔴 高优先级（需要立即修复）

这些字段直接影响用户查看和理解数据的时间：

| 表名 | 字段 | 影响范围 | 状态 |
|------|------|---------|------|
| price_sync_logs | started_at | 用户可见的同步日志时间 | ✅ 已修复 |
| price_sync_errors | occurred_at | 错误发生时间 | ⚠️ 需要修复 |

### 🟡 中优先级（建议修复）

这些字段在系统日志和审计中使用，准确性重要但不直接影响用户查看：

| 表名 | 字段 | 影响范围 | 建议 |
|------|------|---------|------|
| price_data_sources | created_at, updated_at | 数据源管理审计 | 建议修复 |
| price_sync_tasks | created_at, updated_at | 任务管理审计 | 建议修复 |
| user_tags | created_at, updated_at | 标签审计 | 建议修复 |
| assets | created_at, updated_at | 资产管理审计 | 建议修复 |

### 🟢 低优先级（可不修改）

这些字段是内部系统字段，不直接面向用户或外部系统：

| 表名 | 字段 | 说明 |
|------|------|------|
| portfolios | created_at, updated_at | 内部审计字段 |
| transactions | created_at | 内部审计字段 |
| currencies | created_at | 内部审计字段 |

---

## 建议方案

### 立即执行（当前 PR）

✅ 已完成：
- `price_sync_logs.started_at` - 已修复

### 第二阶段（建议后续执行）

⚠️ 后续修复：
```sql
-- 1. price_sync_errors.occurred_at
ALTER TABLE finapp.price_sync_errors 
ALTER COLUMN occurred_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::timestamp without time zone;

-- 2. price_data_sources 和 price_sync_tasks
ALTER TABLE finapp.price_data_sources
ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::timestamp without time zone,
ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::timestamp without time zone;

ALTER TABLE finapp.price_sync_tasks
ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::timestamp without time zone,
ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::timestamp without time zone;

-- 3. user_tags 系列表
ALTER TABLE finapp.user_tags
ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::timestamp without time zone,
ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::timestamp without time zone;
```

### 新代码规范

从现在开始，创建新的时间戳列时，遵循以下规范：

```sql
-- ✅ 推荐用法 1：包含时区的完整时间戳（最佳实践）
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

-- ✅ 推荐用法 2：如果必须使用 TIMESTAMP WITHOUT TIME ZONE
started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai'

-- ❌ 不推荐（已过时）
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 技术考虑

### 为什么 PostgreSQL 优于 MySQL？

PostgreSQL 的 `TIMESTAMP WITH TIME ZONE` 是更好的选择：

```sql
-- PostgreSQL：推荐
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP  -- 自动包含时区信息

-- MySQL：需要手动转换
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 总是 UTC
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### 迁移策略

对于已存在的表数据，修改默认值后：

1. **新插入的记录** 会使用新的默认值 ✅
2. **已存在的记录** 保持原样（UTC 时间）
3. **更新现有记录** 需要单独处理（可选）

---

## 验证清单

- [x] 确认 `price_sync_logs.started_at` 已修复
- [ ] 检查 `price_sync_errors.occurred_at` 是否需要修复
- [ ] 评估其他审计字段是否需要批量修复
- [ ] 建立新代码时间戳规范
- [ ] 编写团队开发指南

---

## 参考资源

- [PostgreSQL TIMESTAMP WITH TIME ZONE](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-TIMEZONES)
- [PostgreSQL CURRENT_TIMESTAMP](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT)
- [时区最佳实践](https://www.postgresql.org/docs/current/sql-createdatabase.html)

---

**分析日期**: 2025-11-08  
**分析状态**: 完成
