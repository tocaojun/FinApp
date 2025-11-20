#!/bin/bash

# 多币种现金管理系统测试脚本

echo "🚀 开始测试多币种现金管理系统..."
echo "=================================="

# 获取认证Token
echo "1. 获取认证Token..."
TOKEN=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "testapi@finapp.com", "password": "testapi123"}' | jq -r '.data.tokens.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，无法获取Token"
  exit 1
fi

echo "✅ Token获取成功"

# 测试获取多币种现金汇总
echo ""
echo "2. 测试获取多币种现金汇总..."
SUMMARY_RESULT=$(curl -s -X GET "http://localhost:8000/api/multi-currency-cash/summary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "汇总结果："
echo "$SUMMARY_RESULT" | jq '.'

# 测试创建港币存款
echo ""
echo "3. 测试创建港币存款..."
HKD_DEPOSIT=$(curl -s -X POST "http://localhost:8000/api/multi-currency-cash/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tradingAccountId": "0d5246c7-7757-4719-9f8e-81ea6890e4fa",
    "currency": "HKD", 
    "transactionType": "DEPOSIT",
    "amount": 8000,
    "description": "测试港币存款"
  }')

echo "港币存款结果："
echo "$HKD_DEPOSIT" | jq '.'

# 测试获取特定币种余额
echo ""
echo "4. 测试获取特定币种余额..."
HKD_BALANCE=$(curl -s -X GET "http://localhost:8000/api/multi-currency-cash/balance/0d5246c7-7757-4719-9f8e-81ea6890e4fa/HKD" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "港币余额："
echo "$HKD_BALANCE" | jq '.'

# 测试资金冻结
echo ""
echo "5. 测试资金冻结..."
FREEZE_RESULT=$(curl -s -X POST "http://localhost:8000/api/multi-currency-cash/freeze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tradingAccountId": "0d5246c7-7757-4719-9f8e-81ea6890e4fa",
    "currency": "HKD",
    "amount": 2000,
    "description": "测试资金冻结"
  }')

echo "资金冻结结果："
echo "$FREEZE_RESULT" | jq '.'

# 测试获取交易记录
echo ""
echo "6. 测试获取交易记录..."
TRANSACTIONS=$(curl -s -X GET "http://localhost:8000/api/multi-currency-cash/transactions?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "近5笔交易记录："
echo "$TRANSACTIONS" | jq '.data[0:3]' 2>/dev/null || echo "$TRANSACTIONS"

# 最终汇总
echo ""
echo "7. 最终多币种汇总..."
FINAL_SUMMARY=$(curl -s -X GET "http://localhost:8000/api/multi-currency-cash/summary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "最终汇总结果："
echo "$FINAL_SUMMARY" | jq '.data[] | select(.tradingAccountId == "0d5246c7-7757-4719-9f8e-81ea6890e4fa") | {accountName, currencyBalances, currencyCount}'

echo ""
echo "🎉 多币种现金管理系统测试完成！"
echo "=================================="