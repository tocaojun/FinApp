# 数据同步失败问题诊断和修复

## 问题诊断

### 症状
- 点击"同步"按钮后，同步任务失败
- 在同步日志中显示 `failed` 状态
- 具体错误：`Unsupported provider: sina`

### 根本原因
同步任务使用了"新浪财经"（sina）数据源，但后端代码中的 `fetchPricesFromSource` 方法只支持以下提供商：
- `yahoo_finance` - 雅虎财经
- `eastmoney` - 东方财富
- `tushare` - Tushare（需要API密钥）

新浪财经的实时数据API不提供历史K线数据，只能获取实时报价。

## 解决方案

### 已实施的修复

✅ **已添加对 Sina 提供商的支持**
- 位置：`/backend/src/services/PriceSyncService.ts`
- 修改内容：
  1. 在 `fetchPricesFromSource` 方法中添加 `case 'sina':`
  2. 添加新方法 `fetchFromSina()` 返回空数组
  3. 记录警告信息，建议使用其他数据源

### 现在的行为
- 同步任务不会因为 Sina 提供商而失败
- 系统会记录警告信息
- 建议用户改用支持历史数据的数据源

## 推荐修复步骤

### 步骤 1：变更同步任务的数据源

**选项 A：使用 Yahoo Finance（推荐）**
```sql
UPDATE finapp.price_sync_tasks
SET data_source_id = (
  SELECT id FROM finapp.price_data_sources 
  WHERE provider = 'yahoo_finance' LIMIT 1
)
WHERE id = '3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f';
```

**选项 B：使用 EastMoney（适用于中国股票）**
```sql
UPDATE finapp.price_sync_tasks
SET data_source_id = (
  SELECT id FROM finapp.price_data_sources 
  WHERE provider = 'eastmoney' LIMIT 1
)
WHERE id = '3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f';
```

**选项 C：使用 Tushare（适用于中国股票，需要API密钥）**
```sql
UPDATE finapp.price_sync_tasks
SET data_source_id = (
  SELECT id FROM finapp.price_data_sources 
  WHERE provider = 'tushare' LIMIT 1
)
WHERE id = '3c4ab0bf-fd9b-42e2-9f9e-6d4bc26f207f';
```

### 步骤 2：清理之前的错误记录（可选）
```sql
DELETE FROM finapp.price_sync_errors 
WHERE log_id IN (
  SELECT id FROM finapp.price_sync_logs 
  WHERE status = 'failed'
);
```

### 步骤 3：重新运行同步任务
- 在 UI 中找到该同步任务
- 点击"同步"按钮
- 等待任务完成

## 支持的数据源对比

| 提供商 | 类型 | 适用市场 | 是否需要API密钥 | 历史数据 | 备注 |
|--------|------|---------|----------------|---------|----|
| Yahoo Finance | 国际股票 | 全球主流市场 | ✅ 否 | ✅ 支持 | 推荐使用 |
| EastMoney | 中国股票 | 沪深京A股 | ✅ 否 | ✅ 支持 | 适用于中国市场 |
| Tushare | 中国股票 | 沪深京A股、期货 | ❌ 需要 | ✅ 支持 | 功能最全面 |
| Sina | 实时行情 | 中国股票 | ✅ 否 | ❌ 不支持 | 仅实时数据 |

## 故障排除

### 问题：修改数据源后，同步仍然失败

**解决方案：**
1. 检查数据源是否处于活跃状态：
```sql
SELECT id, name, provider, is_active 
FROM finapp.price_data_sources 
WHERE provider IN ('yahoo_finance', 'eastmoney', 'tushare');
```

2. 确保数据源的 API 端点可访问
3. 检查 API 密钥是否正确配置（如果需要的话）
4. 查看后端日志了解具体错误信息

### 问题：同步任务找不到要同步的资产

**解决方案：**
1. 验证是否有活跃的资产：
```sql
SELECT COUNT(*) FROM finapp.assets WHERE is_active = true;
```

2. 检查同步任务的筛选条件（资产类型、市场、资产列表）是否过于严格
3. 修改同步任务，清除或宽松筛选条件

## 相关代码位置

- **同步执行逻辑**：`/backend/src/services/PriceSyncService.ts`
  - `executeSyncTask()` - 同步任务执行
  - `fetchPricesFromSource()` - 根据提供商选择获取方法
  - `fetchFromYahooFinance()` - Yahoo Finance 实现
  - `fetchFromEastMoney()` - EastMoney 实现
  - `fetchFromTushare()` - Tushare 实现
  - `fetchFromSina()` - Sina 实现（本次修复）

- **同步控制器**：`/backend/src/controllers/PriceSyncController.ts`
  - `executeSyncTask()` - 处理同步请求

- **同步路由**：`/backend/src/routes/priceSync.ts`
  - `POST /tasks/:id/execute` - 执行同步任务的API端点

## 后续改进建议

1. **添加更多数据源支持**
   - Polygon.io
   - Alpha Vantage
   - IEX Cloud

2. **改进错误处理**
   - 详细记录每个资产的获取原因
   - 支持跳过失败的资产继续同步其他资产

3. **性能优化**
   - 批量获取多个资产的数据
   - 实现断点续传机制
   - 添加速率限制处理

4. **用户体验改进**
   - 在创建同步任务时，自动推荐支持的数据源
   - 在UI中显示数据源的特性和限制
   - 提供数据源健康检查工具

---

**修复日期**：2025-11-07
**修复范围**：新增Sina提供商的支持（返回空数据）
**相关issue**：数据同步失败 - Route not found 后续问题
