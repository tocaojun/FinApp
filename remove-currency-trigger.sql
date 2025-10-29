-- =====================================================
-- 移除 Currency 自动修正触发器
-- =====================================================
-- 原因: 自动修正会隐藏代码中的错误
-- 新策略: 让错误暴露出来，强制修复代码
-- =====================================================

BEGIN;

-- 删除触发器
DROP TRIGGER IF EXISTS trg_position_currency_consistency_insert ON finapp.positions;
DROP TRIGGER IF EXISTS trg_position_currency_consistency_update ON finapp.positions;

-- 删除触发器函数
DROP FUNCTION IF EXISTS finapp.ensure_position_currency_consistency();

SELECT '✅ Currency 自动修正触发器已移除' as status;

-- =====================================================
-- 新策略: 添加约束检查（可选）
-- =====================================================
-- 如果需要，可以添加一个 CHECK 约束来验证一致性
-- 但这会在插入/更新时抛出错误，而不是自动修正

-- 注意: 这个约束会阻止所有不一致的插入/更新
-- 取消注释以启用严格检查：

/*
ALTER TABLE finapp.positions
ADD CONSTRAINT chk_position_currency_matches_asset
CHECK (
  currency = (
    SELECT currency 
    FROM finapp.assets 
    WHERE id = asset_id
  )
);
*/

-- 如果启用了约束，任何不一致的插入都会失败并显示错误信息

COMMIT;

SELECT '提示: 现在 currency 不一致会导致数据问题，请确保代码正确处理' as message;
