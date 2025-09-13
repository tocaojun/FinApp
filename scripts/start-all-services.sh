#!/bin/bash
# FinApp - 启动所有本地服务脚本

set -e

echo "🚀 启动FinApp本地服务..."

# 检查Homebrew是否安装
if ! command -v brew &> /dev/null; then
    echo "❌ 错误: 请先安装Homebrew"
    exit 1
fi

# 启动数据库服务
echo "📊 启动PostgreSQL..."
brew services start postgresql@13

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 5

# 检查数据库是否可连接
if ! /opt/homebrew/opt/postgresql@13/bin/pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "⚠️  数据库未完全启动，继续等待..."
    sleep 5
fi

# 初始化数据库（如果需要）
if ! /opt/homebrew/opt/postgresql@13/bin/psql -h localhost -U postgres -d postgres -c '\q' 2>/dev/null; then
    echo "🔧 初始化数据库..."
    /opt/homebrew/opt/postgresql@13/bin/createuser -s finapp_user 2>/dev/null || true
    /opt/homebrew/opt/postgresql@13/bin/createdb -U finapp_user finapp_test 2>/dev/null || true
    /opt/homebrew/opt/postgresql@13/bin/psql -h localhost -U postgres -d postgres -f config/postgres/init.sql 2>/dev/null || true
fi

# 启动Mock API服务
echo "🎭 启动Mock API服务..."
if [ -f /tmp/mock-api.pid ] && kill -0 $(cat /tmp/mock-api.pid) 2>/dev/null; then
    echo "✅ Mock API服务已在运行"
else
    # 创建简单的Mock API服务器
    python3 -m http.server 8001 --directory config/mock-api &
    echo $! > /tmp/mock-api.pid
    echo "✅ Mock API服务已启动 (PID: $(cat /tmp/mock-api.pid))"
fi

# 复制Nginx配置
echo "🌐 配置Nginx..."
if [ ! -f /opt/homebrew/etc/nginx/servers/finapp-local.conf ]; then
    mkdir -p /opt/homebrew/etc/nginx/servers
    cp config/nginx/finapp-local.conf /opt/homebrew/etc/nginx/servers/
    echo "✅ Nginx配置已复制"
fi

# 启动Nginx网关
echo "🌐 启动Nginx..."
brew services start nginx

echo ""
echo "🎉 所有服务启动完成！"
echo ""
echo "📍 访问地址："
echo "   - 应用主页: http://localhost"
echo "   - Mock API: http://localhost:8001"
echo "   - 健康检查: http://localhost/health"
echo ""
echo "📊 服务状态检查："
brew services list | grep -E "(postgresql@13|nginx)" || true

echo ""
echo "💡 提示："
echo "   - 使用 './scripts/stop-all-services.sh' 停止所有服务"
echo "   - 查看日志: 'tail -f /opt/homebrew/var/log/postgresql@13/postgresql-*.log'"
echo "   - 数据库连接: psql -h localhost -U finapp_user -d finapp_test"