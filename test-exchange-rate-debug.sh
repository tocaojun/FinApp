#!/bin/bash

echo "=== 汇率API调试测试 ==="
echo ""

# 1. 检查后端服务
echo "1. 检查后端服务状态..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ 后端服务运行正常"
else
    echo "✗ 后端服务未运行"
    exit 1
fi
echo ""

# 2. 登录获取token
echo "2. 登录获取认证token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "✗ 登录失败"
    echo "响应: $LOGIN_RESPONSE"
    exit 1
fi

echo "✓ 登录成功"
echo "Token: ${TOKEN:0:30}..."
echo ""

# 3. 测试汇率API
echo "3. 测试汇率列表API..."
EXCHANGE_RATE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/exchange-rates?page=1&limit=5")

echo "响应:"
echo "$EXCHANGE_RATE_RESPONSE" | jq '.'
echo ""

# 4. 检查响应结构
echo "4. 检查响应结构..."
SUCCESS=$(echo $EXCHANGE_RATE_RESPONSE | jq -r '.success // empty')
if [ "$SUCCESS" = "true" ]; then
    echo "✓ API调用成功"
    RATE_COUNT=$(echo $EXCHANGE_RATE_RESPONSE | jq -r '.data.rates | length')
    TOTAL=$(echo $EXCHANGE_RATE_RESPONSE | jq -r '.data.total')
    echo "  - 返回汇率数量: $RATE_COUNT"
    echo "  - 总记录数: $TOTAL"
else
    echo "✗ API调用失败"
    ERROR_MSG=$(echo $EXCHANGE_RATE_RESPONSE | jq -r '.message // empty')
    echo "  错误信息: $ERROR_MSG"
fi
echo ""

# 5. 检查数据库中的汇率记录
echo "5. 检查数据库中的汇率记录..."
DB_COUNT=$(psql -U postgres -d finapp -t -c "SELECT COUNT(*) FROM exchange_rates;" 2>/dev/null | tr -d ' ')
if [ ! -z "$DB_COUNT" ]; then
    echo "✓ 数据库中有 $DB_COUNT 条汇率记录"
else
    echo "✗ 无法查询数据库"
fi
echo ""

# 6. 测试统计API
echo "6. 测试统计API..."
STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/exchange-rates/statistics")
echo "$STATS_RESPONSE" | jq '.'
echo ""

echo "=== 测试完成 ==="
