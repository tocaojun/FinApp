#!/bin/bash

# 测试模板下载功能

echo "========================================="
echo "测试模板下载功能"
echo "========================================="
echo ""

# 测试登录获取token
echo "1. 测试登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finapp.com",
    "password": "Admin123456"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，请检查用户名密码"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 测试Excel模板下载
echo "2. 测试Excel模板下载..."
EXCEL_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/test_template.xlsx \
  http://localhost:8000/api/transactions/import/template/excel)

EXCEL_HTTP_CODE=$(echo "$EXCEL_RESPONSE" | tail -n1)

if [ "$EXCEL_HTTP_CODE" = "200" ]; then
  FILE_SIZE=$(ls -lh /tmp/test_template.xlsx | awk '{print $5}')
  echo "✅ Excel模板下载成功 (大小: $FILE_SIZE)"
  echo "   文件保存在: /tmp/test_template.xlsx"
else
  echo "❌ Excel模板下载失败 (HTTP $EXCEL_HTTP_CODE)"
fi

echo ""

# 测试JSON模板下载
echo "3. 测试JSON模板下载..."
JSON_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/test_template.json \
  http://localhost:8000/api/transactions/import/template/json)

JSON_HTTP_CODE=$(echo "$JSON_RESPONSE" | tail -n1)

if [ "$JSON_HTTP_CODE" = "200" ]; then
  FILE_SIZE=$(ls -lh /tmp/test_template.json | awk '{print $5}')
  echo "✅ JSON模板下载成功 (大小: $FILE_SIZE)"
  echo "   文件保存在: /tmp/test_template.json"
  echo ""
  echo "   JSON内容预览:"
  cat /tmp/test_template.json | jq '.' | head -20
else
  echo "❌ JSON模板下载失败 (HTTP $JSON_HTTP_CODE)"
fi

echo ""
echo "========================================="
echo "测试完成"
echo "========================================="
echo ""
echo "如果测试成功，请在浏览器中测试："
echo "1. 刷新页面 (Cmd/Ctrl + Shift + R)"
echo "2. 进入交易管理页面"
echo "3. 点击'批量导入'按钮"
echo "4. 点击'下载Excel模板'或'下载JSON模板'"
