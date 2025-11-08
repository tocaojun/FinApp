#!/bin/bash

# 获取一个有效的用户 token
echo "=== 获取测试 token ==="
TOKEN=$(psql -h localhost -U finapp_user -d finapp_test -t -c "
SELECT u.id FROM finapp.users u LIMIT 1;
" 2>/dev/null | xargs)

echo "用户 ID: $TOKEN"

# 获取数据源 ID
echo ""
echo "=== 获取数据源列表 ==="
DS_ID=$(psql -h localhost -U finapp_user -d finapp_test -t -c "
SELECT id FROM finapp.price_data_sources WHERE name = 'Yahoo Finance' LIMIT 1;
" 2>/dev/null | xargs)

echo "Yahoo Finance ID: $DS_ID"

# 测试后端 API（需要运行中的后端）
echo ""
echo "=== 测试 /api/price-sync/data-sources API ==="
echo "数据源基本信息："
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT id, name, provider, config FROM finapp.price_data_sources WHERE name = 'Yahoo Finance';
" 2>/dev/null

echo ""
echo "=== 配置详情 ==="
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT 
  name,
  config->>'supports_products' as supports_products,
  config->>'supports_countries' as supports_countries
FROM finapp.price_data_sources WHERE name = 'Yahoo Finance';
" 2>/dev/null
