-- 恢复持仓的 is_active 状态
-- 问题：修复脚本错误地将负数持仓标记为 is_active = false
-- 解决：将所有持仓的 is_active 改回 true（因为这些都是有效的历史持仓）

-- 查看当前状态
SELECT 
  is_active, 
  COUNT(*) as count,
  SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) as positive_qty,
  SUM(CASE WHEN quantity < 0 THEN 1 ELSE 0 END) as negative_qty,
  SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as zero_qty
FROM finapp.positions
GROUP BY is_active;

-- 恢复所有持仓为活跃状态
UPDATE finapp.positions
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false;

-- 验证恢复结果
SELECT 
  is_active, 
  COUNT(*) as count
FROM finapp.positions
GROUP BY is_active;

-- 查看恢复后的持仓列表
SELECT 
  p.id,
  a.name,
  p.quantity,
  p.is_active,
  po.name as portfolio_name
FROM finapp.positions p
JOIN finapp.assets a ON p.asset_id = a.id
JOIN finapp.portfolios po ON p.portfolio_id = po.id
ORDER BY po.name, a.name
LIMIT 30;
