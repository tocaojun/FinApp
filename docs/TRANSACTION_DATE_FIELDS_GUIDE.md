# 交易日期字段设计指南

## 核心概念

系统中有两个重要的日期字段，分别代表不同的含义：

### 1. **交易日期 (transactionDate / transaction_date)**
- **含义**：用户选择的、实际发生交易的日期
- **类型**：DATE（纯日期，不包含时间）
- **数据库字段**：`finapp.transactions.transaction_date`
- **前端字段**：`Transaction.transactionDate`
- **用户可修改**：✅ 是
- **用途**：用于统计、分析交易发生的时间

### 2. **执行日期 (executedAt / executed_at)**
- **含义**：系统执行或最后更新交易的时刻
- **类型**：TIMESTAMP WITH TIME ZONE（包含具体时间）
- **数据库字段**：`finapp.transactions.executed_at`
- **前端字段**：`Transaction.executedAt`
- **用户可修改**：❌ 否（系统自动管理）
- **用途**：记录数据变更历史

## 前后端数据流

### 创建交易时

**前端发送:**
```json
{
  "portfolioId": "xxx",
  "assetId": "xxx",
  "quantity": 100,
  "price": 10.5,
  "transactionDate": "2025-11-10",  // 用户选择的交易日期
  "fees": 5
  // 注意：不发送 executedAt
}
```

**后端处理:**
- `transactionDate` → 写入 `transaction_date` 列（DATE 类型）
- `executedAt` → 自动设置为当前时刻，写入 `executed_at` 列（TIMESTAMP 类型）

**后端返回:**
```json
{
  "id": "xxx",
  "transactionDate": "2025-11-10T00:00:00Z",
  "executedAt": "2025-11-10T15:30:45.123Z",
  "createdAt": "2025-11-10T15:30:45.123Z",
  "updatedAt": "2025-11-10T15:30:45.123Z"
}
```

### 编辑交易时

**前端发送:**
```json
{
  "quantity": 150,          // 修改数量
  "price": 10.8,            // 修改价格
  "transactionDate": "2025-11-09",  // 修改交易日期
  "fees": 6,
  // 注意：不发送 executedAt
}
```

**后端处理:**
- 更新 `transaction_date` 列（基于 `transactionDate` 参数）
- **自动更新** `executed_at` 列为当前时刻（表示"最后修改时间"）
- 不允许客户端直接修改 `executed_at`

## 前端表单字段映射

在 React 表单中，为了避免混淆，使用以下映射：

| 前端表单字段名 | 含义 | 对应数据库列 |
|---------------|------|------------|
| `executedAt` (Form) | 用户选择的交易日期 | `transaction_date` |
| `executedAt` (API) | 系统执行/更新时刻 | `executed_at` |

**前端表单中的 `executedAt` DatePicker** 收集的是用户选择的"交易日期"，在提交时会被转换为 `transactionDate` 发送给后端。

## 常见操作

### 查询交易列表

```typescript
// 后端会返回包含两个日期字段的数据
const transactions = await getTransactions();
transactions.forEach(tx => {
  console.log(`交易日期: ${tx.transactionDate}`);  // 2025-11-10
  console.log(`执行时刻: ${tx.executedAt}`);        // 2025-11-10T15:30:45.123Z
});
```

### 显示交易日期

```typescript
// 表格中显示用户选择的交易日期
<Table columns={[
  {
    title: '交易日期',
    dataIndex: 'transactionDate',  // 使用 transactionDate
    render: (text) => dayjs(text).format('YYYY-MM-DD')
  }
]} />
```

### 编辑交易日期

```typescript
// handleEdit 时，使用 transactionDate
const formValues = {
  executedAt: dayjs(transaction.transactionDate),  // 前端表单字段
  // ...
};
form.setFieldsValue(formValues);
```

### 提交编辑

```typescript
// 编辑时只需发送修改的字段
const updateData = {
  transactionDate: values.executedAt.format('YYYY-MM-DD'),  // 前端 executedAt → transactionDate
  quantity: values.quantity,
  price: values.price
  // 不包含 executedAt，由后端自动更新
};
await updateTransaction(id, updateData);
```

## 关键规则

✅ **必须遵守**

1. 创建交易时，**必须** 提供 `transactionDate`
2. 编辑交易时，可以修改 `transactionDate`
3. 前端表单用 `executedAt` DatePicker 收集交易日期
4. 后端自动管理 `executed_at` 字段

❌ **禁止操作**

1. ❌ 不要让客户端直接设置 `executedAt`（对应数据库 `executed_at`）
2. ❌ 不要用 `executedAt` 来代替 `transactionDate`
3. ❌ 不要留空 `transactionDate`（必须有值）
4. ❌ 不要直接修改数据库的 `executed_at` 字段（应通过应用层更新）

## 故障排查

### 问题：编辑后交易日期没有改变

**原因**：前端没有发送 `transactionDate` 参数

**解决**：确保 `handleSubmit` 中的 `updateData` 包含：
```typescript
const updateData = {
  transactionDate: values.executedAt.format('YYYY-MM-DD'),
  // ...
};
```

### 问题：看不到最后更新时间

**解决**：查看 `executedAt` 字段（代表"最后更新时刻"），而不是 `transactionDate`

### 问题：transactionDate 为空

**原因**：可能是旧数据迁移问题或客户端未正确传递

**解决**：
1. 检查数据库中 `transaction_date` 是否有值
2. 确认后端查询时正确映射了该字段
3. 前端编辑时填入该字段值

## 数据库视图

关键表结构：
```sql
-- finapp.transactions 表中的日期列
- id UUID
- transaction_date DATE NOT NULL          -- 用户选择的交易日期
- executed_at TIMESTAMP WITH TIME ZONE    -- 系统执行/更新时刻
- settled_at TIMESTAMP WITH TIME ZONE     -- 交易结算时刻（可选）
- created_at TIMESTAMP WITH TIME ZONE     -- 创建时刻
- updated_at TIMESTAMP WITH TIME ZONE     -- ORM 更新时刻
```

---

**最后更新**：2025-11-10  
**相关文件**：
- 后端：`/backend/src/services/TransactionService.ts`
- 前端：`/frontend/src/pages/TransactionManagement.tsx`
- 类型定义：`/frontend/src/services/transactionService.ts`
