#!/bin/bash

# 测试认证状态脚本

echo "========================================="
echo "测试认证状态"
echo "========================================="
echo ""

# 从浏览器localStorage获取token（需要手动复制）
echo "请打开浏览器控制台，执行以下命令获取token："
echo "localStorage.getItem('token')"
echo ""
read -p "请粘贴token: " TOKEN

if [ -z "$TOKEN" ]; then
  echo "❌ Token为空，请先登录"
  exit 1
fi

echo ""
echo "测试token有效性..."
echo ""

# 测试健康检查（无需认证）
echo "1. 测试健康检查（无需认证）..."
curl -s http://localhost:8000/health | jq '.'

echo ""
echo "2. 测试认证端点（需要认证）..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/portfolios)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP状态码: $HTTP_CODE"
echo "响应内容:"
echo "$BODY" | jq '.'

if [ "$HTTP_CODE" = "401" ]; then
  echo ""
  echo "❌ Token验证失败 (401)"
  echo ""
  echo "可能的原因："
  echo "1. Token已过期"
  echo "2. Token格式错误"
  echo "3. 用户账户未激活或未验证"
  echo ""
  echo "解决方案："
  echo "1. 重新登录获取新token"
  echo "2. 检查用户账户状态"
elif [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "✅ Token有效"
else
  echo ""
  echo "⚠️  未知状态码: $HTTP_CODE"
fi

echo ""
echo "3. 测试模板下载端点..."
TEMPLATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/transactions/import/template/excel)

TEMPLATE_HTTP_CODE=$(echo "$TEMPLATE_RESPONSE" | tail -n1)

echo "HTTP状态码: $TEMPLATE_HTTP_CODE"

if [ "$TEMPLATE_HTTP_CODE" = "401" ]; then
  echo "❌ 模板下载认证失败"
elif [ "$TEMPLATE_HTTP_CODE" = "200" ]; then
  echo "✅ 模板下载成功"
else
  echo "⚠️  未知状态码: $TEMPLATE_HTTP_CODE"
fi

echo ""
echo "========================================="
echo "测试完成"
echo "========================================="
