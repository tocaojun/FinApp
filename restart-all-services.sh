#!/bin/bash

echo "=========================================="
echo "FinApp 服务重启脚本"
echo "=========================================="
echo ""

# 1. 停止所有服务
echo "1. 停止所有现有服务..."
killall -9 node 2>/dev/null
sleep 2
echo "✅ 已停止所有Node进程"
echo ""

# 2. 检查端口
echo "2. 检查端口状态..."
if lsof -i :8000 | grep -q LISTEN; then
    echo "⚠️  端口8000仍被占用"
    lsof -i :8000
else
    echo "✅ 端口8000已释放"
fi

if lsof -i :3001 | grep -q LISTEN; then
    echo "⚠️  端口3001仍被占用"
    lsof -i :3001
else
    echo "✅ 端口3001已释放"
fi
echo ""

# 3. 启动后端服务
echo "3. 启动后端服务..."
cd /Users/caojun/code/FinApp/backend
nohup npm run dev > /tmp/finapp-backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"
echo "日志文件: /tmp/finapp-backend.log"
echo ""

# 4. 等待后端启动
echo "4. 等待后端服务启动..."
for i in {1..10}; do
    sleep 1
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ 后端服务启动成功！"
        break
    fi
    echo -n "."
done
echo ""

# 5. 启动前端服务
echo "5. 启动前端服务..."
cd /Users/caojun/code/FinApp/frontend
nohup npm run dev > /tmp/finapp-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"
echo "日志文件: /tmp/finapp-frontend.log"
echo ""

# 6. 等待前端启动
echo "6. 等待前端服务启动..."
for i in {1..10}; do
    sleep 1
    if lsof -i :3001 | grep -q LISTEN; then
        echo "✅ 前端服务启动成功！"
        break
    fi
    echo -n "."
done
echo ""

# 7. 验证服务状态
echo "=========================================="
echo "服务状态检查"
echo "=========================================="
echo ""

# 检查后端
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ 后端服务: http://localhost:8000 (运行中)"
    HEALTH=$(curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null | grep status | head -1)
    echo "   $HEALTH"
else
    echo "❌ 后端服务: 未运行"
    echo "   查看日志: tail -50 /tmp/finapp-backend.log"
fi

# 检查前端
if lsof -i :3001 | grep -q LISTEN; then
    echo "✅ 前端服务: http://localhost:3001 (运行中)"
else
    echo "❌ 前端服务: 未运行"
    echo "   查看日志: tail -50 /tmp/finapp-frontend.log"
fi

echo ""
echo "=========================================="
echo "启动完成！"
echo "=========================================="
echo ""
echo "📝 访问应用:"
echo "   前端: http://localhost:3001"
echo "   后端: http://localhost:8000"
echo ""
echo "📝 测试账户:"
echo "   邮箱: testapi@finapp.com"
echo "   密码: testapi123"
echo ""
echo "📝 查看日志:"
echo "   后端: tail -f /tmp/finapp-backend.log"
echo "   前端: tail -f /tmp/finapp-frontend.log"
echo ""
