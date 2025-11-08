#!/bin/bash

# FinApp 数据源恢复脚本
# 用途: 恢复 price_data_sources 表中的默认数据源
# 用法: bash restore-data-sources.sh

set -e

# 配置
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="finapp_test"
DB_USER="${DB_USER:-caojun}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 打印函数
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

# 显示使用帮助
show_help() {
  cat << EOF
FinApp 数据源恢复脚本

用法: bash restore-data-sources.sh [选项]

选项:
  restore    - 恢复默认数据源（默认）
  verify     - 验证数据源是否已恢复
  help       - 显示此帮助信息

示例:
  bash restore-data-sources.sh              # 恢复数据源
  bash restore-data-sources.sh verify      # 验证数据源
  bash restore-data-sources.sh help        # 显示帮助

环境变量:
  DB_USER    - 数据库用户 (默认: caojun)

EOF
}

# 连接测试
test_connection() {
  print_info "测试数据库连接..."
  
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    print_success "数据库连接成功"
    return 0
  else
    print_error "数据库连接失败"
    echo "配置:"
    echo "  主机: $DB_HOST"
    echo "  端口: $DB_PORT"
    echo "  用户: $DB_USER"
    echo "  数据库: $DB_NAME"
    return 1
  fi
}

# 恢复数据源
restore_data_sources() {
  print_info "开始恢复数据源..."
  echo ""
  
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
BEGIN;

-- 插入 Tushare 数据源
INSERT INTO finapp.price_data_sources (
    id,
    name,
    provider,
    api_endpoint,
    api_key_encrypted,
    config,
    rate_limit,
    timeout_seconds,
    is_active,
    last_sync_status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Tushare - 中国股票数据源',
    'tushare',
    'http://api.tushare.pro',
    NULL,
    '{"data_types": ["daily_price", "basic_info", "stock_list"], "sync_frequency": "daily", "min_share_price": 0.1}'::jsonb,
    '100',
    30,
    true,
    'pending',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (name) DO NOTHING;

COMMIT;
EOF

  if [ $? -eq 0 ]; then
    print_success "数据源恢复成功"
    return 0
  else
    print_error "数据源恢复失败"
    return 1
  fi
}

# 验证数据源
verify_data_sources() {
  print_info "验证数据源..."
  echo ""
  
  # 检查数据源数量
  local count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM finapp.price_data_sources" 2>/dev/null)
  
  if [ -z "$count" ] || [ "$count" = "0" ]; then
    print_error "未找到数据源"
    return 1
  fi
  
  print_success "找到 $count 个数据源"
  echo ""
  
  # 列出所有数据源
  print_info "数据源列表:"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
  
  SELECT 
    name,
    provider,
    api_endpoint,
    is_active,
    created_at
  FROM finapp.price_data_sources
  ORDER BY created_at DESC;
EOF

  return 0
}

# 主程序
main() {
  local action=${1:-restore}
  
  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║           FinApp 数据源恢复工具                                ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""
  
  case "$action" in
    restore)
      if test_connection; then
        restore_data_sources
      fi
      ;;
    verify)
      if test_connection; then
        verify_data_sources
      fi
      ;;
    help)
      show_help
      ;;
    *)
      print_error "未知的操作: $action"
      echo ""
      show_help
      exit 1
      ;;
  esac
  
  echo ""
}

# 执行主程序
main "$@"
