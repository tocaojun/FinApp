#!/bin/bash
# FinApp 后端连接诊断脚本

echo "🔍 FinApp 后端连接诊断"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 检查后端进程是否运行
echo "1️⃣  检查后端进程状态..."
if ps aux | grep -v grep | grep "node.*dist/server" > /dev/null; then
    echo -e "${GREEN}✅ 后端进程正在运行${NC}"
    ps aux | grep -v grep | grep "node.*dist/server" | head -1
else
    echo -e "${RED}❌ 后端进程未运行${NC}"
fi
echo ""

# 2. 检查端口监听
echo "2️⃣  检查端口监听状态..."
echo "   检查 8000 端口..."
if sudo netstat -tlnp 2>/dev/null | grep ":8000" > /dev/null; then
    echo -e "${GREEN}✅ 8000 端口正在监听${NC}"
    sudo netstat -tlnp 2>/dev/null | grep ":8000"
else
    echo -e "${RED}❌ 8000 端口未监听${NC}"
fi
echo ""

# 3. 测试本地连接
echo "3️⃣  测试本地连接..."
echo "   测试 localhost:8000..."
if curl -s --max-time 3 http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ localhost:8000 可访问${NC}"
    curl -s http://localhost:8000/health | head -c 200
else
    echo -e "${RED}❌ localhost:8000 无法访问${NC}"
fi
echo ""

echo "   测试 0.0.0.0:8000..."
if curl -s --max-time 3 http://0.0.0.0:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 0.0.0.0:8000 可访问${NC}"
else
    echo -e "${RED}❌ 0.0.0.0:8000 无法访问${NC}"
fi
echo ""

# 4. 测试外网 IP 连接
echo "4️⃣  测试外网 IP 连接..."
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "   服务器 IP: $SERVER_IP"
if curl -s --max-time 3 http://$SERVER_IP:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ $SERVER_IP:8000 可访问${NC}"
else
    echo -e "${RED}❌ $SERVER_IP:8000 无法访问${NC}"
fi
echo ""

# 5. 检查防火墙规则
echo "5️⃣  检查防火墙规则..."
if command -v ufw &> /dev/null; then
    echo "   UFW 状态:"
    sudo ufw status | grep -E "8000|Status"
    echo ""
    if sudo ufw status | grep "8000" | grep "ALLOW" > /dev/null; then
        echo -e "${GREEN}✅ 防火墙已允许 8000 端口${NC}"
    else
        echo -e "${RED}❌ 防火墙未允许 8000 端口${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  未检测到 UFW 防火墙${NC}"
fi
echo ""

# 6. 检查后端日志
echo "6️⃣  检查后端日志 (最后 20 行)..."
if [ -f "logs/backend.log" ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    tail -n 20 logs/backend.log
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${RED}❌ 找不到后端日志文件${NC}"
fi
echo ""

# 7. 检查环境变量配置
echo "7️⃣  检查后端环境变量配置..."
if [ -f "backend/.env.production" ]; then
    echo "   HOST: $(grep "^HOST=" backend/.env.production || echo '未设置')"
    echo "   PORT: $(grep "^PORT=" backend/.env.production || echo '未设置')"
    echo "   CORS_ORIGIN: $(grep "^CORS_ORIGIN=" backend/.env.production || echo '未设置')"
else
    echo -e "${RED}❌ 找不到 backend/.env.production 文件${NC}"
fi
echo ""

# 8. 测试 API 端点
echo "8️⃣  测试 API 端点..."
echo "   测试 /health..."
curl -s --max-time 3 http://localhost:8000/health 2>&1 | head -c 500
echo ""
echo ""

echo "   测试 /api/health..."
curl -s --max-time 3 http://localhost:8000/api/health 2>&1 | head -c 500
echo ""
echo ""

# 9. 建议修复方案
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 建议修复方案："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! ps aux | grep -v grep | grep "node.*dist/server" > /dev/null; then
    echo "1. 后端未运行，请重启后端服务："
    echo "   cd /opt/finapp/releases/\$(ls -t /opt/finapp/releases | grep -E '^[0-9]{8}_[0-9]{6}\$' | head -1)"
    echo "   sudo bash scripts/start-all-services-ubuntu.sh"
fi

if ! sudo ufw status 2>/dev/null | grep "8000" | grep "ALLOW" > /dev/null; then
    echo "2. 防火墙未开放 8000 端口，执行："
    echo "   sudo ufw allow 8000/tcp"
    echo "   sudo ufw reload"
fi

if ! sudo netstat -tlnp 2>/dev/null | grep ":8000" | grep "0.0.0.0" > /dev/null; then
    echo "3. 后端可能未监听 0.0.0.0，检查："
    echo "   cat backend/.env.production | grep HOST"
    echo "   应该包含: HOST=0.0.0.0"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
