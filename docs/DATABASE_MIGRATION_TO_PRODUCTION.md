# 数据库迁移到生产环境操作指南

**日期**: 2025-12-02  
**目标**: 将本地开发环境数据库迁移到 Ubuntu 生产环境  
**数据库**: PostgreSQL 13+

---

## 📋 前置检查清单

在开始迁移前，请确认以下事项：

- [ ] 生产服务器已安装 PostgreSQL
- [ ] 生产服务器可以通过 SSH 访问
- [ ] 本地数据库运行正常
- [ ] 有足够的磁盘空间存储备份文件
- [ ] 已记录生产环境数据库配置信息
- [ ] 已通知相关人员进行数据库迁移

---

## 第一阶段：本地数据库备份

### 1.1 创建备份目录

```bash
cd /Users/caojun/code/FinApp
mkdir -p backups/production-migration
cd backups/production-migration
```

### 1.2 执行完整备份

```bash
# 设置备份文件名（带时间戳）
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="finapp_production_backup_${BACKUP_DATE}.sql"

# 执行完整备份
pg_dump -h localhost \
        -U finapp_user \
        -d finapp_test \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$BACKUP_FILE"

# 检查备份是否成功
if [ $? -eq 0 ]; then
    echo "✅ 数据库备份成功: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
else
    echo "❌ 数据库备份失败"
    exit 1
fi
```

**参数说明**:
- `--no-owner`: 不输出对象所有者信息（生产环境可能用户不同）
- `--no-privileges`: 不输出权限信息
- `--clean`: 在恢复前清理（删除）数据库对象
- `--if-exists`: 使用 IF EXISTS 子句删除对象

### 1.3 验证备份文件完整性

```bash
# 检查备份文件大小
du -h "$BACKUP_FILE"

# 检查备份文件头部（确认是有效的 SQL 文件）
head -20 "$BACKUP_FILE"

# 检查备份文件是否包含关键表
grep -i "CREATE TABLE" "$BACKUP_FILE" | head -10

# 统计表数量
grep -c "CREATE TABLE" "$BACKUP_FILE"
```

**期望输出**: 应该看到约 33 个表的创建语句

### 1.4 压缩备份文件（可选但推荐）

```bash
# 压缩备份文件
gzip "$BACKUP_FILE"

# 验证压缩文件
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"
ls -lh "$BACKUP_FILE_GZ"

# 测试压缩文件完整性
gunzip -t "$BACKUP_FILE_GZ"

if [ $? -eq 0 ]; then
    echo "✅ 压缩文件完整性验证通过"
else
    echo "❌ 压缩文件损坏"
    exit 1
fi
```

### 1.5 创建备份清单文件

```bash
# 创建备份信息文件
cat > "backup_info_${BACKUP_DATE}.txt" << EOF
=== FinApp 数据库备份信息 ===

备份时间: $(date)
备份文件: $BACKUP_FILE_GZ
文件大小: $(du -h "$BACKUP_FILE_GZ" | cut -f1)
源数据库: finapp_test
源主机: localhost
备份用户: finapp_user
PostgreSQL 版本: $(psql -h localhost -U finapp_user -d finapp_test -c "SELECT version();" -t)

表数量: $(grep -c "CREATE TABLE" <(gunzip -c "$BACKUP_FILE_GZ"))

=== 备份内容验证 ===
$(gunzip -c "$BACKUP_FILE_GZ" | grep "CREATE TABLE" | head -10)

=== MD5 校验和 ===
$(md5 "$BACKUP_FILE_GZ")

EOF

cat "backup_info_${BACKUP_DATE}.txt"
```

---

## 第二阶段：上传备份到生产服务器

### 2.1 配置生产服务器信息

```bash
# 设置生产服务器信息（请根据实际情况修改）
PROD_HOST="your-production-server.com"  # 生产服务器IP或域名
PROD_USER="ubuntu"                       # SSH 登录用户
PROD_PORT="22"                           # SSH 端口
PROD_PATH="/home/ubuntu/finapp-backups" # 备份文件存放路径

# 测试 SSH 连接
ssh -p $PROD_PORT $PROD_USER@$PROD_HOST "echo '✅ SSH 连接成功'"
```

### 2.2 在生产服务器创建目录

```bash
# 在生产服务器创建备份目录
ssh -p $PROD_PORT $PROD_USER@$PROD_HOST "mkdir -p $PROD_PATH"

# 验证目录创建成功
ssh -p $PROD_PORT $PROD_USER@$PROD_HOST "ls -ld $PROD_PATH"
```

### 2.3 上传备份文件

```bash
# 使用 scp 上传备份文件
scp -P $PROD_PORT \
    "$BACKUP_FILE_GZ" \
    "backup_info_${BACKUP_DATE}.txt" \
    $PROD_USER@$PROD_HOST:$PROD_PATH/

# 验证上传成功
ssh -p $PROD_PORT $PROD_USER@$PROD_HOST "ls -lh $PROD_PATH/"
```

**可选：使用 rsync（更可靠，支持断点续传）**:

```bash
# 使用 rsync 上传（推荐）
rsync -avz -P -e "ssh -p $PROD_PORT" \
      "$BACKUP_FILE_GZ" \
      "backup_info_${BACKUP_DATE}.txt" \
      $PROD_USER@$PROD_HOST:$PROD_PATH/

# -a: 归档模式
# -v: 详细输出
# -z: 压缩传输
# -P: 显示进度 + 支持断点续传
```

### 2.4 验证文件完整性

```bash
# 在生产服务器验证文件 MD5
LOCAL_MD5=$(md5 -q "$BACKUP_FILE_GZ")
REMOTE_MD5=$(ssh -p $PROD_PORT $PROD_USER@$PROD_HOST "md5sum $PROD_PATH/$BACKUP_FILE_GZ | cut -d' ' -f1")

echo "本地 MD5:  $LOCAL_MD5"
echo "远程 MD5:  $REMOTE_MD5"

if [ "$LOCAL_MD5" = "$REMOTE_MD5" ]; then
    echo "✅ 文件完整性验证通过"
else
    echo "❌ 文件完整性验证失败，请重新上传"
    exit 1
fi
```

---

## 第三阶段：生产环境数据库恢复

### 3.1 SSH 登录到生产服务器

```bash
ssh -p $PROD_PORT $PROD_USER@$PROD_HOST
```

**以下命令在生产服务器上执行**

### 3.2 配置生产数据库信息

```bash
# 设置生产数据库配置
PROD_DB_NAME="finapp_production"
PROD_DB_USER="finapp_prod_user"
PROD_DB_PASSWORD="your_secure_password_here"  # ⚠️ 请使用强密码
PROD_SCHEMA="finapp"

# 切换到 postgres 用户（或有数据库管理权限的用户）
sudo -i -u postgres
```

### 3.3 创建生产数据库用户

```bash
# 创建数据库用户
psql -c "CREATE USER $PROD_DB_USER WITH PASSWORD '$PROD_DB_PASSWORD';"

# 授予用户创建数据库权限
psql -c "ALTER USER $PROD_DB_USER CREATEDB;"

# 验证用户创建成功
psql -c "\du" | grep $PROD_DB_USER
```

### 3.4 创建生产数据库

```bash
# 创建数据库
psql -c "CREATE DATABASE $PROD_DB_NAME 
         WITH OWNER = $PROD_DB_USER 
         ENCODING = 'UTF8' 
         LC_COLLATE = 'en_US.UTF-8' 
         LC_CTYPE = 'en_US.UTF-8' 
         TEMPLATE = template0;"

# 验证数据库创建成功
psql -c "\l" | grep $PROD_DB_NAME
```

### 3.5 创建 schema

```bash
# 连接到数据库并创建 schema
psql -d $PROD_DB_NAME -c "CREATE SCHEMA IF NOT EXISTS $PROD_SCHEMA;"

# 授予用户 schema 权限
psql -d $PROD_DB_NAME -c "GRANT ALL ON SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;"

# 设置默认搜索路径
psql -d $PROD_DB_NAME -c "ALTER DATABASE $PROD_DB_NAME SET search_path TO $PROD_SCHEMA, public;"
```

### 3.6 恢复数据库

```bash
# 切换回普通用户
exit  # 退出 postgres 用户

# 解压备份文件
cd /home/ubuntu/finapp-backups
gunzip finapp_production_backup_*.sql.gz

# 恢复数据库
PGPASSWORD=$PROD_DB_PASSWORD psql \
    -h localhost \
    -U $PROD_DB_USER \
    -d $PROD_DB_NAME \
    < finapp_production_backup_*.sql

# 检查恢复结果
if [ $? -eq 0 ]; then
    echo "✅ 数据库恢复成功"
else
    echo "❌ 数据库恢复失败"
    exit 1
fi
```

### 3.7 验证数据恢复

```bash
# 设置密码环境变量
export PGPASSWORD=$PROD_DB_PASSWORD

# 1. 检查表数量
echo "=== 检查表数量 ==="
psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -c "
    SELECT COUNT(*) as table_count 
    FROM information_schema.tables 
    WHERE table_schema = '$PROD_SCHEMA';"

# 2. 检查主要表的记录数
echo "=== 检查主要表记录数 ==="
psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -c "
    SELECT 
        'users' as table_name, 
        COUNT(*) as record_count 
    FROM $PROD_SCHEMA.users
    UNION ALL
    SELECT 'portfolios', COUNT(*) FROM $PROD_SCHEMA.portfolios
    UNION ALL
    SELECT 'assets', COUNT(*) FROM $PROD_SCHEMA.assets
    UNION ALL
    SELECT 'transactions', COUNT(*) FROM $PROD_SCHEMA.transactions
    UNION ALL
    SELECT 'asset_prices', COUNT(*) FROM $PROD_SCHEMA.asset_prices;"

# 3. 检查最近的数据
echo "=== 检查最近的数据 ==="
psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -c "
    SELECT 
        id, 
        email, 
        username, 
        created_at 
    FROM $PROD_SCHEMA.users 
    ORDER BY created_at DESC 
    LIMIT 5;"

# 4. 检查 schema 列表
echo "=== 检查 schema ==="
psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -c "\dn"

# 5. 验证外键约束
echo "=== 检查外键约束 ==="
psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -c "
    SELECT COUNT(*) as constraint_count 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = '$PROD_SCHEMA' 
    AND constraint_type = 'FOREIGN KEY';"
```

### 3.8 设置数据库权限

```bash
# 授予用户完整权限
psql -h localhost -U postgres -d $PROD_DB_NAME << EOF

-- 授予 schema 权限
GRANT ALL ON SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;

-- 授予所有表的权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;

-- 授予所有序列的权限
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;

-- 授予所有函数的权限
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;

-- 设置默认权限（对未来创建的对象）
ALTER DEFAULT PRIVILEGES IN SCHEMA $PROD_SCHEMA 
    GRANT ALL ON TABLES TO $PROD_DB_USER;

ALTER DEFAULT PRIVILEGES IN SCHEMA $PROD_SCHEMA 
    GRANT ALL ON SEQUENCES TO $PROD_DB_USER;

ALTER DEFAULT PRIVILEGES IN SCHEMA $PROD_SCHEMA 
    GRANT ALL ON FUNCTIONS TO $PROD_DB_USER;

EOF

echo "✅ 数据库权限设置完成"
```

---

## 第四阶段：生产环境配置

### 4.1 配置 PostgreSQL 监听地址

```bash
# 编辑 postgresql.conf
sudo vim /etc/postgresql/13/main/postgresql.conf

# 修改以下配置（如果需要远程访问）
listen_addresses = 'localhost'  # 仅本地访问（推荐）
# 或
listen_addresses = '*'           # 允许所有地址（需配合 pg_hba.conf）

# 其他推荐配置
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
```

### 4.2 配置客户端认证

```bash
# 编辑 pg_hba.conf
sudo vim /etc/postgresql/13/main/pg_hba.conf

# 添加以下配置（仅允许本地连接）
# TYPE  DATABASE        USER              ADDRESS         METHOD
local   finapp_production  finapp_prod_user                 md5
host    finapp_production  finapp_prod_user  127.0.0.1/32  md5
host    finapp_production  finapp_prod_user  ::1/128       md5
```

### 4.3 重启 PostgreSQL 服务

```bash
# 重启 PostgreSQL
sudo systemctl restart postgresql

# 检查服务状态
sudo systemctl status postgresql

# 验证连接
psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -c "SELECT version();"
```

### 4.4 创建生产环境配置文件

```bash
# 在项目目录创建生产环境配置
cd /home/ubuntu
mkdir -p finapp-production
cd finapp-production

# 创建 .env.production 文件
cat > .env.production << EOF
# 数据库配置
DATABASE_URL="postgresql://$PROD_DB_USER:$PROD_DB_PASSWORD@localhost:5432/$PROD_DB_NAME?schema=$PROD_SCHEMA&client_encoding=utf8"

# JWT 配置（⚠️ 生产环境必须使用强密钥）
JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# 服务器配置
PORT=8000
NODE_ENV="production"

# 缓存配置
CACHE_TTL=3600
CACHE_MAX_KEYS=1000

# 日志配置
LOG_LEVEL="info"

# CORS 配置（⚠️ 请根据实际域名修改）
CORS_ORIGIN="https://your-production-domain.com"

# 速率限制配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# 汇率自动更新配置
ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true
EXCHANGE_RATE_UPDATE_SCHEDULE="0 */4 * * *"
EXCHANGE_RATE_ALERT_THRESHOLD=2.0

# 富途配置（如果需要）
FUTU_HOST="127.0.0.1"
FUTU_PORT=11111
FUTU_ENABLE=false

EOF

# 设置文件权限（仅所有者可读）
chmod 600 .env.production

echo "✅ 生产环境配置文件创建完成"
```

---

## 第五阶段：安全加固

### 5.1 数据库安全配置

```bash
# 1. 修改默认 postgres 用户密码
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'new_strong_password';"

# 2. 禁用远程 postgres 用户登录
sudo vim /etc/postgresql/13/main/pg_hba.conf
# 确保没有允许 postgres 用户远程登录的配置

# 3. 启用 SSL 连接（可选但推荐）
sudo vim /etc/postgresql/13/main/postgresql.conf
# ssl = on
# ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
# ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

### 5.2 设置数据库备份计划

```bash
# 创建备份脚本
cat > /home/ubuntu/finapp-production/backup_database.sh << 'EOF'
#!/bin/bash

# 配置
BACKUP_DIR="/home/ubuntu/finapp-backups/auto"
DB_NAME="finapp_production"
DB_USER="finapp_prod_user"
DB_PASSWORD="your_password_here"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份文件名
BACKUP_FILE="$BACKUP_DIR/finapp_prod_$(date +%Y%m%d_%H%M%S).sql.gz"

# 执行备份
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h localhost \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner \
    --no-privileges \
    | gzip > $BACKUP_FILE

# 检查备份结果
if [ $? -eq 0 ]; then
    echo "✅ 数据库备份成功: $BACKUP_FILE"
    
    # 删除超过保留期的备份
    find $BACKUP_DIR -name "finapp_prod_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    echo "📊 当前备份文件:"
    ls -lh $BACKUP_DIR
else
    echo "❌ 数据库备份失败"
    exit 1
fi
EOF

# 设置执行权限
chmod +x /home/ubuntu/finapp-production/backup_database.sh

# 添加到 crontab（每天凌晨2点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/finapp-production/backup_database.sh >> /home/ubuntu/finapp-backups/backup.log 2>&1") | crontab -

echo "✅ 自动备份计划设置完成"
```

### 5.3 设置防火墙

```bash
# 如果使用 ufw 防火墙
sudo ufw status

# 仅允许本地访问数据库（默认即可）
# PostgreSQL 默认监听 5432 端口，确保不对外开放
sudo ufw deny 5432/tcp

# 允许应用服务器端口（如需要）
sudo ufw allow 8000/tcp

# 重新加载防火墙
sudo ufw reload
```

---

## 第六阶段：验证与测试

### 6.1 连接测试

```bash
# 从应用服务器测试数据库连接
psql "postgresql://$PROD_DB_USER:$PROD_DB_PASSWORD@localhost:5432/$PROD_DB_NAME?schema=$PROD_SCHEMA" -c "\dt"
```

### 6.2 性能测试

```bash
# 测试查询性能
psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME << EOF

-- 启用查询时间显示
\timing on

-- 测试简单查询
SELECT COUNT(*) FROM $PROD_SCHEMA.users;

-- 测试复杂查询
SELECT 
    p.name, 
    COUNT(pos.id) as position_count,
    SUM(pos.quantity) as total_quantity
FROM $PROD_SCHEMA.portfolios p
LEFT JOIN $PROD_SCHEMA.positions pos ON p.id = pos.portfolio_id
GROUP BY p.id, p.name;

EOF
```

### 6.3 创建验证报告

```bash
cat > /home/ubuntu/finapp-production/migration_report.txt << EOF
=== FinApp 生产环境迁移报告 ===

迁移时间: $(date)
操作人员: $USER

=== 数据库信息 ===
数据库名: $PROD_DB_NAME
用户名: $PROD_DB_USER
Schema: $PROD_SCHEMA

=== 数据统计 ===
$(psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -t -c "
    SELECT '表数量: ' || COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = '$PROD_SCHEMA';")

$(psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -t -c "
    SELECT 
        '用户数: ' || COUNT(*) 
    FROM $PROD_SCHEMA.users;")

$(psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -t -c "
    SELECT 
        '投资组合数: ' || COUNT(*) 
    FROM $PROD_SCHEMA.portfolios;")

$(psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -t -c "
    SELECT 
        '资产数: ' || COUNT(*) 
    FROM $PROD_SCHEMA.assets;")

$(psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -t -c "
    SELECT 
        '交易记录数: ' || COUNT(*) 
    FROM $PROD_SCHEMA.transactions;")

=== PostgreSQL 版本 ===
$(psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -t -c "SELECT version();")

=== 磁盘使用 ===
$(psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -t -c "
    SELECT pg_size_pretty(pg_database_size('$PROD_DB_NAME')) as database_size;")

=== 连接测试 ===
✅ 数据库连接正常

EOF

cat /home/ubuntu/finapp-production/migration_report.txt
```

---

## 📝 操作检查清单

### 迁移前
- [ ] 本地数据库备份完成
- [ ] 备份文件完整性验证通过
- [ ] 备份文件已上传到生产服务器
- [ ] 文件传输完整性验证通过

### 迁移中
- [ ] 生产数据库用户创建完成
- [ ] 生产数据库创建完成
- [ ] Schema 创建完成
- [ ] 数据恢复完成
- [ ] 数据完整性验证通过

### 迁移后
- [ ] 数据库权限设置完成
- [ ] 生产环境配置文件创建完成
- [ ] 自动备份计划设置完成
- [ ] 安全配置完成
- [ ] 连接测试通过
- [ ] 性能测试通过
- [ ] 迁移报告生成完成

---

## 🚨 紧急回滚方案

如果迁移过程中出现问题，可以使用以下步骤回滚：

```bash
# 1. 删除生产数据库
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $PROD_DB_NAME;"

# 2. 删除生产用户（可选）
sudo -u postgres psql -c "DROP USER IF EXISTS $PROD_DB_USER;"

# 3. 保留备份文件以便重试
# 备份文件位置: /home/ubuntu/finapp-backups/
```

---

## 📞 问题排查

### 问题1: 数据库恢复失败

```bash
# 查看详细错误信息
PGPASSWORD=$PROD_DB_PASSWORD psql \
    -h localhost \
    -U $PROD_DB_USER \
    -d $PROD_DB_NAME \
    < finapp_production_backup_*.sql \
    2>&1 | tee restore_errors.log
```

### 问题2: 权限不足

```bash
# 重新授予权限
sudo -u postgres psql -d $PROD_DB_NAME << EOF
GRANT ALL ON SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;
EOF
```

### 问题3: 连接被拒绝

```bash
# 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 检查监听端口
sudo netstat -tlnp | grep 5432

# 检查 pg_hba.conf 配置
sudo cat /etc/postgresql/13/main/pg_hba.conf | grep finapp
```

---

## ⚠️ 重要注意事项

1. **密码安全**: 
   - 生产环境必须使用强密码
   - 不要在命令历史中留下密码
   - 使用 `history -c` 清除敏感命令

2. **备份策略**:
   - 定期测试备份恢复
   - 保留多个版本的备份
   - 异地存储重要备份

3. **监控告警**:
   - 设置数据库性能监控
   - 配置磁盘空间告警
   - 监控备份任务执行状态

4. **网络安全**:
   - 数据库不对外网开放
   - 使用 SSL 加密连接（推荐）
   - 定期更新系统安全补丁

---

**文档版本**: v1.0  
**维护人员**: 开发团队  
**最后更新**: 2025-12-02
