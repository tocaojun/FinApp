# 生产环境数据库迁移 - 快速指南

**⏱️ 预计时间**: 30-60分钟  
**📋 完整文档**: [DATABASE_MIGRATION_TO_PRODUCTION.md](DATABASE_MIGRATION_TO_PRODUCTION.md)

---

## 🚀 快速开始 (3步完成)

### 步骤1: 本地备份 (5-10分钟)

```bash
# 在本地 Mac 上执行
cd /Users/caojun/code/FinApp
bash scripts/backup-for-production.sh
```

**输出文件**:
- `backups/production-migration/finapp_production_backup_YYYYMMDD_HHMMSS.sql.gz`
- `backups/production-migration/backup_info_YYYYMMDD_HHMMSS.txt`

---

### 步骤2: 上传到生产服务器 (5-15分钟)

```bash
# 设置生产服务器信息
PROD_HOST="your-server-ip"        # 替换为实际IP
PROD_USER="ubuntu"                 # 替换为实际用户名
PROD_PATH="/home/ubuntu/finapp-backups"

# 上传文件
cd /Users/caojun/code/FinApp/backups/production-migration

# 方法1: 使用 scp
scp finapp_production_backup_*.sql.gz \
    backup_info_*.txt \
    $PROD_USER@$PROD_HOST:$PROD_PATH/

# 方法2: 使用 rsync (推荐，支持断点续传)
rsync -avz -P \
      finapp_production_backup_*.sql.gz \
      backup_info_*.txt \
      $PROD_USER@$PROD_HOST:$PROD_PATH/
```

---

### 步骤3: 生产服务器恢复 (15-30分钟)

```bash
# SSH 登录到生产服务器
ssh $PROD_USER@$PROD_HOST

# 执行恢复向导（交互式，会提示输入配置）
cd /home/ubuntu/finapp-backups
sudo bash production-restore-guide.sh

# 或者按照以下手动步骤执行...
```

#### 手动恢复步骤

```bash
# 1. 设置变量
PROD_DB_NAME="finapp_production"
PROD_DB_USER="finapp_prod_user"
PROD_DB_PASSWORD="your_secure_password"  # ⚠️ 使用强密码
PROD_SCHEMA="finapp"
BACKUP_FILE="/home/ubuntu/finapp-backups/finapp_production_backup_*.sql.gz"

# 2. 创建用户
sudo -u postgres psql << EOF
CREATE USER $PROD_DB_USER WITH PASSWORD '$PROD_DB_PASSWORD';
ALTER USER $PROD_DB_USER CREATEDB;
EOF

# 3. 创建数据库
sudo -u postgres psql << EOF
CREATE DATABASE $PROD_DB_NAME 
    WITH OWNER = $PROD_DB_USER 
    ENCODING = 'UTF8' 
    LC_COLLATE = 'en_US.UTF-8' 
    LC_CTYPE = 'en_US.UTF-8' 
    TEMPLATE = template0;
EOF

# 4. 创建 schema
sudo -u postgres psql -d $PROD_DB_NAME << EOF
CREATE SCHEMA IF NOT EXISTS $PROD_SCHEMA;
GRANT ALL ON SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;
ALTER DATABASE $PROD_DB_NAME SET search_path TO $PROD_SCHEMA, public;
EOF

# 5. 恢复数据
gunzip -c $BACKUP_FILE | PGPASSWORD=$PROD_DB_PASSWORD psql \
    -h localhost \
    -U $PROD_DB_USER \
    -d $PROD_DB_NAME

# 6. 设置权限
sudo -u postgres psql -d $PROD_DB_NAME << EOF
GRANT ALL ON SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA $PROD_SCHEMA GRANT ALL ON TABLES TO $PROD_DB_USER;
EOF

# 7. 验证
export PGPASSWORD=$PROD_DB_PASSWORD
psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -c "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = '$PROD_SCHEMA';"
```

---

## ✅ 验证清单

恢复完成后，检查以下项目:

```bash
# 设置密码环境变量
export PGPASSWORD="your_password"

# 1. 检查表数量 (应该是 ~33个)
psql -h localhost -U finapp_prod_user -d finapp_production -c "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'finapp';"

# 2. 检查主要表记录数
psql -h localhost -U finapp_prod_user -d finapp_production -c "
    SELECT 'users' as table_name, COUNT(*) FROM finapp.users
    UNION ALL SELECT 'portfolios', COUNT(*) FROM finapp.portfolios
    UNION ALL SELECT 'assets', COUNT(*) FROM finapp.assets
    UNION ALL SELECT 'transactions', COUNT(*) FROM finapp.transactions;"

# 3. 检查数据库大小
psql -h localhost -U finapp_prod_user -d finapp_production -c "
    SELECT pg_size_pretty(pg_database_size('finapp_production'));"

# 4. 测试连接字符串
psql "postgresql://finapp_prod_user:password@localhost:5432/finapp_production?schema=finapp" -c "SELECT version();"
```

---

## 📝 配置应用程序

创建 `.env.production` 文件:

```bash
cat > /home/ubuntu/finapp-production/.env.production << EOF
# 数据库配置
DATABASE_URL="postgresql://finapp_prod_user:your_password@localhost:5432/finapp_production?schema=finapp&client_encoding=utf8"

# JWT 配置 (⚠️ 生产环境必须使用强密钥)
JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# 服务器配置
PORT=8000
NODE_ENV="production"

# CORS 配置 (⚠️ 替换为实际域名)
CORS_ORIGIN="https://your-domain.com"

# 其他配置...
EOF

chmod 600 .env.production
```

---

## 🔒 安全配置

### 1. 配置防火墙

```bash
# 确保数据库端口不对外开放
sudo ufw deny 5432/tcp
sudo ufw reload
```

### 2. 配置 PostgreSQL

```bash
# 编辑 postgresql.conf
sudo vim /etc/postgresql/13/main/postgresql.conf

# 设置仅本地监听
listen_addresses = 'localhost'
```

### 3. 设置自动备份

```bash
# 创建备份脚本
cat > /home/ubuntu/finapp-production/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/finapp-backups/auto"
mkdir -p $BACKUP_DIR

PGPASSWORD="your_password" pg_dump \
    -h localhost \
    -U finapp_prod_user \
    -d finapp_production \
    --no-owner --no-privileges \
    | gzip > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# 保留最近30天的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /home/ubuntu/finapp-production/backup.sh

# 添加到 crontab (每天凌晨2点)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/finapp-production/backup.sh") | crontab -
```

---

## 🚨 常见问题

### 问题1: 权限不足

```bash
# 重新授权
sudo -u postgres psql -d finapp_production << EOF
GRANT ALL ON SCHEMA finapp TO finapp_prod_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA finapp TO finapp_prod_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA finapp TO finapp_prod_user;
EOF
```

### 问题2: 连接被拒绝

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 重启 PostgreSQL
sudo systemctl restart postgresql
```

### 问题3: Schema 找不到

```bash
# 设置搜索路径
psql -h localhost -U finapp_prod_user -d finapp_production -c "
    ALTER DATABASE finapp_production SET search_path TO finapp, public;"
```

---

## 📞 紧急回滚

如果需要回滚:

```bash
# 删除数据库
sudo -u postgres psql -c "DROP DATABASE IF EXISTS finapp_production;"

# 删除用户
sudo -u postgres psql -c "DROP USER IF EXISTS finapp_prod_user;"

# 重新开始迁移流程
```

---

## 🚀 启动应用服务

恢复数据库后，启动 FinApp 应用:

```bash
cd /home/ubuntu/finapp-production/FinApp

# 使用 Ubuntu 专用启动脚本
bash scripts/start-all-services-ubuntu.sh
```

### 启动脚本功能

✅ **自动检查和启动**:
- PostgreSQL 服务状态检查
- 数据库连接验证
- 生产数据库存在性检查
- 后端服务构建和启动
- 前端服务构建和启动

✅ **智能配置**:
- 自动生成 `.env.production` 配置
- 自动更新数据库名称为生产环境
- 设置生产环境变量
- 启用生产优化

✅ **健康检查**:
- 后端 API 健康检查
- 服务启动超时检测
- 实时日志输出

### 服务访问地址

启动成功后，可以通过以下地址访问:

```
🌐 前端应用:    http://localhost:3001
🔧 后端API:     http://localhost:8000
❤️  健康检查:    http://localhost:8000/health
```

### 其他 Ubuntu 脚本

```bash
# 停止所有服务
bash scripts/stop-all-services-ubuntu.sh

# 仅重启后端
bash scripts/restart-backend-ubuntu.sh

# 查看日志
tail -f logs/backend.log
tail -f logs/frontend.log
```

---

## 📚 参考文档

- **完整文档**: [DATABASE_MIGRATION_TO_PRODUCTION.md](DATABASE_MIGRATION_TO_PRODUCTION.md)
- **系统配置**: [../config/system-config.md](../config/system-config.md)
- **数据库设计**: [DATABASE_STRUCTURE_DESIGN.md](DATABASE_STRUCTURE_DESIGN.md)
- **启动脚本**: 
  - `scripts/start-all-services-ubuntu.sh` - Ubuntu 启动脚本
  - `scripts/stop-all-services-ubuntu.sh` - Ubuntu 停止脚本
  - `scripts/restart-backend-ubuntu.sh` - Ubuntu 后端重启脚本

---

**最后更新**: 2025-12-07  
**版本**: v1.1
