# 投资组合"总市值"计算不统一问题分析

## 问题描述

投资组合页面的上部和下部显示的"总市值"计算方法不统一，特别是在计算**股票期权**价值时：

- **上部（PortfolioSelector）**：显示的总市值来自后端 `PortfolioService.getPortfolioSummary()` 的计算
- **下部（HoldingsTable）**：显示的总市值来自前端 `HoldingsTable` 对持仓明细求和

## 问题根源分析

### 1. 上部总市值计算 - PortfolioSelector.tsx

**位置**：`frontend/src/components/portfolio/PortfolioSelector.tsx` (第 71 行)

显示的是 `selectedPortfolio.totalValue`，该值来自：
```
const summary = await PortfolioService.getPortfolioSummaryById(portfolioId);
const portfolioWithSummary = {
  ...portfolio,
  totalValue: summary.totalValue || 0,
  ...
};
```

### 2. 上部总市值数据来源 - PortfolioService.getPortfolioSummary()

**位置**：`backend/src/services/PortfolioService.ts` (第 233-260 行)

```typescript
const positionsQuery = `
  SELECT 
    COUNT(DISTINCT p.id) as position_count,
    COUNT(DISTINCT p.asset_id) as unique_assets,
    COALESCE(SUM(p.total_cost), 0) as total_cost,
    COALESCE(SUM(p.quantity * COALESCE(ap.close_price, 0)), 0) as market_value,  // ⚠️ 问题在这里
    p.currency
  FROM finapp.positions p
  LEFT JOIN LATERAL (
    SELECT close_price 
    FROM finapp.asset_prices 
    WHERE asset_id = p.asset_id 
    ORDER BY price_date DESC 
    LIMIT 1
  ) ap ON true
  WHERE p.portfolio_id = $1::uuid AND p.is_active = true
  GROUP BY p.currency
`;
```

**问题**：
- ❌ **直接使用交易价格**（`ap.close_price`）计算所有资产的市值
- ❌ **未区分资产类型**，特别是对股票期权（STOCK_OPTION）没有特殊处理
- ❌ **股票期权应该使用内在价值来估算**，而不是简单的交易价格

### 3. 下部总市值计算 - HoldingsTable.tsx

**位置**：`frontend/src/components/portfolio/HoldingsTable.tsx` (第 268-274 行)

```typescript
// 下部汇总行 - 总市值
{formatCurrency(
  filteredHoldings.reduce((sum, h) => sum + (h.convertedMarketValue || h.marketValue || 0), 0),
  'CNY'
)}
```

数据来自前端已加载的持仓列表，该列表调用：
```typescript
const data = await HoldingService.getHoldingsByPortfolio(portfolioId);
```

### 4. 下部总市值数据来源 - HoldingService.getHoldingsByPortfolio()

**位置**：`backend/src/services/HoldingService.ts` (第 157-189 行)

**正确的计算逻辑**：
```typescript
// 股票期权特殊处理
if (row.asset_type_code === 'STOCK_OPTION') {
  const underlyingStockPrice = parseFloat(row.underlying_stock_price) || 0;
  const strikePrice = parseFloat(row.strike_price) || 0;
  const optionType = row.option_type;
  
  // 计算期权内在价值
  let intrinsicValue = 0;
  if (optionType === 'CALL') {
    intrinsicValue = Math.max(underlyingStockPrice - strikePrice, 0);  // ✅ 看涨期权
  } else if (optionType === 'PUT') {
    intrinsicValue = Math.max(strikePrice - underlyingStockPrice, 0);  // ✅ 看跌期权
  }
  
  // 期权的当前价格就是内在价值
  currentPrice = intrinsicValue;
  marketValue = quantity * intrinsicValue;  // ✅ 使用内在价值
} else {
  marketValue = quantity * currentPrice;  // 其他资产正常计算
}
```

## 统计结果对比

| 组件 | 位置 | 数据源 | 期权处理 | 计算方式 |
|-----|------|--------|---------|---------|
| **PortfolioSelector（上部）** | `frontend/src/components/portfolio/PortfolioSelector.tsx:71` | `PortfolioService.getPortfolioSummary()` | ❌ 未区分，直接用价格 | `Σ(quantity × close_price)` |
| **HoldingsTable（下部）** | `frontend/src/components/portfolio/HoldingsTable.tsx:268-274` | `HoldingService.getHoldingsByPortfolio()` | ✅ 使用内在价值 | `Σ(quantity × intrinsicValue)` |

## 具体问题示例

假设投资组合中有一个看涨期权（CALL）：
- 标的股票当前价格：100 元
- 行权价：95 元
- 持仓数量：10 份
- 期权内在价值：100 - 95 = 5 元
- **期权正确市值**：10 × 5 = 50 元

### 上部显示（错误）：
- 如果 asset_prices 表中该期权的 close_price 为 8 元（包含时间价值）
- 上部显示的市值：10 × 8 = **80 元** ❌

### 下部显示（正确）：
- 计算内在价值：max(100 - 95, 0) = 5 元
- 下部显示的市值：10 × 5 = **50 元** ✅

**结果**：同一个投资组合的总市值上部显示 80 元，下部显示 50 元，数据不一致！

## 核心问题代码位置汇总

| 文件 | 行号 | 问题描述 |
|------|-----|--------|
| `backend/src/services/PortfolioService.ts` | 253 | SQL 查询中直接用 `ap.close_price` 计算所有资产市值，未区分资产类型 |
| `backend/src/services/PortfolioService.ts` | 233-260 | 整个 `positionsQuery` 没有 CASE 语句来处理股票期权的特殊情况 |
| `backend/src/services/PortfolioService.ts` | 270-276 | 循环计算汇率转换时，直接用 `value`（即 market_value），没有验证该值的计算是否正确 |

## 建议修复方向（供参考）

修改 `PortfolioService.getPortfolioSummary()` 中的 SQL 查询，类似于 `HoldingService.getHoldingsByPortfolio()` 的做法：

1. 添加资产类型判断
2. 对股票期权（STOCK_OPTION）单独计算内在价值
3. 其他资产保持现有逻辑

这样可以确保上部显示的总市值与下部汇总的总市值保持一致。

---

**问题报告日期**：2025-11-10  
**报告者**：代码审查  
**严重级别**：中等（数据显示不一致，影响投资组合评估准确性）
