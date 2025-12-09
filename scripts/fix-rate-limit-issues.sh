#!/bin/bash
# 修复Yahoo Finance API限流问题

echo "🔧 修复API限流问题..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 检查当前同步任务的频率
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 1. 当前同步任务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d finapp_production -c "
    SELECT 
        id,
        name,
        is_active,
        sync_interval_minutes,
        TO_CHAR(last_run_at, 'YYYY-MM-DD HH24:MI:SS') as last_run,
        TO_CHAR(next_run_at, 'YYYY-MM-DD HH24:MI:SS') as next_run
    FROM finapp.price_sync_tasks
    ORDER BY is_active DESC, name
" 2>/dev/null || echo "表结构可能不同，尝试基础查询..."

echo ""

# 2. 建议的修复策略
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 2. 推荐的修复策略"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "针对Yahoo Finance API限流问题，建议采取以下措施："
echo ""
echo "策略1️⃣：降低同步频率"
echo "  - 当前可能每几分钟同步一次"
echo "  - 建议改为每30-60分钟同步一次"
echo "  - 或者每天只在交易时间同步2-3次"
echo ""
echo "策略2️⃣：切换到其他数据源"
echo "  - 优先使用天天基金（中国基金数据）"
echo "  - 使用新浪财经（中国股票数据）"
echo "  - 使用东方财富"
echo "  - Yahoo Finance作为备选"
echo ""
echo "策略3️⃣：添加请求延迟"
echo "  - 在请求之间添加1-2秒延迟"
echo "  - 避免短时间内大量请求"
echo ""
echo "策略4️⃣：批量处理优化"
echo "  - 将资产分批处理"
echo "  - 每批处理10-20个资产后等待"
echo ""

# 3. 检查数据源优先级配置
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 3. 当前数据源配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d finapp_production -c "
    SELECT 
        name,
        provider,
        is_active,
        rate_limit_per_minute,
        rate_limit_per_day
    FROM finapp.price_data_sources
    WHERE is_active = true
    ORDER BY name
" 2>/dev/null || echo "字段可能不存在"

echo ""

# 4. 提供SQL修复脚本
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛠️  4. 快速修复SQL（可选执行）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "方案A：临时禁用Yahoo Finance数据源（推荐）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'SQL'
sudo -u postgres psql -d finapp_production << EOF
-- 禁用Yahoo Finance数据源
UPDATE finapp.price_data_sources 
SET is_active = false 
WHERE provider = 'yahoo';

-- 查看结果
SELECT name, provider, is_active FROM finapp.price_data_sources;
EOF
SQL

echo ""
echo "方案B：降低同步频率到每小时一次"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'SQL'
sudo -u postgres psql -d finapp_production << EOF
-- 将同步间隔改为60分钟
UPDATE finapp.price_sync_tasks 
SET sync_interval_minutes = 60 
WHERE sync_interval_minutes < 60;

-- 查看结果
SELECT name, sync_interval_minutes FROM finapp.price_sync_tasks;
EOF
SQL

echo ""
echo "方案C：暂停所有自动同步任务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'SQL'
sudo -u postgres psql -d finapp_production << EOF
-- 暂停所有自动任务
UPDATE finapp.price_sync_tasks 
SET is_active = false;

-- 查看结果
SELECT name, is_active FROM finapp.price_sync_tasks;
EOF
SQL

echo ""

# 5. 代码层面的优化建议
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💻 5. 代码优化建议"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "需要在后端代码中添加以下优化："
echo ""
echo "1. 请求限流器（Rate Limiter）"
echo "   - 限制每分钟最多请求N次Yahoo Finance"
echo "   - 使用队列管理请求"
echo ""
echo "2. 重试机制（Retry with Backoff）"
echo "   - 遇到429错误时，等待更长时间后重试"
echo "   - 使用指数退避算法"
echo ""
echo "3. 智能数据源切换"
echo "   - 检测到限流时自动切换数据源"
echo "   - Yahoo失败 -> 新浪 -> 东方财富"
echo ""
echo "4. 缓存机制"
echo "   - 对最近获取的价格数据进行缓存"
echo "   - 避免短时间内重复请求"
echo ""

# 6. 执行建议
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 6. 立即执行建议"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}推荐立即执行：${NC}"
echo "1. 临时禁用Yahoo Finance数据源（方案A）"
echo "2. 等待24小时让限流解除"
echo "3. 重新启用但降低频率"
echo ""
echo -e "${BLUE}执行命令：${NC}"
echo "sudo -u postgres psql -d finapp_production -c \"UPDATE finapp.price_data_sources SET is_active = false WHERE provider = 'yahoo'\""
echo ""
echo -e "${GREEN}验证：${NC}"
echo "sudo -u postgres psql -d finapp_production -c \"SELECT name, provider, is_active FROM finapp.price_data_sources\""
echo ""
