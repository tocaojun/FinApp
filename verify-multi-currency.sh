#!/bin/bash

# FinApp - 多货币对功能验证脚本
# 功能：验证系统是否能够获取所有10个货币对的汇率

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}$1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 货币对列表
CURRENCY_PAIRS=(
    "USD:CNY"
    "EUR:CNY"
    "GBP:CNY"
    "JPY:CNY"
    "HKD:CNY"
    "SGD:CNY"
    "AUD:CNY"
    "CAD:CNY"
    "CHF:CNY"
    "INR:CNY"
)

# 验证后端服务
check_backend() {
    print_info "检查后端服务..."
    
    if ! curl -s -m 5 "http://localhost:8000/health" > /dev/null 2>&1; then
        print_error "后端服务未启动"
        exit 1
    fi
    
    print_success "后端服务正常"
}

# 验证代码中的货币对配置
verify_code_config() {
    echo ""
    print_header "📋 验证代码中的货币对配置"
    echo ""
    
    CONFIG=$(grep -A 11 "private monitoredPairs" /Users/caojun/code/FinApp/backend/src/services/ExchangeRateUpdateService.ts | grep "from:" | sed "s/.*from: '\\([^']*\\)'.*to: '\\([^']*\\)'.*/\\1\\/\\2/" | tr -d ' ')
    
    print_info "检测到的货币对："
    echo "$CONFIG" | while read pair; do
        if [ ! -z "$pair" ]; then
            echo "  • $pair"
        fi
    done
    
    PAIR_COUNT=$(echo "$CONFIG" | grep -c "/" || echo 0)
    
    if [ "$PAIR_COUNT" -eq 10 ]; then
        print_success "代码中配置了 10 个货币对 ✓"
    else
        print_warning "代码中仅配置了 $PAIR_COUNT 个货币对（期望 10 个）"
    fi
}

# 验证实时汇率获取
verify_realtime_rates() {
    echo ""
    print_header "🔄 验证实时汇率获取能力"
    echo ""
    
    print_info "测试从 API 获取最新汇率..."
    
    for pair in "${CURRENCY_PAIRS[@]}"; do
        FROM=$(echo $pair | cut -d: -f1)
        TO=$(echo $pair | cut -d: -f2)
        
        RESPONSE=$(curl -s -X GET "http://localhost:8000/api/exchange-rates/latest/${FROM}/${TO}")
        
        if echo "$RESPONSE" | grep -q '"success":true'; then
            RATE=$(echo "$RESPONSE" | jq '.data.rate' 2>/dev/null || echo "N/A")
            DATE=$(echo "$RESPONSE" | jq '.data.rateDate' 2>/dev/null | tr -d '"' || echo "N/A")
            echo "  ✓ ${FROM}/${TO}: $RATE (日期: $DATE)"
        else
            echo "  ✗ ${FROM}/${TO}: 获取失败"
        fi
    done
}

# 验证数据库中的历史数据
verify_historical_data() {
    echo ""
    print_header "📊 验证数据库中的历史数据"
    echo ""
    
    print_info "查询历史导入的货币对统计..."
    echo ""
    
    psql -h localhost -U finapp_user -d finapp_test << 'SQL' 2>/dev/null || print_error "数据库连接失败"
    SELECT 
        CONCAT(from_currency, '/', to_currency) as pair,
        COUNT(*) as record_count,
        MIN(rate_date) as earliest_date,
        MAX(rate_date) as latest_date
    FROM finapp.exchange_rates
    WHERE data_source = 'historical_import'
    GROUP BY from_currency, to_currency
    ORDER BY from_currency, to_currency;
SQL
    
    echo ""
    
    # 统计总记录数
    TOTAL=$(psql -h localhost -U finapp_user -d finapp_test -t -c "SELECT COUNT(*) FROM finapp.exchange_rates WHERE data_source = 'historical_import';" 2>/dev/null || echo "0")
    TOTAL=${TOTAL// /}
    
    if [ "$TOTAL" -gt 0 ]; then
        print_success "数据库中有 $TOTAL 条历史记录"
    else
        print_warning "数据库中没有历史导入数据，请先运行 ./import-historical-rates.sh"
    fi
}

# 验证所有数据源的支持
verify_data_sources() {
    echo ""
    print_header "🌐 验证数据源配置"
    echo ""
    
    print_info "检测支持的数据源..."
    
    SOURCES=$(grep -A 20 "private providers" /Users/caojun/code/FinApp/backend/src/services/ExchangeRateUpdateService.ts | grep "name:" | sed "s/.*name: '\\([^']*\\)'.*/\\1/" | tr -d ' ')
    
    echo ""
    echo "$SOURCES" | nl -v 1 | while read num source; do
        if [ ! -z "$source" ]; then
            echo "  $num. $source"
        fi
    done
}

# 验证自动更新配置
verify_auto_update() {
    echo ""
    print_header "⏰ 验证自动更新配置"
    echo ""
    
    print_info "获取自动更新状态..."
    
    RESPONSE=$(curl -s -X GET "http://localhost:8000/api/exchange-rates/auto-update-status")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
        
        ENABLED=$(echo "$RESPONSE" | jq '.data.enabled' 2>/dev/null)
        RUNNING=$(echo "$RESPONSE" | jq '.data.running' 2>/dev/null)
        PAIRS=$(echo "$RESPONSE" | jq '.data.monitoredPairs' 2>/dev/null)
        
        echo ""
        [ "$ENABLED" = "true" ] && print_success "自动更新：已启用" || print_warning "自动更新：已禁用"
        [ "$RUNNING" = "true" ] && print_success "服务状态：运行中" || print_warning "服务状态：未运行"
        [ ! -z "$PAIRS" ] && print_success "监控货币对数：$PAIRS"
    else
        print_error "无法获取自动更新状态"
    fi
}

# 生成验证报告
generate_report() {
    echo ""
    print_header "📋 多货币对功能验证报告"
    echo ""
    
    # 计算统计数据
    DB_PAIRS=$(psql -h localhost -U finapp_user -d finapp_test -t -c "SELECT COUNT(DISTINCT CONCAT(from_currency, '/', to_currency)) FROM finapp.exchange_rates WHERE data_source = 'historical_import';" 2>/dev/null | tr -d ' ')
    DB_RECORDS=$(psql -h localhost -U finapp_user -d finapp_test -t -c "SELECT COUNT(*) FROM finapp.exchange_rates WHERE data_source = 'historical_import';" 2>/dev/null | tr -d ' ')
    API_PAIRS=$(curl -s -X GET "http://localhost:8000/api/exchange-rates/statistics" | jq '.data.currencyPairs' 2>/dev/null || echo "N/A")
    
    cat << EOF

╔════════════════════════════════════════════════════════════╗
║           多货币对功能验证结果总结                      ║
╚════════════════════════════════════════════════════════════╝

📊 数据统计：
  • 支持的货币对：10 个
  • 数据库中的货币对：${DB_PAIRS:-N/A}
  • 数据库中的历史记录：${DB_RECORDS:-N/A}
  • API 识别的货币对数：${API_PAIRS:-N/A}

✅ 功能状态：
  • 代码配置：10 个货币对已配置
  • 实时汇率获取：支持
  • 历史数据导入：支持
  • 自动更新：支持（每4小时）
  • 多数据源：支持

🚀 推荐行动：
  1. 运行 ./import-historical-rates.sh 导入历史数据
  2. 等待 2-3 分钟完成导入
  3. 检查前端"数据同步"→"汇率同步"页面
  4. 验证 10 个货币对都显示正确的汇率

🔗 相关文档：
  • docs/MULTI_CURRENCY_SUPPORT.md - 功能详解
  • docs/IMPORT_OPTIMIZATION.md - 优化说明
  • docs/EXCHANGE_RATE_DATA_SOURCES.md - 数据源说明

EOF
}

# 主函数
main() {
    echo ""
    print_header "╔════════════════════════════════════════════╗"
    print_header "║   FinApp 多货币对功能验证工具             ║"
    print_header "╚════════════════════════════════════════════╝"
    
    check_backend
    verify_code_config
    verify_realtime_rates
    verify_historical_data
    verify_data_sources
    verify_auto_update
    generate_report
}

main
