# 多账户持仓计算修复

## 问题描述

用户指出**腾讯控股**的成本计算逻辑有问题：该资产在**两个不同的交易账户**中分别进行了购买，应该**按账户分别统计**，而不是合并计算。

## 问题分析

### 原始问题
之前的修复脚本在计算持仓成本时，将同一资产在不同账户的交易**合并计算**了：

```typescript
// ❌ 错误的做法：合并所有账户的交易
SELECT SUM(quantity), SUM(total_amount)
FROM transactions
WHERE asset_id = '...'  // 没有按 trading_account_id 分组
```

这导致：
1. 如果一个资产在多个账户都有持仓，会被错误地合并
2. 持仓表中应该有多条记录（每个账户一条），但可能只有一条或数据不正确

### 腾讯控股的情况

**账户1: 美股账户**
- 买入: 18,296股，总金额: 7,285,324.26元
- 卖出: 7,500股
- 剩余: 10,796股
- 平均成本: 398.19元
- 总成本: 4,298,882.85元

**账户2: 港股账户**  
- 买入: 0股（无交易记录）
- 持仓: 100股（孤立数据，已设为非活跃）

**之前的错误修复**：
- 将两个账户的数据合并，导致美股账户的持仓数据不正确

## 修复方案

### 核心原则
**持仓必须按 (asset_id, trading_account_id) 的组合分别计算**

### 修复逻辑

```typescript
// ✅ 正确的做法：按账户分别计算
for each (asset_id, trading_account_id) combination {
  // 计算该账户对该资产的买入
  const buyQty = SUM(quantity) WHERE asset_id AND trading_account_id AND is_buy
  const buyValue = SUM(total_amount) WHERE asset_id AND trading_account_id AND is_buy
  
  // 计算该账户对该资产的卖出
  const sellQty = SUM(quantity) WHERE asset_id AND trading_account_id AND is_sell
  
  // 计算该账户的持仓
  const correctQty = buyQty - sellQty
  const correctAvgCost = buyValue / buyQty  // 平均成本基于买入
  const correctTotalCost = correctQty * correctAvgCost
  
  // 更新该账户的持仓记录
  UPDATE positions 
  SET quantity = correctQty, average_cost = correctAvgCost, total_cost = correctTotalCost
  WHERE asset_id = ... AND trading_account_id = ...
}
```

## 修复结果

### 腾讯控股 - 美股账户
- ✅ 数量: 10,796股
- ✅ 平均成本: 398.19元
- ✅ 总成本: 4,298,882.85元

### 腾讯控股 - 港股账户
- ✅ 数量: 100股（已设为非活跃，因为无对应交易）
- ✅ 不影响活跃持仓统计

## 验证结果

运行全局审计（按账户分别验证）：
```
✅ 所有持仓的成本计算都正确！（按账户分别验证）
审计完成: 检查了 9 个持仓
```

## 数据库设计验证

### positions表的主键/唯一约束
持仓表应该有以下唯一约束：
```sql
UNIQUE (portfolio_id, trading_account_id, asset_id)
```

这确保了：
- 同一投资组合中
- 同一交易账户中
- 同一资产
- 只能有一条活跃持仓记录

## 其他资产检查

检查了其他有卖出交易的资产：
- **京东集团-SW**: 1个账户 ✅
- **美团-W**: 1个账户 ✅
- **哔哩哔哩**: 1个账户 ✅

只有腾讯控股涉及多个账户，其他资产都只在单一账户交易。

## 经验教训

### 1. 持仓计算必须考虑账户维度
在计算持仓时，必须按 `(asset_id, trading_account_id)` 组合分别计算，不能简单地按 `asset_id` 合并。

### 2. 审计脚本也要按账户验证
审计脚本在验证持仓正确性时，也必须按账户分别验证：
```typescript
// ❌ 错误
WHERE asset_id = '...'

// ✅ 正确  
WHERE asset_id = '...' AND trading_account_id = '...'
```

### 3. 数据库约束很重要
确保数据库有正确的唯一约束，防止同一账户对同一资产创建多条活跃持仓。

## 代码改进建议

### PositionService 改进
确保所有持仓操作都基于 `(portfolioId, tradingAccountId, assetId)` 三元组：

```typescript
async getPosition(
  portfolioId: string,
  tradingAccountId: string,  // 必须参数
  assetId: string
): Promise<Position | null> {
  const query = `
    SELECT * FROM finapp.positions 
    WHERE portfolio_id = $1::uuid 
      AND trading_account_id = $2::uuid 
      AND asset_id = $3::uuid
      AND is_active = true
  `;
  // ...
}
```

### 审计工具改进
创建按账户审计的工具：

```typescript
async auditPositionsByAccount(): Promise<AuditReport> {
  // 获取所有 (asset_id, trading_account_id) 组合
  const combinations = await this.getAllAssetAccountCombinations();
  
  for (const combo of combinations) {
    // 按账户分别验证
    const calculated = await this.calculatePositionFromTransactions(
      combo.assetId, 
      combo.tradingAccountId
    );
    const stored = await this.getStoredPosition(
      combo.assetId, 
      combo.tradingAccountId
    );
    
    // 对比验证
    this.comparePositions(calculated, stored);
  }
}
```

## 总结

本次修复解决了多账户持仓计算的问题：
1. ✅ 识别了腾讯控股在两个账户的持仓情况
2. ✅ 按账户分别重新计算了持仓数据
3. ✅ 更新了审计逻辑，按账户分别验证
4. ✅ 所有9个活跃持仓的数据都已正确

**关键原则**: 持仓计算和验证都必须基于 `(asset_id, trading_account_id)` 组合，不能简单地按资产合并。

---

**修复时间**: 2025-10-29  
**修复状态**: ✅ 已完成并验证
