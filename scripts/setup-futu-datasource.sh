#!/bin/bash

# ================================================
# 富途证券数据源快速设置脚本
# ================================================
# 
# 功能:
# 1. 检查富途OpenD是否运行
# 2. 验证数据库配置
# 3. 测试数据源连接
# 4. 创建示例同步任务
# ================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
FUTU_HOST="${FUTU_API_HOST:-localhost}"
FUTU_PORT="${FUTU_API_PORT:-11111}"
DB_HOST="localhost"
DB_USER="finapp_user"
DB_NAME="finapp_test"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}富途证券数据源快速设置${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# 第一步: 检查富途OpenD是否运行
echo -e "${YELLOW}[1/5] 检查富途OpenD服务...${NC}"
if curl -s -f "http://${FUTU_HOST}:${FUTU_PORT}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 富途OpenD服务运行中 (${FUTU_HOST}:${FUTU_PORT})${NC}"
else
    echo -e "${RED}❌ 无法连接到富途OpenD服务${NC}"
    echo -e "${YELLOW}请确保:${NC}"
    echo "  1. 富途OpenD程序已启动"
    echo "  2. 端口配置为 ${FUTU_PORT}"
    echo "  3. 防火墙允许访问"
    echo ""
    echo -e "${YELLOW}下载地址: https://www.futunn.com/download/openAPI${NC}"
    exit 1
fi
echo ""

# 第二步: 检查数据库配置
echo -e "${YELLOW}[2/5] 检查数据库配置...${NC}"
if psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1 FROM finapp.price_data_sources WHERE provider = 'futu' LIMIT 1;" > /dev/null 2>&1; then
    FUTU_SOURCE_ID=$(psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT id FROM finapp.price_data_sources WHERE provider = 'futu' LIMIT 1;" | tr -d ' ')
    echo -e "${GREEN}✅ 富途数据源已配置${NC}"
    echo -e "   数据源ID: ${FUTU_SOURCE_ID}"
else
    echo -e "${RED}❌ 富途数据源未配置${NC}"
    echo -e "${YELLOW}请运行迁移脚本:${NC}"
    echo "  cd /Users/caojun/code/FinApp/backend"
    echo "  psql -h localhost -U finapp_user -d finapp_test -f migrations/017_futu_data_source.sql"
    exit 1
fi
echo ""

# 第三步: 查看支持的产品和市场
echo -e "${YELLOW}[3/5] 富途数据源支持的产品和市场${NC}"
echo -e "${BLUE}支持的产品类型:${NC}"
psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -t -c "
    SELECT '  - ' || elem::text 
    FROM finapp.v_futu_data_source_info, 
    jsonb_array_elements_text(supported_products) as elem
    LIMIT 10;
" | grep -v "^$"

echo ""
echo -e "${BLUE}支持的市场:${NC}"
psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -t -c "
    SELECT '  - ' || elem::text 
    FROM finapp.v_futu_data_source_info, 
    jsonb_array_elements_text(supported_markets) as elem
    LIMIT 10;
" | grep -v "^$"
echo ""

# 第四步: 统计当前资产
echo -e "${YELLOW}[4/5] 统计系统中的资产...${NC}"

# 获取各市场的资产数量
HK_COUNT=$(psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -t -c "
    SELECT COUNT(*) 
    FROM finapp.assets a 
    JOIN finapp.countries c ON a.country_id = c.id 
    WHERE c.code = 'HK' AND a.is_active = true;
" | tr -d ' ')

US_COUNT=$(psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -t -c "
    SELECT COUNT(*) 
    FROM finapp.assets a 
    JOIN finapp.countries c ON a.country_id = c.id 
    WHERE c.code = 'US' AND a.is_active = true;
" | tr -d ' ')

CN_COUNT=$(psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -t -c "
    SELECT COUNT(*) 
    FROM finapp.assets a 
    JOIN finapp.countries c ON a.country_id = c.id 
    WHERE c.code = 'CN' AND a.is_active = true;
" | tr -d ' ')

echo -e "  港股资产: ${GREEN}${HK_COUNT}${NC} 个"
echo -e "  美股资产: ${GREEN}${US_COUNT}${NC} 个"
echo -e "  A股资产: ${GREEN}${CN_COUNT}${NC} 个"
echo ""

# 第五步: 提供下一步操作建议
echo -e "${YELLOW}[5/5] 下一步操作${NC}"
echo ""
echo -e "${BLUE}方式1: 通过前端UI创建同步任务${NC}"
echo "  1. 访问 http://localhost:3001"
echo "  2. 登录系统"
echo "  3. 进入 '数据管理' -> '价格同步'"
echo "  4. 创建新的同步任务"
echo ""

echo -e "${BLUE}方式2: 使用API创建同步任务${NC}"
echo "  # 获取数据源ID"
echo "  DATA_SOURCE_ID=\"${FUTU_SOURCE_ID}\""
echo ""
echo "  # 创建港股同步任务"
echo "  curl -X POST http://localhost:8000/api/price-sync/tasks \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "    -d '{"
echo "      \"name\": \"港股历史价格同步\","
echo "      \"data_source_id\": \"'\${DATA_SOURCE_ID}'\","
echo "      \"asset_type_id\": \"STOCK\","
echo "      \"country_id\": \"HK\","
echo "      \"schedule_type\": \"manual\","
echo "      \"sync_days_back\": 365,"
echo "      \"overwrite_existing\": false"
echo "    }'"
echo ""

echo -e "${BLUE}方式3: 直接在数据库中创建任务${NC}"
echo "  查看示例SQL: docs/FUTU_DATA_SOURCE_GUIDE.md"
echo ""

echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}设置完成！富途数据源已就绪${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo ""
echo -e "${YELLOW}查看详细文档:${NC} docs/FUTU_DATA_SOURCE_GUIDE.md"
echo ""
