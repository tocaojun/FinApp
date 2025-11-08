# 资产类型位置维度解决方案

## 问题陈述

在金融投资系统中，不同类型的资产与地理位置的关系是不同的：

| 问题 | 原因 |
|------|------|
| 股票、期货必须属于特定交易市场 | 这些资产在交易所交易 |
| 债券、理财产品、基金不属于市场 | 这些资产不在交易所交易，而是在银行或其他机构发行 |
| 加密货币、商品没有地理限制 | 这些资产是全球交易的 |

**之前的问题**：系统对所有资产类型都假设绑定到交易市场，导致：
- 国债无法正确分类（它属于国家，不属于市场）
- 银行理财产品无法正确管理
- 数据源配置无法准确表示其覆盖范围

---

## 解决方案架构

### 1. 数据库模型变更

#### 新增字段：`asset_types.location_dimension`
```sql
ALTER TABLE finapp.asset_types ADD COLUMN location_dimension VARCHAR(20) DEFAULT 'market';
```

**允许的值**：
- `'market'` - 市场维度（股票、期货等）
- `'country'` - 国家维度（债券、理财等）
- `'global'` - 全球维度（加密货币、商品）

#### 初始化设置
```
市场维度: STOCK, ETF, FUTURE, OPTION, STOCK_OPTION
国家维度: BOND, BANK_WEALTH, MUTUAL_FUND, FUND, REIT, CASH
全球维度: CRYPTO, COMMODITY
```

### 2. 现有数据库关系

#### `assets` 表
- `market_id` (UUID, nullable) - 对于市场维度资产必填
- `country_id` (UUID, nullable) - 对于国家维度资产必填
- 通过 `asset_type_id` 的 `location_dimension` 确定使用哪个

#### `countries` 表
- 已存在的国家主数据

#### `markets` 表
- 已存在的市场主数据

---

## 关键改进

### ✅ 之前（有缺陷）
```
数据源配置：
{
  "supports_markets": ["NYSE", "NASDAQ"],
  "supports_products": ["STOCK", "BOND", "COMMODITY"]
}

问题：BOND 不应该支持市场，但配置中不清楚这一点
```

### ✅ 之后（改进后）
```
数据源配置：
{
  "supports_markets": ["NYSE", "NASDAQ"],
  "supports_countries": ["CN", "US"],
  "supports_products": ["STOCK", "BOND"]
}

改进：
1. STOCK 使用 markets 过滤
2. BOND 使用 countries 过滤
3. 完全清晰的覆盖范围表示
```

---

## 代码实现

### Prisma Schema 更新

```prisma
model AssetType {
  id                String    @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  code              String    @unique @db.VarChar(20)
  name              String    @db.VarChar(100)
  category          String    @db.VarChar(50)
  description       String?
  locationDimension String?   @default("market") @map("location_dimension") @db.VarChar(20)
  isActive          Boolean?  @default(true) @map("is_active")
  createdAt         DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  assets            Asset[]
  price_sync_tasks  price_sync_tasks[]

  @@index([locationDimension], map: "idx_asset_types_location_dimension")
  @@map("asset_types")
}
```

### PriceSyncService 新增方法

#### 1. 获取国家列表
```typescript
async getCountriesByDataSourceAndAssetType(
  dataSourceId: string,
  assetTypeCode: string
): Promise<Array<{ id: string; code: string; name: string }>>
```
- 获取某个数据源对于特定资产类型支持的国家列表

#### 2. 获取位置维度
```typescript
async getAssetTypeLocationDimension(
  assetTypeCode: string
): Promise<'market' | 'country' | 'global'>
```
- 快速查询资产类型的位置维度

#### 3. 获取完整覆盖范围
```typescript
async getDataSourceFullCoverage(dataSourceId: string): Promise<{
  id: string;
  name: string;
  provider: string;
  supportedMarkets: Array<{ code: string; name: string }>;
  supportedCountries: Array<{ code: string; name: string }>;
  productTypesCoverage: Array<{
    code: string;
    name: string;
    locationDimension: string;
    coverage: Array<{ code: string; name: string }>;
  }>;
}>
```
- 一次性获取数据源的完整信息，包括支持的市场、国家和产品类型的位置维度

---

## 业务逻辑示例

### 场景 1：创建股票资产（市场维度）
```typescript
const stock = await assetService.createAsset({
  symbol: "AAPL",
  name: "Apple Inc.",
  assetTypeId: "STOCK",      // location_dimension = 'market'
  marketId: "NASDAQ_UUID",   // ✅ 必须填充
  countryId: null,           // ❌ 不需要填充
  currency: "USD"
});
```

### 场景 2：创建债券资产（国家维度）
```typescript
const bond = await assetService.createAsset({
  symbol: "CNB10",
  name: "China 10Y Bond",
  assetTypeId: "BOND",       // location_dimension = 'country'
  marketId: null,            // ❌ 不需要填充
  countryId: "CN_UUID",      // ✅ 必须填充
  currency: "CNY"
});
```

### 场景 3：查询数据源覆盖范围
```typescript
// 彭博社既提供股票数据(市场维度)，也提供债券数据(国家维度)
const coverage = await priceSyncService.getDataSourceFullCoverage(
  bloombergDataSourceId
);

// coverage.productTypesCoverage 会显示：
// {
//   code: "STOCK",
//   locationDimension: "market",
//   coverage: [NYSE, NASDAQ, ...] // 市场列表
// }
// {
//   code: "BOND",
//   locationDimension: "country",
//   coverage: [US, CN, ...] // 国家列表
// }
```

### 场景 4：创建同步任务
```typescript
// 股票同步任务
const syncStocks = await priceSyncService.createSyncTask({
  name: "Sync US Stocks",
  asset_type_id: "STOCK",
  market_id: "NASDAQ",       // 基于市场过滤
  data_source_id: "bloomberg"
});

// 债券同步任务
const syncBonds = await priceSyncService.createSyncTask({
  name: "Sync Chinese Bonds",
  asset_type_id: "BOND",
  country_id: "CN",          // 基于国家过滤（新功能）
  data_source_id: "iboxx"
});
```

---

## 迁移完成清单

- [x] 添加 `location_dimension` 列到 `asset_types` 表
- [x] 初始化现有资产类型的位置维度
- [x] 更新 Prisma Schema
- [x] 创建新的 PriceSyncService 方法
- [x] 添加数据库索引优化查询
- [x] TypeScript 类型检查通过
- [x] 创建完整文档

---

## 前端集成建议

### 级联选择器优化
```typescript
// 第1级：选择数据源
<Select datasource={dataSources} onChange={selectDataSource} />

// 第2级：根据数据源获取产品类型
useEffect(() => {
  const coverage = await priceSyncService.getDataSourceFullCoverage(
    selectedDataSource.id
  );
  setProductTypes(coverage.productTypesCoverage);
}, [selectedDataSource]);

// 第3级：根据产品类型显示动态选择器
{selectedProductType.locationDimension === 'market' ? (
  <Select options={selectedProductType.coverage} label="Market" />
) : (
  <Select options={selectedProductType.coverage} label="Country" />
)}
```

---

## 向后兼容性

- ✅ 现有的股票、期货等资产不受影响
- ✅ 现有的 `supports_markets` 配置继续工作
- ✅ 新的 `supports_countries` 配置是可选的
- ✅ 系统会自动基于 `location_dimension` 选择正确的维度

---

## 总结

这个解决方案通过引入**位置维度**的概念，为不同类型的资产类型提供了正确的地理位置管理方式：

| 维度 | 资产类型 | 位置字段 | 数据源配置 |
|------|---------|---------|----------|
| **市场** | STOCK, ETF, FUTURE, OPTION | `market_id` | `supports_markets` |
| **国家** | BOND, BANK_WEALTH, FUND, REIT, CASH | `country_id` | `supports_countries` |
| **全球** | CRYPTO, COMMODITY | 无限制 | 无地理限制 |

系统现在可以准确处理国债、理财产品、基金等不绑定交易所的资产类型，同时保持对市场维度资产的完整支持。
