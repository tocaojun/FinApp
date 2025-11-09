# 汇率历史数据导入指南

## 概述

本文档说明如何批量导入过去10年的汇率历史数据，为投资分析提供充足的数据基础。

## 📋 前置条件

- ✅ 后端服务正在运行
- ✅ PostgreSQL 数据库已启动
- ✅ 网络连接正常（需要访问 Frankfurter API）

## 🚀 快速开始

### 方式1：使用导入脚本（推荐）

```bash
# 进入项目根目录
cd /Users/caojun/code/FinApp

# 执行导入脚本
./import-historical-rates.sh
```

**脚本功能：**
- ✅ 自动检查后端服务状态
- ✅ 显示导入配置和统计信息
- ✅ 用户确认后启动异步导入
- ✅ 提供监控和验证步骤

### 方式2：直接调用 API

```bash
# 导入过去10年的汇率数据
curl -X POST http://localhost:8000/api/exchange-rates/import-historical \
  -H "Content-Type: application/json" \
  -d '{"years": 10}'

# 导入过去5年的汇率数据
curl -X POST http://localhost:8000/api/exchange-rates/import-historical \
  -H "Content-Type: application/json" \
  -d '{"years": 5}'
```

### 方式3：前端页面导入

1. 打开应用：http://localhost:3000
2. 进入 **管理后台** → **数据同步** → **汇率同步**
3. 点击 **导入历史汇率** 按钮
4. 选择导入参数
5. 点击 **开始导入**

## ⏱️ 执行时间估计

| 年份 | 预计记录数 | 执行时间 | API 调用次数 |
|-----|----------|--------|-----------|
| 1年 | ~3,650 | 2-5 分钟 | ~365 次 |
| 5年 | ~18,250 | 10-15 分钟 | ~1,825 次 |
| 10年 | ~36,500 | 20-30 分钟 | ~3,650 次 |

## 📊 导入的数据内容

### 货币对（10个）

导入系统将为以下10个货币对导入历史数据：

```
1. USD → CNY  (美元→人民币)
2. EUR → CNY  (欧元→人民币)
3. GBP → CNY  (英镑→人民币)
4. JPY → CNY  (日元→人民币)
5. HKD → CNY  (港币→人民币)
6. SGD → CNY  (新币→人民币)
7. AUD → CNY  (澳元→人民币)
8. CAD → CNY  (加元→人民币)
9. CHF → CNY  (瑞郎→人民币)
10. INR → CNY  (印度卢比→人民币)
```

### 数据范围

- **时间范围**：过去 10 年（2015年11月 ~ 2025年11月）
- **粒度**：日级别（每天一条记录）
- **数据源**：Frankfurter API（历史数据端点）
- **汇率精度**：6 位小数

## 📈 导入进度监控

### 方式1：查看后端日志

```bash
# 实时查看导入进度日志
tail -f backend/logs/app.log | grep -i "historical"
```

**预期日志输出：**
```
[INFO] Starting historical exchange rate import for the past 10 years...
[INFO] Historical import progress: 2025-11-08, Success: 70, Errors: 0
[INFO] Historical import progress: 2025-11-08, Success: 140, Errors: 0
...
[INFO] Historical import completed. Success: 36500, Errors: 0
```

### 方式2：数据库查询

进入数据库查询汇率记录数：

```bash
psql -h localhost -U finapp_user -d finapp_test
```

```sql
-- 查看汇率总数
SELECT COUNT(*) as total_rates FROM finapp.exchange_rates;

-- 查看按数据源分类的统计
SELECT data_source, COUNT(*) as count
FROM finapp.exchange_rates
GROUP BY data_source
ORDER BY count DESC;

-- 查看按货币对分类的统计
SELECT 
  CONCAT(from_currency, '/', to_currency) as pair,
  COUNT(*) as record_count,
  MIN(rate_date) as earliest_date,
  MAX(rate_date) as latest_date
FROM finapp.exchange_rates
WHERE data_source = 'historical_import'
GROUP BY from_currency, to_currency
ORDER BY from_currency, to_currency;

-- 查看特定货币对的日期范围
SELECT 
  MIN(rate_date) as earliest,
  MAX(rate_date) as latest,
  COUNT(*) as total_records
FROM finapp.exchange_rates
WHERE from_currency = 'USD' AND to_currency = 'CNY'
  AND data_source = 'historical_import';
```

### 方式3：前端页面查看

打开应用的"汇率同步"页面查看：
- **总汇率记录数**：所有导入的记录总数
- **货币对数**：应显示 10 个
- **最后更新时间**：应显示最新的导入日期
- **汇率列表**：显示最近导入的历史数据

## ✅ 导入完成验证

### 快速验证

```bash
# 1. 查看总记录数
psql -h localhost -U finapp_user -d finapp_test \
  -c "SELECT COUNT(*) FROM finapp.exchange_rates;"

# 2. 查看货币对数
psql -h localhost -U finapp_user -d finapp_test \
  -c "SELECT COUNT(DISTINCT CONCAT(from_currency, '/', to_currency)) \
      FROM finapp.exchange_rates WHERE data_source = 'historical_import';"

# 3. 查看数据日期范围
psql -h localhost -U finapp_user -d finapp_test \
  -c "SELECT MIN(rate_date) as earliest, MAX(rate_date) as latest \
      FROM finapp.exchange_rates WHERE data_source = 'historical_import';"
```

### 详细验证

```sql
-- 完整验证脚本
SELECT 
  'Total Records' as metric,
  COUNT(*) as value
FROM finapp.exchange_rates
UNION ALL
SELECT 
  'Unique Pairs' as metric,
  COUNT(DISTINCT CONCAT(from_currency, '/', to_currency)) as value
FROM finapp.exchange_rates
WHERE data_source = 'historical_import'
UNION ALL
SELECT 
  'Data Sources' as metric,
  COUNT(DISTINCT data_source) as value
FROM finapp.exchange_rates
UNION ALL
SELECT 
  CONCAT(from_currency, '/', to_currency) as metric,
  COUNT(*) as value
FROM finapp.exchange_rates
WHERE data_source = 'historical_import'
GROUP BY from_currency, to_currency
ORDER BY metric;
```

## ❌ 故障排查

### 问题1：导入失败 - "后端服务未启动"

**症状：**
```
❌ 后端服务未启动或无法访问
```

**解决方案：**
```bash
# 启动后端服务
cd backend
npm run dev

# 或使用启动脚本
./restart-backend.sh
```

---

### 问题2：导入缓慢或卡住

**症状：**
- 导入进度停止不动超过 5 分钟
- 日志中没有新的进度信息

**解决方案：**
1. 检查网络连接：`ping api.frankfurter.app`
2. 检查后端日志查看是否有错误
3. 检查数据库连接：`psql -h localhost -U finapp_user -d finapp_test -c "SELECT 1;"`
4. 如果需要重新导入，先清空旧数据：
   ```bash
   psql -h localhost -U finapp_user -d finapp_test << 'SQL'
   DELETE FROM finapp.exchange_rates WHERE data_source = 'historical_import';
   SQL
   ```

---

### 问题3：导入后没有看到数据

**症状：**
- 脚本显示导入成功，但前端看不到数据

**解决方案：**
1. 刷新浏览器页面
2. 清除浏览器缓存
3. 使用数据库查询验证数据：
   ```bash
   psql -h localhost -U finapp_user -d finapp_test \
     -c "SELECT COUNT(*) FROM finapp.exchange_rates;"
   ```
4. 检查前端日志（浏览器 F12 → Console）

---

### 问题4：API 配额超限

**症状：**
```
Error: API error: Too Many Requests
```

**解决方案：**
- Frankfurter API 是免费的，通常没有严格的速率限制
- 如果遇到限制，可以：
  1. 等待一段时间后重试
  2. 减少导入年份数（例如从 10 年改为 5 年）
  3. 分多次导入

---

### 问题5：数据不完整

**症状：**
- 某些货币对的数据缺失
- 某些日期范围内没有数据

**解决方案：**
1. 检查 Frankfurter API 的支持范围：
   ```bash
   curl https://api.frankfurter.app/2015-01-01?base=USD
   ```
2. 某些历史日期可能没有汇率数据（例如周末或节假日）
3. 如果特定货币对在历史上不存在，则无法导入

## 🔧 高级配置

### 自定义导入范围

修改脚本中的 `YEARS` 变量：

```bash
# 修改 import-historical-rates.sh
YEARS=5  # 改为导入过去 5 年的数据
```

### 自定义导入货币对

编辑 `backend/src/services/ExchangeRateUpdateService.ts`：

```typescript
// 修改 monitoredPairs 数组
private monitoredPairs = [
  { from: 'USD', to: 'CNY' },
  { from: 'EUR', to: 'CNY' },
  // 添加或移除货币对
];
```

然后重启后端服务。

## 📋 最佳实践

### 1. 首次数据库初始化

```bash
# 顺序执行以下步骤：
1. 启动后端服务
2. 执行历史数据导入
3. 等待导入完成（20-30 分钟）
4. 启动前端应用
5. 验证数据已正确加载
```

### 2. 定期数据维护

```bash
# 每周检查一次数据完整性
psql -h localhost -U finapp_user -d finapp_test \
  -c "SELECT COUNT(*) FROM finapp.exchange_rates;"

# 每月导入最新汇率（已通过自动更新处理）
```

### 3. 备份重要数据

```bash
# 导入前备份数据库
pg_dump -h localhost -U finapp_user -d finapp_test > backup_before_import.sql

# 导入后备份
pg_dump -h localhost -U finapp_user -d finapp_test > backup_after_import.sql
```

## 📞 获取帮助

遇到问题？

1. 查看后端日志：`tail -f backend/logs/app.log`
2. 查看前端日志：浏览器 F12 → Console
3. 检查数据库连接：`psql -h localhost -U finapp_user -d finapp_test`
4. 查看项目文档：`docs/EXCHANGE_RATE_DATA_SOURCES.md`

---

**最后更新：2025-11-08**  
**适用版本：FinApp v1.0+**
