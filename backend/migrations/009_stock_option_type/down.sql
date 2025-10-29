-- ============================================
-- 回滚股票期权资产类型
-- Migration: 009_stock_option_type (DOWN)
-- ============================================

-- 1. 删除视图
DROP VIEW IF EXISTS finapp.v_stock_options_full;

-- 2. 删除函数
DROP FUNCTION IF EXISTS finapp.calculate_stock_option_value;
DROP FUNCTION IF EXISTS finapp.calculate_stock_option_cost;

-- 3. 删除触发器
DROP TRIGGER IF EXISTS update_stock_option_details_updated_at ON finapp.stock_option_details;

-- 4. 删除表
DROP TABLE IF EXISTS finapp.stock_option_details;

-- 5. 删除资产类型
DELETE FROM finapp.asset_types WHERE code = 'STOCK_OPTION';
