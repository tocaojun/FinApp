#!/bin/bash

# FinApp - 汇率历史数据导入脚本
# 功能：批量导入过去10年跟踪货币对的汇率历史数据作为铺底数据
# 使用方法：./import-historical-rates.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_BASE_URL="http://localhost:8000/api"
YEARS=10
MAX_RETRIES=3
RETRY_DELAY=5

# 函数：打印带颜色的消息
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

# 函数：检查后端服务是否运行
check_backend() {
    print_info "检查后端服务状态..."
    
    if ! curl -s -m 5 "http://localhost:8000/health" > /dev/null 2>&1; then
        print_error "后端服务未启动或无法访问"
        print_info "请先启动后端服务："
        echo "  cd backend && npm run dev"
        exit 1
    fi
    
    print_success "后端服务运行正常"
}

# 函数：获取自动更新状态
get_status() {
    print_info "获取自动更新状态..."
    
    local status_response=$(curl -s -X GET "$API_BASE_URL/exchange-rates/auto-update-status")
    echo "$status_response"
}

# 函数：导入历史数据（异步方式）
import_historical_async() {
    local years=$1
    
    print_info "开始导入过去 $years 年的汇率历史数据..."
    print_info "当前监控的货币对数：10 个"
    print_info "预计导入记录数：约 $(($years * 365 * 10)) 条"
    echo ""
    print_warning "这个过程将耗时 10-30 分钟，请耐心等待..."
    echo ""
    
    local attempt=1
    while [ $attempt -le $MAX_RETRIES ]; do
        print_info "尝试导入 (第 $attempt/$MAX_RETRIES 次)..."
        
        local response=$(curl -s -X POST "$API_BASE_URL/exchange-rates/import-historical" \
            -H "Content-Type: application/json" \
            -d "{\"years\": $years}")
        
        # 检查响应是否成功
        if echo "$response" | grep -q '"success":true'; then
            print_success "导入请求已提交到后台"
            echo ""
            print_info "返回信息："
            echo "$response" | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4
            return 0
        fi
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            print_warning "导入请求失败，$RETRY_DELAY 秒后重试..."
            sleep $RETRY_DELAY
        fi
        
        attempt=$((attempt + 1))
    done
    
    print_error "导入请求失败（已重试 $MAX_RETRIES 次）"
    return 1
}

# 函数：定期检查导入进度
monitor_import() {
    print_info "监控导入进度..."
    echo ""
    
    # 由于是异步导入，这里显示监控提示
    cat << 'EOF'
📊 监控导入进度的方法：

1. 查看后端日志（实时监控）：
   tail -f backend/logs/app.log | grep -i "historical"

2. 通过数据库查询统计数据：
   psql -h localhost -U finapp_user -d finapp_test
   
   # 统计汇率记录数
   SELECT COUNT(*) as total_rates FROM finapp.exchange_rates;
   
   # 按数据源统计
   SELECT data_source, COUNT(*) 
   FROM finapp.exchange_rates 
   GROUP BY data_source;
   
   # 按货币对统计
   SELECT 
     CONCAT(from_currency, '/', to_currency) as pair,
     COUNT(*) as count,
     MIN(rate_date) as earliest_date,
     MAX(rate_date) as latest_date
   FROM finapp.exchange_rates
   WHERE data_source = 'historical_import'
   GROUP BY from_currency, to_currency
   ORDER BY count DESC;

3. 前端页面查看：
   访问 "数据同步" -> "汇率同步" 标签页
   查看统计卡片中的汇率总数、最后更新时间

EOF
}

# 函数：显示导入完成后的验证步骤
show_verification_steps() {
    cat << 'EOF'

✨ 导入完成后的验证步骤：

1. 验证汇率数据已正确导入：
   psql -h localhost -U finapp_user -d finapp_test << 'SQL'
   SELECT 
     COUNT(*) as total_records,
     COUNT(DISTINCT CONCAT(from_currency, '/', to_currency)) as unique_pairs,
     COUNT(DISTINCT data_source) as data_sources,
     MAX(rate_date) as latest_date,
     MIN(rate_date) as earliest_date
   FROM finapp.exchange_rates;
   SQL

2. 检查特定货币对的数据：
   psql -h localhost -U finapp_user -d finapp_test << 'SQL'
   SELECT 
     from_currency, to_currency,
     COUNT(*) as record_count,
     MIN(rate_date) as start_date,
     MAX(rate_date) as end_date
   FROM finapp.exchange_rates
   WHERE data_source = 'historical_import'
   GROUP BY from_currency, to_currency
   ORDER BY from_currency, to_currency;
   SQL

3. 在前端验证：
   打开浏览器访问 http://localhost:3000
   进入 "管理后台" -> "数据同步" -> "汇率同步"
   验证以下内容：
   - 总汇率记录数显示正确
   - 货币对数显示正确（应为 10 个）
   - 最后更新时间显示最近日期
   - 汇率列表显示历史数据

EOF
}

# 主函数
main() {
    echo ""
    echo "=================================="
    echo "   FinApp 汇率历史数据导入工具"
    echo "=================================="
    echo ""
    
    # 检查后端服务
    check_backend
    echo ""
    
    # 显示配置信息
    print_info "导入配置信息："
    echo "  📅 历史数据范围：过去 $YEARS 年"
    echo "  💱 监控货币对数：10 个"
    echo "  🔗 API 地址：$API_BASE_URL"
    echo ""
    
    # 获取并显示自动更新状态
    status=$(get_status)
    print_info "自动更新服务状态："
    echo "$status" | jq '.data' 2>/dev/null || echo "$status"
    echo ""
    
    # 确认用户是否继续
    print_warning "此操作将导入约 $(($YEARS * 365 * 10)) 条历史汇率记录"
    echo ""
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "导入已取消"
        exit 0
    fi
    echo ""
    
    # 执行导入
    if import_historical_async $YEARS; then
        echo ""
        monitor_import
        echo ""
        show_verification_steps
        echo ""
        print_success "导入流程已启动！"
        echo ""
    else
        print_error "导入启动失败"
        exit 1
    fi
}

# 运行主函数
main
