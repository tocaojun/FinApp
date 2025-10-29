#!/bin/bash

echo "=== 交易账户API调试脚本 ==="
echo ""

# 检查后端服务
echo "1. 检查后端服务状态..."
curl -s http://localhost:8000/health | jq '.' || echo "后端服务未响应"
echo ""

# 检查前端服务
echo "2. 检查前端服务状态..."
curl -s http://localhost:3001 | head -5
echo ""

# 尝试获取交易账户（需要token）
echo "3. 测试交易账户API（需要登录）..."
echo "请在浏览器中："
echo "  1. 打开 http://localhost:3001"
echo "  2. 登录系统"
echo "  3. 打开浏览器开发者工具（F12）"
echo "  4. 切换到 Console 标签"
echo "  5. 运行以下命令："
echo ""
echo "// 获取所有交易账户"
echo "fetch('/api/trading-accounts', {"
echo "  headers: {"
echo "    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')"
echo "  }"
echo "}).then(r => r.json()).then(console.log)"
echo ""
echo "// 获取特定投资组合的交易账户（替换 PORTFOLIO_ID）"
echo "fetch('/api/portfolios/PORTFOLIO_ID/accounts', {"
echo "  headers: {"
echo "    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')"
echo "  }"
echo "}).then(r => r.json()).then(console.log)"
echo ""

# 检查数据库中的交易账户
echo "4. 检查数据库中的交易账户数据..."
echo "SELECT id, portfolio_id, name, account_type, is_active FROM finapp.trading_accounts LIMIT 5;" | \
  psql -h localhost -U finapp_user -d finapp_db -t 2>/dev/null || \
  echo "无法连接到数据库，请手动检查"
echo ""

echo "=== 调试步骤 ==="
echo "1. 确认已登录系统"
echo "2. 打开交易管理页面"
echo "3. 打开浏览器开发者工具（F12）"
echo "4. 切换到 Network 标签"
echo "5. 点击编辑某条交易记录"
echo "6. 查看 Network 标签中的请求："
echo "   - 是否有 /api/portfolios/{id}/accounts 请求？"
echo "   - 请求状态码是什么？"
echo "   - 响应内容是什么？"
echo "7. 切换到 Console 标签，查看是否有错误信息"
echo ""
