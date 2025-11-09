# 汇率数据源配置指南

## 概述

FinApp 支持多个外部汇率数据源，提供灵活的汇率更新配置。本文档详细说明各数据源的特性、配置方法和支持的货币对。

## 📊 支持的数据源

### 1. Frankfurter API（推荐 - 免费）✅

**特性：**
- 🔓 **完全免费**，无需 API 密钥
- 🌍 支持全球主要货币，包括 CNY（人民币）
- ⚡ 稳定可靠的免费 API
- 📅 支持实时和历史汇率数据
- 🔄 自动转换多个基础货币

**API 地址：**
```
https://api.frankfurter.app/latest?base=USD
https://api.frankfurter.app/YYYY-MM-DD?base=USD
```

**支持的货币对（以 CNY 为目标）：**
```
USD → CNY  (美元→人民币)
EUR → CNY  (欧元→人民币)
GBP → CNY  (英镑→人民币)
JPY → CNY  (日元→人民币)
HKD → CNY  (港币→人民币)
SGD → CNY  (新币→人民币)
AUD → CNY  (澳元→人民币)
CAD → CNY  (加元→人民币)
CHF → CNY  (瑞郎→人民币)
INR → CNY  (印度卢比→人民币)
```

**配置方式：**
- ✅ **无需配置**（默认启用）
- 自动处理多个基础货币的请求

**示例响应：**
```json
{
  "base": "USD",
  "date": "2025-11-08",
  "rates": {
    "CNY": 7.2501,
    "EUR": 0.9234,
    "GBP": 0.7891
  }
}
```

---

### 2. Fixer.io（付费）💰

**特性：**
- 💵 **付费服务**，需要订阅
- 🎯 高精度汇率数据
- 🌐 支持全球 170+ 种货币
- 📊 包括历史数据和金属价格
- 🔐 需要 API 密钥

**API 地址：**
```
https://api.fixer.io/latest
```

**支持的货币对：**
- 所有国际货币，包括 CNY

**配置方式：**
1. 访问 https://fixer.io，注册并获取 API 密钥
2. 在 `backend/.env` 中配置：
   ```bash
   FIXER_API_KEY=your_api_key_here
   ```

**定价：**
- 免费计划：100 请求/月
- 基础计划：$10/月
- 专业计划：$25/月+

---

### 3. ExchangeRate-API.com（部分免费）✅

**特性：**
- 🔓 **免费版本可用**（限制：1500 请求/月）
- 📊 覆盖主要货币对
- ⚠️ **限制**：免费版本仅支持 USD 作为基础货币
- 💰 付费版本支持所有货币对

**API 地址：**
```
https://api.exchangerate-api.com/v4/latest/USD
```

**免费版本支持的货币对：**
- USD → CNY ✅
- USD → EUR ✅
- USD → GBP ✅
- USD → JPY ✅
- USD → HKD ✅
- USD → SGD ✅
- 其他 USD 开头的货币对

**局限性：**
- ❌ 无法获取 EUR → CNY（无法在 free 版本中获取非 USD 基础）
- ❌ 无法获取 GBP → CNY
- ⚠️ 需要升级到付费版本才能支持任意货币对

**配置方式：**
- 无需配置（默认启用）
- API 无需密钥即可调用

---

### 4. CurrencyLayer（付费）💰

**特性：**
- 💵 **付费服务**
- 🌍 支持全球货币
- ⚡ 高更新频率（实时报价）
- 🔐 需要 API 密钥

**API 地址：**
```
http://api.currencylayer.com/live
```

**配置方式：**
1. 访问 https://currencylayer.com，注册获取 API 密钥
2. 在 `backend/.env` 中配置：
   ```bash
   CURRENCYLAYER_API_KEY=your_api_key_here
   ```

**定价：**
- 免费计划：250 请求/月，仅 USD 基础
- 付费计划：$9.99/月起

---

## ⚙️ 配置方法

### 1. 环境变量配置

编辑 `backend/.env`：

```bash
# 汇率自动更新配置
ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true
EXCHANGE_RATE_UPDATE_SCHEDULE="0 */4 * * *"  # 每4小时更新一次

# 外部汇率API密钥（可选，不配置则使用免费API）
# FIXER_API_KEY=your_fixer_api_key
# CURRENCYLAYER_API_KEY=your_currencylayer_api_key

# 汇率变动通知阈值
EXCHANGE_RATE_ALERT_THRESHOLD=2.0  # 变动超过2%时发送通知
```

### 2. 监控货币对配置

编辑 `backend/src/services/ExchangeRateUpdateService.ts` 中的 `monitoredPairs` 数组：

```typescript
private monitoredPairs = [
  { from: 'USD', to: 'CNY' },  // 美元→人民币
  { from: 'EUR', to: 'CNY' },  // 欧元→人民币
  { from: 'GBP', to: 'CNY' },  // 英镑→人民币
  { from: 'JPY', to: 'CNY' },  // 日元→人民币
  { from: 'HKD', to: 'CNY' },  // 港币→人民币
  { from: 'SGD', to: 'CNY' },  // 新币→人民币
  { from: 'AUD', to: 'CNY' },  // 澳元→人民币
  { from: 'CAD', to: 'CNY' },  // 加元→人民币
  { from: 'CHF', to: 'CNY' },  // 瑞郎→人民币
  { from: 'INR', to: 'CNY' },  // 印度卢比→人民币
];
```

### 3. 调整更新频率

**Cron 表达式格式：**
```
┌───────────── 分 (0 - 59)
│ ┌───────────── 时 (0 - 23)
│ │ ┌───────────── 日 (1 - 31)
│ │ │ ┌───────────── 月 (1 - 12)
│ │ │ │ ┌───────────── 周几 (0 - 7) (0 和 7 都是周日)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**常用配置示例：**
```bash
# 每小时更新一次
0 * * * *

# 每4小时更新一次（推荐）
0 */4 * * *

# 每天早上9点更新
0 9 * * *

# 每个工作日（周一至周五）早上9点更新
0 9 * * 1-5

# 每30分钟更新一次
*/30 * * * *
```

---

## 🔄 数据源优先级和容错

系统按以下优先级调用数据源：

1. **首先**：Frankfurter API（免费，支持 CNY）
2. **其次**：Fixer.io（如果配置了 API 密钥）
3. **第三**：ExchangeRate-API.com（免费版本）
4. **最后**：CurrencyLayer（如果配置了 API 密钥）

**容错机制：**
- ✅ 如果第一个数据源失败，自动尝试下一个
- ✅ 如果所有外部 API 都失败，使用本地缓存的汇率
- ✅ 不会因为外部 API 故障而中断服务

---

## 📈 性能优化

### 1. 更新频率建议

| 使用场景 | 推荐频率 | 原因 |
|---------|--------|------|
| 个人财务跟踪 | 每天1次 | 足够准确，减少 API 调用 |
| 活跃交易 | 每4小时1次 | 平衡准确性和资源使用 |
| 专业投资管理 | 每1小时1次 | 实时性要求高 |
| 研究分析 | 手动按需 | 按需获取历史数据 |

### 2. API 调用优化

```typescript
// 只监控必要的货币对
// 减少不必要的 API 调用
const monitoredPairs = [
  { from: 'USD', to: 'CNY' },
  { from: 'EUR', to: 'CNY' },
  // ... 其他关键货币对
];
```

### 3. 数据库查询优化

已创建的索引：
```sql
CREATE INDEX idx_exchange_rates_currency_pair_date 
  ON finapp.exchange_rates(from_currency, to_currency, rate_date DESC);

CREATE INDEX idx_exchange_rates_rate_date 
  ON finapp.exchange_rates(rate_date DESC);
```

---

## 🚀 使用场景

### 场景 1：仅使用免费数据源

**推荐配置：**
```bash
# backend/.env
ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true
EXCHANGE_RATE_UPDATE_SCHEDULE="0 */4 * * *"

# 不配置任何 API 密钥
# FIXER_API_KEY=
# CURRENCYLAYER_API_KEY=
```

**优点：**
- ✅ 完全免费
- ✅ 无需复杂配置
- ✅ 可获取 CNY 汇率

**缺点：**
- ⚠️ 免费 API 可能有速率限制
- ⚠️ 数据更新延迟可能较大

---

### 场景 2：付费 API + 免费备用

**推荐配置：**
```bash
# backend/.env
ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true
EXCHANGE_RATE_UPDATE_SCHEDULE="0 */4 * * *"

# 配置付费 API
FIXER_API_KEY=your_fixer_api_key
# 无需配置 CurrencyLayer，作为备用

# ExchangeRate-API 作为最后备用（免费）
```

**优点：**
- ✅ 高精度和实时性
- ✅ 多个数据源互为备用
- ✅ 高可用性

---

### 场景 3：离线使用（无网络）

**配置方式：**
```bash
ENABLE_EXCHANGE_RATE_AUTO_UPDATE=false
```

**使用本地数据：**
1. 使用"导入历史汇率"功能手动导入数据
2. 或通过"手动添加汇率"逐条录入

---

## 📋 故障排查

### 问题 1：汇率更新失败

**检查清单：**
- [ ] 检查网络连接
- [ ] 查看日志：`tail -f backend/logs/app.log`
- [ ] 检查 API 密钥是否配置正确
- [ ] 检查 Cron 表达式语法

**解决方案：**
```bash
# 手动触发一次更新
curl -X POST http://localhost:8000/api/exchange-rates/refresh
```

---

### 问题 2：无法获取某个货币对

**检查清单：**
- [ ] 该货币对是否在 `monitoredPairs` 中
- [ ] 数据源是否支持该货币对
- [ ] 检查 API 的实时状态

**解决方案：**
```typescript
// 添加新的货币对到 monitoredPairs
private monitoredPairs = [
  // ... 现有货币对
  { from: 'SEK', to: 'CNY' },  // 添加新货币对
];
```

---

### 问题 3：API 配额超限

**症状：**
- API 返回 429 (Too Many Requests)
- API 返回 403 (Forbidden)

**解决方案：**
- 减少更新频率
- 减少监控的货币对数量
- 升级到更高级别的 API 计划

---

## 🔗 相关资源

- **Frankfurter API**：https://frankfurter.app/
- **Fixer.io**：https://fixer.io/
- **ExchangeRate-API**：https://exchangerate-api.com/
- **CurrencyLayer**：https://currencylayer.com/
- **Cron 表达式生成器**：https://crontab.guru/

---

## 📝 更新日志

| 日期 | 变更 | 说明 |
|-----|------|------|
| 2025-11-08 | 初始化 | 添加对 CNY 的全面支持，默认使用 Frankfurter API |
| 2025-11-08 | 数据源优化 | 支持多个基础货币自动转换 |

---

## 📞 支持

如有问题或建议，请联系开发团队或查看项目 Issue。
