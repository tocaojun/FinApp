# Currency 修复快速参考

## 🚀 快速验证

```bash
# 运行测试脚本
./test-currency-fix.sh
```

## 📋 问题概述

**问题**: Position 和 Transaction 的 currency 与 Asset 不一致

**根源**: 前端硬编码 `currency: 'CNY'`，后端未验证

**影响**: 6个资产，7个持仓，成本计算错误

## ✅ 已完成的修复

### 1. 历史数据 ✅
```sql
-- 执行脚本
psql ... -f fix-currency-inconsistency.sql
```

### 2. 后端代码 ✅
- `TransactionService.ts`: 从 asset 表获取 currency
- `PositionService.ts`: 从 asset 表获取 currency

### 3. 前端代码 ✅
- `TransactionManagement.tsx`: 使用 asset.currency

### 4. 数据库约束 ✅
```sql
-- 执行脚本
psql ... -f add-currency-consistency-trigger.sql
```

## 🔍 验证命令

### 检查持仓一致性
```bash
cd backend && npx ts-node -e "
import { databaseService } from './src/services/DatabaseService';
(async () => {
  await databaseService.connect();
  const result = await databaseService.executeRawQuery(\`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN p.currency != a.currency THEN 1 ELSE 0 END) as inconsistent
    FROM finapp.positions p
    JOIN finapp.assets a ON p.asset_id = a.id
  \`, []);
  console.log('总持仓:', result[0].total);
  console.log('不一致:', result[0].inconsistent);
  await databaseService.disconnect();
})();
"
```

### 检查特定资产
```bash
cd backend && npx ts-node -e "
import { databaseService } from './src/services/DatabaseService';
(async () => {
  await databaseService.connect();
  const result = await databaseService.executeRawQuery(\`
    SELECT a.symbol, a.currency as asset_currency, p.currency as position_currency
    FROM finapp.positions p
    JOIN finapp.assets a ON p.asset_id = a.id
    WHERE a.symbol = 'BILI'
  \`, []);
  console.log(result);
  await databaseService.disconnect();
})();
"
```

## 📐 设计原则

### Currency 的黄金法则

1. **单一数据源**: Currency 只在 asset 表定义
2. **自动获取**: 从 asset 表查询，不依赖外部传入
3. **验证修正**: 发现不一致时记录警告并修正
4. **多层防护**: 前端 + 后端 + 数据库
5. **明确警告**: 记录详细日志

### 正确的代码模式

#### 前端
```typescript
// ✅ 正确
const asset = assets.find(a => a.id === assetId);
const currency = asset.currency;

// ❌ 错误
const currency = 'CNY';  // 硬编码
```

#### 后端
```typescript
// ✅ 正确
const assetResult = await databaseService.executeRawQuery(
  'SELECT currency FROM finapp.assets WHERE id = $1::uuid',
  [assetId]
);
const currency = assetResult[0].currency;

// ❌ 错误
const currency = request.currency;  // 直接使用外部传入
```

## 🔧 如果发现新的不一致

### 步骤1: 检查数据
```sql
SELECT 
  a.symbol,
  a.currency as asset_currency,
  p.currency as position_currency
FROM finapp.positions p
JOIN finapp.assets a ON p.asset_id = a.id
WHERE p.currency != a.currency;
```

### 步骤2: 修复数据
```sql
UPDATE finapp.positions p
SET currency = a.currency
FROM finapp.assets a
WHERE p.asset_id = a.id
  AND p.currency != a.currency;
```

### 步骤3: 检查代码
- 前端是否使用 asset.currency？
- 后端是否从 asset 表查询？
- 是否有硬编码的 currency？

### 步骤4: 检查日志
```bash
# 查看后端日志，搜索警告
grep "Currency Mismatch" backend/logs/*.log
```

## 📚 相关文档

- `CURRENCY_LOGIC_FIX_COMPLETE.md` - 完整修复报告
- `CURRENCY_LOGIC_FIX_PLAN.md` - 修复计划
- `CURRENCY_CONSISTENCY_FIX.md` - 历史数据修复

## 🆘 常见问题

### Q: 为什么不能简单修改 currency 字段？
A: 因为涉及汇率转换。如果 currency 错了，金额的含义就错了。

### Q: 修复后会影响历史数据吗？
A: 不会。我们只修改了 currency 标记，金额数值保持不变。

### Q: 如何确保未来不再出现？
A: 三层防护：
1. 前端使用 asset.currency
2. 后端从 asset 表查询
3. 数据库触发器自动修正

### Q: 如果前端传入错误的 currency 会怎样？
A: 后端会记录警告日志，并使用正确的 currency。

### Q: 数据库触发器会影响性能吗？
A: 影响很小。触发器只在 INSERT/UPDATE position 时执行一次简单查询。

## 🎯 测试清单

创建新交易时，验证：
- [ ] 前端显示正确的 currency
- [ ] 提交的数据包含正确的 currency
- [ ] 后端日志没有警告
- [ ] 数据库中的 currency 正确
- [ ] Position 的 currency 与 Asset 一致

## 📞 联系方式

如有问题，请查看：
- 完整文档: `CURRENCY_LOGIC_FIX_COMPLETE.md`
- 测试脚本: `test-currency-fix.sh`
- 修复脚本: `fix-currency-inconsistency.sql`
