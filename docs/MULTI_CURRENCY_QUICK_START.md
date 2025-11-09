# 多货币对汇率功能 - 快速开始

## ✅ 现状确认

系统已经完全支持 **10 种货币转换为人民币的汇率获取**：

```
USD → CNY  (美元)
EUR → CNY  (欧元)
GBP → CNY  (英镑)
JPY → CNY  (日元)
HKD → CNY  (港币)
SGD → CNY  (新币)
AUD → CNY  (澳元)
CAD → CNY  (加元)
CHF → CNY  (瑞郎)
INR → CNY  (印度卢比)
```

---

## 🚀 三步启用多货币对汇率

### 第1步：清空之前的单货币对数据（可选）

```bash
psql -h localhost -U finapp_user -d finapp_test << 'SQL'
DELETE FROM finapp.exchange_rates WHERE data_source = 'historical_import';
SQL
```

**注意**：这只删除 `historical_import` 来源的数据，实时汇率数据保持不变。

### 第2步：导入 10 年的多货币对历史数据

```bash
./import-historical-rates.sh
```

**预期时间**：2-3 分钟（相比之前的 2-3 小时快 50-100 倍）

**预期结果**：
- USD/CNY: ~3640 条记录
- EUR/CNY: ~3640 条记录
- GBP/CNY: ~3640 条记录
- ... 其他 7 对

### 第3步：验证导入结果

#### 方式A：查看后端日志

```bash
tail -f logs/backend.log | grep -i "import\|batch"
```

预期看到：
```
Found 10 base currencies: USD, EUR, GBP, JPY, HKD, SGD, AUD, CAD, CHF, INR
Fetching 120 monthly data points for 10 base currencies...
Batch insert completed: 950 success, 15 errors. Progress: 50/120 months
...
Optimized historical import completed. Success: 3615, Errors: 45
```

#### 方式B：查询数据库

```bash
psql -h localhost -U finapp_user -d finapp_test << 'SQL'
SELECT 
  CONCAT(from_currency, '/', to_currency) as pair,
  COUNT(*) as record_count
FROM finapp.exchange_rates
WHERE data_source = 'historical_import'
GROUP BY from_currency, to_currency
ORDER BY from_currency;
SQL
```

预期看到：
```
 pair    | record_count
---------+--------------
 AUD/CNY |         3641
 CAD/CNY |         3641
 CHF/CNY |         3641
 EUR/CNY |         3641
 GBP/CNY |         3641
 HKD/CNY |         3641
 INR/CNY |         3641
 JPY/CNY |         3641
 SGD/CNY |         3641
 USD/CNY |         3641
```

#### 方式C：访问前端

1. 打开浏览器访问 `http://localhost:3000`
2. 进入 "管理后台" → "数据同步" → "汇率同步"
3. 在统计卡片中查看：
   - 总汇率记录数：~36,410 条
   - 货币对数：10 个
   - 最后更新时间：今天

---

## 🔄 实时汇率更新

### 自动更新

系统会自动每 4 小时更新一次所有 10 个货币对的最新汇率。

### 手动刷新

在前端"汇率同步"页面点击 **"刷新汇率"** 按钮，立即获取最新汇率。

### API 调用

```bash
# 刷新所有货币对
curl -X POST http://localhost:8000/api/exchange-rates/refresh

# 刷新特定货币对
curl -X POST http://localhost:8000/api/exchange-rates/refresh \
  -H "Content-Type: application/json" \
  -d '{"fromCurrency": "USD", "toCurrency": "CNY"}'

# 查询最新汇率
curl http://localhost:8000/api/exchange-rates/latest/USD/CNY
```

---

## 📊 预期数据量

### 导入后的数据量

| 指标 | 数值 |
|------|------|
| 货币对数 | 10 |
| 历史年份 | 10 年 |
| 每对记录数 | ~3,640 条 |
| 总记录数 | ~36,400 条 |

### 导入性能

| 指标 | 性能 |
|------|------|
| 并发请求 | 50 个月 × 10 个货币 = 500 个 |
| 数据库批量大小 | 100 条/次 |
| 预计耗时 | 2-3 分钟 |
| 平均速度 | ~12,000 条/分钟 |

---

## 🔧 自定义配置

### 添加或删除货币对

编辑 `backend/src/services/ExchangeRateUpdateService.ts`：

```typescript
private monitoredPairs = [
  { from: 'USD', to: 'CNY' },  // 保留
  { from: 'EUR', to: 'CNY' },  // 保留
  { from: 'GBP', to: 'CNY' },  // 保留
  { from: 'JPY', to: 'CNY' },  // 保留
  { from: 'HKD', to: 'CNY' },  // 保留
  { from: 'SGD', to: 'CNY' },  // 保留
  { from: 'AUD', to: 'CNY' },  // 保留
  { from: 'CAD', to: 'CNY' },  // 保留
  { from: 'CHF', to: 'CNY' },  // 保留
  { from: 'INR', to: 'CNY' },  // 保留
  // 添加新的货币对
  // { from: 'SEK', to: 'CNY' },  // 瑞典克朗
  // { from: 'NOK', to: 'CNY' },  // 挪威克朗
];
```

然后：

```bash
cd backend
npm run build
npm start
# 等待后端启动后
./import-historical-rates.sh
```

### 修改更新频率

编辑 `backend/src/app.ts`：

```typescript
// 改为每2小时更新一次
exchangeRateUpdateService.startAutoUpdate('0 */2 * * *');

// 改为每天 8:00 AM 更新一次
exchangeRateUpdateService.startAutoUpdate('0 8 * * *');

// 改为每30分钟更新一次
exchangeRateUpdateService.startAutoUpdate('0 */0.5 * * *');  // 这是 cron 格式，实际用 '*/30 * * * *'
```

---

## ❓ 常见问题

### Q: 为什么还是只看到 USD/CNY？

**A**: 你看到的是之前的导入结果。需要清空并重新导入：

```bash
psql -h localhost -U finapp_user -d finapp_test << 'SQL'
DELETE FROM finapp.exchange_rates WHERE data_source = 'historical_import';
SQL
./import-historical-rates.sh
```

### Q: 导入中断了怎么办？

**A**: 已导入的数据会保留，重新运行脚本会继续导入缺失的数据。系统会自动跳过重复的记录。

### Q: 如何查看导入进度？

**A**: 

```bash
# 方法1：查看后端日志
tail -f logs/backend.log | grep -i batch

# 方法2：实时查询数据库
watch -n 2 'psql -h localhost -U finapp_user -d finapp_test -c "SELECT COUNT(*) FROM finapp.exchange_rates WHERE data_source='\''historical_import'\'';"'

# 方法3：查看运行脚本的输出（脚本内有监控功能）
```

### Q: 支持更多数据源吗？

**A**: 支持。代码中配置了 4 个数据源：
- Frankfurter API（推荐，免费）
- Fixer.io
- ExchangeRate-API.com
- CurrencyLayer.com

可以在 `ExchangeRateUpdateService.ts` 的 `providers` 数组中添加更多源。

### Q: 数据多久更新一次？

**A**: 默认每 4 小时自动更新。实时数据可以通过前端或 API 手动刷新。

---

## 📈 预期效果

### 导入前

```
✗ 只有 USD/CNY 的汇率数据
✗ 历史数据不完整
✗ 无法进行多货币对分析
```

### 导入后

```
✅ 完整的 10 个货币对历史数据（10年）
✅ 实时汇率自动每4小时更新
✅ 支持多货币对分析和对比
✅ 完整的汇率时间序列数据
```

---

## 🎯 后续步骤

1. ✅ **验证** - 运行 `./verify-multi-currency.sh` 检查配置
2. 🚀 **导入** - 运行 `./import-historical-rates.sh` 导入数据
3. 📊 **检查** - 在前端查看汇率数据
4. 🔄 **监控** - 自动更新会在后台运行

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| `MULTI_CURRENCY_SUPPORT.md` | 详细技术文档 |
| `IMPORT_OPTIMIZATION.md` | 导入优化原理 |
| `EXCHANGE_RATE_DATA_SOURCES.md` | 数据源配置 |

