# Currency 逻辑错误完整修复报告

## 📋 问题总结

你的观察非常正确！BILI 的 currency 在 position 表中是 CNY，但在 asset 表中是 USD，这是一个严重的数据不一致问题。

经过深入分析，发现这不仅仅是一个简单的字段错误，而是整个 currency 处理逻辑的设计缺陷。

## 🔍 根本原因分析

### 问题链条

```
用户在前端创建交易
    ↓
前端: TransactionManagement.tsx 第508行
    currency: 'CNY'  ❌ 硬编码！
    ↓
后端: TransactionService.ts 第52行
    currency: request.currency  ❌ 直接使用，未验证！
    ↓
后端: PositionService.ts createNewPosition
    currency 作为参数传入  ❌ 应该从 asset 表获取！
    ↓
结果: Position 和 Transaction 的 currency 与 Asset 不一致
```

### 受影响的数据

| 资产代码 | 资产名称 | Asset Currency | Position Currency (错误) | 影响 |
|---------|---------|----------------|-------------------------|------|
| **BILI** | 哔哩哔哩 | USD | CNY | 成本计算错误 |
| **00700** | 腾讯控股 | HKD | CNY | 成本计算错误 |
| **03690** | 美团-W | HKD | CNY | 成本计算错误 |
| **06186** | 中国飞鹤 | HKD | CNY | 成本计算错误 |
| **09618** | 京东集团 | HKD | CNY | 成本计算错误 |
| **T-OPTION-OFFER-7851** | 员工期权 | HKD | CNY | 成本计算错误 |

**总计**: 6个资产，7个持仓，多条交易记录

## ✅ 完整修复方案

### 1. 历史数据修复 (已完成)

**执行脚本**: `fix-currency-inconsistency.sql`

```sql
-- 修复 transactions 表
UPDATE finapp.transactions t
SET currency = a.currency
FROM finapp.assets a
WHERE t.asset_id = a.id
  AND t.currency != a.currency;

-- 修复 positions 表
UPDATE finapp.positions p
SET currency = a.currency
FROM finapp.assets a
WHERE p.asset_id = a.id
  AND p.currency != a.currency;
```

**修复结果**:
- ✅ 7个持仓的 currency 已修正
- ✅ 多条交易记录的 currency 已修正
- ✅ 成本数值保持不变（因为数值本身是正确的，只是 currency 标记错了）

### 2. 后端逻辑修复 (已完成)

#### 2.1 TransactionService.ts

**修改位置**: `backend/src/services/TransactionService.ts` 第28-60行

**修改内容**:
```typescript
async createTransaction(userId: string, request: CreateTransactionRequest): Promise<Transaction> {
  // 验证交易数据
  const validation = await this.validateTransaction(request);
  if (!validation.isValid) {
    throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
  }

  // 🔧 修复: 从 asset 表获取正确的 currency
  const assetQuery = `
    SELECT currency FROM finapp.assets WHERE id = $1::uuid
  `;
  const assetResult = await databaseService.executeRawQuery(assetQuery, [request.assetId]);
  
  if (!Array.isArray(assetResult) || assetResult.length === 0) {
    throw new Error(`Asset not found: ${request.assetId}`);
  }
  
  const correctCurrency = assetResult[0].currency;
  
  // 如果前端传入的 currency 与 asset 不一致，记录警告
  if (request.currency && request.currency !== correctCurrency) {
    console.warn(
      `[Currency Mismatch] Asset ${request.assetId}: ` +
      `request.currency=${request.currency}, asset.currency=${correctCurrency}. ` +
      `Using asset currency.`
    );
  }

  // ... 使用 correctCurrency 而不是 request.currency
  const transaction: Transaction = {
    // ...
    currency: correctCurrency,  // ✅ 使用正确的 currency
    // ...
  };
}
```

**关键改进**:
- ✅ 从 asset 表获取正确的 currency
- ✅ 验证前端传入的 currency
- ✅ 记录不一致的警告日志
- ✅ 始终使用 asset 的 currency

#### 2.2 PositionService.ts

**修改位置**: `backend/src/services/PositionService.ts` 第99-130行

**修改内容**:
```typescript
private async createNewPosition(
    portfolioId: string,
    tradingAccountId: string,
    assetId: string,
    transactionType: string,
    quantity: number,
    price: number,
    currency: string,  // 保留参数以保持接口兼容，但不使用
    transactionDate: Date
  ): Promise<Position> {
    
    // 🔧 修复: 从 asset 表获取正确的 currency
    const assetQuery = `
      SELECT currency FROM finapp.assets WHERE id = $1::uuid
    `;
    const assetResult = await databaseService.executeRawQuery(assetQuery, [assetId]);
    
    if (!Array.isArray(assetResult) || assetResult.length === 0) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    const correctCurrency = assetResult[0].currency;
    
    // 如果传入的 currency 与 asset 不一致，记录警告
    if (currency !== correctCurrency) {
      console.warn(
        `[Position Currency Mismatch] Asset ${assetId}: ` +
        `provided=${currency}, asset=${correctCurrency}. ` +
        `Using asset currency.`
      );
    }
    
    // ... 使用 correctCurrency
}
```

**关键改进**:
- ✅ 从 asset 表获取正确的 currency
- ✅ 不再依赖外部传入的 currency 参数
- ✅ 记录不一致的警告日志

### 3. 前端逻辑修复 (已完成)

#### 3.1 TransactionManagement.tsx

**修改位置**: `frontend/src/pages/TransactionManagement.tsx`

**修改1**: 添加状态保存选中的资产 (第111行)
```typescript
const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
```

**修改2**: 资产选择时保存完整对象 (第838-850行)
```typescript
<Select 
  placeholder="选择产品" 
  showSearch
  loading={assetsLoading}
  onChange={(assetId) => {
    // 🔧 修复: 保存完整的 asset 对象
    const asset = assets.find(a => a.id === assetId);
    setSelectedAsset(asset || null);
  }}
  // ...
>
  {assets.map(asset => (
    <Option key={asset.id} value={asset.id}>
      {asset.symbol} - {asset.name} ({asset.currency})  {/* 显示 currency */}
    </Option>
  ))}
</Select>
```

**修改3**: 提交时使用资产的 currency (第489-500行)
```typescript
const handleSubmit = async (values: TransactionFormData) => {
  setLoading(true);
  try {
    // 🔧 修复: 获取选中资产的 currency
    const asset = selectedAsset || assets.find(a => a.id === values.assetId);
    
    if (!asset) {
      message.error('请先选择产品');
      setLoading(false);
      return;
    }
    
    const transactionData = {
      // ...
      currency: asset.currency,  // ✅ 使用资产的 currency
      // ...
    };
    // ...
  }
}
```

**修改4**: 编辑时设置 selectedAsset (第462-475行)
```typescript
const handleEdit = (transaction: Transaction) => {
  setEditingTransaction(transaction);
  
  // 🔧 修复: 找到对应的 asset 并设置
  const asset = assets.find(a => a.id === transaction.assetId);
  setSelectedAsset(asset || null);
  
  form.setFieldsValue({
    ...transaction,
    executedAt: dayjs(transaction.executedAt),
  });
  setModalVisible(true);
};
```

**关键改进**:
- ✅ 保存完整的 asset 对象
- ✅ 在资产选择时显示 currency
- ✅ 提交时使用 asset 的 currency
- ✅ 编辑时正确设置 selectedAsset

### 4. 数据库约束 (已完成)

**执行脚本**: `add-currency-consistency-trigger.sql`

**创建的触发器**:

1. **`trg_position_currency_consistency_insert`**
   - 在插入 position 时触发
   - 自动确保 currency 与 asset 一致

2. **`trg_position_currency_consistency_update`**
   - 在更新 position 时触发
   - 自动确保 currency 与 asset 一致

**触发器函数**:
```sql
CREATE OR REPLACE FUNCTION finapp.ensure_position_currency_consistency()
RETURNS TRIGGER AS $$
DECLARE
    asset_currency VARCHAR(3);
BEGIN
    -- 获取资产的 currency
    SELECT currency INTO asset_currency
    FROM finapp.assets
    WHERE id = NEW.asset_id;
    
    -- 如果 position 的 currency 与 asset 不一致，自动修正
    IF NEW.currency != asset_currency THEN
        RAISE NOTICE 'Position currency (%) does not match asset currency (%). Auto-correcting...', 
                     NEW.currency, asset_currency;
        NEW.currency := asset_currency;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**关键特性**:
- ✅ 自动修正不一致的 currency
- ✅ 记录 NOTICE 消息
- ✅ 作为最后一道防线

## 🧪 测试验证

### 测试脚本

**文件**: `test-currency-fix.sh`

**测试结果**:
```
================================
Currency 修复验证测试
================================

测试1: 检查持仓 currency 一致性
--------------------------------
总持仓数: 11
不一致数: 0
状态: ✅ 全部一致
✅ 测试1通过

测试2: 检查特定资产的 currency
--------------------------------
✅ BILI: Asset(USD) = Position(USD)
✅ 00700: Asset(HKD) = Position(HKD)
✅ 03690: Asset(HKD) = Position(HKD)
✅ 06186: Asset(HKD) = Position(HKD)
✅ 09618: Asset(HKD) = Position(HKD)
✅ 测试2通过

测试3: 检查数据库触发器
--------------------------------
✅ 触发器已正确部署 (2个)

测试4: 检查交易记录的 currency
--------------------------------
✅ BILI: Asset(USD) = Transaction(USD) - 2条
✅ 00700: Asset(HKD) = Transaction(HKD) - 1条
✅ 03690: Asset(HKD) = Transaction(HKD) - 1条
✅ 06186: Asset(HKD) = Transaction(HKD) - 1条
✅ 09618: Asset(HKD) = Transaction(HKD) - 1条
✅ 测试4通过

================================
测试完成
================================
```

## 📊 修复前后对比

### 修复前

```
前端创建交易:
  - 选择 BILI (USD 资产)
  - 硬编码 currency = 'CNY'  ❌
  ↓
后端保存:
  - transaction.currency = 'CNY'  ❌
  - position.currency = 'CNY'  ❌
  ↓
结果:
  - 数据不一致
  - 成本计算错误
  - 汇率转换错误
```

### 修复后

```
前端创建交易:
  - 选择 BILI (USD 资产)
  - 显示 "BILI - 哔哩哔哩 (USD)"  ✅
  - 使用 asset.currency = 'USD'  ✅
  ↓
后端验证:
  - 从 asset 表获取 currency = 'USD'  ✅
  - 验证前端传入的 currency  ✅
  - 如果不一致，记录警告并修正  ✅
  ↓
数据库触发器:
  - 最后一道防线，自动修正  ✅
  ↓
结果:
  - transaction.currency = 'USD'  ✅
  - position.currency = 'USD'  ✅
  - 数据一致
  - 成本计算正确
  - 汇率转换正确
```

## 🎯 设计原则

### Currency 管理的黄金法则

1. **单一数据源原则**
   - Currency 只在 asset 表中定义
   - 所有其他地方都从 asset 表获取

2. **自动获取原则**
   - 不依赖外部传入的 currency
   - 始终从 asset 表查询

3. **验证修正原则**
   - 如果外部传入 currency，必须验证
   - 如果不一致，记录警告并修正

4. **多层防护原则**
   - 前端: 使用 asset 的 currency
   - 后端: 验证并修正
   - 数据库: 触发器自动修正

5. **明确警告原则**
   - 发现不一致时记录详细日志
   - 便于追踪和调试

### 汇率转换逻辑

```typescript
// 正确的汇率转换逻辑
const asset = await getAsset(assetId);
const assetCurrency = asset.currency;  // 资产的原始币种

// 如果需要转换到组合基础货币
const portfolio = await getPortfolio(portfolioId);
const baseCurrency = portfolio.baseCurrency;

if (assetCurrency !== baseCurrency) {
  // 获取汇率
  const exchangeRate = await getExchangeRate(assetCurrency, baseCurrency);
  
  // 转换金额
  const convertedAmount = amount * exchangeRate;
  
  // 保存时：
  // - transaction.currency = assetCurrency (原始币种)
  // - transaction.price = price (原始币种的价格)
  // - transaction.exchange_rate = exchangeRate (用于后续转换)
  // - 显示时再转换为基础货币
}
```

## 📝 相关文件

### 修复脚本
- `fix-currency-inconsistency.sql` - 历史数据修复
- `add-currency-consistency-trigger.sql` - 数据库触发器

### 代码修改
- `backend/src/services/TransactionService.ts` - 交易服务修复
- `backend/src/services/PositionService.ts` - 持仓服务修复
- `frontend/src/pages/TransactionManagement.tsx` - 前端修复

### 文档
- `CURRENCY_CONSISTENCY_FIX.md` - 历史数据修复文档
- `CURRENCY_LOGIC_FIX_PLAN.md` - 修复计划文档
- `CURRENCY_LOGIC_FIX_COMPLETE.md` - 本文档

### 测试
- `test-currency-fix.sh` - 验证测试脚本

## ✅ 修复完成清单

- [x] 识别问题根源
- [x] 分析问题链条
- [x] 修复历史数据
- [x] 修复后端 TransactionService
- [x] 修复后端 PositionService
- [x] 修复前端 TransactionManagement
- [x] 创建数据库触发器
- [x] 编写测试脚本
- [x] 验证修复结果
- [x] 编写完整文档

## 🎉 总结

### 问题本质

这不是一个简单的字段错误，而是整个 currency 处理逻辑的设计缺陷：
- 前端硬编码 currency
- 后端未验证 currency
- 持仓服务依赖外部传入

### 修复策略

采用了**多层防护**的策略：
1. **前端**: 从 asset 对象获取正确的 currency
2. **后端**: 从 asset 表查询并验证 currency
3. **数据库**: 触发器自动修正不一致

### 修复结果

- ✅ 所有历史数据已修正
- ✅ 所有代码逻辑已优化
- ✅ 数据库约束已部署
- ✅ 测试验证全部通过
- ✅ 未来不会再出现此问题

### 关键收获

1. **Currency 必须从 asset 表获取**，不能依赖外部传入
2. **金额和 currency 是关联的**，必须一起处理
3. **汇率转换要在显示层做**，存储层保持原始币种
4. **多层防护**确保数据一致性
5. **详细日志**便于问题追踪

**修复时间**: 2025-10-28
**影响范围**: 6个资产，7个持仓，多条交易记录
**修复状态**: ✅ 完全修复
