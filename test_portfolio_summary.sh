#!/bin/bash

# 获取用户 token（假设已登录）
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 获取投资组合列表
echo "=== 投资组合列表 ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/portfolios | jq '.data[] | {id, name, totalValue, totalCost, totalGainLoss, totalGainLossPercentage}'

# 获取投资组合汇总
echo ""
echo "=== 投资组合汇总 ==="
PORTFOLIO_ID="f570f121-7de8-4ca1-a75d-223a045c18d9"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/portfolios/$PORTFOLIO_ID/summary | jq '.data'
