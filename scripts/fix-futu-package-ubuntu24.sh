#!/bin/bash
# 修复富途 Python 包问题（Ubuntu 24.04）
# 使用 --break-system-packages 标志

SERVER="ubuntu@apollo123.cloud"

echo "🔧 修复富途 Python 包（Ubuntu 24.04）..."
echo ""

ssh $SERVER << 'ENDSSH'

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. 检查当前安装的包"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pip3 list | grep -i futu

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. 卸载错误的 futu 包"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo pip3 uninstall -y futu --break-system-packages 2>&1 || echo "卸载完成或包不存在"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. 安装正确的 futu-api 包"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo pip3 install futu-api --break-system-packages

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. 验证安装"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python3 << 'PYEOF'
try:
    import futu
    print(f'✅ futu-api 版本: {futu.__version__}')
    print(f'   安装路径: {futu.__file__}')
    
    # 测试导入关键模块
    from futu import OpenQuoteContext, RET_OK
    print('✅ 成功导入 OpenQuoteContext')
    print('✅ 成功导入 RET_OK')
    
    # 检查可用的类和函数
    print('\n可用的主要类:')
    important_classes = ['OpenQuoteContext', 'OpenSecTradeContext', 'RET_OK', 'RET_ERROR']
    for cls in important_classes:
        if hasattr(futu, cls):
            print(f'  ✅ {cls}')
        else:
            print(f'  ❌ {cls}')
    
except ImportError as e:
    print(f'❌ 导入失败: {e}')
except Exception as e:
    print(f'❌ 错误: {e}')
PYEOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. 最终安装的包列表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pip3 list | grep -E "(psycopg2|futu)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 修复完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENDSSH
