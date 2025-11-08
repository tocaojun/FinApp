# 数据源动态过滤功能指南

## 功能概述

在创建或编辑同步任务时，当用户选择一个数据源后，系统会自动过滤显示该数据源支持的：
- **资产类型**（STOCK, BOND, FUND, ETF 等）
- **市场**（NYSE, NASDAQ, SSE, SZSE 等）

只有该数据源实际支持的选项才会在下拉框中显示，提高用户体验。

## 工作流程

### 后端实现

#### 1. **新增 API 端点**
- **路由**: `GET /api/price-sync/data-sources/:id/coverage`
- **功能**: 根据数据源 ID 返回该源支持的产品类型和市场列表
- **响应格式**:
```json
{
  "success": true,
  "data": {
    "id": "source-id",
    "name": "数据源名称",
    "provider": "provider_name",
    "productTypes": ["STOCK", "BOND", "ETF"],
    "markets": [
      { "code": "NYSE", "name": "纽约证券交易所" },
      { "code": "NASDAQ", "name": "纳斯达克" }
    ]
  }
}
```

#### 2. **新增服务方法**
- **方法**: `PriceSyncService.getDataSourceCoverage(dataSourceId)`
- **功能**:
  - 读取数据源的 `config` 字段中的 `supports_products` 和 `supports_markets` 配置
  - 查询 `finapp.markets` 表获取市场的详细信息（名称等）
  - 返回结构化的覆盖范围数据

#### 3. **新增控制器方法**
- **方法**: `PriceSyncController.getDataSourceCoverage`
- **功能**: HTTP 请求处理，调用服务层获取覆盖范围

### 前端实现

#### 1. **状态管理**
新增两个状态变量：
```typescript
const [filteredAssetTypes, setFilteredAssetTypes] = useState<AssetType[]>([]);
const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
```

#### 2. **动态加载函数**
```typescript
const loadDataSourceCoverage = async (dataSourceId: string) => {
  // 1. 调用新增的 API 端点
  // 2. 获取该数据源支持的产品类型和市场
  // 3. 过滤全局的 assetTypes 和 markets 数组
  // 4. 更新到 filteredAssetTypes 和 filteredMarkets
}
```

#### 3. **数据源选择变化监听**
```typescript
<Select
  onChange={(value) => {
    // 清空之前选择的资产类型和市场
    form.setFieldValue('asset_type_id', undefined);
    form.setFieldValue('market_id', undefined);
    // 加载新选择的数据源的覆盖范围
    loadDataSourceCoverage(value);
  }}
>
```

#### 4. **下拉框使用过滤数据**
- 资产类型下拉框使用 `filteredAssetTypes` 而不是 `assetTypes`
- 市场下拉框使用 `filteredMarkets` 而不是 `markets`
- 当无可选项时显示禁用状态和提示信息

## 数据库配置要求

数据源的 `config` 字段必须包含正确的覆盖范围配置：

```json
{
  "supports_products": ["STOCK", "ETF", "BOND"],
  "supports_markets": ["NYSE", "NASDAQ", "SSE"],
  ...其他配置字段
}
```

### 示例数据源配置

**Polygon.io**:
```sql
UPDATE finapp.price_data_sources 
SET config = jsonb_set(config, '{supports_products,0}', '"STOCK"'::jsonb)
WHERE name = 'Polygon.io';
```

**新浪财经**:
```sql
UPDATE finapp.price_data_sources 
SET config = jsonb_build_object(
  'supports_products', '["STOCK", "BOND", "FUND"]'::jsonb,
  'supports_markets', '["SSE", "SZSE", "HKEX", "NYSE", "NASDAQ"]'::jsonb,
  ...其他字段
)
WHERE name = '新浪财经';
```

## 测试步骤

### 1. **API 端点测试**

```bash
# 获取数据源覆盖范围
curl -X GET \
  'http://localhost:5000/api/price-sync/data-sources/{data-source-id}/coverage' \
  -H 'Authorization: Bearer {token}'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Alpha Vantage",
    "provider": "alpha_vantage",
    "productTypes": ["STOCK", "ETF"],
    "markets": [
      { "code": "NYSE", "name": "纽约证券交易所" },
      { "code": "NASDAQ", "name": "纳斯达克" }
    ]
  }
}
```

### 2. **前端功能测试**

1. **打开数据同步 → 新建任务**
2. **第一步**: 数据源下拉框中选择 "Alpha Vantage"
   - 预期: 资产类型下拉框中只显示 STOCK 和 ETF
   - 预期: 市场下拉框中只显示 NYSE 和 NASDAQ
3. **第二步**: 改选数据源为 "新浪财经"
   - 预期: 资产类型和市场选项动态更新为新浪财经支持的选项
   - 预期: 之前选择的资产类型和市场被清空
4. **第三步**: 不选择数据源
   - 预期: 资产类型和市场下拉框显示所有选项（不过滤）

### 3. **编辑任务测试**

1. **打开数据同步 → 编辑现有任务**
2. **预期**: 打开编辑表单时，自动加载该任务的数据源覆盖范围
3. **预期**: 已选择的资产类型和市场在表单中显示

### 4. **边界情况测试**

- **数据源不支持任何产品类型**: 资产类型下拉框应禁用并显示提示
- **API 超时或失败**: 应显示所有可选项（降级处理）
- **空的覆盖范围**: 应正确处理不返回任何值的情况

## 故障排查

### 问题 1: 下拉框显示所有选项（未过滤）

**可能原因**:
1. API 端点返回失败或超时
2. 数据源的 `config` 中没有配置 `supports_products` 或 `supports_markets`
3. 前端没有正确调用 `loadDataSourceCoverage`

**解决方案**:
1. 检查浏览器控制台的网络请求和错误日志
2. 验证数据库中的数据源配置：
   ```sql
   SELECT id, name, config 
   FROM finapp.price_data_sources 
   WHERE name = '你的数据源名称';
   ```
3. 确保 `config` 包含 `supports_products` 和 `supports_markets` 字段

### 问题 2: 所有下拉框都被禁用

**可能原因**:
1. 过滤后的数组为空（该数据源不支持任何产品/市场）
2. 数据库中的市场代码与 `markets` 表不匹配

**解决方案**:
1. 检查数据源配置中的产品类型和市场代码是否正确
2. 验证市场代码是否存在于 `finapp.markets` 表：
   ```sql
   SELECT code, name FROM finapp.markets 
   WHERE code = ANY(ARRAY['NYSE', 'NASDAQ']);
   ```

### 问题 3: 编辑任务时提示不可用

**可能原因**:
1. 编辑表单打开时没有调用 `loadDataSourceCoverage`
2. 存储在数据库中的 `asset_type_id` 或 `market_id` 不在过滤列表中

**解决方案**:
1. 确保 `handleEditTask` 函数中调用了 `loadDataSourceCoverage`
2. 验证历史任务的选择是否与当前数据源配置匹配

## 相关文件

- **后端**: 
  - `/backend/src/services/PriceSyncService.ts` - `getDataSourceCoverage` 方法
  - `/backend/src/controllers/PriceSyncController.ts` - `getDataSourceCoverage` 端点
  - `/backend/src/routes/priceSync.ts` - 路由配置

- **前端**:
  - `/frontend/src/pages/admin/DataSync/index.tsx` - 整个数据同步界面

- **数据库**:
  - 表: `finapp.price_data_sources` - 数据源配置
  - 表: `finapp.markets` - 市场信息
  - 表: `finapp.asset_types` - 资产类型

## 性能考虑

1. **缓存**: 前端在切换数据源时加载一次覆盖范围，避免重复请求
2. **超时**: API 超时设置为 8 秒，失败时自动显示所有选项（降级）
3. **查询效率**: 后端通过 `price_data_sources` 的 `config` 字段直接读取，无需 JOIN 查询

## 增强建议

1. **缓存优化**: 可将覆盖范围数据缓存在前端，避免每次切换都请求
2. **搜索优化**: 在下拉框中添加搜索功能，支持按代码或名称搜索
3. **预加载**: 页面加载时预加载所有数据源的覆盖范围，提高响应速度
4. **实时更新**: 当管理员更新数据源配置时，自动刷新覆盖范围数据

---

**功能创建日期**: 2025-11-07  
**上次更新**: 2025-11-07  
**版本**: v1.0
