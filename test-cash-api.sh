#!/bin/bash

# 现金管理 API 测试脚本

BASE_URL="http://localhost:8000/api"
AUTH_TOKEN=""

echo "🧪 开始测试现金管理 API..."

# 1. 用户登录获取 Token
echo "📝 步骤 1: 用户登录..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testapi@finapp.com", 
    "password": "testapi123"
  }')

AUTH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.tokens.accessToken // empty')

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ 登录失败，无法获取认证 token"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功，获得认证 token"

# 2. 测试现金汇总信息
echo ""
echo "📊 步骤 2: 获取现金汇总信息..."
SUMMARY_RESPONSE=$(curl -s -X GET "${BASE_URL}/cash/summary" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "现金汇总响应: $SUMMARY_RESPONSE"

# 3. 测试现金余额列表
echo ""
echo "💰 步骤 3: 获取现金余额列表..."
BALANCES_RESPONSE=$(curl -s -X GET "${BASE_URL}/cash/balances" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "现金余额响应: $BALANCES_RESPONSE"

# 4. 测试现金交易记录
echo ""
echo "📈 步骤 4: 获取现金交易记录..."
TRANSACTIONS_RESPONSE=$(curl -s -X GET "${BASE_URL}/cash/transactions?limit=10" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "现金交易记录响应: $TRANSACTIONS_RESPONSE"

echo ""
echo "🎉 现金管理 API 测试完成！"
echo ""
echo "💡 提示："
echo "- 如需创建现金交易，需要先确保有有效的交易账户"
echo "- 可以通过前端界面 http://localhost:3001/cash 进行完整测试"
echo "- 检查数据库中是否有现金管理相关的表和数据"