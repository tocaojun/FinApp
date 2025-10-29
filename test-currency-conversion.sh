#!/bin/bash

# 测试投资组合币种转换功能

echo "======================================"
echo "测试投资组合币种转换功能"
echo "======================================"
echo ""

# 获取认证token
TOKEN=$(cat ~/.finapp_token 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "❌ 未找到认证token，请先登录"
  echo "提示：登录后token会保存在 ~/.finapp_token"
  exit 1
fi

echo "✅ 使用已保存的认证token"
echo ""

# 1. 获取投资组合列表
echo "1️⃣ 获取投资组合列表..."
PORTFOLIOS=$(curl -s -X GET "http://localhost:8000/api/portfolios" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$PORTFOLIOS" | jq '.'
echo ""

# 提取第一个投资组合ID
PORTFOLIO_ID=$(echo "$PORTFOLIOS" | jq -r '.data[0].id // empty')

if [ -z "$PORTFOLIO_ID" ]; then
  echo "❌ 未找到投资组合"
  exit 1
fi

echo "✅ 使用投资组合ID: $PORTFOLIO_ID"
echo ""

# 2. 获取持仓明细
echo "2️⃣ 获取持仓明细（包含币种转换信息）..."
HOLDINGS=$(curl -s -X GET "http://localhost:8000/api/holdings/portfolio/$PORTFOLIO_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$HOLDINGS" | jq '.'
echo ""

# 3. 检查币种转换字段
echo "3️⃣ 检查币种转换字段..."
echo "$HOLDINGS" | jq '.data[] | {
  assetSymbol,
  assetName,
  currency,
  portfolioCurrency,
  exchangeRate,
  marketValue,
  convertedMarketValue,
  unrealizedPnL,
  convertedUnrealizedPnL
}'
echo ""

# 4. 获取投资组合汇总
echo "4️⃣ 获取投资组合汇总（使用转换后的金额）..."
SUMMARY=$(curl -s -X GET "http://localhost:8000/api/holdings/portfolio/$PORTFOLIO_ID/summary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$SUMMARY" | jq '.'
echo ""

# 5. 验证汇总计算
echo "5️⃣ 验证汇总计算..."
TOTAL_VALUE=$(echo "$SUMMARY" | jq -r '.data.totalValue')
TOTAL_COST=$(echo "$SUMMARY" | jq -r '.data.totalCost')
CURRENCY=$(echo "$SUMMARY" | jq -r '.data.currency')

echo "总市值: $TOTAL_VALUE $CURRENCY"
echo "总成本: $TOTAL_COST $CURRENCY"
echo "总收益: $(echo "$SUMMARY" | jq -r '.data.totalGainLoss') $CURRENCY"
echo "总收益率: $(echo "$SUMMARY" | jq -r '.data.totalGainLossPercent')%"
echo ""

# 6. 检查不同币种的资产
echo "6️⃣ 检查不同币种的资产..."
CURRENCIES=$(echo "$HOLDINGS" | jq -r '.data[].currency' | sort -u)
echo "持仓中包含的币种: $CURRENCIES"
echo ""

# 7. 显示汇率信息
echo "7️⃣ 显示汇率信息..."
echo "$HOLDINGS" | jq '.data[] | select(.currency != .portfolioCurrency) | {
  asset: .assetSymbol,
  from: .currency,
  to: .portfolioCurrency,
  rate: .exchangeRate
}'
echo ""

echo "======================================"
echo "✅ 测试完成"
echo "======================================"
