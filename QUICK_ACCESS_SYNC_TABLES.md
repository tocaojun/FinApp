# 快速访问 API 同步表指南

## ✅ 表确实存在！

我已经验证了，API 同步相关的表**确实存在**于 `finapp_test` 数据库的 `finapp` schema 中：

```
✅ finapp.price_data_sources  (2 条记录)
✅ finapp.price_sync_tasks    (1 条记录)
✅ finapp.price_sync_logs     (10 条记录)
✅ finapp.price_sync_errors   (0 条记录)
```

---

## 🎯 为什么你可能找不到这些表？

### 原因 1: Prisma Studio 的限制

**Prisma Studio 只显示在 `schema.prisma` 中定义的模型**

这些表是通过原生 SQL 创建的，可能没有在 Prisma Schema 中定义，所以 Prisma Studio 看不到它们。

### 原因 2: Schema 路径问题

如果你使用的是 SQL 客户端，可能没有指定正确的 schema 路径。

---

## 🚀 3 种访问方式

### 方式 1: 使用命令行（最简单）✅

```bash
# 直接查询
psql -d finapp_test -c "SELECT * FROM finapp.price_sync_logs ORDER BY started_at DESC LIMIT 10;"

# 或者进入交互模式
psql -d finapp_test

# 然后执行查询
SELECT * FROM finapp.price_sync_logs ORDER BY started_at DESC LIMIT 10;
```

### 方式 2: 使用检查脚本（推荐）✅

我已经创建了一个检查脚本，运行它可以看到所有信息：

```bash
cd /Users/caojun/code/FinApp
./check-sync-tables.sh
```

这个脚本会显示：
- ✅ 所有 API 同步相关的表
- ✅ 每个表的记录数
- ✅ 最近的同步日志
- ✅ 错误统计
- ✅ 成功率分析

### 方式 3: 在 Prisma Studio 中查看（需要配置）

```bash
cd /Users/caojun/code/FinApp/backend

# 从数据库拉取表结构到 Prisma Schema
npx prisma db pull

# 重新生成 Prisma Client
npx prisma generate

# 启动 Prisma Studio
npx prisma studio
```

现在你应该能在 Prisma Studio 中看到这些表了。

---

## 📋 常用查询命令

### 查看所有同步日志

```bash
psql -d finapp_test -c "
SELECT 
    id,
    to_char(started_at, 'YYYY-MM-DD HH24:MI:SS') as started,
    status,
    total_assets,
    total_records,
    success_count,
    failed_count,
    error_message
FROM finapp.price_sync_logs
ORDER BY started_at DESC;
"
```

### 查看数据源配置

```bash
psql -d finapp_test -c "
SELECT 
    name,
    provider,
    is_active,
    rate_limit,
    last_sync_status
FROM finapp.price_data_sources;
"
```

### 查看同步任务

```bash
psql -d finapp_test -c "
SELECT 
    name,
    schedule_type,
    is_active,
    last_run_status,
    last_run_at
FROM finapp.price_sync_tasks;
"
```

### 查看同步错误

```bash
psql -d finapp_test -c "
SELECT 
    asset_symbol,
    error_type,
    error_message,
    occurred_at
FROM finapp.price_sync_errors
ORDER BY occurred_at DESC
LIMIT 20;
"
```

---

## 🔧 设置 search_path（可选）

如果你不想每次都输入 `finapp.` 前缀，可以设置 search_path：

```sql
-- 临时设置（当前会话）
SET search_path TO finapp, public;

-- 现在可以直接查询
SELECT * FROM price_sync_logs LIMIT 10;

-- 永久设置（为当前用户）
ALTER USER caojun SET search_path TO finapp, public;
```

---

## 📊 验证表存在

运行以下命令验证表确实存在：

```bash
psql -d finapp_test -c "\dt finapp.price*"
```

**预期输出：**
```
                List of relations
 Schema |        Name        | Type  |    Owner
--------+--------------------+-------+-------------
 finapp | price_data_sources | table | finapp_user
 finapp | price_sync_errors  | table | finapp_user
 finapp | price_sync_logs    | table | finapp_user
 finapp | price_sync_tasks   | table | finapp_user
(4 rows)
```

如果你看到这个输出，说明表确实存在！

---

## 🎯 快速诊断

如果你仍然找不到表，请运行：

```bash
# 1. 检查你连接的数据库
psql -d finapp_test -c "SELECT current_database();"

# 2. 检查 schema
psql -d finapp_test -c "\dn"

# 3. 检查表
psql -d finapp_test -c "\dt finapp.*" | grep price

# 4. 运行完整检查脚本
./check-sync-tables.sh
```

---

## 💡 总结

**表确实存在！** 位置是：

```
数据库: finapp_test
Schema: finapp
表名:
  - price_data_sources
  - price_sync_tasks
  - price_sync_logs
  - price_sync_errors
```

**最简单的访问方式：**

```bash
# 方法 1: 运行检查脚本
./check-sync-tables.sh

# 方法 2: 直接查询
psql -d finapp_test -c "SELECT * FROM finapp.price_sync_logs ORDER BY started_at DESC LIMIT 5;"
```

---

**创建时间**: 2025-10-27  
**问题**: 在 finapp_test 数据库的 finapp schema 下找不到 API 同步的表  
**答案**: 表确实存在，可能是工具显示问题或 schema 路径问题  
**解决方案**: 使用命令行或运行检查脚本
