#!/bin/bash

# FinApp 数据库恢复脚本
# 用法: bash restore-database.sh [备份文件路径]

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
FinApp 数据库恢复脚本

用法: bash restore-database.sh [备份文件路径]

示例:
  bash restore-database.sh /Users/caojun/code/FinApp/backups/finapp_full_backup_20251107_214500.sql
  bash restore-database.sh /Users/caojun/code/FinApp/backups/finapp_full_backup_20251107_214500.sql.gz

重要提示:
  - 恢复操作将覆盖现有数据
  - 请确保有最新的备份
  - 恢复前会提示确认

EOF
}

# 检查备份文件
check_backup_file() {
  local backup_file=$1
  
  if [ -z "$backup_file" ]; then
    print_error "请指定备份文件路径"
    echo ""
    show_help
    exit 1
  fi
  
  if [ ! -f "$backup_file" ]; then
    print_error "备份文件不存在: $backup_file"
    exit 1
  fi
  
  print_success "找到备份文件"
  echo "📁 文件: $backup_file"
  echo "📊 大小: $(du -h "$backup_file" | cut -f1)"
  echo "📅 时间: $(stat -f %Sm -t '%Y-%m-%d %H:%M:%S' "$backup_file")"
}

# 确认恢复操作
confirm_restore() {
  echo ""
  print_warning "警告：这将覆盖 $DB_NAME 数据库中的所有数据！"
  echo ""
  read -p "确定要继续恢复吗？请输入 'yes' 确认: " confirm
  
  if [ "$confirm" != "yes" ]; then
    print_info "恢复已取消"
    exit 0
  fi
}

# 恢复数据库
restore_database() {
  local backup_file=$1
  
  print_info "开始恢复数据库..."
  echo "数据库: $DB_NAME"
  echo "用户: $DB_USER"
  echo "主机: $DB_HOST"
  echo ""
  
  # 检查备份文件格式
  if [[ "$backup_file" == *.gz ]]; then
    print_info "检测到 gzip 压缩格式"
    if gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
      print_success "数据库恢复成功！"
      echo -e "${GREEN}⏰ 恢复完成: $(date)${NC}"
      return 0
    else
      print_error "数据库恢复失败"
      return 1
    fi
  else
    print_info "检测到 SQL 文本格式"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$backup_file" > /dev/null 2>&1; then
      print_success "数据库恢复成功！"
      echo -e "${GREEN}⏰ 恢复完成: $(date)${NC}"
      return 0
    else
      print_error "数据库恢复失败"
      return 1
    fi
  fi
}

# 验证恢复
verify_restore() {
  print_info "验证数据库恢复..."
  
  local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'finapp'")
  
  local user_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM finapp.users" 2>/dev/null || echo "0")
  
  echo "📊 数据库表数: $table_count"
  echo "👥 用户数: $user_count"
  
  if [ "$table_count" -gt 0 ]; then
    print_success "数据库恢复验证通过"
  else
    print_warning "数据库验证异常，请手动检查"
  fi
}

# 主程序
main() {
  local backup_file=$1
  
  if [ "$backup_file" = "help" ] || [ "$backup_file" = "-h" ] || [ "$backup_file" = "--help" ]; then
    show_help
    exit 0
  fi
  
  echo ""
  print_info "FinApp 数据库恢复工具"
  echo "================================"
  echo ""
  
  check_backup_file "$backup_file"
  confirm_restore
  
  if restore_database "$backup_file"; then
    verify_restore
    echo ""
    print_success "恢复流程完成！"
  else
    print_error "恢复流程中断"
    exit 1
  fi
}

# 执行主程序
main "$@"
