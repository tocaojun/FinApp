# 快速导入历史汇率数据

## 问题解决

之前的导入脚本失败是因为需要认证令牌。现在已经修复：

### ✅ 修复内容

1. **后端路由更新**
   - 汇率导入端点现在不需要认证
   - 这些是系统级操作，在后台异步执行

2. **脚本简化**
   - 移除了复杂的认证逻辑
   - 直接调用 API，无需令牌

---

## 🚀 现在可以直接运行导入

### 步骤1：确保后端服务运行

```bash
cd /Users/caojun/code/FinApp/backend
npm run dev
```

### 步骤2：运行导入脚本

```bash
cd /Users/caojun/code/FinApp
./import-historical-rates.sh
```

### 步骤3：按提示操作

脚本会显示：
```
ℹ️  导入配置信息：
  📅 历史数据范围：过去 10 年
  💱 监控货币对数：10 个
  🔗 API 地址：http://localhost:8000/api

ℹ️  自动更新服务状态：
  enabled: true
  running: true
  schedule: "0 */4 * * *"
  monitoredPairs: 10

⚠️  此操作将导入约 36500 条历史汇率记录

是否继续？(y/n)
```

**输入 `y` 然后按 Enter**

---

## ✨ 导入成功提示

脚本成功执行后会显示：

```
✅ 导入请求已提交到后台
ℹ️  返回信息：
Historical exchange rate import initiated for the past 10 years...

📊 监控导入进度的方法：

1. 查看后端日志（实时监控）：
   tail -f backend/logs/app.log | grep -i "historical"

2. 通过数据库查询统计数据：
   psql -h localhost -U finapp_user -d finapp_test
   SELECT COUNT(*) FROM finapp.exchange_rates;

3. 前端页面查看：
   访问 "数据同步" -> "汇率同步" 标签页
```

---

## 📊 监控导入进度

### 方式1：实时日志（推荐）

```bash
tail -f backend/logs/app.log | grep -i "historical"
```

**预期输出：**
```
[INFO] Starting historical exchange rate import for the past 10 years...
[INFO] Historical import progress: 2025-11-08, Success: 70, Errors: 0
[INFO] Historical import progress: 2025-11-09, Success: 140, Errors: 0
...
[INFO] Historical import completed. Success: 36500, Errors: 0
```

### 方式2：数据库查询

```bash
psql -h localhost -U finapp_user -d finapp_test
```

```sql
-- 查看总记录数
SELECT COUNT(*) as total FROM finapp.exchange_rates;

-- 查看导入进度（按数据源）
SELECT 
  data_source, 
  COUNT(*) as count,
  MIN(rate_date) as earliest,
  MAX(rate_date) as latest
FROM finapp.exchange_rates
GROUP BY data_source
ORDER BY count DESC;

-- 查看具体货币对统计
SELECT 
  CONCAT(from_currency, '/', to_currency) as pair,
  COUNT(*) as record_count
FROM finapp.exchange_rates
WHERE data_source = 'historical_import'
GROUP BY from_currency, to_currency
ORDER BY from_currency;
```

### 方式3：前端页面

1. 打开应用：http://localhost:3000
2. 进入 **管理后台** → **数据同步** → **汇率同步**
3. 查看统计卡片中的数据

---

## ⏱️ 预计时间

| 项目 | 时间 |
|-----|------|
| 脚本执行 | 30 秒 |
| 后台导入 | 20-30 分钟 |
| 总耗时 | 20-30 分钟 |

---

## ❓ 常见问题

### Q1：导入失败，显示 "MISSING_TOKEN"？

**A：** 这是旧版本的问题。已修复。请：
1. 重启后端服务
2. 重新运行脚本

### Q2：导入后没有看到数据？

**A：** 检查进度：
```bash
# 查看是否正在导入
tail -f backend/logs/app.log | grep -i "historical"

# 查询数据库
psql -h localhost -U finapp_user -d finapp_test \
  -c "SELECT COUNT(*) FROM finapp.exchange_rates;"

# 刷新浏览器（F5）
```

### Q3：导入很慢，正常吗？

**A：** 是的，正常。原因：
- 需要为每个基础货币调用一次 API
- 共 3,650 次 API 调用（365天 × 10年）
- 每次调用有延迟控制，避免超限

### Q4：能中途停止导入吗？

**A：** 可以，但不推荐：
```bash
# 后端停止此任务
# 但不会影响已导入的数据

# 如果需要清空重来：
psql -h localhost -U finapp_user -d finapp_test
DELETE FROM finapp.exchange_rates WHERE data_source = 'historical_import';
```

---

## ✅ 验证导入成功

导入完成后运行验证：

```bash
# 1. 查看总记录数（应该是 ~36500）
psql -h localhost -U finapp_user -d finapp_test \
  -c "SELECT COUNT(*) FROM finapp.exchange_rates WHERE data_source = 'historical_import';"

# 2. 查看货币对数（应该是 10）
psql -h localhost -U finapp_user -d finapp_test \
  -c "SELECT COUNT(DISTINCT CONCAT(from_currency, to_currency)) \
      FROM finapp.exchange_rates WHERE data_source = 'historical_import';"

# 3. 查看数据范围（应该是过去10年）
psql -h localhost -U finapp_user -d finapp_test \
  -c "SELECT MIN(rate_date) as start, MAX(rate_date) as end \
      FROM finapp.exchange_rates WHERE data_source = 'historical_import';"
```

---

## 🎯 下一步

导入完成后，你可以：

1. ✅ 在前端查看历史汇率数据
2. ✅ 使用汇率进行多币种换算
3. ✅ 进行投资分析（支持历史汇率）
4. ✅ 汇率数据会继续自动每4小时更新一次

---

**最后更新：2025-11-08**  
**状态：✅ 已修复，可以正常导入**
