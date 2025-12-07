#!/bin/bash
# FinApp - Ubuntu生产环境重启后端脚本

set -e

echo "🔄 重启后端服务 (Ubuntu)..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/../backend" || exit 1

# 1. 停止旧的后端进程
echo "🛑 停止旧的后端进程..."
if [ -f ../logs/backend.pid ]; then
    BACKEND_PID=$(cat ../logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo -e "${GREEN}✅ 后端服务已停止 (PID: $BACKEND_PID)${NC}"
        sleep 2
    fi
    rm ../logs/backend.pid
else
    pkill -f "node.*backend" || true
    sleep 2
fi

# 2. 启动后端服务
echo "🚀 启动后端服务..."
NODE_ENV=production nohup npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
echo -e "${GREEN}✅ 后端服务已启动 (PID: $BACKEND_PID)${NC}"

# 3. 等待后端启动并健康检查
echo "⏳ 等待后端启动..."
for i in {1..10}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务健康检查通过${NC}"
        
        # 显示后端版本信息（如果API支持）
        echo ""
        echo "📋 后端服务信息："
        curl -s http://localhost:8000/health | jq '.' 2>/dev/null || echo "  健康检查: OK"
        
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ 后端服务启动超时${NC}"
        echo ""
        echo "最近的日志:"
        tail -n 50 ../logs/backend.log
        exit 1
    fi
    sleep 2
done

echo ""
echo -e "${GREEN}🎉 后端服务重启完成！${NC}"
echo ""
echo "💡 查看实时日志: tail -f ../logs/backend.log"
echo ""
