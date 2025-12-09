#!/bin/bash
# 前端API配置诊断脚本

echo "🔍 前端API配置诊断..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 检查环境变量文件
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  检查环境变量文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "frontend/.env.production" ]; then
    echo -e "${GREEN}✅ .env.production 存在${NC}"
    echo ""
    echo "📄 内容:"
    cat frontend/.env.production
else
    echo -e "${RED}❌ .env.production 不存在${NC}"
fi
echo ""

# 2. 检查构建产物中的API地址
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  检查构建产物中的API配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "frontend/dist/assets" ]; then
    echo "🔍 搜索 apollo123.cloud:8000 ..."
    if grep -r "apollo123.cloud:8000" frontend/dist/assets/ 2>/dev/null; then
        echo -e "${GREEN}✅ 找到正确的生产API地址${NC}"
    else
        echo -e "${RED}❌ 未找到 apollo123.cloud:8000${NC}"
        echo ""
        echo "🔍 搜索 localhost:8000 ..."
        if grep -r "localhost:8000" frontend/dist/assets/ 2>/dev/null | head -3; then
            echo -e "${YELLOW}⚠️  构建产物中包含 localhost (错误!)${NC}"
        fi
    fi
else
    echo -e "${RED}❌ 构建产物目录不存在${NC}"
fi
echo ""

# 3. 检查前端源码中的硬编码
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  检查源码中的硬编码"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 搜索 'http://localhost:8000' ..."
HARDCODED=$(grep -r "http://localhost:8000" frontend/src/ 2>/dev/null | grep -v "import.meta.env" | wc -l)
if [ "$HARDCODED" -gt 0 ]; then
    echo -e "${RED}❌ 发现 $HARDCODED 处硬编码${NC}"
    grep -r "http://localhost:8000" frontend/src/ 2>/dev/null | grep -v "import.meta.env" | head -5
else
    echo -e "${GREEN}✅ 未发现硬编码${NC}"
fi
echo ""

# 4. 检查前端服务
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  检查前端服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ 前端服务运行中 (PID: $FRONTEND_PID)${NC}"
        echo ""
        echo "📊 进程详情:"
        ps aux | grep $FRONTEND_PID | grep -v grep
    else
        echo -e "${RED}❌ 前端服务未运行${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  未找到 frontend.pid 文件${NC}"
fi
echo ""

# 5. 测试前端访问
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  测试前端服务访问"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 测试 localhost:3001 ..."
if curl -s -I http://localhost:3001 | head -1 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ 前端服务可访问${NC}"
else
    echo -e "${RED}❌ 前端服务不可访问${NC}"
fi
echo ""

# 6. 检查后端API
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  测试后端API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 测试 localhost:8000/health ..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ 后端API正常${NC}"
    curl -s http://localhost:8000/health | head -3
else
    echo -e "${RED}❌ 后端API异常${NC}"
fi
echo ""

# 7. 诊断建议
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 诊断建议"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查是否需要重新构建
if [ ! -f "frontend/.env.production" ]; then
    echo -e "${YELLOW}⚠️  需要创建 .env.production 文件${NC}"
    echo "   执行: echo 'VITE_API_BASE_URL=http://apollo123.cloud:8000/api' > frontend/.env.production"
fi

if [ -d "frontend/dist/assets" ]; then
    if ! grep -r "apollo123.cloud:8000" frontend/dist/assets/ >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  需要重新构建前端 (使用正确的环境变量)${NC}"
        echo "   执行: bash scripts/redeploy-frontend-ubuntu.sh"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 诊断完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
