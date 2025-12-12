-- 快速验证富途同步修复效果
-- 执行方式：psql -h localhost -U finapp_user -d finapp_test -f scripts/check-sync-fix.sql

\echo '=========================================='
\echo '富途同步修复验证'
\echo '=========================================='
\echo ''

\echo '1. 检查最近 3 次香港股票同步日志:'
\echo '------------------------------------------'
SELECT 
  to_char(l.started_at, 'YYYY-MM-DD HH24:MI:SS') as sync_time,
  l.status,
  l.total_assets,
  l.total_records,
  l.success_count,
  l.failed_count,
  CASE 
    WHEN l.total_records = 0 THEN '❌ 需要修复'
    WHEN l.total_records > 0 THEN '✅ 正常'
    ELSE '⚠️  未知'
  END as fix_status
FROM finapp.price_sync_logs l
LEFT JOIN finapp.price_sync_tasks t ON l.task_id = t.id
WHERE t.name LIKE '%香港%'
ORDER BY l.started_at DESC
LIMIT 3;

\echo ''
\echo '2. 检查香港股票的价格数据统计:'
\echo '------------------------------------------'
SELECT 
  a.symbol,
  a.name,
  ap.price_source,
  COUNT(*) as total_prices,
  MIN(ap.price_date) as earliest_date,
  MAX(ap.price_date) as latest_date
FROM finapp.asset_prices ap
JOIN finapp.assets a ON ap.asset_id = a.id
WHERE a.symbol IN ('00700', '03690', '06186', '09618')
GROUP BY a.symbol, a.name, ap.price_source
ORDER BY a.symbol, ap.price_source;

\echo ''
\echo '3. 检查今天是否有新的同步记录:'
\echo '------------------------------------------'
SELECT 
  a.symbol,
  a.name,
  COUNT(*) as records_today,
  MAX(ap.price_date) as latest_date
FROM finapp.asset_prices ap
JOIN finapp.assets a ON ap.asset_id = a.id
WHERE a.symbol IN ('00700', '03690', '06186', '09618')
  AND ap.price_source = 'FUTU_API'
  AND ap.price_date >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY a.symbol, a.name
ORDER BY a.symbol;

\echo ''
\echo '=========================================='
\echo '验证完成'
\echo '=========================================='
\echo ''
\echo '如果看到:'
\echo '  - total_records > 0  → ✅ 修复成功'
\echo '  - total_records = 0  → ❌ 需要重启后端'
\echo ''
