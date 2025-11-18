#!/bin/bash

# 存款功能完整流程测试脚本
# 用于验证：起存日期 → 交易记录 → 持仓 → 投资组合

set -e

API_BASE_URL="http://localhost:8000/api"
FRONTEND_URL="http://localhost:3001"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}存款功能完整流程测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查是否传入了token
if [ -z "$1" ]; then
    echo -e "${YELLOW}用法: $0 <auth_token>${NC}"
    echo ""
    echo -e "${YELLOW}提示: 从浏览器localStorage获取auth_token${NC}"
    echo "1. 打开 ${FRONTEND_URL}"
    echo "2. 登录系统"
    echo "3. 按 F12 打开开发者工具"
    echo "4. 进入 Console 标签"
    echo "5. 输入: localStorage.getItem('auth_token')"
    echo "6. 复制token值"
    echo ""
    echo -e "${YELLOW}示例: $0 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'${NC}"
    exit 1
fi

TOKEN="$1"

echo -e "${GREEN}✓ Token已设置${NC}"
echo ""

# 步骤1: 获取投资组合列表
echo -e "${BLUE}[步骤1] 获取投资组合列表${NC}"
PORTFOLIOS=$(curl -s -X GET "${API_BASE_URL}/portfolios" \
    -H "Authorization: Bearer ${TOKEN}")

echo "$PORTFOLIOS" | jq '.'

PORTFOLIO_ID=$(echo "$PORTFOLIOS" | jq -r '.data[0].id')
PORTFOLIO_NAME=$(echo "$PORTFOLIOS" | jq -r '.data[0].name')

if [ "$PORTFOLIO_ID" == "null" ] || [ -z "$PORTFOLIO_ID" ]; then
    echo -e "${RED}✗ 未找到投资组合${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 找到投资组合: ${PORTFOLIO_NAME} (${PORTFOLIO_ID})${NC}"
echo ""

# 步骤2: 获取交易账户
echo -e "${BLUE}[步骤2] 获取交易账户列表${NC}"
ACCOUNTS=$(curl -s -X GET "${API_BASE_URL}/trading-accounts?portfolioId=${PORTFOLIO_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

echo "$ACCOUNTS" | jq '.'

ACCOUNT_ID=$(echo "$ACCOUNTS" | jq -r '.data[0].id')
ACCOUNT_NAME=$(echo "$ACCOUNTS" | jq -r '.data[0].name')

if [ "$ACCOUNT_ID" == "null" ] || [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}✗ 未找到交易账户${NC}"
    echo -e "${YELLOW}  请先在系统中创建交易账户${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 找到交易账户: ${ACCOUNT_NAME} (${ACCOUNT_ID})${NC}"
echo ""

# 步骤3: 获取存款产品
echo -e "${BLUE}[步骤3] 获取存款产品列表${NC}"
PRODUCTS=$(curl -s -X GET "${API_BASE_URL}/deposits/products" \
    -H "Authorization: Bearer ${TOKEN}")

echo "$PRODUCTS" | jq '.'

PRODUCT_ID=$(echo "$PRODUCTS" | jq -r '.data[0].assetId')
PRODUCT_NAME=$(echo "$PRODUCTS" | jq -r '.data[0].productName')
PRODUCT_CURRENCY=$(echo "$PRODUCTS" | jq -r '.data[0].currency')

if [ "$PRODUCT_ID" == "null" ] || [ -z "$PRODUCT_ID" ]; then
    echo -e "${RED}✗ 未找到存款产品${NC}"
    echo -e "${YELLOW}  请先在系统中创建存款产品${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 找到存款产品: ${PRODUCT_NAME} (${PRODUCT_ID})${NC}"
echo ""

# 步骤4: 创建存款交易
echo -e "${BLUE}[步骤4] 创建存款交易${NC}"

DEPOSIT_AMOUNT=5000
START_DATE=$(date +%Y-%m-%d)

TRANSACTION_DATA=$(cat <<EOF
{
  "portfolioId": "${PORTFOLIO_ID}",
  "tradingAccountId": "${ACCOUNT_ID}",
  "assetId": "${PRODUCT_ID}",
  "transactionType": "DEPOSIT",
  "side": "BUY",
  "quantity": ${DEPOSIT_AMOUNT},
  "price": 1,
  "fees": 0,
  "currency": "${PRODUCT_CURRENCY}",
  "transactionDate": "${START_DATE}",
  "executedAt": "${START_DATE}T10:00:00Z",
  "notes": "测试存款 - 自动化脚本创建",
  "tags": ["存款", "测试"]
}
EOF
)

echo "交易数据:"
echo "$TRANSACTION_DATA" | jq '.'

TRANSACTION_RESULT=$(curl -s -X POST "${API_BASE_URL}/transactions" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$TRANSACTION_DATA")

echo "创建结果:"
echo "$TRANSACTION_RESULT" | jq '.'

TRANSACTION_ID=$(echo "$TRANSACTION_RESULT" | jq -r '.data.id')

if [ "$TRANSACTION_ID" == "null" ] || [ -z "$TRANSACTION_ID" ]; then
    echo -e "${RED}✗ 交易创建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 交易创建成功: ${TRANSACTION_ID}${NC}"
echo ""

# 步骤5: 验证交易记录
echo -e "${BLUE}[步骤5] 验证交易记录${NC}"
sleep 1

TRANSACTION_CHECK=$(curl -s -X GET "${API_BASE_URL}/transactions/${TRANSACTION_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

echo "$TRANSACTION_CHECK" | jq '.'

VERIFIED_AMOUNT=$(echo "$TRANSACTION_CHECK" | jq -r '.data.quantity')

if [ "$VERIFIED_AMOUNT" == "${DEPOSIT_AMOUNT}" ]; then
    echo -e "${GREEN}✓ 交易记录验证成功 - 金额: ¥${VERIFIED_AMOUNT}${NC}"
else
    echo -e "${RED}✗ 交易记录金额不匹配${NC}"
fi
echo ""

# 步骤6: 验证持仓创建
echo -e "${BLUE}[步骤6] 验证存款持仓${NC}"
sleep 1

POSITIONS=$(curl -s -X GET "${API_BASE_URL}/deposits/positions?portfolioId=${PORTFOLIO_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

echo "$POSITIONS" | jq '.'

POSITION_COUNT=$(echo "$POSITIONS" | jq '.data | length')

if [ "$POSITION_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ 持仓创建成功 - 共 ${POSITION_COUNT} 笔存款${NC}"
    
    # 查找刚创建的持仓
    POSITION_BALANCE=$(echo "$POSITIONS" | jq -r ".data[] | select(.assetId == \"${PRODUCT_ID}\") | .currentBalance")
    if [ ! -z "$POSITION_BALANCE" ] && [ "$POSITION_BALANCE" != "null" ]; then
        echo -e "${GREEN}✓ 找到存款持仓 - 余额: ¥${POSITION_BALANCE}${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 未找到存款持仓（可能需要刷新）${NC}"
fi
echo ""

# 步骤7: 验证投资组合更新
echo -e "${BLUE}[步骤7] 验证投资组合价值${NC}"
sleep 1

PORTFOLIO_SUMMARY=$(curl -s -X GET "${API_BASE_URL}/portfolios/${PORTFOLIO_ID}/summary" \
    -H "Authorization: Bearer ${TOKEN}")

echo "$PORTFOLIO_SUMMARY" | jq '.'

TOTAL_VALUE=$(echo "$PORTFOLIO_SUMMARY" | jq -r '.data.totalValue')

echo -e "${GREEN}✓ 投资组合总价值: ¥${TOTAL_VALUE}${NC}"
echo ""

# 测试总结
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}测试完成总结${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓ 投资组合: ${PORTFOLIO_NAME}${NC}"
echo -e "${GREEN}✓ 交易账户: ${ACCOUNT_NAME}${NC}"
echo -e "${GREEN}✓ 存款产品: ${PRODUCT_NAME}${NC}"
echo -e "${GREEN}✓ 存款金额: ¥${DEPOSIT_AMOUNT}${NC}"
echo -e "${GREEN}✓ 起存日期: ${START_DATE}${NC}"
echo -e "${GREEN}✓ 交易记录ID: ${TRANSACTION_ID}${NC}"
echo ""
echo -e "${YELLOW}查看方式:${NC}"
echo "1. 交易记录: ${FRONTEND_URL}/transactions"
echo "2. 投资组合: ${FRONTEND_URL}/portfolio/${PORTFOLIO_ID}"
echo "3. 我的存款: ${FRONTEND_URL}/deposits"
echo ""
echo -e "${BLUE}========================================${NC}"
