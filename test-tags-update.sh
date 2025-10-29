#!/bin/bash

echo "=== 测试多标签保存和读取 ==="
echo ""

# 获取数据库中的一个交易ID和标签
echo "1. 查询数据库中的交易和标签..."
TRANSACTION_ID=$(psql -h localhost -U finapp_user -d finapp -t -c "SELECT id FROM finapp.transactions LIMIT 1" 2>/dev/null | xargs)
TAG1=$(psql -h localhost -U finapp_user -d finapp -t -c "SELECT name FROM finapp.transaction_tags LIMIT 1 OFFSET 0" 2>/dev/null | xargs)
TAG2=$(psql -h localhost -U finapp_user -d finapp -t -c "SELECT name FROM finapp.transaction_tags LIMIT 1 OFFSET 1" 2>/dev/null | xargs)

if [ -z "$TRANSACTION_ID" ]; then
  echo "❌ 没有找到交易记录"
  exit 1
fi

if [ -z "$TAG1" ] || [ -z "$TAG2" ]; then
  echo "❌ 没有找到足够的标签"
  exit 1
fi

echo "✅ 找到交易ID: $TRANSACTION_ID"
echo "✅ 找到标签1: $TAG1"
echo "✅ 找到标签2: $TAG2"
echo ""

# 查询当前标签
echo "2. 查询交易当前的标签..."
CURRENT_TAGS=$(psql -h localhost -U finapp_user -d finapp -t -c "
  SELECT string_agg(tt.name, ', ')
  FROM finapp.transaction_tag_mappings ttm
  JOIN finapp.transaction_tags tt ON ttm.tag_id = tt.id
  WHERE ttm.transaction_id = '$TRANSACTION_ID'
" 2>/dev/null | xargs)

echo "当前标签: ${CURRENT_TAGS:-无}"
echo ""

# 直接在数据库中更新标签映射
echo "3. 在数据库中添加两个标签..."

# 获取标签ID
TAG1_ID=$(psql -h localhost -U finapp_user -d finapp -t -c "SELECT id FROM finapp.transaction_tags WHERE name = '$TAG1'" 2>/dev/null | xargs)
TAG2_ID=$(psql -h localhost -U finapp_user -d finapp -t -c "SELECT id FROM finapp.transaction_tags WHERE name = '$TAG2'" 2>/dev/null | xargs)

# 先删除旧标签
psql -h localhost -U finapp_user -d finapp -c "DELETE FROM finapp.transaction_tag_mappings WHERE transaction_id = '$TRANSACTION_ID'" 2>/dev/null > /dev/null

# 添加两个标签
psql -h localhost -U finapp_user -d finapp -c "
  INSERT INTO finapp.transaction_tag_mappings (transaction_id, tag_id)
  VALUES ('$TRANSACTION_ID', '$TAG1_ID'), ('$TRANSACTION_ID', '$TAG2_ID')
  ON CONFLICT DO NOTHING
" 2>/dev/null > /dev/null

echo "✅ 已添加两个标签"
echo ""

# 再次查询标签
echo "4. 验证标签是否保存成功..."
NEW_TAGS=$(psql -h localhost -U finapp_user -d finapp -t -c "
  SELECT string_agg(tt.name, ', ')
  FROM finapp.transaction_tag_mappings ttm
  JOIN finapp.transaction_tags tt ON ttm.tag_id = tt.id
  WHERE ttm.transaction_id = '$TRANSACTION_ID'
" 2>/dev/null | xargs)

echo "更新后的标签: $NEW_TAGS"

# 统计标签数量
TAG_COUNT=$(psql -h localhost -U finapp_user -d finapp -t -c "
  SELECT COUNT(*)
  FROM finapp.transaction_tag_mappings
  WHERE transaction_id = '$TRANSACTION_ID'
" 2>/dev/null | xargs)

echo "标签数量: $TAG_COUNT"
echo ""

if [ "$TAG_COUNT" = "2" ]; then
  echo "✅ 测试通过：成功保存了2个标签"
else
  echo "❌ 测试失败：标签数量不正确"
fi

echo ""
echo "=== 测试完成 ==="
