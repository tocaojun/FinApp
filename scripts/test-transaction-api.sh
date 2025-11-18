#!/bin/bash
# 测试交易API返回的数据格式

echo "=================================="
echo "  测试交易API数据格式"
echo "=================================="

# 获取认证token
echo "1. 获取认证token..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}' \
  | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ 认证失败"
  exit 1
fi

echo "✅ 认证成功"

# 获取交易列表
echo ""
echo "2. 获取交易列表..."
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/transactions?limit=5")

echo "Response:"
echo "$RESPONSE" | jq '.'

# 检查关键字段
echo ""
echo "3. 检查关键字段..."
echo "$RESPONSE" | jq '.data.transactions[0] | {
  id,
  assetName,
  assetSymbol,
  transactionType,
  totalAmount,
  currency,
  transactionDate
}'

# 统计有asset_name的交易数
WITH_NAME=$(echo "$RESPONSE" | jq '[.data.transactions[] | select(.assetName != null)] | length')
TOTAL=$(echo "$RESPONSE" | jq '.data.transactions | length')

echo ""
echo "=================================="
echo "  统计结果"
echo "=================================="
echo "总交易数: $TOTAL"
echo "有资产名称的: $WITH_NAME"
echo "缺失资产名称的: $((TOTAL - WITH_NAME))"

if [ $WITH_NAME -eq $TOTAL ]; then
  echo "✅ 所有交易都有资产名称"
else
  echo "⚠️  有交易缺失资产名称"
fi
