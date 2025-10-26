#!/bin/bash

echo "=========================================="
echo "重启前端服务"
echo "=========================================="
echo ""

# 1. 停止前端服务
echo "1. 停止前端服务..."
pkill -f "vite" 2>/dev/null
sleep 2
echo "✅ 前端服务已停止"
echo ""

# 2. 检查端口
echo "2. 检查端口3001..."
if lsof -i :3001 | grep -q LISTEN; then
    echo "⚠️  端口3001仍被占用，强制释放..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null
    sleep 1
fi
echo "✅ 端口3001已释放"
echo ""

# 3. 启动前端服务
echo "3. 启动前端服务..."
cd /Users/caojun/code/FinApp/frontend
nohup npm run dev > /tmp/finapp-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"
echo "日志文件: /tmp/finapp-frontend.log"
echo ""

# 4. 等待服务启动
echo "4. 等待前端服务启动..."
for i in {1..15}; do
    sleep 1
    if lsof -i :3001 | grep -q LISTEN; then
        echo ""
        echo "✅ 前端服务启动成功！"
        break
    fi
    echo -n "."
done
echo ""

# 5. 验证服务
echo ""
echo "=========================================="
echo "服务状态"
echo "=========================================="
if lsof -i :3001 | grep -q LISTEN; then
    echo "✅ 前端服务: http://localhost:3001 (运行中)"
    echo ""
    echo "📝 访问地址:"
    echo "   应用首页: http://localhost:3001"
    echo "   测试工具: http://localhost:3001/test-liquidity-tags.html"
else
    echo "❌ 前端服务启动失败"
    echo "   查看日志: tail -50 /tmp/finapp-frontend.log"
fi
echo ""
echo "=========================================="
echo "重启完成！"
echo "=========================================="
echo ""
