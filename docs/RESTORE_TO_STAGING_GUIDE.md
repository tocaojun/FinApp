# 备份恢复到准生产环境指南

## 📋 备份信息

**备份文件：** `finapp_test_backup_20251109_151633.sql.gz`
- **大小**：50KB（压缩后）
- **原始大小**：~270KB
- **备份时间**：2025-11-09 15:16:33
- **源数据库**：`finapp_test`（开发环境）
- **用途**：恢复到准生产环境测试
- **完整性**：✅ 验证通过

---

## 🚀 恢复到准生产环境的完整步骤

### 前置条件检查

在开始恢复前，确保以下条件满足：

```bash
# 1. 验证备份文件存在且完整
ls -lh /Users/caojun/code/FinApp/backups/finapp_test_backup_20251109_151633.sql.gz
gunzip -t /Users/caojun/code/FinApp/backups/finapp_test_backup_20251109_151633.sql.gz

# 2. 检查 SSH 连接
ssh staging-user@<staging-host> "echo '✅ SSH 连接正常'"

# 3. 检查准生产环境 PostgreSQL 服务
ssh staging-user@<staging-host> "psql -U postgres -c 'SELECT version();'"
```

---

## 📥 恢复步骤（分场景）

### 方案 A：准生产环境已有 finapp_staging 数据库

#### 步骤 1：备份现有数据库（可选但推荐）

```bash
# 在准生产服务器上执行
ssh staging-user@<staging-host> << 'EOF'

# 备份现有的 finapp_staging 数据库
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U finapp_staging -d finapp_staging | \
  gzip > /tmp/finapp_staging_backup_${TIMESTAMP}.sql.gz

echo "✅ 现有数据库已备份到 /tmp/finapp_staging_backup_${TIMESTAMP}.sql.gz"

EOF
```

#### 步骤 2：删除现有数据库

```bash
# 在准生产服务器上执行
ssh staging-user@<staging-host> << 'EOF'

psql -h localhost -U postgres << 'SQL'
-- 断开所有连接
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'finapp_staging' AND pid != pg_backend_pid();

-- 删除现有数据库
DROP DATABASE IF EXISTS finapp_staging;

\echo '✅ 现有数据库已删除'
SQL

EOF
```

#### 步骤 3：创建新数据库

```bash
# 在准生产服务器上执行
ssh staging-user@<staging-host> << 'EOF'

psql -h localhost -U postgres << 'SQL'

-- 创建新的 finapp_staging 数据库
CREATE DATABASE finapp_staging 
  OWNER finapp_staging 
  ENCODING 'UTF8' 
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8';

-- 创建 finapp schema
CREATE SCHEMA finapp AUTHORIZATION finapp_staging;

-- 授予权限
GRANT USAGE ON SCHEMA finapp TO finapp_staging;
GRANT CREATE ON SCHEMA finapp TO finapp_staging;
ALTER DEFAULT PRIVILEGES IN SCHEMA finapp GRANT ALL ON TABLES TO finapp_staging;
ALTER DEFAULT PRIVILEGES IN SCHEMA finapp GRANT ALL ON SEQUENCES TO finapp_staging;

\echo '✅ 新数据库创建完成'
SQL

EOF
```

### 方案 B：准生产环境还没有 finapp_staging 数据库

#### 步骤 1：创建数据库用户（如果未创建）

```bash
# 在准生产服务器上执行
ssh staging-user@<staging-host> << 'EOF'

psql -h localhost -U postgres << 'SQL'

-- 创建数据库用户（如果已存在会报错，使用 CREATE USER IF NOT EXISTS 在新版 PostgreSQL 中）
CREATE USER finapp_staging WITH PASSWORD 'your-secure-password-here';
ALTER USER finapp_staging WITH CREATEDB;

\echo '✅ 数据库用户创建完成'
SQL

EOF
```

#### 步骤 2：创建空数据库和 Schema

```bash
# 在准生产服务器上执行
ssh staging-user@<staging-host> << 'EOF'

psql -h localhost -U postgres << 'SQL'

CREATE DATABASE finapp_staging 
  OWNER finapp_staging 
  ENCODING 'UTF8' 
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8';

CREATE SCHEMA finapp AUTHORIZATION finapp_staging;

GRANT USAGE ON SCHEMA finapp TO finapp_staging;
GRANT CREATE ON SCHEMA finapp TO finapp_staging;
ALTER DEFAULT PRIVILEGES IN SCHEMA finapp GRANT ALL ON TABLES TO finapp_staging;
ALTER DEFAULT PRIVILEGES IN SCHEMA finapp GRANT ALL ON SEQUENCES TO finapp_staging;

\echo '✅ 新数据库和 Schema 创建完成'
SQL

EOF
```

---

## 📤 传输和恢复备份文件

### 步骤 3：上传备份文件到准生产服务器

```bash
# 从本地执行
scp /Users/caojun/code/FinApp/backups/finapp_test_backup_20251109_151633.sql.gz \
    staging-user@<staging-host>:/tmp/finapp_backup.sql.gz

echo "✅ 备份文件上传完成"
```

### 步骤 4：在准生产环境验证备份文件

```bash
# 在准生产服务器上执行
ssh staging-user@<staging-host> << 'EOF'

# 验证文件大小
echo "备份文件大小："
ls -lh /tmp/finapp_backup.sql.gz

# 验证文件完整性
echo "验证文件完整性..."
gunzip -t /tmp/finapp_backup.sql.gz && echo "✅ 备份文件完整" || echo "❌ 备份文件损坏"

EOF
```

### 步骤 5：恢复备份到准生产环境

```bash
# 在准生产服务器上执行
ssh staging-user@<staging-host> << 'EOF'

cd /tmp

# 解压缩备份
echo "正在解压缩备份文件..."
gunzip -c finapp_backup.sql.gz > finapp_backup.sql

# 恢复数据库
echo "开始恢复数据库..."
psql -h localhost -U finapp_staging -d finapp_staging < finapp_backup.sql 2>&1 | tail -20

echo "✅ 数据库恢复完成"

EOF
```

---

## ✅ 验证恢复结果

### 步骤 6：验证数据库恢复完整性

```bash
# 验证数据库和 Schema 存在
psql -h <staging-host> -U finapp_staging -d finapp_staging << 'EOF'

\echo '=== 1. 检查 Schema ==='
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'finapp';

\echo '=== 2. 检查表数量 ==='
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'finapp';

\echo '=== 3. 检查核心数据 ==='
SELECT 'users' as table_name, COUNT(*) as record_count FROM finapp.users
UNION ALL
SELECT 'portfolios', COUNT(*) FROM finapp.portfolios
UNION ALL
SELECT 'transactions', COUNT(*) FROM finapp.transactions
UNION ALL
SELECT 'exchange_rates', COUNT(*) FROM finapp.exchange_rates
UNION ALL
SELECT 'asset_types', COUNT(*) FROM finapp.asset_types
UNION ALL
SELECT 'price_data_sources', COUNT(*) FROM finapp.price_data_sources
UNION ALL
SELECT 'assets', COUNT(*) FROM finapp.assets
UNION ALL
SELECT 'asset_prices', COUNT(*) FROM finapp.asset_prices
ORDER BY table_name;

\echo '=== 4. 检查数据是否清理 ==='
SELECT 
  (SELECT COUNT(*) FROM finapp.assets) as assets_count,
  (SELECT COUNT(*) FROM finapp.asset_prices) as asset_prices_count;

EOF
```

### 步骤 7：检查数据库大小和连接

```bash
# 检查数据库大小
psql -h <staging-host> -U postgres << 'EOF'

SELECT 
  datname,
  pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
WHERE datname = 'finapp_staging';

-- 检查连接数
SELECT datname, count(*) as connections 
FROM pg_stat_activity 
WHERE datname = 'finapp_staging' 
GROUP BY datname;

EOF
```

---

## 🔄 快速恢复脚本

如果你想一次性执行所有步骤，可以使用以下脚本：

```bash
#!/bin/bash
# 完整的恢复脚本

set -e  # 错误时退出

BACKUP_FILE="/Users/caojun/code/FinApp/backups/finapp_test_backup_20251109_151633.sql.gz"
STAGING_HOST="<staging-host>"
STAGING_USER="staging-user"
STAGING_DB_USER="finapp_staging"
STAGING_DB_PASS="your-secure-password"

echo "🚀 开始恢复 finapp_test 到准生产环境..."

# 第一步：验证备份文件
echo "📋 第一步：验证备份文件..."
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在：$BACKUP_FILE"
    exit 1
fi
gunzip -t "$BACKUP_FILE" || { echo "❌ 备份文件损坏"; exit 1; }
echo "✅ 备份文件验证通过"

# 第二步：上传备份文件
echo "📦 第二步：上传备份文件..."
scp "$BACKUP_FILE" "$STAGING_USER@$STAGING_HOST:/tmp/finapp_backup.sql.gz"
echo "✅ 备份文件上传完成"

# 第三步：在准生产环境创建/重建数据库
echo "🗄️ 第三步：创建数据库..."
ssh "$STAGING_USER@$STAGING_HOST" << REMOTE_SCRIPT
psql -h localhost -U postgres << 'SQL'
-- 删除现有数据库
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'finapp_staging' AND pid != pg_backend_pid();
DROP DATABASE IF EXISTS finapp_staging;

-- 创建新数据库
CREATE DATABASE finapp_staging 
  OWNER $STAGING_DB_USER 
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8';

-- 创建 schema
CREATE SCHEMA finapp AUTHORIZATION $STAGING_DB_USER;

-- 授予权限
GRANT USAGE ON SCHEMA finapp TO $STAGING_DB_USER;
GRANT CREATE ON SCHEMA finapp TO $STAGING_DB_USER;

SQL
REMOTE_SCRIPT
echo "✅ 数据库创建完成"

# 第四步：恢复备份
echo "📥 第四步：恢复备份数据..."
ssh "$STAGING_USER@$STAGING_HOST" << REMOTE_SCRIPT
cd /tmp
gunzip -c finapp_backup.sql.gz | psql -h localhost -U $STAGING_DB_USER -d finapp_staging
echo "✅ 备份数据恢复完成"
REMOTE_SCRIPT

# 第五步：验证恢复
echo "✅ 第五步：验证恢复结果..."
ssh "$STAGING_USER@$STAGING_HOST" psql -h localhost -U "$STAGING_DB_USER" -d finapp_staging << 'VERIFY'
SELECT 'users' as table_name, COUNT(*) as record_count FROM finapp.users
UNION ALL
SELECT 'portfolios', COUNT(*) FROM finapp.portfolios
UNION ALL
SELECT 'transactions', COUNT(*) FROM finapp.transactions
ORDER BY table_name;
VERIFY

echo "🎉 恢复完成！"
```

---

## 💡 故障排查

### 问题 1：连接超时

```bash
# 检查网络连接
ping <staging-host>

# 检查 PostgreSQL 端口是否开放
telnet <staging-host> 5432
```

### 问题 2：权限不足

```bash
# 检查用户权限
psql -h <staging-host> -U postgres -c "
  SELECT usename FROM pg_user WHERE usename = 'finapp_staging';
"

# 重新授予权限
psql -h <staging-host> -U postgres -c "
  GRANT ALL PRIVILEGES ON DATABASE finapp_staging TO finapp_staging;
  GRANT ALL PRIVILEGES ON SCHEMA finapp TO finapp_staging;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA finapp TO finapp_staging;
"
```

### 问题 3：恢复过程中出错

```bash
# 查看详细错误信息
gunzip -c /tmp/finapp_backup.sql.gz | \
  psql -h localhost -U finapp_staging -d finapp_staging 2>&1 | grep -i error

# 如果恢复失败，可以尝试使用 -v 参数获取更多信息
psql -h localhost -U finapp_staging -d finapp_staging -v ON_ERROR_STOP=1 < finapp_backup.sql
```

---

## 📊 恢复清单

在执行恢复前检查：

- [ ] 备份文件已验证完整性
- [ ] SSH 连接已测试
- [ ] 准生产 PostgreSQL 服务已启动
- [ ] 有足够的磁盘空间（至少 500MB）
- [ ] `finapp_staging` 用户已创建或将被创建
- [ ] 已备份准生产现有数据（如有）

执行恢复后检查：

- [ ] 数据库成功恢复
- [ ] 所有 33 个表都存在
- [ ] 核心业务数据完整
- [ ] 应用可以连接到准生产数据库
- [ ] 用户可以正常登录
- [ ] 功能测试通过

---

## 📞 技术支持

| 场景 | 解决方案 |
|------|--------|
| 备份文件损坏 | 重新从 `/Users/caojun/code/FinApp/backups/` 获取完整备份 |
| 恢复失败 | 检查磁盘空间和权限，参考故障排查部分 |
| 连接失败 | 检查网络和防火墙设置，确认 PostgreSQL 服务运行 |
| 数据不完整 | 验证备份文件完整性，重新恢复 |

---

**备份创建时间**：2025-11-09 15:16  
**备份文件**：`finapp_test_backup_20251109_151633.sql.gz`  
**恢复文档版本**：v1.0
