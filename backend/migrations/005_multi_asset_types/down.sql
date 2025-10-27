-- ============================================
-- 回滚脚本：多资产类型架构升级
-- Migration: 005_multi_asset_types (ROLLBACK)
-- ============================================

-- 1. 删除触发器
DROP TRIGGER IF EXISTS update_stock_details_updated_at ON finapp.stock_details;
DROP TRIGGER IF EXISTS update_fund_details_updated_at ON finapp.fund_details;
DROP TRIGGER IF EXISTS update_bond_details_updated_at ON finapp.bond_details;
DROP TRIGGER IF EXISTS update_futures_details_updated_at ON finapp.futures_details;
DROP TRIGGER IF EXISTS update_wealth_product_details_updated_at ON finapp.wealth_product_details;
DROP TRIGGER IF EXISTS update_treasury_details_updated_at ON finapp.treasury_details;

-- 2. 删除视图
DROP VIEW IF EXISTS finapp.v_assets_full;

-- 3. 删除详情表（按依赖顺序）
DROP TABLE IF EXISTS finapp.treasury_details;
DROP TABLE IF EXISTS finapp.wealth_product_details;
DROP TABLE IF EXISTS finapp.futures_details;
DROP TABLE IF EXISTS finapp.bond_details;
DROP TABLE IF EXISTS finapp.fund_details;
DROP TABLE IF EXISTS finapp.stock_details;

-- 4. 删除触发器函数（如果没有其他表使用）
-- DROP FUNCTION IF EXISTS finapp.update_updated_at_column();

SELECT 'Multi-asset type architecture rollback completed!' as status;
