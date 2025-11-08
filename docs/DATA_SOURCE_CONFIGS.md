# 数据源 JSON 配置指南

本文档整理了主要数据源的 JSON 配置格式。

---

## 1. Yahoo Finance（美股、港股、A股）

**提供商**: `yahoo_finance`  
**API 端点**: `https://query1.finance.yahoo.com/v8/finance/chart/`  
**支持市场**: 美国(US)、香港(HK)、中国(CN)

### JSON 配置

```json
{
  "name": "Yahoo Finance",
  "provider": "yahoo_finance",
  "api_endpoint": "https://query1.finance.yahoo.com/v8/finance/chart/",
  "is_active": true,
  "config": {
    "supports_batch": false,
    "max_concurrent_requests": 5,
    "max_symbols_per_request": 1,
    "supports_products": ["STOCK", "ETF", "FUND"],
    "supports_countries": ["US", "HK", "CN"],
    "rate_limit_per_minute": 60,
    "timeout_seconds": 30,
    "data_intervals": ["1m", "5m", "15m", "30m", "60m", "1d", "1wk", "1mo"],
    "default_interval": "1d",
    "requires_api_key": false,
    "notes": "提供美股、港股、A股基本K线数据"
  }
}
```

### 使用说明
- 无需 API Key
- 支持日线、周线、月线数据
- 数据延迟：美股实时，国际股票延迟15-20分钟
- 单次请求返回最多100天数据

---

## 2. 东方财富（A股、基金）

**提供商**: `eastmoney`  
**API 端点**: `http://push2.eastmoney.com/api/qt/stock/kline/get`  
**支持市场**: 中国(CN)

### JSON 配置

```json
{
  "name": "东方财富",
  "provider": "eastmoney",
  "api_endpoint": "http://push2.eastmoney.com/api/qt/stock/kline/get",
  "is_active": true,
  "config": {
    "supports_batch": false,
    "max_concurrent_requests": 10,
    "max_symbols_per_request": 1,
    "supports_products": ["STOCK", "FUND"],
    "supports_countries": ["CN"],
    "rate_limit_per_minute": 100,
    "timeout_seconds": 15,
    "data_intervals": ["1m", "5m", "15m", "30m", "60m", "1d", "1wk", "1mo"],
    "default_interval": "1d",
    "requires_api_key": false,
    "symbol_prefix": {
      "stock_sh": "sh",
      "stock_sz": "sz",
      "fund": ""
    },
    "notes": "提供A股、基金实时数据，数据最为及时"
  }
}
```

### 使用说明
- 无需 API Key
- 股票代码需要前缀：上证(sh)、深证(sz)
- 基金代码无前缀
- 提供实时数据和历史K线
- 请求限制：单个请求建议100个点以内

---

## 3. 新浪财经（A股、期货、外汇）

**提供商**: `sina`  
**API 端点**: `http://hq.sinajs.cn/`  
**支持市场**: 中国(CN)

### JSON 配置

```json
{
  "name": "新浪财经",
  "provider": "sina",
  "api_endpoint": "http://hq.sinajs.cn/",
  "is_active": true,
  "config": {
    "supports_batch": true,
    "max_concurrent_requests": 5,
    "max_symbols_per_request": 10,
    "supports_products": ["STOCK", "FUND", "FUTURES", "FOREX"],
    "supports_countries": ["CN"],
    "rate_limit_per_minute": 150,
    "timeout_seconds": 10,
    "data_types": ["realtime", "historical"],
    "realtime_fields": ["price", "bid", "ask", "volume", "turnover"],
    "requires_api_key": false,
    "symbol_mapping": {
      "stock_sh": "sh",
      "stock_sz": "sz",
      "fund": "xf",
      "futures_cfe": "CF",
      "forex": "USDCNY"
    },
    "notes": "提供实时行情数据，支持批量查询"
  }
}
```

### 使用说明
- 无需 API Key，数据免费
- 支持批量查询（单次最多10个символ）
- 数据包括实时价格、成交量、换手率等
- 不提供历史K线，仅提供当天数据

---

## 4. FRED（Federal Reserve Economic Data）（美国经济数据）

**提供商**: `fred`  
**API 端点**: `https://api.stlouisfed.org/fred/`  
**支持市场**: 美国(US)

### JSON 配置

```json
{
  "name": "FRED",
  "provider": "fred",
  "api_endpoint": "https://api.stlouisfed.org/fred/",
  "is_active": true,
  "config": {
    "supports_batch": true,
    "max_concurrent_requests": 3,
    "max_symbols_per_request": 10,
    "supports_products": ["ECONOMIC_INDICATOR"],
    "supports_countries": ["US"],
    "rate_limit_per_minute": 120,
    "timeout_seconds": 20,
    "requires_api_key": true,
    "api_key_env_var": "FRED_API_KEY",
    "data_intervals": ["daily", "weekly", "monthly", "quarterly", "annual"],
    "default_interval": "monthly",
    "common_series": {
      "GDP": "A191RL1Q225SBEA",
      "UNEMPLOYMENT": "UNRATE",
      "CPI": "CPIAUCSL",
      "T10Y2Y": "T10Y2Y",
      "TREASURY_YIELD_3M": "DGS3MO",
      "TREASURY_YIELD_1Y": "DGS1",
      "TREASURY_YIELD_2Y": "DGS2",
      "TREASURY_YIELD_5Y": "DGS5",
      "TREASURY_YIELD_10Y": "DGS10",
      "TREASURY_YIELD_30Y": "DGS30"
    },
    "notes": "美国联邦储备经济数据库，提供各类经济指标"
  }
}
```

### 使用说明
- **需要 API Key**：https://fredaccount.stlouisfed.org/login/secure/
- 支持批量查询最多10个 series
- 数据更新频率：每日更新
- 覆盖经济指标：GDP、失业率、CPI、国债收益率等
- 提供历史数据（从1900年代起）

---

## 配置字段说明

### 通用字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 数据源名称 |
| `provider` | string | 是 | 提供商标识符 |
| `api_endpoint` | string | 是 | API 基础 URL |
| `is_active` | boolean | 是 | 是否启用 |
| `config` | object | 是 | 具体配置对象 |

### config 对象通用字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `supports_batch` | boolean | 是否支持批量请求 |
| `max_concurrent_requests` | number | 最大并发请求数 |
| `max_symbols_per_request` | number | 单次请求最多处理符号数 |
| `supports_products` | array | 支持的产品类型：STOCK、FUND、ETF、BOND、FOREX等 |
| `supports_countries` | array | 支持的国家代码：US、CN、HK 等 |
| `rate_limit_per_minute` | number | 每分钟最大请求数 |
| `timeout_seconds` | number | 请求超时秒数 |
| `requires_api_key` | boolean | 是否需要 API Key |
| `notes` | string | 备注说明 |

---

## 在程序中配置数据源

### 在 UI 中手动配置

1. 进入 **数据同步** → **数据源** 页签
2. 点击 **新增数据源** 按钮
3. 填写表单字段：
   - **名称**：如 "Yahoo Finance"
   - **提供商**：从下拉菜单选择
   - **API 端点**：粘贴上面配置中的 `api_endpoint`
   - **配置（JSON 格式）**：直接复制上面的 `config` 对象
4. 点击 **确定** 保存

### 通过数据库直接配置

```sql
INSERT INTO finapp.price_data_sources (name, provider, api_endpoint, config, is_active)
VALUES (
  'Yahoo Finance',
  'yahoo_finance',
  'https://query1.finance.yahoo.com/v8/finance/chart/',
  '{
    "supports_batch": false,
    "max_concurrent_requests": 5,
    "max_symbols_per_request": 1,
    "supports_products": ["STOCK", "ETF", "FUND"],
    "supports_countries": ["US", "HK", "CN"],
    "rate_limit_per_minute": 60,
    "timeout_seconds": 30,
    "data_intervals": ["1m", "5m", "15m", "30m", "60m", "1d", "1wk", "1mo"],
    "default_interval": "1d",
    "requires_api_key": false
  }'::jsonb,
  true
);
```

---

## 常见问题

### Q: 如何选择合适的数据源？

**A:**
- **美股、港股、ETF** → Yahoo Finance
- **A股实时数据** → 东方财富（最实时）或新浪财经
- **A股基金** → 东方财富
- **美国经济数据** → FRED（需 API Key）

### Q: 可以同时使用多个数据源吗？

**A:** 可以。建议根据资产类型选择：
- 美股用 Yahoo Finance
- A股用东方财富
- 经济数据用 FRED

### Q: API Key 如何配置？

**A:** 在创建同步任务时，系统会自动从环境变量读取 API Key。例如 FRED 数据源会读取 `FRED_API_KEY` 环境变量。

### Q: 如何修改已有数据源的配置？

**A:** 在 **数据源** 页签找到对应数据源，点击 **编辑** 按钮，修改 JSON 配置后保存即可。

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2025-11-08 | 初始配置整理 |

