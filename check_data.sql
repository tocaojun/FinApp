-- 检查交易账户
SELECT ta.id, ta.portfolio_id, ta.name, p.name as portfolio_name 
FROM finapp.trading_accounts ta
LEFT JOIN finapp.portfolios p ON ta.portfolio_id = p.id
ORDER BY p.name, ta.name;

-- 检查持仓
SELECT pos.id, pos.portfolio_id, pos.asset_id, a.symbol, a.name, p.name as portfolio_name
FROM finapp.positions pos
LEFT JOIN finapp.assets a ON pos.asset_id = a.id
LEFT JOIN finapp.portfolios p ON pos.portfolio_id = p.id
WHERE pos.is_active = true
ORDER BY p.name, a.symbol;
