#!/bin/bash

# 测试API自动同步功能

echo "=== 测试API自动同步功能 ==="
echo ""

# 1. 登录获取token
echo "1. 登录获取token..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  exit 1
fi

echo "✅ 登录成功"
echo ""

# 2. 获取数据源列表
echo "2. 获取数据源列表..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/price-sync/data-sources | python3 -m json.tool
echo ""

# 3. 获取同步任务列表
echo "3. 获取同步任务列表..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/price-sync/tasks | python3 -m json.tool
echo ""

echo "=== 测试完成 ==="
