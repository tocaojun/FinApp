#!/bin/bash
# FinApp - Ubuntu生产环境启动脚本

set -e

echo "🚀 启动FinApp生产服务 (Ubuntu)..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}⚠️  警告: 不建议使用root用户运行${NC}"
fi

# 1. 检查PostgreSQL服务
echo ""
echo "📊 检查PostgreSQL服务..."
if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL已在运行${NC}"
else
    echo "启动PostgreSQL..."
    sudo systemctl start postgresql
    sleep 3
    if sudo systemctl is-active --quiet postgresql; then
        echo -e "${GREEN}✅ PostgreSQL启动成功${NC}"
    else
        echo -e "${RED}❌ PostgreSQL启动失败${NC}"
        sudo systemctl status postgresql
        exit 1
    fi
fi

# 2. 检查数据库连接
echo ""
echo "🔍 检查数据库连接..."
if sudo -u postgres psql -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✅ 数据库连接正常${NC}"
else
    echo -e "${RED}❌ 数据库连接失败${NC}"
    exit 1
fi

# 3. 检查生产数据库是否存在
echo ""
echo "🔍 检查生产数据库..."
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='finapp_production'")
if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}✅ 数据库 finapp_production 已存在${NC}"
else
    echo -e "${YELLOW}⚠️  数据库不存在，请先运行数据库迁移脚本${NC}"
    echo "   sudo bash scripts/production-restore-guide.sh"
    exit 1
fi

# 4. 启动后端服务
echo ""
echo "🔧 启动后端服务..."
cd "$(dirname "$0")/.." || exit 1

# 检查后端目录
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ 找不到backend目录${NC}"
    exit 1
fi

cd backend

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 检查.env文件
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  警告: 未找到 .env.production 文件${NC}"
    echo "正在从 .env 复制..."
    if [ -f ".env" ]; then
        cp .env .env.production
        echo -e "${GREEN}✅ 已创建 .env.production${NC}"
    else
        echo -e "${RED}❌ 未找到环境配置文件${NC}"
        exit 1
    fi
fi

# 更新生产环境配置
echo "🔧 更新生产环境配置..."
sed -i 's/finapp_test/finapp_production/g' .env.production
sed -i 's/NODE_ENV="development"/NODE_ENV="production"/g' .env.production
sed -i 's/ENABLE_WEALTH_MONITORING=false/ENABLE_WEALTH_MONITORING=true/g' .env.production

# 构建生产版本
echo "📦 构建生产版本..."
if npm run build 2>/dev/null; then
    echo -e "${GREEN}✅ 构建成功${NC}"
else
    echo -e "${YELLOW}⚠️  构建命令未配置，跳过${NC}"
fi

# 停止旧的后端进程
echo "🛑 停止旧的后端进程..."
pkill -f "node.*backend" || true
sleep 2

# 启动后端服务
echo "🚀 启动后端服务..."
NODE_ENV=production nohup npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
echo -e "${GREEN}✅ 后端服务已启动 (PID: $BACKEND_PID)${NC}"

# 等待后端启动
echo "⏳ 等待后端启动..."
for i in {1..10}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务健康检查通过${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ 后端服务启动超时${NC}"
        tail -n 50 ../logs/backend.log
        exit 1
    fi
    sleep 2
done

# 5. 启动前端服务
echo ""
echo "🎨 启动前端服务..."
cd ../frontend

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 构建生产版本
echo "📦 构建前端生产版本..."
npm run build

# 停止旧的前端进程
echo "🛑 停止旧的前端进程..."
pkill -f "node.*frontend" || true
pkill -f "vite" || true
sleep 2

# 使用 serve 或 vite preview 提供前端服务
echo "🚀 启动前端服务..."
if command -v serve &> /dev/null; then
    nohup serve -s dist -l 3001 > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    echo -e "${GREEN}✅ 前端服务已启动 (serve, PID: $FRONTEND_PID)${NC}"
else
    nohup npm run preview -- --port 3001 --host > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    echo -e "${GREEN}✅ 前端服务已启动 (vite preview, PID: $FRONTEND_PID)${NC}"
fi

# 6. 显示服务状态
echo ""
echo "🎉 所有服务启动完成！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 服务访问地址："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🌐 前端应用:    http://localhost:3001"
echo "   🔧 后端API:     http://localhost:8000"
echo "   ❤️  健康检查:    http://localhost:8000/health"
echo "   📊 数据库:      postgresql://localhost:5432/finapp_production"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 服务状态："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "   PostgreSQL:  "
if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}运行中 ✓${NC}"
else
    echo -e "${RED}已停止 ✗${NC}"
fi

echo -n "   后端服务:    "
if [ -f ../logs/backend.pid ] && kill -0 $(cat ../logs/backend.pid) 2>/dev/null; then
    echo -e "${GREEN}运行中 ✓ (PID: $(cat ../logs/backend.pid))${NC}"
else
    echo -e "${RED}已停止 ✗${NC}"
fi

echo -n "   前端服务:    "
if [ -f ../logs/frontend.pid ] && kill -0 $(cat ../logs/frontend.pid) 2>/dev/null; then
    echo -e "${GREEN}运行中 ✓ (PID: $(cat ../logs/frontend.pid))${NC}"
else
    echo -e "${RED}已停止 ✗${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 常用命令："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   查看后端日志: tail -f logs/backend.log"
echo "   查看前端日志: tail -f logs/frontend.log"
echo "   停止所有服务: bash scripts/stop-all-services-ubuntu.sh"
echo "   重启后端:     bash scripts/restart-backend-ubuntu.sh"
echo "   数据库连接:   sudo -u postgres psql -d finapp_production"
echo ""
