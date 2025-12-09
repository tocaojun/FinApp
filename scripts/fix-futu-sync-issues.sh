#!/bin/bash
# FinApp - 修复富途同步问题脚本
# 修复内容：
# 1. 安装 Python psycopg2 依赖
# 2. 修复数据库表结构（添加缺失字段）
# 3. 验证修复结果

set -e

echo "🔧 修复富途同步问题..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 安装 Python 依赖
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 1. 安装 Python 依赖"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 定义需要安装的 Python 包
REQUIRED_PACKAGES=("psycopg2" "futu")
INSTALL_FAILED=0

for package in "${REQUIRED_PACKAGES[@]}"; do
    echo ""
    echo "检查 $package..."
    
    # 检查是否已安装
    if python3 -c "import $package" 2>/dev/null; then
        echo -e "${GREEN}✅ $package 已安装${NC}"
        python3 -c "import $package; print('   版本:', getattr($package, '__version__', 'unknown'))" 2>/dev/null || true
        continue
    fi
    
    echo "安装 $package..."
    
    # 根据包名选择安装方式
    if [ "$package" = "psycopg2" ]; then
        # psycopg2 优先使用 binary 版本
        if command -v pip3 &> /dev/null; then
            sudo pip3 install psycopg2-binary
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ $package 通过 pip3 安装成功${NC}"
            else
                echo -e "${YELLOW}⚠️  pip3 安装失败，尝试使用 apt${NC}"
                sudo apt-get update
                sudo apt-get install -y python3-psycopg2
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}✅ $package 通过 apt 安装成功${NC}"
                else
                    echo -e "${RED}❌ $package 安装失败${NC}"
                    INSTALL_FAILED=1
                fi
            fi
        else
            sudo apt-get update
            sudo apt-get install -y python3-psycopg2
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ $package 通过 apt 安装成功${NC}"
            else
                echo -e "${RED}❌ $package 安装失败${NC}"
                INSTALL_FAILED=1
            fi
        fi
    else
        # 其他包使用 pip3 安装（支持 Ubuntu 24.04 的外部环境管理）
        if command -v pip3 &> /dev/null; then
            # 尝试使用 --break-system-packages 标志（Ubuntu 24.04+）
            sudo pip3 install $package --break-system-packages 2>/dev/null
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ $package 安装成功 (使用 --break-system-packages)${NC}"
            else
                # 如果失败，尝试不带标志安装
                sudo pip3 install $package
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}✅ $package 安装成功${NC}"
                else
                    echo -e "${RED}❌ $package 安装失败${NC}"
                    INSTALL_FAILED=1
                fi
            fi
        else
            echo -e "${RED}❌ pip3 未安装，无法安装 $package${NC}"
            INSTALL_FAILED=1
        fi
    fi
done

if [ $INSTALL_FAILED -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ 部分依赖安装失败，请检查上面的错误信息${NC}"
    exit 1
fi

# 验证所有依赖
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "验证所有 Python 依赖..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for package in "${REQUIRED_PACKAGES[@]}"; do
    if python3 -c "import $package" 2>/dev/null; then
        VERSION=$(python3 -c "import $package; print(getattr($package, '__version__', 'unknown'))" 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✅ $package ($VERSION)${NC}"
    else
        echo -e "${RED}❌ $package 未安装${NC}"
        INSTALL_FAILED=1
    fi
done

if [ $INSTALL_FAILED -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ 依赖验证失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 所有 Python 依赖已就绪${NC}"

# 2. 修复数据库表结构
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  2. 修复数据库表结构"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/fix-production-db-schema.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ 找不到 SQL 修复脚本: $SQL_FILE${NC}"
    exit 1
fi

echo "执行数据库修复脚本..."
sudo -u postgres psql -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库表结构修复成功${NC}"
else
    echo -e "${RED}❌ 数据库表结构修复失败${NC}"
    exit 1
fi

# 3. 验证富途同步脚本
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 3. 验证富途同步脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 查找富途同步脚本
FUTU_SCRIPT=""
if [ -f "/opt/finapp/releases/20251209_065522/scripts/futu-sync-single.py" ]; then
    FUTU_SCRIPT="/opt/finapp/releases/20251209_065522/scripts/futu-sync-single.py"
elif [ -f "${SCRIPT_DIR}/futu-sync-single.py" ]; then
    FUTU_SCRIPT="${SCRIPT_DIR}/futu-sync-single.py"
fi

if [ -n "$FUTU_SCRIPT" ]; then
    echo "富途脚本路径: $FUTU_SCRIPT"
    
    # 检查脚本语法
    python3 -m py_compile "$FUTU_SCRIPT" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 富途脚本语法检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️  富途脚本语法检查失败${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  未找到富途同步脚本${NC}"
fi

# 4. 检查数据源状态
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 4. 数据源状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sudo -u postgres psql -d finapp_production -c "
SELECT 
    name,
    provider,
    is_active,
    priority,
    last_sync_at
FROM finapp.price_data_sources
ORDER BY priority;
"

# 5. 重启后端服务
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 5. 重启后端服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "是否重启后端服务以应用修复？(y/n): " confirm
if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    if [ -f "${SCRIPT_DIR}/restart-backend-ubuntu.sh" ]; then
        bash "${SCRIPT_DIR}/restart-backend-ubuntu.sh"
    else
        echo -e "${YELLOW}⚠️  未找到重启脚本，请手动重启后端服务${NC}"
        echo "   bash scripts/restart-backend-ubuntu.sh"
    fi
else
    echo "跳过重启，请稍后手动重启后端服务"
fi

# 6. 总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 修复完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 修复内容总结："
echo "   ✅ Python psycopg2 依赖已安装"
echo "   ✅ Python futu 依赖已安装"
echo "   ✅ 数据库表结构已修复"
echo "   ✅ 数据源配置已验证"
echo ""
echo "💡 后续操作："
echo "   1. 重启后端服务（如果尚未重启）："
echo "      bash scripts/restart-backend-ubuntu.sh"
echo ""
echo "   2. 测试富途同步："
echo "      bash scripts/diagnose-sync-failures.sh"
echo ""
echo "   3. 查看实时后端日志："
echo "      tail -f /opt/finapp/releases/20251209_065522/logs/backend.log"
echo ""
echo "   4. 手动触发同步任务："
echo "      curl -X POST http://localhost:8000/api/price-sync/manual-sync \\"
echo "           -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""
