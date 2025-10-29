#!/bin/bash

echo "=== 交易编辑问题调试测试 ==="
echo ""

# 获取认证token
echo "1. 获取认证token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testapi@finapp.com", "password": "testapi123"}')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.tokens.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，无法获取token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功，token: ${TOKEN:0:20}..."
echo ""

# 获取交易列表
echo "2. 获取交易列表..."
TRANSACTIONS_RESPONSE=$(curl -s -X GET http://localhost:8000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "交易列表响应:"
echo $TRANSACTIONS_RESPONSE | jq '.data.transactions[0:2] | .[] | {id, executedAt, tags, assetSymbol}'
echo ""

# 获取第一个交易的ID
TRANSACTION_ID=$(echo $TRANSACTIONS_RESPONSE | jq -r '.data.transactions[0].id')

if [ "$TRANSACTION_ID" = "null" ] || [ -z "$TRANSACTION_ID" ]; then
  echo "❌ 没有找到交易记录"
  exit 1
fi

echo "3. 测试交易ID: $TRANSACTION_ID"
echo ""

# 获取单个交易详情
echo "4. 获取单个交易详情..."
TRANSACTION_DETAIL=$(curl -s -X GET http://localhost:8000/api/transactions/$TRANSACTION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "交易详情:"
echo $TRANSACTION_DETAIL | jq '{id, executedAt, tags, assetSymbol, notes}'
echo ""

# 更新交易（添加标签和修改日期）
echo "5. 更新交易（添加标签和修改执行日期）..."
UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:8000/api/transactions/$TRANSACTION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "executedAt": "2025-07-15T12:00:00.000Z",
    "tags": ["测试标签1", "测试标签2"],
    "notes": "测试更新 - 修复日期和标签问题"
  }')

echo "更新响应:"
echo $UPDATE_RESPONSE | jq '{success, message, data: {id, executedAt, tags, notes}}'
echo ""

# 再次获取交易详情验证
echo "6. 验证更新结果..."
UPDATED_TRANSACTION=$(curl -s -X GET http://localhost:8000/api/transactions/$TRANSACTION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "更新后的交易详情:"
echo $UPDATED_TRANSACTION | jq '{id, executedAt, tags, notes}'
echo ""

# 检查日期是否正确
EXPECTED_DATE="2025-07-15"
ACTUAL_DATE=$(echo $UPDATED_TRANSACTION | jq -r '.data.executedAt' | cut -d'T' -f1)

echo "7. 日期验证:"
echo "期望日期: $EXPECTED_DATE"
echo "实际日期: $ACTUAL_DATE"

if [ "$ACTUAL_DATE" = "$EXPECTED_DATE" ]; then
  echo "✅ 日期修复成功"
else
  echo "❌ 日期仍有问题"
fi

# 检查标签是否正确
TAG_COUNT=$(echo $UPDATED_TRANSACTION | jq '.data.tags | length')
echo ""
echo "8. 标签验证:"
echo "标签数量: $TAG_COUNT"
echo "标签内容: $(echo $UPDATED_TRANSACTION | jq '.data.tags')"

if [ "$TAG_COUNT" -gt 0 ]; then
  echo "✅ 标签修复成功"
else
  echo "❌ 标签仍有问题"
fi

echo ""
echo "=== 测试完成 ==="