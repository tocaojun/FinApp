#!/bin/bash

# 数据源动态过滤功能测试脚本
# 用于测试 GET /api/price-sync/data-sources/:id/coverage 端点

set -e

# 配置
API_URL="${API_URL:-http://localhost:5000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}数据源动态过滤功能测试${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# 第一步：获取所有数据源
echo -e "${YELLOW}第一步：获取所有活跃的数据源...${NC}"
RESPONSE=$(curl -s -X GET \
  "${API_URL}/api/price-sync/data-sources" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json")

echo -e "${BLUE}响应:${NC}"
echo "$RESPONSE" | jq . || echo "$RESPONSE"

# 提取第一个数据源的 ID
DATA_SOURCE_ID=$(echo "$RESPONSE" | jq -r '.data[0].id' 2>/dev/null || echo "")

if [ -z "$DATA_SOURCE_ID" ] || [ "$DATA_SOURCE_ID" == "null" ]; then
  echo -e "${RED}❌ 未找到可用的数据源，无法继续测试${NC}"
  exit 1
fi

DATA_SOURCE_NAME=$(echo "$RESPONSE" | jq -r '.data[0].name' 2>/dev/null || echo "未知")
echo -e "${GREEN}✅ 获取到数据源: ${DATA_SOURCE_NAME} (ID: ${DATA_SOURCE_ID})${NC}\n"

# 第二步：获取该数据源的覆盖范围
echo -e "${YELLOW}第二步：获取该数据源的覆盖范围...${NC}"
echo -e "请求 URL: ${API_URL}/api/price-sync/data-sources/${DATA_SOURCE_ID}/coverage\n"

COVERAGE_RESPONSE=$(curl -s -X GET \
  "${API_URL}/api/price-sync/data-sources/${DATA_SOURCE_ID}/coverage" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json")

echo -e "${BLUE}响应:${NC}"
echo "$COVERAGE_RESPONSE" | jq . || echo "$COVERAGE_RESPONSE"

# 检查响应
if echo "$COVERAGE_RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
  echo -e "\n${GREEN}✅ API 响应成功${NC}"
  
  # 提取产品类型
  PRODUCTS=$(echo "$COVERAGE_RESPONSE" | jq '.data.productTypes' 2>/dev/null)
  echo -e "${BLUE}支持的产品类型:${NC} $PRODUCTS"
  
  # 提取市场
  MARKETS=$(echo "$COVERAGE_RESPONSE" | jq '.data.markets' 2>/dev/null)
  echo -e "${BLUE}支持的市场:${NC} $MARKETS"
else
  echo -e "\n${RED}❌ API 响应异常${NC}"
fi

echo -e "\n${YELLOW}第三步：测试所有数据源的覆盖范围...${NC}\n"

# 获取所有数据源并测试
DATA_SOURCES=$(echo "$RESPONSE" | jq -r '.data[] | @base64')

for source in $DATA_SOURCES; do
  _jq() {
    echo ${source} | base64 --decode | jq -r ${1}
  }
  
  source_id=$(_jq '.id')
  source_name=$(_jq '.name')
  
  echo -e "${BLUE}测试数据源: ${source_name}${NC}"
  
  coverage=$(curl -s -X GET \
    "${API_URL}/api/price-sync/data-sources/${source_id}/coverage" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json")
  
  if echo "$coverage" | jq -e '.success' >/dev/null 2>&1; then
    products=$(echo "$coverage" | jq '.data.productTypes | length' 2>/dev/null || echo "0")
    markets=$(echo "$coverage" | jq '.data.markets | length' 2>/dev/null || echo "0")
    echo -e "  ${GREEN}✅ 支持 ${products} 种产品类型，${markets} 个市场${NC}"
  else
    error=$(echo "$coverage" | jq -r '.message' 2>/dev/null || echo "未知错误")
    echo -e "  ${RED}❌ 获取失败: ${error}${NC}"
  fi
  echo ""
done

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✅ 测试完成${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# 提示信息
echo -e "${YELLOW}测试验证清单:${NC}"
echo -e "  [ ] 每个数据源都能成功返回覆盖范围信息"
echo -e "  [ ] productTypes 数组包含正确的产品类型代码 (STOCK, BOND, FUND, ETF 等)"
echo -e "  [ ] markets 数组包含市场的 code 和 name 字段"
echo -e "  [ ] 对于未支持的产品/市场，应返回空数组而不是错误\n"

echo -e "${YELLOW}前端测试步骤:${NC}"
echo -e "  1. 打开「数据同步」页面 → 新建任务"
echo -e "  2. 在「数据源」下拉框选择一个数据源"
echo -e "  3. 观察「资产类型」和「市场」下拉框是否只显示该数据源支持的选项"
echo -e "  4. 改变数据源选择，确认下拉框内容动态更新"
echo -e "  5. 编辑现有任务，验证已选择的数据源覆盖范围能正确加载\n"
