# 交易批量导入字段规范 v2.0

## 📋 导入流程概览

**优化后的导入流程**：
```
1. 用户在界面选择：投资组合 → 交易账户 → 资产（产品）
2. 下载模板文件（Excel或JSON）
3. 填写交易明细（日期、类型、数量、价格等）
4. 上传文件完成批量导入
```

**优势**：
- ✅ 避免投资组合/账户/资产信息不一致
- ✅ 减少验证错误，提升成功率
- ✅ 简化批量文件结构
- ✅ 提供标准模板，降低学习成本

---

## 一、字段清单

### 1.1 界面预选字段（3个）

这些字段在界面上通过下拉选择器选定，**不包含在批量文件中**：

| 字段名 | 说明 | 选择方式 | 验证规则 |
|--------|------|---------|---------|
| **投资组合** | 用户已创建的投资组合 | 下拉选择器（单选） | 必须是is_active=true的组合 |
| **交易账户** | 该组合下的交易账户 | 下拉选择器（单选，级联） | 必须属于选定的投资组合 |
| **资产（产品）** | 系统中已存在的资产 | 搜索选择器（支持代码/名称搜索） | 必须在assets表中存在 |

**界面交互逻辑**：
```typescript
// 1. 选择投资组合后，自动加载该组合下的交易账户
onPortfolioChange(portfolioId) {
  const accounts = await fetchTradingAccounts(portfolioId);
  setAccountOptions(accounts);
}

// 2. 选择资产时支持模糊搜索
onAssetSearch(keyword) {
  const assets = await searchAssets({
    query: keyword,  // 搜索symbol或name
    limit: 20
  });
  setAssetOptions(assets);
}

// 3. 三个字段都选择后，才能下载模板或上传文件
const canProceed = portfolio && account && asset;
```

### 1.2 批量文件必填字段（5个）

| 字段名 | 类型 | 长度限制 | 验证规则 | 示例 | 说明 |
|--------|------|---------|---------|------|------|
| **date** | Date | - | YYYY-MM-DD格式，不能是未来日期 | `2024-01-15` | 交易日期 |
| **type** | Enum | - | 必须匹配系统定义的交易类型 | `STOCK_BUY` | 交易类型 |
| **quantity** | Decimal | 20,8 | 必须 > 0 | `100` | 交易数量 |
| **price** | Decimal | 20,8 | 必须 ≥ 0 | `320.5` | 交易价格 |
| **currency** | String | 3字符 | ISO 4217货币代码 | `HKD` | 交易币种 |

### 1.3 批量文件可选字段（3个）

| 字段名 | 类型 | 长度限制 | 验证规则 | 示例 | 默认值 |
|--------|------|---------|---------|------|--------|
| **fee** | Decimal | 20,8 | 必须 ≥ 0 | `10.5` | `0` |
| **notes** | String | 无限制 | - | `建仓` | `null` |
| **tags** | Array | - | 字符串数组 | `[\"长期持有\"]` | `[]` |

### 1.4 系统自动字段（不需要提供）

| 字段名 | 说明 | 如何确定 |
|--------|------|---------|
| **portfolio_id** | 投资组合ID | 界面选择的投资组合 |
| **trading_account_id** | 交易账户ID | 界面选择的交易账户 |
| **asset_id** | 资产ID | 界面选择的资产 |
| **user_id** | 用户ID | 登录会话 |
| **total_amount** | 总金额 | 自动计算：quantity × price ± fee |
| **side** | 交易方向 | 根据type自动映射 |
| **status** | 状态 | 默认：`EXECUTED` |
| **executed_at** | 执行时间 | 使用交易日期 |
| **created_at** | 创建时间 | 系统当前时间 |
| **updated_at** | 更新时间 | 系统当前时间 |

---

## 二、字段详细说明

### 2.1 date（交易日期）

**格式要求**:
- 类型：Date
- 格式：`YYYY-MM-DD`
- 必填字段

**验证规则**:
```typescript
// 1. 格式验证
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(date)) {
  throw new Error('日期格式错误，必须是 YYYY-MM-DD');
}

// 2. 有效性验证
const parsedDate = new Date(date);
if (isNaN(parsedDate.getTime())) {
  throw new Error('无效的日期');
}

// 3. 不能是未来日期
if (parsedDate > new Date()) {
  throw new Error('交易日期不能是未来日期');
}
```

**示例**:
```
✅ 正确：2024-01-15
✅ 正确：2023-12-31
❌ 错误：2024/01/15（斜杠分隔）
❌ 错误：15-01-2024（日在前）
❌ 错误：2025-12-31（未来日期）
```

### 2.2 type（交易类型）

**格式要求**:
- 类型：Enum
- 必填字段
- 必须是系统定义的17种类型之一

**系统支持的交易类型**:

| 类别 | 类型代码 | 中文名称 | 说明 |
|------|---------|---------|------|
| **股票** | `STOCK_BUY` | 股票买入 | 买入股票 |
| | `STOCK_SELL` | 股票卖出 | 卖出股票 |
| **基金** | `FUND_SUBSCRIBE` | 基金申购 | 申购基金份额 |
| | `FUND_REDEEM` | 基金赎回 | 赎回基金份额 |
| **债券** | `BOND_BUY` | 债券买入 | 买入债券 |
| | `BOND_SELL` | 债券卖出 | 卖出债券 |
| **期权** | `OPTION_BUY` | 期权买入 | 买入期权合约 |
| | `OPTION_SELL` | 期权卖出 | 卖出期权合约 |
| | `OPTION_EXERCISE` | 期权行权 | 行使期权 |
| **现金流** | `DEPOSIT` | 存入 | 存入资金 |
| | `WITHDRAWAL` | 取出 | 取出资金 |
| | `DIVIDEND` | 分红 | 收到分红 |
| | `INTEREST` | 利息 | 收到利息 |
| | `FEE` | 费用 | 支付费用 |
| | `TRANSFER_IN` | 转入 | 从其他账户转入 |
| | `TRANSFER_OUT` | 转出 | 转出到其他账户 |

**验证规则**:
```typescript
const VALID_TYPES = [
  'STOCK_BUY', 'STOCK_SELL',
  'FUND_SUBSCRIBE', 'FUND_REDEEM',
  'BOND_BUY', 'BOND_SELL',
  'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE',
  'DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST',
  'FEE', 'TRANSFER_IN', 'TRANSFER_OUT'
];

if (!VALID_TYPES.includes(type)) {
  throw new Error(
    `无效的交易类型 "${type}"。` +
    `支持的类型：${VALID_TYPES.join(', ')}`
  );
}
```

**别名映射（可选支持）**:
```typescript
const TYPE_ALIASES = {
  // 中文别名
  '买入': 'STOCK_BUY',
  '卖出': 'STOCK_SELL',
  '申购': 'FUND_SUBSCRIBE',
  '赎回': 'FUND_REDEEM',
  
  // 英文小写
  'buy': 'STOCK_BUY',
  'sell': 'STOCK_SELL',
  'subscribe': 'FUND_SUBSCRIBE',
  'redeem': 'FUND_REDEEM'
};
```

### 2.3 quantity（交易数量）

**格式要求**:
- 类型：Decimal(20,8)
- 必填字段
- 最多8位小数

**验证规则**:
```typescript
// 1. 必须是数字
if (isNaN(quantity)) {
  throw new Error('数量必须是数字');
}

// 2. 必须大于0
if (quantity <= 0) {
  throw new Error('数量必须大于0');
}

// 3. 小数位数不超过8位
const decimalPlaces = (quantity.toString().split('.')[1] || '').length;
if (decimalPlaces > 8) {
  throw new Error('数量最多支持8位小数');
}
```

**示例**:
```
✅ 正确：100
✅ 正确：100.5
✅ 正确：0.00000001（8位小数）
❌ 错误：0（必须大于0）
❌ 错误：-100（不能为负）
❌ 错误：100.123456789（超过8位小数）
```

### 2.4 price（交易价格）

**格式要求**:
- 类型：Decimal(20,8)
- 必填字段
- 最多8位小数

**验证规则**:
```typescript
// 1. 必须是数字
if (isNaN(price)) {
  throw new Error('价格必须是数字');
}

// 2. 必须大于等于0
if (price < 0) {
  throw new Error('价格不能为负数');
}

// 3. 小数位数不超过8位
const decimalPlaces = (price.toString().split('.')[1] || '').length;
if (decimalPlaces > 8) {
  throw new Error('价格最多支持8位小数');
}
```

**示例**:
```
✅ 正确：320.5
✅ 正确：0（某些情况下价格可以为0）
✅ 正确：1234.56789012（8位小数）
❌ 错误：-100（不能为负）
❌ 错误：100.123456789（超过8位小数）
```

### 2.5 currency（交易币种）

**格式要求**:
- 类型：String
- 长度：固定3个字符
- 必填字段
- 必须符合ISO 4217标准

**常用币种代码**:

| 代码 | 币种名称 | 说明 |
|------|---------|------|
| `CNY` | 人民币 | 中国大陆 |
| `USD` | 美元 | 美国 |
| `HKD` | 港币 | 香港 |
| `EUR` | 欧元 | 欧元区 |
| `GBP` | 英镑 | 英国 |
| `JPY` | 日元 | 日本 |
| `SGD` | 新加坡元 | 新加坡 |
| `AUD` | 澳元 | 澳大利亚 |
| `CAD` | 加元 | 加拿大 |

**验证规则**:
```typescript
// 1. 长度必须是3个字符
if (currency.length !== 3) {
  throw new Error('币种代码必须是3个字符');
}

// 2. 必须是大写字母
if (!/^[A-Z]{3}$/.test(currency)) {
  throw new Error('币种代码必须是3个大写字母');
}

// 3. 可选：验证是否是有效的ISO 4217代码
const VALID_CURRENCIES = ['CNY', 'USD', 'HKD', 'EUR', 'GBP', 'JPY', ...];
if (!VALID_CURRENCIES.includes(currency)) {
  throw new Error(`不支持的币种代码 "${currency}"`);
}
```

**示例**:
```
✅ 正确：CNY
✅ 正确：USD
✅ 正确：HKD
❌ 错误：cny（必须大写）
❌ 错误：RMB（非ISO标准，应使用CNY）
❌ 错误：US（长度不足）
```

### 2.6 fee（手续费）

**格式要求**:
- 类型：Decimal(20,8)
- 可选字段
- 默认值：0

**验证规则**:
```typescript
// 1. 如果提供，必须是数字
if (fee !== undefined && isNaN(fee)) {
  throw new Error('手续费必须是数字');
}

// 2. 必须大于等于0
if (fee < 0) {
  throw new Error('手续费不能为负数');
}

// 3. 小数位数不超过8位
const decimalPlaces = (fee.toString().split('.')[1] || '').length;
if (decimalPlaces > 8) {
  throw new Error('手续费最多支持8位小数');
}
```

**示例**:
```
✅ 正确：10.5
✅ 正确：0
✅ 正确：（不提供，默认为0）
❌ 错误：-5（不能为负）
```

### 2.7 notes（备注）

**格式要求**:
- 类型：String
- 可选字段
- 无长度限制

**示例**:
```
✅ 正确：建仓
✅ 正确：长期持有，核心资产
✅ 正确：（不提供）
```

### 2.8 tags（标签）

**格式要求**:
- 类型：Array<String>
- 可选字段
- 默认值：空数组

**验证规则**:
```typescript
// 1. 必须是数组
if (!Array.isArray(tags)) {
  throw new Error('标签必须是数组');
}

// 2. 数组元素必须是字符串
if (!tags.every(tag => typeof tag === 'string')) {
  throw new Error('标签数组中的每个元素必须是字符串');
}
```

**示例**:
```json
✅ 正确：["长期持有"]
✅ 正确：["核心资产", "高分红"]
✅ 正确：[]
✅ 正确：（不提供，默认为空数组）
❌ 错误："长期持有"（不是数组）
❌ 错误：[1, 2, 3]（元素不是字符串）
```

---

## 三、模板文件示例

### 3.1 Excel模板

**文件名**: `transaction_import_template.xlsx`

**Sheet1: 交易数据**

| 日期 | 交易类型 | 数量 | 价格 | 币种 | 手续费 | 备注 | 标签 |
|------|---------|------|------|------|--------|------|------|
| 2024-01-15 | STOCK_BUY | 100 | 320.5 | HKD | 10 | 建仓 | 长期持有 |
| 2024-02-20 | STOCK_SELL | 50 | 185.2 | USD | 5 | 减仓 | |
| 2024-03-10 | DIVIDEND | 100 | 2.5 | HKD | 0 | 分红收入 | |

**Sheet2: 说明**

```
批量导入交易说明

1. 使用前提：
   - 必须先在界面选择：投资组合、交易账户、资产（产品）
   - 本文件仅包含交易明细，不包含投资组合/账户/资产信息

2. 必填字段（5个）：
   - 日期：格式 YYYY-MM-DD，不能是未来日期
   - 交易类型：见下方类型列表
   - 数量：必须 > 0
   - 价格：必须 ≥ 0
   - 币种：3位ISO代码（如CNY、USD、HKD）

3. 可选字段（3个）：
   - 手续费：默认0
   - 备注：任意文本
   - 标签：多个标签用逗号分隔

4. 支持的交易类型：
   股票：STOCK_BUY, STOCK_SELL
   基金：FUND_SUBSCRIBE, FUND_REDEEM
   债券：BOND_BUY, BOND_SELL
   期权：OPTION_BUY, OPTION_SELL, OPTION_EXERCISE
   现金流：DEPOSIT, WITHDRAWAL, DIVIDEND, INTEREST, FEE, TRANSFER_IN, TRANSFER_OUT

5. 常用币种代码：
   CNY-人民币, USD-美元, HKD-港币, EUR-欧元, GBP-英镑, JPY-日元

6. 注意事项：
   - 一批数据要么全部成功，要么全部失败
   - 请确保数据准确，避免导入失败
```

### 3.2 JSON模板

**文件名**: `transaction_import_template.json`

```json
{
  "version": "2.0",
  "metadata": {
    "description": "交易批量导入模板",
    "note": "使用前必须在界面选择：投资组合、交易账户、资产"
  },
  "transactions": [
    {
      "date": "2024-01-15",
      "type": "STOCK_BUY",
      "quantity": 100,
      "price": 320.5,
      "currency": "HKD",
      "fee": 10,
      "notes": "建仓",
      "tags": ["长期持有", "核心资产"]
    },
    {
      "date": "2024-02-20",
      "type": "STOCK_SELL",
      "quantity": 50,
      "price": 185.2,
      "currency": "USD",
      "fee": 5,
      "notes": "减仓",
      "tags": []
    },
    {
      "date": "2024-03-10",
      "type": "DIVIDEND",
      "quantity": 100,
      "price": 2.5,
      "currency": "HKD",
      "fee": 0,
      "notes": "分红收入",
      "tags": ["被动收入"]
    }
  ],
  "schema": {
    "required_fields": ["date", "type", "quantity", "price", "currency"],
    "optional_fields": ["fee", "notes", "tags"],
    "transaction_types": [
      "STOCK_BUY", "STOCK_SELL",
      "FUND_SUBSCRIBE", "FUND_REDEEM",
      "BOND_BUY", "BOND_SELL",
      "OPTION_BUY", "OPTION_SELL", "OPTION_EXERCISE",
      "DEPOSIT", "WITHDRAWAL", "DIVIDEND", "INTEREST",
      "FEE", "TRANSFER_IN", "TRANSFER_OUT"
    ],
    "currency_codes": ["CNY", "USD", "HKD", "EUR", "GBP", "JPY", "SGD", "AUD", "CAD"]
  }
}
```

### 3.3 最小化示例

**Excel最小示例**（只包含必填字段）:

| 日期 | 交易类型 | 数量 | 价格 | 币种 |
|------|---------|------|------|------|
| 2024-01-15 | STOCK_BUY | 100 | 320.5 | HKD |

**JSON最小示例**:

```json
{
  "transactions": [
    {
      "date": "2024-01-15",
      "type": "STOCK_BUY",
      "quantity": 100,
      "price": 320.5,
      "currency": "HKD"
    }
  ]
}
```

---

## 四、验证流程

### 4.1 验证阶段

```
阶段1: 文件格式验证
  ├─ Excel: 检查Sheet结构、列名
  └─ JSON: 检查JSON格式、schema

阶段2: 字段验证
  ├─ 必填字段完整性
  ├─ 数据类型正确性
  ├─ 数值范围合法性
  └─ 日期格式有效性

阶段3: 业务规则验证
  ├─ 交易类型是否有效
  ├─ 币种代码是否支持
  ├─ 日期是否未来
  └─ 数量/价格是否合理

阶段4: 原子性导入
  ├─ 开启数据库事务
  ├─ 批量插入所有记录
  ├─ 任何失败则全部回滚
  └─ 全部成功则提交事务
```

### 4.2 错误处理

**错误信息格式**:
```json
{
  "success": false,
  "errors": [
    {
      "row": 2,
      "field": "date",
      "value": "2025-12-31",
      "message": "交易日期不能是未来日期"
    },
    {
      "row": 3,
      "field": "type",
      "value": "BUY",
      "message": "无效的交易类型 \"BUY\"。支持的类型：STOCK_BUY, STOCK_SELL, ..."
    }
  ],
  "summary": "发现2个错误，请修正后重新上传"
}
```

---

## 五、常见问题

### Q1: 为什么要在界面预选投资组合/账户/资产？

**A**: 
- 避免批量文件中信息不一致导致的验证错误
- 简化文件结构，降低用户填写难度
- 提高导入成功率，优化用户体验

### Q2: 如果要导入多个资产的交易怎么办？

**A**: 
- 方案1：分批导入，每次选择一个资产
- 方案2（未来扩展）：支持多资产模式，文件中包含资产代码字段

### Q3: 标签字段在Excel中如何填写？

**A**: 
- 多个标签用逗号分隔，如：`长期持有,核心资产`
- 系统会自动拆分为数组：`["长期持有", "核心资产"]`

### Q4: 交易类型可以用中文吗？

**A**: 
- 建议使用标准代码（如`STOCK_BUY`）
- 系统可选支持中文别名映射（如`买入` → `STOCK_BUY`）
- 具体支持情况以实际实现为准

### Q5: 导入失败后如何排查？

**A**: 
1. 查看错误信息中的具体行号和字段
2. 对照模板检查数据格式
3. 确认交易类型、币种代码是否正确
4. 检查日期是否未来、数量/价格是否合理

---

## 六、技术实现要点

### 6.1 前端实现

```typescript
// 导入组件状态
interface ImportState {
  // 预选字段
  selectedPortfolio: Portfolio | null;
  selectedAccount: TradingAccount | null;
  selectedAsset: Asset | null;
  
  // 文件上传
  uploadedFile: File | null;
  fileType: 'excel' | 'json';
  
  // 预览数据
  previewData: Transaction[];
  validationErrors: ValidationError[];
}

// 下载模板
const downloadTemplate = (format: 'excel' | 'json') => {
  const context = {
    portfolio: selectedPortfolio.name,
    account: selectedAccount.name,
    asset: selectedAsset.symbol
  };
  
  if (format === 'excel') {
    downloadExcelTemplate(context);
  } else {
    downloadJsonTemplate(context);
  }
};

// 上传文件
const handleFileUpload = async (file: File) => {
  // 1. 解析文件
  const transactions = await parseFile(file);
  
  // 2. 附加预选字段
  const enrichedTransactions = transactions.map(t => ({
    ...t,
    portfolio_id: selectedPortfolio.id,
    trading_account_id: selectedAccount.id,
    asset_id: selectedAsset.id
  }));
  
  // 3. 验证数据
  const errors = await validateTransactions(enrichedTransactions);
  
  // 4. 显示预览或错误
  if (errors.length > 0) {
    setValidationErrors(errors);
  } else {
    setPreviewData(enrichedTransactions);
  }
};
```

### 6.2 后端实现

```typescript
// 导入服务
class TransactionImportService {
  async importTransactions(
    userId: string,
    portfolioId: string,
    accountId: string,
    assetId: string,
    transactions: ImportTransaction[]
  ): Promise<ImportResult> {
    // 1. 验证预选字段的关联关系
    await this.validateContext(userId, portfolioId, accountId, assetId);
    
    // 2. 验证交易数据
    const errors = await this.validateTransactions(transactions);
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    // 3. 原子性导入
    await this.prisma.$transaction(async (tx) => {
      for (const t of transactions) {
        await tx.transaction.create({
          data: {
            user_id: userId,
            portfolio_id: portfolioId,
            trading_account_id: accountId,
            asset_id: assetId,
            date: t.date,
            type: t.type,
            quantity: t.quantity,
            price: t.price,
            currency: t.currency,
            fee: t.fee || 0,
            notes: t.notes,
            tags: t.tags || [],
            // ... 其他自动计算字段
          }
        });
      }
    });
    
    return { success: true, count: transactions.length };
  }
  
  private async validateContext(
    userId: string,
    portfolioId: string,
    accountId: string,
    assetId: string
  ): Promise<void> {
    // 验证投资组合属于用户
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, user_id: userId, is_active: true }
    });
    if (!portfolio) {
      throw new Error('投资组合不存在或无权访问');
    }
    
    // 验证交易账户属于该组合
    const account = await this.prisma.tradingAccount.findFirst({
      where: { id: accountId, portfolio_id: portfolioId, is_active: true }
    });
    if (!account) {
      throw new Error('交易账户不存在或不属于该投资组合');
    }
    
    // 验证资产存在
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId }
    });
    if (!asset) {
      throw new Error('资产不存在');
    }
  }
}
```

---

## 七、版本历史

### v2.0 (2024-10-27)
- ✨ 优化导入流程：界面预选投资组合/账户/资产
- ✨ 简化批量文件：移除portfolio、account、asset字段
- ✨ 提供标准模板：Excel和JSON模板文件
- ✨ 减少必填字段：从8个降至5个
- 📝 更新文档：新增模板示例和常见问题

### v1.0 (2024-10-26)
- 🎉 初始版本：支持8个必填字段
- 📝 完整字段规范和验证规则
