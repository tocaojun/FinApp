#!/bin/bash

# ================================================
# 安装富途API依赖
# ================================================

echo "================================================"
echo "安装富途OpenAPI所需的Python依赖"
echo "================================================"
echo ""

# 检查Python版本
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python版本: $PYTHON_VERSION"
echo ""

# 安装依赖
echo "📦 安装依赖包..."
pip3 install futu-api psycopg2-binary python-dotenv

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 依赖安装成功!"
    echo ""
    echo "已安装:"
    echo "  - futu-api: 富途OpenAPI SDK"
    echo "  - psycopg2-binary: PostgreSQL数据库驱动"
    echo "  - python-dotenv: 环境变量加载"
    echo ""
    echo "现在可以运行同步脚本:"
    echo "  python3 scripts/futu-sync-prices.py [回溯天数]"
    echo ""
else
    echo ""
    echo "❌ 依赖安装失败"
    echo "请检查网络连接或Python环境"
    exit 1
fi
