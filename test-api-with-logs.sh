#!/bin/bash

echo "=== 测试汇率API并查看日志 ==="
echo ""

# 登录
echo "1. 登录获取token..."
LOGIN_RESP=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}')

TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token')
echo "Token: ${TOKEN:0:40}..."
echo ""

# 测试汇率API
echo "2. 调用汇率API..."
API_RESP=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/exchange-rates?page=1&limit=5")

echo "API响应:"
echo "$API_RESP" | jq '.'
echo ""

# 查看后端日志
echo "3. 后端日志（最后30行）:"
tail -30 /tmp/backend_clean.log | grep -E "\[ExchangeRate|ERROR|Error"
