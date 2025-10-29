# 投资组合持仓明细币种转换实现方案

## 需求说明

投资组合中的"持仓明细"需要修改逻辑：
1. **每个资产条目显示其自身币种**：每个持仓资产应该显示该产品对应的币种（从assets表的currency字段获取）
2. **汇总时进行币种转换**：计算"总市值"、"总收益"、"总收益率"时，按照货币币种和汇率折算为投资组合的基础币种

## 当前架构分析

### 数据库表结构

1. **portfolios表**：包含`base_currency`字段（投资组合基础币种）
2. **assets表**：包含`currency`字段（资产币种，如CNY、USD、HKD等）
3. **positions表**：包含`currency`字段（当前存储的是持仓币种）
4. **exchange_rates表**：存储汇率数据
   - `from_currency`: 源币种
   - `to_currency`: 目标币种
   - `rate`: 汇率
   - `rate_date`: 汇率日期

### 当前问题

1. **positions表的currency字段**：当前可能不一致，应该从assets表获取
2. **汇总计算**：当前`getPortfolioHoldingSummary`方法直接求和，没有考虑币种转换
3. **前端显示**：需要同时显示原币种金额和转换后的投资组合币种金额

## 实现方案

### 1. 后端修改

#### 1.1 HoldingService.ts - getHoldingsByPortfolio方法

**修改点**：
- 从assets表获取资产币种（而不是positions表）
- 查询投资组合的base_currency
- 为每个持仓添加汇率信息
- 保持原币种的金额显示

```typescript
// 查询时JOIN assets表获取资产币种
SELECT 
  p.id,
  p.portfolio_id,
  p.trading_account_id,
  p.asset_id,
  p.quantity,
  p.average_cost,
  p.total_cost,
  p.currency as position_currency, -- 保留用于兼容
  a.currency as asset_currency,    -- 资产实际币种
  po.base_currency as portfolio_currency, -- 投资组合基础币种
  -- ... 其他字段
FROM positions p
JOIN assets a ON p.asset_id = a.id
JOIN portfolios po ON p.portfolio_id = po.id
```

#### 1.2 HoldingService.ts - getPortfolioHoldingSummary方法

**修改点**：
- 获取每个持仓的资产币种
- 查询对应的汇率
- 将所有金额转换为投资组合基础币种后再汇总

```typescript
// 伪代码逻辑
for each position:
  asset_currency = position.asset_currency
  portfolio_currency = portfolio.base_currency
  
  if asset_currency == portfolio_currency:
    converted_value = market_value
  else:
    exchange_rate = getLatestRate(asset_currency, portfolio_currency)
    converted_value = market_value * exchange_rate
  
  total_value += converted_value
  total_cost += converted_cost
```

#### 1.3 ExchangeRateService.ts - 添加批量查询方法

```typescript
// 批量获取汇率，提高性能
async getBatchRates(
  currencyPairs: Array<{from: string, to: string}>,
  rateDate?: string
): Promise<Map<string, number>>
```

### 2. 前端修改

#### 2.1 HoldingsTable.tsx

**修改点**：
- 显示资产原币种的金额
- 在汇总行显示转换后的投资组合币种金额
- 添加汇率信息提示

```typescript
// 列定义修改
{
  title: '市值',
  render: (value, record) => (
    <div>
      <div>{formatCurrency(value, record.currency)}</div>
      {record.currency !== portfolioBaseCurrency && (
        <div style={{ fontSize: '12px', color: '#999' }}>
          ≈ {formatCurrency(value * exchangeRate, portfolioBaseCurrency)}
        </div>
      )}
    </div>
  )
}
```

#### 2.2 PortfolioOverview组件

**修改点**：
- 汇总数据使用转换后的金额
- 显示币种转换说明

### 3. 数据一致性

#### 3.1 positions表currency字段更新

建议添加数据库触发器或定期同步脚本，确保positions.currency与assets.currency一致：

```sql
-- 更新positions表的currency字段
UPDATE positions p
SET currency = a.currency
FROM assets a
WHERE p.asset_id = a.id
  AND p.currency != a.currency;
```

## 实现步骤

### Phase 1: 后端核心逻辑（优先）

1. ✅ 修改`HoldingService.getHoldingsByPortfolio`
   - 添加assets.currency和portfolios.base_currency到查询
   - 返回数据中包含asset_currency和portfolio_currency

2. ✅ 修改`HoldingService.getPortfolioHoldingSummary`
   - 实现币种转换逻辑
   - 使用ExchangeRateService获取汇率
   - 将所有金额转换为投资组合基础币种

3. ✅ 在ExchangeRateService中添加辅助方法
   - `getLatestRate`: 获取最新汇率
   - `convertAmount`: 金额转换方法

### Phase 2: 前端显示优化

1. ✅ 修改HoldingsTable组件
   - 显示原币种金额
   - 添加转换后金额提示
   - 汇总行显示投资组合币种

2. ✅ 修改PortfolioOverview组件
   - 使用转换后的汇总数据
   - 添加币种说明

### Phase 3: 数据一致性维护

1. ✅ 创建数据同步脚本
2. ✅ 添加数据验证逻辑

## 测试场景

### 测试数据准备

1. 创建包含多币种资产的投资组合：
   - 投资组合基础币种：CNY
   - 资产1：平安银行（CNY）
   - 资产2：苹果股票（USD）
   - 资产3：腾讯股票（HKD）

2. 准备汇率数据：
   - USD/CNY: 7.25
   - HKD/CNY: 0.93

### 测试用例

1. **持仓明细显示**
   - ✅ 每个资产显示其自身币种
   - ✅ 不同币种资产正确显示

2. **汇总计算**
   - ✅ 总市值正确转换为CNY
   - ✅ 总收益正确计算
   - ✅ 总收益率正确计算

3. **边界情况**
   - ✅ 汇率不存在时的处理
   - ✅ 同币种资产（无需转换）
   - ✅ 汇率为0或异常值的处理

## API接口变更

### 响应数据结构变更

#### GET /api/holdings/:portfolioId

```typescript
// 原响应
{
  holdings: [{
    currency: "CNY",  // positions表的currency
    marketValue: 12500.00,
    // ...
  }]
}

// 新响应
{
  holdings: [{
    currency: "USD",  // assets表的currency（资产实际币种）
    marketValue: 1750.00,  // 原币种金额
    portfolioCurrency: "CNY",  // 投资组合基础币种
    exchangeRate: 7.25,  // 汇率
    convertedMarketValue: 12687.50,  // 转换后金额
    // ...
  }],
  summary: {
    totalValue: 125000.00,  // 已转换为投资组合币种
    totalCost: 100000.00,
    currency: "CNY",  // 投资组合基础币种
    // ...
  }
}
```

## 性能优化

1. **汇率缓存**：缓存当日汇率，避免重复查询
2. **批量查询**：一次性获取所有需要的汇率
3. **数据库索引**：确保exchange_rates表有合适的索引

## 注意事项

1. **汇率缺失处理**：如果某个币种对的汇率不存在，应该：
   - 记录警告日志
   - 返回错误提示或使用默认汇率1.0
   - 前端显示"汇率缺失"提示

2. **汇率时效性**：
   - 使用最新的汇率数据
   - 考虑添加汇率更新时间显示

3. **精度问题**：
   - 使用DECIMAL类型存储金额
   - 前端显示时保留2位小数

4. **向后兼容**：
   - 保持API接口向后兼容
   - 前端逐步迁移到新的数据结构
