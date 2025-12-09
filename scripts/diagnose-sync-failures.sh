#!/bin/bash
# 诊断价格同步失败问题

echo "🔍 诊断价格同步失败问题..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 检查最近的同步日志
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 1. 最近10条同步日志"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d finapp_production -x -c "
    SELECT 
        l.id,
        l.status,
        TO_CHAR(l.started_at, 'YYYY-MM-DD HH24:MI:SS') as started_at,
        TO_CHAR(l.completed_at, 'YYYY-MM-DD HH24:MI:SS') as completed_at,
        l.total_records,
        l.success_count,
        l.failed_count,
        l.error_message,
        t.name as task_name,
        ds.name as data_source_name
    FROM finapp.price_sync_logs l
    LEFT JOIN finapp.price_sync_tasks t ON l.task_id = t.id
    LEFT JOIN finapp.price_data_sources ds ON l.data_source_id = ds.id
    ORDER BY l.started_at DESC 
    LIMIT 10
"
echo ""

# 2. 统计失败原因
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 2. 失败统计分析"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d finapp_production -c "
    SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
    FROM finapp.price_sync_logs
    GROUP BY status
    ORDER BY count DESC
"
echo ""

# 3. 查看详细错误信息
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "❌ 3. 最近的错误详情（最多显示5条）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d finapp_production -c "
    SELECT 
        TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI:SS') as time,
        SUBSTRING(error_message, 1, 100) as error_summary
    FROM finapp.price_sync_logs
    WHERE status IN ('failed', 'partial')
        AND error_message IS NOT NULL
    ORDER BY started_at DESC
    LIMIT 5
" 2>/dev/null || echo "无错误记录或字段不存在"
echo ""

# 4. 检查数据源状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 4. 数据源状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d finapp_production -c "
    SELECT 
        id,
        name,
        provider,
        is_active,
        priority,
        TO_CHAR(last_sync_at, 'YYYY-MM-DD HH24:MI:SS') as last_sync
    FROM finapp.price_data_sources
    ORDER BY priority, name
"
echo ""

# 5. 检查同步任务配置
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  5. 同步任务配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d finapp_production -c "
    SELECT 
        t.id,
        t.name,
        t.is_active,
        t.schedule,
        ds.name as data_source,
        TO_CHAR(t.last_run_at, 'YYYY-MM-DD HH24:MI:SS') as last_run,
        TO_CHAR(t.next_run_at, 'YYYY-MM-DD HH24:MI:SS') as next_run
    FROM finapp.price_sync_tasks t
    LEFT JOIN finapp.price_data_sources ds ON t.data_source_id = ds.id
    ORDER BY t.is_active DESC, t.name
"
echo ""

# 6. 检查后端服务状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 6. 后端服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f /opt/finapp/releases/*/logs/backend.pid ]; then
    BACKEND_PID=$(cat /opt/finapp/releases/$(ls -t /opt/finapp/releases | grep -E '^[0-9]{8}_[0-9]{6}$' | head -1)/logs/backend.pid 2>/dev/null)
    if [ -n "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "   ${GREEN}✅ 后端服务运行中 (PID: $BACKEND_PID)${NC}"
    else
        echo -e "   ${RED}❌ 后端服务未运行${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  找不到后端PID文件${NC}"
fi

# 测试后端API
echo ""
echo "   测试后端健康检查..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ 后端API响应正常${NC}"
else
    echo -e "   ${RED}❌ 后端API无响应${NC}"
fi
echo ""

# 7. 检查后端日志中的错误
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 7. 后端日志中的同步相关错误（最近20行）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BACKEND_LOG="/opt/finapp/releases/$(ls -t /opt/finapp/releases | grep -E '^[0-9]{8}_[0-9]{6}$' | head -1)/logs/backend.log"
if [ -f "$BACKEND_LOG" ]; then
    grep -i "sync\|error\|fail" "$BACKEND_LOG" | tail -20 || echo "未找到同步相关错误"
else
    echo -e "${YELLOW}⚠️  找不到后端日志文件${NC}"
fi
echo ""

# 8. 检查数据库连接
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  8. 数据库连接状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if sudo -u postgres psql -d finapp_production -c '\q' 2>/dev/null; then
    echo -e "   ${GREEN}✅ 数据库连接正常${NC}"
    
    # 检查数据库活动连接
    CONN_COUNT=$(sudo -u postgres psql -d finapp_production -tAc "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'finapp_production'")
    echo "   当前活动连接数: $CONN_COUNT"
else
    echo -e "   ${RED}❌ 数据库连接失败${NC}"
fi
echo ""

# 9. 检查网络连接（测试外部API）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 9. 外部API连接测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 测试几个常用的数据源
echo "   测试天天基金 API..."
if curl -s --connect-timeout 5 "http://fundgz.1234567.com.cn/js/000001.js" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ 天天基金 API 可访问${NC}"
else
    echo -e "   ${RED}❌ 天天基金 API 不可访问${NC}"
fi

echo "   测试新浪财经 API..."
if curl -s --connect-timeout 5 "https://hq.sinajs.cn/list=sh000001" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ 新浪财经 API 可访问${NC}"
else
    echo -e "   ${RED}❌ 新浪财经 API 不可访问${NC}"
fi

echo "   测试 Binance API..."
if curl -s --connect-timeout 5 "https://api.binance.com/api/v3/ping" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Binance API 可访问${NC}"
else
    echo -e "   ${RED}❌ Binance API 不可访问${NC}"
fi
echo ""

# 10. 总结和建议
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 10. 故障排查建议"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "根据诊断结果，请检查以下内容："
echo ""
echo "1️⃣  如果后端服务未运行："
echo "   bash scripts/restart-backend-ubuntu.sh"
echo ""
echo "2️⃣  如果外部API不可访问（网络问题）："
echo "   - 检查服务器网络连接"
echo "   - 检查防火墙设置"
echo "   - 考虑使用代理"
echo ""
echo "3️⃣  如果数据库连接失败："
echo "   sudo systemctl restart postgresql"
echo "   sudo -u postgres psql -d finapp_production"
echo ""
echo "4️⃣  如果有具体错误信息："
echo "   - 查看上面的错误详情"
echo "   - 查看完整后端日志: tail -100 $BACKEND_LOG"
echo ""
echo "5️⃣  手动测试同步任务："
echo "   curl -X POST http://localhost:8000/api/price-sync/tasks/{TASK_ID}/execute \\"
echo "     -H \"Authorization: Bearer YOUR_TOKEN\""
echo ""
echo "6️⃣  查看同步错误详情表："
echo "   sudo -u postgres psql -d finapp_production -c \\"
echo "     \"SELECT * FROM finapp.price_sync_errors ORDER BY created_at DESC LIMIT 10\""
echo ""
