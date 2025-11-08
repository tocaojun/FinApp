# Position Currency 设计规则与修复方案

## 📋 设计规则

### ✅ 正确的设计
**Position.currency 应该始终等于 Asset.currency**

**原因：**
1. 持仓的币种由资产本身决定，不应该由交易传入
2. 同一资产的所有持仓应该使用相同的币种
3. 例如：
   - 港股（如腾讯控股）的持仓币种应该是 HKD
   - A股（如贵州茅台）的持仓币种应该是 CNY
   - 美股（如苹果）的持仓币种应该是 USD

### ❌ 当前实现的问题

在 `PositionService.ts` 中，`createNewPosition()` 方法接受 `currency` 参数：

```typescript
private async createNewPosition(
    portfolioId: string,
    tradingAccountId: string,
    assetId: string,
    transactionType: string,
    quantity: number,
    price: number,
    currency: string,  // ❌ 不应该从外部传入
    transactionDate: Date
): Promise<Position>
```

这可能导致：
- 如果交易记录的 currency 与资产的 currency 不一致，会创建错误的持仓
- 同一资产可能有不同币种的持仓记录

## 🔍 当前数据状态

### 检查结果
```
总持仓数: 2
一致: 2
不一致: 0
```

✅ **当前数据是一致的**，但代码逻辑需要改进以防止未来出现问题。

## 🛠️ 修复方案

### 1. 修改 PositionService.createNewPosition()

**修改前：**
```typescript
private async createNewPosition(
    portfolioId: string,
    tradingAccountId: string,
    assetId: string,
    transactionType: string,
    quantity: number,
    price: number,
    currency: string,  // ❌ 从参数传入
    transactionDate: Date
): Promise<Position> {
    // ... 使用传入的 currency
}
```

**修改后：**
```typescript
private async createNewPosition(
    portfolioId: string,
    tradingAccountId: string,
    assetId: string,
    transactionType: string,
    quantity: number,
    price: number,
    transactionDate: Date  // ✅ 移除 currency 参数
): Promise<Position> {
    
    // ✅ 从 asset 表获取 currency
    const assetQuery = `
      SELECT currency FROM finapp.assets WHERE id = $1::uuid
    `;
    const assetResult = await databaseService.executeRawQuery(assetQuery, [assetId]);
    
    if (!assetResult || assetResult.length === 0) {
      throw new Error('Asset not found');
    }
    
    const currency = assetResult[0].currency;
    
    // 根据交易类型计算持仓数量
    const positionQuantity = this.isBuyTransaction(transactionType) ? quantity : -quantity;
    const totalCost = positionQuantity * price;
    const averageCost = price;

    // ... 其余代码保持不变
}
```

### 2. 更新调用 createNewPosition() 的地方

在 `createOrUpdatePosition()` 方法中：

**修改前：**
```typescript
return await this.createNewPosition(
  portfolioId,
  tradingAccountId,
  assetId,
  transactionType,
  quantity,
  price,
  currency,  // ❌ 传入 currency
  transactionDate
);
```

**修改后：**
```typescript
return await this.createNewPosition(
  portfolioId,
  tradingAccountId,
  assetId,
  transactionType,
  quantity,
  price,
  transactionDate  // ✅ 不传入 currency
);
```

### 3. 添加数据验证

在 Position 类型定义中添加注释：

```typescript
export interface Position {
  id: string;
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currency: string;  // 注意：此字段应始终等于对应 Asset 的 currency
  firstPurchaseDate?: Date;
  lastTransactionDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. 添加数据库约束（可选）

虽然 PostgreSQL 不直接支持跨表的 CHECK 约束，但可以创建触发器：

```sql
-- 创建触发器函数
CREATE OR REPLACE FUNCTION finapp.check_position_currency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.currency != (SELECT currency FROM finapp.assets WHERE id = NEW.asset_id) THEN
    RAISE EXCEPTION 'Position currency must match asset currency';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER ensure_position_currency_matches_asset
  BEFORE INSERT OR UPDATE ON finapp.positions
  FOR EACH ROW
  EXECUTE FUNCTION finapp.check_position_currency();
```

## 🔧 修复现有数据（如果需要）

如果发现不一致的数据，运行以下 SQL：

```sql
-- 修复不一致的 position currency
UPDATE finapp.positions p
SET currency = a.currency
FROM finapp.assets a
WHERE p.asset_id = a.id 
  AND p.currency != a.currency;

-- 验证修复结果
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN p.currency = a.currency THEN 1 END) as consistent,
  COUNT(CASE WHEN p.currency != a.currency THEN 1 END) as inconsistent
FROM finapp.positions p
JOIN finapp.assets a ON p.asset_id = a.id;
```

## 📊 验证脚本

创建验证脚本检查数据一致性：

```typescript
// scripts/verify-position-currency.ts
import { databaseService } from '../src/services/DatabaseService';

async function verifyPositionCurrency() {
  await databaseService.connect();
  
  const result = await databaseService.prisma.$queryRaw`
    SELECT 
      p.id,
      a.symbol,
      a.currency as asset_currency,
      p.currency as position_currency
    FROM finapp.positions p
    JOIN finapp.assets a ON p.asset_id = a.id
    WHERE p.currency != a.currency
  `;
  
  if (result.length === 0) {
    console.log('✓ All positions have correct currency');
  } else {
    console.error(`✗ Found ${result.length} positions with incorrect currency`);
    console.table(result);
  }
  
  await databaseService.disconnect();
}

verifyPositionCurrency();
```

## 🎯 总结

### 当前状态
- ✅ 数据库中的数据是一致的（2条持仓记录都正确）
- ⚠️ 代码逻辑存在隐患（currency 从参数传入）

### 建议行动
1. **立即修改** `PositionService.createNewPosition()` 方法，从 asset 表获取 currency
2. **更新调用处**，移除 currency 参数传递
3. **添加触发器**（可选），防止未来出现不一致
4. **定期验证**，确保数据一致性

### 优先级
- 🔴 高优先级：修改代码逻辑
- 🟡 中优先级：添加数据库触发器
- 🟢 低优先级：当前数据已一致，无需修复
