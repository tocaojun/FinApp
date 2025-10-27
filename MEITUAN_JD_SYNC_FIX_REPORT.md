# 美团和京东价格同步修复报告

## 问题描述

美团 (03690) 和京东 (09618) 的 API 同步失败，没有数据插入到 `AssetPrice` 表中。

## 问题根源

### 港股 Symbol 格式转换错误

**原始代码**：
```typescript
case 'HKEX':
  // 港股：去掉前导零（00700 -> 0700）
  const hkSymbol = asset.symbol.replace(/^0+/, '0');
  yahooSymbol = `${hkSymbol}.HK`;
  break;
```

**问题**：
- 正则表达式 `/^0+/` 会匹配**所有前导零**并替换为单个 `0`
- 导致错误的转换：
  - `03690` → `0.HK` ❌ (应该是 `3690.HK`)
  - `09618` → `0.HK` ❌ (应该是 `9618.HK`)
  - `00700` → `0700.HK` ✅ (正确)

**Yahoo Finance API 测试结果**：
```
0.HK: 0 records (错误的格式)
3690.HK: 19 records ✅
9618.HK: 19 records ✅
0700.HK: 19 records ✅
```

## 修复方案

### 正确的 Symbol 转换规则

港股 symbol 在 Yahoo Finance 中的格式规则：
- 如果是 **5 位数字且以 0 开头**，去掉**第一个 0**
- 其他情况保持不变

**修复后的代码**：
```typescript
case 'HKEX':
  // 港股：处理前导零
  // 规则：如果是5位数字且以0开头，去掉第一个0
  // 00700 -> 0700, 03690 -> 3690, 09618 -> 9618
  let hkSymbol = asset.symbol;
  if (hkSymbol.length === 5 && hkSymbol.startsWith('0')) {
    hkSymbol = hkSymbol.substring(1);
  }
  yahooSymbol = `${hkSymbol}.HK`;
  break;
```

### 转换示例

| 数据库 Symbol | 转换后 | Yahoo Symbol | 结果 |
|--------------|--------|--------------|------|
| `00700` | `0700` | `0700.HK` | ✅ 19 条记录 |
| `03690` | `3690` | `3690.HK` | ✅ 19 条记录 |
| `09618` | `9618` | `9618.HK` | ✅ 19 条记录 |
| `00001` | `0001` | `0001.HK` | ✅ 正确 |
| `12345` | `12345` | `12345.HK` | ✅ 保持不变 |
| `1234` | `1234` | `1234.HK` | ✅ 保持不变 |

## 测试结果

### 修复前
```
03690 (美团-W): 0 条价格记录 ❌
09618 (京东集团): 0 条价格记录 ❌
```

### 修复后
```
03690 (美团-W): 19 条价格记录 ✅
  日期范围: 2025-09-29 到 2025-10-27
  最新收盘价: 102.40 HKD

09618 (京东集团): 19 条价格记录 ✅
  日期范围: 2025-09-29 到 2025-10-27
  最新收盘价: 132.00 HKD
```

### 同步日志
```
状态: success
总资产: 2
总记录: 38
成功数: 38
失败数: 0
耗时: 1.11 秒
```

## 修改的文件

### backend/src/services/PriceSyncService.ts

**位置**: 第 569-575 行

**修改内容**:
- 修复港股 symbol 格式转换逻辑
- 从正则表达式替换改为条件判断
- 确保正确处理所有港股 symbol 格式

## 影响范围

### 受益的港股资产

所有 5 位数字且以 0 开头的港股 symbol 现在都能正确同步：
- ✅ `03690` (美团-W)
- ✅ `09618` (京东集团)
- ✅ `00700` (腾讯控股) - 之前已正确
- ✅ 其他类似格式的港股

### 不受影响的资产

- 美股、A股、其他市场的资产不受影响
- 4 位数字的港股 symbol 不受影响
- 不以 0 开头的 symbol 不受影响

## 验证步骤

1. **查看数据库中的价格数据**：
   ```sql
   SELECT a.symbol, a.name, COUNT(*) as price_count
   FROM finapp.assets a
   LEFT JOIN finapp.asset_prices ap ON a.id = ap.asset_id
   WHERE a.symbol IN ('03690', '09618')
   GROUP BY a.id, a.symbol, a.name;
   ```

2. **查看最新价格**：
   ```sql
   SELECT a.symbol, a.name, ap.price_date, ap.close_price, ap.currency
   FROM finapp.assets a
   JOIN finapp.asset_prices ap ON a.id = ap.asset_id
   WHERE a.symbol IN ('03690', '09618')
   ORDER BY ap.price_date DESC
   LIMIT 10;
   ```

3. **在前端查看**：
   - 进入"价格管理" → "API 同步"
   - 创建包含美团和京东的同步任务
   - 执行同步并查看结果

## 总结

### 问题
- 美团和京东的价格同步失败，0 条记录

### 根本原因
- 港股 symbol 格式转换逻辑错误
- 正则表达式 `/^0+/` 替换逻辑不正确

### 解决方案
- 使用条件判断代替正则表达式
- 规则：5 位数字且以 0 开头，去掉第一个 0

### 结果
- ✅ 美团：19 条记录成功同步
- ✅ 京东：19 条记录成功同步
- ✅ 所有港股 symbol 现在都能正确转换

---

**修复时间**: 2025-10-27  
**修复版本**: v1.0.1  
**状态**: ✅ 已完成并验证
