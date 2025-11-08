#!/bin/bash

# FinApp 数据库备份脚本
# 用法: bash backup-database.sh [备份类型] [可选:输出目录]

set -e

# 配置
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="finapp_test"
DB_USER="${DB_USER:-caojun}"  # 默认使用 caojun，也支持 finapp_user
BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-/Users/caojun/code/FinApp/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
FinApp 数据库备份脚本

用法: bash backup-database.sh [选项]

选项:
  full       - 完整数据库备份（默认）
  table      - 备份特定表 (需指定表名: bash backup-database.sh table exchange_rates)
  data       - 导出表数据为 CSV 格式 (需指定表名)
  compress   - 创建压缩的完整备份
  list       - 列出所有现有备份
  help       - 显示此帮助信息

示例:
  bash backup-database.sh                    # 完整备份
  bash backup-database.sh compress           # 压缩备份
  bash backup-database.sh table users        # 备份 users 表
  bash backup-database.sh data exchange_rates # 导出 exchange_rates 表数据为 CSV
  bash backup-database.sh list               # 列出所有备份

环境变量:
  DB_USER              - 数据库用户 (默认: caojun)
  BACKUP_BASE_DIR      - 备份目录 (默认: /Users/caojun/code/FinApp/backups)

EOF
}

# 创建备份目录
create_backup_dir() {
  if [ ! -d "$BACKUP_BASE_DIR" ]; then
    mkdir -p "$BACKUP_BASE_DIR"
    print_success "创建备份目录: $BACKUP_BASE_DIR"
  fi
}

# 完整数据库备份
backup_full() {
  print_info "开始完整数据库备份..."
  print_info "数据库: $DB_NAME"
  print_info "用户: $DB_USER"
  
  BACKUP_FILE="$BACKUP_BASE_DIR/finapp_full_backup_${TIMESTAMP}.sql"
  
  if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>&1; then
    local size=$(du -h "$BACKUP_FILE" | cut -f1)
    print_success "完整备份完成"
    echo -e "${GREEN}📁 备份位置: $BACKUP_FILE${NC}"
    echo -e "${GREEN}📊 备份大小: $size${NC}"
    echo -e "${GREEN}⏰ 完成时间: $(date)${NC}"
  else
    print_error "完整备份失败"
    return 1
  fi
}

# 压缩备份
backup_compress() {
  print_info "开始压缩备份..."
  
  BACKUP_FILE="$BACKUP_BASE_DIR/finapp_compressed_backup_${TIMESTAMP}.sql.gz"
  
  if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE" 2>&1; then
    local size=$(du -h "$BACKUP_FILE" | cut -f1)
    print_success "压缩备份完成"
    echo -e "${GREEN}📁 备份位置: $BACKUP_FILE${NC}"
    echo -e "${GREEN}📊 备份大小: $size${NC}"
    echo -e "${GREEN}⏰ 完成时间: $(date)${NC}"
  else
    print_error "压缩备份失败"
    return 1
  fi
}

# 备份特定表
backup_table() {
  local table_name=$1
  
  if [ -z "$table_name" ]; then
    print_error "请指定表名"
    echo "用法: bash backup-database.sh table [表名]"
    return 1
  fi
  
  print_info "备份表: $table_name"
  
  BACKUP_FILE="$BACKUP_BASE_DIR/finapp_table_${table_name}_backup_${TIMESTAMP}.sql"
  
  if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t "finapp.${table_name}" > "$BACKUP_FILE" 2>&1; then
    local size=$(du -h "$BACKUP_FILE" | cut -f1)
    print_success "表备份完成: $table_name"
    echo -e "${GREEN}📁 备份位置: $BACKUP_FILE${NC}"
    echo -e "${GREEN}📊 备份大小: $size${NC}"
  else
    print_error "表备份失败: $table_name"
    return 1
  fi
}

# 导出表数据为 CSV
export_table_data() {
  local table_name=$1
  
  if [ -z "$table_name" ]; then
    print_error "请指定表名"
    echo "用法: bash backup-database.sh data [表名]"
    return 1
  fi
  
  print_info "导出表数据: $table_name"
  
  DATA_FILE="$BACKUP_BASE_DIR/finapp_data_${table_name}_${TIMESTAMP}.csv"
  
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "COPY finapp.${table_name} TO STDOUT WITH CSV HEADER" > "$DATA_FILE" 2>&1; then
    local size=$(du -h "$DATA_FILE" | cut -f1)
    local rows=$(wc -l < "$DATA_FILE")
    print_success "数据导出完成: $table_name"
    echo -e "${GREEN}📁 导出位置: $DATA_FILE${NC}"
    echo -e "${GREEN}📊 文件大小: $size${NC}"
    echo -e "${GREEN}📝 数据行数: $((rows - 1)) 条记录 + 1 行表头${NC}"
  else
    print_error "数据导出失败: $table_name"
    return 1
  fi
}

# 列出所有备份
list_backups() {
  print_info "现有备份文件:"
  echo ""
  ls -lh "$BACKUP_BASE_DIR" 2>/dev/null | grep -E "\.sql|\.csv" | awk '{print $9, "(" $5 ")"}'
  echo ""
  print_info "总备份空间: $(du -sh "$BACKUP_BASE_DIR" 2>/dev/null | cut -f1)"
}

# 主程序
main() {
  local backup_type=${1:-full}
  
  case "$backup_type" in
    full)
      create_backup_dir
      backup_full
      ;;
    compress)
      create_backup_dir
      backup_compress
      ;;
    table)
      create_backup_dir
      backup_table "$2"
      ;;
    data)
      create_backup_dir
      export_table_data "$2"
      ;;
    list)
      list_backups
      ;;
    help)
      show_help
      ;;
    *)
      print_error "未知的备份类型: $backup_type"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

# 执行主程序
main "$@"
