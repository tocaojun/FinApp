# 资产类型位置维度指南

## 概述

为了正确处理不同资产类型与地理位置的关系，系统引入了 **位置维度** 的概念。

## 位置维度分类

资产类型可以分为以下三种位置维度：

### 1. 🏢 市场维度 (`market`)

**定义**：资产在特定交易市场上交易。每个资产必须属于一个具体的市场。

**适用资产类型**：
- `STOCK` - 股票（NYSE、NASDAQ、SSE、SZSE 等）
- `ETF` - 交易所交易基金（通过交易所交易）
- `FUTURE` - 期货（在期货交易所交易）
- `OPTION` - 期权（在期权交易所交易）

**特点**：
- 必须关联 `marketId`
- 数据源通过 `supports_markets` 配置指定支持的交易市场
- 例如：黑石集团(AAPL)在纳斯达克(NASDAQ)交易

**数据库配置示例**：
```json
{
  "supports_products": ["STOCK", "ETF"],
  "supports_markets": ["NASDAQ", "NYSE", "SSE"]
}
```

---

### 2. 🌍 国家维度 (`country`)

**定义**：资产属于特定国家但不通过交易市场交易，或不与特定市场绑定。

**适用资产类型**：
- `BOND` - 债券（国债、公司债等）
- `WEALTH_NAV` - 净值型理财产品（银行理财、基金等有单位净值的产品）
- `WEALTH_BALANCE` - 余额型理财产品（活期存款、现金理财等仅有余额的产品）
- `MUTUAL_FUND` - 共同基金/基金（场外基金）
- `FUND` - 其他基金产品
- `REIT` - 房地产投资信托（虽然某些REIT在交易所交易，但主要由国家/地区定义）
- `CASH` - 现金/货币（按国家/货币维度）

**特点**：
- 不强制要求 `marketId`（可以为 NULL）
- 必须关联 `country_id`
- 数据源通过 `supports_countries` 配置指定支持的国家
- 例如：中国国债属于中国，美国国债属于美国

**数据库配置示例**：
```json
{
  "supports_products": ["BOND", "WEALTH_NAV", "WEALTH_BALANCE", "MUTUAL_FUND"],
  "supports_countries": ["CN", "US", "HK"]
}
```

---

### 3. 🌐 全球维度 (`global`)

**定义**：资产是全球性的，不局限于特定市场或国家。

**适用资产类型**：
- `CRYPTO` - 加密货币（比特币、以太坊等）
- `COMMODITY` - 商品（石油、黄金等）

**特点**：
- 不强制要求 `marketId` 或 `country_id`
- 可以同时属于多个市场（如黄金在多个交易所交易）
- 数据源配置中可以同时包含 `supports_markets`
- 例如：比特币在全球各地交易所可用

---

## 数据模型关系

### 新增字段

#### 1. `asset_types` 表
```sql
ALTER TABLE finapp.asset_types
ADD COLUMN location_dimension VARCHAR(20) DEFAULT 'market';
-- 值: 'market' | 'country' | 'global'
```

#### 2. `countries` 表（已存在）
```
id: UUID (主键)
code: VARCHAR(3) - 国家代码 (如 'CN', 'US')
name: VARCHAR(100) - 国家名称
currency: VARCHAR(3) - 货币代码
timezone: VARCHAR(50) - 时区
is_active: BOOLEAN
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### 3. `assets` 表
```
country_id: UUID (外键，可选)
market_id: UUID (外键，可选)
-- 根据 asset_type 的 location_dimension，选择填充 country_id 或 market_id
```

---

## 业务逻辑

### 数据源覆盖范围

#### 市场维度资产的数据源配置
```typescript
// 支持 NYSE、NASDAQ、SSE、SZSE 的数据源
const marketDataSource = {
  name: "Bloomberg Market Data",
  provider: "bloomberg",
  config: {
    supports_products: ["STOCK", "ETF"],
    supports_markets: ["NYSE", "NASDAQ", "SSE", "SZSE"]
  }
}
```

#### 国家维度资产的数据源配置
```typescript
// 支持中国和美国的债券、理财产品
const countryDataSource = {
  name: "Bond & Wealth Manager",
  provider: "local_banks",
  config: {
    supports_products: ["BOND", "WEALTH_NAV", "WEALTH_BALANCE", "MUTUAL_FUND"],
    supports_countries: ["CN", "US"]
  }
}
```

#### 混合配置（同时支持市场和国家维度）
```typescript
// 数据源同时支持股票(市场维度)和债券(国家维度)
const hybridDataSource = {
  name: "Comprehensive Market Data",
  provider: "composite",
  config: {
    supports_products: ["STOCK", "BOND"],
    supports_markets: ["NYSE", "NASDAQ"],
    supports_countries: ["CN", "US"]
  }
}
```

---

## PriceSyncService 新增方法

### 1. 获取资产类型的位置维度
```typescript
async getAssetTypeLocationDimension(assetTypeCode: string): Promise<'market' | 'country' | 'global'>
```
- 获取某个资产类型是市场维度、国家维度还是全球维度

### 2. 按市场获取资产
```typescript
async getMarketsByDataSourceAndAssetType(dataSourceId, assetTypeCode)
```
- 现有方法，获取某个数据源对于特定资产类型支持的市场

### 3. 按国家获取资产
```typescript
async getCountriesByDataSourceAndAssetType(dataSourceId, assetTypeCode)
```
- 新增方法，获取某个数据源对于特定资产类型支持的国家

### 4. 获取完整覆盖范围
```typescript
async getDataSourceFullCoverage(dataSourceId)
```
- 新增方法，返回数据源支持的市场、国家和产品类型的完整信息
- 返回结构：
  ```typescript
  {
    id: string;
    name: string;
    provider: string;
    supportedMarkets: Array<{ code: string; name: string }>;
    supportedCountries: Array<{ code: string; name: string }>;
    productTypesCoverage: Array<{
      code: string;
      name: string;
      locationDimension: string;  // 'market' | 'country' | 'global'
      coverage: Array<{ code: string; name: string }>;
    }>;
  }
  ```

---

## 使用示例

### 创建股票资产（市场维度）
```typescript
const apple = {
  symbol: "AAPL",
  name: "Apple Inc.",
  assetTypeId: "STOCK",  // 市场维度
  marketId: "NASDAQ",    // 必须填充
  countryId: null,       // 不需要填充
  currency: "USD"
};
```

### 创建国债资产（国家维度）
```typescript
const usaTreasury = {
  symbol: "US10Y",
  name: "US 10-Year Treasury",
  assetTypeId: "BOND",   // 国家维度
  marketId: null,        // 不需要填充
  countryId: "US",       // 必须填充
  currency: "USD"
};
```

### 创建黄金资产（全球维度）
```typescript
const gold = {
  symbol: "XAUUSD",
  name: "Gold",
  assetTypeId: "COMMODITY",  // 全球维度
  marketId: null,            // 可选
  countryId: null,           // 可选
  currency: "USD"
};
```

### 查询数据源覆盖范围
```typescript
// 获取彭博社数据源的完整覆盖信息
const coverage = await priceSyncService.getDataSourceFullCoverage(bloombergId);

// 返回示例：
{
  id: "...",
  name: "Bloomberg",
  provider: "bloomberg",
  supportedMarkets: [
    { code: "NYSE", name: "New York Stock Exchange" },
    { code: "NASDAQ", name: "Nasdaq" }
  ],
  supportedCountries: [
    { code: "US", name: "United States" },
    { code: "CN", name: "China" }
  ],
  productTypesCoverage: [
    {
      code: "STOCK",
      name: "Stock",
      locationDimension: "market",
      coverage: [
        { code: "NYSE", name: "NYSE" },
        { code: "NASDAQ", name: "Nasdaq" }
      ]
    },
    {
      code: "BOND",
      name: "Bond",
      locationDimension: "country",
      coverage: [
        { code: "US", name: "United States" },
        { code: "CN", name: "China" }
      ]
    }
  ]
}
```

---

## 迁移步骤（已完成）

### 1. 添加 `location_dimension` 列
```sql
ALTER TABLE finapp.asset_types
ADD COLUMN location_dimension VARCHAR(20) DEFAULT 'market';
```

### 2. 初始化现有资产类型的位置维度
- STOCK, ETF, FUTURE, OPTION → 'market'
- BOND, WEALTH_NAV, WEALTH_BALANCE, MUTUAL_FUND, FUND, REIT, CASH → 'country'
- CRYPTO, COMMODITY → 'global'

### 3. 扩展数据源配置支持
- 在 `price_data_sources.config` JSON 中添加 `supports_countries` 字段
- 格式：`"supports_countries": ["CN", "US", "HK"]`

---

## 常见场景处理

### 场景 1：同步股票数据
```typescript
// 创建同步任务
const syncTask = {
  data_source_id: "bloomberg_id",
  asset_type_id: "STOCK",          // 市场维度
  market_id: "NASDAQ",             // 指定市场
  schedule_type: "cron",
  cron_expression: "0 17 * * 1-5"  // 工作日收盘后
};

// 系统自动查询该数据源支持的NASDAQ市场中的所有股票
```

### 场景 2：同步债券数据
```typescript
// 创建同步任务
const syncTask = {
  data_source_id: "bond_provider_id",
  asset_type_id: "BOND",           // 国家维度
  country_id: "CN",               // 指定国家
  schedule_type: "cron",
  cron_expression: "0 9 * * 1-5"   // 交易日开盘
};

// 系统自动查询该数据源在中国发行的债券
```

### 场景 3：混合数据源
```typescript
// 某个数据源同时支持市场和国家维度的资产
const fullCoverage = await priceSyncService.getDataSourceFullCoverage(dataSourceId);

// 可以根据 locationDimension 选择使用市场或国家进行过滤
fullCoverage.productTypesCoverage.forEach(product => {
  if (product.locationDimension === 'market') {
    // 使用 markets 进行同步
  } else if (product.locationDimension === 'country') {
    // 使用 countries 进行同步
  }
});
```

---

## 最佳实践

### ✅ 推荐做法

1. **明确指定位置维度**
   - 创建新的资产类型时，显式设置 `location_dimension`
   - 不要依赖默认值

2. **数据源配置保持一致**
   - 产品类型和对应的位置信息必须匹配
   - 例如：`supports_products` 中包含 BOND，`supports_countries` 必须不为空

3. **资产创建时验证**
   - 根据 `location_dimension` 验证是否填充了正确的位置字段
   - STOCK → 必须有 marketId
   - BOND → 必须有 countryId
   - CRYPTO → 可以都没有

4. **查询时利用位置维度**
   - 使用 `getDataSourceFullCoverage()` 了解数据源的完整能力
   - 构建前端 UI 时，根据位置维度动态显示市场选择器或国家选择器

### ❌ 避免做法

1. **混淆市场和国家**
   - 不要在国债资产上填充 marketId 而忽略 countryId

2. **忽略位置维度约束**
   - 不要假设所有资产都需要 marketId

3. **数据源配置不清晰**
   - 避免 `supports_markets` 和 `supports_countries` 同时为空但产品类型不是全球

---

## 总结

| 维度 | 关键字段 | 示例 | 配置参数 |
|------|---------|------|---------|
| **市场** | `market_id` | 股票、期货 | `supports_markets` |
| **国家** | `country_id` | 债券、理财 | `supports_countries` |
| **全球** | 无限制 | 加密、商品 | 无地理限制 |

这种分类确保了系统能够准确处理不同类型资产的地理位置属性，提高了数据管理和同步的准确性和效率。
