#!/bin/bash
# 测试价格同步修复脚本
# 日期: 2025-12-02

set -e

echo "========================================="
echo "价格同步修复测试脚本"
echo "========================================="
echo ""

# 配置
API_BASE="http://localhost:8000/api"
CHINA_ETF_TASK_ID="6ddee743-56a2-4ee0-bc20-a74d2e684e55"
HK_STOCK_TASK_ID="07359f8f-1ecf-4d2f-9088-d135fa816499"

# 获取认证token (使用测试账户)
echo "1. 获取认证token..."
TOKEN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 无法获取认证token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token获取成功"
echo ""

# 测试1: 执行中国ETF价格同步
echo "========================================="
echo "测试1: 中国ETF价格同步"
echo "========================================="
echo ""

echo "执行同步任务: 中国ETF 价格同步"
SYNC_RESPONSE=$(curl -s -X POST "${API_BASE}/price-sync/tasks/${CHINA_ETF_TASK_ID}/execute" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "同步响应:"
echo "$SYNC_RESPONSE" | python3 -m json.tool || echo "$SYNC_RESPONSE"
echo ""

# 等待同步完成
echo "等待5秒让同步完成..."
sleep 5

# 检查同步日志
echo "查询最新同步日志..."
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT 
  status, 
  total_assets, 
  total_records, 
  success_count, 
  failed_count,
  TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI:SS') as started_at
FROM finapp.price_sync_logs 
WHERE task_id = '${CHINA_ETF_TASK_ID}'
ORDER BY started_at DESC 
LIMIT 1;
"

# 检查是否有新的价格记录
echo ""
echo "检查今天的价格记录 (中国ETF)..."
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT 
  a.symbol,
  a.name,
  COUNT(*) as price_count,
  MAX(ap.price_date) as latest_date
FROM finapp.asset_prices ap
JOIN finapp.assets a ON ap.asset_id = a.id
WHERE ap.created_at::date = CURRENT_DATE
  AND a.asset_type_id = (SELECT id FROM finapp.asset_types WHERE code = 'ETF')
  AND a.country_id = (SELECT id FROM finapp.countries WHERE code = 'CN')
GROUP BY a.symbol, a.name;
"

echo ""
echo "========================================="
echo "测试2: 香港股票价格同步"
echo "========================================="
echo ""

echo "执行同步任务: 香港股票价格同步"
SYNC_RESPONSE=$(curl -s -X POST "${API_BASE}/price-sync/tasks/${HK_STOCK_TASK_ID}/execute" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "同步响应:"
echo "$SYNC_RESPONSE" | python3 -m json.tool || echo "$SYNC_RESPONSE"
echo ""

# 等待同步完成
echo "等待5秒让同步完成..."
sleep 5

# 检查同步日志
echo "查询最新同步日志..."
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT 
  status, 
  total_assets, 
  total_records, 
  success_count, 
  failed_count,
  TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI:SS') as started_at
FROM finapp.price_sync_logs 
WHERE task_id = '${HK_STOCK_TASK_ID}'
ORDER BY started_at DESC 
LIMIT 1;
"

# 检查是否有新的价格记录
echo ""
echo "检查今天的价格记录 (香港股票)..."
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT 
  a.symbol,
  a.name,
  COUNT(*) as price_count,
  MAX(ap.price_date) as latest_date
FROM finapp.asset_prices ap
JOIN finapp.assets a ON ap.asset_id = a.id
WHERE ap.created_at::date = CURRENT_DATE
  AND ap.price_source = 'FUTU_API'
  AND a.country_id = (SELECT id FROM finapp.countries WHERE code = 'HK')
GROUP BY a.symbol, a.name;
"

echo ""
echo "========================================="
echo "测试完成"
echo "========================================="
echo ""
echo "✅ 如果上面显示的 success_count > 0，说明修复成功"
echo "✅ 如果 price_count > 0，说明价格数据已成功插入"
echo ""
