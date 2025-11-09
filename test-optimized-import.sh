#!/bin/bash

# FinApp - 优化后的汇率导入测试脚本
# 功能：测试优化后的导入性能

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

API_BASE_URL="http://localhost:8000/api"

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${CYAN}$1${NC}"
}

# 检查后端
check_backend() {
    if ! curl -s -m 5 "http://localhost:8000/health" > /dev/null 2>&1; then
        print_error "后端服务未启动"
        exit 1
    fi
    print_success "后端服务正常"
}

# 清空历史导入数据
clear_historical() {
    print_info "清空之前的历史导入数据..."
    psql -h localhost -U finapp_user -d finapp_test << EOF
DELETE FROM finapp.exchange_rates WHERE data_source = 'historical_import';
EOF
    print_success "历史数据已清空"
}

# 记录开始时间
record_start() {
    START_TIME=$(date +%s)
    print_info "开始时间：$(date '+%Y-%m-%d %H:%M:%S')"
}

# 记录结束时间
record_end() {
    END_TIME=$(date +%s)
    ELAPSED=$((END_TIME - START_TIME))
    MINUTES=$((ELAPSED / 60))
    SECONDS=$((ELAPSED % 60))
    
    echo ""
    print_success "完成时间：$(date '+%Y-%m-%d %H:%M:%S')"
    print_info "总耗时：${MINUTES}分${SECONDS}秒"
}

# 启动导入
start_import() {
    print_info "发起导入请求..."
    
    RESPONSE=$(curl -s -X POST "$API_BASE_URL/exchange-rates/import-historical" \
        -H "Content-Type: application/json" \
        -d '{"years": 10}')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "导入请求已提交"
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    else
        print_error "导入请求失败"
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
        exit 1
    fi
}

# 监控导入进度
monitor_import() {
    print_info "监控导入进度..."
    echo ""
    
    local last_count=0
    local last_update=$(date +%s)
    
    while true; do
        # 查询当前导入的数据量
        CURRENT=$(psql -h localhost -U finapp_user -d finapp_test -t -c \
            "SELECT COUNT(*) FROM finapp.exchange_rates WHERE data_source = 'historical_import';" 2>/dev/null || echo "0")
        
        CURRENT=${CURRENT// /}  # 去掉空格
        
        CURRENT_UPDATE=$(date +%s)
        DELTA=$((CURRENT_UPDATE - last_update))
        
        if [ "$DELTA" -ge 10 ]; then
            RATE=$((CURRENT - last_count))
            print_info "当前记录数：$CURRENT，速率：$RATE 条/10秒"
            last_count=$CURRENT
            last_update=$CURRENT_UPDATE
        fi
        
        # 检查导入是否完成（通过查看后端日志）
        if grep -q "Optimized historical import completed" /Users/caojun/code/FinApp/logs/backend.log 2>/dev/null; then
            print_success "导入已完成"
            break
        fi
        
        sleep 5
    done
}

# 验证导入结果
verify_import() {
    echo ""
    print_header "📊 导入结果验证"
    echo ""
    
    # 获取统计数据
    STATS=$(psql -h localhost -U finapp_user -d finapp_test -t << EOF
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT CONCAT(from_currency, '/', to_currency)) as unique_pairs,
    COUNT(DISTINCT from_currency) as base_currencies,
    MIN(rate_date) as earliest_date,
    MAX(rate_date) as latest_date
FROM finapp.exchange_rates
WHERE data_source = 'historical_import';
EOF
)
    
    echo "$STATS" | while read line; do
        if [ ! -z "$line" ]; then
            print_info "统计结果：$line"
        fi
    done
    
    echo ""
    print_info "按货币对统计："
    psql -h localhost -U finapp_user -d finapp_test << EOF
SELECT 
    CONCAT(from_currency, '/', to_currency) as pair,
    COUNT(*) as count,
    MIN(rate_date) as earliest_date,
    MAX(rate_date) as latest_date
FROM finapp.exchange_rates
WHERE data_source = 'historical_import'
GROUP BY from_currency, to_currency
ORDER BY from_currency, to_currency;
EOF
}

# 主函数
main() {
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║   FinApp 优化后的汇率导入性能测试        ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    
    check_backend
    echo ""
    
    print_warning "此测试将："
    echo "  1. 清空之前的历史导入数据"
    echo "  2. 发起新的优化后的导入请求"
    echo "  3. 监控导入进度（实时显示速率）"
    echo "  4. 验证最终结果"
    echo ""
    
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "测试已取消"
        exit 0
    fi
    
    echo ""
    
    # 执行测试
    clear_historical
    echo ""
    record_start
    echo ""
    start_import
    echo ""
    monitor_import
    record_end
    echo ""
    verify_import
    
    echo ""
    print_success "性能测试完成！"
    print_info "💡 提示：查看详细的导入日志"
    echo "   tail -f logs/backend.log | grep -i 'import\\|batch'"
    echo ""
}

main
