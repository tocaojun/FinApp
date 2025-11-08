# 数据源级联过滤功能 - 详细指南

**功能版本**: v2.0 (级联过滤)  
**更新日期**: 2025-11-07  
**功能状态**: ✅ 已实现

---

## 📌 功能概述

实现**三级级联过滤**（Cascading Filter）：

```
数据源 (Data Source)
    ↓
资产类型 (Asset Type)  ← 受数据源影响
    ↓
市场 (Market)  ← 受数据源和资产类型共同影响
```

### 核心逻辑

- **第一级**: 用户选择**数据源** → 前端加载该数据源支持的**资产类型**
- **第二级**: 用户选择**资产类型** → 前端加载该数据源+资产类型组合支持的**市场**
- **第三级**: 用户选择**市场** → 完成三级选择

### 与上一版本的区别

| 版本 | 过滤方式 | 说明 |
|-----|--------|------|
| v1.0 | 平行过滤 | 数据源→资产类型, 数据源→市场 (两个独立过滤) |
| **v2.0** | **级联过滤** | 数据源→资产类型→市场 (三个依次过滤) |

---

## 🔧 技术实现

### 后端 API

#### 1. 获取数据源覆盖范围（已修改）

**端点**: `GET /api/price-sync/data-sources/:id/coverage`

**返回格式**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Alpha Vantage",
    "provider": "alpha_vantage",
    "productTypes": [
      { "code": "STOCK", "name": "股票" },
      { "code": "ETF", "name": "ETF" }
    ],
    "marketsByProduct": {
      "STOCK": [
        { "code": "NYSE", "name": "纽约证券交易所" },
        { "code": "NASDAQ", "name": "纳斯达克" }
      ],
      "ETF": [
        { "code": "NYSE", "name": "纽约证券交易所" },
        { "code": "NASDAQ", "name": "纳斯达克" }
      ]
    }
  }
}
```

#### 2. 获取资产类型对应的市场（新增）

**端点**: `GET /api/price-sync/data-sources/:id/markets?asset_type={assetTypeCode}`

**参数**:
- `:id` (路径参数): 数据源 ID
- `asset_type` (查询参数): 资产类型代码 (如 "STOCK", "BOND")

**返回格式**:
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "code": "NYSE", "name": "纽约证券交易所" },
    { "id": "uuid", "code": "NASDAQ", "name": "纳斯达克" }
  ]
}
```

### 后端服务方法

#### `getDataSourceCoverage(dataSourceId)`
- 返回数据源支持的产品类型列表
- 返回产品类型到市场的映射关系 (`marketsByProduct`)
- 支持细粒度配置：通过 `config.product_market_mapping` 定义特定产品-市场组合

#### `getMarketsByDataSourceAndAssetType(dataSourceId, assetTypeCode)`
- 根据数据源 ID 和资产类型代码查询支持的市场
- 返回完整的市场信息（包括 ID）

### 前端实现

#### 状态管理
```typescript
const [filteredAssetTypes, setFilteredAssetTypes] = useState<AssetType[]>([]);
const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
```

#### 级联加载函数

**第一级加载 - 资产类型**:
```typescript
const loadDataSourceCoverage = async (dataSourceId: string) => {
  // 1. 调用 /data-sources/:id/coverage
  // 2. 获取支持的产品类型
  // 3. 过滤和设置 filteredAssetTypes
  // 4. 清空市场选择
}
```

**第二级加载 - 市场**:
```typescript
const loadMarketsByAssetType = async (dataSourceId: string, assetTypeCode: string) => {
  // 1. 调用 /data-sources/:id/markets?asset_type={code}
  // 2. 获取该产品类型支持的市场
  // 3. 设置 filteredMarkets
}
```

#### 选择框事件处理

**数据源选择框**:
```typescript
<Select
  onChange={(value) => {
    form.setFieldValue('asset_type_id', undefined);  // 清空资产类型
    form.setFieldValue('market_id', undefined);       // 清空市场
    loadDataSourceCoverage(value);                     // 加载资产类型
  }}
>
```

**资产类型选择框**:
```typescript
<Select
  onChange={(value) => {
    form.setFieldValue('market_id', undefined);  // 清空市场
    if (value && form.getFieldValue('data_source_id')) {
      loadMarketsByAssetType(form.getFieldValue('data_source_id'), value);  // 加载市场
    }
  }}
>
```

---

## 📊 数据库配置

### 基础配置（现有）

```json
{
  "supports_products": ["STOCK", "ETF", "BOND"],
  "supports_markets": ["NYSE", "NASDAQ", "SSE"],
  ...
}
```

### 高级配置（可选）

如果需要更细粒度的控制（如特定产品只支持特定市场），可添加：

```json
{
  "supports_products": ["STOCK", "ETF", "BOND"],
  "supports_markets": ["NYSE", "NASDAQ", "SSE"],
  "product_market_mapping": {
    "STOCK": ["NYSE", "NASDAQ", "SSE"],
    "BOND": ["NYSE", "NASDAQ"],
    "ETF": ["NYSE", "NASDAQ"]
  }
}
```

### 示例数据源配置

**Alpha Vantage** (仅支持美国市场):
```json
{
  "supports_products": ["STOCK", "ETF"],
  "supports_markets": ["NYSE", "NASDAQ"],
  "product_market_mapping": {
    "STOCK": ["NYSE", "NASDAQ"],
    "ETF": ["NYSE", "NASDAQ"]
  }
}
```

**新浪财经** (多个市场):
```json
{
  "supports_products": ["STOCK", "BOND", "FUND"],
  "supports_markets": ["SSE", "SZSE", "HKEX", "NYSE", "NASDAQ"],
  "product_market_mapping": {
    "STOCK": ["SSE", "SZSE", "HKEX", "NYSE", "NASDAQ"],
    "BOND": ["SSE", "SZSE"],
    "FUND": ["SSE", "SZSE"]
  }
}
```

---

## 🎯 用户交互流程

### 创建新任务

1. **打开「新建任务」对话框**
   - 所有输入框为空
   - 资产类型和市场下拉框禁用

2. **选择「数据源」** (如 Alpha Vantage)
   - 资产类型下拉框激活，显示：STOCK, ETF
   - 市场下拉框仍禁用，提示"请先选择资产类型"

3. **选择「资产类型」** (如 STOCK)
   - 市场下拉框激活，显示：NYSE, NASDAQ
   - 其他资产类型和市场的选择被清空

4. **选择「市场」** (如 NYSE)
   - 完成三级选择
   - 用户可提交表单

### 编辑现有任务

1. **打开编辑表单**
   - 加载该任务的数据源
   - 自动加载该数据源的资产类型
   - 如果任务有资产类型，自动加载对应的市场

2. **修改数据源**
   - 下拉框重置
   - 级联加载新的资产类型

3. **修改资产类型**
   - 市场下拉框重置
   - 级联加载新的市场

---

## 🧪 测试场景

### 场景 1: 完整的级联选择

```
1. 选择数据源: Alpha Vantage
   ✓ 资产类型显示: STOCK, ETF
   ✓ 市场仍禁用

2. 选择资产类型: STOCK
   ✓ 市场显示: NYSE, NASDAQ
   ✓ 其他选择被清空

3. 选择市场: NYSE
   ✓ 表单完整，可提交
```

### 场景 2: 改变数据源

```
1. 初始状态: 数据源=Alpha Vantage, 资产类型=STOCK, 市场=NYSE

2. 改变数据源为: 新浪财经
   ✓ 资产类型更新为: STOCK, BOND, FUND
   ✓ 之前选择的 STOCK 被清空
   ✓ 市场被清空

3. 重新选择资产类型: BOND
   ✓ 市场显示: SSE, SZSE (新浪财经的 BOND 只支持这两个市场)
```

### 场景 3: 边界情况

#### 产品类型无法获取
```
数据源 A 支持的产品类型: STOCK, ETF, BOND
但网络异常，无法加载产品类型

✓ 前端显示所有产品类型（降级处理）
✓ 用户仍可继续操作
```

#### 市场列表为空
```
数据源 B 的产品 CRYPTO 不支持任何市场

✓ 选择 CRYPTO 后，市场下拉框禁用
✓ 显示提示: "该组合不支持市场选择"
```

#### 编辑任务时选择无效
```
任务中保存: 数据源=A, 资产类型=STOCK, 市场=NYSE
但数据源 A 的配置已改为不支持 STOCK 在 NYSE

✓ 编辑表单打开时，市场下拉框可能为空
✓ 用户需要重新选择有效的市场
```

---

## 💾 数据库表结构

### price_data_sources 表
```sql
CREATE TABLE finapp.price_data_sources (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  provider VARCHAR(100),
  config JSONB,  -- 包含 supports_products, supports_markets, product_market_mapping
  ...
);
```

### asset_types 表
```sql
CREATE TABLE finapp.asset_types (
  id UUID PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,  -- STOCK, BOND, FUND, ETF, etc.
  name VARCHAR(255),
  ...
);
```

### markets 表
```sql
CREATE TABLE finapp.markets (
  id UUID PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,  -- NYSE, NASDAQ, SSE, etc.
  name VARCHAR(255),
  country VARCHAR(100),
  currency VARCHAR(10),
  ...
);
```

---

## 🔍 故障排查

### 问题 1: 资产类型下拉框为空

**症状**: 选择数据源后，资产类型下拉框仍然显示所有选项或为空

**可能原因**:
1. API 请求失败
2. 数据源配置中缺少 `supports_products`
3. 网络超时

**解决方案**:
```bash
# 1. 检查 API 响应
curl -X GET \
  'http://localhost:5000/api/price-sync/data-sources/{id}/coverage' \
  -H 'Authorization: Bearer {token}'

# 2. 验证数据库配置
SELECT name, config->'supports_products' 
FROM finapp.price_data_sources 
WHERE id = '{source-id}';

# 3. 检查浏览器控制台错误日志
```

### 问题 2: 市场下拉框不更新

**症状**: 选择资产类型后，市场下拉框没有更新

**可能原因**:
1. `loadMarketsByAssetType` 函数没有被触发
2. API 返回了空列表
3. 资产类型的代码不匹配

**解决方案**:
```bash
# 1. 检查 API 请求（浏览器 Network 标签）
# 应该看到请求: /data-sources/{id}/markets?asset_type={code}

# 2. 验证资产类型代码
SELECT code, name FROM finapp.asset_types 
WHERE code = 'STOCK';  -- 确保代码存在

# 3. 检查产品-市场映射
SELECT config->'product_market_mapping'
FROM finapp.price_data_sources
WHERE id = '{source-id}';
```

### 问题 3: 编辑任务时市场不显示

**症状**: 打开编辑任务表单，之前保存的市场选择没有出现在下拉框中

**可能原因**:
1. 数据源配置被修改（删除了某个市场）
2. 资产类型被修改
3. 级联加载逻辑没有正确执行

**解决方案**:
```bash
# 1. 查看任务中保存的原始选择
SELECT asset_type_id, market_id 
FROM finapp.price_sync_tasks 
WHERE id = '{task-id}';

# 2. 检查当前数据源的支持配置
SELECT name, config 
FROM finapp.price_data_sources 
WHERE id = '{source-id}';

# 3. 如有需要，更新数据源配置或任务选择
```

---

## 📈 性能优化

### 缓存策略

前端可以实现缓存，避免重复加载：

```typescript
// 示例：缓存覆盖范围数据
const coverageCache = useRef<Map<string, any>>(new Map());

const loadDataSourceCoverage = async (dataSourceId: string) => {
  // 检查缓存
  if (coverageCache.current.has(dataSourceId)) {
    const cached = coverageCache.current.get(dataSourceId);
    setFilteredAssetTypes(cached.assetTypes);
    return;
  }

  // 加载并缓存
  const data = await fetchCoverage(dataSourceId);
  coverageCache.current.set(dataSourceId, data);
  setFilteredAssetTypes(data.assetTypes);
};
```

### 预加载

页面初始化时预加载常用数据源：

```typescript
useEffect(() => {
  // 预加载前 3 个活跃的数据源
  dataSources.slice(0, 3).forEach(ds => {
    loadDataSourceCoverage(ds.id);  // 会被缓存
  });
}, []);
```

---

## 🚀 部署说明

### 后端部署

修改的文件:
- `services/PriceSyncService.ts` - 新增 `getMarketsByDataSourceAndAssetType` 方法
- `controllers/PriceSyncController.ts` - 新增端点处理
- `routes/priceSync.ts` - 新增路由

```bash
cd backend
npm run build
npm restart
```

### 前端部署

修改的文件:
- `frontend/src/pages/admin/DataSync/index.tsx` - 级联过滤逻辑

```bash
cd frontend
npm run build
npm restart
```

### 数据库迁移

**无需数据库迁移**！现有的 `price_data_sources` 表已支持新功能。

如果需要使用高级的产品-市场映射，只需更新现有数据：

```sql
UPDATE finapp.price_data_sources 
SET config = jsonb_set(
  config, 
  '{product_market_mapping}',
  '{"STOCK": ["NYSE", "NASDAQ"], "BOND": ["NYSE"]}'::jsonb
)
WHERE id = '{source-id}';
```

---

## 🎓 概念速查

| 术语 | 说明 |
|-----|------|
| 级联过滤 | 多级选择框，每一级的选项受上一级选择的影响 |
| 产品类型 | STOCK(股票), BOND(债券), FUND(基金), ETF, CRYPTO(加密) 等 |
| 市场 | NYSE, NASDAQ, SSE, SZSE, HKEX, CRYPTO 等交易所或市场 |
| 覆盖范围 | 数据源支持的产品类型和市场组合 |
| 映射 | 产品类型与市场的对应关系 |

---

## 📚 相关文件

- **后端服务**: `/backend/src/services/PriceSyncService.ts`
- **后端控制器**: `/backend/src/controllers/PriceSyncController.ts`
- **后端路由**: `/backend/src/routes/priceSync.ts`
- **前端页面**: `/frontend/src/pages/admin/DataSync/index.tsx`
- **API 文档**: 本文档

---

## ✅ 验证清单

部署前检查：

- [ ] 后端编译无误
- [ ] 前端编译无误
- [ ] API `/data-sources/:id/coverage` 可正常响应
- [ ] API `/data-sources/:id/markets?asset_type=` 可正常响应
- [ ] 前端级联过滤功能正常工作
- [ ] 浏览器控制台无错误
- [ ] 数据库中的数据源配置正确

---

**版本**: v2.0 (级联过滤)  
**创建日期**: 2025-11-07  
**状态**: ✅ 已实现
