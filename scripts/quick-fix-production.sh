#!/bin/bash
# FinApp - 快速修复生产环境富途同步问题
# 一键部署和执行修复脚本

set -e

echo "🚀 快速修复生产环境..."

# 配置
SERVER="root@apollo123.cloud"
REMOTE_DIR="/root/FinApp"
LOCAL_DIR="/Users/caojun/code/FinApp"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 步骤 1/3: 传输修复脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查本地文件
REQUIRED_FILES=(
    "${LOCAL_DIR}/scripts/fix-futu-sync-issues.sh"
    "${LOCAL_DIR}/scripts/fix-production-db-schema.sql"
    "${LOCAL_DIR}/scripts/diagnose-sync-failures.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ 找不到文件: $file${NC}"
        exit 1
    fi
done

echo "传输文件到服务器..."
scp -q "${LOCAL_DIR}/scripts/fix-futu-sync-issues.sh" \
    "${LOCAL_DIR}/scripts/fix-production-db-schema.sql" \
    "${LOCAL_DIR}/scripts/diagnose-sync-failures.sh" \
    "${SERVER}:${REMOTE_DIR}/scripts/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 文件传输完成${NC}"
else
    echo -e "${RED}❌ 文件传输失败${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 步骤 2/3: 设置权限并执行修复"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh "${SERVER}" << 'ENDSSH'
cd /root/FinApp

# 设置执行权限
chmod +x scripts/fix-futu-sync-issues.sh
chmod +x scripts/diagnose-sync-failures.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 执行修复脚本..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 执行修复（自动确认重启）
echo "y" | bash scripts/fix-futu-sync-issues.sh

ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 修复执行完成${NC}"
else
    echo -e "${RED}❌ 修复执行失败${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 步骤 3/3: 验证修复结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 等待后端服务重启
echo "等待后端服务重启（15秒）..."
sleep 15

echo ""
echo "运行诊断脚本..."
ssh "${SERVER}" "cd ${REMOTE_DIR} && bash scripts/diagnose-sync-failures.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 快速修复完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 后续操作："
echo ""
echo "1️⃣  查看后端实时日志："
echo -e "   ${BLUE}ssh ${SERVER} 'tail -f /opt/finapp/releases/20251209_065522/logs/backend.log'${NC}"
echo ""
echo "2️⃣  检查 Python 依赖："
echo -e "   ${BLUE}ssh ${SERVER} \"python3 -c 'import psycopg2, futu; print(\\\"✅ 所有依赖已安装\\\")'\"${NC}"
echo ""
echo "3️⃣  查看数据源状态："
echo -e "   ${BLUE}ssh ${SERVER} \"sudo -u postgres psql -d finapp_production -c 'SELECT name, provider, is_active, priority FROM finapp.price_data_sources ORDER BY priority'\"${NC}"
echo ""
