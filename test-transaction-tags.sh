#!/bin/bash

# 测试交易标签功能

echo "=== 测试交易标签获取 ==="
echo ""

# 1. 登录获取token
echo "1. 登录获取token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ 登录成功"
echo ""

# 2. 获取交易列表（查看是否包含标签）
echo "2. 获取交易列表..."
TRANSACTIONS=$(curl -s -X GET "http://localhost:8000/api/transactions?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "交易列表（前5条）："
echo $TRANSACTIONS | jq '.data.transactions[] | {id, assetName, tags}'
echo ""

# 3. 获取第一个交易的详情
FIRST_TX_ID=$(echo $TRANSACTIONS | jq -r '.data.transactions[0].id')

if [ "$FIRST_TX_ID" != "null" ] && [ -n "$FIRST_TX_ID" ]; then
  echo "3. 获取交易详情 (ID: $FIRST_TX_ID)..."
  TX_DETAIL=$(curl -s -X GET "http://localhost:8000/api/transactions/$FIRST_TX_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "交易详情："
  echo $TX_DETAIL | jq '{id, assetName, tags, tradingAccountId}'
  echo ""
fi

echo "=== 测试完成 ==="
