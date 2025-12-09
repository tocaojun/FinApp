#!/bin/bash
# 从本地测试数据库导出关键数据

echo "📦 导出本地测试数据..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 本地数据库配置
LOCAL_DB="finapp_test"
LOCAL_USER="finapp_user"
EXPORT_DIR="./backups/test-data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 创建导出目录
mkdir -p "$EXPORT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 导出数据源和同步配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 导出数据源配置
echo -n "导出数据源 (price_data_sources)... "
psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -c "\COPY (SELECT * FROM finapp.price_data_sources) TO '$EXPORT_DIR/price_data_sources.csv' WITH CSV HEADER" 2>/dev/null
if [ $? -eq 0 ]; then
    COUNT=$(wc -l < "$EXPORT_DIR/price_data_sources.csv")
    echo -e "${GREEN}✅ $((COUNT - 1)) 条${NC}"
else
    echo -e "${YELLOW}⚠️  跳过(表为空或不存在)${NC}"
fi

# 2. 导出同步任务
echo -n "导出同步任务 (price_sync_tasks)... "
psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -c "\COPY (SELECT * FROM finapp.price_sync_tasks) TO '$EXPORT_DIR/price_sync_tasks.csv' WITH CSV HEADER" 2>/dev/null
if [ $? -eq 0 ]; then
    COUNT=$(wc -l < "$EXPORT_DIR/price_sync_tasks.csv")
    echo -e "${GREEN}✅ $((COUNT - 1)) 条${NC}"
else
    echo -e "${YELLOW}⚠️  跳过(表为空或不存在)${NC}"
fi

# 3. 导出汇率数据(最近30天)
echo -n "导出汇率数据 (exchange_rates, 最近30天)... "
psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -c "\COPY (SELECT * FROM finapp.exchange_rates WHERE date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY date DESC) TO '$EXPORT_DIR/exchange_rates.csv' WITH CSV HEADER" 2>/dev/null
if [ $? -eq 0 ]; then
    COUNT=$(wc -l < "$EXPORT_DIR/exchange_rates.csv")
    echo -e "${GREEN}✅ $((COUNT - 1)) 条${NC}"
else
    echo -e "${YELLOW}⚠️  跳过(表为空或不存在)${NC}"
fi

# 4. 导出产品数据
echo -n "导出产品数据 (products)... "
psql -h localhost -U $LOCAL_USER -d $LOCAL_DB -c "\COPY (SELECT * FROM finapp.products) TO '$EXPORT_DIR/products.csv' WITH CSV HEADER" 2>/dev/null
if [ $? -eq 0 ]; then
    COUNT=$(wc -l < "$EXPORT_DIR/products.csv")
    echo -e "${GREEN}✅ $((COUNT - 1)) 条${NC}"
else
    echo -e "${YELLOW}⚠️  跳过(表为空或不存在)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 创建导入SQL脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 创建导入脚本
cat > "$EXPORT_DIR/import-data.sql" << 'EOF'
-- FinApp 测试数据导入脚本
-- 自动生成于: $(date)

\echo '========================================='
\echo '导入测试数据到生产数据库'
\echo '========================================='
\echo ''

-- 1. 清空现有数据(可选,谨慎使用)
-- TRUNCATE finapp.price_sync_logs CASCADE;
-- TRUNCATE finapp.price_sync_tasks CASCADE;
-- TRUNCATE finapp.price_data_sources CASCADE;

-- 2. 导入数据源
\echo '导入数据源...'
\COPY finapp.price_data_sources FROM 'price_data_sources.csv' WITH CSV HEADER;
SELECT 'price_data_sources: ' || COUNT(*) || ' 条' FROM finapp.price_data_sources;

-- 3. 导入同步任务
\echo '导入同步任务...'
\COPY finapp.price_sync_tasks FROM 'price_sync_tasks.csv' WITH CSV HEADER;
SELECT 'price_sync_tasks: ' || COUNT(*) || ' 条' FROM finapp.price_sync_tasks;

-- 4. 导入汇率数据
\echo '导入汇率数据...'
\COPY finapp.exchange_rates FROM 'exchange_rates.csv' WITH CSV HEADER ON CONFLICT (code, date) DO UPDATE SET
  rate = EXCLUDED.rate,
  inverse_rate = EXCLUDED.inverse_rate,
  source = EXCLUDED.source,
  updated_at = EXCLUDED.updated_at;
SELECT 'exchange_rates: ' || COUNT(*) || ' 条' FROM finapp.exchange_rates;

-- 5. 导入产品数据
\echo '导入产品数据...'
\COPY finapp.products FROM 'products.csv' WITH CSV HEADER ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  product_type = EXCLUDED.product_type,
  market_code = EXCLUDED.market_code,
  currency = EXCLUDED.currency,
  updated_at = EXCLUDED.updated_at;
SELECT 'products: ' || COUNT(*) || ' 条' FROM finapp.products;

\echo ''
\echo '========================================='
\echo '✅ 数据导入完成'
\echo '========================================='
EOF

echo -e "${GREEN}✅ 导入脚本已创建: import-data.sql${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 打包导出文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 创建压缩包
ARCHIVE_NAME="test-data-${TIMESTAMP}.tar.gz"
tar -czf "$EXPORT_DIR/../$ARCHIVE_NAME" -C "$EXPORT_DIR" .

echo -e "${GREEN}✅ 数据已打包: backups/$ARCHIVE_NAME${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 上传到服务器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "执行以下命令上传到服务器:"
echo ""
echo -e "${BLUE}scp backups/$ARCHIVE_NAME root@apollo123.cloud:/opt/finapp/backups/${NC}"
echo ""
echo "然后在服务器上执行:"
echo ""
echo -e "${BLUE}cd /opt/finapp/backups${NC}"
echo -e "${BLUE}tar -xzf $ARCHIVE_NAME${NC}"
echo -e "${BLUE}sudo -u postgres psql -d finapp_production -f import-data.sql${NC}"
echo ""
