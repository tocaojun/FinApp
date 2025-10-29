#!/bin/bash

# 验证汇率自动同步功能是否正确配置

echo "======================================"
echo "验证汇率自动同步功能配置"
echo "======================================"
echo ""

# 1. 检查.env配置
echo "1️⃣ 检查 .env 配置..."
if grep -q "ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true" backend/.env; then
  echo "✅ ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true"
else
  echo "❌ ENABLE_EXCHANGE_RATE_AUTO_UPDATE 未设置或未启用"
fi

if grep -q "EXCHANGE_RATE_UPDATE_SCHEDULE" backend/.env; then
  SCHEDULE=$(grep "EXCHANGE_RATE_UPDATE_SCHEDULE" backend/.env | cut -d'=' -f2)
  echo "✅ EXCHANGE_RATE_UPDATE_SCHEDULE=$SCHEDULE"
else
  echo "⚠️  EXCHANGE_RATE_UPDATE_SCHEDULE 未设置（将使用默认值）"
fi
echo ""

# 2. 检查app.ts是否导入了服务
echo "2️⃣ 检查 app.ts 导入..."
if grep -q "exchangeRateUpdateService" backend/src/app.ts; then
  echo "✅ exchangeRateUpdateService 已导入"
else
  echo "❌ exchangeRateUpdateService 未导入"
fi
echo ""

# 3. 检查initialize方法
echo "3️⃣ 检查 initialize 方法..."
if grep -q "exchangeRateUpdateService.startAutoUpdate" backend/src/app.ts; then
  echo "✅ startAutoUpdate 已调用"
else
  echo "❌ startAutoUpdate 未调用"
fi
echo ""

# 4. 检查shutdown方法
echo "4️⃣ 检查 shutdown 方法..."
if grep -q "exchangeRateUpdateService.stopAutoUpdate" backend/src/app.ts; then
  echo "✅ stopAutoUpdate 已调用"
else
  echo "❌ stopAutoUpdate 未调用"
fi
echo ""

# 5. 检查ExchangeRateUpdateService文件是否存在
echo "5️⃣ 检查服务文件..."
if [ -f "backend/src/services/ExchangeRateUpdateService.ts" ]; then
  echo "✅ ExchangeRateUpdateService.ts 存在"
else
  echo "❌ ExchangeRateUpdateService.ts 不存在"
fi
echo ""

# 6. 检查数据库表
echo "6️⃣ 检查数据库表..."
if command -v psql &> /dev/null; then
  DB_URL=$(grep "DATABASE_URL" backend/.env | cut -d'"' -f2)
  if [ ! -z "$DB_URL" ]; then
    echo "正在检查 exchange_rates 表..."
    # 提取数据库连接信息
    # 这里简化处理，实际使用时可能需要更复杂的解析
    echo "提示：请手动运行以下SQL验证："
    echo "SELECT COUNT(*) FROM exchange_rates;"
  fi
else
  echo "⚠️  psql 未安装，跳过数据库检查"
fi
echo ""

echo "======================================"
echo "配置验证完成"
echo "======================================"
echo ""
echo "📝 下一步："
echo ""
echo "1. 重启后端服务："
echo "   cd backend && npm run dev"
echo ""
echo "2. 查看日志确认启动："
echo "   应该看到: 'Exchange rate auto update service started with schedule: 0 */4 * * *'"
echo ""
echo "3. 手动触发一次更新测试（可选）："
echo "   在代码中调用: exchangeRateUpdateService.updateAllRates()"
echo ""
echo "4. 检查数据库中的汇率数据："
echo "   SELECT * FROM exchange_rates ORDER BY created_at DESC LIMIT 10;"
echo ""
