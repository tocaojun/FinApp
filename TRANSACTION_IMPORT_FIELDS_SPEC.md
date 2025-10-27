# 交易批量导入字段规范

## 一、字段清单

### 1.1 必填字段（8个）

| 字段名 | 类型 | 长度限制 | 验证规则 | 示例 | 说明 |
|--------|------|---------|---------|------|------|
| **portfolio** | String | 100字符 | 必须是用户现存的投资组合 | `我的投资组合` | 投资组合名称 |
| **account** | String | 100字符 | 必须是该组合中已存在的交易账户 | `港股账户` | 交易账户名称 |
| **date** | Date | - | YYYY-MM-DD格式，不能是未来日期 | `2024-01-15` | 交易日期 |
| **asset.symbol** | String | 50字符 | 必须在系统中已存在 | `00700.HK` | 资产代码 |
| **type** | Enum | - | 必须匹配系统定义的交易类型 | `STOCK_BUY` | 交易类型 |
| **quantity** | Decimal | 20,8 | 必须 > 0 | `100` | 交易数量 |
| **price** | Decimal | 20,8 | 必须 ≥ 0 | `320.5` | 交易价格 |
| **currency** | String | 3字符 | ISO 4217货币代码 | `HKD` | 交易币种 |

### 1.2 可选字段（3个）

| 字段名 | 类型 | 长度限制 | 验证规则 | 示例 | 默认值 |
|--------|------|---------|---------|------|--------|
| **fee** | Decimal | 20,8 | 必须 ≥ 0 | `10.5` | `0` |
| **notes** | String | 无限制 | - | `建仓` | `null` |
| **tags** | Array | - | 字符串数组 | `["长期持有"]` | `[]` |

### 1.3 系统自动字段（不需要提供）

| 字段名 | 说明 | 如何确定 |
|--------|------|---------|
| **portfolio_id** | 投资组合ID | 根据portfolio名称查询 |
| **trading_account_id** | 交易账户ID | 根据account名称在指定组合中查询 |
| **asset_id** | 资产ID | 根据symbol查询 |
| **user_id** | 用户ID | 登录会话 |
| **total_amount** | 总金额 | 自动计算：quantity × price ± fee |
| **side** | 交易方向 | 根据type自动映射 |
| **status** | 状态 | 默认：`EXECUTED` |
| **executed_at** | 执行时间 | 使用交易日期 |
| **created_at** | 创建时间 | 系统当前时间 |
| **updated_at** | 更新时间 | 系统当前时间 |

## 二、字段详细说明

### 2.1 portfolio（投资组合）

**格式要求**:
- 类型：String
- 最大长度：100字符
- 必填字段

**验证规则**:
```typescript
// 1. 不能为空
if (!portfolio) throw new Error('投资组合不能为空');

// 2. 必须是用户现存的投资组合
const portfolioRecord = await prisma.portfolio.findFirst({
  where: { 
    name: portfolio,
    user_id: userId,
    is_active: true
  }
});

if (!portfolioRecord) {
  throw new Error(
    `投资组合 "${portfolio}" 不存在或已停用。` +
    `请先在【投资组合管理】中创建该组合。`
  );
}
```

**示例**:
```
✅ 正确：我的投资组合
✅ 正确：长期投资组合
✅ 正确：2024年组合
❌ 错误：不存在的组合（如果系统中没有）
❌ 错误：（空值）
```

### 2.2 account（交易账户）

**格式要求**:
- 类型：String
- 最大长度：100字符
- 必填字段

**验证规则**:
```typescript
// 1. 不能为空
if (!account) throw new Error('交易账户不能为空');

// 2. 必须是该投资组合中已存在的交易账户
const tradingAccount = await prisma.tradingAccount.findFirst({
  where: { 
    name: account,
    portfolio_id: portfolioRecord.id,
    is_active: true
  }
});

if (!tradingAccount) {
  throw new Error(
    `交易账户 "${account}" 在投资组合 "${portfolio}" 中不存在或已停用。` +
    `请先在该组合下创建交易账户。`
  );
}
```

**层级关系**:
```
用户 (User)
  └── 投资组合 (Portfolio)
        └── 交易账户 (Trading Account)
              └── 交易记录 (Transaction)
```

**示例**:
```
✅ 正确：港股账户（该组合下存在）
✅ 正确：美股账户（该组合下存在）
❌ 错误：不存在的账户
❌ 错误：其他组合的账户（跨组合引用）
❌ 错误：（空值）
```

### 2.3 date（交易日期）

**格式要求**:
- 标准格式：`YYYY-MM-DD`（如：`2024-01-15`）
- Excel支持：日期序列号会自动转换
- JSON支持：ISO 8601格式（`2024-01-15T00:00:00Z`）

**验证规则**:
```typescript
// 1. 不能为空
if (!date) throw new Error('交易日期不能为空');

// 2. 必须是有效日期
const txDate = new Date(date);
if (isNaN(txDate.getTime())) throw new Error('日期格式无效');

// 3. 不能是未来日期
if (txDate > new Date()) throw new Error('交易日期不能是未来日期');

// 4. 建议范围：不早于1990-01-01
if (txDate < new Date('1990-01-01')) {
  console.warn('交易日期过早，请确认是否正确');
}
```

**示例**:
```
✅ 正确：2024-01-15
✅ 正确：2023-12-31
❌ 错误：2025-12-31（未来日期）
❌ 错误：01/15/2024（格式错误）
❌ 错误：2024-13-01（月份无效）
```

### 2.2 asset.symbol（资产代码）

**格式要求**:
- 最大长度：50字符
- 大小写：自动转换为大写
- 空格：自动去除前后空格

**验证规则**:
```typescript
// 1. 不能为空
if (!symbol) throw new Error('资产代码不能为空');

// 2. 标准化处理
symbol = symbol.trim().toUpperCase();

// 3. 必须在系统中存在
const asset = await prisma.asset.findFirst({
  where: { symbol, user_id: userId }
});
if (!asset) {
  throw new Error(`资产 ${symbol} 不存在，请先在资产管理中创建`);
}
```

**示例**:
```
✅ 正确：00700.HK（港股）
✅ 正确：AAPL（美股）
✅ 正确：600519.SS（A股）
✅ 正确：BTC-USD（加密货币）
❌ 错误：00700（缺少市场后缀）
❌ 错误：TSLA（如果系统中不存在）
```

### 2.3 asset.name（资产名称）

**说明**:
- 仅用于提高可读性
- 不参与匹配和验证
- 导入时会被忽略，以symbol为准

**示例**:
```json
{
  "asset": {
    "symbol": "00700.HK",
    "name": "腾讯控股"  // 可选，仅用于阅读
  }
}
```

### 2.4 type（交易类型）

**系统支持的交易类型**（基于数据库定义）:

| 交易类型代码 | 中文名称 | 交易方向 | 说明 |
|-------------|---------|---------|------|
| **股票交易** ||||
| `STOCK_BUY` | 股票买入 | BUY | 买入股票 |
| `STOCK_SELL` | 股票卖出 | SELL | 卖出股票 |
| **基金交易** ||||
| `FUND_SUBSCRIBE` | 基金申购 | BUY | 申购基金 |
| `FUND_REDEEM` | 基金赎回 | SELL | 赎回基金 |
| **债券交易** ||||
| `BOND_BUY` | 债券买入 | BUY | 买入债券 |
| `BOND_SELL` | 债券卖出 | SELL | 卖出债券 |
| **期权交易** ||||
| `OPTION_BUY` | 期权买入 | BUY | 买入期权 |
| `OPTION_SELL` | 期权卖出 | SELL | 卖出期权 |
| `OPTION_EXERCISE` | 期权行权 | BUY | 行使期权 |
| **现金流** ||||
| `DEPOSIT` | 存入 | DEPOSIT | 存入现金 |
| `WITHDRAWAL` | 取出 | WITHDRAWAL | 取出现金 |
| `DIVIDEND` | 分红 | DEPOSIT | 现金分红 |
| `INTEREST` | 利息 | DEPOSIT | 利息收入 |
| `FEE` | 费用 | WITHDRAWAL | 手续费等 |
| `TRANSFER_IN` | 转入 | DEPOSIT | 资金转入 |
| `TRANSFER_OUT` | 转出 | WITHDRAWAL | 资金转出 |

**验证规则**:
```typescript
// 系统允许的交易类型（与数据库CHECK约束一致）
const VALID_TRANSACTION_TYPES = [
  'STOCK_BUY', 'STOCK_SELL',
  'FUND_SUBSCRIBE', 'FUND_REDEEM',
  'BOND_BUY', 'BOND_SELL',
  'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE',
  'DEPOSIT', 'WITHDRAWAL',
  'DIVIDEND', 'INTEREST', 'FEE',
  'TRANSFER_IN', 'TRANSFER_OUT'
];

// 1. 不能为空
if (!type) throw new Error('交易类型不能为空');

// 2. 必须是系统支持的类型
const upperType = type.toUpperCase();
if (!VALID_TRANSACTION_TYPES.includes(upperType)) {
  throw new Error(
    `不支持的交易类型: ${type}。\n` +
    `支持的类型: ${VALID_TRANSACTION_TYPES.join(', ')}`
  );
}
```

**便捷映射（可选）**:
```typescript
// 为了用户友好，可以支持简化输入
const TYPE_ALIASES: Record<string, string> = {
  // 中文别名
  '买入': 'STOCK_BUY',
  '卖出': 'STOCK_SELL',
  '申购': 'FUND_SUBSCRIBE',
  '赎回': 'FUND_REDEEM',
  '分红': 'DIVIDEND',
  '存入': 'DEPOSIT',
  '取出': 'WITHDRAWAL',
  
  // 英文简写
  'buy': 'STOCK_BUY',
  'sell': 'STOCK_SELL',
  'subscribe': 'FUND_SUBSCRIBE',
  'redeem': 'FUND_REDEEM',
  'dividend': 'DIVIDEND',
  'deposit': 'DEPOSIT',
  'withdraw': 'WITHDRAWAL'
};

// 使用别名映射
const mappedType = TYPE_ALIASES[type.toLowerCase()] || type.toUpperCase();
```

**示例**:
```
✅ 正确：STOCK_BUY（标准格式）
✅ 正确：买入（中文别名，自动映射）
✅ 正确：buy（英文简写，自动映射）
✅ 正确：FUND_SUBSCRIBE
✅ 正确：DIVIDEND
❌ 错误：purchase（不支持）
❌ 错误：sale（不支持）
❌ 错误：STOCK_PURCHASE（不在系统定义中）
```

### 2.5 quantity（交易数量）

**格式要求**:
- 类型：Decimal(20, 8)
- 最大整数位：12位
- 最大小数位：8位

**验证规则**:
```typescript
// 1. 不能为空
if (quantity === undefined || quantity === null) {
  throw new Error('交易数量不能为空');
}

// 2. 必须是数字
const qty = parseFloat(quantity);
if (isNaN(qty)) {
  throw new Error('交易数量必须是数字');
}

// 3. 必须大于0
if (qty <= 0) {
  throw new Error('交易数量必须大于0');
}

// 4. 精度检查（最多8位小数）
if (qty.toString().split('.')[1]?.length > 8) {
  throw new Error('交易数量小数位不能超过8位');
}
```

**示例**:
```
✅ 正确：100（整数）
✅ 正确：100.5（小数）
✅ 正确：0.00000001（8位小数）
❌ 错误：0（必须大于0）
❌ 错误：-100（不能为负数）
❌ 错误：abc（不是数字）
❌ 错误：0.000000001（超过8位小数）
```

### 2.6 price（交易价格）

**格式要求**:
- 类型：Decimal(20, 8)
- 最大整数位：12位
- 最大小数位：8位

**验证规则**:
```typescript
// 1. 不能为空
if (price === undefined || price === null) {
  throw new Error('交易价格不能为空');
}

// 2. 必须是数字
const p = parseFloat(price);
if (isNaN(p)) {
  throw new Error('交易价格必须是数字');
}

// 3. 不能为负数
if (p < 0) {
  throw new Error('交易价格不能为负数');
}

// 4. 精度检查
if (p.toString().split('.')[1]?.length > 8) {
  throw new Error('交易价格小数位不能超过8位');
}

// 5. 合理性检查（可选警告）
if (p === 0) {
  console.warn('交易价格为0，请确认是否正确');
}
```

**示例**:
```
✅ 正确：320.5
✅ 正确：0.01（低价股）
✅ 正确：10000（高价股）
✅ 正确：0（分红、拆股等特殊情况）
❌ 错误：-100（不能为负数）
❌ 错误：abc（不是数字）
```

### 2.7 fee（手续费）

**格式要求**:
- 类型：Decimal(20, 8)
- 默认值：0

**验证规则**:
```typescript
// 1. 如果未提供，默认为0
const feeValue = fee !== undefined ? parseFloat(fee) : 0;

// 2. 必须是数字
if (isNaN(feeValue)) {
  throw new Error('手续费必须是数字');
}

// 3. 不能为负数
if (feeValue < 0) {
  throw new Error('手续费不能为负数');
}

// 4. 合理性检查（可选警告）
const totalAmount = quantity * price;
if (feeValue > totalAmount * 0.1) {
  console.warn('手续费超过交易金额的10%，请确认是否正确');
}
```

**示例**:
```
✅ 正确：10.5
✅ 正确：0（无手续费）
✅ 正确：（不填，默认0）
❌ 错误：-10（不能为负数）
```

### 2.8 currency（交易币种）

**格式要求**:
- 类型：String
- 长度：3字符
- 必填字段
- 标准：ISO 4217货币代码

**验证规则**:
```typescript
// 1. 不能为空
if (!currency) throw new Error('交易币种不能为空');

// 2. 必须是3位大写字母
const currencyUpper = currency.toUpperCase();
if (!/^[A-Z]{3}$/.test(currencyUpper)) {
  throw new Error('币种必须是3位字母代码（如：CNY, USD, HKD）');
}

// 3. 建议验证是否是常用币种
const COMMON_CURRENCIES = [
  'CNY', 'USD', 'HKD', 'EUR', 'GBP', 'JPY',
  'AUD', 'CAD', 'SGD', 'CHF', 'KRW'
];

if (!COMMON_CURRENCIES.includes(currencyUpper)) {
  console.warn(`币种 ${currencyUpper} 不在常用列表中，请确认是否正确`);
}

// 4. 可选：验证币种与资产币种是否一致
const asset = await prisma.asset.findFirst({
  where: { symbol: assetSymbol }
});

if (asset && asset.currency !== currencyUpper) {
  console.warn(
    `交易币种 ${currencyUpper} 与资产币种 ${asset.currency} 不一致，` +
    `可能需要汇率转换`
  );
}
```

**常用币种代码**:

| 代码 | 币种名称 | 说明 |
|------|---------|------|
| CNY | 人民币 | 中国大陆 |
| USD | 美元 | 美国 |
| HKD | 港币 | 香港 |
| EUR | 欧元 | 欧元区 |
| GBP | 英镑 | 英国 |
| JPY | 日元 | 日本 |
| AUD | 澳元 | 澳大利亚 |
| CAD | 加元 | 加拿大 |
| SGD | 新加坡元 | 新加坡 |

**示例**:
```
✅ 正确：CNY
✅ 正确：USD
✅ 正确：HKD
✅ 正确：hkd（自动转大写）
❌ 错误：RMB（应使用CNY）
❌ 错误：$（不是ISO代码）
❌ 错误：人民币（应使用CNY）
❌ 错误：（空值）
```

### 2.9 notes（备注）

**格式要求**:
- 类型：String
- 长度：无限制（TEXT类型）
- 可选字段

**验证规则**:
```typescript
// 无特殊验证，任何文本都可以
// 建议长度：不超过1000字符（前端提示）
```

**示例**:
```
✅ 正确：建仓
✅ 正确：止盈卖出，达到目标价位
✅ 正确：（不填）
```

### 2.10 tags（标签）

**格式要求**:
- 类型：Array<String>
- 可选字段
- Excel格式：逗号或分号分隔
- JSON格式：字符串数组

**验证规则**:
```typescript
// 1. 解析标签
let tagArray: string[] = [];
if (tags) {
  if (Array.isArray(tags)) {
    tagArray = tags;
  } else if (typeof tags === 'string') {
    // Excel格式：支持逗号、分号分隔
    tagArray = tags.split(/[,，;；]/).map(t => t.trim()).filter(Boolean);
  }
}

// 2. 标签长度限制
tagArray.forEach(tag => {
  if (tag.length > 50) {
    throw new Error(`标签 "${tag}" 长度不能超过50字符`);
  }
});

// 3. 标签数量限制（可选）
if (tagArray.length > 10) {
  console.warn('标签数量较多，建议不超过10个');
}
```

**示例**:
```
Excel格式：
✅ 正确：长期持有,核心资产
✅ 正确：长期持有;核心资产
✅ 正确：长期持有，核心资产（中文逗号）

JSON格式：
✅ 正确：["长期持有", "核心资产"]
✅ 正确：[]（空数组）
✅ 正确：（不填）
```

## 三、数据格式示例

### 3.1 Excel格式（完整示例）

| 投资组合 | 交易账户 | 日期 | 资产代码 | 资产名称 | 交易类型 | 数量 | 价格 | 币种 | 手续费 | 备注 | 标签 |
|---------|---------|------|---------|---------|---------|------|------|------|--------|------|------|
| 我的投资组合 | 港股账户 | 2024-01-15 | 00700.HK | 腾讯控股 | STOCK_BUY | 100 | 320.5 | HKD | 10 | 建仓 | 长期持有,核心资产 |
| 我的投资组合 | 美股账户 | 2024-02-20 | AAPL | Apple Inc. | STOCK_SELL | 50 | 185.2 | USD | 5 | 止盈 | |
| 长期投资组合 | A股账户 | 2024-03-10 | 600519.SS | 贵州茅台 | STOCK_BUY | 10 | 1680.5 | CNY | 16.8 | 补仓 | 白酒,消费 |

**说明**:
- 第1行：完整信息，港股交易
- 第2行：美股交易，无标签
- 第3行：A股交易，不同投资组合

### 3.2 JSON格式（完整示例）

```json
{
  "version": "1.0",
  "metadata": {
    "exportDate": "2024-01-15T10:30:00Z",
    "totalRecords": 3,
    "source": "FinApp"
  },
  "transactions": [
    {
      "portfolio": "我的投资组合",
      "account": "港股账户",
      "date": "2024-01-15",
      "asset": {
        "symbol": "00700.HK",
        "name": "腾讯控股"
      },
      "type": "STOCK_BUY",
      "quantity": 100,
      "price": 320.5,
      "currency": "HKD",
      "fee": 10,
      "notes": "建仓",
      "tags": ["长期持有", "核心资产"]
    },
    {
      "portfolio": "我的投资组合",
      "account": "美股账户",
      "date": "2024-02-20",
      "asset": {
        "symbol": "AAPL",
        "name": "Apple Inc."
      },
      "type": "STOCK_SELL",
      "quantity": 50,
      "price": 185.2,
      "currency": "USD",
      "fee": 5,
      "notes": "止盈"
    },
    {
      "portfolio": "长期投资组合",
      "account": "A股账户",
      "date": "2024-03-10",
      "asset": {
        "symbol": "600519.SS",
        "name": "贵州茅台"
      },
      "type": "STOCK_BUY",
      "quantity": 10,
      "price": 1680.5,
      "currency": "CNY",
      "fee": 16.8,
      "notes": "补仓",
      "tags": ["白酒", "消费"]
    }
  ]
}
```

### 3.3 最小化示例（仅必填字段）

**Excel**:
| 投资组合 | 交易账户 | 日期 | 资产代码 | 交易类型 | 数量 | 价格 | 币种 |
|---------|---------|------|---------|---------|------|------|------|
| 我的投资组合 | 港股账户 | 2024-01-15 | 00700.HK | STOCK_BUY | 100 | 320.5 | HKD |

**JSON**:
```json
{
  "transactions": [
    {
      "portfolio": "我的投资组合",
      "account": "港股账户",
      "date": "2024-01-15",
      "asset": {
        "symbol": "00700.HK"
      },
      "type": "STOCK_BUY",
      "quantity": 100,
      "price": 320.5,
      "currency": "HKD"
    }
  ]
}
```

## 四、字段计算逻辑

### 4.1 total_amount（总金额）

```typescript
/**
 * 计算总金额
 * 买入：quantity × price + fee
 * 卖出：quantity × price - fee
 */
function calculateTotalAmount(
  type: string,
  quantity: number,
  price: number,
  fee: number = 0
): number {
  const baseAmount = quantity * price;
  
  if (type === 'buy') {
    return baseAmount + fee;
  } else if (type === 'sell') {
    return baseAmount - fee;
  } else {
    // dividend, split等特殊类型
    return baseAmount;
  }
}
```

### 4.2 transaction_type（详细交易类型）

```typescript
/**
 * 映射交易类型
 */
function mapTransactionType(
  type: string,
  assetType: string
): string {
  const typeMap: Record<string, Record<string, string>> = {
    'buy': {
      'stock': 'STOCK_BUY',
      'fund': 'FUND_SUBSCRIBE',
      'bond': 'BOND_BUY',
      'option': 'OPTION_BUY'
    },
    'sell': {
      'stock': 'STOCK_SELL',
      'fund': 'FUND_REDEEM',
      'bond': 'BOND_SELL',
      'option': 'OPTION_SELL'
    },
    'dividend': {
      '*': 'DIVIDEND'
    },
    'split': {
      '*': 'STOCK_SPLIT'
    }
  };
  
  return typeMap[type]?.[assetType] || typeMap[type]?.['*'] || 'STOCK_BUY';
}
```

### 4.3 side（交易方向）

```typescript
/**
 * 映射交易方向
 */
function mapSide(type: string): string {
  const sideMap: Record<string, string> = {
    'buy': 'BUY',
    'sell': 'SELL',
    'dividend': 'DEPOSIT',
    'split': 'DEPOSIT'
  };
  
  return sideMap[type] || 'BUY';
}
```

## 五、验证错误示例

### 5.1 投资组合或账户不存在

```
❌ 错误信息：
导入失败（已回滚）

详细错误：
- 第2行: 投资组合 "测试组合" 不存在或已停用
- 第3行: 交易账户 "美股账户2" 在投资组合 "我的投资组合" 中不存在
- 第5行: 交易账户 "港股账户" 不属于投资组合 "长期投资组合"

解决方案：
1. 确认投资组合名称正确且已创建
2. 确认交易账户在对应的投资组合下已创建
3. 注意：交易账户必须属于指定的投资组合
4. 修正后重新导入
```

### 5.2 资产不存在

```
❌ 错误信息：
导入失败：发现 2 个不存在的资产 [TSLA, BABA]。
请先在【资产管理】中创建这些资产后再导入交易。

详细错误：
- 第2行: 资产不存在: TSLA
- 第5行: 资产不存在: BABA

解决方案：
1. 前往【资产管理】页面
2. 创建资产 TSLA 和 BABA
3. 重新导入交易数据
```

### 5.3 交易类型错误

```
❌ 错误信息：
导入失败（已回滚）

详细错误：
- 第3行: 不支持的交易类型: purchase
- 第7行: 不支持的交易类型: STOCK_PURCHASE

支持的交易类型：
STOCK_BUY, STOCK_SELL, FUND_SUBSCRIBE, FUND_REDEEM,
BOND_BUY, BOND_SELL, OPTION_BUY, OPTION_SELL, OPTION_EXERCISE,
DEPOSIT, WITHDRAWAL, DIVIDEND, INTEREST, FEE,
TRANSFER_IN, TRANSFER_OUT

解决方案：
1. 修正第3行的交易类型为 STOCK_BUY（或使用别名"买入"）
2. 修正第7行的交易类型为系统支持的类型
3. 重新导入
```

### 5.4 数据格式错误

```
❌ 错误信息：
导入失败（已回滚）

详细错误：
- 第3行: 交易数量必须大于0（当前值：0）
- 第4行: 日期格式无效（当前值：2024/01/15）
- 第6行: 币种必须是3位字母代码（当前值：RMB）

解决方案：
1. 修正第3行的数量为正数
2. 修正第4行的日期格式为 YYYY-MM-DD
3. 修正第6行的币种为 CNY（不是RMB）
4. 重新导入
```

## 六、最佳实践

### 6.1 导入前准备

1. **创建投资组合**: 确保目标投资组合已创建且处于活跃状态
2. **创建交易账户**: 在对应的投资组合下创建所需的交易账户
3. **创建资产**: 确保所有交易涉及的资产已在系统中创建
4. **确认层级关系**: 
   ```
   用户 → 投资组合 → 交易账户 → 交易记录
   ```
5. **下载模板**: 使用系统提供的模板，避免格式错误
6. **小批量测试**: 先导入少量数据测试，确认无误后再批量导入

### 6.2 数据质量检查

```typescript
/**
 * 导入前数据质量检查清单
 */
const qualityChecklist = {
  // 1. 必填字段完整性
  requiredFields: [
    'portfolio', 'account', 'date', 
    'asset.symbol', 'type', 'quantity', 'price', 'currency'
  ],
  
  // 2. 层级关系验证
  hierarchyValidation: {
    portfolioExists: true,      // 投资组合必须存在
    accountInPortfolio: true,   // 账户必须属于指定组合
    assetExists: true           // 资产必须存在
  },
  
  // 3. 交易类型验证
  validTransactionTypes: [
    'STOCK_BUY', 'STOCK_SELL',
    'FUND_SUBSCRIBE', 'FUND_REDEEM',
    'BOND_BUY', 'BOND_SELL',
    'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE',
    'DEPOSIT', 'WITHDRAWAL',
    'DIVIDEND', 'INTEREST', 'FEE',
    'TRANSFER_IN', 'TRANSFER_OUT'
  ],
  
  // 4. 日期合理性
  dateRange: {
    min: '1990-01-01',
    max: new Date().toISOString().split('T')[0]
  },
  
  // 5. 数值合理性
  valueRanges: {
    quantity: { min: 0.00000001, max: 999999999999 },
    price: { min: 0, max: 999999999999 },
    fee: { min: 0, max: 999999999 }
  },
  
  // 6. 币种验证
  validCurrencies: ['CNY', 'USD', 'HKD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'],
  
  // 7. 重复检查
  duplicateCheck: true
};
```

### 6.3 常见问题

**Q1: 如何处理港股Symbol？**
```
A: 港股Symbol格式为 5位数字.HK
   正确：00700.HK, 03690.HK, 09618.HK
   错误：700.HK, 3690.HK（缺少前导0）
```

**Q2: 分红交易如何导入？**
```
A: 分红交易设置：
   - type: dividend
   - quantity: 分红股数
   - price: 每股分红金额
   - fee: 0（通常无手续费）
```

**Q3: 拆股交易如何导入？**
```
A: 拆股交易设置：
   - type: split
   - quantity: 拆股后增加的股数
   - price: 0
   - notes: 说明拆股比例（如：1拆10）
```

**Q4: 可以导入历史交易吗？**
```
A: 可以，支持导入任意历史日期的交易
   建议：按时间顺序导入，便于后续数据分析
```

## 七、字段映射速查表

### 7.1 Excel列名映射

| Excel列名（中文） | Excel列名（英文） | JSON字段 | 数据库字段 | 必填 |
|-----------------|-----------------|---------|-----------|------|
| 投资组合 | portfolio | portfolio | portfolio_id | ✅ |
| 交易账户 | account | account | trading_account_id | ✅ |
| 日期 | date | date | transaction_date | ✅ |
| 资产代码 | symbol | asset.symbol | asset_id | ✅ |
| 资产名称 | name | asset.name | - | ❌ |
| 交易类型 | type | type | transaction_type | ✅ |
| 数量 | quantity | quantity | quantity | ✅ |
| 价格 | price | price | price | ✅ |
| 币种 | currency | currency | currency | ✅ |
| 手续费 | fee | fee | fees | ❌ |
| 备注 | notes | notes | notes | ❌ |
| 标签 | tags | tags | tags | ❌ |

### 7.2 交易类型映射（完整版）

| 用户输入（简化） | 标准交易类型 | 交易方向 | 说明 |
|----------------|-------------|---------|------|
| 买入, buy | STOCK_BUY | BUY | 股票买入 |
| 卖出, sell | STOCK_SELL | SELL | 股票卖出 |
| 申购, subscribe | FUND_SUBSCRIBE | BUY | 基金申购 |
| 赎回, redeem | FUND_REDEEM | SELL | 基金赎回 |
| 分红, dividend | DIVIDEND | DEPOSIT | 现金分红 |
| 存入, deposit | DEPOSIT | DEPOSIT | 存入现金 |
| 取出, withdraw | WITHDRAWAL | WITHDRAWAL | 取出现金 |

**注意**: 
- 标准交易类型必须与数据库CHECK约束一致
- 简化输入会自动映射到标准类型
- 建议直接使用标准类型以避免歧义

---

**文档版本**: 1.0  
**创建时间**: 2024-01-15  
**最后更新**: 2024-01-15  
**适用版本**: FinApp v1.0.1+
