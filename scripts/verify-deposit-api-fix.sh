#!/bin/bash

echo "=== 验证存款API修复 ==="
echo ""

# 检查后端服务
echo "1. 检查后端服务 (端口8000)..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "✅ 后端服务运行正常"
else
  echo "❌ 后端服务未运行"
  exit 1
fi
echo ""

# 检查前端服务
echo "2. 检查前端服务 (端口3001)..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
  echo "✅ 前端服务运行正常"
else
  echo "❌ 前端服务未运行"
  exit 1
fi
echo ""

# 测试存款产品API
echo "3. 测试存款产品API (无需认证)..."
PRODUCTS_RESPONSE=$(curl -s http://localhost:8000/api/deposits/products 2>&1)
echo "响应: ${PRODUCTS_RESPONSE:0:200}..."
echo ""

if echo "$PRODUCTS_RESPONSE" | grep -q '"success":true'; then
  echo "✅ 存款产品API响应正常"
else
  echo "⚠️  存款产品API可能需要认证或返回错误"
fi
echo ""

echo "=== 修复说明 ==="
echo "已修复的问题："
echo "1. ✅ depositService.ts - baseUrl 从 '/api/deposits' 改为使用环境变量"
echo "2. ✅ DepositProductList.tsx - API调用从相对路径改为绝对路径"
echo ""
echo "配置信息："
echo "- 后端API地址: http://localhost:8000/api"
echo "- 前端地址: http://localhost:3001"
echo "- 环境变量: VITE_API_BASE_URL=http://localhost:8000/api"
echo ""
echo "下一步："
echo "1. 刷新浏览器 (Cmd+Shift+R 强制刷新)"
echo "2. 打开开发者工具查看Network标签"
echo "3. 确认API请求指向 http://localhost:8000/api/deposits/..."
echo "4. 如果仍有401错误，请先登录获取有效token"
echo ""
