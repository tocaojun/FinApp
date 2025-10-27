#!/bin/bash

# Phase 3 数据库迁移脚本
# 用于创建价格同步相关的数据库表

set -e

echo "=========================================="
echo "Phase 3: API集成 - 数据库迁移"
echo "=========================================="
echo ""

# 数据库配置
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="finapp_test"
DB_USER="finapp_user"
DB_SCHEMA="finapp"

# 迁移文件路径
MIGRATION_FILE="backend/migrations/008_price_sync_config/up.sql"

# 检查迁移文件是否存在
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ 错误: 迁移文件不存在: $MIGRATION_FILE"
    exit 1
fi

echo "📋 迁移文件: $MIGRATION_FILE"
echo "🗄️  数据库: $DB_NAME"
echo ""

# 执行迁移
echo "🚀 开始执行迁移..."
echo ""

# 设置 schema
export PGPASSWORD=finapp_password
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SET search_path TO $DB_SCHEMA;" -f $MIGRATION_FILE

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ 迁移成功完成！"
    echo "=========================================="
    echo ""
    echo "已创建以下表："
    echo "  - price_data_sources (数据源配置)"
    echo "  - price_sync_tasks (同步任务)"
    echo "  - price_sync_logs (同步日志)"
    echo "  - price_sync_errors (错误详情)"
    echo ""
    echo "已插入默认数据源："
    echo "  - Yahoo Finance"
    echo "  - 东方财富"
    echo "  - Tushare"
    echo ""
    echo "下一步："
    echo "  1. 重启后端服务: cd backend && npm run dev"
    echo "  2. 访问前端: http://localhost:3001"
    echo "  3. 进入 价格管理中心 → API自动同步"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ 迁移失败"
    echo "=========================================="
    echo ""
    echo "请检查："
    echo "  1. PostgreSQL 服务是否运行"
    echo "  2. 数据库连接信息是否正确"
    echo "  3. 用户是否有足够的权限"
    echo ""
    exit 1
fi
