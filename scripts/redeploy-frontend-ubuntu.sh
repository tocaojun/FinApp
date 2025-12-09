#!/bin/bash
# FinApp - Ubuntu生产环境前端重新部署脚本
# 用途: 修复API配置后重新部署前端

set -e

echo "🔄 开始重新部署前端服务..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
NODE_MEMORY="--max-old-space-size=4096"  # 4GB 堆内存配置
PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)

echo "📂 项目目录: $PROJECT_DIR"

# 1. 拉取最新代码
echo ""
echo "📥 拉取最新代码..."
cd "$PROJECT_DIR"
git pull origin master

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 代码拉取失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 代码拉取成功${NC}"

# 2. 停止前端服务
echo ""
echo "🛑 停止前端服务..."
if [ -f logs/frontend.pid ]; then
    OLD_PID=$(cat logs/frontend.pid 2>/dev/null)
    if [ -n "$OLD_PID" ] && kill -0 $OLD_PID 2>/dev/null; then
        kill $OLD_PID 2>/dev/null || true
        sleep 2
        # 如果进程未终止，强制杀死
        if kill -0 $OLD_PID 2>/dev/null; then
            kill -9 $OLD_PID 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ 已停止旧进程 (PID: $OLD_PID)${NC}"
    fi
    rm -f logs/frontend.pid
fi
pkill -f "serve.*3001" || true
pkill -f "vite.*preview" || true
sleep 2

# 3. 进入前端目录
echo ""
echo "📂 进入前端目录..."
cd frontend

# 4. 检查环境配置文件
echo ""
echo "🔍 检查环境配置..."
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ 未找到 .env.production 文件${NC}"
    exit 1
fi

echo "当前 .env.production 内容:"
cat .env.production
echo ""

# 验证API地址配置
if ! grep -q "VITE_API_BASE_URL=http://apollo123.cloud:8000/api" .env.production; then
    echo -e "${YELLOW}⚠️  警告: API地址配置可能不正确${NC}"
    echo "期望: VITE_API_BASE_URL=http://apollo123.cloud:8000/api"
fi

# 5. 检查依赖
echo ""
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
else
    echo -e "${GREEN}✅ 依赖已存在${NC}"
fi

# 6. 重新构建前端
echo ""
echo "📦 重新构建前端..."
echo -e "${BLUE}ℹ️  使用内存配置: NODE_OPTIONS=${NODE_MEMORY}${NC}"

# 清除旧的构建产物
if [ -d "dist" ]; then
    echo "清除旧的构建产物..."
    rm -rf dist
fi

# 执行构建
export NODE_OPTIONS="${NODE_MEMORY}"
npm run build 2>&1 | tee ../logs/frontend-build.log
BUILD_EXIT_CODE=${PIPESTATUS[0]}
unset NODE_OPTIONS

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ 前端构建失败 (退出码: $BUILD_EXIT_CODE)${NC}"
    echo "请查看日志: cat logs/frontend-build.log"
    exit 1
fi

# 7. 验证构建产物
echo ""
echo "🔍 验证构建产物..."
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ 前端构建产物不完整 (index.html不存在)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 构建产物验证通过${NC}"

# 8. 检查API配置是否正确注入
echo ""
echo "🔍 验证API配置注入..."
if grep -r "apollo123.cloud:8000" dist/assets/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API配置已正确注入到构建文件中${NC}"
    echo "找到的配置片段:"
    grep -r "apollo123.cloud:8000" dist/assets/ | head -3
else
    echo -e "${YELLOW}⚠️  警告: 未在构建文件中找到生产API地址${NC}"
    echo "这可能意味着环境变量未正确注入"
fi

# 9. 重新启动前端服务
echo ""
echo "🚀 启动前端服务..."
cd ..

if command -v serve &> /dev/null; then
    echo "使用 serve 启动..."
    nohup serve -s frontend/dist -l 3001 -L > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > logs/frontend.pid
    echo -e "${GREEN}✅ 前端服务已启动 (serve, PID: $FRONTEND_PID)${NC}"
else
    echo "使用 vite preview 启动..."
    cd frontend
    nohup npm run preview -- --port 3001 --host 0.0.0.0 > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    echo $FRONTEND_PID > logs/frontend.pid
    echo -e "${GREEN}✅ 前端服务已启动 (vite preview, PID: $FRONTEND_PID)${NC}"
fi

# 10. 等待服务启动
echo ""
echo "⏳ 等待前端服务启动..."
sleep 3

# 11. 验证服务状态
echo ""
echo "🔍 验证服务状态..."
if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端进程运行中 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ 前端进程未运行${NC}"
    echo "查看日志:"
    tail -20 logs/frontend.log
    exit 1
fi

# 12. 测试本地访问
echo ""
echo "🔍 测试本地访问..."
if curl -s -I http://localhost:3001 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ 前端服务本地访问正常${NC}"
else
    echo -e "${YELLOW}⚠️  前端服务本地访问可能有问题${NC}"
fi

# 13. 显示日志
echo ""
echo "📋 前端日志 (最后20行):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -20 logs/frontend.log
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 14. 最终提示
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 前端重新部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 服务访问地址:"
echo "   🌐 前端应用:    http://apollo123.cloud:3001"
echo "   🔧 后端API:     http://apollo123.cloud:8000"
echo "   ❤️  健康检查:    http://apollo123.cloud:8000/health"
echo ""
echo "💡 提示:"
echo "   1. 从浏览器访问: http://apollo123.cloud:3001"
echo "   2. 使用 F12 打开开发者工具查看网络请求"
echo "   3. 尝试登录测试 API 连接"
echo "   4. 如有问题,查看日志: tail -f logs/frontend.log"
echo ""
echo "📊 测试账户:"
echo "   邮箱: admin@example.com"
echo "   密码: admin123"
echo ""
