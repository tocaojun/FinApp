#!/bin/bash
# 验证富途同步修复是否生效

echo "=========================================="
echo "富途同步修复验证脚本"
echo "=========================================="
echo ""

# 1. 清空现有同步日志（可选）
echo "1. 查看修复前的同步日志..."
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT 
  l.id, 
  l.status, 
  l.total_assets, 
  l.total_records, 
  l.success_count,
  l.started_at,
  t.name as task_name
FROM finapp.price_sync_logs l
LEFT JOIN finapp.price_sync_tasks t ON l.task_id = t.id
WHERE t.name LIKE '%香港%'
ORDER BY l.started_at DESC
LIMIT 5;
" 2>&1

echo ""
echo "2. 检查当前香港股票价格数据（修复前）..."
psql -h localhost -U finapp_user -d finapp_test -c "
SELECT 
  a.symbol, 
  a.name, 
  COUNT(*) as price_count,
  MAX(ap.price_date) as latest_date,
  ap.price_source
FROM finapp.asset_prices ap
JOIN finapp.assets a ON ap.asset_id = a.id
WHERE a.symbol IN ('00700', '03690', '06186', '09618')
GROUP BY a.symbol, a.name, ap.price_source
ORDER BY a.symbol, ap.price_source;
" 2>&1

echo ""
echo "=========================================="
echo "修复已应用！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 确保后端服务已重启（bash restart-backend.sh）"
echo "2. 在前端执行一次香港股票同步"
echo "3. 检查同步日志中的 total_records 是否不再为 0"
echo ""
echo "预期结果："
echo "- total_records: 应该显示实际同步的记录数（例如 30）"
echo "- success_count: 应该等于 total_records"
echo "- 同步日志详情中应有价格数据"
echo ""
