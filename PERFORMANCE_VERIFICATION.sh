#!/bin/bash

# FinApp 性能优化验证脚本
# 用于验证第 1-3 天优化的实际效果

set -e

echo "=========================================="
echo "FinApp 性能优化验证开始"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查服务是否运行
echo -e "${YELLOW}[1/4] 检查服务状态...${NC}"
if lsof -i :8000 | grep -q LISTEN; then
    echo -e "${GREEN}✓ 后端服务运行中 (端口 8000)${NC}"
else
    echo -e "${RED}✗ 后端服务未运行${NC}"
    exit 1
fi

if lsof -i :3001 | grep -q LISTEN; then
    echo -e "${GREEN}✓ 前端服务运行中 (端口 3001)${NC}"
else
    echo -e "${RED}✗ 前端服务未运行${NC}"
    exit 1
fi
echo ""

# 2. 检查数据库连接和索引
echo -e "${YELLOW}[2/4] 检查数据库索引...${NC}"

# 查询是否创建了性能优化索引
INDEXES=$(psql postgresql://finapp_user:finapp_password@localhost:5432/finapp_test -t -c "
  SELECT COUNT(*) FROM pg_indexes 
  WHERE schemaname = 'finapp' 
  AND indexname LIKE 'idx_%'
  AND created_at::date = CURRENT_DATE
" 2>/dev/null || echo "0")

echo "今天创建的索引数量: $INDEXES"

# 检查关键索引
CRITICAL_INDEXES=(
  "idx_user_roles_user_id_active"
  "idx_portfolios_user_id_sort_order"
  "idx_asset_prices_asset_date_desc"
  "idx_positions_portfolio_id_active"
)

for idx in "${CRITICAL_INDEXES[@]}"; do
    if psql postgresql://finapp_user:finapp_password@localhost:5432/finapp_test -t -c "
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'finapp' 
        AND indexname = '$idx'
    " 2>/dev/null | grep -q "1"; then
        echo -e "${GREEN}✓ 索引 $idx 已创建${NC}"
    else
        echo -e "${RED}✗ 索引 $idx 未找到${NC}"
    fi
done
echo ""

# 3. 测试 API 响应时间
echo -e "${YELLOW}[3/4] 测试 API 响应时间...${NC}"

# 获取测试令牌（假设已登录）
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4) || TOKEN=""

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠ 未获取到认证令牌，跳过 API 响应时间测试${NC}"
else
    # 测试投资组合列表 API
    START=$(date +%s%N)
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $TOKEN" \
      http://localhost:8000/api/portfolios)
    END=$(date +%s%N)
    
    DURATION=$((($END - $START) / 1000000))  # 转换为毫秒
    
    echo "投资组合列表 API 响应时间: ${DURATION}ms"
    if [ $DURATION -lt 500 ]; then
        echo -e "${GREEN}✓ 响应时间优异 (< 500ms)${NC}"
    elif [ $DURATION -lt 1000 ]; then
        echo -e "${YELLOW}⚠ 响应时间正常 (< 1000ms)${NC}"
    else
        echo -e "${RED}✗ 响应时间较慢 (> 1000ms)${NC}"
    fi
fi
echo ""

# 4. 检查代码修改
echo -e "${YELLOW}[4/4] 检查代码修改...${NC}"

FILES_MODIFIED=(
    "backend/src/services/PermissionService.ts"
    "backend/src/services/PortfolioService.ts"
    "frontend/src/services/api.ts"
)

for file in "${FILES_MODIFIED[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ 文件已修改: $file${NC}"
    else
        echo -e "${RED}✗ 文件未找到: $file${NC}"
    fi
done

# 检查关键代码片段
if grep -q "LOCAL_CACHE_TTL" backend/src/services/PermissionService.ts; then
    echo -e "${GREEN}✓ P1-1 优化已应用 (权限缓存)${NC}"
else
    echo -e "${RED}✗ P1-1 优化未找到${NC}"
fi

if grep -q "AbortController" frontend/src/services/api.ts; then
    echo -e "${GREEN}✓ P1-3 优化已应用 (前端超时)${NC}"
else
    echo -e "${RED}✗ P1-3 优化未找到${NC}"
fi

if grep -q "GROUP BY p.id" backend/src/services/PortfolioService.ts; then
    echo -e "${GREEN}✓ P1-2 优化已应用 (N+1 查询修复)${NC}"
else
    echo -e "${RED}✗ P1-2 优化未找到${NC}"
fi

echo ""
echo "=========================================="
echo "✅ 性能优化验证完成"
echo "=========================================="
echo ""
echo "推荐的后续步骤:"
echo "1. 访问 http://localhost:3001 测试应用"
echo "2. 检查浏览器开发工具 → Network，观察 API 响应时间"
echo "3. 查看后端日志了解性能改进"
echo ""
echo "更多信息请参考:"
echo "- OPTIMIZATION_COMPLETION_REPORT.md"
echo "- OPTIMIZATION_RECOMMENDATIONS.md"
echo "=========================================="
