#!/bin/bash
# 修复富途 Python 包问题
# 卸载错误的 futu 包，安装正确的 futu-api

SERVER="ubuntu@apollo123.cloud"

echo "🔧 修复富途 Python 包..."
echo ""

ssh $SERVER << 'ENDSSH'

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. 检查当前安装的 futu 包"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pip3 list | grep -i futu

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. 卸载错误的 futu 包"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo pip3 uninstall -y futu

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. 安装正确的 futu-api 包"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo pip3 install futu-api

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. 验证安装"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python3 << 'PYEOF'
try:
    import futu
    print(f'✅ futu-api 安装成功')
    print(f'   版本: {futu.__version__}')
    print(f'   路径: {futu.__file__}')
    
    # 测试导入关键模块
    from futu import OpenQuoteContext
    print('✅ 可以导入 OpenQuoteContext')
    
except ImportError as e:
    print(f'❌ 导入失败: {e}')
PYEOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. 已安装的 Python 包"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pip3 list | grep -E "(psycopg2|futu)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 修复完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 后续步骤："
echo "   1. 重启后端服务以应用更改"
echo "   2. 在界面中重新尝试香港股票价格同步"
echo ""

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 是否立即重启后端服务？"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "输入 y 确认重启，其他键跳过: " confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    echo "重启后端服务..."
    ssh $SERVER << 'RESTART'
        cd /opt/finapp/current
        pm2 restart backend 2>/dev/null || \
        (pkill -f "node.*dist/server" && nohup node dist/server.js > logs/backend.log 2>&1 &)
        echo "✅ 后端服务已重启"
RESTART
else
    echo "跳过重启，请稍后手动重启"
fi
