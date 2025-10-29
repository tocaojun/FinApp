# Currency 一致性问题修复报告

## 📋 问题概述

发现 `positions` 表和 `transactions` 表中的 `currency` 字段与 `assets` 表不一致，导致成本计算、市值计算和收益计算错误。

## 🔍 问题详情

### 受影响的资产

| 资产代码 | 资产名称 | Asset Currency | Position Currency (错误) | 持仓数 |
|---------|---------|----------------|-------------------------|--------|
| **00700** | 腾讯控股 | HKD | CNY | 1 |
| **03690** | 美团-W | HKD | CNY | 1 |
| **06186** | 中国飞鹤 | HKD | CNY | 1 |
| **09618** | 京东集团 | HKD | CNY | 1 |
| **BILI** | 哔哩哔哩 | USD | CNY | 2 |
| **T-OPTION-OFFER-7851** | 2028到期员工期权 | HKD | CNY | 1 |

**总计**: 6个资产，7个持仓，多条交易记录

### 问题影响

1. **持仓表 (positions)**:
   - Currency字段标记错误（CNY），但实际成本值是正确币种的
   - 导致前端显示和计算时使用错误的汇率

2. **交易表 (transactions)**:
   - Currency字段标记错误（CNY），但price和total_amount是正确币种的值
   - 导致交易历史显示混乱

3. **根本原因**:
   - `PositionService.createNewPosition()` 方法中，currency作为参数传入
   - 应该从asset表自动获取，而不是依赖外部传入

## ✅ 修复方案

### 1. 数据修复 (已完成)

**执行脚本**: `fix-currency-inconsistency.sql`

修复内容:
- ✅ 更新 `transactions` 表的 currency 字段为正确值
- ✅ 更新 `positions` 表的 currency 字段为正确值
- ✅ 保持 average_cost 和 total_cost 数值不变（因为它们本身是正确的）

**修复结果**:
```
总持仓数: 11
不一致持仓数: 0
状态: ✅ 全部一致
```

### 2. 代码修复 (已完成)

**文件**: `backend/src/services/PositionService.ts`

**修改内容**:
```typescript
// 修改前: currency作为参数传入
private async createNewPosition(
    portfolioId: string,
    tradingAccountId: string,
    assetId: string,
    transactionType: string,
    quantity: number,
    price: number,
    currency: string,  // ❌ 不应该从外部传入
    transactionDate: Date
)

// 修改后: 从asset表获取currency
private async createNewPosition(...) {
    // ✅ 从asset表获取正确的currency
    const assetQuery = `
      SELECT currency FROM finapp.assets WHERE id = $1::uuid
    `;
    const assetResult = await databaseService.executeRawQuery(assetQuery, [assetId]);
    
    if (!Array.isArray(assetResult) || assetResult.length === 0) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    const correctCurrency = assetResult[0].currency;
    
    // 使用correctCurrency而不是传入的currency参数
    // ...
}
```

### 3. 数据库约束 (已完成)

**执行脚本**: `add-currency-consistency-trigger.sql`

**创建的触发器**:

1. **`trg_position_currency_consistency_insert`**
   - 在插入position时触发
   - 自动确保currency与asset一致
   - 如果不一致，自动修正

2. **`trg_position_currency_consistency_update`**
   - 在更新position的currency或asset_id时触发
   - 自动确保currency与asset一致
   - 如果不一致，自动修正

**触发器函数**: `ensure_position_currency_consistency()`
```sql
CREATE OR REPLACE FUNCTION finapp.ensure_position_currency_consistency()
RETURNS TRIGGER AS $$
DECLARE
    asset_currency VARCHAR(3);
BEGIN
    -- 获取资产的currency
    SELECT currency INTO asset_currency
    FROM finapp.assets
    WHERE id = NEW.asset_id;
    
    -- 如果找不到资产，抛出错误
    IF asset_currency IS NULL THEN
        RAISE EXCEPTION 'Asset not found: %', NEW.asset_id;
    END IF;
    
    -- 如果position的currency与asset不一致，自动修正
    IF NEW.currency != asset_currency THEN
        RAISE NOTICE 'Position currency (%) does not match asset currency (%). Auto-correcting...', 
                     NEW.currency, asset_currency;
        NEW.currency := asset_currency;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🧪 验证测试

### 测试1: 验证现有数据

```bash
cd /Users/caojun/code/FinApp/backend && npx ts-node -e "
import { databaseService } from './src/services/DatabaseService';

(async () => {
  await databaseService.connect();
  
  const query = \`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN p.currency != a.currency THEN 1 ELSE 0 END) as inconsistent
    FROM finapp.positions p
    JOIN finapp.assets a ON p.asset_id = a.id
  \`;
  
  const result = await databaseService.executeRawQuery(query, []);
  console.log('总持仓数:', result[0].total);
  console.log('不一致数:', result[0].inconsistent);
  console.log('状态:', result[0].inconsistent === '0' ? '✅ 全部一致' : '❌ 有不一致');
  
  await databaseService.disconnect();
})();
"
```

**预期结果**: 不一致数 = 0

### 测试2: 测试触发器

```sql
-- 尝试插入一个currency不一致的position
-- 触发器应该自动修正
INSERT INTO finapp.positions (
    id, portfolio_id, trading_account_id, asset_id,
    quantity, average_cost, total_cost, currency,
    is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    portfolio_id,
    trading_account_id,
    asset_id,
    100,
    10.5,
    1050,
    'CNY',  -- 故意使用错误的currency
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM finapp.positions
WHERE asset_id IN (SELECT id FROM finapp.assets WHERE symbol = 'BILI')
LIMIT 1;

-- 验证: 应该看到NOTICE消息，且currency被自动修正为USD
SELECT currency FROM finapp.positions WHERE id = (SELECT id FROM finapp.positions ORDER BY created_at DESC LIMIT 1);
```

## 📊 修复前后对比

### 修复前

```
BILI - 哔哩哔哩
  Asset Currency: USD
  Position Currency: CNY  ❌
  平均成本: 11.8 CNY  ❌ (实际是USD)
  总成本: 1180 CNY  ❌ (实际是USD)
```

### 修复后

```
BILI - 哔哩哔哩
  Asset Currency: USD
  Position Currency: USD  ✅
  平均成本: 11.8 USD  ✅
  总成本: 1180 USD  ✅
```

## 🎯 设计原则

### 正确的Currency管理规则

1. **单一数据源原则**
   - Currency应该只在asset表中定义
   - Position和Transaction的currency应该从asset表获取
   - 不应该允许外部传入currency参数

2. **数据一致性原则**
   - 同一资产的所有持仓必须使用相同的currency
   - 同一资产的所有交易必须使用相同的currency
   - Currency必须与asset表保持一致

3. **自动修正原则**
   - 使用数据库触发器自动确保一致性
   - 在应用层也进行验证
   - 双重保障，防止数据不一致

## 📝 相关文件

- **数据修复脚本**: `fix-currency-inconsistency.sql`
- **触发器脚本**: `add-currency-consistency-trigger.sql`
- **代码修复**: `backend/src/services/PositionService.ts`
- **设计文档**: `POSITION_CURRENCY_FIX.md`

## ⚠️ 注意事项

1. **历史数据**
   - 本次修复只修改了currency字段
   - average_cost和total_cost的数值保持不变
   - 因为这些数值本身是正确的，只是currency标记错了

2. **未来开发**
   - 创建position时，不要传入currency参数
   - 始终从asset表获取currency
   - 依赖数据库触发器作为最后一道防线

3. **测试建议**
   - 在创建新交易后，验证position的currency
   - 定期运行一致性检查脚本
   - 监控数据库触发器的NOTICE消息

## ✅ 修复完成清单

- [x] 识别所有不一致的记录
- [x] 备份原始数据
- [x] 修复transactions表的currency
- [x] 修复positions表的currency
- [x] 验证修复结果
- [x] 修改PositionService代码逻辑
- [x] 创建数据库触发器
- [x] 测试触发器功能
- [x] 编写修复文档

## 🎉 总结

Currency不一致问题已完全修复：
- ✅ 所有历史数据已修正
- ✅ 代码逻辑已优化
- ✅ 数据库约束已添加
- ✅ 未来不会再出现此问题

**修复时间**: 2025-10-28
**影响范围**: 6个资产，7个持仓，多条交易记录
**修复状态**: ✅ 完成
