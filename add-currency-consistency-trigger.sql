-- =====================================================
-- Currency 一致性触发器
-- =====================================================
-- 目的: 确保 positions 表的 currency 始终与 assets 表一致
-- 防止未来再次出现 currency 不一致的问题
-- =====================================================

-- 创建触发器函数
CREATE OR REPLACE FUNCTION finapp.ensure_position_currency_consistency()
RETURNS TRIGGER AS $$
DECLARE
    asset_currency VARCHAR(3);
BEGIN
    -- 获取资产的currency
    SELECT currency INTO asset_currency
    FROM finapp.assets
    WHERE id = NEW.asset_id;
    
    -- 如果找不到资产，抛出错误
    IF asset_currency IS NULL THEN
        RAISE EXCEPTION 'Asset not found: %', NEW.asset_id;
    END IF;
    
    -- 如果position的currency与asset不一致，自动修正
    IF NEW.currency != asset_currency THEN
        RAISE NOTICE 'Position currency (%) does not match asset currency (%). Auto-correcting...', 
                     NEW.currency, asset_currency;
        NEW.currency := asset_currency;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建 INSERT 触发器
DROP TRIGGER IF EXISTS trg_position_currency_consistency_insert ON finapp.positions;
CREATE TRIGGER trg_position_currency_consistency_insert
    BEFORE INSERT ON finapp.positions
    FOR EACH ROW
    EXECUTE FUNCTION finapp.ensure_position_currency_consistency();

-- 创建 UPDATE 触发器
DROP TRIGGER IF EXISTS trg_position_currency_consistency_update ON finapp.positions;
CREATE TRIGGER trg_position_currency_consistency_update
    BEFORE UPDATE ON finapp.positions
    FOR EACH ROW
    WHEN (NEW.currency IS DISTINCT FROM OLD.currency OR NEW.asset_id IS DISTINCT FROM OLD.asset_id)
    EXECUTE FUNCTION finapp.ensure_position_currency_consistency();

-- 添加注释
COMMENT ON FUNCTION finapp.ensure_position_currency_consistency() IS 
'确保positions表的currency字段始终与对应asset的currency一致。如果不一致，自动修正为asset的currency。';

COMMENT ON TRIGGER trg_position_currency_consistency_insert ON finapp.positions IS 
'在插入position时，自动确保currency与asset一致';

COMMENT ON TRIGGER trg_position_currency_consistency_update ON finapp.positions IS 
'在更新position的currency或asset_id时，自动确保currency与asset一致';

-- 验证触发器已创建
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'finapp'
  AND event_object_table = 'positions'
  AND trigger_name LIKE '%currency_consistency%'
ORDER BY trigger_name;

SELECT '✅ Currency一致性触发器已创建' as status;
