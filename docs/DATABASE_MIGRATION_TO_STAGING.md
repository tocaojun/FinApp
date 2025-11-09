# 数据库迁移到准生产环境指南

## 📋 概述

本指南详细说明如何将当前开发环境的数据库（`finapp_test`）迁移到准生产环境。

**当前状态：**
- 开发环境数据库：`finapp_test`（localhost:5432）
- 最新备份：`finapp_test_backup_standard_data.sql.gz`（50K）
- 核心业务数据：用户、投资组合、交易记录、汇率等已保留
- 已清理数据：assets 和 asset_prices 已清理

---

## 🔍 迁移前检查清单

在开始迁移前，请确认以下事项：

### 备份完整性
- [ ] `finapp_test_backup_standard_data.sql.gz` 存在
- [ ] 确认备份文件大小正常（50K）
- [ ] 验证文件有效性：`gunzip -t finapp_test_backup_standard_data.sql.gz`

### 准生产环境准备
- [ ] 准生产环境 PostgreSQL 已安装（版本 >= 13）
- [ ] PostgreSQL 服务已正常运行
- [ ] 准生产环境数据库用户已创建
- [ ] 准生产环境有足够磁盘空间（预留 500MB+）
- [ ] 网络连接正常

### 代码部署
- [ ] 最新代码已提交到 GitHub ✅
- [ ] 所有数据库迁移脚本已同步
- [ ] 依赖包版本已锁定

---

## 🚀 迁移步骤

### 第一步：准备准生产环境数据库

#### 1.1 在准生产环境创建数据库用户和数据库

```bash
# 使用 postgres 超级用户连接到准生产 PostgreSQL
psql -h <staging-db-host> -U postgres << 'EOF'

-- 创建数据库用户
CREATE USER finapp_staging WITH PASSWORD 'your-secure-password-here';
ALTER USER finapp_staging WITH CREATEDB;

-- 创建数据库
CREATE DATABASE finapp_staging 
  OWNER finapp_staging 
  ENCODING 'UTF8' 
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8';

-- 授予权限
GRANT CONNECT ON DATABASE finapp_staging TO finapp_staging;
GRANT USAGE ON SCHEMA public TO finapp_staging;

\echo '✅ 数据库创建完成'
EOF
```

#### 1.2 创建 finapp Schema

```bash
psql -h <staging-db-host> -U finapp_staging -d finapp_staging << 'EOF'

-- 创建 schema
CREATE SCHEMA IF NOT EXISTS finapp AUTHORIZATION finapp_staging;

-- 授予权限
GRANT USAGE ON SCHEMA finapp TO finapp_staging;
GRANT CREATE ON SCHEMA finapp TO finapp_staging;
ALTER DEFAULT PRIVILEGES IN SCHEMA finapp GRANT ALL ON TABLES TO finapp_staging;
ALTER DEFAULT PRIVILEGES IN SCHEMA finapp GRANT ALL ON SEQUENCES TO finapp_staging;

\echo '✅ Schema 创建完成'
EOF
```

### 第二步：传输备份文件

#### 2.1 上传备份到准生产服务器

```bash
# 假设你有 SSH 访问权限
scp /Users/caojun/code/FinApp/backups/finapp_test_backup_standard_data.sql.gz \
    staging-user@<staging-server>:/tmp/finapp_backup.sql.gz

echo "✅ 备份文件上传完成"
```

#### 2.2 备份文件验证

```bash
# 在准生产服务器上验证文件
ssh staging-user@<staging-server> << 'EOF'

# 检查文件大小
ls -lh /tmp/finapp_backup.sql.gz

# 验证 gzip 文件完整性
gunzip -t /tmp/finapp_backup.sql.gz && echo "✅ 备份文件完整" || echo "❌ 备份文件损坏"

EOF
```

### 第三步：恢复数据库备份

#### 3.1 在准生产环境恢复数据

```bash
# 在准生产服务器上执行
ssh staging-user@<staging-server> << 'EOF'

cd /tmp

# 解压缩备份
gunzip -c finapp_backup.sql.gz > finapp_backup.sql

# 恢复数据库到准生产环境
echo "开始恢复数据库..."
psql -h localhost -U finapp_staging -d finapp_staging < finapp_backup.sql

echo "✅ 数据库恢复完成"

# 验证恢复成功
psql -h localhost -U finapp_staging -d finapp_staging << 'VERIFY'
\echo '=== 数据库恢复验证 ==='
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'finapp';
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'finapp';
VERIFY

EOF
```

### 第四步：数据完整性验证

#### 4.1 验证核心业务数据

```bash
psql -h <staging-db-host> -U finapp_staging -d finapp_staging << 'EOF'

-- 检查主要表的记录数
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

-- 检查是否清理成功（assets 和 asset_prices 应为 0）
\echo '=== 数据清理验证 ==='
SELECT 
  (SELECT COUNT(*) FROM finapp.assets) as assets_count,
  (SELECT COUNT(*) FROM finapp.asset_prices) as asset_prices_count;

EOF
```

#### 4.2 验证数据库配置

```bash
psql -h <staging-db-host> -U finapp_staging -d finapp_staging << 'EOF'

-- 检查重要的函数和触发器
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'finapp' LIMIT 10;

-- 检查索引
SELECT indexname FROM pg_indexes WHERE schemaname = 'finapp' LIMIT 10;

EOF
```

### 第五步：应用数据库迁移（如有新迁移）

如果自上次备份以来有新的迁移脚本，需要应用：

```bash
cd /path/to/FinApp/backend

# 配置准生产环境的数据库连接
export DATABASE_URL="postgresql://finapp_staging:password@<staging-db-host>:5432/finapp_staging?schema=finapp"

# 查看待应用的迁移
npx prisma migrate status

# 应用新迁移
npx prisma migrate deploy

echo "✅ 数据库迁移完成"
```

### 第六步：更新应用配置

#### 6.1 准生产环境后端配置（`.env.staging`）

```env
# 数据库配置
DATABASE_URL="postgresql://finapp_staging:secure-password@<staging-db-host>:5432/finapp_staging?schema=finapp&client_encoding=utf8"

# JWT 配置
JWT_SECRET="change-this-to-a-secure-random-key-in-production"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# 服务器配置
PORT=8000
NODE_ENV="staging"

# 日志配置
LOG_LEVEL="info"

# CORS 配置
CORS_ORIGIN="https://staging.yourdomain.com,https://staging-api.yourdomain.com"

# 缓存配置
CACHE_TTL=3600
CACHE_MAX_KEYS=1000

# 汇率自动更新配置
ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true
EXCHANGE_RATE_UPDATE_SCHEDULE="0 */6 * * *"

# 禁用开发模式特性
ENABLE_WEALTH_MONITORING=true
```

#### 6.2 准生产环境前端配置（`.env.staging`）

```env
VITE_API_BASE_URL=https://staging-api.yourdomain.com/api
VITE_APP_TITLE=FinApp (Staging)
```

### 第七步：部署和测试

#### 7.1 部署应用

```bash
# 在准生产服务器上部署
cd /path/to/FinApp

# 安装依赖
npm install --legacy-peer-deps

# 编译后端
cd backend
npm run build

# 编译前端
cd ../frontend
npm run build
```

#### 7.2 健康检查

```bash
# 检查后端健康状态
curl -X GET http://localhost:8000/health

# 检查数据库连接
curl -X GET http://localhost:8000/api/health/db

# 检查前端是否可访问
curl -X GET http://staging.yourdomain.com
```

#### 7.3 功能验证

- [ ] 用户可以正常登录
- [ ] 可以查看投资组合数据
- [ ] 可以查看交易记录
- [ ] 可以查看汇率数据
- [ ] 可以执行汇率同步操作
- [ ] 管理员功能可正常使用

---

## ⚠️ 风险管理

### 常见问题与解决方案

#### 问题 1：连接超时

```bash
# 检查网络连接
ping <staging-db-host>

# 检查 PostgreSQL 服务状态
psql -h <staging-db-host> -U postgres -c "SELECT 1;"

# 检查防火墙规则
# 确保 5432 端口已开放
```

#### 问题 2：权限不足

```bash
# 检查用户权限
psql -h <staging-db-host> -U postgres -c "
  SELECT usename, usecanlogin, usecreatedb 
  FROM pg_user WHERE usename = 'finapp_staging';
"

# 重新授予权限
psql -h <staging-db-host> -U postgres -c "
  GRANT ALL PRIVILEGES ON DATABASE finapp_staging TO finapp_staging;
  GRANT ALL PRIVILEGES ON SCHEMA finapp TO finapp_staging;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA finapp TO finapp_staging;
"
```

#### 问题 3：数据恢复失败

```bash
# 检查备份文件是否完整
gunzip -t /tmp/finapp_backup.sql.gz

# 查看恢复错误日志
psql -h <staging-db-host> -U finapp_staging -d finapp_staging < finapp_backup.sql 2>&1 | tail -50

# 必要时从其他备份点恢复
psql -h <staging-db-host> -U finapp_staging -d finapp_staging < /tmp/finapp_test_backup_1109.sql.gz
```

### 回滚方案

如果迁移失败，可以快速回滚：

```bash
# 删除准生产数据库
psql -h <staging-db-host> -U postgres -c "
  DROP DATABASE IF EXISTS finapp_staging;
  DROP USER IF EXISTS finapp_staging;
"

# 重新从备份恢复
# 重复执行 第一步 到 第三步
```

---

## 📊 迁移后检查清单

迁移完成后，请按以下清单验证：

- [ ] 数据库连接正常
- [ ] 所有核心表存在且有数据
- [ ] assets 和 asset_prices 表已清理（记录数为 0）
- [ ] 用户账户可正常登录
- [ ] API 端点响应正常
- [ ] 汇率数据可查看
- [ ] 投资组合数据完整
- [ ] 交易记录可查看
- [ ] 管理员功能可使用
- [ ] 性能满足要求

---

## 📝 备份和恢复参考

### 常用备份命令

```bash
# 完整数据库备份
pg_dump -h <staging-db-host> -U finapp_staging -d finapp_staging | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 仅备份 finapp schema
pg_dump -h <staging-db-host> -U finapp_staging -d finapp_staging -n finapp | gzip > schema_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 备份特定表
pg_dump -h <staging-db-host> -U finapp_staging -d finapp_staging -t finapp.users | gzip > users_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 恢复命令

```bash
# 完整恢复
gunzip -c backup_file.sql.gz | psql -h <staging-db-host> -U finapp_staging -d finapp_staging

# Schema 恢复
gunzip -c schema_backup.sql.gz | psql -h <staging-db-host> -U finapp_staging -d finapp_staging

# 表恢复
gunzip -c users_backup.sql.gz | psql -h <staging-db-host> -U finapp_staging -d finapp_staging
```

---

## 📞 支持信息

| 项目 | 值 |
|------|-----|
| 数据库类型 | PostgreSQL 13+ |
| 数据库名 | finapp_staging |
| Schema | finapp |
| 总表数 | 33 |
| 主要备份位置 | `/Users/caojun/code/FinApp/backups/` |
| 备份保留期 | 建议 30 天 |

---

**文档版本**：v1.0  
**创建日期**：2025-11-09  
**适用范围**：准生产环境迁移  
**优先级**：🔴 高  
