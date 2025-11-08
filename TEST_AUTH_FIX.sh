#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}FinApp 认证修复测试脚本${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 测试后端健康状态
echo -e "${YELLOW}1. 检查后端服务状态...${NC}"
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
else
    echo -e "${RED}✗ 后端服务未运行，请启动后端服务${NC}"
    echo "  启动命令：cd /Users/caojun/code/FinApp/backend && npm run dev"
    exit 1
fi

# 测试数据库连接
echo -e "\n${YELLOW}2. 检查数据库连接...${NC}"
if curl -s http://localhost:8000/api/health/db > /dev/null; then
    echo -e "${GREEN}✓ 数据库连接正常${NC}"
else
    echo -e "${RED}✗ 数据库连接失败${NC}"
    exit 1
fi

# 测试登录
echo -e "\n${YELLOW}3. 测试登录...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 登录成功${NC}"
    
    # 提取 token
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}✗ 无法从登录响应中提取 accessToken${NC}"
        echo "响应内容："
        echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
        exit 1
    fi
    
    echo -e "  Access Token: ${ACCESS_TOKEN:0:20}...${NC}"
    echo -e "  Refresh Token: ${REFRESH_TOKEN:0:20}...${NC}"
else
    echo -e "${RED}✗ 登录失败${NC}"
    echo "响应内容："
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
    exit 1
fi

# 测试获取用户资料
echo -e "\n${YELLOW}4. 测试获取用户资料 (/api/auth/profile)...${NC}"
PROFILE_RESPONSE=$(curl -s -X GET http://localhost:8000/api/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 获取用户资料成功${NC}"
else
    echo -e "${RED}✗ 获取用户资料失败${NC}"
    echo "响应内容："
    echo "$PROFILE_RESPONSE" | jq . 2>/dev/null || echo "$PROFILE_RESPONSE"
fi

# 测试获取投资组合
echo -e "\n${YELLOW}5. 测试获取投资组合列表 (/api/portfolios)...${NC}"
PORTFOLIOS_RESPONSE=$(curl -s -X GET http://localhost:8000/api/portfolios \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

if echo "$PORTFOLIOS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 获取投资组合成功${NC}"
    PORTFOLIO_COUNT=$(echo "$PORTFOLIOS_RESPONSE" | grep -o '"id"' | wc -l)
    echo -e "  投资组合数量：$PORTFOLIO_COUNT"
else
    echo -e "${RED}✗ 获取投资组合失败${NC}"
    echo "响应内容："
    echo "$PORTFOLIOS_RESPONSE" | jq . 2>/dev/null || echo "$PORTFOLIOS_RESPONSE"
fi

# 测试 Token 刷新
echo -e "\n${YELLOW}6. 测试 Token 刷新 (/api/auth/refresh)...${NC}"
REFRESH_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

if echo "$REFRESH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Token 刷新成功${NC}"
    NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo -e "  新 Access Token: ${NEW_ACCESS_TOKEN:0:20}...${NC}"
else
    echo -e "${RED}✗ Token 刷新失败${NC}"
    echo "响应内容："
    echo "$REFRESH_RESPONSE" | jq . 2>/dev/null || echo "$REFRESH_RESPONSE"
fi

# 测试获取交易记录
echo -e "\n${YELLOW}7. 测试获取交易记录 (/api/transactions)...${NC}"
TRANSACTIONS_RESPONSE=$(curl -s -X GET http://localhost:8000/api/transactions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

if echo "$TRANSACTIONS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 获取交易记录成功${NC}"
else
    echo -e "${RED}✗ 获取交易记录失败${NC}"
    echo "响应内容："
    echo "$TRANSACTIONS_RESPONSE" | jq . 2>/dev/null || echo "$TRANSACTIONS_RESPONSE"
fi

# 检查用户权限
echo -e "\n${YELLOW}8. 检查用户权限...${NC}"
echo -e "${BLUE}查询数据库中的权限...${NC}"

psql -h localhost -U finapp_user -d finapp_test -c "
SELECT 
    u.email,
    r.name as role_name,
    count(DISTINCT p.id) as permission_count
FROM finapp.users u 
LEFT JOIN finapp.user_roles ur ON u.id = ur.user_id 
LEFT JOIN finapp.roles r ON ur.role_id = r.id 
LEFT JOIN finapp.role_permissions rp ON r.id = rp.role_id 
LEFT JOIN finapp.permissions p ON rp.permission_id = p.id 
WHERE u.email IN ('testapi@finapp.com', 'admin@finapp.com')
GROUP BY u.id, u.email, r.name
ORDER BY u.email, r.name;
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 权限查询成功${NC}"
else
    echo -e "${YELLOW}⚠ 无法访问数据库（可能是 psql 未安装）${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 所有测试完成！${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}后续步骤：${NC}"
echo "1. 打开浏览器访问 http://localhost:3001"
echo "2. 清除 localStorage: 打开开发者工具 (F12) > Application > Local Storage > 删除所有项"
echo "3. 使用以下凭证登录："
echo "   邮箱：testapi@finapp.com"
echo "   密码：testapi123"
echo "4. 访问以下页面测试："
echo "   - 投资组合：http://localhost:3001/portfolios"
echo "   - 交易记录：http://localhost:3001/transactions"
echo "   - 报表中心：http://localhost:3001/reports"
echo "   - 图表分析：http://localhost:3001/analytics"
