# 价格同步任务 UUID 转换修复

## 问题描述

创建同步任务时出现错误：
```
Invalid `prisma.$queryRawUnsafe()` invocation: Raw query failed. 
Code: `22P02`. 
Message: `ERROR: invalid input syntax for type uuid: "STOCK"`
```

## 根本原因

前端在创建同步任务时，发送的 `asset_type_id` 和 `market_id` 可能是：
- **资产类型代码**（字符串），如 "STOCK"、"STOCK_OPTION"
- **市场代码**（字符串），如 "SZSE"、"SSE"

但后端期望这些字段是 UUID 格式。直接将代码字符串转换为 UUID 类型时会导致错误。

## 修复方案

在 `PriceSyncService.ts` 中的 `createSyncTask()` 和 `updateSyncTask()` 方法中添加代码转换逻辑：

### 修复步骤

1. **检测输入类型**：判断输入是否是资产类型代码或市场代码
   - 如果是字符串且不包含 "-"（UUID 包含多个 "-"），则当作代码处理

2. **查询获取 UUID**：
   ```typescript
   // 资产类型代码 → UUID
   const typeResult = await this.db.prisma.$queryRaw`
     SELECT id FROM finapp.asset_types WHERE code = ${assetTypeCode}
   `;
   assetTypeId = typeResult[0].id;

   // 市场代码 → UUID
   const marketResult = await this.db.prisma.$queryRaw`
     SELECT id FROM finapp.markets WHERE code = ${marketCode}
   `;
   marketId = marketResult[0].id;
   ```

3. **使用转换后的 UUID**：将转换后的 UUID 用于数据库操作

## 修复的文件

- `/backend/src/services/PriceSyncService.ts`
  - `createSyncTask()` 方法
  - `updateSyncTask()` 方法

## 影响范围

这个修复支持前端以以下两种方式发送资产类型和市场信息：

### 方式 1：发送代码（推荐用于级联筛选）
```javascript
{
  asset_type_id: "STOCK",        // 资产类型代码
  market_id: "SZSE"              // 市场代码
}
```

### 方式 2：发送 UUID（传统方式）
```javascript
{
  asset_type_id: "26baf585-bfba-4af4-bc41-d9efdc05d82a",  // UUID
  market_id: "d1f012ef-ff87-447e-9061-43b77382c43c"       // UUID
}
```

## 测试建议

1. **创建同步任务**：使用资产类型代码和市场代码
   ```bash
   POST /api/price-sync/tasks
   {
     "name": "STOCK_OPTION 同步任务",
     "data_source_id": "uuid",
     "asset_type_id": "STOCK_OPTION",
     "market_id": "SZSE"
   }
   ```

2. **更新同步任务**：测试代码到 UUID 的转换
   ```bash
   PUT /api/price-sync/tasks/:id
   {
     "asset_type_id": "STOCK",
     "market_id": "SSE"
   }
   ```

3. **验证数据库**：确保任务中存储的是正确的 UUID

## 相关文件

- 前端级联筛选相关文档
- 数据源覆盖范围配置（product_market_mapping）

---

**更新时间**: 2025-11-07  
**版本**: v1.0  
**状态**: ✅ 已修复
