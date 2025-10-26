#!/bin/bash

echo "=== FinApp 服务启动脚本 ==="
echo ""

# 检查PostgreSQL是否运行
echo "1. 检查PostgreSQL服务..."
if brew services list | grep postgresql | grep started > /dev/null; then
  echo "✅ PostgreSQL 已运行"
else
  echo "⚠️  PostgreSQL 未运行，正在启动..."
  brew services start postgresql@15
  sleep 2
fi
echo ""

# 启动后端服务
echo "2. 启动后端服务..."
cd /Users/caojun/code/FinApp/backend

# 检查端口8000是否被占用
if lsof -i :8000 > /dev/null 2>&1; then
  echo "⚠️  端口8000已被占用，正在停止旧进程..."
  pkill -f "ts-node.*server.ts" 2>/dev/null
  sleep 2
fi

# 启动后端
echo "正在启动后端服务..."
npm run dev > /tmp/finapp-backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"
echo "日志文件: /tmp/finapp-backend.log"
echo ""

# 等待后端启动
echo "等待后端服务就绪..."
for i in {1..10}; do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ 后端服务已就绪"
    break
  fi
  sleep 1
  echo -n "."
done
echo ""

# 启动前端服务
echo "3. 启动前端服务..."
cd /Users/caojun/code/FinApp/frontend

# 检查端口3001是否被占用
if lsof -i :3001 > /dev/null 2>&1; then
  echo "⚠️  端口3001已被占用，正在停止旧进程..."
  pkill -f "vite.*3001" 2>/dev/null
  sleep 2
fi

# 启动前端
echo "正在启动前端服务..."
npm run dev > /tmp/finapp-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"
echo "日志文件: /tmp/finapp-frontend.log"
echo ""

# 等待前端启动
echo "等待前端服务就绪..."
sleep 3
echo ""

echo "=== 服务启动完成 ==="
echo ""
echo "📊 服务状态:"
echo "  - 后端API: http://localhost:8000"
echo "  - 前端应用: http://localhost:3001"
echo "  - API文档: http://localhost:8000/api/docs"
echo ""
echo "📝 日志文件:"
echo "  - 后端: tail -f /tmp/finapp-backend.log"
echo "  - 前端: tail -f /tmp/finapp-frontend.log"
echo ""
echo "🛑 停止服务:"
echo "  - 后端: kill $BACKEND_PID"
echo "  - 前端: kill $FRONTEND_PID"
echo ""
echo "💡 提示: 在浏览器中访问 http://localhost:3001 开始使用"
echo ""
