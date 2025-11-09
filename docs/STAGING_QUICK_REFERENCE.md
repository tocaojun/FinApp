# 准生产环境快速参考

## 🎯 快速迁移流程

### 前提条件

```bash
# 1. 验证备份文件
ls -lh /Users/caojun/code/FinApp/backups/finapp_test_backup_standard_data.sql.gz

# 2. 确保有 SSH 访问权限
ssh staging-user@<staging-server> "echo '✅ SSH 连接正常'"
```

### 3 分钟快速迁移

```bash
#!/bin/bash
# 快速迁移脚本

BACKUP_FILE="/Users/caojun/code/FinApp/backups/finapp_test_backup_standard_data.sql.gz"
STAGING_HOST="<staging-db-host>"
STAGING_USER="staging-user"

echo "📦 第一步：上传备份文件..."
scp $BACKUP_FILE $STAGING_USER@$STAGING_HOST:/tmp/finapp_backup.sql.gz

echo "🗄️ 第二步：创建数据库..."
ssh $STAGING_USER@$STAGING_HOST << 'EOF'
psql -h localhost -U postgres << SQL
CREATE USER finapp_staging WITH PASSWORD 'your-secure-password';
CREATE DATABASE finapp_staging OWNER finapp_staging ENCODING 'UTF8';
CREATE SCHEMA finapp AUTHORIZATION finapp_staging;
SQL
EOF

echo "📥 第三步：恢复备份..."
ssh $STAGING_USER@$STAGING_HOST << 'EOF'
cd /tmp
gunzip -c finapp_backup.sql.gz | psql -h localhost -U finapp_staging -d finapp_staging
EOF

echo "✅ 迁移完成！"
```

---

## 🔧 环境变量配置

### 后端环境变量（`.env.staging`）

```env
# Database
DATABASE_URL="postgresql://finapp_staging:PASSWORD@<staging-host>:5432/finapp_staging?schema=finapp&client_encoding=utf8"

# Server
PORT=8000
NODE_ENV="staging"

# Security
JWT_SECRET="<generate-secure-random-string>"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Network
CORS_ORIGIN="https://staging.yourdomain.com,https://staging-api.yourdomain.com"

# Services
ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true
EXCHANGE_RATE_UPDATE_SCHEDULE="0 */6 * * *"
```

### 前端环境变量（`.env.staging`）

```env
VITE_API_BASE_URL=https://staging-api.yourdomain.com/api
VITE_APP_TITLE=FinApp (Staging)
```

---

## 📊 数据库连接信息

| 配置项 | 值 |
|--------|-----|
| 数据库名 | `finapp_staging` |
| Schema | `finapp` |
| 用户名 | `finapp_staging` |
| 端口 | `5432` |
| 表数量 | 33 |
| 估计大小 | ~50MB |

---

## ✅ 验证清单

### 迁移后验证

```bash
# 1. 检查数据库连接
psql -h <staging-host> -U finapp_staging -d finapp_staging -c "SELECT 1;"

# 2. 验证表数量
psql -h <staging-host> -U finapp_staging -d finapp_staging -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='finapp';"

# 3. 检查核心数据
psql -h <staging-host> -U finapp_staging -d finapp_staging << 'EOF'
SELECT 
  'users' as table_name, COUNT(*) as count FROM finapp.users
UNION ALL
SELECT 'portfolios', COUNT(*) FROM finapp.portfolios
UNION ALL
SELECT 'transactions', COUNT(*) FROM finapp.transactions
ORDER BY table_name;
EOF

# 4. 验证清理数据
psql -h <staging-host> -U finapp_staging -d finapp_staging -c \
  "SELECT COUNT(*) as assets_count FROM finapp.assets;"  # 应返回 0

# 5. 测试后端连接
curl -X GET http://staging-api.yourdomain.com:8000/health
```

---

## 🐛 常见问题快速解决

### 问题：`FATAL: database "finapp_staging" does not exist`

**解决方案：**
```bash
# 检查数据库是否存在
psql -h <staging-host> -U postgres -l | grep finapp_staging

# 如果不存在，重新创建
psql -h <staging-host> -U postgres << 'EOF'
CREATE DATABASE finapp_staging OWNER finapp_staging ENCODING 'UTF8';
EOF
```

### 问题：`ERROR: permission denied`

**解决方案：**
```bash
# 重新授予权限
psql -h <staging-host> -U postgres << 'EOF'
GRANT ALL PRIVILEGES ON DATABASE finapp_staging TO finapp_staging;
GRANT USAGE, CREATE ON SCHEMA finapp TO finapp_staging;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA finapp TO finapp_staging;
EOF
```

### 问题：备份恢复时出错

**解决方案：**
```bash
# 验证备份文件完整性
gunzip -t /tmp/finapp_backup.sql.gz

# 如果损坏，从原文件重新传输
scp /Users/caojun/code/FinApp/backups/finapp_test_backup_standard_data.sql.gz \
    staging-user@<staging-host>:/tmp/finapp_backup.sql.gz
```

---

## 🚨 紧急回滚

如果出现严重问题：

```bash
# 1. 停止应用
systemctl stop finapp-backend

# 2. 删除受损数据库
psql -h <staging-host> -U postgres -c "DROP DATABASE finapp_staging;"

# 3. 从另一个备份点恢复
scp /Users/caojun/code/FinApp/backups/finapp_test_backup_1109.sql.gz \
    staging-user@<staging-host>:/tmp/finapp_backup_rollback.sql.gz

# 4. 恢复数据库（重复迁移步骤）

# 5. 重启应用
systemctl start finapp-backend
```

---

## 📋 部署检查清单

**迁移前：**
- [ ] 备份文件有效性已验证
- [ ] SSH 访问已测试
- [ ] 准生产服务器已准备好
- [ ] 所有必要的权限已配置

**迁移中：**
- [ ] 备份已上传
- [ ] 数据库已创建
- [ ] 数据已恢复
- [ ] 没有错误信息

**迁移后：**
- [ ] 数据库连接正常
- [ ] 所有表存在
- [ ] 核心数据完整
- [ ] 应用启动成功
- [ ] 功能测试通过

---

## 📞 关键命令速查表

```bash
# 连接准生产数据库
psql -h <staging-host> -U finapp_staging -d finapp_staging

# 查看表列表
\dt finapp.

# 查看表行数
SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;

# 查看数据库大小
SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) 
FROM pg_database 
WHERE datname = 'finapp_staging';

# 查看连接数
SELECT datname, count(*) FROM pg_stat_activity WHERE datname='finapp_staging' GROUP BY datname;

# 断开所有连接
SELECT pg_terminate_backend(pg_stat_activity.pid) 
FROM pg_stat_activity 
WHERE pg_stat_activity.datname = 'finapp_staging' 
  AND pid <> pg_backend_pid();
```

---

**最后更新**：2025-11-09  
**版本**：v1.0
