#!/bin/bash
# FinApp Database Verification Script
# Usage: ./scripts/db-verify.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 数据库连接配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-finapp_test}
DB_USER=${DB_USER:-finapp_user}

echo -e "${BLUE}🔍 验证FinApp数据库架构和数据...${NC}"
echo

# 检查数据库连接
echo -e "${YELLOW}📊 检查数据库连接:${NC}"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 数据库连接正常${NC}"
else
    echo -e "${RED}❌ 数据库连接失败${NC}"
    exit 1
fi

# 检查表结构
echo -e "${YELLOW}🗄️ 检查表结构:${NC}"
EXPECTED_TABLES=(
    "users" "roles" "permissions" "role_permissions" "user_roles" "user_sessions"
    "email_verification_tokens" "password_reset_tokens" "audit_logs"
    "portfolios" "trading_accounts" "positions" "transactions" "cash_flows"
    "assets" "asset_types" "markets" "asset_prices" "exchange_rates"
    "benchmarks" "benchmark_prices" "liquidity_tags" "option_details"
    "performance_metrics" "portfolio_snapshots" "position_snapshots"
    "reports" "report_executions"
)

MISSING_TABLES=()
for table in "${EXPECTED_TABLES[@]}"; do
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt finapp.$table" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 表 $table 存在${NC}"
    else
        echo -e "${RED}❌ 表 $table 不存在${NC}"
        MISSING_TABLES+=($table)
    fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo -e "${RED}❌ 缺少 ${#MISSING_TABLES[@]} 个表，请检查数据库迁移${NC}"
    exit 1
fi

# 检查索引
echo -e "${YELLOW}📈 检查关键索引:${NC}"
CRITICAL_INDEXES=(
    "users_email_key"
    "portfolios_user_id_name_key"
    "positions_portfolio_id_trading_account_id_asset_id_key"
    "exchange_rates_from_currency_to_currency_rate_date_key"
    "asset_prices_asset_id_price_date_key"
)

for index in "${CRITICAL_INDEXES[@]}"; do
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT indexname FROM pg_indexes WHERE indexname = '$index';" | grep -q $index; then
        echo -e "${GREEN}✅ 索引 $index 存在${NC}"
    else
        echo -e "${YELLOW}⚠️ 索引 $index 不存在${NC}"
    fi
done

# 检查数据完整性
echo -e "${YELLOW}🔍 检查数据完整性:${NC}"

# 检查基础配置数据
ROLES_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM roles;")
ASSET_TYPES_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM asset_types;")
MARKETS_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM markets;")

echo -e "${GREEN}✅ 角色数量: $ROLES_COUNT${NC}"
echo -e "${GREEN}✅ 资产类型数量: $ASSET_TYPES_COUNT${NC}"
echo -e "${GREEN}✅ 市场数量: $MARKETS_COUNT${NC}"

# 检查测试数据
USERS_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;")
PORTFOLIOS_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM portfolios;")
ASSETS_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM assets;")
POSITIONS_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM positions;")

echo -e "${GREEN}✅ 测试用户数量: $USERS_COUNT${NC}"
echo -e "${GREEN}✅ 投资组合数量: $PORTFOLIOS_COUNT${NC}"
echo -e "${GREEN}✅ 资产数量: $ASSETS_COUNT${NC}"
echo -e "${GREEN}✅ 持仓数量: $POSITIONS_COUNT${NC}"

# 检查外键约束
echo -e "${YELLOW}🔗 检查外键约束:${NC}"
FK_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'finapp';")

echo -e "${GREEN}✅ 外键约束数量: $FK_COUNT${NC}"

# 检查触发器
echo -e "${YELLOW}⚡ 检查触发器:${NC}"
TRIGGER_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM information_schema.triggers 
WHERE trigger_schema = 'finapp';")

echo -e "${GREEN}✅ 触发器数量: $TRIGGER_COUNT${NC}"

# 性能检查
echo -e "${YELLOW}⚡ 性能检查:${NC}"

# 检查查询性能（示例查询）
echo -e "${BLUE}测试查询性能...${NC}"
QUERY_TIME=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
\timing on
SELECT 
    u.username,
    p.name as portfolio_name,
    COUNT(pos.id) as position_count,
    SUM(pos.total_cost) as total_investment
FROM users u
JOIN portfolios p ON u.id = p.user_id
LEFT JOIN positions pos ON p.id = pos.portfolio_id
WHERE u.is_active = true
GROUP BY u.id, u.username, p.id, p.name
ORDER BY total_investment DESC;
" 2>&1 | grep "Time:" | tail -1)

echo -e "${GREEN}✅ 查询执行时间: $QUERY_TIME${NC}"

# 数据库大小检查
echo -e "${YELLOW}💾 数据库大小:${NC}"
DB_SIZE=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")

echo -e "${GREEN}✅ 数据库大小: $DB_SIZE${NC}"

# 生成数据库报告
echo -e "${YELLOW}📋 生成数据库报告:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'finapp' 
AND tablename IN ('users', 'portfolios', 'positions', 'transactions')
ORDER BY schemaname, tablename, attname;
" > /tmp/finapp_db_stats.txt

echo -e "${GREEN}✅ 数据库统计信息已保存到 /tmp/finapp_db_stats.txt${NC}"

echo
echo -e "${GREEN}🎉 数据库验证完成！${NC}"
echo -e "${BLUE}💡 提示：${NC}"
echo -e "   - 定期运行此脚本检查数据库健康状况"
echo -e "   - 监控查询性能和数据库大小"
echo -e "   - 及时更新统计信息: ANALYZE;"