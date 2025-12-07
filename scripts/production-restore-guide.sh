#!/bin/bash

###############################################################################
# FinApp 生产环境数据库恢复指导脚本
# 用途: 在生产服务器上恢复数据库（交互式）
# 作者: FinApp 团队
# 日期: 2025-12-02
# 使用: sudo bash production-restore-guide.sh
###############################################################################

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          FinApp 生产环境数据库恢复向导                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo "⚠️  警告: 此脚本将在生产服务器上创建/恢复数据库"
echo "   请确保您已经: "
echo "   1. 备份文件已上传到服务器"
echo "   2. 拥有数据库管理权限"
echo "   3. 已通知相关人员"
echo ""
read -p "是否继续? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo -e "${BLUE}=== 第一步: 配置信息 ===${NC}"
echo ""

# 收集配置信息
read -p "生产数据库名称 [finapp_production]: " PROD_DB_NAME
PROD_DB_NAME=${PROD_DB_NAME:-finapp_production}

read -p "生产数据库用户名 [finapp_prod_user]: " PROD_DB_USER
PROD_DB_USER=${PROD_DB_USER:-finapp_prod_user}

read -sp "生产数据库密码: " PROD_DB_PASSWORD
echo ""

read -p "Schema 名称 [finapp]: " PROD_SCHEMA
PROD_SCHEMA=${PROD_SCHEMA:-finapp}

read -p "备份文件路径: " BACKUP_FILE

# 验证备份文件
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ 备份文件不存在: $BACKUP_FILE${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}=== 配置确认 ===${NC}"
echo "数据库名: $PROD_DB_NAME"
echo "用户名: $PROD_DB_USER"
echo "Schema: $PROD_SCHEMA"
echo "备份文件: $BACKUP_FILE"
echo ""

read -p "配置信息正确? (yes/no): " CONFIG_CONFIRM
if [ "$CONFIG_CONFIRM" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo -e "${BLUE}=== 第二步: 检查环境 ===${NC}"
echo ""

# 检查 PostgreSQL 服务
echo "检查 PostgreSQL 服务..."
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL 服务运行中"
else
    echo -e "${RED}❌ PostgreSQL 服务未运行${NC}"
    read -p "是否启动 PostgreSQL? (yes/no): " START_PG
    if [ "$START_PG" = "yes" ]; then
        sudo systemctl start postgresql
        echo "✅ PostgreSQL 已启动"
    else
        exit 1
    fi
fi

# 检查备份文件类型
echo ""
echo "检查备份文件..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "✅ 检测到压缩文件，将自动解压"
    NEEDS_GUNZIP=true
    SQL_FILE="${BACKUP_FILE%.gz}"
else
    echo "✅ 检测到 SQL 文件"
    NEEDS_GUNZIP=false
    SQL_FILE="$BACKUP_FILE"
fi

echo ""
echo -e "${BLUE}=== 第三步: 创建数据库用户 ===${NC}"
echo ""

# 切换到 postgres 用户创建数据库用户
sudo -u postgres psql << EOF
-- 创建用户（如果已存在则忽略）
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$PROD_DB_USER') THEN
        CREATE USER $PROD_DB_USER WITH PASSWORD '$PROD_DB_PASSWORD';
        RAISE NOTICE '✅ 用户已创建: $PROD_DB_USER';
    ELSE
        RAISE NOTICE '⚠️  用户已存在: $PROD_DB_USER';
        ALTER USER $PROD_DB_USER WITH PASSWORD '$PROD_DB_PASSWORD';
        RAISE NOTICE '✅ 密码已更新';
    END IF;
END
\$\$;

-- 授予创建数据库权限
ALTER USER $PROD_DB_USER CREATEDB;

-- 显示用户信息
\du $PROD_DB_USER
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 用户配置完成${NC}"
else
    echo -e "${RED}❌ 用户创建失败${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}=== 第四步: 创建数据库 ===${NC}"
echo ""

# 检查数据库是否已存在
DB_EXISTS=$(sudo -u postgres psql -t -c "SELECT 1 FROM pg_database WHERE datname = '$PROD_DB_NAME';")

if [ -n "$DB_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  数据库已存在: $PROD_DB_NAME${NC}"
    read -p "是否删除并重建? (yes/no): " DROP_DB
    if [ "$DROP_DB" = "yes" ]; then
        sudo -u postgres psql -c "DROP DATABASE $PROD_DB_NAME;"
        echo "✅ 旧数据库已删除"
    else
        echo "操作已取消"
        exit 0
    fi
fi

# 创建数据库
sudo -u postgres psql << EOF
CREATE DATABASE $PROD_DB_NAME 
    WITH OWNER = $PROD_DB_USER 
    ENCODING = 'UTF8' 
    LC_COLLATE = 'en_US.UTF-8' 
    LC_CTYPE = 'en_US.UTF-8' 
    TEMPLATE = template0;

-- 显示数据库信息
\l $PROD_DB_NAME
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库创建完成${NC}"
else
    echo -e "${RED}❌ 数据库创建失败${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}=== 第五步: 创建 Schema ===${NC}"
echo ""

sudo -u postgres psql -d $PROD_DB_NAME << EOF
-- 创建 schema
CREATE SCHEMA IF NOT EXISTS $PROD_SCHEMA;

-- 授予权限
GRANT ALL ON SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;

-- 设置默认搜索路径
ALTER DATABASE $PROD_DB_NAME SET search_path TO $PROD_SCHEMA, public;

-- 显示 schema
\dn
EOF

echo -e "${GREEN}✅ Schema 创建完成${NC}"

echo ""
echo -e "${BLUE}=== 第六步: 恢复数据库 ===${NC}"
echo ""

# 解压备份文件（如果需要）
if [ "$NEEDS_GUNZIP" = true ]; then
    echo "解压备份文件..."
    gunzip -k "$BACKUP_FILE"
    echo "✅ 解压完成"
fi

# 恢复数据库
echo "开始恢复数据库..."
echo "这可能需要几分钟时间，请耐心等待..."
echo ""

PGPASSWORD=$PROD_DB_PASSWORD psql \
    -h localhost \
    -U $PROD_DB_USER \
    -d $PROD_DB_NAME \
    < "$SQL_FILE" 2>&1 | tee restore.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 数据库恢复完成${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  恢复过程中有一些警告，请查看 restore.log${NC}"
fi

# 清理临时文件
if [ "$NEEDS_GUNZIP" = true ]; then
    rm -f "$SQL_FILE"
fi

echo ""
echo -e "${BLUE}=== 第七步: 验证数据 ===${NC}"
echo ""

export PGPASSWORD=$PROD_DB_PASSWORD

echo "1. 检查表数量..."
TABLE_COUNT=$(psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$PROD_SCHEMA';")
echo "   表数量: $TABLE_COUNT"

echo ""
echo "2. 检查主要表记录数..."
psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME << EOF
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count 
FROM $PROD_SCHEMA.users
UNION ALL
SELECT 'portfolios', COUNT(*) FROM $PROD_SCHEMA.portfolios
UNION ALL
SELECT 'assets', COUNT(*) FROM $PROD_SCHEMA.assets
UNION ALL
SELECT 'transactions', COUNT(*) FROM $PROD_SCHEMA.transactions;
EOF

echo ""
echo "3. 检查数据库大小..."
psql -h localhost -U $PROD_DB_USER -d $PROD_DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$PROD_DB_NAME')) as database_size;"

echo ""
echo -e "${BLUE}=== 第八步: 设置权限 ===${NC}"
echo ""

sudo -u postgres psql -d $PROD_DB_NAME << EOF
-- 授予 schema 权限
GRANT ALL ON SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;

-- 授予所有表的权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;

-- 授予所有序列的权限
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;

-- 授予所有函数的权限
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA $PROD_SCHEMA TO $PROD_DB_USER;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA $PROD_SCHEMA 
    GRANT ALL ON TABLES TO $PROD_DB_USER;

ALTER DEFAULT PRIVILEGES IN SCHEMA $PROD_SCHEMA 
    GRANT ALL ON SEQUENCES TO $PROD_DB_USER;

ALTER DEFAULT PRIVILEGES IN SCHEMA $PROD_SCHEMA 
    GRANT ALL ON FUNCTIONS TO $PROD_DB_USER;

EOF

echo -e "${GREEN}✅ 权限设置完成${NC}"

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    🎉 恢复完成! 🎉                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo "📊 数据库信息:"
echo "   数据库名: $PROD_DB_NAME"
echo "   用户名: $PROD_DB_USER"
echo "   Schema: $PROD_SCHEMA"
echo ""

echo "🔗 连接字符串:"
echo "   postgresql://$PROD_DB_USER:****@localhost:5432/$PROD_DB_NAME?schema=$PROD_SCHEMA"
echo ""

echo "📝 下一步操作:"
echo "   1. 配置应用程序的 .env.production 文件"
echo "   2. 测试应用程序连接"
echo "   3. 设置自动备份计划"
echo "   4. 配置监控告警"
echo ""

echo "📚 相关文档:"
echo "   docs/DATABASE_MIGRATION_TO_PRODUCTION.md"
echo ""

# 生成连接测试命令
echo "🧪 快速测试命令:"
echo "   psql \"postgresql://$PROD_DB_USER:$PROD_DB_PASSWORD@localhost:5432/$PROD_DB_NAME?schema=$PROD_SCHEMA\" -c \"\\dt\""
echo ""

unset PGPASSWORD
