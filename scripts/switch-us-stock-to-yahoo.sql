-- 切换美股同步到 Yahoo Finance
-- 解决富途美股权限不足的问题

\echo '=========================================='
\echo '切换美股同步数据源到 Yahoo Finance'
\echo '=========================================='
\echo ''

-- 1. 查看当前配置
\echo '1. 当前美股同步任务配置:'
\echo '------------------------------------------'
SELECT 
  t.name,
  ds.name as data_source,
  ds.provider,
  ds.is_active as source_active,
  t.is_active as task_active,
  t.last_run_status
FROM finapp.price_sync_tasks t
LEFT JOIN finapp.price_data_sources ds ON t.data_source_id = ds.id
WHERE t.name LIKE '%美国%' OR t.name LIKE '%US%';

\echo ''
\echo '2. 执行切换到 Yahoo Finance:'
\echo '------------------------------------------'

-- 更新美股同步任务的数据源
UPDATE finapp.price_sync_tasks 
SET data_source_id = (
  SELECT id FROM finapp.price_data_sources 
  WHERE provider = 'yahoo_finance' 
  LIMIT 1
)
WHERE name = '美国股票价格同步';

\echo '✅ 数据源已切换到 Yahoo Finance'
\echo ''

-- 3. 验证切换结果
\echo '3. 切换后配置:'
\echo '------------------------------------------'
SELECT 
  t.name,
  ds.name as data_source,
  ds.provider,
  ds.is_active as source_active,
  t.is_active as task_active
FROM finapp.price_sync_tasks t
LEFT JOIN finapp.price_data_sources ds ON t.data_source_id = ds.id
WHERE t.name LIKE '%美国%';

\echo ''
\echo '=========================================='
\echo '切换完成'
\echo '=========================================='
\echo ''
\echo '下一步:'
\echo '1. 在前端重新执行"美国股票价格同步"'
\echo '2. 查看同步日志是否成功'
\echo ''
\echo '注意:'
\echo '- Yahoo Finance 是免费的，但可能有速率限制'
\echo '- 如果仍然失败，可能需要配置 User-Agent'
\echo '- 或者开通富途美股行情权限后切换回富途'
\echo ''
