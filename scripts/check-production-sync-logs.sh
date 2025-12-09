#!/bin/bash
# 检查生产环境同步日志功能

echo "🔍 检查生产环境同步日志功能..."
echo ""

# 1. 检查数据库中的日志记录
echo "📊 1. 检查数据库中的同步日志记录..."
LOG_COUNT=$(sudo -u postgres psql -d finapp_production -tAc "SELECT COUNT(*) FROM finapp.price_sync_logs")
echo "   数据库中日志记录数: $LOG_COUNT"

if [ "$LOG_COUNT" -gt 0 ]; then
    echo "   最近5条日志："
    sudo -u postgres psql -d finapp_production -c "
        SELECT 
            id,
            status,
            TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI:SS') as started_at,
            total_records,
            success_count,
            failed_count
        FROM finapp.price_sync_logs 
        ORDER BY started_at DESC 
        LIMIT 5
    "
fi
echo ""

# 2. 检查后端API响应
echo "🔧 2. 检查后端API响应..."
echo "   请求: GET http://localhost:8000/api/price-sync/logs?limit=5"
RESPONSE=$(curl -s http://localhost:8000/api/price-sync/logs?limit=5)
echo "   响应:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# 3. 检查前端构建产物中的API配置
echo "📦 3. 检查前端构建产物中的API配置..."
LATEST_RELEASE=$(ls -t /opt/finapp/releases | grep -E '^[0-9]{8}_[0-9]{6}$' | head -1)
echo "   当前版本: $LATEST_RELEASE"

if [ -n "$LATEST_RELEASE" ]; then
    cd "/opt/finapp/releases/$LATEST_RELEASE/frontend"
    
    # 检查构建产物是否包含正确的API地址
    if [ -d "dist/assets" ]; then
        echo "   检查 dist/assets 中的 API 配置..."
        APOLLO_COUNT=$(grep -r "apollo123.cloud:8000" dist/assets/*.js 2>/dev/null | wc -l)
        echo "   包含 apollo123.cloud:8000 的文件数: $APOLLO_COUNT"
        
        # 检查是否还有硬编码的 /api 路径
        HARDCODED_COUNT=$(grep -r "http://localhost:8000/api" dist/assets/*.js 2>/dev/null | wc -l)
        if [ "$HARDCODED_COUNT" -gt 0 ]; then
            echo "   ⚠️  警告: 发现 $HARDCODED_COUNT 个硬编码的 localhost:8000"
        fi
    else
        echo "   ❌ 未找到 dist/assets 目录"
    fi
fi
echo ""

# 4. 检查前端服务状态
echo "🌐 4. 检查前端服务状态..."
FRONTEND_PID=$(cat /opt/finapp/releases/$LATEST_RELEASE/logs/frontend.pid 2>/dev/null)
if [ -n "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "   ✅ 前端服务运行中 (PID: $FRONTEND_PID)"
else
    echo "   ❌ 前端服务未运行"
fi

# 检查前端是否可访问
if curl -s -I http://localhost:3001 | grep -q "200 OK"; then
    echo "   ✅ 前端服务可访问 (http://localhost:3001)"
else
    echo "   ❌ 前端服务无法访问"
fi
echo ""

# 5. 建议操作
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 建议操作："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$LOG_COUNT" -eq 0 ]; then
    echo "   ⚠️  数据库中没有日志记录，这是正常的（如果还没有执行过同步任务）"
elif [ "$APOLLO_COUNT" -eq 0 ]; then
    echo "   ❌ 前端构建产物中未找到正确的API配置"
    echo "   需要重新拉取代码并重新构建前端："
    echo "   1. cd /opt/finapp/releases/$LATEST_RELEASE"
    echo "   2. git pull origin master"
    echo "   3. bash scripts/fix-production-frontend-config.sh"
else
    echo "   ✅ 后端和数据库都正常"
    echo "   ✅ 前端构建配置正确"
    echo "   "
    echo "   如果浏览器中仍然显示为空，请："
    echo "   1. 清除浏览器缓存 (Ctrl+Shift+Delete)"
    echo "   2. 或使用隐私模式 (Ctrl+Shift+N)"
    echo "   3. 重新访问 http://apollo123.cloud:3001"
fi
echo ""
