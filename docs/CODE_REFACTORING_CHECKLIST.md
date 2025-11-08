# 代码重构清单：去掉市场维度

## 需要更新的文件

### 1. 类型定义
- [ ] `backend/src/types/asset.ts` - 移除 marketId 字段
- [ ] `backend/src/types/sync.ts` - 如果存在，移除 market_id 相关类型

### 2. Services
- [ ] `backend/src/services/AssetService.ts` 
  - 移除市场相关的查询和过滤
  - 更新 CREATE/UPDATE 逻辑
  
- [ ] `backend/src/services/PriceSyncService.ts`
  - 删除 `getMarketsByDataSourceAndAssetType()` 方法
  - 简化 `getCountriesByDataSourceAndAssetType()` 方法
  - 更新 sync task 处理逻辑

### 3. Controllers
- [ ] `backend/src/controllers/PriceSyncController.ts`
  - 删除 `/data-sources/:id/markets` 端点
  - 更新相关的响应处理
  
- [ ] `backend/src/controllers/AssetController.ts`
  - 更新资产查询端点，移除 marketId 参数
  - 更新 CSV 导出逻辑

### 4. Routes
- [ ] `backend/src/routes/priceSync.ts`
  - 删除市场相关的路由
  
- [ ] `backend/src/routes/assets.ts` (如果存在)
  - 更新资产相关的路由

### 5. 迁移相关
- [ ] `backend/src/services/DataSyncService.ts` (如果存在)
  - 检查是否有市场相关的同步逻辑

## 优先级顺序

### Phase 1：类型和接口（最先改）
1. `backend/src/types/asset.ts`
2. `backend/src/types/sync.ts`

### Phase 2：Service 层（中间改）
3. `backend/src/services/AssetService.ts`
4. `backend/src/services/PriceSyncService.ts`

### Phase 3：API 层（最后改）
5. `backend/src/controllers/AssetController.ts`
6. `backend/src/controllers/PriceSyncController.ts`
7. `backend/src/routes/priceSync.ts`
8. `backend/src/routes/assets.ts`

## 文件修改统计

| 文件 | 改动类型 | 难度 |
|------|---------|------|
| types/asset.ts | 删除字段 | ⭐ |
| services/AssetService.ts | 删除市场查询 | ⭐⭐⭐ |
| services/PriceSyncService.ts | 删除方法、简化逻辑 | ⭐⭐ |
| controllers/AssetController.ts | 更新 API | ⭐⭐ |
| controllers/PriceSyncController.ts | 删除端点 | ⭐ |
| routes/*.ts | 删除路由 | ⭐ |

## 预计工作量

- 类型更新：15 分钟
- Service 更新：45 分钟
- Controller/Routes 更新：30 分钟
- 测试和验证：30 分钟

**总计**：约 2 小时

## 验证步骤

- [ ] TypeScript 编译无错误
- [ ] 所有引用 marketId 的地方都已更新
- [ ] 资产创建/查询测试通过
- [ ] 全球资产（countryId = NULL）支持正确
- [ ] 国家维度资产过滤正确
