#!/bin/bash

echo "=== 测试汇率API ==="

# 1. 测试后端服务
echo "1. 检查后端服务..."
curl -s http://localhost:8000/api/health | jq || echo "健康检查失败"

# 2. 登录获取token
echo -e "\n2. 登录获取token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"Test123456"}')

echo "登录响应: $LOGIN_RESPONSE"

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token' 2>/dev/null)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，无法获取token"
  echo "尝试使用其他账号..."
  
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@finapp.com","password":"Admin123456"}')
  
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token' 2>/dev/null)
fi

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 仍然无法获取token，请检查账号密码"
  exit 1
fi

echo "✅ Token获取成功: ${TOKEN:0:30}..."

# 3. 测试汇率列表API
echo -e "\n3. 测试汇率列表API..."
RESULT=$(curl -s -X GET "http://localhost:8000/api/exchange-rates?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "API响应:"
echo "$RESULT" | jq || echo "$RESULT"

# 检查结果
SUCCESS=$(echo "$RESULT" | jq -r '.success' 2>/dev/null)
if [ "$SUCCESS" = "true" ]; then
  RATE_COUNT=$(echo "$RESULT" | jq -r '.data.rates | length' 2>/dev/null)
  TOTAL=$(echo "$RESULT" | jq -r '.data.total' 2>/dev/null)
  echo "✅ API调用成功！返回 $RATE_COUNT 条记录，总计 $TOTAL 条"
else
  echo "❌ API调用失败"
  echo "$RESULT" | jq '.message' 2>/dev/null || echo "无法解析错误信息"
fi

# 4. 测试统计API
echo -e "\n4. 测试统计API..."
STATS_RESULT=$(curl -s -X GET "http://localhost:8000/api/exchange-rates/statistics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$STATS_RESULT" | jq || echo "$STATS_RESULT"

# 5. 测试特定货币对
echo -e "\n5. 测试USD/CNY最新汇率..."
LATEST_RESULT=$(curl -s -X GET "http://localhost:8000/api/exchange-rates/USD/CNY/latest" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$LATEST_RESULT" | jq || echo "$LATEST_RESULT"

# 6. 检查数据库
echo -e "\n6. 检查数据库中的汇率数据..."
PGPASSWORD=finapp_password psql -h localhost -U finapp_user -d finapp_test -c "SELECT COUNT(*) as total FROM finapp.exchange_rates;" 2>/dev/null || echo "无法连接数据库"

echo -e "\n=== 测试完成 ==="
