# 股票期权市值计算修复

## 问题描述

股票期权在投资组合页面中显示的市值为 0，成本计算也不正确。

## 根本原因

原有的持仓查询逻辑只是简单地从 `asset_prices` 表获取资产价格，但股票期权的价值计算方式不同：
- **普通资产**：市值 = 数量 × 当前价格
- **股票期权**：市值 = 数量 × (标的股票价格 - 行权价)

## 解决方案

### 1. 修改 SQL 查询

在 `HoldingService.ts` 的查询中添加股票期权特殊处理：

```sql
SELECT 
  -- 基础字段
  p.id, p.quantity, p.average_cost, p.total_cost,
  a.symbol, a.name,
  at.code as asset_type_code,
  
  -- 股票期权特殊字段
  sod.underlying_stock_id,
  sod.strike_price,
  sod.option_type,
  
  -- 计算当前价格：
  -- 对于股票期权，使用标的股票价格
  -- 对于其他资产，使用资产自身价格
  CASE 
    WHEN at.code = 'STOCK_OPTION' THEN
      COALESCE(
        (SELECT close_price FROM asset_prices 
         WHERE asset_id = sod.underlying_stock_id 
         ORDER BY price_date DESC LIMIT 1),
        0
      )
    ELSE
      COALESCE(ap.close_price, 0)
  END as current_price,
  
  -- 标的股票价格（仅用于股票期权）
  CASE 
    WHEN at.code = 'STOCK_OPTION' THEN
      COALESCE(
        (SELECT close_price FROM asset_prices 
         WHERE asset_id = sod.underlying_stock_id 
         ORDER BY price_date DESC LIMIT 1),
        0
      )
    ELSE NULL
  END as underlying_stock_price
  
FROM positions p
JOIN assets a ON p.asset_id = a.id
LEFT JOIN asset_types at ON a.asset_type_id = at.id
LEFT JOIN finapp.stock_option_details sod ON a.id = sod.asset_id
```

### 2. 修改市值计算逻辑

```typescript
// 股票期权特殊处理
if (row.asset_type_code === 'STOCK_OPTION') {
  const underlyingStockPrice = parseFloat(row.underlying_stock_price) || 0;
  const strikePrice = parseFloat(row.strike_price) || 0;
  const optionType = row.option_type;
  
  // 计算期权内在价值
  let intrinsicValue = 0;
  if (optionType === 'CALL') {
    // 看涨期权：max(标的价格 - 行权价, 0)
    intrinsicValue = Math.max(underlyingStockPrice - strikePrice, 0);
  } else if (optionType === 'PUT') {
    // 看跌期权：max(行权价 - 标的价格, 0)
    intrinsicValue = Math.max(strikePrice - underlyingStockPrice, 0);
  }
  
  // 期权的当前价格就是内在价值
  currentPrice = intrinsicValue;
  marketValue = quantity * intrinsicValue;
} else {
  // 其他资产：市值 = 数量 × 当前价格
  marketValue = quantity * currentPrice;
}
```

## 期权价值计算公式

### 看涨期权 (CALL)
- **内在价值** = max(标的股票价格 - 行权价, 0)
- **市值** = 内在价值 × 数量

**示例**：
- 标的股票价格：400 元
- 行权价：350 元
- 数量：100 张
- 内在价值 = max(400 - 350, 0) = 50 元
- 市值 = 50 × 100 = 5,000 元

### 看跌期权 (PUT)
- **内在价值** = max(行权价 - 标的股票价格, 0)
- **市值** = 内在价值 × 数量

**示例**：
- 标的股票价格：300 元
- 行权价：350 元
- 数量：100 张
- 内在价值 = max(350 - 300, 0) = 50 元
- 市值 = 50 × 100 = 5,000 元

## 成本计算

股票期权的成本计算保持不变：
- **总成本** = 平均成本 × 数量
- **平均成本** = 从交易记录中计算得出

## 盈亏计算

- **未实现盈亏** = (当前价格 - 平均成本) × 数量
- **未实现盈亏率** = 未实现盈亏 / 总成本 × 100%

其中：
- 对于股票期权，**当前价格** = 内在价值
- 对于其他资产，**当前价格** = 资产价格

## 修改的文件

- `backend/src/services/HoldingService.ts`
  - `getHoldingsByPortfolio()` - 获取投资组合持仓列表
  - `getHoldingById()` - 获取单个持仓详情

## 测试场景

### 场景 1：价内看涨期权
- 标的股票：腾讯控股 (00700)
- 当前价格：400 HKD
- 行权价：350 HKD
- 持仓数量：100 张
- **预期市值**：(400 - 350) × 100 = 5,000 HKD

### 场景 2：价外看涨期权
- 标的股票：腾讯控股 (00700)
- 当前价格：300 HKD
- 行权价：350 HKD
- 持仓数量：100 张
- **预期市值**：max(300 - 350, 0) × 100 = 0 HKD

### 场景 3：价内看跌期权
- 标的股票：腾讯控股 (00700)
- 当前价格：300 HKD
- 行权价：350 HKD
- 持仓数量：100 张
- **预期市值**：(350 - 300) × 100 = 5,000 HKD

## 注意事项

1. **简化计算**：当前实现只计算内在价值，不考虑时间价值
2. **价格来源**：标的股票价格从 `asset_prices` 表获取最新价格
3. **价格为 0**：如果标的股票没有价格数据，期权市值为 0
4. **负值处理**：使用 `Math.max()` 确保内在价值不为负

## 后续优化建议

1. **时间价值**：考虑加入 Black-Scholes 模型计算时间价值
2. **希腊字母**：利用已存储的 Delta、Gamma 等进行更精确的估值
3. **实时价格**：接入实时行情数据源
4. **历史波动率**：使用历史波动率优化估值

## 验证方法

1. 创建股票期权产品
2. 添加标的股票的价格数据
3. 创建股票期权交易
4. 查看投资组合页面
5. 验证市值 = (标的股票价格 - 行权价) × 数量
