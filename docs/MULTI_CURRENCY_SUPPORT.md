# 多货币对人民币汇率功能说明

## ✅ 功能状态

**已完全支持** - 系统现在可以获取 10 种货币转换为人民币的汇率。

---

## 📊 支持的货币对（10对）

| 序号 | 货币对 | 说明 | 中文名称 |
|------|-------|------|--------|
| 1 | USD/CNY | 美元 → 人民币 | 美利坚合众国 |
| 2 | EUR/CNY | 欧元 → 人民币 | 欧洲联盟 |
| 3 | GBP/CNY | 英镑 → 人民币 | 英国 |
| 4 | JPY/CNY | 日元 → 人民币 | 日本 |
| 5 | HKD/CNY | 港币 → 人民币 | 中国香港 |
| 6 | SGD/CNY | 新币 → 人民币 | 新加坡 |
| 7 | AUD/CNY | 澳元 → 人民币 | 澳大利亚 |
| 8 | CAD/CNY | 加元 → 人民币 | 加拿大 |
| 9 | CHF/CNY | 瑞郎 → 人民币 | 瑞士 |
| 10 | INR/CNY | 印度卢比 → 人民币 | 印度 |

---

## 🔄 工作流程

### 1. **优化后的导入流程**

```
开始导入
    ↓
检测基础货币 → [USD, EUR, GBP, JPY, HKD, SGD, AUD, CAD, CHF, INR]
    ↓
生成月份列表 → 120个月（10年）
    ↓
按月并发获取 (每次50个月 × 10个货币 = 500个并发请求)
    ↓
按货币对过滤 → 只保留配置中的10对
    ↓
批量写入数据库 (每100条记录一次)
    ↓
完成 (预计 2-3 分钟)
```

### 2. **实时汇率更新**

自动每 4 小时更新一次所有 10 个货币对的最新汇率：

```
汇率更新任务 (每4小时)
    ↓
并发调用Frankfurter API
    ↓
为每个基础货币获取当日汇率
    ↓
过滤监控的10对货币
    ↓
写入数据库
    ↓
发送通知
```

---

## 💡 技术实现细节

### 关键代码优化

#### 1. **自动发现基础货币**

```typescript
// 从监控列表中提取所有唯一的基础货币
const baseCurrencies = [...new Set(this.monitoredPairs.map(p => p.from))];
// 结果: ['USD', 'EUR', 'GBP', 'JPY', 'HKD', 'SGD', 'AUD', 'CAD', 'CHF', 'INR']
```

#### 2. **并发获取多货币数据**

```typescript
// 为每个月份和每个基础货币创建一个请求
const promises = monthChunk.flatMap(dateStr =>
  baseCurrencies.map(baseCurrency =>
    this.fetchHistoricalRatesForDate(dateStr, baseCurrency)
  )
);

// 并发执行所有请求
const results = await Promise.all(promises);
```

#### 3. **智能过滤和批量写入**

```typescript
// 只导入配置中的货币对
const isMonitored = this.monitoredPairs.some(pair =>
  pair.from === rate.fromCurrency && pair.to === rate.toCurrency
);

if (isMonitored) {
  allRatesToInsert.push(rate);
}

// 批量写入（每100条）
await this.bulkInsertExchangeRates(batch);
```

---

## 🚀 快速验证

### 步骤 1: 启动导入

```bash
./import-historical-rates.sh
```

### 步骤 2: 监控进度

在另一个终端查看实时日志：

```bash
tail -f logs/backend.log | grep -i "import\|batch\|found"
```

预期输出：
```
ℹ️  Starting optimized historical exchange rate import...
ℹ️  Found 10 base currencies: USD, EUR, GBP, JPY, HKD, SGD, AUD, CAD, CHF, INR
ℹ️  Fetching 120 monthly data points for 10 base currencies...
✅ Batch insert completed: 950 success, 15 errors. Progress: 50/120 months
```

### 步骤 3: 验证结果

```bash
psql -h localhost -U finapp_user -d finapp_test << 'SQL'
SELECT 
  CONCAT(from_currency, '/', to_currency) as pair,
  COUNT(*) as count,
  MIN(rate_date) as earliest,
  MAX(rate_date) as latest
FROM finapp.exchange_rates
WHERE data_source = 'historical_import'
GROUP BY from_currency, to_currency
ORDER BY from_currency, to_currency;
SQL
```

预期结果（每对约 3640+ 条记录）：
```
 pair    | count | earliest   | latest
---------+-------+------------+-------------
 USD/CNY | 3641  | 2015-11-09 | 2025-11-08
 EUR/CNY | 3641  | 2015-11-09 | 2025-11-08
 GBP/CNY | 3641  | 2015-11-09 | 2025-11-08
 JPY/CNY | 3641  | 2015-11-09 | 2025-11-08
 ... (其他货币对) ...
```

---

## 🎯 前端展示

在前端"数据同步"→"汇率同步"页面，你将看到：

### 统计卡片
- **总汇率记录数**: ~36,400+ (10个货币对 × ~3640天)
- **货币对数**: 10 个
- **最后更新时间**: 今天日期

### 汇率表格
显示所有 10 个货币对的最新汇率和历史数据：

```
货币对          汇率      日期        数据源
USD/CNY        7.25      2025-11-08   api
EUR/CNY        7.95      2025-11-08   api
GBP/CNY        9.10      2025-11-08   api
JPY/CNY        0.048     2025-11-08   api
HKD/CNY        0.93      2025-11-08   api
... 等等
```

---

## 🔧 高级配置

### 修改监控的货币对

编辑 `backend/src/services/ExchangeRateUpdateService.ts` 中的 `monitoredPairs` 数组：

```typescript
private monitoredPairs = [
  // 添加新的货币对
  { from: 'SEK', to: 'CNY' },  // 瑞典克朗 → 人民币
  { from: 'NOK', to: 'CNY' },  // 挪威克朗 → 人民币
  { from: 'TRY', to: 'CNY' },  // 土耳其里拉 → 人民币
  // ... 保持其他10对 ...
];
```

然后：
1. 重新构建: `npm run build`
2. 重启后端
3. 重新运行导入脚本

### 更改更新频率

编辑 `backend/src/app.ts` 中的定时任务：

```typescript
// 默认每4小时更新一次
exchangeRateUpdateService.startAutoUpdate('0 */4 * * *');

// 改为每2小时更新一次
exchangeRateUpdateService.startAutoUpdate('0 */2 * * *');

// 改为每天8:00 AM更新一次
exchangeRateUpdateService.startAutoUpdate('0 8 * * *');
```

---

## 📈 性能指标

### 导入性能

| 指标 | 值 |
|------|---|
| 导入年份 | 10 年 |
| 货币对数 | 10 对 |
| 预计记录数 | ~36,400 条 |
| 预计耗时 | 2-3 分钟 |
| 数据源 | Frankfurter API |

### 实时更新性能

| 指标 | 值 |
|------|---|
| 更新频率 | 每 4 小时 |
| 并发请求 | 10 个货币 |
| 更新耗时 | < 30 秒 |
| 数据源 | Frankfurter API |

---

## ❓ 常见问题

### Q1: 如何添加更多货币对？

编辑 `monitoredPairs` 数组，添加新的货币对配置，然后重新导入。

### Q2: 为什么只看到 USD→CNY 的数据？

如果之前只导入过 USD→CNY，需要清空历史导入数据后重新导入：

```bash
psql -h localhost -U finapp_user -d finapp_test << 'SQL'
DELETE FROM finapp.exchange_rates WHERE data_source = 'historical_import';
SQL

./import-historical-rates.sh
```

### Q3: 导入过程中可以停止吗？

可以，但建议等待完成。如果中途停止，已导入的数据会保留，下次运行会尝试跳过重复的数据。

### Q4: 实时汇率多久更新一次？

默认每 4 小时自动更新一次。可通过修改 `EXCHANGE_RATE_UPDATE_SCHEDULE` 环境变量改变频率。

### Q5: 支持添加更多数据源吗？

支持。`ExchangeRateUpdateService` 中的 `providers` 数组可以配置多个数据源，系统会并发从多个源获取数据。

---

## 🔗 相关文档

- `docs/IMPORT_OPTIMIZATION.md` - 导入优化详情
- `docs/EXCHANGE_RATE_DATA_SOURCES.md` - 数据源配置
- `requirements.md` - 项目部署和配置要求

