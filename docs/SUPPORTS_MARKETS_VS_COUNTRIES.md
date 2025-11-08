# 支持市场 vs 支持国家：完整对比与解决方案

## 你的问题

> "但有些资产类型是不绑定交易所的，怎么处理这个逻辑呢？例如国债、理财产品、基金等"

这是一个非常好的问题，反映了金融系统中的真实需求。

---

## 简短回答

**不需要把 `supports_markets` 改为 `supports_country`。**

正确的做法是：**同时支持两者**，并通过 `location_dimension` 字段区分资产类型。

---

## 完整架构图

```
                        数据源配置
                           │
                ┌──────────┼──────────┐
                │          │          │
         supports_     supports_   支持的
         markets       countries   产品
           │             │          │
           │             │          │
           ▼             ▼          ▼
    ┌─────────────────────────────────┐
    │   资产类型 (asset_types)        │
    │   - STOCK: market              │
    │   - BOND: country              │
    │   - CRYPTO: global             │
    └─────────────────────────────────┘
           │
           └─ location_dimension ──┐
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
      market                   country                  global
   (marketId)               (countryId)            (无限制)
      │                        │                      │
      ▼                        ▼                      ▼
    NYSE                    China                  Bitcoin
    NASDAQ                  USA                    Gold
    SSE                     Hong Kong              Oil
```

---

## 核心概念对比

### `supports_markets` - 市场维度
```
适用场景：资产在特定交易市场上交易
适用资产：STOCK, ETF, FUTURE, OPTION

配置示例：
{
  "supports_products": ["STOCK", "ETF"],
  "supports_markets": ["NYSE", "NASDAQ", "SSE"]
}

查询方式：
  SELECT * FROM assets 
  WHERE asset_type_id = (SELECT id FROM asset_types WHERE code='STOCK')
    AND market_id = (SELECT id FROM markets WHERE code='NASDAQ')
```

### `supports_countries` - 国家维度
```
适用场景：资产由特定国家/地区发行或管理
适用资产：BOND, BANK_WEALTH, MUTUAL_FUND, REIT, CASH

配置示例：
{
  "supports_products": ["BOND", "BANK_WEALTH"],
  "supports_countries": ["CN", "US"]
}

查询方式：
  SELECT * FROM assets 
  WHERE asset_type_id = (SELECT id FROM asset_types WHERE code='BOND')
    AND country_id = (SELECT id FROM countries WHERE code='CN')
```

---

## 资产类型完整分类

### 🏢 市场维度资产（在交易市场交易）

| 代码 | 名称 | 示例 | 必须字段 |
|------|------|------|---------|
| STOCK | 股票 | AAPL (NYSE), 平安 (SSE) | market_id ✅ |
| ETF | 交易所交易基金 | SPY, 沪深300ETF | market_id ✅ |
| FUTURE | 期货 | 原油期货, 黄金期货 | market_id ✅ |
| OPTION | 期权 | 股票期权, 指数期权 | market_id ✅ |
| STOCK_OPTION | 股票期权 | SPX 期权 | market_id ✅ |

**数据源配置**：只需要 `supports_markets`
```json
{
  "supports_products": ["STOCK", "ETF"],
  "supports_markets": ["NYSE", "NASDAQ", "SSE", "SZSE"]
}
```

---

### 🌍 国家维度资产（国家发行或管理）

| 代码 | 名称 | 示例 | 必须字段 |
|------|------|------|---------|
| BOND | 债券 | 中国国债, 美国国债 | country_id ✅ |
| BANK_WEALTH | 银行理财 | 招商银行理财, 工商银行理财 | country_id ✅ |
| MUTUAL_FUND | 共同基金 | 美国共同基金 | country_id ✅ |
| FUND | 基金 | 中国公募基金 | country_id ✅ |
| REIT | 房地产信托 | 新加坡REIT, 美国REIT | country_id ✅ |
| CASH | 现金 | 人民币, 美元 | country_id ✅ |

**数据源配置**：需要 `supports_countries`
```json
{
  "supports_products": ["BOND", "BANK_WEALTH", "MUTUAL_FUND"],
  "supports_countries": ["CN", "US", "HK"]
}
```

---

### 🌐 全球维度资产（全球交易）

| 代码 | 名称 | 示例 | 必须字段 |
|------|------|------|---------|
| CRYPTO | 加密货币 | Bitcoin, Ethereum | 无 |
| COMMODITY | 商品 | 黄金, 原油 | 无 |

**数据源配置**：无地理限制
```json
{
  "supports_products": ["CRYPTO", "COMMODITY"]
  // 可选添加：
  // "supports_markets": ["..."] 如果在特定市场交易
}
```

---

## 数据库结构

### 资产类型表（asset_types）
```sql
CREATE TABLE asset_types (
  id                  UUID PRIMARY KEY,
  code                VARCHAR(20) UNIQUE,
  name                VARCHAR(100),
  location_dimension  VARCHAR(20) DEFAULT 'market',  -- ⭐ 新增字段
                      -- 值: 'market' | 'country' | 'global'
  ...
);
```

### 资产表（assets）
```sql
CREATE TABLE assets (
  id            UUID PRIMARY KEY,
  symbol        VARCHAR(50),
  asset_type_id UUID,  -- 关联 asset_types
  market_id     UUID,  -- ← 对于市场维度资产必填
  country_id    UUID,  -- ← 对于国家维度资产必填（新增）
  ...
  FOREIGN KEY (market_id) REFERENCES markets(id),
  FOREIGN KEY (country_id) REFERENCES countries(id)
);
```

---

## 实际场景示例

### 场景 1：彭博社数据源

彭博社既提供股票数据（市场维度），也提供债券数据（国家维度）。

```json
{
  "name": "Bloomberg Terminal",
  "provider": "bloomberg",
  "config": {
    "supports_products": ["STOCK", "ETF", "BOND"],
    "supports_markets": ["NYSE", "NASDAQ", "HKEX", "SSE"],
    "supports_countries": ["US", "CN", "HK", "JP"],
    "rate_limit_per_minute": 600
  }
}
```

查询数据源覆盖范围：
```typescript
const coverage = await priceSyncService.getDataSourceFullCoverage(bloombergId);

// 返回：
{
  supportedMarkets: [
    { code: "NYSE", name: "New York Stock Exchange" },
    { code: "NASDAQ", name: "Nasdaq" },
    ...
  ],
  supportedCountries: [
    { code: "US", name: "United States" },
    { code: "CN", name: "China" },
    ...
  ],
  productTypesCoverage: [
    {
      code: "STOCK",
      name: "Stock",
      locationDimension: "market",
      coverage: [NYSE, NASDAQ, HKEX, SSE]  // 市场列表
    },
    {
      code: "BOND",
      name: "Bond",
      locationDimension: "country",
      coverage: [US, CN, HK, JP]  // 国家列表
    }
  ]
}
```

### 场景 2：创建同步任务

#### 同步美国股票
```typescript
const stockSyncTask = {
  name: "Sync US Stocks from Bloomberg",
  data_source_id: "bloomberg_id",
  asset_type_id: "STOCK",      // location_dimension='market'
  market_id: "NYSE_ID",        // ✅ 使用市场维度
  schedule_type: "cron",
  cron_expression: "0 17 * * 1-5"
};

// 系统将：
// 1. 获取 asset_type='STOCK' 的所有资产
// 2. 过滤 market_id='NYSE_ID' 的资产
// 3. 从彭博社同步这些资产的价格数据
```

#### 同步中国债券
```typescript
const bondSyncTask = {
  name: "Sync Chinese Bonds from Bloomberg",
  data_source_id: "bloomberg_id",
  asset_type_id: "BOND",       // location_dimension='country'
  country_id: "CN_ID",         // ✅ 使用国家维度（新功能）
  schedule_type: "cron",
  cron_expression: "0 09 * * 1-5"
};

// 系统将：
// 1. 获取 asset_type='BOND' 的所有资产
// 2. 过滤 country_id='CN_ID' 的资产
// 3. 从彭博社同步这些资产的价格数据
```

---

## 前端集成流程

### 动态级联选择器

```typescript
// 第1步：选择数据源
<DataSourceSelector onChange={handleDataSourceChange} />

// 第2步：获取数据源的完整覆盖范围
useEffect(async () => {
  const coverage = await priceSyncService.getDataSourceFullCoverage(
    selectedDataSource.id
  );
  setProductTypeCoverage(coverage.productTypesCoverage);
}, [selectedDataSource]);

// 第3步：显示产品类型选择器
<ProductTypeSelector 
  options={productTypeCoverage}
  onChange={handleProductTypeChange}
/>

// 第4步：根据 location_dimension 动态显示第二级选择器
{selectedProductType && (
  <>
    {selectedProductType.locationDimension === 'market' ? (
      <MarketSelector 
        markets={selectedProductType.coverage}
        onChange={handleMarketChange}
      />
    ) : selectedProductType.locationDimension === 'country' ? (
      <CountrySelector 
        countries={selectedProductType.coverage}
        onChange={handleCountryChange}
      />
    ) : null}
  </>
)}
```

### 前端代码示例

```javascript
// 创建资产时的验证
async function validateAssetCreation(assetData) {
  const assetType = await getAssetType(assetData.assetTypeId);
  
  if (assetType.locationDimension === 'market') {
    if (!assetData.marketId) {
      throw new Error(`${assetType.name} 必须指定市场`);
    }
  } else if (assetType.locationDimension === 'country') {
    if (!assetData.countryId) {
      throw new Error(`${assetType.name} 必须指定国家`);
    }
  }
  
  return true;
}
```

---

## 关键差异总结

| 方面 | 市场维度 | 国家维度 | 全球维度 |
|------|---------|---------|---------|
| **资产类型** | STOCK, ETF, FUTURE, OPTION | BOND, BANK_WEALTH, FUND | CRYPTO, COMMODITY |
| **关键字段** | market_id | country_id | 无 |
| **数据源配置** | supports_markets | supports_countries | 无 |
| **特点** | 在交易市场交易 | 由国家发行/管理 | 全球自由交易 |
| **查询基础** | SELECT ... WHERE market_id=? | SELECT ... WHERE country_id=? | 任意组合 |
| **示例** | AAPL在NASDAQ | 中国国债 | 比特币 |

---

## 常见问题

### Q: 为什么不把所有东西都基于 `supports_countries`？
**A:** 因为股票不属于国家，而是属于交易市场。同一只股票可能在多个市场交易（如跨境上市）。市场是正确的维度。

### Q: 某些债券也在交易市场交易（如美国国债期货），怎么办？
**A:** 这种情况下，资产可以同时填充 `market_id` 和 `country_id`。系统根据需要选择使用哪个维度。

### Q: 如何处理全球商品（如黄金）既在多个市场交易，也有全球报价？
**A:** 黄金属于全球维度资产，可以同时记录在不同市场的交易信息。`location_dimension='global'` 表示不强制绑定任何一个特定位置。

### Q: 实现中是否需要修改现有的股票资产数据？
**A:** 不需要。现有的股票资产继续保持 `marketId`。系统会自动通过 `location_dimension` 判断使用哪个字段。

---

## 总结

系统现在支持三种资产地理维度模式：

```
┌─────────────────────────────────────────────────────────┐
│                    资产定位模式                          │
├─────────────────────────────────────────────────────────┤
│ MARKET (市场维度)   → 资产在交易所交易                  │
│ COUNTRY (国家维度)  → 资产由国家发行/管理               │
│ GLOBAL (全球维度)   → 资产全球通用                      │
└─────────────────────────────────────────────────────────┘
```

这提供了：
- ✅ 准确的资产分类
- ✅ 清晰的数据源配置
- ✅ 灵活的业务模型
- ✅ 可扩展的架构

**答案：不是修改，而是扩展！** 🚀
