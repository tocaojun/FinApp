#!/bin/bash

# 测试存款持仓API的脚本

echo "=== 测试存款持仓API ==="
echo ""

# 1. 检查后端服务
echo "1. 检查后端服务状态..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo "✅ 后端服务运行正常"
else
  echo "❌ 后端服务未运行，请先启动: bash restart-backend.sh"
  exit 1
fi
echo ""

# 2. 获取token
echo "2. 尝试登录获取token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' 2>&1)

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，响应: $LOGIN_RESPONSE"
  echo "提示: 请确保测试账号存在，或使用正确的账号密码"
  exit 1
fi

echo "✅ 登录成功，获得token: ${TOKEN:0:20}..."
echo ""

# 3. 获取用户投资组合列表
echo "3. 获取投资组合列表..."
PORTFOLIOS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/portfolios \
  -H "Authorization: Bearer $TOKEN" 2>&1)

echo "投资组合响应: $PORTFOLIOS_RESPONSE" | head -c 200
echo "..."
echo ""

PORTFOLIO_ID=$(echo "$PORTFOLIOS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PORTFOLIO_ID" ]; then
  echo "⚠️  未找到投资组合，将测试不带portfolioId的请求"
  PORTFOLIO_ID=""
else
  echo "✅ 找到投资组合ID: $PORTFOLIO_ID"
fi
echo ""

# 4. 测试获取存款持仓（不带portfolioId）
echo "4. 测试获取存款持仓（不带portfolioId）..."
POSITIONS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/deposits/positions \
  -H "Authorization: Bearer $TOKEN" 2>&1)

echo "响应: $POSITIONS_RESPONSE"
echo ""

# 5. 测试获取存款持仓（带portfolioId）
if [ -n "$PORTFOLIO_ID" ]; then
  echo "5. 测试获取存款持仓（带portfolioId=$PORTFOLIO_ID）..."
  POSITIONS_WITH_PORTFOLIO=$(curl -s -X GET "http://localhost:3000/api/deposits/positions?portfolioId=$PORTFOLIO_ID" \
    -H "Authorization: Bearer $TOKEN" 2>&1)
  
  echo "响应: $POSITIONS_WITH_PORTFOLIO"
  echo ""
fi

# 6. 检查日志
echo "6. 检查最近的后端日志..."
if [ -f "logs/app.log" ]; then
  echo "--- 最近10行日志 ---"
  tail -10 logs/app.log
else
  echo "⚠️  日志文件不存在"
fi

echo ""
echo "=== 测试完成 ==="
