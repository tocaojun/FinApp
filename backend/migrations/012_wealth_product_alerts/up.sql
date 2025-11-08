-- ============================================
-- 财富产品告警表
-- ============================================

-- 创建告警表
CREATE TABLE IF NOT EXISTS finapp.wealth_product_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES finapp.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES finapp.users(id) ON DELETE CASCADE,
  alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('NORMAL', 'WARNING', 'ALERT')),
  message TEXT NOT NULL,
  deviation_ratio DECIMAL(10, 4) NOT NULL,
  recommendation TEXT,
  triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'ACKNOWLEDGED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(asset_id, triggered_at)
);

-- 创建索引
CREATE INDEX idx_wealth_alerts_user_id ON finapp.wealth_product_alerts(user_id);
CREATE INDEX idx_wealth_alerts_asset_id ON finapp.wealth_product_alerts(asset_id);
CREATE INDEX idx_wealth_alerts_level ON finapp.wealth_product_alerts(alert_level);
CREATE INDEX idx_wealth_alerts_status ON finapp.wealth_product_alerts(status);
CREATE INDEX idx_wealth_alerts_triggered_at ON finapp.wealth_product_alerts(triggered_at);

-- 创建视图：用户的活跃告警
CREATE OR REPLACE VIEW finapp.vw_wealth_active_alerts AS
SELECT
  wa.id,
  wa.asset_id,
  wa.user_id,
  a.name as asset_name,
  wa.alert_level,
  wa.message,
  wa.deviation_ratio,
  wa.recommendation,
  wa.triggered_at,
  EXTRACT(DAY FROM CURRENT_TIMESTAMP - wa.triggered_at) as days_since_alert,
  COUNT(*) OVER (PARTITION BY wa.user_id, wa.alert_level) as similar_alerts_count
FROM finapp.wealth_product_alerts wa
JOIN finapp.assets a ON wa.asset_id = a.id
WHERE wa.status = 'ACTIVE'
  AND wa.triggered_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY wa.triggered_at DESC;

-- 创建视图：告警统计
CREATE OR REPLACE VIEW finapp.vw_wealth_alert_statistics AS
SELECT
  wa.user_id,
  wa.alert_level,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN wa.status = 'ACTIVE' THEN 1 END) as active_alerts,
  COUNT(CASE WHEN wa.status = 'RESOLVED' THEN 1 END) as resolved_alerts,
  COUNT(CASE WHEN wa.status = 'ACKNOWLEDGED' THEN 1 END) as acknowledged_alerts,
  AVG(EXTRACT(DAY FROM CURRENT_TIMESTAMP - wa.triggered_at)) as avg_days_open,
  MAX(wa.triggered_at) as latest_alert_time
FROM finapp.wealth_product_alerts wa
WHERE wa.triggered_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY wa.user_id, wa.alert_level;

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION finapp.update_wealth_alerts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wealth_alerts_update_timestamp
BEFORE UPDATE ON finapp.wealth_product_alerts
FOR EACH ROW
EXECUTE FUNCTION finapp.update_wealth_alerts_timestamp();

-- 添加注释
COMMENT ON TABLE finapp.wealth_product_alerts IS '财富产品监控告警表';
COMMENT ON COLUMN finapp.wealth_product_alerts.alert_level IS '告警级别: NORMAL(正常), WARNING(预警), ALERT(告警)';
COMMENT ON COLUMN finapp.wealth_product_alerts.deviation_ratio IS '偏差率(%)';
COMMENT ON COLUMN finapp.wealth_product_alerts.status IS '告警状态: ACTIVE(活跃), RESOLVED(已解决), ACKNOWLEDGED(已确认)';
