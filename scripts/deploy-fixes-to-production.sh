#!/bin/bash
# FinApp - 将修复部署到生产环境
# 使用 SCP 传输修复脚本到服务器并执行

set -e

echo "🚀 部署修复到生产服务器..."

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
echo "📦 1. 传输修复脚本到服务器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查本地文件是否存在
if [ ! -f "${LOCAL_DIR}/scripts/fix-futu-sync-issues.sh" ]; then
    echo -e "${RED}❌ 找不到修复脚本${NC}"
    exit 1
fi

if [ ! -f "${LOCAL_DIR}/scripts/fix-production-db-schema.sql" ]; then
    echo -e "${RED}❌ 找不到数据库修复脚本${NC}"
    exit 1
fi

# 传输脚本
echo "传输 fix-futu-sync-issues.sh..."
scp "${LOCAL_DIR}/scripts/fix-futu-sync-issues.sh" \
    "${SERVER}:${REMOTE_DIR}/scripts/"

echo "传输 fix-production-db-schema.sql..."
scp "${LOCAL_DIR}/scripts/fix-production-db-schema.sql" \
    "${SERVER}:${REMOTE_DIR}/scripts/"

echo "传输 diagnose-sync-failures.sh..."
scp "${LOCAL_DIR}/scripts/diagnose-sync-failures.sh" \
    "${SERVER}:${REMOTE_DIR}/scripts/"

echo -e "${GREEN}✅ 文件传输完成${NC}"

# 2. 设置执行权限
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 2. 设置执行权限"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh "${SERVER}" "chmod +x ${REMOTE_DIR}/scripts/fix-futu-sync-issues.sh"
ssh "${SERVER}" "chmod +x ${REMOTE_DIR}/scripts/diagnose-sync-failures.sh"

echo -e "${GREEN}✅ 权限设置完成${NC}"

# 3. 显示后续操作指令
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 后续操作："
echo ""
echo "1️⃣  登录到生产服务器："
echo -e "   ${BLUE}ssh ${SERVER}${NC}"
echo ""
echo "2️⃣  切换到项目目录："
echo -e "   ${BLUE}cd ${REMOTE_DIR}${NC}"
echo ""
echo "3️⃣  执行修复脚本："
echo -e "   ${BLUE}bash scripts/fix-futu-sync-issues.sh${NC}"
echo ""
echo "4️⃣  验证修复结果："
echo -e "   ${BLUE}bash scripts/diagnose-sync-failures.sh${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 快捷命令（一键执行）："
echo ""
echo -e "${YELLOW}ssh ${SERVER} 'cd ${REMOTE_DIR} && bash scripts/fix-futu-sync-issues.sh'${NC}"
echo ""
