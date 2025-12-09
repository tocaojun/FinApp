#!/bin/bash
# 服务器性能诊断脚本

echo "🔍 服务器性能诊断..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  系统资源概况"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# CPU信息
echo "📊 CPU信息:"
echo "  核心数: $(nproc)"
echo "  型号: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d':' -f2 | xargs)"
echo ""

# 内存信息
echo "💾 内存使用:"
free -h
echo ""

# 磁盘信息
echo "💿 磁盘使用:"
df -h / | tail -1
echo ""

# 系统负载
echo "⚡ 系统负载 (1分钟, 5分钟, 15分钟):"
uptime | awk -F'load average:' '{print $2}'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  进程资源占用 (TOP 10)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📊 CPU占用最高的进程:"
ps aux --sort=-%cpu | head -11
echo ""

echo "📊 内存占用最高的进程:"
ps aux --sort=-%mem | head -11
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  FinApp 服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "🔧 后端服务 (Node.js):"
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ 运行中 (PID: $BACKEND_PID)${NC}"
        ps -p $BACKEND_PID -o pid,ppid,%cpu,%mem,vsz,rss,stat,start,time,cmd --no-headers
        echo ""
        echo "详细资源占用:"
        ps -p $BACKEND_PID -o %cpu,%mem,vsz,rss --no-headers | while read cpu mem vsz rss; do
            echo "  CPU: ${cpu}%"
            echo "  内存: ${mem}% (RSS: $((rss/1024))MB, VSZ: $((vsz/1024))MB)"
        done
    else
        echo -e "${RED}❌ 未运行${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  未找到 backend.pid${NC}"
fi
echo ""

echo "🎨 前端服务 (serve/vite):"
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ 运行中 (PID: $FRONTEND_PID)${NC}"
        ps -p $FRONTEND_PID -o pid,ppid,%cpu,%mem,vsz,rss,stat,start,time,cmd --no-headers
        echo ""
        echo "详细资源占用:"
        ps -p $FRONTEND_PID -o %cpu,%mem,vsz,rss --no-headers | while read cpu mem vsz rss; do
            echo "  CPU: ${cpu}%"
            echo "  内存: ${mem}% (RSS: $((rss/1024))MB, VSZ: $((vsz/1024))MB)"
        done
    else
        echo -e "${RED}❌ 未运行${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  未找到 frontend.pid${NC}"
fi
echo ""

echo "📊 PostgreSQL服务:"
if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ 运行中${NC}"
    # 获取PostgreSQL进程信息
    PG_PIDS=$(pgrep -f "postgres:" | head -5)
    if [ -n "$PG_PIDS" ]; then
        echo "$PG_PIDS" | while read pid; do
            ps -p $pid -o pid,%cpu,%mem,vsz,rss,cmd --no-headers 2>/dev/null
        done
    fi
else
    echo -e "${RED}❌ 未运行${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  网络连接状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "🌐 活跃连接数:"
echo "  后端服务 (8000端口): $(netstat -an 2>/dev/null | grep ':8000' | wc -l)"
echo "  前端服务 (3001端口): $(netstat -an 2>/dev/null | grep ':3001' | wc -l)"
echo "  PostgreSQL (5432端口): $(netstat -an 2>/dev/null | grep ':5432' | wc -l)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  响应时间测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "⏱️  后端健康检查响应时间:"
for i in 1 2 3; do
    START=$(date +%s%N)
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        END=$(date +%s%N)
        ELAPSED=$(( (END - START) / 1000000 ))
        if [ $ELAPSED -lt 100 ]; then
            echo -e "  第${i}次: ${GREEN}${ELAPSED}ms ✓${NC}"
        elif [ $ELAPSED -lt 500 ]; then
            echo -e "  第${i}次: ${YELLOW}${ELAPSED}ms ⚠${NC}"
        else
            echo -e "  第${i}次: ${RED}${ELAPSED}ms ✗${NC}"
        fi
    else
        echo -e "  第${i}次: ${RED}失败 ✗${NC}"
    fi
done
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  数据库性能"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📊 数据库连接数:"
DB_CONNECTIONS=$(sudo -u postgres psql -d finapp_production -tAc "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null)
if [ -n "$DB_CONNECTIONS" ]; then
    echo "  当前连接: $DB_CONNECTIONS"
    if [ "$DB_CONNECTIONS" -gt 50 ]; then
        echo -e "  ${RED}⚠️  连接数较高${NC}"
    else
        echo -e "  ${GREEN}✓ 正常${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  无法获取连接数${NC}"
fi
echo ""

echo "📊 慢查询 (>100ms):"
SLOW_QUERIES=$(sudo -u postgres psql -d finapp_production -tAc "SELECT count(*) FROM pg_stat_statements WHERE mean_exec_time > 100;" 2>/dev/null)
if [ -n "$SLOW_QUERIES" ] && [ "$SLOW_QUERIES" != "0" ]; then
    echo -e "  ${YELLOW}⚠️  发现 $SLOW_QUERIES 个慢查询${NC}"
else
    echo -e "  ${GREEN}✓ 无慢查询${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  性能瓶颈分析"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""

# 内存使用率分析
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
if [ "$MEM_USAGE" -gt 90 ]; then
    echo -e "${RED}❌ 内存使用率过高: ${MEM_USAGE}%${NC}"
    echo "   建议:"
    echo "   - 增加服务器内存"
    echo "   - 减少Node.js堆内存配置"
    echo "   - 启用swap分区"
elif [ "$MEM_USAGE" -gt 70 ]; then
    echo -e "${YELLOW}⚠️  内存使用率偏高: ${MEM_USAGE}%${NC}"
    echo "   建议: 监控内存使用趋势"
else
    echo -e "${GREEN}✓ 内存使用正常: ${MEM_USAGE}%${NC}"
fi
echo ""

# CPU负载分析
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | xargs)
CPU_CORES=$(nproc)
CPU_LOAD_INT=$(echo "$CPU_LOAD" | cut -d'.' -f1)
if [ "$CPU_LOAD_INT" -gt "$CPU_CORES" ]; then
    echo -e "${RED}❌ CPU负载过高: ${CPU_LOAD} (核心数: ${CPU_CORES})${NC}"
    echo "   建议:"
    echo "   - 检查是否有进程占用过多CPU"
    echo "   - 优化应用代码"
    echo "   - 增加CPU核心数"
elif [ "$CPU_LOAD_INT" -gt $((CPU_CORES * 70 / 100)) ]; then
    echo -e "${YELLOW}⚠️  CPU负载偏高: ${CPU_LOAD} (核心数: ${CPU_CORES})${NC}"
else
    echo -e "${GREEN}✓ CPU负载正常: ${CPU_LOAD} (核心数: ${CPU_CORES})${NC}"
fi
echo ""

# 磁盘使用分析
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}❌ 磁盘使用率过高: ${DISK_USAGE}%${NC}"
    echo "   建议: 清理日志和临时文件"
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "${YELLOW}⚠️  磁盘使用率偏高: ${DISK_USAGE}%${NC}"
else
    echo -e "${GREEN}✓ 磁盘使用正常: ${DISK_USAGE}%${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 优化建议"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "🔧 立即可执行的优化:"
echo "  1. 清理旧日志: bash scripts/cleanup-logs.sh"
echo "  2. 减少Node.js内存: 修改启动脚本中的 NODE_MEMORY"
echo "  3. 启用生产模式优化: 确认 NODE_ENV=production"
echo "  4. 配置nginx反向代理: 减轻Node.js压力"
echo ""

echo "📊 中长期优化:"
echo "  1. 升级服务器配置 (增加内存/CPU)"
echo "  2. 使用CDN加速静态资源"
echo "  3. 数据库查询优化和索引优化"
echo "  4. 启用Redis缓存"
echo "  5. 配置PM2进程管理和负载均衡"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 诊断完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
