#!/bin/bash

# 时区修复验证脚本
# 这个脚本检查数据库中的时间戳是否已正确设置时区

echo "====== 时区修复验证 ======"
echo ""

# 检查表结构定义
echo "1️⃣  检查 price_sync_logs 表的 started_at 列定义..."
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT column_name, column_default, data_type 
FROM information_schema.columns 
WHERE table_schema = 'finapp' 
  AND table_name = 'price_sync_logs' 
  AND column_name = 'started_at';" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ 表结构验证成功"
else
    echo "❌ 表结构验证失败"
    exit 1
fi

echo ""
echo "2️⃣  检查最近的同步日志时间戳..."
echo ""

# 获取最近的日志记录
echo "最近5条同步日志："
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT 
    id,
    started_at as '开始时间',
    completed_at as '完成时间',
    status as '状态'
FROM finapp.price_sync_logs 
ORDER BY started_at DESC 
LIMIT 5;" 2>/dev/null

echo ""
echo "3️⃣  获取当前系统时间对比..."
echo ""

# 获取数据库当前时间
CURRENT_TIME=$(psql -h localhost -U finapp_user -d finapp_test -tc "SELECT NOW() AT TIME ZONE 'Asia/Shanghai';" 2>/dev/null | tr -d ' ')
echo "数据库当前时间: $CURRENT_TIME"
echo "系统当前时间:   $(date '+%Y-%m-%d %H:%M:%S')"

echo ""
echo "====== 验证完成 ======"
echo ""
echo "说明："
echo "- 如果 started_at 列的 column_default 包含 'timezone('Asia/Shanghai'...'，说明修改已生效"
echo "- 最近的同步日志时间应该与当前系统时间在同一天"
echo "- 如果时间差异>1小时，可能说明修改未完全生效"
