#!/bin/bash

# FinApp 服务启动脚本（清理版）
# 用途：清理旧进程并启动所有服务

echo "========================================="
echo "  FinApp 服务启动脚本"
echo "========================================="
echo ""

# 1. 清理旧进程
echo "📦 步骤 1/4: 清理旧进程..."
pkill -f "nodemon.*backend" 2>/dev/null
pkill -f "ts-node.*backend" 2>/dev/null
pkill -f "vite.*frontend" 2>/dev/null

# 清理占用的端口
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

sleep 2
echo "✅ 旧进程已清理"
echo ""

# 2. 启动后端服务
echo "🚀 步骤 2/4: 启动后端服务..."
cd /Users/caojun/code/FinApp/backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

sleep 5

# 检查后端是否启动成功
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
    echo "   地址: http://localhost:8000"
else
    echo "❌ 后端服务启动失败，请查看日志: tail -f /tmp/backend.log"
    exit 1
fi
echo ""

# 3. 启动前端服务
echo "🎨 步骤 3/4: 启动前端服务..."
cd /Users/caojun/code/FinApp/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 8

# 检查前端是否启动成功
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ 前端服务启动成功 (PID: $FRONTEND_PID)"
    echo "   地址: http://localhost:3001"
else
    echo "❌ 前端服务启动失败，请查看日志: tail -f /tmp/frontend.log"
    exit 1
fi
echo ""

# 4. 显示服务状态
echo "📊 步骤 4/4: 服务状态检查..."
echo ""
echo "========================================="
echo "  服务状态"
echo "========================================="
echo ""
echo "🟢 后端服务:"
echo "   - 地址: http://localhost:8000"
echo "   - 健康检查: http://localhost:8000/health"
echo "   - API文档: http://localhost:8000/api/docs"
echo "   - 日志: tail -f /tmp/backend.log"
echo ""
echo "🟢 前端服务:"
echo "   - 地址: http://localhost:3001"
echo "   - 日志: tail -f /tmp/frontend.log"
echo ""
echo "========================================="
echo "  快速命令"
echo "========================================="
echo ""
echo "查看后端日志: tail -f /tmp/backend.log"
echo "查看前端日志: tail -f /tmp/frontend.log"
echo "停止所有服务: pkill -f 'nodemon.*backend' && pkill -f 'vite.*frontend'"
echo "重启服务: ./start-all-clean.sh"
echo ""
echo "========================================="
echo "✅ 所有服务已启动！"
echo "========================================="
echo ""
echo "🌐 打开浏览器访问: http://localhost:3001"
echo ""
