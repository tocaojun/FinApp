# 汇率同步功能实现文档

## 功能概述

在数据同步页面中新增**汇率同步**功能模块，支持以下操作：

### 核心功能

1. **汇率数据查询**
   - 按货币对、日期范围查询历史汇率数据
   - 支持按数据源筛选
   - 分页展示，每页20条记录

2. **实时汇率刷新**
   - 一键刷新当前汇率数据
   - 支持指定货币对刷新
   - 异步后台更新，不阻塞 UI

3. **历史汇率导入**
   - 支持导入特定日期范围的历史汇率数据
   - 提供快速选择（最近30天、90天、1年）
   - 可配置回溯天数（默认365天）

4. **手动添加汇率**
   - 支持手动输入单条汇率记录
   - 指定日期、汇率值、源目标货币
   - 数据源标记为"manual"

5. **汇率统计信息**
   - 总汇率记录数
   - 货币对数量
   - 数据源数量
   - 最后更新时间

6. **数据删除**
   - 支持删除单条汇率记录
   - 确认对话框防止误删

---

## 技术实现

### 前端文件结构

```
frontend/
├── src/
│   ├── services/
│   │   └── exchangeRateSyncApi.ts          # 新建 - 汇率API客户端
│   └── pages/admin/DataSync/
│       ├── index.tsx                       # 修改 - 添加汇率页签
│       └── ExchangeRateSync.tsx            # 新建 - 汇率同步组件
```

### 后端支持

后端已有完整的汇率管理功能，包括：

- `ExchangeRateController.ts` - 汇率控制器
- `ExchangeRateService.ts` - 汇率业务逻辑
- `ExchangeRateUpdateService.ts` - 汇率自动更新服务
- `/api/exchange-rates` 路由已完整实现

---

## 前端新建文件详解

### 1. exchangeRateSyncApi.ts

**位置**: `frontend/src/services/exchangeRateSyncApi.ts`

**作用**: 封装所有汇率相关的 API 调用

**主要方法**:
```typescript
// 获取统计信息
getExchangeRateStats()

// 获取支持的货币
getSupportedCurrencies()

// 刷新汇率
refreshExchangeRates(params)

// 导入历史汇率
importHistoricalRates(params)

// 获取自动更新状态
getAutoUpdateStatus()

// 搜索汇率
searchExchangeRates(params)

// 获取最新汇率
getLatestRate(fromCurrency, toCurrency)

// 获取历史汇率
getRateHistory(fromCurrency, toCurrency, params)

// 创建汇率
createExchangeRate(data)

// 批量导入
bulkImportRates(data)

// 更新汇率
updateExchangeRate(id, data)

// 删除汇率
deleteExchangeRate(id)
```

### 2. ExchangeRateSync.tsx

**位置**: `frontend/src/pages/admin/DataSync/ExchangeRateSync.tsx`

**作用**: 汇率同步管理的主界面组件

**组件结构**:
```
ExchangeRateSync
├── 统计卡片区域
│   ├── 总汇率记录
│   ├── 货币对数
│   ├── 数据源数
│   └── 最后更新时间
├── 操作按钮区
│   ├── 刷新当前汇率
│   ├── 导入历史汇率
│   └── 手动添加汇率
├── 汇率数据表格
│   ├── 货币对
│   ├── 汇率值
│   ├── 日期
│   ├── 数据源
│   ├── 创建时间
│   └── 操作列
├── 添加汇率模态框
├── 导入历史汇率模态框
```

**关键状态管理**:
- `exchangeRates` - 汇率列表数据
- `stats` - 统计信息
- `currencies` - 支持的货币列表
- `loading` - 数据加载状态
- `syncing` - 同步操作状态
- `pagination` - 分页信息
- `selectedCurrencyPair` - 选中的货币对
- `dateRange` - 选中的日期范围

### 3. DataSync/index.tsx 修改

**修改内容**:
1. 导入 `ExchangeRateSync` 组件
2. 在 `tabItems` 数组中添加新的汇率页签

```typescript
// 添加到 tabItems
{
  key: 'exchangeRates',
  label: '汇率同步',
  children: <ExchangeRateSync />
}
```

---

## 数据库字段

汇率数据基于 `exchange_rates` 表，结构如下：

```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,      -- 源货币代码
    to_currency VARCHAR(3) NOT NULL,        -- 目标货币代码
    rate_date DATE NOT NULL,                -- 汇率日期
    rate DECIMAL(20, 8) NOT NULL,          -- 汇率值
    data_source VARCHAR(50),                -- 数据源（manual/api/etc）
    created_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(from_currency, to_currency, rate_date)
);
```

---

## 使用流程

### 1. 查看汇率数据

1. 进入"数据同步"页面
2. 点击"汇率同步"页签
3. 查看汇率列表和统计信息

### 2. 刷新汇率

1. 点击"刷新当前汇率"按钮
2. 系统自动从配置的数据源获取最新汇率
3. 成功后显示提示并更新列表

### 3. 导入历史汇率

1. 点击"导入历史汇率"按钮
2. 弹出模态框，选择：
   - 源货币
   - 目标货币
   - 日期范围
   - 回溯天数（若使用 API）
3. 确认后后台异步导入
4. 完成后显示导入数量

### 4. 手动添加汇率

1. 点击"手动添加汇率"按钮
2. 弹出模态框，输入：
   - 源货币
   - 目标货币
   - 日期
   - 汇率值
3. 确认保存

### 5. 删除汇率

1. 在汇率列表中找到要删除的记录
2. 点击"删除"按钮
3. 确认删除

---

## 支持的货币

系统支持的货币包括（通过 API 动态获取）：

常见货币对：
- USD/CNY - 美元/人民币
- EUR/USD - 欧元/美元
- GBP/USD - 英镑/美元
- JPY/USD - 日元/美元
- HKD/CNY - 港币/人民币
- SGD/CNY - 新加坡币/人民币
- AUD/USD - 澳元/美元

---

## 数据精度

- **汇率小数位**: 6 位（DECIMAL(20, 8) 精度，显示时取 6 位）
- **日期精度**: 天级别（DATE 类型，不包含时分秒）
- **唯一性约束**: (from_currency, to_currency, rate_date) 的组合必须唯一

---

## 性能考虑

### 查询优化
```sql
-- 创建了以下索引用于快速查询
CREATE INDEX idx_exchange_rates_currency_pair_date 
  ON finapp.exchange_rates(from_currency, to_currency, rate_date DESC);

CREATE INDEX idx_exchange_rates_rate_date 
  ON finapp.exchange_rates(rate_date DESC);
```

### 分页策略
- 默认每页 20 条记录
- 支持自定义分页大小
- 查询结果按日期降序排列

---

## 错误处理

### 前端错误处理
- API 调用失败时显示错误提示
- 数据加载超时降级处理
- 用户操作验证（如货币对重复）

### 后端错误处理
- 缺少必填字段返回 400 错误
- 源目标货币相同返回 400 错误
- 汇率小于等于 0 返回 400 错误
- 重复记录处理（更新或跳过）

---

## 集成点

### 依赖的后端 API

```
GET  /api/exchange-rates                    # 查询汇率
POST /api/exchange-rates                    # 创建汇率
PUT  /api/exchange-rates/:id               # 更新汇率
DELETE /api/exchange-rates/:id             # 删除汇率
GET  /api/exchange-rates/statistics        # 获取统计
GET  /api/exchange-rates/currencies        # 获取货币列表
POST /api/exchange-rates/refresh           # 刷新汇率
POST /api/exchange-rates/import-historical # 导入历史汇率
GET  /api/exchange-rates/:from/:to/latest  # 获取最新汇率
GET  /api/exchange-rates/:from/:to/history # 获取历史汇率
```

### 依赖的前端服务

- `dayjs` - 日期处理
- `axios` - HTTP 请求
- `antd` - UI 组件库

---

## 后续扩展建议

1. **数据可视化**
   - 添加汇率走势图表
   - 显示汇率变动百分比

2. **批量操作**
   - 批量删除汇率记录
   - 批量更新汇率

3. **汇率告警**
   - 设置汇率变动阈值告警
   - 接收汇率变动通知

4. **定期同步**
   - 配置自动同步频率
   - 显示同步日志

5. **数据分析**
   - 汇率统计分析
   - 历史汇率对比

---

## 测试建议

### 单元测试
- exchangeRateSyncApi 方法测试
- ExchangeRateSync 组件逻辑测试

### 集成测试
- 数据加载流程
- 汇率刷新流程
- 历史数据导入流程
- 手动添加汇率流程

### 端到端测试
- 完整的用户操作流程
- 错误场景处理

---

## 部署清单

- [x] 创建 `exchangeRateSyncApi.ts` 服务文件
- [x] 创建 `ExchangeRateSync.tsx` 组件文件
- [x] 修改 `DataSync/index.tsx` 添加汇率页签
- [x] 后端 API 已就绪（无需修改）
- [ ] 测试各功能正常运行
- [ ] 性能测试（大数据量下）
- [ ] 生产环境部署

---

## 文件清单

### 新增文件
- `frontend/src/services/exchangeRateSyncApi.ts` (119 行)
- `frontend/src/pages/admin/DataSync/ExchangeRateSync.tsx` (391 行)

### 修改文件
- `frontend/src/pages/admin/DataSync/index.tsx` (+2 行)

### 相关文件（无需修改）
- `backend/src/controllers/ExchangeRateController.ts`
- `backend/src/services/ExchangeRateService.ts`
- `backend/src/services/ExchangeRateUpdateService.ts`
- `backend/src/routes/exchangeRates.ts`

---

**创建日期**: 2025-11-08  
**功能版本**: v1.0  
**状态**: 开发完成 ✅
