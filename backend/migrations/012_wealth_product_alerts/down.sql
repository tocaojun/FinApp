-- ============================================
-- 回滚：删除财富产品告警表
-- ============================================

-- 删除触发器
DROP TRIGGER IF EXISTS wealth_alerts_update_timestamp ON finapp.wealth_product_alerts;
DROP FUNCTION IF EXISTS finapp.update_wealth_alerts_timestamp();

-- 删除视图
DROP VIEW IF EXISTS finapp.vw_wealth_alert_statistics CASCADE;
DROP VIEW IF EXISTS finapp.vw_wealth_active_alerts CASCADE;

-- 删除索引
DROP INDEX IF EXISTS finapp.idx_wealth_alerts_triggered_at;
DROP INDEX IF EXISTS finapp.idx_wealth_alerts_status;
DROP INDEX IF EXISTS finapp.idx_wealth_alerts_level;
DROP INDEX IF EXISTS finapp.idx_wealth_alerts_asset_id;
DROP INDEX IF EXISTS finapp.idx_wealth_alerts_user_id;

-- 删除表
DROP TABLE IF EXISTS finapp.wealth_product_alerts CASCADE;
