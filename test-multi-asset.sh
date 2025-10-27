#!/bin/bash

echo "=========================================="
echo "多资产类型架构测试"
echo "=========================================="
echo ""

# 数据库连接信息
DB_USER="finapp_user"
DB_NAME="finapp_test"

# 1. 检查表创建
echo "1. 检查详情表是否创建..."
psql -U $DB_USER -d $DB_NAME -c "\dt finapp.*_details"
echo ""

# 2. 检查数据迁移
echo "2. 检查股票数据迁移..."
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  COUNT(*) as total_stocks,
  COUNT(sd.id) as migrated_to_details
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
LEFT JOIN finapp.stock_details sd ON a.id = sd.asset_id
WHERE at.code = 'STOCK';
"
echo ""

# 3. 检查视图
echo "3. 检查完整资产视图..."
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  asset_type_code,
  COUNT(*) as count
FROM finapp.v_assets_full
GROUP BY asset_type_code
ORDER BY count DESC;
"
echo ""

# 4. 测试查询性能
echo "4. 测试查询性能..."
echo "   - 旧方式（JSONB查询）："
psql -U $DB_USER -d $DB_NAME -c "
EXPLAIN ANALYZE
SELECT * FROM finapp.assets
WHERE metadata->>'sector' = '科技'
LIMIT 10;
" | grep "Execution Time"

echo "   - 新方式（索引查询）："
psql -U $DB_USER -d $DB_NAME -c "
EXPLAIN ANALYZE
SELECT a.*, sd.*
FROM finapp.assets a
JOIN finapp.stock_details sd ON a.id = sd.asset_id
WHERE sd.sector = '科技'
LIMIT 10;
" | grep "Execution Time"
echo ""

# 5. 查看示例数据
echo "5. 查看示例数据..."
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  a.symbol,
  a.name,
  at.name as asset_type,
  sd.sector,
  sd.industry,
  sd.pe_ratio
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
LEFT JOIN finapp.stock_details sd ON a.id = sd.asset_id
WHERE at.code = 'STOCK'
LIMIT 5;
"
echo ""

# 6. 统计信息
echo "6. 统计信息..."
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  'stock_details' as table_name,
  COUNT(*) as record_count
FROM finapp.stock_details
UNION ALL
SELECT 
  'fund_details' as table_name,
  COUNT(*) as record_count
FROM finapp.fund_details
UNION ALL
SELECT 
  'bond_details' as table_name,
  COUNT(*) as record_count
FROM finapp.bond_details
UNION ALL
SELECT 
  'futures_details' as table_name,
  COUNT(*) as record_count
FROM finapp.futures_details
UNION ALL
SELECT 
  'wealth_product_details' as table_name,
  COUNT(*) as record_count
FROM finapp.wealth_product_details
UNION ALL
SELECT 
  'treasury_details' as table_name,
  COUNT(*) as record_count
FROM finapp.treasury_details;
"
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
