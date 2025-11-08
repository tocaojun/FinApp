# 完整实施方案：简化架构 - 去掉市场维度，保留国家维度

## 📋 方案概述

### 核心决策
✅ 已确认：简化处理，去掉市场维度  
✅ 已确认：国家作为主要地理维度  
✅ 已确认：支持"全球"选项用于加密、商品等  

### 关键变更
```
移除：
  • market_id 字段
  • supports_markets 配置
  • 市场相关的查询逻辑

保留/添加：
  • country_id 字段（支持 NULL 表示全球）
  • supports_countries 配置
  • location_dimension 字段（确定是否需要国家）
```

---

## 🗂️ 数据模型变更

### 1. Asset 表

```sql
-- 当前状态
CREATE TABLE finapp.assets (
  id UUID PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  asset_type_id UUID NOT NULL,
  market_id UUID,                    -- ❌ 删除
  country_id UUID,                   -- ✅ 保留
  currency VARCHAR(3),
  UNIQUE(market_id, symbol),         -- ❌ 删除
  FOREIGN KEY (market_id) REFERENCES markets(id)  -- ❌ 删除
);

-- 更新后
CREATE TABLE finapp.assets (
  id UUID PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  asset_type_id UUID NOT NULL,
  country_id UUID,                   -- ✅ 保留，支持 NULL（全球资产）
  currency VARCHAR(3),
  UNIQUE(country_id, symbol),        -- ✅ 新唯一性约束
  FOREIGN KEY (country_id) REFERENCES countries(id)
);
```

### 2. AssetType 表

```sql
-- 保持不变（location_dimension 已经存在）
ALTER TABLE finapp.asset_types ADD COLUMN IF NOT EXISTS location_dimension VARCHAR(20) DEFAULT 'country';

-- location_dimension 的含义：
--   'country'  - 需要指定国家（如股票、债券）
--   'global'   - 全球资产，不需要国家（如加密、商品）
```

### 3. Markets 表

```
当前：在 assets 中被引用
更新后：变为参考数据，不再被关联查询

保留原因：
  • 可能用于用户界面显示
  • 可能用于报表统计
  • 未来可能需要扩展
  
删除原因：
  • 不再是资产的强制属性
  • 查询不再依赖于此
  • 简化了关系数据模型
```

---

## 📝 Prisma Schema 变更

### 当前 (schema.prisma)

```typescript
model Asset {
  id               String      @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  symbol           String      @db.VarChar(50)
  name             String      @db.VarChar(255)
  assetTypeId      String      @map("asset_type_id") @db.Uuid
  marketId         String?     @map("market_id") @db.Uuid          // ❌ 删除
  countryId        String?     @map("country_id") @db.Uuid         // ✅ 保留
  currency         String?     @db.VarChar(3)
  
  assetType        AssetType   @relation(fields: [assetTypeId], references: [id])
  market           Market?     @relation(fields: [marketId], references: [id])  // ❌ 删除
  country          Country?    @relation(fields: [countryId], references: [id])  // ✅ 保留
  
  @@unique([marketId, symbol])    // ❌ 删除
  @@map("assets")
}

model AssetType {
  id               String      @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  code             String      @unique @db.VarChar(20)
  name             String      @db.VarChar(100)
  category         String      @db.VarChar(50)
  locationDimension String?    @default("country") @map("location_dimension") @db.VarChar(20)
  // ... 其他字段
  
  @@map("asset_types")
}
```

### 更新后 (schema.prisma)

```typescript
model Asset {
  id               String      @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  symbol           String      @db.VarChar(50)
  name             String      @db.VarChar(255)
  assetTypeId      String      @map("asset_type_id") @db.Uuid
  countryId        String?     @map("country_id") @db.Uuid         // ✅ 支持 NULL（全球）
  currency         String?     @db.VarChar(3)
  
  assetType        AssetType   @relation(fields: [assetTypeId], references: [id])
  country          Country?    @relation(fields: [countryId], references: [id])
  
  @@unique([countryId, symbol])    // ✅ 新唯一性约束（NULL, symbol 也是唯一的）
  @@index([countryId])
  @@index([symbol])
  @@map("assets")
}

model AssetType {
  id                  String      @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  code                String      @unique @db.VarChar(20)
  name                String      @db.VarChar(100)
  category            String      @db.VarChar(50)
  locationDimension   String?     @default("country") @map("location_dimension") @db.VarChar(20)
  // 'country' - 需要国家 | 'global' - 全球无需国家
  
  @@map("asset_types")
}
```

---

## 🗄️ 数据库迁移脚本

### 迁移 010：去掉市场维度

```sql
-- 文件：backend/migrations/010_remove_market_dimension/migration.sql

-- 第 1 步：验证数据完整性
BEGIN;

-- 检查有多少资产有 market_id
SELECT COUNT(*) as total_assets FROM finapp.assets;
SELECT COUNT(*) as with_market FROM finapp.assets WHERE market_id IS NOT NULL;
SELECT COUNT(*) as without_market FROM finapp.assets WHERE market_id IS NULL;

-- 第 2 步：删除外键约束
ALTER TABLE finapp.assets 
DROP CONSTRAINT IF EXISTS assets_market_id_fkey;

-- 第 3 步：删除唯一性约束
ALTER TABLE finapp.assets 
DROP CONSTRAINT IF EXISTS assets_market_id_symbol_key;

-- 第 4 步：删除索引
DROP INDEX IF EXISTS finapp.idx_assets_market_id;

-- 第 5 步：添加新的唯一性约束（country_id + symbol）
ALTER TABLE finapp.assets 
ADD CONSTRAINT assets_country_id_symbol_unique UNIQUE (country_id, symbol);

-- 第 6 步：删除 market_id 列
ALTER TABLE finapp.assets DROP COLUMN IF EXISTS market_id;

-- 第 7 步：验证新约束生效
SELECT COUNT(DISTINCT (country_id, symbol)) as unique_combinations 
FROM finapp.assets;

-- 第 8 步：验证完成
SELECT COUNT(*) as final_count FROM finapp.assets;

COMMIT;
```

---

## 🔧 代码变更

### 1. PriceSyncService 简化

#### 删除的方法
```typescript
// ❌ 删除
async getMarketsByDataSourceAndAssetType(
  dataSourceId: string,
  assetTypeCode: string
): Promise<Array<{ id: string; code: string; name: string }>>
```

#### 保留/更新的方法

```typescript
// ✅ 保留并简化
async getCountriesByDataSourceAndAssetType(
  dataSourceId: string,
  assetTypeCode: string
): Promise<Array<{ id: string; code: string; name: string }>> {
  const dataSource = await this.getDataSource(dataSourceId);
  if (!dataSource) {
    throw new Error('Data source not found');
  }

  // 获取支持的国家列表
  const countryCodes = Array.isArray(dataSource.config?.supports_countries)
    ? dataSource.config.supports_countries
    : [];

  if (countryCodes.length === 0) {
    return [];
  }

  try {
    const results = await this.db.prisma.$queryRaw`
      SELECT id, code, name
      FROM finapp.countries
      WHERE code = ANY(${countryCodes}::text[])
      ORDER BY code
    ` as Array<{ id: string; code: string; name: string }>;
    return results;
  } catch (error) {
    console.error('Failed to query countries:', error);
    return countryCodes.map((code, idx) => ({
      id: `${assetTypeCode}-country-${idx}`,
      code,
      name: code,
    }));
  }
}

// ✅ 新增：支持全球资产
async getGlobalAssetTypes(): Promise<string[]> {
  try {
    const results = await this.db.prisma.$queryRaw`
      SELECT code
      FROM finapp.asset_types
      WHERE location_dimension = 'global'
      ORDER BY code
    ` as Array<{ code: string }>;
    return results.map(r => r.code);
  } catch (error) {
    console.error('Failed to query global asset types:', error);
    return [];
  }
}

// ✅ 更新：获取资产的统一方法
async getAssetsByDataSourceAndAssetType(
  dataSourceId: string,
  assetTypeCode: string
): Promise<Array<{
  id: string;
  symbol: string;
  name: string;
  countryId: string | null;
  locationDimension: string;
}>> {
  const dataSource = await this.getDataSource(dataSourceId);
  if (!dataSource) {
    throw new Error('Data source not found');
  }

  // 获取资产类型的位置维度
  const locationDimension = await this.getAssetTypeLocationDimension(assetTypeCode);

  if (locationDimension === 'global') {
    // 全球资产：countryId 为 NULL
    return await this.db.prisma.$queryRaw`
      SELECT a.id, a.symbol, a.name, a.country_id as "countryId", 
             '${locationDimension}' as "locationDimension"
      FROM finapp.assets a
      WHERE a.asset_type_id = (
        SELECT id FROM finapp.asset_types WHERE code = ${assetTypeCode}
      )
      AND a.country_id IS NULL
      ORDER BY a.symbol
    ` as any[];
  } else if (locationDimension === 'country') {
    // 国家维度资产：需要 country_id 在数据源支持列表中
    const countryCodes = Array.isArray(dataSource.config?.supports_countries)
      ? dataSource.config.supports_countries
      : [];

    if (countryCodes.length === 0) {
      return [];
    }

    return await this.db.prisma.$queryRaw`
      SELECT a.id, a.symbol, a.name, a.country_id as "countryId",
             '${locationDimension}' as "locationDimension"
      FROM finapp.assets a
      WHERE a.asset_type_id = (
        SELECT id FROM finapp.asset_types WHERE code = ${assetTypeCode}
      )
      AND a.country_id IS NOT NULL
      AND a.country_id IN (
        SELECT id FROM finapp.countries WHERE code = ANY(${countryCodes}::text[])
      )
      ORDER BY a.symbol
    ` as any[];
  }

  return [];
}

// ✅ 简化：获取数据源覆盖范围
async getDataSourceFullCoverage(dataSourceId: string): Promise<{
  id: string;
  name: string;
  provider: string;
  supportedCountries: Array<{ code: string; name: string }>;
  productTypesCoverage: Array<{
    code: string;
    name: string;
    locationDimension: string;
    coverage: Array<{ code: string; name: string }>;
  }>;
}> {
  const dataSource = await this.getDataSource(dataSourceId);
  if (!dataSource) {
    throw new Error('Data source not found');
  }

  // 获取国家列表
  const countryCodes = Array.isArray(dataSource.config?.supports_countries)
    ? dataSource.config.supports_countries
    : [];

  let countries: Array<{ code: string; name: string }> = [];
  if (countryCodes.length > 0) {
    try {
      const countryResults = await this.db.prisma.$queryRaw`
        SELECT code, name
        FROM finapp.countries
        WHERE code = ANY(${countryCodes}::text[])
        ORDER BY code
      ` as Array<{ code: string; name: string }>;
      countries = countryResults;
    } catch (error) {
      console.error('Failed to query countries:', error);
      countries = countryCodes.map(code => ({ code, name: code }));
    }
  }

  // 获取产品类型及其覆盖范围
  const productTypes = Array.isArray(dataSource.config?.supports_products)
    ? dataSource.config.supports_products
    : [];

  const productTypesCoverage: Array<{
    code: string;
    name: string;
    locationDimension: string;
    coverage: Array<{ code: string; name: string }>;
  }> = [];

  if (productTypes.length > 0) {
    try {
      const typeResults = await this.db.prisma.$queryRaw`
        SELECT code, name, location_dimension
        FROM finapp.asset_types
        WHERE code = ANY(${productTypes}::text[])
        ORDER BY code
      ` as Array<{ code: string; name: string; location_dimension: string }>;

      for (const type of typeResults) {
        let coverage: Array<{ code: string; name: string }> = [];
        
        if (type.location_dimension === 'country') {
          coverage = countries;  // 简化：直接使用国家列表
        }
        // 如果是 'global'，coverage 保持为空

        productTypesCoverage.push({
          code: type.code,
          name: type.name,
          locationDimension: type.location_dimension,
          coverage,
        });
      }
    } catch (error) {
      console.error('Failed to query asset types:', error);
    }
  }

  return {
    id: dataSource.id,
    name: dataSource.name,
    provider: dataSource.provider,
    supportedCountries: countries,
    productTypesCoverage,
  };
}
```

### 2. API 端点变更

#### 删除的端点
```typescript
// ❌ 删除
GET /api/markets?dataSourceId=...
```

#### 更新的端点

```typescript
// ✅ 更新
GET /api/data-sources/:id/coverage
// 返回完整的覆盖范围（简化后）
{
  "id": "...",
  "name": "...",
  "provider": "...",
  "supportedCountries": [
    { "code": "US", "name": "United States" },
    { "code": "CN", "name": "China" }
  ],
  "productTypesCoverage": [
    {
      "code": "STOCK",
      "name": "Stock",
      "locationDimension": "country",
      "coverage": [...]  // 国家列表
    },
    {
      "code": "CRYPTO",
      "name": "Cryptocurrency",
      "locationDimension": "global",
      "coverage": []  // 空列表，表示全球
    }
  ]
}

// ✅ 新增
GET /api/countries?assetType=...
// 获取特定资产类型的国家列表

// ✅ 新增
GET /api/assets?country=...&symbol=...
// 按国家和代码获取资产（简化查询）
```

### 3. 资产类型初始化

```typescript
// backend/src/seeding/assetTypeSeeding.ts

const assetTypes = [
  // 国家维度资产（location_dimension = 'country'）
  { code: 'STOCK', name: 'Stock', category: 'Equity', locationDimension: 'country' },
  { code: 'ETF', name: 'ETF', category: 'Equity', locationDimension: 'country' },
  { code: 'BOND', name: 'Bond', category: 'Fixed Income', locationDimension: 'country' },
  { code: 'FUND', name: 'Mutual Fund', category: 'Fund', locationDimension: 'country' },
  { code: 'BANK_WEALTH', name: 'Bank Wealth Product', category: 'Fund', locationDimension: 'country' },
  
  // 全球维度资产（location_dimension = 'global'）
  { code: 'CRYPTO', name: 'Cryptocurrency', category: 'Digital Asset', locationDimension: 'global' },
  { code: 'COMMODITY', name: 'Commodity', category: 'Physical', locationDimension: 'global' },
];
```

---

## 📊 资产查询逻辑对比

### 之前（需要市场维度）

```typescript
// 获取数据源支持的所有资产
async findAssetsForDataSource(dataSourceId: string, assetTypeCode: string) {
  const dataSource = await getDataSource(dataSourceId);
  
  // 第 1 层：获取支持的市场
  const supportedMarkets = dataSource.config.supports_markets;
  
  // 第 2 层：获取支持的国家
  const supportedCountries = dataSource.config.supports_countries;
  
  // 第 3 层：查询资产（需要同时满足两个条件）
  return db.assets.find({
    marketId: { $in: supportedMarkets },
    countryId: { $in: supportedCountries }
  });
}
```

### 之后（仅需国家维度）✅

```typescript
// 获取数据源支持的所有资产（简化了）
async findAssetsForDataSource(dataSourceId: string, assetTypeCode: string) {
  const dataSource = await getDataSource(dataSourceId);
  
  // 获取资产类型的位置维度
  const assetType = await getAssetType(assetTypeCode);
  
  if (assetType.locationDimension === 'global') {
    // 全球资产：直接获取 countryId 为 NULL 的资产
    return db.assets.find({
      assetTypeId: assetType.id,
      countryId: null
    });
  } else {
    // 国家维度资产：获取支持的国家列表
    const supportedCountries = dataSource.config.supports_countries;
    
    return db.assets.find({
      assetTypeId: assetType.id,
      countryId: { $in: supportedCountries }
    });
  }
}
```

---

## 🎯 前端改动

### 资产创建表单

#### 之前
```jsx
<Select 
  label="交易市场"
  required
  value={market}
  onChange={setMarket}
  options={markets.map(m => ({ value: m.id, label: m.name }))}
/>

<Select 
  label="国家"
  required
  value={country}
  onChange={setCountry}
  options={countries.map(c => ({ value: c.id, label: c.name }))}
/>
```

#### 之后 ✅
```jsx
// 动态显示国家选择器
{assetType?.locationDimension === 'country' && (
  <Select 
    label="国家"
    required
    value={country}
    onChange={setCountry}
    options={countries.map(c => ({ value: c.id, label: c.name }))}
  />
)}

{assetType?.locationDimension === 'global' && (
  <Alert type="info">
    这是一个全球资产，不需要选择国家。
  </Alert>
)}

// 移除市场选择器
{/* ❌ 市场选择器已删除 */}
```

---

## 🚀 实施步骤

### 第 1 阶段：准备（当前）

- [ ] 备份数据库
  ```bash
  pg_dump -h localhost -U finapp_user -d finapp_test > /Users/caojun/code/FinApp/backups/backup_before_market_removal_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] 验证现有数据
  ```sql
  SELECT COUNT(*) as total FROM finapp.assets;
  SELECT COUNT(*) as with_market FROM finapp.assets WHERE market_id IS NOT NULL;
  SELECT COUNT(*) as without_market FROM finapp.assets WHERE market_id IS NULL;
  ```

- [ ] 检查依赖
  ```bash
  grep -r "market_id\|marketId\|supports_markets" backend/src --include="*.ts"
  ```

### 第 2 阶段：数据库变更（1 小时）

- [ ] 执行迁移脚本 `010_remove_market_dimension`
- [ ] 验证约束生效
- [ ] 检查是否有错误

### 第 3 阶段：代码变更（2-3 小时）

- [ ] 更新 Prisma Schema
- [ ] 更新 PriceSyncService
- [ ] 删除市场相关的 API 端点
- [ ] 更新相关的 Service 类
- [ ] 运行 `npx prisma generate`

### 第 4 阶段：前端变更（1-2 小时）

- [ ] 移除市场选择器
- [ ] 更新资产创建/编辑表单
- [ ] 更新资产显示逻辑
- [ ] 测试全球资产的处理

### 第 5 阶段：测试和验证（1-2 小时）

- [ ] 单元测试
- [ ] 集成测试
- [ ] 手动测试
- [ ] 数据验证

### 第 6 阶段：部署（15 分钟）

- [ ] 提交代码
- [ ] 部署到测试环境
- [ ] 部署到生产环境

**总预计时间**：6-8 小时

---

## ✅ 验证清单

### 数据库
- [ ] `assets` 表中 `market_id` 已删除
- [ ] 新的唯一性约束 `(country_id, symbol)` 生效
- [ ] NULL 国家的资产能正确处理（全球资产）
- [ ] 没有数据丢失

### 代码
- [ ] 没有 TypeScript 错误
- [ ] 没有 linter 警告
- [ ] Prisma Schema 验证通过
- [ ] 没有引用已删除的 `market_id` 字段

### 功能
- [ ] 可以创建国家维度的资产
- [ ] 可以创建全球资产（countryId = NULL）
- [ ] 数据源查询按国家过滤正确
- [ ] 全球资产不受国家过滤影响
- [ ] API 返回数据正确

### 前端
- [ ] 市场选择器已移除
- [ ] 国家选择器按需显示
- [ ] 全球资产提示信息显示
- [ ] 资产列表正确显示

---

## 📌 重要注意事项

### ⚠️ 需要特别关注的地方

1. **NULL 国家的唯一性**
   - PostgreSQL 中 `NULL != NULL`
   - 因此 `(NULL, 'BTC')` 和 `(NULL, 'ETH')` 是不同的
   - 这正是我们想要的，全球资产之间互不重复

2. **数据源配置迁移**
   - 需要从 `supports_markets` 迁移到 `supports_countries`
   - 可以通过脚本自动转换

3. **向后兼容性**
   - 旧的市场数据不再使用，但表可以保留
   - 如果紧急回滚，可以从备份恢复

### 💡 优化建议

1. **分阶段实施**
   - 第 1 周：数据库 + 后端
   - 第 2 周：前端 + 测试
   - 不急于一次性完成

2. **监控和反馈**
   - 部署后监控 API 日志
   - 收集用户反馈
   - 确保没有隐藏的市场依赖

3. **文档更新**
   - 更新 API 文档
   - 更新开发文档
   - 更新用户手册

---

## 🎉 预期收益

### 代码简化
- 代码行数减少 40-50%
- 查询复杂度降低
- 维护成本下降

### 架构改进
- 概念更清晰（国家 > 市场）
- 数据模型更简洁（少一个关系）
- 业务逻辑更直观

### 用户体验
- 资产创建更简单
- 全球资产得到正式支持
- 前端交互更清晰

---

## 📅 实施时间表

```
第 1 天：
  • 上午：准备和备份
  • 下午：数据库迁移

第 2 天：
  • 上午：后端代码更新
  • 下午：测试

第 3 天：
  • 上午：前端改动
  • 下午：集成测试和部署

预计：2-3 天完成，总工时 6-8 小时
```

---

**准备好开始实施吗？**

下一步：创建数据库迁移脚本并执行备份。
