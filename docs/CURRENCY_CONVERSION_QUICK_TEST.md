# 投资组合币种转换功能 - 快速测试指南

## 功能说明

实现了投资组合持仓明细的多币种支持：
1. **每个资产显示其自身币种**：从assets表获取资产的实际币种
2. **汇总时自动转换**：计算总市值、总收益时，自动将所有资产转换为投资组合的基础币种

## 修改内容

### 后端修改

#### 1. HoldingService.ts
- ✅ 添加ExchangeRateService依赖
- ✅ 修改`getHoldingsByPortfolio`方法
  - 从assets表获取资产币种
  - 批量查询所需汇率
  - 计算转换后的金额（convertedMarketValue, convertedTotalCost, convertedUnrealizedPnL）
- ✅ 修改`getHoldingById`方法
  - 添加币种转换逻辑
- ✅ 修改`getPortfolioHoldingSummary`方法
  - 使用转换后的金额进行汇总

#### 2. Holding接口
新增字段：
```typescript
currency: string;              // 资产币种（从assets表）
portfolioCurrency?: string;    // 投资组合基础币种
exchangeRate?: number;         // 汇率
convertedMarketValue?: number; // 转换后的市值
convertedTotalCost?: number;   // 转换后的总成本
convertedUnrealizedPnL?: number; // 转换后的未实现盈亏
```

### 前端修改

#### 1. HoldingsTable.tsx
- ✅ 市值列：显示原币种金额 + 转换后金额（如果币种不同）
- ✅ 盈亏列：显示原币种盈亏 + 转换后盈亏（如果币种不同）
- ✅ 数据转换：添加新字段的映射

#### 2. 类型定义
- ✅ `frontend/src/types/portfolio.ts` - 更新Holding接口
- ✅ `frontend/src/services/holdingService.ts` - 更新Holding接口

## 测试步骤

### 准备测试数据

1. **确保有多币种的汇率数据**
```sql
-- 查看现有汇率
SELECT * FROM exchange_rates ORDER BY rate_date DESC LIMIT 10;

-- 如果缺少汇率，插入测试数据
INSERT INTO exchange_rates (from_currency, to_currency, rate, rate_date, data_source)
VALUES 
  ('USD', 'CNY', 7.25, CURRENT_DATE, 'manual'),
  ('HKD', 'CNY', 0.93, CURRENT_DATE, 'manual'),
  ('EUR', 'CNY', 7.85, CURRENT_DATE, 'manual'),
  ('JPY', 'CNY', 0.05, CURRENT_DATE, 'manual')
ON CONFLICT (from_currency, to_currency, rate_date) 
DO UPDATE SET rate = EXCLUDED.rate;
```

2. **确保有不同币种的资产**
```sql
-- 查看资产币种分布
SELECT currency, COUNT(*) as count 
FROM assets 
WHERE is_active = true 
GROUP BY currency;

-- 如果需要，可以修改某些资产的币种用于测试
UPDATE assets 
SET currency = 'USD' 
WHERE symbol IN ('AAPL', 'TSLA', 'MSFT');

UPDATE assets 
SET currency = 'HKD' 
WHERE symbol IN ('00700', '09988');
```

3. **确保positions表的currency与assets表一致**
```sql
-- 同步positions表的currency字段
UPDATE positions p
SET currency = a.currency
FROM assets a
WHERE p.asset_id = a.id
  AND p.currency != a.currency;
```

### 运行测试

#### 方法1：使用测试脚本
```bash
# 运行自动化测试脚本
./test-currency-conversion.sh
```

#### 方法2：手动API测试

1. **获取持仓明细**
```bash
curl -X GET "http://localhost:8000/api/holdings/portfolio/{portfolioId}" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
```

预期响应：
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "assetSymbol": "AAPL",
      "assetName": "Apple Inc.",
      "currency": "USD",
      "portfolioCurrency": "CNY",
      "exchangeRate": 7.25,
      "marketValue": 17500.00,
      "convertedMarketValue": 126875.00,
      "unrealizedPnL": 1750.00,
      "convertedUnrealizedPnL": 12687.50
    },
    {
      "id": "...",
      "assetSymbol": "000001",
      "assetName": "平安银行",
      "currency": "CNY",
      "portfolioCurrency": "CNY",
      "exchangeRate": 1.0,
      "marketValue": 12500.00,
      "convertedMarketValue": 12500.00,
      "unrealizedPnL": 200.00,
      "convertedUnrealizedPnL": 200.00
    }
  ]
}
```

2. **获取投资组合汇总**
```bash
curl -X GET "http://localhost:8000/api/holdings/portfolio/{portfolioId}/summary" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "totalValue": 139375.00,
    "totalCost": 127800.00,
    "totalGainLoss": 11575.00,
    "totalGainLossPercent": 9.06,
    "assetCount": 2,
    "currency": "CNY"
  }
}
```

#### 方法3：前端界面测试

1. 启动服务
```bash
# 启动后端
cd backend && npm run dev

# 启动前端
cd frontend && npm start
```

2. 访问投资组合详情页面
   - 导航到：http://localhost:3001/portfolio/{portfolioId}
   - 查看"持仓明细"标签页

3. **验证点**：
   - ✅ 每个资产显示其自身币种（USD、CNY、HKD等）
   - ✅ 不同币种的资产在市值列下方显示转换后的金额（灰色小字）
   - ✅ 盈亏列也显示转换后的金额
   - ✅ 页面顶部的汇总数据使用投资组合基础币种（CNY）

## 验证清单

### 后端验证
- [ ] `getHoldingsByPortfolio`返回的数据包含`portfolioCurrency`和`exchangeRate`
- [ ] 不同币种的资产有正确的`convertedMarketValue`
- [ ] 同币种的资产`exchangeRate`为1.0
- [ ] `getPortfolioHoldingSummary`返回的总金额是转换后的汇总

### 前端验证
- [ ] 持仓明细表格显示资产原币种
- [ ] 不同币种资产显示转换提示（≈ XXX CNY）
- [ ] 汇总数据显示投资组合基础币种
- [ ] 排序和筛选功能正常工作

### 边界情况验证
- [ ] 汇率不存在时使用默认值1.0
- [ ] 同币种资产不显示转换提示
- [ ] 空投资组合正确处理
- [ ] 多种币种混合时汇总正确

## 常见问题

### Q1: 汇率数据缺失怎么办？
**A**: 系统会使用默认汇率1.0，并在日志中记录警告。建议：
- 检查exchange_rates表是否有对应币种对的数据
- 使用ExchangeRateService手动添加汇率
- 配置自动汇率更新服务

### Q2: positions表的currency字段不一致？
**A**: 运行同步脚本：
```sql
UPDATE positions p
SET currency = a.currency
FROM assets a
WHERE p.asset_id = a.id;
```

### Q3: 前端显示的转换金额不正确？
**A**: 检查：
1. 后端API返回的数据是否包含`convertedMarketValue`等字段
2. 前端数据映射是否正确
3. 浏览器控制台是否有错误

### Q4: 汇总金额与手动计算不一致？
**A**: 确认：
1. 所有持仓都使用了正确的汇率
2. 汇率数据是最新的
3. 没有遗漏任何持仓

## 性能优化建议

1. **汇率缓存**：考虑在ExchangeRateService中添加缓存
2. **批量查询**：当前已实现批量获取汇率，避免N+1查询
3. **数据库索引**：确保exchange_rates表有合适的索引

## 后续优化

1. **汇率历史**：支持查看历史汇率
2. **实时汇率**：集成第三方汇率API
3. **币种选择**：允许用户选择显示币种
4. **汇率提醒**：汇率大幅波动时提醒用户

## 相关文档

- [完整实现方案](./PORTFOLIO_CURRENCY_CONVERSION_IMPLEMENTATION.md)
- [数据库架构](./DATABASE_ARCHITECTURE.md)
- [API文档](./docs/api/)
