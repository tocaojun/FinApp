#!/bin/bash
# 检查生产数据库数据情况

echo "🔍 检查生产数据库数据..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_NAME="finapp_production"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 核心数据表统计"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查数据源表
echo -n "数据源 (price_data_sources): "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.price_data_sources" 2>/dev/null || echo "0")
if [ "$COUNT" = "0" ]; then
    echo -e "${RED}$COUNT 条${NC} ❌"
else
    echo -e "${GREEN}$COUNT 条${NC} ✅"
fi

# 检查同步任务表
echo -n "同步任务 (price_sync_tasks): "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.price_sync_tasks" 2>/dev/null || echo "0")
if [ "$COUNT" = "0" ]; then
    echo -e "${RED}$COUNT 条${NC} ❌"
else
    echo -e "${GREEN}$COUNT 条${NC} ✅"
fi

# 检查同步日志表
echo -n "同步日志 (price_sync_logs): "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.price_sync_logs" 2>/dev/null || echo "0")
if [ "$COUNT" = "0" ]; then
    echo -e "${YELLOW}$COUNT 条${NC} ⚠️"
else
    echo -e "${GREEN}$COUNT 条${NC} ✅"
fi

# 检查其他重要表
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 其他重要数据表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "用户 (users): "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.users" 2>/dev/null || echo "0")
echo -e "${BLUE}$COUNT 条${NC}"

echo -n "投资组合 (portfolios): "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.portfolios" 2>/dev/null || echo "0")
echo -e "${BLUE}$COUNT 条${NC}"

echo -n "产品 (products): "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.products" 2>/dev/null || echo "0")
echo -e "${BLUE}$COUNT 条${NC}"

echo -n "交易记录 (transactions): "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.transactions" 2>/dev/null || echo "0")
echo -e "${BLUE}$COUNT 条${NC}"

echo -n "汇率 (exchange_rates): "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.exchange_rates" 2>/dev/null || echo "0")
echo -e "${BLUE}$COUNT 条${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 建议"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查是否需要导入测试数据
if [ "$COUNT" = "0" ]; then
    echo -e "${YELLOW}⚠️  生产数据库缺少测试数据${NC}"
    echo ""
    echo "建议操作:"
    echo "1. 从本地导出测试数据"
    echo "   bash scripts/export-test-data.sh"
    echo ""
    echo "2. 上传到服务器并导入"
    echo "   bash scripts/import-test-data.sh"
else
    echo -e "${GREEN}✅ 数据库数据正常${NC}"
fi

echo ""
