#!/bin/bash

# FinApp 服务停止脚本
# 用途：停止所有运行中的服务

echo "========================================="
echo "  FinApp 服务停止脚本"
echo "========================================="
echo ""

# 停止后端服务
echo "🛑 停止后端服务..."
pkill -f "nodemon.*backend" 2>/dev/null
pkill -f "ts-node.*backend" 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
echo "✅ 后端服务已停止"
echo ""

# 停止前端服务
echo "🛑 停止前端服务..."
pkill -f "vite.*frontend" 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
echo "✅ 前端服务已停止"
echo ""

# 验证
sleep 2
BACKEND_COUNT=$(ps aux | grep -E "nodemon.*backend|ts-node.*backend" | grep -v grep | wc -l)
FRONTEND_COUNT=$(ps aux | grep "vite.*frontend" | grep -v grep | wc -l)

echo "========================================="
echo "  停止结果"
echo "========================================="
echo ""
echo "后端进程数: $BACKEND_COUNT (应为0)"
echo "前端进程数: $FRONTEND_COUNT (应为0)"
echo ""

if [ "$BACKEND_COUNT" -eq 0 ] && [ "$FRONTEND_COUNT" -eq 0 ]; then
    echo "✅ 所有服务已成功停止"
else
    echo "⚠️  仍有进程在运行，请手动检查"
fi

echo ""
echo "========================================="
