#!/bin/bash
# 检查富途同步依赖和配置

echo "🔍 检查富途同步依赖和配置..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 检查 Python 版本
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Python 版本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python3 --version

# 2. 检查 psycopg2
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. 检查 psycopg2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if python3 -c "import psycopg2; print('✅ psycopg2 版本:', psycopg2.__version__)" 2>/dev/null; then
    echo -e "${GREEN}psycopg2 已安装${NC}"
else
    echo -e "${RED}❌ psycopg2 未安装${NC}"
    echo "安装命令: sudo pip3 install psycopg2-binary"
fi

# 3. 检查 futu
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. 检查 futu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if python3 -c "import futu; print('✅ futu 版本:', futu.__version__)" 2>/dev/null; then
    echo -e "${GREEN}futu 已安装${NC}"
else
    echo -e "${RED}❌ futu 未安装${NC}"
    echo "安装命令: sudo pip3 install futu-api"
fi

# 4. 检查 pip 已安装的包
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. 已安装的 Python 包"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pip3 list 2>/dev/null | grep -E "(psycopg2|futu)" || echo "未找到相关包"

# 5. 检查富途脚本是否存在
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. 检查富途同步脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

POSSIBLE_PATHS=(
    "/opt/finapp/releases/20251209_065522/scripts/futu-sync-single.py"
    "/root/FinApp/scripts/futu-sync-single.py"
    "/home/ubuntu/FinApp/scripts/futu-sync-single.py"
    "$(pwd)/scripts/futu-sync-single.py"
)

FOUND=false
for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        echo -e "${GREEN}✅ 找到脚本: $path${NC}"
        FOUND=true
        
        # 检查脚本语法
        echo "   检查脚本语法..."
        if python3 -m py_compile "$path" 2>/dev/null; then
            echo -e "   ${GREEN}✅ 语法正确${NC}"
        else
            echo -e "   ${RED}❌ 语法错误${NC}"
        fi
        break
    fi
done

if [ "$FOUND" = false ]; then
    echo -e "${RED}❌ 未找到富途同步脚本${NC}"
fi

# 6. 检查后端日志中的最新错误
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. 后端日志中的富途错误（最近20行）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOG_PATHS=(
    "/opt/finapp/releases/20251209_065522/logs/backend.log"
    "/root/FinApp/logs/backend.log"
    "/home/ubuntu/FinApp/logs/backend.log"
)

for log_path in "${LOG_PATHS[@]}"; do
    if [ -f "$log_path" ]; then
        echo "日志文件: $log_path"
        grep -i "futu.*error\|futu.*failed\|modulenotfound.*futu\|modulenotfound.*psycopg2" "$log_path" | tail -20 || echo "未找到富途相关错误"
        break
    fi
done

# 7. 检查数据库连接
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. 测试数据库连接"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

python3 << 'PYEOF'
try:
    import psycopg2
    conn = psycopg2.connect(
        dbname='finapp_production',
        user='finapp_prod_user',
        password='Ding98dang98',
        host='localhost',
        port='5432'
    )
    print('✅ 数据库连接成功')
    conn.close()
except Exception as e:
    print(f'❌ 数据库连接失败: {e}')
PYEOF

# 8. 检查富途数据源状态
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. 富途数据源状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sudo -u postgres psql -d finapp_production -c "
SELECT 
    id,
    name,
    provider,
    is_active,
    last_sync_at,
    error_message
FROM finapp.price_data_sources
WHERE provider = 'futu'
" 2>/dev/null || echo "无法查询数据库"

# 9. 检查最近的同步日志
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. 最近的富途同步日志（最近5条）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sudo -u postgres psql -d finapp_production -c "
SELECT 
    created_at,
    status,
    total_records,
    failed_count,
    error_summary
FROM finapp.price_sync_logs
WHERE sync_task_id IN (
    SELECT id FROM finapp.price_sync_tasks 
    WHERE data_source_id IN (
        SELECT id FROM finapp.price_data_sources WHERE provider = 'futu'
    )
)
ORDER BY created_at DESC
LIMIT 5
" 2>/dev/null || echo "无法查询同步日志"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 检查完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
