#!/bin/bash
# FinApp - 完整重启脚本 (拉取最新代码并重启所有服务)

set -e

echo "🔄 开始完整重启FinApp服务..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
echo "📂 项目目录: $PROJECT_DIR"

# 1. 拉取最新代码
echo ""
echo "📥 拉取最新代码..."
cd "$PROJECT_DIR"
git fetch origin
git pull origin master

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 代码拉取失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 代码拉取成功${NC}"

# 2. 停止所有服务
echo ""
echo "🛑 停止所有服务..."

# 停止后端
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid 2>/dev/null)
    if [ -n "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ 已停止后端服务 (PID: $BACKEND_PID)${NC}"
    fi
    rm -f logs/backend.pid
fi
pkill -f "node.*dist/server" || true

# 停止前端
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid 2>/dev/null)
    if [ -n "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 2
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ 已停止前端服务 (PID: $FRONTEND_PID)${NC}"
    fi
    rm -f logs/frontend.pid
fi
pkill -f "serve.*3001" || true
pkill -f "vite.*preview" || true

sleep 3

# 3. 调用完整启动脚本
echo ""
echo "🚀 启动所有服务..."
bash "$PROJECT_DIR/scripts/start-all-services-ubuntu.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 服务重启完成!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ 服务重启失败${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
