# Prisma Studio 查看 API 同步表的故障排查指南

## ❌ 问题：在 Prisma Studio 中找不到 API 同步相关的表

### 问题原因

Prisma Studio 默认只显示 Prisma Schema 中定义的模型（models），而 API 同步相关的表可能：
1. 没有在 Prisma Schema 中定义
2. 使用了原生 SQL 创建，未通过 Prisma 迁移

---

## ✅ 解决方案

### 方案 1: 使用命令行直接查询（推荐）

```bash
# 连接到数据库
psql -d finapp_test

# 查看所有 price 相关的表
\dt finapp.price*

# 查看表结构
\d finapp.price_sync_logs

# 查询数据
SELECT * FROM finapp.price_sync_logs ORDER BY started_at DESC LIMIT 10;
```

### 方案 2: 在 Prisma Studio 中查看

#### 步骤 1: 检查 Prisma Schema

查看 `backend/prisma/schema.prisma` 文件，确认是否包含这些模型：

```prisma
// 这些模型可能不存在，需要添加
model PriceDataSource {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String   @db.VarChar(100)
  provider        String   @db.VarChar(50)
  // ... 其他字段
  
  @@map("price_data_sources")
  @@schema("finapp")
}

model PriceSyncTask {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String   @db.VarChar(100)
  // ... 其他字段
  
  @@map("price_sync_tasks")
  @@schema("finapp")
}

model PriceSyncLog {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  taskId          String?  @map("task_id") @db.Uuid
  // ... 其他字段
  
  @@map("price_sync_logs")
  @@schema("finapp")
}

model PriceSyncError {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  logId           String   @map("log_id") @db.Uuid
  // ... 其他字段
  
  @@map("price_sync_errors")
  @@schema("finapp")
}
```

#### 步骤 2: 如果模型不存在，使用 Prisma Introspect

```bash
cd /Users/caojun/code/FinApp/backend

# 从数据库反向生成 Prisma Schema
npx prisma db pull

# 重新生成 Prisma Client
npx prisma generate

# 重启 Prisma Studio
npx prisma studio
```

### 方案 3: 使用 pgAdmin 或 DBeaver（图形化工具）

如果你更喜欢图形化界面：

#### 安装 pgAdmin
```bash
brew install --cask pgadmin4
```

#### 连接配置
- Host: localhost
- Port: 5432
- Database: finapp_test
- Username: finapp_user
- Password: finapp_password

然后导航到：
```
Servers → localhost → Databases → finapp_test → Schemas → finapp → Tables
```

---

## 🔍 验证表是否存在

### 使用 psql 命令行

```bash
# 方法 1: 列出所有 price 相关的表
psql -d finapp_test -c "\dt finapp.price*"

# 方法 2: 查询系统表
psql -d finapp_test -c "
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'finapp' 
  AND tablename LIKE '%price%' 
  OR tablename LIKE '%sync%'
ORDER BY tablename;
"

# 方法 3: 查看表的记录数
psql -d finapp_test -c "
SELECT 
  'price_data_sources' as table_name,
  COUNT(*) as row_count
FROM finapp.price_data_sources
UNION ALL
SELECT 
  'price_sync_tasks',
  COUNT(*)
FROM finapp.price_sync_tasks
UNION ALL
SELECT 
  'price_sync_logs',
  COUNT(*)
FROM finapp.price_sync_logs
UNION ALL
SELECT 
  'price_sync_errors',
  COUNT(*)
FROM finapp.price_sync_errors;
"
```

### 预期输出

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

---

## 📊 当前数据库状态

### 确认的信息

```
数据库名称: finapp_test
Schema: finapp
用户: finapp_user (所有者) / caojun (当前用户)

API 同步相关表（已确认存在）:
✅ finapp.price_data_sources  (2 条记录)
✅ finapp.price_sync_tasks    (1 条记录)
✅ finapp.price_sync_logs     (10 条记录)
✅ finapp.price_sync_errors   (未知)
```

### 查看最新的同步日志

```bash
psql -d finapp_test -c "
SELECT 
    id,
    started_at,
    completed_at,
    status,
    total_assets,
    total_records,
    success_count,
    failed_count,
    error_message
FROM finapp.price_sync_logs
ORDER BY started_at DESC
LIMIT 5;
"
```

---

## 🛠️ 常见问题

### Q1: Prisma Studio 中看不到这些表

**原因**: Prisma Schema 中没有定义这些模型

**解决**:
```bash
cd backend
npx prisma db pull  # 从数据库拉取表结构
npx prisma generate # 重新生成客户端
npx prisma studio   # 重启 Prisma Studio
```

### Q2: 使用 `SELECT * FROM price_sync_logs` 报错

**错误**: `relation "price_sync_logs" does not exist`

**原因**: 没有指定 schema

**解决**: 使用完整的表名
```sql
-- ❌ 错误
SELECT * FROM price_sync_logs;

-- ✅ 正确
SELECT * FROM finapp.price_sync_logs;
```

### Q3: 权限不足

**错误**: `permission denied for schema finapp`

**解决**: 确认用户权限
```sql
-- 检查当前用户
SELECT current_user;

-- 授予权限（如果需要）
GRANT USAGE ON SCHEMA finapp TO caojun;
GRANT SELECT ON ALL TABLES IN SCHEMA finapp TO caojun;
```

### Q4: search_path 设置问题

**问题**: 默认 search_path 不包含 finapp schema

**解决**: 临时设置 search_path
```sql
-- 设置当前会话的 search_path
SET search_path TO finapp, public;

-- 现在可以直接查询
SELECT * FROM price_sync_logs LIMIT 5;
```

或永久设置：
```sql
-- 为用户设置默认 search_path
ALTER USER caojun SET search_path TO finapp, public;
```

---

## 📋 快速检查清单

使用以下命令快速检查所有内容：

```bash
#!/bin/bash
echo "=== 数据库连接测试 ==="
psql -d finapp_test -c "SELECT current_database(), current_user;"

echo -e "\n=== Schema 列表 ==="
psql -d finapp_test -c "\dn"

echo -e "\n=== API 同步相关表 ==="
psql -d finapp_test -c "\dt finapp.price*"

echo -e "\n=== 表记录数统计 ==="
psql -d finapp_test -c "
SELECT 
  'price_data_sources' as table_name,
  COUNT(*) as row_count
FROM finapp.price_data_sources
UNION ALL
SELECT 'price_sync_tasks', COUNT(*) FROM finapp.price_sync_tasks
UNION ALL
SELECT 'price_sync_logs', COUNT(*) FROM finapp.price_sync_logs
UNION ALL
SELECT 'price_sync_errors', COUNT(*) FROM finapp.price_sync_errors;
"

echo -e "\n=== 最新同步日志 ==="
psql -d finapp_test -c "
SELECT 
    started_at,
    status,
    total_records,
    error_message
FROM finapp.price_sync_logs
ORDER BY started_at DESC
LIMIT 3;
"
```

保存为 `check_sync_tables.sh` 并运行：
```bash
chmod +x check_sync_tables.sh
./check_sync_tables.sh
```

---

## 🎯 推荐的查询方式

### 方式 1: 命令行（最直接）

```bash
# 启动 psql
psql -d finapp_test

# 设置 search_path（可选）
SET search_path TO finapp, public;

# 查询
SELECT * FROM price_sync_logs ORDER BY started_at DESC LIMIT 10;
```

### 方式 2: Prisma Studio（需要先配置）

```bash
cd backend
npx prisma db pull    # 同步表结构
npx prisma generate   # 生成客户端
npx prisma studio     # 启动 Studio
```

### 方式 3: 应用代码中查询

```typescript
// 使用原生 SQL
const logs = await prisma.$queryRaw`
  SELECT * FROM finapp.price_sync_logs
  ORDER BY started_at DESC
  LIMIT 10
`;

// 或者如果已经定义了模型
const logs = await prisma.priceSyncLog.findMany({
  orderBy: { startedAt: 'desc' },
  take: 10,
});
```

---

## 📞 需要帮助？

如果以上方法都无法解决问题，请提供以下信息：

1. 你使用的工具（Prisma Studio / pgAdmin / psql / 其他）
2. 完整的错误信息
3. 运行以下命令的输出：
   ```bash
   psql -d finapp_test -c "\dt finapp.price*"
   ```

---

**创建时间**: 2025-10-27  
**最后更新**: 2025-10-27  
**维护人员**: 开发团队  
**版本**: v1.0
