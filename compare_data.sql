-- 对比前端应该显示的数据和数据库的实际数据

-- 1. 数据库中的实际数据
SELECT 
  'Database' as source,
  COUNT(*) as position_count,
  SUM(p.total_cost)::numeric(20,2) as total_cost,
  SUM(p.quantity * COALESCE(ap.close_price, 0))::numeric(20,2) as market_value,
  (SUM(p.quantity * COALESCE(ap.close_price, 0)) - SUM(p.total_cost))::numeric(20,2) as gain_loss,
  ((SUM(p.quantity * COALESCE(ap.close_price, 0)) - SUM(p.total_cost)) / SUM(p.total_cost) * 100)::numeric(10,2) as gain_loss_percent
FROM finapp.positions p
LEFT JOIN LATERAL (
  SELECT close_price 
  FROM finapp.asset_prices 
  WHERE asset_id = p.asset_id 
  ORDER BY price_date DESC 
  LIMIT 1
) ap ON true
WHERE p.portfolio_id = 'f570f121-7de8-4ca1-a75d-223a045c18d9'
  AND p.is_active = true;

-- 2. 检查是否有其他投资组合
SELECT id, name, base_currency FROM finapp.portfolios;

-- 3. 检查是否有其他用户的持仓
SELECT 
  p.portfolio_id,
  COUNT(*) as position_count,
  SUM(p.total_cost)::numeric(20,2) as total_cost
FROM finapp.positions p
WHERE p.is_active = true
GROUP BY p.portfolio_id;
