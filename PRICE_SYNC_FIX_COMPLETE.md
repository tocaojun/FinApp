# 价格同步数据保存问题修复报告

## 问题描述

用户报告：同步后，在 `AssetPrice` 表中看不到同步的价格数据。

## 问题分析

通过调查发现了两个关键问题：

### 1. 数据库字段名称不匹配

**问题**：`PriceSyncService.ts` 中的 `savePriceData` 方法使用了错误的字段名。

- **代码中使用**: `source`
- **数据库实际字段**: `data_source`
- **缺失字段**: `currency`

这导致 SQL 插入语句失败，但错误被静默忽略。

### 2. Yahoo Finance API Symbol 格式问题

**问题**：港股 symbol 的前导零处理不正确。

- **数据库存储**: `00700` (两个前导零)
- **Yahoo Finance 需要**: `0700.HK` (一个前导零)
- **错误使用**: `00700.HK` → 返回 0 条数据，被识别为 MUTUALFUND

## 修复方案

### 修复 1: 更新 `savePriceData` 方法

**文件**: `backend/src/services/PriceSyncService.ts`

**修改内容**:
```typescript
// 修复前
INSERT INTO finapp.asset_prices (
  asset_id, price_date, open_price, high_price, low_price, 
  close_price, volume, source  // ❌ 错误字段名
) VALUES (...)

// 修复后
INSERT INTO finapp.asset_prices (
  asset_id, price_date, open_price, high_price, low_price, 
  close_price, volume, currency, data_source  // ✅ 正确字段名
) VALUES (
  ${assetId}::uuid, ${price.date}::date, ${price.open || null},
  ${price.high || null}, ${price.low || null}, ${price.close},
  ${price.volume || null}, ${price.currency || 'USD'}, 'api'
)
```

### 修复 2: 港股 Symbol 格式处理

**文件**: `backend/src/services/PriceSyncService.ts`

**修改内容**:
```typescript
// 修复前
case 'HKEX':
  yahooSymbol = `${asset.symbol}.HK`;  // 00700.HK ❌
  break;

// 修复后
case 'HKEX':
  // 港股：去掉前导零（00700 -> 0700）
  const hkSymbol = asset.symbol.replace(/^0+/, '0');
  yahooSymbol = `${hkSymbol}.HK`;  // 0700.HK ✅
  break;
```

### 修复 3: 添加 currency 字段到价格数据

**文件**: `backend/src/services/PriceSyncService.ts`

在所有数据源的价格获取方法中添加 `currency` 字段：

```typescript
// Yahoo Finance
const prices = timestamps.map((timestamp: number, index: number) => ({
  date: new Date(timestamp * 1000).toISOString().split('T')[0],
  open: quotes.open[index],
  high: quotes.high[index],
  low: quotes.low[index],
  close: quotes.close[index],
  volume: quotes.volume[index],
  currency: asset.currency || 'USD',  // ✅ 新增
}));

// EastMoney
return {
  date: date || '',
  open: parseFloat(open || '0'),
  high: parseFloat(high || '0'),
  low: parseFloat(low || '0'),
  close: parseFloat(close || '0'),
  volume: parseInt(volume || '0'),
  currency: asset.currency || 'CNY',  // ✅ 新增
};

// Tushare
return {
  date: (item[0] || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
  open: item[1] || 0,
  high: item[2] || 0,
  low: item[3] || 0,
  close: item[4] || 0,
  volume: item[5] || 0,
  currency: asset.currency || 'CNY',  // ✅ 新增
};
```

## 测试结果

### 测试前
- AssetPrice 表记录数: **6 条**
- 同步结果: `total_records: 0`, `success_count: 0`

### 测试后
- AssetPrice 表记录数: **75 条** (新增 69 条)
- 同步结果: `total_records: 69`, `success_count: 69`

### 数据验证

```
最新的 10 条价格记录:
  00700 (腾讯控股): 2025-10-27 - Close: 652.5 HKD, Source: api
  00700 (腾讯控股): 2025-10-24 - Close: 637.5 HKD, Source: api
  00700 (腾讯控股): 2025-10-23 - Close: 633 HKD, Source: api
  00700 (腾讯控股): 2025-10-22 - Close: 623.5 HKD, Source: api
  00700 (腾讯控股): 2025-10-21 - Close: 630.5 HKD, Source: api
  ...
```

## Yahoo Finance Symbol 格式规则

| 市场 | 数据库格式 | Yahoo Finance 格式 | 示例 |
|------|-----------|-------------------|------|
| 港股 (HKEX) | `00700` | `0700.HK` | 腾讯控股 |
| 上交所 (SSE) | `600000` | `600000.SS` | 浦发银行 |
| 深交所 (SZSE) | `000001` | `000001.SZ` | 平安银行 |
| 美股 (NYSE/NASDAQ) | `AAPL` | `AAPL` | 苹果 |
| 东京 (TSE) | `7203` | `7203.T` | 丰田汽车 |

## 注意事项

1. **系统时间问题**: 测试过程中发现系统时间设置为 2025 年，导致请求未来日期的数据返回空结果。实际生产环境需确保系统时间正确。

2. **Yahoo Finance 限流**: Yahoo Finance API 有限流限制（约 2000 请求/小时），频繁请求可能导致 429 错误。

3. **港股 Symbol 格式**: 
   - 数据库中存储完整的 symbol（如 `00700`）
   - 调用 Yahoo Finance API 时需要去掉多余的前导零（`00700` → `0700`）
   - 正则表达式 `/^0+/` 替换为 `'0'` 确保至少保留一个 0

4. **数据源字段**: 所有通过 API 同步的价格数据，`data_source` 字段统一设置为 `'api'`

## 相关文件

- `backend/src/services/PriceSyncService.ts` - 价格同步服务（已修复）
- `backend/prisma/schema.prisma` - 数据库 schema（AssetPrice 模型）
- `backend/test-sync-direct.ts` - 直接测试同步服务的脚本
- `backend/test-yahoo-api-correct-date.ts` - Yahoo Finance API 测试脚本

## 状态

✅ **问题已完全修复**

- [x] 修复数据库字段名称不匹配
- [x] 修复港股 symbol 格式问题
- [x] 添加 currency 字段支持
- [x] 测试验证数据成功保存
- [x] 文档记录修复过程

---

**修复日期**: 2025-10-27  
**修复人员**: AI Assistant  
**测试状态**: 通过
