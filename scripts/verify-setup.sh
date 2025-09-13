#!/bin/bash
# FinApp - 验证开发环境设置脚本

set -e

echo "🔍 验证FinApp开发环境设置..."
echo

# 检查服务状态
echo "📊 检查服务状态:"
echo "PostgreSQL@13: $(brew services list | grep postgresql@13 | awk '{print $2}')"
echo "Nginx: $(brew services list | grep nginx | awk '{print $2}')"
echo

# 检查数据库连接
echo "🗄️ 检查数据库连接:"
if psql -h localhost -U finapp_user -d finapp_test -c "SELECT 'Database connection successful!' as status;" > /dev/null 2>&1; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
    exit 1
fi

# 检查 Web 服务
echo "🌐 检查 Web 服务:"
if curl -s http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx 服务正常"
else
    echo "❌ Nginx 服务异常"
    exit 1
fi

# 检查 Mock API
echo "🎭 检查 Mock API:"
if curl -s http://localhost:8001/sample.json > /dev/null 2>&1; then
    echo "✅ Mock API 服务正常"
else
    echo "❌ Mock API 服务异常"
    exit 1
fi

# 检查项目结构
echo "📁 检查项目结构:"
required_dirs=("backend/src" "frontend/src" "config" "scripts" "docs")
for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir 目录存在"
    else
        echo "❌ $dir 目录缺失"
        exit 1
    fi
done

# 检查配置文件
echo "⚙️ 检查配置文件:"
required_files=(".env.template" ".gitignore" "README.md" "config/postgres/init.sql" "config/nginx/finapp-local.conf")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 文件存在"
    else
        echo "❌ $file 文件缺失"
        exit 1
    fi
done

echo
echo "🎉 开发环境验证完成！所有检查都通过了。"
echo
echo "📍 访问地址："
echo "   - 应用主页: http://localhost"
echo "   - Mock API: http://localhost:8001"
echo "   - 健康检查: http://localhost/health"
echo
echo "🚀 现在可以开始开发了！"