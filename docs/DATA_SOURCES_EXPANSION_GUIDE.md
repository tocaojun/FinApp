# 数据源扩展指南

## 当前已支持的数据源

### 1. Yahoo Finance（雅虎财经）
- **提供商代码**: `yahoo_finance`
- **API 端点**: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`
- **支持的资产类型**:
  - ✅ 股票（美股、港股、A股、日股、欧股）
  - ✅ ETF
  - ✅ 指数
- **支持的市场**:
  - 美国（NYSE、NASDAQ）
  - 中国（SSE 上交所、SZSE 深交所）
  - 香港（HKEX 香港交易所）
  - 日本（TSE 东京交易所）
  - 英国（LSE 伦敦交易所）
  - 德国（FWB 法兰克福交易所）
- **数据类型**: 日K线数据（open, high, low, close, volume）
- **特点**:
  - ✅ 免费使用，无需 API Key
  - ✅ 历史数据完整（10+ 年）
  - ⚠️ 有限流限制（~2000 请求/小时）
  - ✅ 最后一个交易日通常延迟 15-20 分钟

### 2. 东方财富（EastMoney）
- **提供商代码**: `eastmoney`
- **API 端点**: `http://push2.eastmoney.com/api/qt/stock/kline/get`
- **支持的资产类型**:
  - ✅ A 股（沪深股票）
  - ✅ ETF
  - ✅ 基金
- **特点**:
  - ✅ 免费使用，无需 API Key
  - ✅ 专门针对中国股市数据优化
  - ✅ 实时性好，延迟少
  - ✅ 支持前复权、后复权数据
- **当前状态**: 代码已实现但未激活

### 3. Tushare（聚宽数据）
- **提供商代码**: `tushare`
- **API 端点**: `http://api.tushare.pro`
- **支持的资产类型**:
  - ✅ A 股
  - ✅ 基金
  - ✅ 债券
  - ✅ 期货
  - ✅ 期权
  - ✅ 数字资产
- **数据类型**: 日K线数据、基本信息、财务数据等
- **特点**:
  - 🔑 需要 API Token（免费账户有限制）
  - 📊 数据最全面
  - 💰 部分数据需要付费
  - ✅ 当前已激活，需配置 API Key
- **当前状态**: 已集成，等待配置 API Key

---

## 推荐添加的新数据源

### 一级推荐（高优先级）

#### 1. **Alpha Vantage**（美股 + 汇率数据）
- **用途**: 美股数据、汇率、技术指标
- **特点**:
  - 免费 API（500 请求/天）
  - 提供美股、ETF、基金、外汇数据
  - 包含技术指标（RSI、MACD 等）
- **配置**:
  ```javascript
  {
    provider: "alpha_vantage",
    api_endpoint: "https://www.alphavantage.co/query",
    config: {
      data_types: ["daily_price", "technical_indicators", "fx_data"],
      functions: ["TIME_SERIES_DAILY", "FX_DAILY", "RSI", "MACD"],
      sync_frequency: "daily"
    },
    rate_limit: 12  // 每分钟
  }
  ```
- **注册**: https://www.alphavantage.co/

#### 2. **IEX Cloud**（美股详细数据）
- **用途**: 美股日K、分钟级数据、公司信息、新闻
- **特点**:
  - 微信 API（100 请求/月免费）
  - 数据最新实时
  - 支持期权、期货数据
- **配置**:
  ```javascript
  {
    provider: "iex_cloud",
    api_endpoint: "https://cloud.iexapis.com/stable",
    config: {
      data_types: ["daily_price", "company_info", "news"],
      sync_frequency: "daily"
    },
    rate_limit: 100
  }
  ```
- **注册**: https://iexcloud.io/

#### 3. **FRED（美国债券数据）**
- **用途**: 美国国债数据、经济指标
- **特点**:
  - ✅ 完全免费
  - 📊 数据权威（美联储数据库）
  - 支持国债收益率、经济指标等
- **配置**:
  ```javascript
  {
    provider: "fred",
    api_endpoint: "https://api.stlouisfed.org/fred",
    config: {
      data_types: ["treasury_yields", "economic_indicators"],
      series_ids: [
        "DFF",      // 联邦基金利率
        "DGS1",     // 1年期国债
        "DGS5",     // 5年期国债
        "DGS10",    // 10年期国债
        "DGS30"     // 30年期国债
      ],
      sync_frequency: "daily"
    },
    rate_limit: 60
  }
  ```
- **注册**: https://fred.stlouisfed.org/

#### 4. **Polygon.io**（股票 + 期权 + 加密）
- **用途**: 美股、期权、加密资产数据
- **特点**:
  - 免费 API
  - 支持美股、期权、加密资产
  - 实时数据和历史数据
- **配置**:
  ```javascript
  {
    provider: "polygon",
    api_endpoint: "https://api.polygon.io",
    config: {
      data_types: ["daily_price", "options_data", "crypto"],
      sync_frequency: "daily"
    },
    rate_limit: 5
  }
  ```
- **注册**: https://polygon.io/

---

### 二级推荐（中优先级）

#### 5. **天天基金 API**（基金数据）
- **用途**: 中国公募基金、基金排名、持仓数据
- **特点**:
  - 中国基金数据最全
  - 包含净值、排名、持仓等
- **注册**: http://api.fund.eastmoney.com/

#### 6. **新浪财经 API**（全球数据）
- **用途**: A股、港股、美股、基金综合数据
- **特点**:
  - 免费使用
  - 数据齐全
  - 有分钟级数据

#### 7. **QUANDL**（替代数据）
- **用途**: 债券、期货、商品数据
- **特点**:
  - 免费账户（100 请求/天）
  - 丰富的替代数据源
  - 专业级数据质量

#### 8. **Tiingo**（全球股票）
- **用途**: 全球股票、外汇、加密
- **特点**:
  - 免费 API
  - 实时数据
  - 支持 100+ 国家股市

---

## 按资产类型推荐的数据源组合

### 📈 股票数据
- **优先**: Yahoo Finance（全球）+ Tushare（A股）+ EastMoney（A股）
- **备选**: IEX Cloud（美股）+ Alpha Vantage（美股）+ Polygon.io（美股）
- **港股特别**: Yahoo Finance（推荐）

### 💰 美国债券数据
- **推荐**: FRED（官方权威）+ IEX Cloud（详细信息）
- **备选**: Alpha Vantage（技术指标）

### 🏦 基金数据
- **A股基金**: EastMoney（推荐）+ 天天基金 API（详细持仓）+ Tushare（需付费）
- **美国基金**: Yahoo Finance（ETF）+ Polygon.io（详细数据）

### 📊 汇率数据
- **推荐**: Alpha Vantage（10+ 种外币）+ Yahoo Finance（主要货币对）

---

## 实现指南

### 添加新数据源的步骤

#### 1. **后端实现** (`backend/src/services/PriceSyncService.ts`)

```typescript
// 1. 在 fetchPricesFromSource 方法中添加 case
case 'alpha_vantage':
  return await this.fetchFromAlphaVantage(dataSource, asset, daysBack);

// 2. 实现对应的 fetch 方法
private async fetchFromAlphaVantage(
  dataSource: DataSource,
  asset: any,
  daysBack: number
): Promise<any[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  try {
    const response = await axios.get(
      `${dataSource.api_endpoint}`,
      {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: asset.symbol,
          apikey: dataSource.api_key_encrypted,
          outputsize: 'full'
        },
        timeout: 30000
      }
    );

    // 数据转换...
    const timeSeries = response.data['Time Series (Daily)'] || {};
    const prices = Object.entries(timeSeries).map(([date, data]: any) => ({
      date,
      open: parseFloat(data['1. open']),
      high: parseFloat(data['2. high']),
      low: parseFloat(data['3. low']),
      close: parseFloat(data['4. close']),
      volume: parseInt(data['5. volume']),
      currency: asset.currency || 'USD'
    }));

    return prices;
  } catch (error) {
    console.error(`Error fetching from Alpha Vantage:`, error);
    throw error;
  }
}
```

#### 2. **前端配置**

在"数据同步"→"数据源"页面添加新数据源：
- 名称：`Alpha Vantage - 美股数据源`
- 提供商：`alpha_vantage`
- API 端点：`https://www.alphavantage.co/query`
- API Key：配置实际的 API Key
- 配置：`{"data_types": ["daily_price", "technical_indicators"]}`
- 速率限制：`12`（每分钟请求数）

#### 3. **数据库初始化** (SQL)

```sql
INSERT INTO finapp.price_data_sources (
    name, provider, api_endpoint, api_key_encrypted, config,
    rate_limit, timeout_seconds, is_active
) VALUES (
    'Alpha Vantage - 美股数据源',
    'alpha_vantage',
    'https://www.alphavantage.co/query',
    NULL,  -- 需要配置实际的 API Key
    '{"data_types": ["daily_price", "technical_indicators"], "sync_frequency": "daily"}'::jsonb,
    12,
    30,
    true
);
```

---

## 成本对比

| 数据源 | 价格 | 覆盖范围 | 适合场景 |
|------|------|---------|--------|
| Yahoo Finance | 免费 | 全球股票/ETF | 入门用户 |
| Alpha Vantage | 免费(500/天) | 美股/汇率 | 美股投资 |
| IEX Cloud | 微信(100/月) | 美股详细 | 专业美股 |
| FRED | 免费 | 美国债券 | 债券投资 |
| Tushare | 免费(基础功能) | A股/基金/期货 | 量化交易 |
| EastMoney | 免费 | A股/基金 | 国内投资 |
| 天天基金 | 免费 | 中国基金 | 基金投资 |
| Polygon.io | 免费(基础) | 美股/期权/加密 | 多资产 |

---

## 快速开始建议

### 第 1 阶段（必须）
- ✅ 激活 Yahoo Finance（已完成）
- ✅ 配置 Tushare API Key（获取）

### 第 2 阶段（推荐）
- ⭐ 集成 Alpha Vantage（美股补充）
- ⭐ 集成 FRED（债券数据）
- ⭐ 激活 EastMoney（A股备选）

### 第 3 阶段（可选）
- IEX Cloud（专业美股）
- 天天基金 API（详细基金）
- Polygon.io（期权/加密）

---

## API Key 获取流程

### Alpha Vantage
1. 访问 https://www.alphavantage.co/
2. 点击 "GET FREE API KEY"
3. 填写邮箱，即时获得 API Key

### FRED
1. 访问 https://fred.stlouisfed.org/docs/api/
2. 点击 "Request an API Key"
3. 注册后获得免费 API Key

### Tushare
1. 访问 https://tushare.pro/
2. 注册账户
3. 在个人中心获得 API Token

---

**更新日期**: 2025-11-07  
**优先级**: 高  
**状态**: 建议清单  
