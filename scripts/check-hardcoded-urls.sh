#!/bin/bash
# 检查前端代码中的硬编码API地址

echo "🔍 检查前端代码中的硬编码API地址..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(dirname "$0")/.."

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "检查 http://localhost:8000 硬编码"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 查找所有硬编码的 localhost:8000
HARDCODED=$(grep -r "http://localhost:8000" frontend/src/ 2>/dev/null | grep -v "import.meta.env" | grep -v "node_modules" | wc -l)

if [ "$HARDCODED" -gt 0 ]; then
    echo -e "${RED}❌ 发现 $HARDCODED 处硬编码${NC}"
    echo ""
    echo "详细位置:"
    grep -rn "http://localhost:8000" frontend/src/ 2>/dev/null | grep -v "import.meta.env" | grep -v "node_modules"
    echo ""
    echo "💡 建议修复方式:"
    echo "   将 'http://localhost:8000/api' 替换为:"
    echo "   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';"
    echo "   使用: \${API_BASE_URL}/endpoint"
else
    echo -e "${GREEN}✅ 未发现硬编码的 localhost:8000${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "检查其他可能的问题"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 fetch 调用
echo "📊 检查 fetch 调用中的绝对URL:"
FETCH_URLS=$(grep -r "fetch('" frontend/src/ 2>/dev/null | grep "http://" | wc -l)
if [ "$FETCH_URLS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  发现 $FETCH_URLS 处 fetch 使用绝对URL${NC}"
    grep -rn "fetch('" frontend/src/ 2>/dev/null | grep "http://" | head -10
else
    echo -e "${GREEN}✅ 未发现问题${NC}"
fi

echo ""

# 检查 axios 配置
echo "📊 检查 axios baseURL 配置:"
AXIOS_BASE=$(grep -r "baseURL:" frontend/src/ 2>/dev/null | grep "http://" | wc -l)
if [ "$AXIOS_BASE" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  发现 $AXIOS_BASE 处 axios baseURL 硬编码${NC}"
    grep -rn "baseURL:" frontend/src/ 2>/dev/null | grep "http://"
else
    echo -e "${GREEN}✅ 未发现问题${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 检查完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
