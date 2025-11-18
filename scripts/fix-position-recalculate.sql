-- 修复持仓数据 - 基于交易记录重新计算
-- 适用于：批量导入后持仓数据不正确的情况

-- 第一步：查看当前问题持仓
SELECT 
  p.id as position_id,
  p.portfolio_id,
  p.trading_account_id,
  p.asset_id,
  p.quantity as current_quantity,
  p.average_cost,
  p.is_active,
  a.symbol,
  a.name as asset_name
FROM finapp.positions p
JOIN finapp.assets a ON p.asset_id = a.id
WHERE a.name LIKE '%高腾微金美元货币%';

-- 第二步：查看交易汇总（验证正确的数量）
SELECT 
  t.portfolio_id,
  t.trading_account_id,
  t.asset_id,
  a.name,
  SUM(CASE WHEN t.side = 'BUY' THEN t.quantity ELSE 0 END) as total_buy,
  SUM(CASE WHEN t.side = 'SELL' THEN t.quantity ELSE 0 END) as total_sell,
  SUM(CASE WHEN t.side = 'BUY' THEN t.quantity ELSE -t.quantity END) as net_quantity,
  -- 计算加权平均成本（仅基于买入交易）
  CASE 
    WHEN SUM(CASE WHEN t.side = 'BUY' THEN t.quantity ELSE 0 END) > 0 THEN
      SUM(CASE WHEN t.side = 'BUY' THEN t.quantity * t.price ELSE 0 END) / 
      SUM(CASE WHEN t.side = 'BUY' THEN t.quantity ELSE 0 END)
    ELSE 0 
  END as average_cost,
  MIN(CASE WHEN t.side = 'BUY' THEN t.transaction_date END) as first_purchase_date,
  MAX(t.transaction_date) as last_transaction_date,
  a.currency
FROM finapp.transactions t
JOIN finapp.assets a ON t.asset_id = a.id
WHERE a.name LIKE '%高腾微金美元货币%'
  AND t.status = 'EXECUTED'
GROUP BY t.portfolio_id, t.trading_account_id, t.asset_id, a.name, a.currency;

-- 第三步：更新持仓数据（基于交易记录重新计算）
-- 注意：这会直接修改数据库，请先备份！

UPDATE finapp.positions p
SET 
  quantity = calc.net_quantity,
  average_cost = calc.average_cost,
  total_cost = calc.net_quantity * calc.average_cost,
  first_purchase_date = calc.first_purchase_date,
  last_transaction_date = calc.last_transaction_date,
  currency = calc.currency,
  -- 注意：不要修改 is_active 状态！负数持仓（已卖出）也应该保持活跃状态
  -- is_active = (calc.net_quantity > 0),  -- ❌ 这会隐藏所有负数持仓
  updated_at = NOW()
FROM (
  SELECT 
    t.portfolio_id,
    t.trading_account_id,
    t.asset_id,
    SUM(CASE WHEN t.side = 'BUY' THEN t.quantity ELSE -t.quantity END) as net_quantity,
    CASE 
      WHEN SUM(CASE WHEN t.side = 'BUY' THEN t.quantity ELSE 0 END) > 0 THEN
        SUM(CASE WHEN t.side = 'BUY' THEN t.quantity * t.price ELSE 0 END) / 
        SUM(CASE WHEN t.side = 'BUY' THEN t.quantity ELSE 0 END)
      ELSE 0 
    END as average_cost,
    MIN(CASE WHEN t.side = 'BUY' THEN t.transaction_date END) as first_purchase_date,
    MAX(t.transaction_date) as last_transaction_date,
    a.currency
  FROM finapp.transactions t
  JOIN finapp.assets a ON t.asset_id = a.id
  WHERE t.status = 'EXECUTED'
  GROUP BY t.portfolio_id, t.trading_account_id, t.asset_id, a.currency
) calc
WHERE p.portfolio_id = calc.portfolio_id
  AND p.trading_account_id = calc.trading_account_id
  AND p.asset_id = calc.asset_id;

-- 第四步：验证修复结果
SELECT 
  p.id as position_id,
  p.quantity,
  p.average_cost,
  p.total_cost,
  p.is_active,
  p.first_purchase_date,
  p.last_transaction_date,
  a.symbol,
  a.name as asset_name
FROM finapp.positions p
JOIN finapp.assets a ON p.asset_id = a.id
WHERE a.name LIKE '%高腾微金美元货币%';

-- 第五步：查看交易明细（用于对账）
SELECT 
  t.transaction_date,
  t.transaction_type,
  t.side,
  t.quantity,
  t.price,
  t.total_amount,
  a.name
FROM finapp.transactions t
JOIN finapp.assets a ON t.asset_id = a.id
WHERE a.name LIKE '%高腾微金美元货币%'
ORDER BY t.transaction_date ASC, t.executed_at ASC;
