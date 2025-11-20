#!/bin/bash

# FinApp 整库备份脚本
# 使用方法: ./full-database-backup.sh [backup_name]

set -e  # 遇到错误立即退出

# 配置
DB_HOST="localhost"
DB_USER="finapp_user"
DB_NAME="finapp_test"
DB_PASSWORD="finapp_password"
BACKUP_DIR="/Users/caojun/code/FinApp/backups"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME=${1:-"finapp_full_backup"}
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_${TIMESTAMP}"

echo "🚀 开始整库备份..."
echo "📅 时间: $(date)"
echo "🗄️ 数据库: $DB_NAME"
echo "📁 备份目录: $BACKUP_DIR"

# 检查数据库连接
echo "🔍 检查数据库连接..."
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; then
    echo "❌ 无法连接到数据库，请检查服务是否启动"
    exit 1
fi

# 获取数据库大小
DB_SIZE=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
echo "📊 数据库大小: $DB_SIZE"

# 执行备份
echo "💾 开始备份..."
start_time=$(date +%s)

# 1. SQL 格式备份
echo "  📝 创建 SQL 备份..."
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "${BACKUP_FILE}.sql"

# 2. 压缩 SQL 备份
echo "  🗜️ 压缩备份文件..."
gzip "${BACKUP_FILE}.sql"

# 3. 自定义格式备份（用于快速恢复）
echo "  🎯 创建自定义格式备份..."
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -Fc > "${BACKUP_FILE}.dump"

end_time=$(date +%s)
duration=$((end_time - start_time))

# 显示备份结果
echo ""
echo "✅ 备份完成！"
echo "⏱️ 耗时: ${duration} 秒"
echo "📁 备份文件:"
echo "   SQL (压缩): ${BACKUP_FILE}.sql.gz ($(du -h "${BACKUP_FILE}.sql.gz" | cut -f1))"
echo "   自定义格式: ${BACKUP_FILE}.dump ($(du -h "${BACKUP_FILE}.dump" | cut -f1))"

# 创建备份信息文件
cat > "${BACKUP_FILE}.info" << EOF
备份信息
========
备份时间: $(date)
数据库名: $DB_NAME
数据库大小: $DB_SIZE
备份耗时: ${duration} 秒
PostgreSQL版本: $(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" | head -1 | xargs)

文件列表:
- ${BACKUP_NAME}_${TIMESTAMP}.sql.gz (SQL格式，压缩)
- ${BACKUP_NAME}_${TIMESTAMP}.dump (自定义格式)
- ${BACKUP_NAME}_${TIMESTAMP}.info (备份信息)

恢复命令:
=========
# 从 SQL 备份恢复:
gunzip -c ${BACKUP_NAME}_${TIMESTAMP}.sql.gz | PGPASSWORD=finapp_password psql -h localhost -U finapp_user -d finapp_test

# 从自定义格式恢复:
PGPASSWORD=finapp_password pg_restore -h localhost -U finapp_user -d finapp_test ${BACKUP_NAME}_${TIMESTAMP}.dump
EOF

echo "📋 备份信息已保存到: ${BACKUP_FILE}.info"

# 清理旧备份（保留最近10个）
echo "🧹 清理旧备份文件..."
cd "$BACKUP_DIR"
ls -t finapp_full_backup_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
ls -t finapp_full_backup_*.dump 2>/dev/null | tail -n +11 | xargs -r rm -f
ls -t finapp_full_backup_*.info 2>/dev/null | tail -n +11 | xargs -r rm -f

echo "🎉 整库备份完成！"