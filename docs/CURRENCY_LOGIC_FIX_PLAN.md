# Currency 逻辑错误修复方案

## 🔍 问题根源分析

### 问题链条

```
用户创建交易
    ↓
前端: 选择资产 (只保存assetId)
    ↓
前端: 硬编码 currency = 'CNY'  ❌ 错误！
    ↓
后端: TransactionService 直接使用 request.currency
    ↓
后端: PositionService 使用传入的 currency
    ↓
结果: Position 和 Transaction 的 currency 与 Asset 不一致
```

### 具体问题位置

#### 1. 前端问题 (`frontend/src/pages/TransactionManagement.tsx`)

**第508行**:
```typescript
currency: 'CNY', // ❌ 硬编码，错误！
```

**问题**:
- 用户选择资产时，只保存了 `assetId`
- 没有保存完整的 `asset` 对象
- 提交时无法获取资产的正确 currency

#### 2. 后端问题 (`backend/src/services/TransactionService.ts`)

**第52行**:
```typescript
currency: request.currency,  // ❌ 直接使用前端传来的值，没有验证
```

**问题**:
- 没有验证 currency 是否与 asset 一致
- 应该从 asset 表获取正确的 currency

#### 3. 持仓服务问题 (`backend/src/services/PositionService.ts`)

**createNewPosition 方法**:
```typescript
private async createNewPosition(
    ...
    currency: string,  // ❌ 不应该作为参数传入
    ...
)
```

**问题**:
- currency 应该从 asset 表获取
- 不应该依赖外部传入

## ✅ 修复方案

### 方案1: 前端修复 (推荐)

#### 1.1 修改 TransactionManagement.tsx

**步骤1**: 保存选中的完整 asset 对象

```typescript
// 在组件状态中添加
const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

// 在资产选择的 Form.Item 中
<Form.Item
  label="产品"
  name="assetId"
  rules={[{ required: true, message: '请选择产品' }]}
>
  <Select 
    placeholder="选择产品" 
    showSearch
    loading={assetsLoading}
    onChange={(assetId) => {
      // 保存完整的 asset 对象
      const asset = assets.find(a => a.id === assetId);
      setSelectedAsset(asset || null);
    }}
    filterOption={(input, option) =>
      option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
    }
  >
    {assets.map(asset => (
      <Option key={asset.id} value={asset.id}>
        {asset.symbol} - {asset.name} ({asset.currency})  {/* 显示currency */}
      </Option>
    ))}
  </Select>
</Form.Item>
```

**步骤2**: 使用 asset 的 currency

```typescript
const handleSubmit = async (values: TransactionFormData) => {
  setLoading(true);
  try {
    // 获取选中资产的 currency
    const asset = selectedAsset || assets.find(a => a.id === values.assetId);
    
    if (!asset) {
      message.error('请先选择产品');
      return;
    }
    
    const transactionData = {
      portfolioId: values.portfolioId,
      tradingAccountId: values.tradingAccountId,
      assetId: values.assetId,
      transactionType: values.transactionType,
      side: values.transactionType === 'buy' ? 'BUY' : 
            values.transactionType === 'sell' ? 'SELL' :
            values.transactionType === 'deposit' ? 'DEPOSIT' :
            values.transactionType === 'withdrawal' ? 'WITHDRAWAL' : 'BUY',
      quantity: values.quantity,
      price: values.price,
      totalAmount: values.price * values.quantity,
      fee: values.fee || 0,
      fees: values.fee || 0,
      currency: asset.currency,  // ✅ 使用资产的 currency
      executedAt: values.executedAt.toISOString(),
      settledAt: values.executedAt.toISOString(),
      notes: values.notes || '',
      tags: values.tags || []
    } as any;
    
    // ... 其余代码
  }
}
```

**步骤3**: 在编辑时也要设置 selectedAsset

```typescript
const handleEdit = (transaction: Transaction) => {
  setEditingTransaction(transaction);
  
  // 找到对应的 asset
  const asset = assets.find(a => a.id === transaction.assetId);
  setSelectedAsset(asset || null);
  
  form.setFieldsValue({
    portfolioId: transaction.portfolioId,
    tradingAccountId: transaction.tradingAccountId,
    assetId: transaction.assetId,
    transactionType: transaction.transactionType,
    quantity: transaction.quantity,
    price: transaction.price,
    fee: transaction.fee,
    executedAt: dayjs(transaction.executedAt),
    notes: transaction.notes,
    tags: transaction.tags
  });
  
  setModalVisible(true);
};
```

### 方案2: 后端验证和修正 (双重保障)

#### 2.1 修改 TransactionService.ts

```typescript
async createTransaction(userId: string, request: CreateTransactionRequest): Promise<Transaction> {
  // 验证交易数据
  const validation = await this.validateTransaction(request);
  if (!validation.isValid) {
    throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
  }

  // ✅ 从 asset 表获取正确的 currency
  const assetQuery = `
    SELECT currency FROM finapp.assets WHERE id = $1::uuid
  `;
  const assetResult = await databaseService.executeRawQuery(assetQuery, [request.assetId]);
  
  if (!Array.isArray(assetResult) || assetResult.length === 0) {
    throw new Error(`Asset not found: ${request.assetId}`);
  }
  
  const correctCurrency = assetResult[0].currency;
  
  // ✅ 如果前端传入的 currency 与 asset 不一致，记录警告并使用正确的
  if (request.currency && request.currency !== correctCurrency) {
    console.warn(
      `Currency mismatch for asset ${request.assetId}: ` +
      `request=${request.currency}, asset=${correctCurrency}. ` +
      `Using asset currency.`
    );
  }

  const transactionId = uuidv4();
  const totalAmount = Math.abs(request.quantity) * request.price;
  const fees = request.fees || 0;

  const transaction: Transaction = {
    id: transactionId,
    userId,
    portfolioId: request.portfolioId,
    tradingAccountId: request.tradingAccountId,
    assetId: request.assetId,
    transactionType: request.transactionType,
    side: request.side,
    quantity: request.quantity,
    price: request.price,
    totalAmount,
    fees,
    currency: correctCurrency,  // ✅ 使用从 asset 表获取的 currency
    executedAt: request.executedAt || new Date(),
    settledAt: request.settledAt,
    notes: request.notes,
    tags: request.tags || [],
    liquidityTag: request.liquidityTag,
    status: 'COMPLETED' as TransactionStatus,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // ... 其余代码保持不变
}
```

#### 2.2 修改 PositionService.ts (已完成)

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
    
    // ✅ 从 asset 表获取正确的 currency
    const assetQuery = `
      SELECT currency FROM finapp.assets WHERE id = $1::uuid
    `;
    const assetResult = await databaseService.executeRawQuery(assetQuery, [assetId]);
    
    if (!Array.isArray(assetResult) || assetResult.length === 0) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    const correctCurrency = assetResult[0].currency;
    
    // ✅ 如果传入的 currency 与 asset 不一致，记录警告
    if (currency !== correctCurrency) {
      console.warn(
        `Position currency mismatch for asset ${assetId}: ` +
        `provided=${currency}, asset=${correctCurrency}. ` +
        `Using asset currency.`
      );
    }
    
    // ... 使用 correctCurrency 而不是 currency 参数
}
```

### 方案3: 数据库约束 (已完成)

数据库触发器已经创建，会自动修正不一致的 currency。

## 🧪 测试计划

### 测试1: 前端选择不同币种的资产

```
1. 选择 USD 资产 (如 BILI)
   - 验证表单显示 USD
   - 提交后检查 transaction.currency = 'USD'
   - 检查 position.currency = 'USD'

2. 选择 HKD 资产 (如 00700)
   - 验证表单显示 HKD
   - 提交后检查 transaction.currency = 'HKD'
   - 检查 position.currency = 'HKD'

3. 选择 CNY 资产
   - 验证表单显示 CNY
   - 提交后检查 transaction.currency = 'CNY'
   - 检查 position.currency = 'CNY'
```

### 测试2: 后端验证

```sql
-- 测试：尝试创建一个 currency 不一致的交易
-- 后端应该自动修正为 asset 的 currency

-- 查看日志，应该看到警告信息
```

### 测试3: 数据库触发器

```sql
-- 测试：直接在数据库中插入不一致的 position
INSERT INTO finapp.positions (
    id, portfolio_id, trading_account_id, asset_id,
    quantity, average_cost, total_cost, currency,
    is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    portfolio_id,
    trading_account_id,
    id,
    100,
    10.5,
    1050,
    'CNY',  -- 故意使用错误的 currency
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM finapp.assets
WHERE symbol = 'BILI'
LIMIT 1;

-- 验证：currency 应该被自动修正为 'USD'
-- 应该看到 NOTICE 消息
```

## 📊 修复优先级

### 高优先级 (必须修复)

1. ✅ **后端 TransactionService**: 从 asset 表获取 currency
2. ✅ **后端 PositionService**: 从 asset 表获取 currency
3. ✅ **数据库触发器**: 自动修正不一致

### 中优先级 (强烈建议)

4. ⏳ **前端 TransactionManagement**: 使用 asset 的 currency
5. ⏳ **前端显示**: 在资产选择时显示 currency

### 低优先级 (可选)

6. ⏳ **前端验证**: 在提交前验证 currency
7. ⏳ **API 文档**: 更新 API 文档说明 currency 的处理逻辑

## 🎯 实施步骤

### 第一步: 后端修复 (立即执行)

1. ✅ 修改 `PositionService.ts` - 已完成
2. ⏳ 修改 `TransactionService.ts` - 待执行
3. ✅ 创建数据库触发器 - 已完成

### 第二步: 前端修复 (建议执行)

1. ⏳ 修改 `TransactionManagement.tsx` - 待执行
2. ⏳ 测试所有交易创建流程 - 待执行

### 第三步: 验证和测试

1. ⏳ 运行测试用例
2. ⏳ 验证历史数据
3. ⏳ 更新文档

## 💡 设计原则

### Currency 管理的黄金法则

1. **单一数据源**: Currency 只在 asset 表中定义
2. **自动获取**: 所有需要 currency 的地方都从 asset 表获取
3. **验证修正**: 如果外部传入 currency，必须验证并修正
4. **多层防护**: 前端、后端、数据库三层保障
5. **明确警告**: 发现不一致时记录警告日志

### 汇率转换逻辑

当涉及汇率转换时：

```typescript
// 正确的逻辑
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
}
```

## 📝 相关文件

- `CURRENCY_CONSISTENCY_FIX.md` - 历史数据修复文档
- `fix-currency-inconsistency.sql` - 数据修复脚本
- `add-currency-consistency-trigger.sql` - 触发器脚本
- `backend/src/services/PositionService.ts` - 已修复
- `backend/src/services/TransactionService.ts` - 待修复
- `frontend/src/pages/TransactionManagement.tsx` - 待修复

## ⚠️ 注意事项

1. **向后兼容**: 修改后端时保持 API 接口兼容
2. **渐进式修复**: 先修复后端，再修复前端
3. **充分测试**: 每个修改都要充分测试
4. **监控日志**: 关注警告日志，发现潜在问题
5. **文档更新**: 及时更新 API 文档和开发文档
