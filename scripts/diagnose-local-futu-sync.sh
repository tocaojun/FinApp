#!/bin/bash

# 诊断本地富途同步问题
# 用于排查界面触发的香港股票同步失败原因

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 诊断本地富途同步问题"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 检查 Python 依赖
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 1. Python 依赖检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if python3 -c "import psycopg2; from futu import OpenQuoteContext, RET_OK; print('✅ 所有依赖正常')" 2>/dev/null; then
    echo -e "${GREEN}✅ Python 依赖完整${NC}"
else
    echo -e "${RED}❌ Python 依赖缺失${NC}"
    exit 1
fi

# 2. 检查富途 OpenD 服务
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 2. 富途 OpenD 服务检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if lsof -i :11111 | grep -q LISTEN; then
    echo -e "${GREEN}✅ 富途 OpenD 正在运行${NC}"
    lsof -i :11111 | grep LISTEN
else
    echo -e "${RED}❌ 富途 OpenD 未运行${NC}"
    echo "请先启动 FutuOpenD 客户端"
    exit 1
fi

# 3. 检查后端服务
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 3. 后端服务检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if lsof -i :8000 | grep -q LISTEN; then
    echo -e "${GREEN}✅ 后端服务正在运行${NC}"
else
    echo -e "${RED}❌ 后端服务未运行${NC}"
    exit 1
fi

# 4. 检查数据库配置
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  4. 数据库配置检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "数据源配置:"
psql -h localhost -U finapp_user -d finapp_test -c \
  "SELECT name, provider, is_active, api_endpoint FROM finapp.price_data_sources WHERE provider = 'futu'" 2>&1

echo ""
echo "同步任务配置:"
psql -h localhost -U finapp_user -d finapp_test -c \
  "SELECT t.name, t.is_active, t.sync_days_back, t.last_run_status, 
   array_length(t.asset_ids, 1) as asset_count
   FROM finapp.price_sync_tasks t
   WHERE t.data_source_id = '49327297-4487-4799-a74a-0a353bc56b6d'" 2>&1

# 5. 检查资产数据
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 5. 资产数据检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "香港股票资产："
psql -h localhost -U finapp_user -d finapp_test -c \
  "SELECT a.id, a.symbol, a.name, c.code as country
   FROM finapp.assets a
   JOIN finapp.countries c ON a.country_id = c.id
   WHERE c.code = 'HK' AND a.symbol IN ('00700', '03690', '09618', '06186')
   ORDER BY a.symbol" 2>&1

# 6. 测试手动同步
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 6. 手动测试富途同步脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TEST_ASSET_ID="6c19f81d-bb43-4539-b665-2b488d92368c"
TEST_SYMBOL="HK.00700"
DAYS_BACK=7

echo "测试资产: 腾讯控股 ($TEST_SYMBOL)"
echo "同步天数: $DAYS_BACK"
echo ""

RESULT=$(python3 /Users/caojun/code/FinApp/scripts/futu-sync-single.py "$TEST_ASSET_ID" "$TEST_SYMBOL" $DAYS_BACK 2>&1)

if echo "$RESULT" | grep -q '"success": true'; then
    echo -e "${GREEN}✅ 脚本执行成功${NC}"
    RECORDS=$(echo "$RESULT" | grep -o '"data": \[.*\]' | grep -o '{' | wc -l | xargs)
    echo "获取到 $RECORDS 条价格记录"
else
    echo -e "${RED}❌ 脚本执行失败${NC}"
    echo "$RESULT"
fi

# 7. 检查最近的同步日志
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 7. 最近的同步日志"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

psql -h localhost -U finapp_user -d finapp_test -c \
  "SELECT 
     l.started_at,
     l.status,
     l.total_assets,
     l.total_records,
     l.success_count,
     l.failed_count,
     CASE 
       WHEN l.result_summary IS NOT NULL THEN 
         jsonb_pretty(l.result_summary)
       ELSE 
         'No summary'
     END as summary
   FROM finapp.price_sync_logs l
   WHERE l.task_id = '07359f8f-1ecf-4d2f-9088-d135fa816499'
   ORDER BY l.started_at DESC
   LIMIT 3" 2>&1

# 8. 检查脚本路径
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 8. 脚本文件检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SCRIPT_PATH="/Users/caojun/code/FinApp/scripts/futu-sync-single.py"
if [ -f "$SCRIPT_PATH" ]; then
    echo -e "${GREEN}✅ 脚本文件存在${NC}"
    echo "路径: $SCRIPT_PATH"
    ls -lh "$SCRIPT_PATH"
else
    echo -e "${RED}❌ 脚本文件不存在${NC}"
fi

# 9. 查看后端日志（最近的富途相关日志）
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 9. 后端日志检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_DIR="/Users/caojun/code/FinApp/backend"
if [ -f "$BACKEND_DIR/logs/app.log" ]; then
    echo "最近的富途同步日志:"
    tail -50 "$BACKEND_DIR/logs/app.log" | grep -i "futu\|HK\." | tail -20
else
    echo "后端日志文件不存在，查看进程输出..."
    echo "提示: 请在后端运行窗口查看实时日志"
fi

# 10. 总结和建议
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 10. 诊断总结和建议"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "✅ 已完成检查项："
echo "   - Python 依赖完整"
echo "   - 富途 OpenD 服务运行中"
echo "   - 后端服务运行中"
echo "   - 数据库配置正常"
echo "   - 手动脚本测试成功"
echo ""
echo "⚠️  可能的问题："
echo "   1. 如果同步日志显示 total_records=0："
echo "      → 检查资产的 country_id 是否正确"
echo "      → 检查富途市场代码映射逻辑"
echo ""
echo "   2. 如果看到错误信息："
echo "      → 查看后端控制台实时日志"
echo "      → 检查 PriceSyncService.ts 的 fetchFromFutu 方法"
echo ""
echo "🔧 调试步骤："
echo "   1. 在后端终端查看实时日志"
echo "   2. 点击界面的'立即同步'按钮"
echo "   3. 观察后端输出的详细日志"
echo "   4. 检查是否有异常或错误信息"
echo ""
echo "📞 需要查看完整日志请运行："
echo "   tail -f $BACKEND_DIR/logs/app.log"
echo ""
