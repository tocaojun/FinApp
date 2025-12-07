#!/bin/bash

# ================================================
# 富途证券数据源同步测试脚本
# ================================================

set -e

echo "================================================"
echo "富途证券数据源同步诊断"
echo "================================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查富途OpenD是否运行
echo "1️⃣  检查富途OpenD服务状态..."
if lsof -i :11111 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 富途OpenD正在运行 (端口11111)${NC}"
    lsof -i :11111 | grep -v COMMAND | head -3
else
    echo -e "${RED}❌ 富途OpenD未运行！${NC}"
    echo "   请启动富途OpenD程序并确保端口为11111"
    exit 1
fi

echo ""

# 2. 测试富途API连接
echo "2️⃣  测试富途API连接..."
FUTU_RESPONSE=$(curl -s -m 5 -X POST http://localhost:11111/api/get-global-state \
    -H "Content-Type: application/json" \
    -d '{}' 2>&1 || echo "ERROR")

if [[ "$FUTU_RESPONSE" == "ERROR" ]] || [[ -z "$FUTU_RESPONSE" ]]; then
    echo -e "${RED}❌ 无法连接到富途API${NC}"
    echo "   请检查富途OpenD是否正确启动"
    exit 1
else
    echo -e "${GREEN}✅ 富途API连接成功${NC}"
    echo "   响应: $FUTU_RESPONSE" | head -c 200
    echo "..."
fi

echo ""

# 3. 检查数据库配置
echo "3️⃣  检查数据库中的富途数据源配置..."
FUTU_SOURCE=$(psql -h localhost -U finapp_user -d finapp_test -t -A -c \
    "SELECT id, name, provider, is_active FROM finapp.price_data_sources WHERE provider = 'futu';" 2>&1)

if [[ -z "$FUTU_SOURCE" ]] || [[ "$FUTU_SOURCE" == *"ERROR"* ]]; then
    echo -e "${RED}❌ 数据库中未找到富途数据源${NC}"
    echo "   请运行迁移脚本: backend/migrations/017_futu_data_source.sql"
    exit 1
else
    echo -e "${GREEN}✅ 富途数据源已在数据库中注册${NC}"
    echo "   $FUTU_SOURCE"
fi

echo ""

# 4. 检查环境变量
echo "4️⃣  检查环境变量配置..."
if [ -f backend/.env ]; then
    if grep -q "FUTU_API" backend/.env; then
        echo -e "${GREEN}✅ 找到富途API配置${NC}"
        grep "FUTU_" backend/.env | sed 's/=.*/=***/'
    else
        echo -e "${YELLOW}⚠️  .env文件中未找到富途配置${NC}"
        echo "   建议添加以下配置:"
        echo "   FUTU_API_HOST=localhost"
        echo "   FUTU_API_PORT=11111"
    fi
else
    echo -e "${YELLOW}⚠️  未找到 .env 文件${NC}"
fi

echo ""

# 5. 查询香港股票数据
echo "5️⃣  查询数据库中的香港股票..."
HK_STOCKS=$(psql -h localhost -U finapp_user -d finapp_test -t -A -c \
    "SELECT a.id, a.symbol, a.name, c.code as country 
     FROM finapp.assets a 
     LEFT JOIN finapp.countries c ON a.country_id = c.id 
     WHERE c.code = 'HK' OR a.symbol LIKE 'HK.%' 
     LIMIT 5;" 2>&1)

if [[ -z "$HK_STOCKS" ]]; then
    echo -e "${YELLOW}⚠️  数据库中未找到香港股票${NC}"
    echo "   请先添加香港股票资产"
else
    echo -e "${GREEN}✅ 找到香港股票${NC}"
    echo "$HK_STOCKS" | head -5
fi

echo ""

# 6. 测试获取腾讯控股(00700)的K线数据
echo "6️⃣  测试获取腾讯控股(HK.00700)历史数据..."

END_DATE=$(date +%Y-%m-%d)
START_DATE=$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d '30 days ago' +%Y-%m-%d)

KLINE_RESPONSE=$(curl -s -m 10 -X POST http://localhost:11111/api/qot/request-history-kline \
    -H "Content-Type: application/json" \
    -d "{
        \"security\": \"HK.00700\",
        \"start\": \"$START_DATE\",
        \"end\": \"$END_DATE\",
        \"ktype\": \"K_DAY\",
        \"rehab_type\": \"FORWARD\",
        \"max_ack_kline_num\": 30
    }" 2>&1)

if [[ "$KLINE_RESPONSE" == *"\"ret\":0"* ]]; then
    echo -e "${GREEN}✅ 成功获取K线数据${NC}"
    
    # 提取K线数量
    KLINE_COUNT=$(echo "$KLINE_RESPONSE" | grep -o '"klList":\[' | wc -l)
    echo "   获取了K线数据"
    echo "$KLINE_RESPONSE" | head -c 300
    echo "..."
else
    echo -e "${RED}❌ 获取K线数据失败${NC}"
    echo "   错误响应: $KLINE_RESPONSE" | head -c 500
fi

echo ""

# 7. 检查后端日志
echo "7️⃣  检查后端服务日志(最近10条)..."
if [ -f logs/backend.log ]; then
    echo "后端日志:"
    tail -10 logs/backend.log | grep -i "futu\|price\|sync" || echo "   没有相关日志"
else
    echo -e "${YELLOW}⚠️  未找到后端日志文件${NC}"
fi

echo ""

# 8. 总结
echo "================================================"
echo "诊断完成！"
echo "================================================"
echo ""
echo "如果所有检查都通过，但同步仍然失败，请提供以下信息："
echo "1. 具体的错误信息"
echo "2. 尝试同步的股票代码"
echo "3. 后端控制台的完整错误日志"
echo ""
echo "常见问题解决方案："
echo "- 如果OpenD未运行: 启动富途OpenD程序"
echo "- 如果API连接失败: 检查OpenD配置和端口"
echo "- 如果找不到香港股票: 先添加香港股票资产"
echo "- 如果K线数据失败: 检查富途账号权限和市场订阅"
echo ""
