#!/bin/bash
# 远程检查富途同步依赖和配置
# 使用 ubuntu 账户

SERVER="ubuntu@apollo123.cloud"

echo "🔍 远程检查富途同步依赖（使用 ubuntu 账户）..."
echo ""

ssh $SERVER << 'ENDSSH'

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Python 版本和路径"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
which python3
python3 --version

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. 检查 psycopg2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python3 -c "import psycopg2; print('✅ psycopg2 版本:', psycopg2.__version__)" 2>&1 || echo "❌ psycopg2 未安装"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. 检查 futu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python3 -c "import futu; print('✅ futu 版本:', futu.__version__)" 2>&1 || echo "❌ futu 未安装"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. pip3 已安装的相关包"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pip3 list 2>/dev/null | grep -E "(psycopg2|futu|Psycopg2)" || echo "未找到相关包"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. 检查富途同步脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "/opt/finapp/releases/20251209_065522/scripts/futu-sync-single.py" ]; then
    echo "✅ 找到脚本: /opt/finapp/releases/20251209_065522/scripts/futu-sync-single.py"
    ls -lh /opt/finapp/releases/20251209_065522/scripts/futu-sync-single.py
else
    echo "❌ 未找到富途同步脚本"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. 后端服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if pgrep -f "node.*dist/server" > /dev/null; then
    echo "✅ 后端服务运行中"
    ps aux | grep "node.*dist/server" | grep -v grep
else
    echo "❌ 后端服务未运行"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. 后端日志中的最新富途错误（最近10行）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "/opt/finapp/releases/20251209_065522/logs/backend.log" ]; then
    grep -i "futu.*error\|futu.*failed\|modulenotfound" /opt/finapp/releases/20251209_065522/logs/backend.log | tail -10 || echo "未找到错误"
else
    echo "日志文件不存在"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. 测试数据库连接（Python）"
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
    cursor = conn.cursor()
    cursor.execute('SELECT version()')
    version = cursor.fetchone()
    print(f'PostgreSQL 版本: {version[0][:50]}...')
    cursor.close()
    conn.close()
except Exception as e:
    print(f'❌ 数据库连接失败: {e}')
PYEOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. 富途数据源状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d finapp_production -c "
SELECT 
    name,
    provider,
    is_active,
    last_sync_at
FROM finapp.price_data_sources
WHERE provider = 'futu'
" 2>/dev/null || echo "无法查询数据库"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. 最近的同步日志（最近3条）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u postgres psql -d finapp_production -c "
SELECT 
    created_at,
    status,
    total_records,
    failed_count
FROM finapp.price_sync_logs
ORDER BY created_at DESC
LIMIT 3
" 2>/dev/null || echo "无法查询同步日志"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 检查完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENDSSH
