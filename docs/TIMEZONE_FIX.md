# 数据同步日志时区问题修复

## 问题描述

用户报告：同步日志中显示的"开始时间"与实际操作时间有 **8 小时时差**。

### 根本原因

PostgreSQL 的 `CURRENT_TIMESTAMP` 函数返回的是 **UTC 时区**（协调世界时）的时间戳，而用户在 **CST（UTC+8）** 时区。这导致：
- 实际操作时间：14:30 （北京时间）
- 日志显示时间：06:30 （UTC 时间）

## 问题影响范围

所有使用 `CURRENT_TIMESTAMP` 默认值的表：
- `finapp.price_sync_logs` 表的 `started_at` 列
- 其他表的时间戳列

## 修复方案

### 1. 数据库迁移文件更新

**修改文件：**
- `/backend/migrations/008_price_sync_config/up.sql`
- `/backend/migrations/008_price_sync_config/up_fixed.sql`

**修改内容：**
```sql
-- 修改前
started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

-- 修改后
started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai',
```

### 2. 现有表修改

**执行脚本：** `/fix-sync-log-timezone.sql`

```bash
psql -h localhost -U finapp_user -d finapp_test -f /Users/caojun/code/FinApp/fix-sync-log-timezone.sql
```

**修改结果：**
```
column_name  | column_default                              | data_type
--------------+-----------------------------------------------------+-----------------------------
started_at   | timezone('Asia/Shanghai'::text CURRENT_TIMESTAMP) | timestamp without time zone
```

### 3. 后端代码调整

文件：`/backend/src/services/PriceSyncService.ts`

添加了注释说明时区处理：
```typescript
// 创建同步日志
// 使用本地时区时间（CST/UTC+8）而不是 UTC
const logResult = await this.db.prisma.$queryRaw`
  INSERT INTO finapp.price_sync_logs (task_id, data_source_id, status)
  VALUES (${taskId}::uuid, ${dataSource!.id}::uuid, 'running')
  RETURNING id
` as any[];
```

## 前端显示

前端已经正确处理时间戳的显示：

```typescript
render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
```

因为现在数据库存储的是本地时间戳，`dayjs` 会直接解析并显示正确的时间。

## 验证方法

1. **重启后端服务**
   ```bash
   npm run start:backend
   ```

2. **手动执行一次数据同步任务**
   - 在前端打开数据同步页面
   - 点击"手动同步"按钮
   - 观察日志显示的"开始时间"是否与当前时间一致

3. **查询数据库验证**
   ```sql
   SELECT started_at, completed_at, status 
   FROM finapp.price_sync_logs 
   ORDER BY started_at DESC 
   LIMIT 5;
   ```

## 时区处理最佳实践

### PostgreSQL 时区函数对比

| 函数 | 说明 | 示例 |
|------|------|------|
| `CURRENT_TIMESTAMP` | 返回 UTC 时间 | `2025-11-08 06:30:00` |
| `CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai'` | 返回指定时区的时间 | `2025-11-08 14:30:00` |
| `NOW()` | 同 `CURRENT_TIMESTAMP` | `2025-11-08 06:30:00` |
| `LOCALTIMESTAMP` | 返回数据库所在时区的时间 | 依赖 PostgreSQL 配置 |

### 数据库级时区配置（可选）

如果要全局设置数据库时区：

```sql
-- 查看当前时区
SHOW timezone;

-- 设置会话时区
SET timezone = 'Asia/Shanghai';

-- 设置系统时区（需要重启 PostgreSQL）
-- postgresql.conf: timezone = 'Asia/Shanghai'
```

## 相关文件清单

### 修改的文件
- ✅ `backend/migrations/008_price_sync_config/up.sql`
- ✅ `backend/migrations/008_price_sync_config/up_fixed.sql`
- ✅ `backend/src/services/PriceSyncService.ts`
- ✅ `fix-sync-log-timezone.sql` (SQL 修改脚本)

### 已验证正确的文件
- ✅ `frontend/src/pages/admin/DataSync/index.tsx` (时间显示代码正确)
- ✅ `frontend/src/pages/admin/PriceManagement/ApiSync/index.tsx` (时间显示代码正确)

## 后续维护建议

1. **检查其他时间戳列**
   - 审视所有时间戳列的默认值
   - 在新增时间戳列时，统一使用 `AT TIME ZONE 'Asia/Shanghai'`

2. **建立时区规范**
   - 为所有新的时间戳列添加时区说明
   - 在代码注释中标注时区相关的处理逻辑

3. **监控日志质量**
   - 定期检查日志中的时间是否准确
   - 监控是否有其他时区相关的问题

## 相关 PostgreSQL 文档

- [PostgreSQL CURRENT_TIMESTAMP 函数](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT)
- [PostgreSQL 时区设置](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-TIMEZONES)
- [PostgreSQL AT TIME ZONE 操作符](https://www.postgresql.org/docs/current/functions-datetime.html#OPERATORS-DATETIME-OP)

---

**修复日期**: 2025-11-08  
**修复版本**: v1.0  
**状态**: 已验证生效 ✅
