#!/bin/bash

# 启用汇率自动同步功能

echo "======================================"
echo "启用汇率自动同步功能"
echo "======================================"
echo ""

# 检查.env文件是否存在
if [ ! -f "backend/.env" ]; then
  echo "❌ 未找到 backend/.env 文件"
  echo "请先创建 .env 文件"
  exit 1
fi

echo "1️⃣ 备份现有 .env 文件..."
cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ 备份完成"
echo ""

echo "2️⃣ 添加汇率自动更新配置..."

# 检查是否已存在配置
if grep -q "ENABLE_EXCHANGE_RATE_AUTO_UPDATE" backend/.env; then
  echo "⚠️  配置已存在，更新配置..."
  sed -i.bak 's/ENABLE_EXCHANGE_RATE_AUTO_UPDATE=.*/ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true/' backend/.env
else
  echo "" >> backend/.env
  echo "# 汇率自动更新配置" >> backend/.env
  echo "ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true" >> backend/.env
  echo "EXCHANGE_RATE_UPDATE_SCHEDULE=\"0 */4 * * *\"  # 每4小时更新一次" >> backend/.env
  echo "" >> backend/.env
  echo "# 外部API密钥（可选）" >> backend/.env
  echo "# FIXER_API_KEY=your_fixer_api_key" >> backend/.env
  echo "# CURRENCYLAYER_API_KEY=your_currencylayer_api_key" >> backend/.env
  echo "" >> backend/.env
  echo "# 汇率变动通知阈值" >> backend/.env
  echo "EXCHANGE_RATE_ALERT_THRESHOLD=2.0  # 变动超过2%时发送通知" >> backend/.env
fi

echo "✅ 配置已添加"
echo ""

echo "3️⃣ 修改 app.ts 启用自动更新..."

# 创建修改后的app.ts
cat > backend/src/app_with_exchange_rate.ts << 'EOF'
// 在 initialize 方法中添加以下代码：

public async initialize(): Promise<void> {
  try {
    // 初始化数据库连接
    await this.dbService.connect();
    logger.info('Database connected successfully');

    // 初始化缓存服务
    logger.info('Cache service initialized successfully');

    // 启动汇率自动更新服务
    if (process.env.ENABLE_EXCHANGE_RATE_AUTO_UPDATE === 'true') {
      const { exchangeRateUpdateService } = await import('./services/ExchangeRateUpdateService');
      const schedule = process.env.EXCHANGE_RATE_UPDATE_SCHEDULE || '0 */4 * * *';
      exchangeRateUpdateService.startAutoUpdate(schedule);
      logger.info('Exchange rate auto update service started');
    }

    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    throw error;
  }
}

// 在 shutdown 方法中添加以下代码：

public async shutdown(): Promise<void> {
  try {
    // 停止汇率自动更新服务
    if (process.env.ENABLE_EXCHANGE_RATE_AUTO_UPDATE === 'true') {
      const { exchangeRateUpdateService } = await import('./services/ExchangeRateUpdateService');
      exchangeRateUpdateService.stopAutoUpdate();
    }
    
    await this.dbService.disconnect();
    this.cacheService.close();
    logger.info('Application shutdown completed');
  } catch (error) {
    logger.error('Error during application shutdown:', error);
    throw error;
  }
}
EOF

echo "✅ 已生成修改示例文件: backend/src/app_with_exchange_rate.ts"
echo ""

echo "4️⃣ 显示当前配置..."
echo "----------------------------------------"
grep -A 10 "ENABLE_EXCHANGE_RATE_AUTO_UPDATE" backend/.env || echo "配置未找到"
echo "----------------------------------------"
echo ""

echo "======================================"
echo "✅ 配置完成"
echo "======================================"
echo ""
echo "📝 下一步操作："
echo ""
echo "1. 手动修改 backend/src/app.ts，参考 backend/src/app_with_exchange_rate.ts"
echo "   或者运行以下命令自动应用修改："
echo "   ./apply-exchange-rate-changes.sh"
echo ""
echo "2. 重启后端服务："
echo "   cd backend && npm run dev"
echo ""
echo "3. 查看日志确认自动更新已启动："
echo "   应该看到: 'Exchange rate auto update service started'"
echo ""
echo "4. 验证汇率数据："
echo "   SELECT * FROM exchange_rates ORDER BY created_at DESC LIMIT 10;"
echo ""
echo "📚 详细文档: EXCHANGE_RATE_AUTO_SYNC_STATUS.md"
echo ""
