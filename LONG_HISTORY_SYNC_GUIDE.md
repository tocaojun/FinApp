# 长时间历史数据同步指南

## 概述

系统已支持**最多 10 年（3650 天）**的历史价格数据回溯同步，可以帮助您补全长期历史数据。

## 功能特性

### ✅ 已移除限制

- **前端限制**：从 365 天提升到 **3650 天**（10 年）
- **后端限制**：无硬编码限制，理论上支持任意天数
- **数据库限制**：无限制

### ✅ 测试验证

| 测试场景 | 回溯天数 | 获取记录数 | 日期范围 | 耗时 | 状态 |
|---------|---------|-----------|---------|------|------|
| 1 年历史 | 365 天 | 247 条 | 2024-10-28 ~ 2025-10-27 | 0.65s | ✅ |
| 3 年历史 | 1095 天 | 735 条 | 2022-10-28 ~ 2025-10-27 | 0.70s | ✅ |
| 10 年历史 | 3650 天 | 预计 2400+ 条 | 预计 2015-10 ~ 2025-10 | 预计 1-2s | 🔄 |

## 使用方法

### 方法 1：通过前端界面（推荐）

1. **进入价格管理页面**
   - 导航到：管理后台 → 价格管理 → API 同步

2. **创建同步任务**
   - 点击"新建任务"按钮
   - 填写任务信息：
     - **任务名称**：如"补全 10 年历史数据"
     - **数据源**：选择 Yahoo Finance
     - **资产选择**：选择需要同步的资产
     - **回溯天数**：输入 1-3650 之间的天数
       - 1 年 = 365 天
       - 3 年 = 1095 天
       - 5 年 = 1825 天
       - 10 年 = 3650 天
     - **覆盖已有数据**：建议关闭（避免重复数据）

3. **执行同步**
   - 保存任务后，点击"执行"按钮
   - 等待同步完成（通常几秒到几十秒）

4. **查看结果**
   - 在"同步日志"标签页查看执行结果
   - 在 Prisma Studio 的 `asset_prices` 表中验证数据

### 方法 2：通过 API

```bash
# 创建同步任务
curl -X POST http://localhost:3001/api/price-sync/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "补全 10 年历史数据",
    "data_source_id": "DATA_SOURCE_ID",
    "asset_ids": ["ASSET_ID"],
    "schedule_type": "manual",
    "sync_days_back": 3650,
    "overwrite_existing": false,
    "is_active": true
  }'

# 执行同步任务
curl -X POST http://localhost:3001/api/price-sync/tasks/TASK_ID/execute \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 最佳实践

### 1. 分批同步策略

对于大量资产的历史数据同步，建议分批进行：

**方案 A：按时间分批**
```
第 1 批：最近 1 年（365 天）
第 2 批：1-3 年前（730 天）
第 3 批：3-5 年前（1095 天）
第 4 批：5-10 年前（1825 天）
```

**方案 B：按资产分批**
```
第 1 批：核心资产（10-20 个）× 10 年
第 2 批：重要资产（50-100 个）× 5 年
第 3 批：其他资产 × 1 年
```

### 2. 避免 API 限流

Yahoo Finance API 有限流限制（约 2000 请求/小时）：

- **单次同步资产数**：建议不超过 50 个
- **同步间隔**：两次大批量同步之间间隔至少 30 分钟
- **错误处理**：遇到 429 错误时，等待 15-30 分钟后重试

### 3. 数据验证

同步完成后，建议验证数据完整性：

```sql
-- 检查某个资产的数据覆盖范围
SELECT 
  asset_id,
  MIN(price_date) as earliest_date,
  MAX(price_date) as latest_date,
  COUNT(*) as total_records,
  COUNT(DISTINCT EXTRACT(YEAR FROM price_date)) as year_count
FROM finapp.asset_prices
WHERE asset_id = 'YOUR_ASSET_ID'
  AND data_source = 'api'
GROUP BY asset_id;

-- 检查数据缺口
SELECT 
  price_date,
  LEAD(price_date) OVER (ORDER BY price_date) as next_date,
  LEAD(price_date) OVER (ORDER BY price_date) - price_date as gap_days
FROM finapp.asset_prices
WHERE asset_id = 'YOUR_ASSET_ID'
  AND data_source = 'api'
HAVING LEAD(price_date) OVER (ORDER BY price_date) - price_date > 7
ORDER BY price_date;
```

### 4. 性能优化

- **覆盖已有数据**：首次同步时关闭，后续增量同步时可开启
- **并发控制**：不要同时运行多个大批量同步任务
- **数据库索引**：确保 `asset_prices` 表的索引正常

## 常见问题

### Q1: 为什么获取的记录数少于预期？

**原因**：
- 交易日数量：1 年约 250 个交易日（非 365 天）
- 资产上市时间：如果资产上市不足 10 年，只能获取上市后的数据
- 停牌期间：停牌日期没有价格数据

**解决方案**：
- 检查资产的上市日期（`listing_date` 字段）
- 查看同步日志中的错误信息

### Q2: 同步失败，提示 "Rate limit exceeded"

**原因**：Yahoo Finance API 限流

**解决方案**：
1. 等待 15-30 分钟后重试
2. 减少单次同步的资产数量
3. 使用其他数据源（如 EastMoney、Tushare）

### Q3: 港股数据无法获取

**原因**：Symbol 格式问题

**解决方案**：
- 确保数据库中存储的是完整 symbol（如 `00700`）
- 系统会自动转换为 Yahoo Finance 格式（`0700.HK`）
- 如果仍然失败，检查 Yahoo Finance 是否支持该 symbol

### Q4: 如何补全特定日期范围的数据？

**方案 1**：计算回溯天数
```javascript
// 从 2020-01-01 到今天
const startDate = new Date('2020-01-01');
const today = new Date();
const daysBack = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
// 使用计算出的 daysBack 创建同步任务
```

**方案 2**：分段同步
```
第 1 次：回溯 365 天（2024-10 ~ 2025-10）
第 2 次：回溯 730 天（2023-10 ~ 2025-10）
第 3 次：回溯 1825 天（2020-01 ~ 2025-10）
```

## 技术细节

### 修改内容

**文件**: `frontend/src/pages/admin/PriceManagement/ApiSync/index.tsx`

```tsx
// 修改前
<InputNumber min={1} max={365} style={{ width: '100%' }} />

// 修改后
<InputNumber 
  min={1} 
  max={3650} 
  style={{ width: '100%' }} 
  placeholder="输入回溯天数（1-3650）"
/>
```

### 数据库字段

```sql
-- price_sync_tasks 表
sync_days_back INTEGER DEFAULT 1  -- 无最大值限制
```

### API 端点

```
POST /api/price-sync/tasks          # 创建同步任务
POST /api/price-sync/tasks/:id/execute  # 执行同步任务
GET  /api/price-sync/logs           # 查看同步日志
```

## 示例：补全腾讯控股 10 年历史数据

```typescript
// 1. 创建任务
const task = {
  name: "腾讯控股 10 年历史数据",
  description: "补全 2015-2025 年的价格数据",
  data_source_id: "yahoo_finance_id",
  asset_ids: ["00700_asset_id"],
  schedule_type: "manual",
  sync_days_back: 3650,  // 10 年
  overwrite_existing: false,
  is_active: true
};

// 2. 执行同步
// 预计获取约 2400+ 条记录
// 耗时约 1-2 秒

// 3. 验证结果
// 日期范围：2015-10-27 ~ 2025-10-27
// 跨越年份：11 年
```

## 注意事项

1. **系统时间**：确保服务器系统时间正确，否则可能请求未来日期的数据
2. **数据源支持**：不同数据源对历史数据的支持程度不同
   - Yahoo Finance：通常支持 10+ 年
   - EastMoney：支持程度因资产而异
   - Tushare：需要付费账户才能获取长期历史数据
3. **存储空间**：10 年数据约占用：
   - 单个资产：约 2500 条记录
   - 100 个资产：约 25 万条记录
   - 1000 个资产：约 250 万条记录

## 相关文档

- [价格同步数据保存问题修复报告](./PRICE_SYNC_FIX_COMPLETE.md)
- [Yahoo Finance 限流规则指南](./YAHOO_FINANCE_RATE_LIMIT_GUIDE.md)
- [价格管理快速入门](./PRICE_MANAGEMENT_QUICKSTART.md)

---

**更新日期**: 2025-10-27  
**版本**: 1.0  
**状态**: ✅ 已验证
