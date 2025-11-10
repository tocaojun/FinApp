-- 初始化图表分析数据 - 最小化完整版本
-- 只初始化最关键的数据用于图表展示

BEGIN;

-- 1. 检查现有数据统计
SELECT '===报表数据初始化===' as title;
SELECT 
  'Before' as phase,
  'portfolio_snapshots' as table_name, COUNT(*) as record_count 
FROM finapp.portfolio_snapshots
UNION ALL
SELECT 'Before', 'position_snapshots', COUNT(*) FROM finapp.position_snapshots
UNION ALL
SELECT 'Before', 'cash_flows', COUNT(*) FROM finapp.cash_flows;

-- 2. 添加portfolio_snapshots数据（28条已生成，现在验证）
-- portfolio_snapshots已通过前面的脚本生成，此处仅验证

-- 3. 创建position_snapshots作为portfolio_snapshots的快照
-- position_snapshots依赖portfolio_snapshots，现在创建相关数据
INSERT INTO finapp.position_snapshots (
  id, position_id, portfolio_snapshot_id, snapshot_date, quantity, 
  market_price, market_value, average_cost, total_cost, 
  unrealized_gain_loss, currency, created_at
)
SELECT
  gen_random_uuid(),
  pos.id,
  ps.id,
  ps.snapshot_date,
  (pos.quantity * (1.0::numeric + ((RANDOM()::numeric - 0.5::numeric) * 0.05::numeric)))::numeric,
  ((pos.total_cost / NULLIF(pos.quantity, 0)) * (1.0::numeric + ((RANDOM()::numeric - 0.5::numeric) * 0.05::numeric)))::numeric,
  ((pos.quantity * (pos.total_cost / NULLIF(pos.quantity, 0))) * (1.0::numeric + ((RANDOM()::numeric - 0.5::numeric) * 0.05::numeric)))::numeric,
  (pos.total_cost / NULLIF(pos.quantity, 0))::numeric,
  pos.total_cost,
  ((((pos.quantity * (pos.total_cost / NULLIF(pos.quantity, 0))) * (1.0::numeric + ((RANDOM()::numeric - 0.5::numeric) * 0.05::numeric))) - pos.total_cost)::numeric),
  pos.currency,
  CURRENT_TIMESTAMP
FROM finapp.positions pos
CROSS JOIN finapp.portfolio_snapshots ps
WHERE ps.portfolio_id = pos.portfolio_id
AND NOT EXISTS (
  SELECT 1 FROM finapp.position_snapshots 
  WHERE position_id = pos.id
  AND portfolio_snapshot_id = ps.id
)
ON CONFLICT DO NOTHING;

-- 4. 最终数据统计
SELECT '=== 初始化完成 ===' as status;
SELECT 
  'After' as phase,
  'portfolio_snapshots' as table_name, COUNT(*) as record_count 
FROM finapp.portfolio_snapshots
UNION ALL
SELECT 'After', 'position_snapshots', COUNT(*) FROM finapp.position_snapshots
UNION ALL
SELECT 'After', 'cash_flows', COUNT(*) FROM finapp.cash_flows;

COMMIT;
