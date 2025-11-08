-- 数据源初始化脚本
-- 说明：此脚本插入四个主要数据源的配置
-- 注意：执行前请备份数据库！

BEGIN TRANSACTION;

-- 删除已存在的数据源（仅保留新的）
DELETE FROM finapp.price_data_sources 
WHERE name IN ('Yahoo Finance', '东方财富', '新浪财经', 'FRED');

-- 插入 Yahoo Finance
INSERT INTO finapp.price_data_sources (
  name, provider, api_endpoint, config, rate_limit, timeout_seconds, is_active
)
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
    "requires_api_key": false,
    "features": {
      "realtime": true,
      "historical": true,
      "dividend_splits": true
    },
    "notes": "提供美股、港股、A股基本K线数据。无需API Key，数据实时。"
  }'::jsonb,
  60,
  30,
  true
) ON CONFLICT (name) DO NOTHING;

-- 插入东方财富
INSERT INTO finapp.price_data_sources (
  name, provider, api_endpoint, config, rate_limit, timeout_seconds, is_active
)
VALUES (
  '东方财富',
  'eastmoney',
  'http://push2.eastmoney.com/api/qt/stock/kline/get',
  '{
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
    "features": {
      "realtime": true,
      "historical": true,
      "level2_quote": true,
      "fund_data": true
    },
    "notes": "提供A股、基金实时数据，数据最为及时。股票需要前缀：上证(sh)、深证(sz)。"
  }'::jsonb,
  100,
  15,
  true
) ON CONFLICT (name) DO NOTHING;

-- 插入新浪财经
INSERT INTO finapp.price_data_sources (
  name, provider, api_endpoint, config, rate_limit, timeout_seconds, is_active
)
VALUES (
  '新浪财经',
  'sina',
  'http://hq.sinajs.cn/',
  '{
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
    "features": {
      "realtime": true,
      "batch_query": true,
      "bid_ask": true
    },
    "notes": "提供实时行情数据，支持批量查询。仅提供当天数据，不提供历史K线。"
  }'::jsonb,
  150,
  10,
  true
) ON CONFLICT (name) DO NOTHING;

-- 插入 FRED
INSERT INTO finapp.price_data_sources (
  name, provider, api_endpoint, config, rate_limit, timeout_seconds, is_active
)
VALUES (
  'FRED',
  'fred',
  'https://api.stlouisfed.org/fred/',
  '{
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
      "TREASURY_YIELD_30Y": "DGS30",
      "INFLATION_EXPECTATION": "T5YIFR",
      "MORTGAGE_30Y": "MORTGAGE30US"
    },
    "features": {
      "historical": true,
      "real_time": false,
      "batch_query": true,
      "observations": true
    },
    "notes": "美国联邦储备经济数据库。需要API Key（免费注册）。提供各类经济指标，支持批量查询最多10个series。"
  }'::jsonb,
  120,
  20,
  false
) ON CONFLICT (name) DO NOTHING;

-- 显示插入结果
SELECT 
  id,
  name,
  provider,
  is_active,
  (config::text LIKE '%supports_countries%') as has_country_support,
  created_at
FROM finapp.price_data_sources
WHERE provider IN ('yahoo_finance', 'eastmoney', 'sina', 'fred')
ORDER BY created_at DESC;

COMMIT;

-- 说明
/*
执行步骤：
1. 备份数据库：pg_dump -h localhost -U finapp_user -d finapp_test > backup_$(date +%s).sql
2. 执行脚本：psql -h localhost -U finapp_user -d finapp_test -f init-data-sources.sql
3. 验证结果：检查输出的查询结果

注意事项：
- FRED 数据源默认禁用（is_active = false），需要配置 FRED_API_KEY 后启用
- 其他三个数据源可以直接使用
- 数据源名称是唯一的，重复执行脚本不会重复插入
- 修改 config 字段时，确保 JSON 格式有效

回滚操作（如需要）：
DELETE FROM finapp.price_data_sources 
WHERE name IN ('Yahoo Finance', '东方财富', '新浪财经', 'FRED');
*/
