#!/bin/bash

# 多资产类型分析脚本
# 用于评估当前资产数据，帮助决策实施方案

echo "=========================================="
echo "  多资产类型架构 - 现状分析"
echo "=========================================="
echo ""

# 数据库连接信息
DB_USER="finapp_user"
DB_NAME="finapp_db"

# 1. 资产类型分布
echo "📊 1. 资产类型分布"
echo "----------------------------------------"
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  at.code,
  at.name as asset_type,
  COUNT(a.id) as count,
  ROUND(COUNT(a.id) * 100.0 / SUM(COUNT(a.id)) OVER (), 2) as percentage
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
WHERE a.is_active = true
GROUP BY at.code, at.name
ORDER BY count DESC;
"
echo ""

# 2. 字段使用情况
echo "📋 2. 字段使用情况分析"
echo "----------------------------------------"
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  at.name as asset_type,
  COUNT(*) as total,
  COUNT(CASE WHEN a.sector IS NOT NULL THEN 1 END) as has_sector,
  COUNT(CASE WHEN a.industry IS NOT NULL THEN 1 END) as has_industry,
  COUNT(CASE WHEN a.metadata IS NOT NULL THEN 1 END) as has_metadata,
  COUNT(CASE WHEN a.risk_level IS NOT NULL THEN 1 END) as has_risk_level
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
WHERE a.is_active = true
GROUP BY at.name
ORDER BY total DESC;
"
echo ""

# 3. metadata 内容分析
echo "🔍 3. metadata 字段内容分析"
echo "----------------------------------------"
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  at.name as asset_type,
  COUNT(*) as total_with_metadata,
  jsonb_object_keys(a.metadata) as metadata_key
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
WHERE a.metadata IS NOT NULL
GROUP BY at.name, metadata_key
ORDER BY at.name, total_with_metadata DESC
LIMIT 20;
"
echo ""

# 4. 数据量统计
echo "📈 4. 数据量统计"
echo "----------------------------------------"
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  'assets' as table_name,
  COUNT(*) as total_records,
  pg_size_pretty(pg_total_relation_size('finapp.assets')) as table_size
FROM finapp.assets
UNION ALL
SELECT 
  'option_details' as table_name,
  COUNT(*) as total_records,
  pg_size_pretty(pg_total_relation_size('finapp.option_details')) as table_size
FROM finapp.option_details;
"
echo ""

# 5. 性能基准测试
echo "⚡ 5. 当前查询性能基准"
echo "----------------------------------------"
echo "测试1: 按 sector 查询（使用 metadata）"
psql -U $DB_USER -d $DB_NAME -c "
EXPLAIN ANALYZE
SELECT * FROM finapp.assets
WHERE metadata->>'sector' = '科技'
LIMIT 10;
" | grep "Execution Time"

echo ""
echo "测试2: 简单查询"
psql -U $DB_USER -d $DB_NAME -c "
EXPLAIN ANALYZE
SELECT * FROM finapp.assets
WHERE is_active = true
LIMIT 10;
" | grep "Execution Time"

echo ""

# 6. 推荐方案
echo "=========================================="
echo "  💡 推荐方案分析"
echo "=========================================="
echo ""

# 获取统计数据
TOTAL_ASSETS=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM finapp.assets WHERE is_active = true;")
STOCK_COUNT=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM finapp.assets a JOIN finapp.asset_types at ON a.asset_type_id = at.id WHERE at.code = 'STOCK' AND a.is_active = true;")
TYPE_COUNT=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(DISTINCT asset_type_id) FROM finapp.assets WHERE is_active = true;")

echo "总资产数: $TOTAL_ASSETS"
echo "股票数量: $STOCK_COUNT"
echo "资产类型数: $TYPE_COUNT"
echo ""

# 根据数据给出建议
if [ $TOTAL_ASSETS -lt 100 ] && [ $TYPE_COUNT -le 2 ]; then
    echo "✅ 推荐方案: 方案A - 最小改动"
    echo "   理由: 数据量小，类型少，快速实施"
    echo "   预计时间: 1-2天"
elif [ $TOTAL_ASSETS -gt 1000 ] || [ $TYPE_COUNT -gt 3 ]; then
    echo "✅ 推荐方案: 方案B - 完整改造"
    echo "   理由: 数据量大或类型多，需要完整优化"
    echo "   预计时间: 5-7天"
else
    echo "✅ 推荐方案: 方案C - 混合模式"
    echo "   理由: 中等规模，渐进式改进"
    echo "   预计时间: 3-4天"
fi

echo ""
echo "=========================================="
echo "  📚 下一步"
echo "=========================================="
echo ""
echo "1. 查看详细方案对比:"
echo "   cat MULTI_ASSET_DECISION_GUIDE.md"
echo ""
echo "2. 查看实施指南:"
echo "   cat MULTI_ASSET_IMPLEMENTATION_GUIDE.md"
echo ""
echo "3. 查看架构设计:"
echo "   cat MULTI_ASSET_TYPE_ARCHITECTURE.md"
echo ""
echo "=========================================="
