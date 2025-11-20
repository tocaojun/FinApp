#!/bin/bash

# FinApp 整库恢复脚本
# 使用方法: ./full-database-restore.sh <backup_file> [target_db_name]

set -e  # 遇到错误立即退出

# 检查参数
if [ $# -lt 1 ]; then
    echo "❌ 使用方法: $0 <backup_file> [target_db_name]"
    echo ""
    echo "示例:"
    echo "  $0 /path/to/backup.sql.gz"
    echo "  $0 /path/to/backup.dump finapp_restore"
    echo ""
    echo "可用的备份文件:"
    ls -la /Users/caojun/code/FinApp/backups/*.{sql.gz,dump} 2>/dev/null | tail -5 || echo "  (未找到备份文件)"
    exit 1
fi

# 配置
BACKUP_FILE="$1"
TARGET_DB="${2:-finapp_test}"
DB_HOST="localhost"
DB_USER="finapp_user"
DB_PASSWORD="finapp_password"

echo "🔄 开始整库恢复..."
echo "📅 时间: $(date)"
echo "📁 备份文件: $BACKUP_FILE"
echo "🎯 目标数据库: $TARGET_DB"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 显示备份文件信息
echo "📊 备份文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"

# 检查 PostgreSQL 连接
echo "🔍 检查 PostgreSQL 连接..."
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "\q" 2>/dev/null; then
    echo "❌ 无法连接到 PostgreSQL，请检查服务是否启动"
    exit 1
fi

# 安全确认
echo ""
echo "⚠️  警告: 此操作将完全替换目标数据库的所有数据！"
echo "🎯 目标数据库: $TARGET_DB"
echo "📁 备份文件: $BACKUP_FILE"
echo ""
read -p "确认继续吗？(输入 'YES' 确认): " confirm

if [ "$confirm" != "YES" ]; then
    echo "❌ 操作已取消"
    exit 1
fi

# 创建当前数据库的安全备份
if [ "$TARGET_DB" = "finapp_test" ]; then
    echo "🛡️ 创建当前数据库的安全备份..."
    SAFETY_BACKUP="/Users/caojun/code/FinApp/backups/safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$TARGET_DB" | gzip > "$SAFETY_BACKUP" 2>/dev/null || true
    echo "🛡️ 安全备份已保存到: $SAFETY_BACKUP"
fi

start_time=$(date +%s)

# 删除目标数据库
echo "🗑️ 删除目标数据库..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TARGET_DB;" 2>/dev/null

# 重新创建数据库
echo "🏗️ 重新创建数据库..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE $TARGET_DB;"

# 根据文件类型选择恢复方法
echo "📥 开始恢复数据..."

if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
    echo "  📝 从压缩 SQL 文件恢复..."
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$TARGET_DB"
    
elif [[ "$BACKUP_FILE" == *.sql ]]; then
    echo "  📝 从 SQL 文件恢复..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$TARGET_DB" < "$BACKUP_FILE"
    
elif [[ "$BACKUP_FILE" == *.dump ]]; then
    echo "  🎯 从自定义格式文件恢复..."
    PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -U "$DB_USER" -d "$TARGET_DB" "$BACKUP_FILE"
    
else
    echo "❌ 不支持的备份文件格式: $BACKUP_FILE"
    echo "支持的格式: .sql, .sql.gz, .dump"
    exit 1
fi

end_time=$(date +%s)
duration=$((end_time - start_time))

# 验证恢复结果
echo "✅ 验证恢复结果..."

# 检查表数量
TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'finapp';" | xargs)
echo "📊 恢复的表数量: $TABLE_COUNT"

# 检查关键表的记录数
echo "📋 关键表记录数:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$TARGET_DB" -c "
SELECT 
  'users' as table_name, 
  COUNT(*) as record_count 
FROM finapp.users
UNION ALL
SELECT 
  'portfolios', 
  COUNT(*) 
FROM finapp.portfolios
UNION ALL
SELECT 
  'transactions', 
  COUNT(*) 
FROM finapp.transactions
UNION ALL
SELECT 
  'assets', 
  COUNT(*) 
FROM finapp.assets;
" 2>/dev/null || echo "  (某些表可能不存在，这是正常的)"

# 检查数据库大小
RESTORED_SIZE=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$TARGET_DB" -t -c "SELECT pg_size_pretty(pg_database_size('$TARGET_DB'));" | xargs)
echo "💾 恢复后数据库大小: $RESTORED_SIZE"

echo ""
echo "🎉 整库恢复完成！"
echo "⏱️ 恢复耗时: ${duration} 秒"
echo "🗄️ 目标数据库: $TARGET_DB"

if [ "$TARGET_DB" = "finapp_test" ]; then
    echo ""
    echo "🚀 现在可以启动应用服务:"
    echo "   cd /Users/caojun/code/FinApp"
    echo "   ./start-services.sh"
fi