-- 报表数据初始化脚本
-- 功能：从现有数据自动生成portfolio_snapshots、cash_flows和初始报表记录
-- 执行前建议进行备份

BEGIN;

-- ============================================
-- 第一部分：初始化投资组合快照 (portfolio_snapshots)
-- ============================================

-- 生成每日的投资组合快照
INSERT INTO finapp.portfolio_snapshots (
  portfolio_id,
  snapshot_date,
  total_value,
  cash_value,
  invested_value,
  unrealized_gain_loss,
  realized_gain_loss,
  currency,
  created_at
)
SELECT 
  p.id AS portfolio_id,
  ap.price_date AS snapshot_date,
  -- 总价值 = 当前持仓数量 * 当日价格
  COALESCE(SUM(pos.quantity * ap.close_price), 0) AS total_value,
  0 AS cash_value,  -- 假设无现金
  COALESCE(SUM(pos.quantity * ap.close_price), 0) AS invested_value,
  -- 未实现收益 = 当前价值 - 成本价值
  COALESCE(SUM(pos.quantity * ap.close_price - pos.quantity * COALESCE(t.price, ap.close_price)), 0) AS unrealized_gain_loss,
  0 AS realized_gain_loss,
  'USD' AS currency,
  CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
FROM finapp.portfolios p
LEFT JOIN finapp.positions pos ON p.id = pos.portfolio_id
LEFT JOIN finapp.asset_prices ap ON pos.asset_id = ap.asset_id
LEFT JOIN finapp.transactions t ON pos.portfolio_id = t.portfolio_id AND pos.asset_id = t.asset_id
WHERE ap.price_date IS NOT NULL
GROUP BY p.id, ap.price_date
ORDER BY p.id, ap.price_date
ON CONFLICT (portfolio_id, snapshot_date) DO NOTHING;

-- 如果没有历史价格数据，为当前日期创建一个快照
INSERT INTO finapp.portfolio_snapshots (
  portfolio_id,
  snapshot_date,
  total_value,
  cash_value,
  invested_value,
  unrealized_gain_loss,
  realized_gain_loss,
  currency,
  created_at
)
SELECT 
  p.id AS portfolio_id,
  CURRENT_DATE AS snapshot_date,
  -- 使用最新的资产价格计算总价值
  COALESCE(SUM(pos.quantity * COALESCE(ap.close_price, t.price)), 0) AS total_value,
  0 AS cash_value,
  COALESCE(SUM(pos.quantity * COALESCE(ap.close_price, t.price)), 0) AS invested_value,
  COALESCE(SUM(pos.quantity * COALESCE(ap.close_price, t.price) - pos.quantity * t.price), 0) AS unrealized_gain_loss,
  0 AS realized_gain_loss,
  'USD' AS currency,
  CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
FROM finapp.portfolios p
LEFT JOIN finapp.positions pos ON p.id = pos.portfolio_id
LEFT JOIN finapp.transactions t ON pos.portfolio_id = t.portfolio_id AND pos.asset_id = t.asset_id
LEFT JOIN LATERAL (
  SELECT close_price
  FROM finapp.asset_prices
  WHERE asset_id = pos.asset_id
  ORDER BY price_date DESC
  LIMIT 1
) ap ON true
GROUP BY p.id
ON CONFLICT (portfolio_id, snapshot_date) DO NOTHING;

-- ============================================
-- 第二部分：初始化现金流数据 (cash_flows)
-- ============================================

-- 从交易记录生成现金流
INSERT INTO finapp.cash_flows (
  portfolio_id,
  asset_id,
  flow_type,
  amount,
  currency,
  flow_date,
  description,
  transaction_id,
  created_at
)
SELECT 
  t.portfolio_id,
  t.asset_id,
  CASE 
    WHEN t.transaction_type IN ('buy', 'deposit') THEN 'inflow'
    WHEN t.transaction_type IN ('sell', 'withdraw') THEN 'outflow'
    ELSE 'inflow'
  END AS flow_type,
  ABS(t.quantity * t.price) AS amount,
  'USD' AS currency,
  COALESCE(t.transaction_date, t.executed_at::date) AS flow_date,
  CONCAT(t.transaction_type, ' - Transaction') AS description,
  t.id AS transaction_id,
  CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
FROM finapp.transactions t
WHERE t.asset_id IS NOT NULL;

-- 为没有交易的投资组合添加初始现金流（假设投资组合创建时有初始资金）
INSERT INTO finapp.cash_flows (
  portfolio_id,
  flow_type,
  amount,
  currency,
  flow_date,
  description,
  created_at
)
SELECT 
  p.id,
  'inflow',
  100000, -- 假设初始投资金额为100000
  'USD',
  p.created_at::date,
  'Initial portfolio deposit',
  CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
FROM finapp.portfolios p
WHERE NOT EXISTS (
  SELECT 1 FROM finapp.cash_flows cf WHERE cf.portfolio_id = p.id
);

-- ============================================
-- 第三部分：初始化报表记录 (reports)
-- ============================================

-- 创建历史季度报表记录（基于现有数据的日期范围）
INSERT INTO finapp.reports (
  user_id,
  portfolio_id,
  name,
  description,
  report_type,
  parameters,
  is_scheduled,
  is_active,
  last_generated_at,
  created_at,
  updated_at
)
SELECT 
  p.user_id,
  p.id,
  CONCAT(
    TO_CHAR(CURRENT_DATE, 'YYYY'),
    'Q',
    CEILING(EXTRACT(MONTH FROM CURRENT_DATE) / 3.0)::text
  ) AS name,
  CONCAT('Quarterly report for ', p.name),
  'quarterly',
  jsonb_build_object(
    'quarter', CONCAT(
      TO_CHAR(CURRENT_DATE, 'YYYY'),
      'Q',
      CEILING(EXTRACT(MONTH FROM CURRENT_DATE) / 3.0)::text
    ),
    'totalAssets', COALESCE(SUM(pos.quantity * ap.close_price), 0),
    'totalReturn', 0,
    'returnRate', 0,
    'portfolioCount', 1,
    'transactionCount', (SELECT COUNT(*) FROM finapp.transactions t WHERE t.portfolio_id = p.id)
  ),
  false,
  true,
  CURRENT_TIMESTAMP AT TIME ZONE 'UTC',
  CURRENT_TIMESTAMP AT TIME ZONE 'UTC',
  CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
FROM finapp.portfolios p
LEFT JOIN finapp.positions pos ON p.id = pos.portfolio_id
LEFT JOIN LATERAL (
  SELECT close_price
  FROM finapp.asset_prices
  WHERE asset_id = pos.asset_id
  ORDER BY price_date DESC
  LIMIT 1
) ap ON true
GROUP BY p.id, p.user_id;

-- ============================================
-- 提交事务
-- ============================================

COMMIT;

-- 验证初始化结果
SELECT '=== Portfolio Snapshots ===' as info;
SELECT COUNT(*) as snapshot_count FROM finapp.portfolio_snapshots;

SELECT '=== Cash Flows ===' as info;
SELECT COUNT(*) as cash_flow_count FROM finapp.cash_flows;

SELECT '=== Reports ===' as info;
SELECT COUNT(*) as report_count FROM finapp.reports;

-- 显示样本数据
SELECT '=== Portfolio Snapshot Sample ===' as info;
SELECT * FROM finapp.portfolio_snapshots LIMIT 3;

SELECT '=== Cash Flow Sample ===' as info;
SELECT * FROM finapp.cash_flows LIMIT 3;

SELECT '=== Report Sample ===' as info;
SELECT * FROM finapp.reports LIMIT 3;
