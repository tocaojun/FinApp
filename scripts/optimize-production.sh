#!/bin/bash
# 生产环境性能优化脚本

echo "🚀 开始性能优化..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 清理旧日志
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  清理日志文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "logs" ]; then
    echo "📊 当前日志大小:"
    du -sh logs/
    echo ""
    
    echo "🗑️  清理超过7天的日志..."
    find logs/ -type f -name "*.log" -mtime +7 -delete
    find logs/ -type f -name "*.log.*" -mtime +7 -delete
    
    echo "📊 清理后日志大小:"
    du -sh logs/
    echo -e "${GREEN}✅ 日志清理完成${NC}"
else
    echo -e "${YELLOW}⚠️  logs目录不存在${NC}"
fi
echo ""

# 2. 优化后端启动配置
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  优化Node.js内存配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 获取系统总内存(MB)
TOTAL_MEM=$(free -m | grep Mem | awk '{print $2}')
echo "📊 系统总内存: ${TOTAL_MEM}MB"

# 根据总内存设置Node.js堆大小
if [ "$TOTAL_MEM" -lt 2048 ]; then
    # 小于2GB: 使用512MB
    RECOMMENDED_HEAP=512
    echo -e "${YELLOW}⚠️  内存较小 (<2GB)${NC}"
elif [ "$TOTAL_MEM" -lt 4096 ]; then
    # 2-4GB: 使用1GB
    RECOMMENDED_HEAP=1024
    echo -e "${BLUE}ℹ️  内存适中 (2-4GB)${NC}"
else
    # >4GB: 使用2GB
    RECOMMENDED_HEAP=2048
    echo -e "${GREEN}✓ 内存充足 (>4GB)${NC}"
fi

echo "💡 推荐Node.js堆大小: ${RECOMMENDED_HEAP}MB"
echo ""

# 3. 重启服务使用优化配置
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  应用优化配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "是否立即重启服务应用优化? (y/n): " RESTART_CONFIRM

if [ "$RESTART_CONFIRM" = "y" ]; then
    echo "🔄 重启后端服务..."
    
    # 停止后端
    if [ -f "logs/backend.pid" ]; then
        OLD_PID=$(cat logs/backend.pid)
        if kill -0 $OLD_PID 2>/dev/null; then
            kill $OLD_PID
            sleep 2
        fi
    fi
    pkill -f "node.*dist/server" || true
    
    # 使用优化的内存配置启动
    cd backend
    export NODE_OPTIONS="--max-old-space-size=${RECOMMENDED_HEAP}"
    NODE_ENV=production nohup node dist/server.js > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    
    echo -e "${GREEN}✅ 后端服务已重启 (PID: $BACKEND_PID, 堆大小: ${RECOMMENDED_HEAP}MB)${NC}"
    
    # 等待服务启动
    echo "⏳ 等待服务就绪..."
    sleep 3
    
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务运行正常${NC}"
    else
        echo -e "${RED}❌ 后端服务启动失败，请检查日志${NC}"
    fi
    
    cd ..
else
    echo -e "${YELLOW}⚠️  已跳过重启，请手动应用优化配置${NC}"
    echo "手动重启命令:"
    echo "  export NODE_OPTIONS=\"--max-old-space-size=${RECOMMENDED_HEAP}\""
    echo "  NODE_ENV=production node backend/dist/server.js"
fi
echo ""

# 4. 数据库优化建议
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  数据库优化建议"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "💡 PostgreSQL优化建议:"
echo "  1. 调整shared_buffers (推荐: 25% 系统内存)"
echo "     当前建议: $((TOTAL_MEM / 4))MB"
echo ""
echo "  2. 增加work_mem (每个查询的工作内存)"
echo "     当前建议: $((TOTAL_MEM / 100))MB"
echo ""
echo "  3. 启用查询性能分析:"
echo "     sudo -u postgres psql -d finapp_production -c \"CREATE EXTENSION IF NOT EXISTS pg_stat_statements;\""
echo ""

# 5. 创建优化后的启动脚本
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  创建优化启动脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 更新启动脚本
if [ -f "scripts/start-all-services-ubuntu.sh" ]; then
    # 备份原脚本
    cp scripts/start-all-services-ubuntu.sh scripts/start-all-services-ubuntu.sh.bak
    
    # 更新内存配置
    sed -i "s/NODE_MEMORY=\"--max-old-space-size=[0-9]*\"/NODE_MEMORY=\"--max-old-space-size=${RECOMMENDED_HEAP}\"/" scripts/start-all-services-ubuntu.sh
    
    echo -e "${GREEN}✅ 已更新启动脚本的内存配置${NC}"
    echo "备份保存在: scripts/start-all-services-ubuntu.sh.bak"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 优化完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 已应用的优化:"
echo "  ✓ 清理旧日志文件"
echo "  ✓ 优化Node.js内存配置 (${RECOMMENDED_HEAP}MB)"
if [ "$RESTART_CONFIRM" = "y" ]; then
    echo "  ✓ 重启后端服务"
fi
echo ""
echo "💡 其他建议:"
echo "  - 考虑使用PM2进行进程管理"
echo "  - 配置nginx作为反向代理"
echo "  - 启用gzip压缩"
echo "  - 配置Redis缓存"
echo ""
