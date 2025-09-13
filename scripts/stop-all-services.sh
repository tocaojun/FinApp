#!/bin/bash
# FinApp - 停止所有本地服务脚本

set -e

echo "🛑 停止FinApp本地服务..."

# 停止Mock API服务
if [ -f /tmp/mock-api.pid ]; then
    echo "🎭 停止Mock API服务..."
    if kill $(cat /tmp/mock-api.pid) 2>/dev/null; then
        echo "✅ Mock API服务已停止"
    else
        echo "⚠️  Mock API服务可能已经停止"
    fi
    rm -f /tmp/mock-api.pid
fi

# 停止Nginx
echo "🌐 停止Nginx..."
if brew services stop nginx; then
    echo "✅ Nginx已停止"
else
    echo "⚠️  Nginx停止失败或未运行"
fi

# 停止PostgreSQL
echo "📊 停止PostgreSQL..."
if brew services stop postgresql@13; then
    echo "✅ PostgreSQL已停止"
else
    echo "⚠️  PostgreSQL停止失败或未运行"
fi

echo ""
echo "🎉 所有服务已停止！"
echo ""
echo "📊 服务状态检查："
brew services list | grep -E "(postgresql@13|nginx)" || true

echo ""
echo "💡 提示："
echo "   - 使用 './scripts/start-all-services.sh' 重新启动所有服务"
echo "   - 如有服务无法正常停止，可使用 'brew services list' 查看状态"