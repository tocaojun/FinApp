#!/bin/bash
# FinApp - Ubuntu生产环境停止脚本

set -e

echo "🛑 停止FinApp生产服务 (Ubuntu)..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/.." || exit 1

# 1. 停止前端服务
echo ""
echo "🎨 停止前端服务..."
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✅ 前端服务已停止 (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  前端服务未在运行${NC}"
    fi
    rm logs/frontend.pid
else
    pkill -f "serve.*3001" || true
    pkill -f "vite.*preview" || true
    echo -e "${YELLOW}⚠️  未找到前端PID文件，已尝试强制停止${NC}"
fi

# 2. 停止后端服务
echo ""
echo "🔧 停止后端服务..."
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo -e "${GREEN}✅ 后端服务已停止 (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  后端服务未在运行${NC}"
    fi
    rm logs/backend.pid
else
    pkill -f "node.*backend" || true
    echo -e "${YELLOW}⚠️  未找到后端PID文件，已尝试强制停止${NC}"
fi

# 等待进程完全停止
sleep 2

# 3. 可选：停止PostgreSQL服务（生产环境通常不停止数据库）
echo ""
read -p "是否停止PostgreSQL服务？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 停止PostgreSQL服务..."
    sudo systemctl stop postgresql
    echo -e "${GREEN}✅ PostgreSQL已停止${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL保持运行${NC}"
fi

echo ""
echo -e "${GREEN}🎉 服务停止完成！${NC}"
echo ""
echo "💡 提示："
echo "   重新启动: bash scripts/start-all-services-ubuntu.sh"
echo "   查看状态: systemctl status postgresql"
echo ""
