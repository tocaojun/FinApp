#!/bin/bash

# 测试期权产品编辑时详情字段是否正确加载

echo "=========================================="
echo "测试期权产品详情字段编辑功能"
echo "=========================================="
echo ""

# 获取认证token
TOKEN=$(cat ~/.finapp_token 2>/dev/null || echo "")
if [ -z "$TOKEN" ]; then
  echo "❌ 未找到认证token，请先登录"
  echo "提示：登录后token会自动保存到 ~/.finapp_token"
  exit 1
fi

echo "✓ 已获取认证token"
echo ""

# 1. 查询所有期权产品
echo "1️⃣  查询期权产品列表..."
echo "-------------------------------------------"

# 先获取期权类型ID
OPTION_TYPE_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/assets/types" \
  -H "Authorization: Bearer $TOKEN")

OPTION_TYPE_ID=$(echo $OPTION_TYPE_RESPONSE | jq -r '.data[] | select(.code == "OPTION") | .id')

if [ -z "$OPTION_TYPE_ID" ] || [ "$OPTION_TYPE_ID" = "null" ]; then
  echo "❌ 未找到期权类型"
  exit 1
fi

echo "✓ 期权类型ID: $OPTION_TYPE_ID"

# 查询期权产品
ASSETS_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/assets/search?assetTypeId=$OPTION_TYPE_ID&limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "$ASSETS_RESPONSE" | jq '.'

# 提取第一个期权产品ID
ASSET_ID=$(echo $ASSETS_RESPONSE | jq -r '.data.assets[0].id // empty')

if [ -z "$ASSET_ID" ]; then
  echo ""
  echo "⚠️  没有找到期权产品，请先创建一个期权产品进行测试"
  echo ""
  echo "创建测试期权产品..."
  
  # 获取市场ID
  MARKETS_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/assets/markets" \
    -H "Authorization: Bearer $TOKEN")
  MARKET_ID=$(echo $MARKETS_RESPONSE | jq -r '.data[0].id')
  
  # 获取流动性标签ID
  TAGS_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/liquidity-tags" \
    -H "Authorization: Bearer $TOKEN")
  TAG_ID=$(echo $TAGS_RESPONSE | jq -r '.data[0].id')
  
  # 创建测试期权
  CREATE_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/assets" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"symbol\": \"TEST-CALL-001\",
      \"name\": \"测试看涨期权\",
      \"assetTypeId\": \"$OPTION_TYPE_ID\",
      \"marketId\": \"$MARKET_ID\",
      \"currency\": \"CNY\",
      \"riskLevel\": \"HIGH\",
      \"liquidityTag\": \"$TAG_ID\",
      \"isActive\": true,
      \"description\": \"测试期权产品\",
      \"details\": {
        \"optionType\": \"CALL\",
        \"underlyingAsset\": \"000001.SZ\",
        \"strikePrice\": 15.50,
        \"expirationDate\": \"2025-12-31\",
        \"contractSize\": 10000,
        \"delta\": 0.65,
        \"gamma\": 0.05,
        \"theta\": -0.02,
        \"vega\": 0.15,
        \"rho\": 0.08,
        \"impliedVolatility\": 0.25,
        \"exerciseStyle\": \"EUROPEAN\",
        \"settlementType\": \"CASH\",
        \"multiplier\": 1,
        \"premiumCurrency\": \"CNY\",
        \"marginRequirement\": 5000,
        \"tradingUnit\": \"手\"
      }
    }")
  
  echo "$CREATE_RESPONSE" | jq '.'
  ASSET_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')
  
  if [ -z "$ASSET_ID" ] || [ "$ASSET_ID" = "null" ]; then
    echo "❌ 创建测试期权失败"
    exit 1
  fi
  
  echo "✓ 已创建测试期权: $ASSET_ID"
fi

echo ""
echo "2️⃣  获取期权产品详情（模拟编辑操作）..."
echo "-------------------------------------------"
echo "资产ID: $ASSET_ID"
echo ""

DETAIL_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/assets/$ASSET_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$DETAIL_RESPONSE" | jq '.'

# 检查是否包含details字段
HAS_DETAILS=$(echo $DETAIL_RESPONSE | jq -r '.data.details // empty')

echo ""
echo "=========================================="
echo "测试结果"
echo "=========================================="

if [ -n "$HAS_DETAILS" ]; then
  echo "✅ 成功：返回数据包含 details 字段"
  echo ""
  echo "Details 内容："
  echo "$DETAIL_RESPONSE" | jq '.data.details'
  echo ""
  echo "✓ 期权类型: $(echo $DETAIL_RESPONSE | jq -r '.data.details.optionType // "未设置"')"
  echo "✓ 标的资产: $(echo $DETAIL_RESPONSE | jq -r '.data.details.underlyingAsset // "未设置"')"
  echo "✓ 行权价: $(echo $DETAIL_RESPONSE | jq -r '.data.details.strikePrice // "未设置"')"
  echo "✓ 到期日: $(echo $DETAIL_RESPONSE | jq -r '.data.details.expirationDate // "未设置"')"
  echo "✓ Delta: $(echo $DETAIL_RESPONSE | jq -r '.data.details.delta // "未设置"')"
  echo "✓ Gamma: $(echo $DETAIL_RESPONSE | jq -r '.data.details.gamma // "未设置"')"
  echo ""
  echo "🎉 编辑功能应该可以正常工作了！"
  echo "   前端会将这些 details 字段预填充到表单中"
else
  echo "❌ 失败：返回数据不包含 details 字段"
  echo ""
  echo "可能的原因："
  echo "1. 数据库中没有保存详情数据"
  echo "2. 后端查询时没有关联详情表"
  echo ""
  echo "完整响应："
  echo "$DETAIL_RESPONSE" | jq '.'
fi

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
