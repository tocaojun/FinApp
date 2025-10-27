#!/bin/bash

# API 同步表检查脚本
# 用于验证 price_sync 相关表是否存在并查看数据

echo "=========================================="
echo "  FinApp API 同步表检查工具"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库连接信息
DB_NAME="finapp_test"
DB_USER="caojun"

echo "📊 数据库连接信息"
echo "----------------------------------------"
psql -d $DB_NAME -c "SELECT current_database() as database, current_user as user, current_schema() as schema;" -t
echo ""

echo "📁 Schema 列表"
echo "----------------------------------------"
psql -d $DB_NAME -c "\dn" | grep -E "finapp|public|audit"
echo ""

echo "📋 API 同步相关表列表"
echo "----------------------------------------"
TABLES=$(psql -d $DB_NAME -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'finapp' AND (tablename LIKE '%price%' OR tablename LIKE '%sync%') ORDER BY tablename;")

if [ -z "$TABLES" ]; then
    echo -e "${RED}❌ 未找到任何 API 同步相关的表${NC}"
    exit 1
else
    echo -e "${GREEN}✅ 找到以下表：${NC}"
    psql -d $DB_NAME -c "\dt finapp.price*"
fi
echo ""

echo "📊 表记录数统计"
echo "----------------------------------------"
psql -d $DB_NAME -c "
SELECT 
  '✓ price_data_sources' as table_name,
  COUNT(*) as row_count
FROM finapp.price_data_sources
UNION ALL
SELECT '✓ price_sync_tasks', COUNT(*) FROM finapp.price_sync_tasks
UNION ALL
SELECT '✓ price_sync_logs', COUNT(*) FROM finapp.price_sync_logs
UNION ALL
SELECT '✓ price_sync_errors', COUNT(*) FROM finapp.price_sync_errors
ORDER BY table_name;
"
echo ""

echo "🔍 数据源配置"
echo "----------------------------------------"
psql -d $DB_NAME -c "
SELECT 
    name,
    provider,
    is_active,
    last_sync_status,
    to_char(last_sync_at, 'YYYY-MM-DD HH24:MI:SS') as last_sync_at
FROM finapp.price_data_sources
ORDER BY name;
"
echo ""

echo "📝 同步任务列表"
echo "----------------------------------------"
psql -d $DB_NAME -c "
SELECT 
    name,
    schedule_type,
    is_active,
    last_run_status,
    to_char(last_run_at, 'YYYY-MM-DD HH24:MI:SS') as last_run_at
FROM finapp.price_sync_tasks
ORDER BY last_run_at DESC NULLS LAST;
"
echo ""

echo "📜 最近 5 次同步日志"
echo "----------------------------------------"
psql -d $DB_NAME -c "
SELECT 
    to_char(started_at, 'MM-DD HH24:MI:SS') as started,
    to_char(completed_at, 'MM-DD HH24:MI:SS') as completed,
    status,
    total_assets as assets,
    total_records as records,
    success_count as success,
    failed_count as failed,
    CASE 
        WHEN error_message IS NOT NULL THEN substring(error_message, 1, 40) || '...'
        ELSE '-'
    END as error
FROM finapp.price_sync_logs
ORDER BY started_at DESC
LIMIT 5;
"
echo ""

echo "❌ 同步错误统计（最近 7 天）"
echo "----------------------------------------"
ERROR_COUNT=$(psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM finapp.price_sync_errors WHERE occurred_at >= CURRENT_DATE - INTERVAL '7 days';")

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  发现 $ERROR_COUNT 个错误${NC}"
    psql -d $DB_NAME -c "
    SELECT 
        error_type,
        COUNT(*) as count,
        array_agg(DISTINCT asset_symbol) as affected_assets
    FROM finapp.price_sync_errors
    WHERE occurred_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY error_type
    ORDER BY count DESC;
    "
else
    echo -e "${GREEN}✅ 最近 7 天没有错误记录${NC}"
fi
echo ""

echo "🎯 同步成功率（最近 7 天）"
echo "----------------------------------------"
psql -d $DB_NAME -c "
SELECT 
    COUNT(*) as total_syncs,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
    ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) || '%' as success_rate
FROM finapp.price_sync_logs
WHERE started_at >= CURRENT_DATE - INTERVAL '7 days';
"
echo ""

echo "=========================================="
echo "  检查完成！"
echo "=========================================="
echo ""
echo "💡 提示："
echo "  - 如果在 Prisma Studio 中看不到这些表，请运行："
echo "    cd backend && npx prisma db pull && npx prisma generate"
echo ""
echo "  - 直接查询数据："
echo "    psql -d finapp_test -c \"SELECT * FROM finapp.price_sync_logs ORDER BY started_at DESC LIMIT 10;\""
echo ""
