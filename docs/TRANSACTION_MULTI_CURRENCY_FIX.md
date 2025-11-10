# 交易统计多币种汇率转换修复

## 问题描述
在交易记录页面中，"交易总额"和"总手续费"统计直接相加不同币种的金额，导致统计数据不准确。

**错误示例**：
- USD 100 + CNY 500 + EUR 50 = 650（不正确，混淆了不同币种）

**正确方式**：
- USD 100 * 7.3 (汇率) = CNY 730
- CNY 500 = CNY 500  
- EUR 50 * 8.5 (汇率) = CNY 425
- **总计 = 1,655 CNY**

## 解决方案

### 后端改动

#### 新增 API 端点

**路由**: `GET /transactions/summary/stats-with-conversion`

**请求参数**:
- `portfolioId` (可选): 投资组合 ID
- `baseCurrency` (可选): 基础货币，默认 `CNY`

**响应格式**:
```typescript
{
  totalTransactions: number;           // 总交易数
  totalBuyAmount: number;              // 买入总额（已转换）
  totalSellAmount: number;             // 卖出总额（已转换）
  totalFees: number;                   // 总手续费（已转换）
  netCashFlow: number;                 // 净现金流（已转换）
  totalAmountInBaseCurrency: number;   // 总金额（已转换为基础货币）
  totalFeesInBaseCurrency: number;     // 总手续费（已转换为基础货币）
  currencyBreakdown: Array<{
    currency: string;                  // 币种代码
    totalAmount: number;               // 该币种的总交易额
    totalFees: number;                 // 该币种的总手续费
    exchangeRate: number;              // 使用的汇率
  }>;
}
```

#### 新增服务方法

**类**: `TransactionService`

**方法**: `getTransactionSummaryWithConversion(userId, portfolioId?, baseCurrency?)`

**实现逻辑**:
1. 获取用户的所有交易记录
2. 按币种分组统计金额和手续费
3. 从 `exchange_rates` 表获取最新的汇率数据
4. 将每种货币的金额乘以对应汇率，转换为基础货币
5. 合并所有转换后的数据

### 前端改动

#### 修改 TransactionService

新增方法 `getTransactionSummaryWithConversion(portfolioId?, baseCurrency?)`
- 调用新的后端 API 获取已转换的统计数据
- 返回 `TransactionSummaryWithConversion` 类型

#### 修改 TransactionManagement 页面

- 修改 `calculateStatistics` 为异步函数
- 优先调用新 API 获取支持汇率转换的统计数据
- 如果 API 失败，降级为本地计算（不支持汇率转换，仅作备选）
- 统计卡片显示的 `totalAmount` 和 `totalFees` 现在使用转换后的人民币值

### 数据流

```
交易页面加载
    ↓
fetchTransactions() 获取交易列表
    ↓
calculateStatistics() 
    ↓
调用 getTransactionSummaryWithConversion API
    ↓
后端查询 transactions 和 exchange_rates 表
    ↓
按币种分组 + 汇率转换
    ↓
返回已转换的统计数据（基础货币为 CNY）
    ↓
显示在统计卡片上
```

## 技术细节

### 汇率数据来源
- 表：`finapp.exchange_rates`
- 查询：获取最新的 `from_currency` → `to_currency` 的汇率
- 如果找不到汇率，使用默认值 1（需在前端提示）

### 支持的币种
系统支持从任何币种转换到指定的基础货币，前提是 `exchange_rates` 表中存在汇率数据。

### 性能考虑
- 后端一次查询获取所有交易记录（存在 N+1 问题的可能）
- 可优化：批量查询汇率数据，而不是逐个获取

## 测试步骤

1. 创建多币种交易（USD、EUR、JPY 等）
2. 导航到交易记录页面
3. 验证"交易总额"和"总手续费"是否正确转换为人民币
4. 检查 `currencyBreakdown` 中的汇率是否准确

## 已知限制

1. 如果 `exchange_rates` 表中不存在某币种的汇率，系统使用默认比率 1
2. 使用最新的汇率，而不是交易时的实际汇率（可改进）
3. 前端 TypeScript 编译有其他预先存在的错误，不影响此功能

## 文件修改列表

- `backend/src/services/TransactionService.ts`: 新增方法
- `backend/src/controllers/TransactionController.ts`: 新增控制器方法
- `backend/src/routes/transactions.ts`: 新增路由
- `frontend/src/services/transactionService.ts`: 新增方法和类型
- `frontend/src/pages/TransactionManagement.tsx`: 修改统计计算逻辑

## Git 提交

```
commit 6588e25
feat: 交易统计支持多币种汇率转换为人民币
```
