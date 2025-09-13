#!/bin/bash
# FinApp Database Migration Script
# Usage: ./scripts/db-migrate.sh [command] [options]

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-finapp_test}"
DB_USER="${DB_USER:-finapp_user}"
DB_PASSWORD="${DB_PASSWORD:-FinApp2025!}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is running
check_postgres() {
    log_info "检查PostgreSQL连接..."
    if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "无法连接到PostgreSQL数据库"
        log_error "请确保PostgreSQL正在运行，并且连接参数正确"
        exit 1
    fi
    log_success "PostgreSQL连接正常"
}

# Run schema migrations
run_schema_migration() {
    log_info "执行数据库架构迁移..."
    
    cd backend/migrations/001_initial_schema
    
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f run_migration.sql; then
        log_success "数据库架构迁移完成"
    else
        log_error "数据库架构迁移失败"
        exit 1
    fi
    
    cd - > /dev/null
}

# Run seed data
run_seed_data() {
    log_info "执行种子数据插入..."
    
    cd backend/migrations/002_seed_data
    
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f run_seed.sql; then
        log_success "种子数据插入完成"
    else
        log_error "种子数据插入失败"
        exit 1
    fi
    
    cd - > /dev/null
}

# Reset database (drop and recreate all tables)
reset_database() {
    log_warning "⚠️  这将删除所有数据库表和数据！"
    read -p "确定要重置数据库吗？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
    
    log_info "重置数据库..."
    
    # Drop all tables in the correct order (reverse of creation)
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;
DROP TABLE IF EXISTS asset_prices CASCADE;
DROP TABLE IF EXISTS benchmark_prices CASCADE;
DROP TABLE IF EXISTS benchmarks CASCADE;
DROP TABLE IF EXISTS report_executions CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS cash_flows CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;
DROP TABLE IF EXISTS position_snapshots CASCADE;
DROP TABLE IF EXISTS portfolio_snapshots CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS option_details CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS trading_accounts CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS liquidity_tags CASCADE;
DROP TABLE IF EXISTS asset_types CASCADE;
DROP TABLE IF EXISTS markets CASCADE;
DROP TABLE IF EXISTS email_verification_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

\echo 'Database reset completed!'
EOF
    
    log_success "数据库重置完成"
}

# Show database status
show_status() {
    log_info "数据库状态："
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Show table counts
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows
FROM pg_stat_user_tables 
ORDER BY schemaname, tablename;

-- Show database size
SELECT 
    pg_database.datname as database_name,
    pg_size_pretty(pg_database_size(pg_database.datname)) as size
FROM pg_database 
WHERE datname = current_database();
EOF
}

# Backup database
backup_database() {
    local backup_file="backup/finapp_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log_info "备份数据库到 $backup_file..."
    
    mkdir -p backup
    
    if PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $backup_file; then
        log_success "数据库备份完成: $backup_file"
    else
        log_error "数据库备份失败"
        exit 1
    fi
}

# Restore database from backup
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        log_error "请指定备份文件路径"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    log_warning "⚠️  这将覆盖当前数据库的所有数据！"
    read -p "确定要从备份恢复数据库吗？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
    
    log_info "从备份恢复数据库: $backup_file..."
    
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $backup_file; then
        log_success "数据库恢复完成"
    else
        log_error "数据库恢复失败"
        exit 1
    fi
}

# Show help
show_help() {
    echo "FinApp 数据库迁移工具"
    echo
    echo "用法: $0 [命令] [选项]"
    echo
    echo "命令:"
    echo "  migrate     执行数据库架构迁移"
    echo "  seed        执行种子数据插入"
    echo "  setup       执行完整设置 (migrate + seed)"
    echo "  reset       重置数据库 (删除所有表)"
    echo "  status      显示数据库状态"
    echo "  backup      备份数据库"
    echo "  restore     从备份恢复数据库"
    echo "  help        显示此帮助信息"
    echo
    echo "环境变量:"
    echo "  DB_HOST     数据库主机 (默认: localhost)"
    echo "  DB_PORT     数据库端口 (默认: 5432)"
    echo "  DB_NAME     数据库名称 (默认: finapp_test)"
    echo "  DB_USER     数据库用户 (默认: finapp_user)"
    echo "  DB_PASSWORD 数据库密码 (默认: FinApp2025!)"
    echo
    echo "示例:"
    echo "  $0 setup                    # 完整设置数据库"
    echo "  $0 migrate                  # 只执行架构迁移"
    echo "  $0 seed                     # 只插入种子数据"
    echo "  $0 backup                   # 备份数据库"
    echo "  $0 restore backup/file.sql  # 从备份恢复"
}

# Main script logic
case "${1:-help}" in
    "migrate")
        check_postgres
        run_schema_migration
        ;;
    "seed")
        check_postgres
        run_seed_data
        ;;
    "setup")
        check_postgres
        run_schema_migration
        run_seed_data
        log_success "数据库设置完成！"
        ;;
    "reset")
        check_postgres
        reset_database
        ;;
    "status")
        check_postgres
        show_status
        ;;
    "backup")
        check_postgres
        backup_database
        ;;
    "restore")
        check_postgres
        restore_database "$2"
        ;;
    "help"|*)
        show_help
        ;;
esac