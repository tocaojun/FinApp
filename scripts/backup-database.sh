#!/bin/bash
# 数据库备份脚本
# 用途：定期备份 FinApp 数据库

# 配置
BACKUP_DIR="/Users/caojun/code/FinApp/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/finapp_test_backup_${TIMESTAMP}.sql"

# 数据库连接信息
DB_HOST="localhost"
DB_USER="finapp_user"
DB_NAME="finapp_test"

# 创建备份目录（如果不存在）
mkdir -p "$BACKUP_DIR"

echo "=================================="
echo "  FinApp 数据库备份工具"
echo "=================================="
echo "开始时间: $(date)"
echo "备份目标: $DB_NAME"
echo "备份位置: $BACKUP_FILE"
echo ""

# 执行备份
echo "正在备份数据库..."
if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
    echo "✅ 数据库备份成功"
    
    # 显示文件信息
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📁 备份文件大小: $FILE_SIZE"
    
    # 可选：压缩备份文件
    read -p "是否压缩备份文件？ (y/n): " COMPRESS
    if [ "$COMPRESS" = "y" ]; then
        echo "正在压缩..."
        gzip "$BACKUP_FILE"
        COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
        echo "✅ 压缩完成"
        echo "📦 压缩后大小: $COMPRESSED_SIZE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
    fi
    
    echo ""
    echo "=================================="
    echo "  备份完成"
    echo "=================================="
    echo "📁 备份位置: $BACKUP_FILE"
    echo "⏰ 完成时间: $(date)"
    
    # 列出最近的备份
    echo ""
    echo "最近的5个备份文件:"
    ls -lht "$BACKUP_DIR" | grep "finapp_test_backup" | head -5
    
else
    echo "❌ 备份失败"
    echo "请检查："
    echo "  1. PostgreSQL 服务是否运行"
    echo "  2. 数据库连接信息是否正确"
    echo "  3. 是否有足够的磁盘空间"
    exit 1
fi
