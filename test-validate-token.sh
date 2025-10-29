#!/bin/bash

echo "=== 测试Token验证 ==="
echo ""

# 1. 登录获取token
echo "1. 登录..."
LOGIN_RESP=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}')

echo "登录响应:"
echo "$LOGIN_RESP" | jq '.'
echo ""

TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "✗ 无法获取token"
    exit 1
fi

echo "✓ Token获取成功: ${TOKEN:0:50}..."
echo ""

# 2. 验证token
echo "2. 验证token..."
VALIDATE_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8000/api/auth/validate)

HTTP_CODE=$(echo "$VALIDATE_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$VALIDATE_RESP" | sed '/HTTP_CODE:/d')

echo "HTTP状态码: $HTTP_CODE"
echo "响应内容:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Token验证成功"
else
    echo "✗ Token验证失败"
fi
echo ""

# 3. 使用token调用汇率API
echo "3. 使用token调用汇率API..."
RATE_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8000/api/exchange-rates?page=1&limit=3")

HTTP_CODE=$(echo "$RATE_RESP" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RATE_RESP" | sed '/HTTP_CODE:/d')

echo "HTTP状态码: $HTTP_CODE"
echo "响应内容:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ 汇率API调用成功"
    TOTAL=$(echo "$BODY" | jq -r '.data.total')
    COUNT=$(echo "$BODY" | jq -r '.data.rates | length')
    echo "  总记录数: $TOTAL"
    echo "  返回记录数: $COUNT"
else
    echo "✗ 汇率API调用失败"
fi
