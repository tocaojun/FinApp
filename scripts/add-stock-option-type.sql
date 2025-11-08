-- 添加股票期权产品分类
-- 执行时间: 2025-11-07

BEGIN;

-- 备份现有数据（仅用于记录）
-- SELECT COUNT(*) as asset_types_count FROM finapp.asset_types;

-- 检查是否已存在 STOCK_OPTION 分类
DO $$ 
DECLARE
  stock_option_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM finapp.asset_types WHERE code = 'STOCK_OPTION'
  ) INTO stock_option_exists;

  IF NOT stock_option_exists THEN
    -- 插入新的 STOCK_OPTION 分类
    INSERT INTO finapp.asset_types (code, name, category, description, is_active)
    VALUES (
      'STOCK_OPTION',
      '股票期权',
      'STOCK_OPTION',
      '股票期权合约，包括认购期权和认沽期权',
      true
    );
    
    RAISE NOTICE '✅ 成功添加 STOCK_OPTION 分类';
  ELSE
    RAISE NOTICE '⚠️  STOCK_OPTION 分类已存在，跳过添加';
  END IF;
END $$;

-- 验证插入
SELECT id, code, name, category, description 
FROM finapp.asset_types 
WHERE code = 'STOCK_OPTION';

COMMIT;
