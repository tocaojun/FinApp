#!/bin/bash
# FinApp - 修复生产环境前端配置和重新部署
# 用途：确保前端正确使用环境变量并重新构建

set -e

echo "🔧 修复生产环境前端配置..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 进入项目目录
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo -e "${BLUE}📂 项目根目录: $PROJECT_ROOT${NC}"

# 2. 检查并创建 .env.production 文件
echo ""
echo "📝 检查前端环境配置..."

if [ ! -f "frontend/.env.production" ]; then
    echo -e "${YELLOW}⚠️  未找到 frontend/.env.production，正在创建...${NC}"
    cat > frontend/.env.production << 'EOF'
VITE_API_BASE_URL=http://apollo123.cloud:8000/api
VITE_APP_TITLE=FinApp
EOF
    echo -e "${GREEN}✅ 已创建 frontend/.env.production${NC}"
else
    echo -e "${GREEN}✅ frontend/.env.production 已存在${NC}"
fi

echo ""
echo "当前配置内容："
cat frontend/.env.production

# 3. 清理前端缓存
echo ""
echo "🧹 清理前端缓存..."
cd frontend

rm -rf dist
rm -rf node_modules/.vite
rm -rf .vite

echo -e "${GREEN}✅ 缓存已清理${NC}"

# 4. 重新构建前端（使用生产环境配置）
echo ""
echo "📦 重新构建前端（使用生产环境配置）..."
echo -e "${BLUE}ℹ️  NODE_ENV=production${NC}"

# 显示构建时读取的环境变量
echo ""
echo "构建环境变量："
echo "  NODE_ENV=production"
echo "  VITE_API_BASE_URL=$(grep VITE_API_BASE_URL .env.production | cut -d= -f2)"

# 执行构建
NODE_ENV=production npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi

# 5. 验证构建产物
echo ""
echo "🔍 验证构建产物..."

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist 目录不存在${NC}"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ index.html 不存在${NC}"
    exit 1
fi

# 检查构建产物中是否包含正确的API地址
echo ""
echo "检查构建产物中的API配置..."
if grep -r "apollo123.cloud:8000" dist/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 构建产物中包含正确的API地址 (apollo123.cloud:8000)${NC}"
else
    echo -e "${YELLOW}⚠️  警告：构建产物中未找到 apollo123.cloud:8000${NC}"
    echo "    这可能意味着环境变量未正确注入"
    echo ""
    echo "正在检查构建产物中的API引用..."
    grep -r "localhost:8000" dist/ || echo "未找到localhost:8000引用"
fi

echo -e "${GREEN}✅ 前端构建成功${NC}"

# 6. 停止旧的前端服务
echo ""
echo "🛑 停止旧的前端服务..."

if [ -f ../logs/frontend.pid ]; then
    OLD_PID=$(cat ../logs/frontend.pid 2>/dev/null)
    if [ -n "$OLD_PID" ] && kill -0 $OLD_PID 2>/dev/null; then
        kill $OLD_PID 2>/dev/null || true
        sleep 2
        if kill -0 $OLD_PID 2>/dev/null; then
            kill -9 $OLD_PID 2>/dev/null || true
        fi
        echo "已停止旧进程 (PID: $OLD_PID)"
    fi
    rm -f ../logs/frontend.pid
fi

pkill -f "serve.*3001" || true
pkill -f "vite.*preview" || true
sleep 2

echo -e "${GREEN}✅ 旧服务已停止${NC}"

# 7. 启动新的前端服务
echo ""
echo "🚀 启动新的前端服务..."

mkdir -p ../logs

if command -v serve &> /dev/null; then
    nohup serve -s dist -l 3001 -L > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    echo -e "${GREEN}✅ 前端服务已启动 (serve, PID: $FRONTEND_PID)${NC}"
else
    nohup npm run preview -- --port 3001 --host 0.0.0.0 > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    echo -e "${GREEN}✅ 前端服务已启动 (vite preview, PID: $FRONTEND_PID)${NC}"
fi

# 8. 等待服务启动
echo ""
echo "⏳ 等待前端服务就绪..."
sleep 3

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ 前端服务运行正常${NC}"
else
    echo -e "${RED}❌ 前端服务启动失败${NC}"
    echo "查看日志："
    tail -n 20 ../logs/frontend.log
    exit 1
fi

# 9. 完成
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 前端配置修复完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 访问地址："
echo "   http://apollo123.cloud:3001"
echo ""
echo "💡 接下来的步骤："
echo "   1. 在浏览器中访问 http://apollo123.cloud:3001"
echo "   2. 按 Ctrl+Shift+Delete 清除浏览器缓存"
echo "   3. 或使用隐私模式打开 (Ctrl+Shift+N)"
echo "   4. 登录后检查数据源、同步任务、同步日志是否显示"
echo ""
echo "📊 验证命令："
echo "   curl http://apollo123.cloud:3001"
echo "   tail -f logs/frontend.log"
echo ""
