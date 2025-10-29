#!/bin/bash

# 测试创建股票期权产品

# 1. 先获取股票类型ID和市场ID
echo "=== 获取股票类型ID ==="
STOCK_TYPE_ID=$(psql -U finapp_user -d finapp_test -t -c "SELECT id FROM finapp.asset_types WHERE code = 'STOCK_OPTION' LIMIT 1;" | xargs)
echo "股票期权类型ID: $STOCK_TYPE_ID"

MARKET_ID=$(psql -U finapp_user -d finapp_test -t -c "SELECT id FROM finapp.markets LIMIT 1;" | xargs)
echo "市场ID: $MARKET_ID"

LIQUIDITY_TAG_ID=$(psql -U finapp_user -d finapp_test -t -c "SELECT id FROM finapp.liquidity_tags WHERE is_active = true LIMIT 1;" | xargs)
echo "流动性标签ID: $LIQUIDITY_TAG_ID"

UNDERLYING_STOCK_ID=$(psql -U finapp_user -d finapp_test -t -c "SELECT id FROM finapp.assets WHERE symbol = '00700' LIMIT 1;" | xargs)
echo "标的股票ID (腾讯): $UNDERLYING_STOCK_ID"

# 2. 测试创建股票期权
echo -e "\n=== 测试创建股票期权 ==="
curl -X POST http://localhost:8000/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat ~/.finapp_token 2>/dev/null || echo 'test-token')" \
  -d "{
    \"symbol\": \"TEST_OPTION_001\",
    \"name\": \"测试股票期权\",
    \"assetTypeId\": \"$STOCK_TYPE_ID\",
    \"marketId\": \"$MARKET_ID\",
    \"currency\": \"CNY\",
    \"riskLevel\": \"HIGH\",
    \"liquidityTag\": \"$LIQUIDITY_TAG_ID\",
    \"isActive\": true,
    \"details\": {
      \"underlyingStockId\": \"$UNDERLYING_STOCK_ID\",
      \"underlyingStockSymbol\": \"00700\",
      \"underlyingStockName\": \"腾讯控股\",
      \"optionType\": \"CALL\",
      \"strikePrice\": 400.00,
      \"expirationDate\": \"2025-12-31\",
      \"contractSize\": 10000,
      \"exerciseStyle\": \"AMERICAN\",
      \"settlementType\": \"PHYSICAL\",
      \"costDivisor\": 3.5
    }
  }" | jq .

echo -e "\n完成"
