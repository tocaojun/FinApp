#!/bin/bash

###############################################################################
# FinApp 生产环境数据库备份脚本
# 用途: 创建用于生产环境迁移的完整数据库备份
# 作者: FinApp 团队
# 日期: 2025-12-02
###############################################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BACKUP_BASE_DIR="/Users/caojun/code/FinApp/backups/production-migration"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="finapp_test"
DB_USER="finapp_user"
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="finapp_production_backup_${BACKUP_DATE}.sql"

echo -e "${GREEN}=== FinApp 生产环境数据库备份 ===${NC}"
echo "开始时间: $(date)"
echo ""

# 1. 创建备份目录
echo -e "${YELLOW}[1/8] 创建备份目录...${NC}"
mkdir -p "$BACKUP_BASE_DIR"
cd "$BACKUP_BASE_DIR"
echo "✅ 备份目录: $BACKUP_BASE_DIR"
echo ""

# 2. 检查数据库连接
echo -e "${YELLOW}[2/8] 检查数据库连接...${NC}"
if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ 数据库连接正常"
else
    echo -e "${RED}❌ 数据库连接失败，请检查数据库是否运行${NC}"
    exit 1
fi
echo ""

# 3. 获取数据库统计信息
echo -e "${YELLOW}[3/8] 获取数据库统计信息...${NC}"
TABLE_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'finapp';")
USER_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM finapp.users;")
PORTFOLIO_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM finapp.portfolios;")
ASSET_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM finapp.assets;")
TRANSACTION_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM finapp.transactions;")
DB_SIZE=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")

echo "📊 数据库统计:"
echo "   - 表数量: $TABLE_COUNT"
echo "   - 用户数: $USER_COUNT"
echo "   - 投资组合数: $PORTFOLIO_COUNT"
echo "   - 资产数: $ASSET_COUNT"
echo "   - 交易记录数: $TRANSACTION_COUNT"
echo "   - 数据库大小: $DB_SIZE"
echo ""

# 4. 执行备份
echo -e "${YELLOW}[4/8] 执行数据库备份...${NC}"
echo "备份文件: $BACKUP_FILE"
pg_dump -h $DB_HOST \
        -U $DB_USER \
        -d $DB_NAME \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库备份成功"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "   备份文件大小: $BACKUP_SIZE"
else
    echo -e "${RED}❌ 数据库备份失败${NC}"
    exit 1
fi
echo ""

# 5. 验证备份内容
echo -e "${YELLOW}[5/8] 验证备份文件...${NC}"
BACKUP_TABLE_COUNT=$(grep -c "CREATE TABLE" "$BACKUP_FILE")
echo "   备份文件中的表数量: $BACKUP_TABLE_COUNT"

if [ "$BACKUP_TABLE_COUNT" -ge 30 ]; then
    echo "✅ 备份文件验证通过"
else
    echo -e "${RED}❌ 备份文件表数量异常，预期至少30个表${NC}"
    exit 1
fi
echo ""

# 6. 压缩备份文件
echo -e "${YELLOW}[6/8] 压缩备份文件...${NC}"
gzip "$BACKUP_FILE"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"
COMPRESSED_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
echo "✅ 压缩完成"
echo "   压缩后大小: $COMPRESSED_SIZE"
echo ""

# 7. 验证压缩文件完整性
echo -e "${YELLOW}[7/8] 验证压缩文件完整性...${NC}"
if gunzip -t "$BACKUP_FILE_GZ" 2>/dev/null; then
    echo "✅ 压缩文件完整性验证通过"
else
    echo -e "${RED}❌ 压缩文件损坏${NC}"
    exit 1
fi
echo ""

# 8. 生成备份信息文件
echo -e "${YELLOW}[8/8] 生成备份信息文件...${NC}"
BACKUP_INFO_FILE="backup_info_${BACKUP_DATE}.txt"
cat > "$BACKUP_INFO_FILE" << EOF
=== FinApp 数据库备份信息 ===

备份时间: $(date)
备份文件: $BACKUP_FILE_GZ
文件大小: $COMPRESSED_SIZE
源数据库: $DB_NAME
源主机: $DB_HOST:$DB_PORT
备份用户: $DB_USER

=== 数据库统计 ===
表数量: $TABLE_COUNT
用户数: $USER_COUNT
投资组合数: $PORTFOLIO_COUNT
资产数: $ASSET_COUNT
交易记录数: $TRANSACTION_COUNT
数据库大小: $DB_SIZE

=== PostgreSQL 版本 ===
$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT version();")

=== 备份内容 (前10个表) ===
$(gunzip -c "$BACKUP_FILE_GZ" | grep "CREATE TABLE" | head -10)

=== 文件校验 ===
MD5: $(md5 -q "$BACKUP_FILE_GZ")
SHA256: $(shasum -a 256 "$BACKUP_FILE_GZ" | cut -d' ' -f1)

=== 上传命令参考 ===
# 方法1: 使用 scp
scp -P 22 "$BACKUP_FILE_GZ" "$BACKUP_INFO_FILE" user@production-server:/path/to/backups/

# 方法2: 使用 rsync（推荐）
rsync -avz -P -e "ssh -p 22" "$BACKUP_FILE_GZ" "$BACKUP_INFO_FILE" user@production-server:/path/to/backups/

EOF

echo "✅ 备份信息文件已创建: $BACKUP_INFO_FILE"
echo ""

# 完成
echo -e "${GREEN}=== 备份完成 ===${NC}"
echo "完成时间: $(date)"
echo ""
echo "📁 备份文件位置:"
echo "   $BACKUP_BASE_DIR/$BACKUP_FILE_GZ"
echo "   $BACKUP_BASE_DIR/$BACKUP_INFO_FILE"
echo ""
echo "📋 下一步操作:"
echo "   1. 查看备份信息: cat $BACKUP_INFO_FILE"
echo "   2. 上传到生产服务器"
echo "   3. 参考文档: docs/DATABASE_MIGRATION_TO_PRODUCTION.md"
echo ""

# 列出最近的备份文件
echo "📦 最近的备份文件:"
ls -lht "$BACKUP_BASE_DIR" | head -6
