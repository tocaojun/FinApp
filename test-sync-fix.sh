#!/bin/bash

# 价格同步修复验证脚本

echo "=========================================="
echo "价格同步修复验证"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查后端服务
echo "1. 检查后端服务状态..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务运行正常${NC}"
else
    echo -e "${RED}❌ 后端服务未运行${NC}"
    exit 1
fi
echo ""

# 2. 检查数据库连接
echo "2. 检查数据库连接..."
if psql -d finapp_test -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 数据库连接正常${NC}"
else
    echo -e "${RED}❌ 数据库连接失败${NC}"
    exit 1
fi
echo ""

# 3. 清理卡住的任务
echo "3. 清理卡住的任务..."
UPDATED=$(psql -d finapp_test -t -c "
UPDATE finapp.price_sync_logs 
SET status = 'failed', 
    completed_at = CURRENT_TIMESTAMP,
    error_message = '测试前清理'
WHERE status = 'running'
RETURNING id;
" | wc -l | tr -d ' ')

if [ "$UPDATED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  已清理 $UPDATED 个卡住的任务${NC}"
else
    echo -e "${GREEN}✅ 没有卡住的任务${NC}"
fi
echo ""

# 4. 检查错误表结构
echo "4. 验证错误表结构..."
HAS_PRICE_DATE=$(psql -d finapp_test -t -c "
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_schema = 'finapp' 
  AND table_name = 'price_sync_errors' 
  AND column_name = 'price_date';
" | tr -d ' ')

if [ "$HAS_PRICE_DATE" -eq 0 ]; then
    echo -e "${GREEN}✅ 错误表结构正确（无price_date字段）${NC}"
else
    echo -e "${RED}❌ 错误表结构异常（存在price_date字段）${NC}"
fi

HAS_ERROR_DETAILS=$(psql -d finapp_test -t -c "
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_schema = 'finapp' 
  AND table_name = 'price_sync_errors' 
  AND column_name = 'error_details';
" | tr -d ' ')

if [ "$HAS_ERROR_DETAILS" -eq 1 ]; then
    echo -e "${GREEN}✅ 错误表有error_details字段${NC}"
else
    echo -e "${RED}❌ 错误表缺少error_details字段${NC}"
fi
echo ""

# 5. 检查同步任务配置
echo "5. 检查同步任务配置..."
TASK_COUNT=$(psql -d finapp_test -t -c "
SELECT COUNT(*) FROM finapp.price_sync_tasks;
" | tr -d ' ')

echo "   总任务数: $TASK_COUNT"

if [ "$TASK_COUNT" -gt 0 ]; then
    echo "   任务详情:"
    psql -d finapp_test -c "
    SELECT 
      name,
      is_active,
      schedule_type,
      array_length(asset_ids, 1) as asset_count
    FROM finapp.price_sync_tasks
    ORDER BY created_at DESC
    LIMIT 3;
    "
fi
echo ""

# 6. 检查资产配置
echo "6. 检查资产配置..."
ASSET_COUNT=$(psql -d finapp_test -t -c "
SELECT COUNT(*) FROM finapp.assets WHERE is_active = true;
" | tr -d ' ')

echo "   活跃资产数: $ASSET_COUNT"

if [ "$ASSET_COUNT" -gt 0 ]; then
    echo "   示例资产:"
    psql -d finapp_test -c "
    SELECT 
      a.symbol,
      a.name,
      m.code as market
    FROM finapp.assets a
    LEFT JOIN finapp.markets m ON a.market_id = m.id
    WHERE a.is_active = true
    LIMIT 5;
    "
fi
echo ""

# 7. 查看最近的同步日志
echo "7. 查看最近的同步日志..."
psql -d finapp_test -c "
SELECT 
  psl.started_at,
  pst.name as task_name,
  psl.status,
  psl.total_assets,
  psl.success_count,
  psl.failed_count
FROM finapp.price_sync_logs psl
JOIN finapp.price_sync_tasks pst ON psl.task_id = pst.id
ORDER BY psl.started_at DESC
LIMIT 5;
"
echo ""

# 8. 查看错误记录
echo "8. 查看最近的错误记录..."
ERROR_COUNT=$(psql -d finapp_test -t -c "
SELECT COUNT(*) FROM finapp.price_sync_errors;
" | tr -d ' ')

echo "   总错误数: $ERROR_COUNT"

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "   最近错误:"
    psql -d finapp_test -c "
    SELECT 
      asset_symbol,
      error_type,
      LEFT(error_message, 50) as error_msg,
      occurred_at
    FROM finapp.price_sync_errors
    ORDER BY occurred_at DESC
    LIMIT 5;
    "
fi
echo ""

# 9. 后端日志检查
echo "9. 检查后端日志（最近的PriceSync日志）..."
if [ -f /tmp/finapp-backend.log ]; then
    echo "   最近10条PriceSync日志:"
    grep -i "PriceSync" /tmp/finapp-backend.log | tail -10 || echo "   暂无PriceSync日志"
else
    echo -e "${YELLOW}⚠️  后端日志文件不存在${NC}"
fi
echo ""

# 总结
echo "=========================================="
echo "验证完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 访问 http://localhost:3001"
echo "2. 登录系统（testapi@finapp.com / testapi123）"
echo "3. 进入 价格管理中心 → API自动同步"
echo "4. 执行一个同步任务"
echo "5. 观察后端日志: tail -f /tmp/finapp-backend.log | grep PriceSync"
echo ""
