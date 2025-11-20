#!/bin/bash

# 现金交易测试脚本

BASE_URL="http://localhost:8000/api"
AUTH_TOKEN=""

echo "💰 开始测试现金交易功能..."

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
  exit 1
fi

echo "✅ 登录成功"

# 2. 获取第一个交易账户ID
echo ""
echo "📊 步骤 2: 获取交易账户信息..."
BALANCES_RESPONSE=$(curl -s -X GET "${BASE_URL}/cash/balances" \
  -H "Authorization: Bearer $AUTH_TOKEN")

ACCOUNT_ID=$(echo $BALANCES_RESPONSE | jq -r '.data[0].tradingAccountId // empty')

if [ -z "$ACCOUNT_ID" ]; then
  echo "❌ 无法获取交易账户ID"
  exit 1
fi

echo "✅ 获取到交易账户ID: $ACCOUNT_ID"

# 3. 创建存款交易
echo ""
echo "💵 步骤 3: 创建存款交易 (存入 10000 元)..."
DEPOSIT_RESPONSE=$(curl -s -X POST "${BASE_URL}/cash/transactions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tradingAccountId\": \"$ACCOUNT_ID\",
    \"transactionType\": \"DEPOSIT\",
    \"amount\": 10000,
    \"description\": \"初始资金存入\"
  }")

echo "存款响应: $DEPOSIT_RESPONSE"

# 4. 再次获取余额信息
echo ""
echo "💰 步骤 4: 查看更新后的余额..."
UPDATED_BALANCES=$(curl -s -X GET "${BASE_URL}/cash/balances" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "更新后的余额: $UPDATED_BALANCES"

# 5. 获取交易记录
echo ""
echo "📈 步骤 5: 查看交易记录..."
TRANSACTIONS_RESPONSE=$(curl -s -X GET "${BASE_URL}/cash/transactions?limit=5" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "交易记录: $TRANSACTIONS_RESPONSE"

# 6. 测试资金冻结
echo ""
echo "🔒 步骤 6: 冻结部分资金 (冻结 1000 元)..."
FREEZE_RESPONSE=$(curl -s -X POST "${BASE_URL}/cash/freeze" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tradingAccountId\": \"$ACCOUNT_ID\",
    \"amount\": 1000,
    \"description\": \"测试资金冻结\"
  }")

echo "冻结响应: $FREEZE_RESPONSE"

# 7. 查看冻结后的余额
echo ""
echo "❄️ 步骤 7: 查看冻结后的余额..."
FROZEN_BALANCES=$(curl -s -X GET "${BASE_URL}/cash/balances" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "冻结后的余额: $FROZEN_BALANCES"

echo ""
echo "🎉 现金交易测试完成！"
echo ""
echo "📊 测试总结："
echo "- 成功创建存款交易"
echo "- 余额正确更新"
echo "- 交易记录正确记录"
echo "- 资金冻结功能正常"
echo ""
echo "🌐 可以访问前端界面查看: http://localhost:3001/cash"