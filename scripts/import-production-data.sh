#!/bin/bash
# 在生产服务器上导入测试数据

echo "📥 导入测试数据到生产数据库..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_NAME="finapp_production"
DATA_DIR="/opt/finapp/backups/test-data"

# 检查数据目录是否存在
if [ ! -d "$DATA_DIR" ]; then
    echo -e "${RED}❌ 数据目录不存在: $DATA_DIR${NC}"
    echo ""
    echo "请先解压数据包:"
    echo "  cd /opt/finapp/backups"
    echo "  tar -xzf test-data-*.tar.gz -C test-data"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 检查数据文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$DATA_DIR" || exit 1

FILES=(
    "price_data_sources.csv"
    "price_sync_tasks.csv"
    "exchange_rates.csv"
    "products.csv"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        COUNT=$(wc -l < "$file")
        echo -e "  $file: ${GREEN}$((COUNT - 1)) 条${NC} ✅"
    else
        echo -e "  $file: ${YELLOW}不存在${NC} ⚠️"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  警告"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "此操作将导入数据到生产数据库: $DB_NAME"
echo ""
read -p "确认继续? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo -e "${YELLOW}❌ 操作已取消${NC}"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 开始导入数据"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 执行导入脚本
if [ -f "import-data.sql" ]; then
    sudo -u postgres psql -d $DB_NAME -f import-data.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ 数据导入成功!${NC}"
    else
        echo ""
        echo -e "${RED}❌ 数据导入失败${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ 导入脚本不存在: import-data.sql${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 验证导入结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "数据源: "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.price_data_sources")
echo -e "${GREEN}$COUNT 条${NC}"

echo -n "同步任务: "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.price_sync_tasks")
echo -e "${GREEN}$COUNT 条${NC}"

echo -n "汇率: "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.exchange_rates")
echo -e "${GREEN}$COUNT 条${NC}"

echo -n "产品: "
COUNT=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM finapp.products")
echo -e "${GREEN}$COUNT 条${NC}"

echo ""
echo -e "${GREEN}🎉 导入完成!${NC}"
echo ""
echo "现在可以在前端页面刷新查看数据"
echo ""
