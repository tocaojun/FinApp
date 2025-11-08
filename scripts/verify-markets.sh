#!/bin/bash

# 市场数据验证脚本
# 用途：验证市场数据是否完整且正确

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    市场数据完整性验证脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查数据库连接
echo -e "${YELLOW}步骤 1: 检查数据库连接...${NC}"
if psql -h localhost -U finapp_user -d finapp_test -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 数据库连接成功${NC}"
else
    echo -e "${RED}✗ 数据库连接失败${NC}"
    exit 1
fi
echo ""

# 2. 检查市场表是否存在
echo -e "${YELLOW}步骤 2: 检查市场表...${NC}"
TABLE_CHECK=$(psql -h localhost -U finapp_user -d finapp_test -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='finapp' AND table_name='markets'")
if [ "$TABLE_CHECK" -eq 1 ]; then
    echo -e "${GREEN}✓ 市场表存在${NC}"
else
    echo -e "${RED}✗ 市场表不存在${NC}"
    exit 1
fi
echo ""

# 3. 检查市场数据数量
echo -e "${YELLOW}步骤 3: 检查市场数据数量...${NC}"
MARKET_COUNT=$(psql -h localhost -U finapp_user -d finapp_test -t -c "SELECT COUNT(*) FROM finapp.markets WHERE is_active = true")
echo -e "活跃市场数量: ${BLUE}$MARKET_COUNT${NC}"

if [ "$MARKET_COUNT" -ge 8 ]; then
    echo -e "${GREEN}✓ 市场数据足够（至少 8 个）${NC}"
else
    echo -e "${YELLOW}⚠ 市场数据较少（仅 $MARKET_COUNT 个）${NC}"
fi
echo ""

# 4. 显示所有市场详细信息
echo -e "${YELLOW}步骤 4: 显示市场详细信息...${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────────${NC}"
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT 
    code AS \"代码\",
    name AS \"名称\",
    country AS \"国家\",
    currency AS \"货币\",
    timezone AS \"时区\"
FROM finapp.markets
WHERE is_active = true
ORDER BY code
"
echo -e "${BLUE}─────────────────────────────────────────────────────────────${NC}"
echo ""

# 5. 验证必须的市场是否存在
echo -e "${YELLOW}步骤 5: 验证必须的市场...${NC}"

REQUIRED_MARKETS=("SSE" "SZSE" "HKEX" "NYSE" "NASDAQ" "LSE" "TSE" "FWB")
MISSING_MARKETS=()

for market in "${REQUIRED_MARKETS[@]}"; do
    FOUND=$(psql -h localhost -U finapp_user -d finapp_test -t -c "SELECT COUNT(*) FROM finapp.markets WHERE code = '$market' AND is_active = true")
    if [ "$FOUND" -eq 1 ]; then
        echo -e "${GREEN}✓ 市场 $market 存在${NC}"
    else
        echo -e "${RED}✗ 市场 $market 缺失${NC}"
        MISSING_MARKETS+=("$market")
    fi
done

if [ ${#MISSING_MARKETS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ 所有必须的市场都存在${NC}"
else
    echo -e "${RED}✗ 缺失市场: ${MISSING_MARKETS[*]}${NC}"
fi
echo ""

# 6. 检查每个市场的完整性
echo -e "${YELLOW}步骤 6: 检查市场字段完整性...${NC}"
INCOMPLETE=$(psql -h localhost -U finapp_user -d finapp_test -t -c "
SELECT COUNT(*) FROM finapp.markets
WHERE is_active = true 
  AND (code IS NULL OR name IS NULL OR country IS NULL OR currency IS NULL OR timezone IS NULL)
")

if [ "$INCOMPLETE" -eq 0 ]; then
    echo -e "${GREEN}✓ 所有市场字段完整${NC}"
else
    echo -e "${RED}✗ 有 $INCOMPLETE 个市场字段不完整${NC}"
fi
echo ""

# 7. 检查 API 端点
echo -e "${YELLOW}步骤 7: 检查 API 端点...${NC}"
if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/markets 2>/dev/null || echo "000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ API 端点可访问 (HTTP $HTTP_CODE)${NC}"
        MARKET_COUNT_API=$(echo "$RESPONSE" | head -n -1 | grep -o '"id"' | wc -l)
        echo -e "API 返回市场数: ${BLUE}$MARKET_COUNT_API${NC}"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "${YELLOW}⚠ 后端服务未运行 (无法连接)${NC}"
    else
        echo -e "${YELLOW}⚠ API 返回异常 (HTTP $HTTP_CODE)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ curl 命令不可用，跳过 API 检查${NC}"
fi
echo ""

# 8. 总结
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}              验证完成${NC}"
echo -e "${BLUE}========================================${NC}"

if [ ${#MISSING_MARKETS[@]} -eq 0 ] && [ "$INCOMPLETE" -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查通过，市场数据完整！${NC}"
    exit 0
else
    echo -e "${RED}✗ 有错误需要修复${NC}"
    exit 1
fi
