-- 添加新的数据同步数据源
-- 时间: 2025-11-07
-- 包含以下数据源:
-- 1. Alpha Vantage - 美股 + 技术指标
-- 2. FRED - 美国债券收益率
-- 3. 天天基金 API - 中国基金数据
-- 4. Polygon.io - 美股 + 期权 + 加密
-- 5. IEX Cloud - 美股详细数据
-- 6. 新浪财经 API - 综合数据
-- 7. Tiingo - 全球股票数据
-- 8. 币安 API - 加密数据

BEGIN;

-- 1. Alpha Vantage - 美股 + 技术指标
INSERT INTO finapp.price_data_sources (
  name, 
  provider, 
  api_endpoint, 
  config, 
  rate_limit, 
  timeout_seconds, 
  is_active
) VALUES (
  'Alpha Vantage',
  'alpha_vantage',
  'https://www.alphavantage.co/query',
  '{
    "description": "提供美股、技术指标、外汇数据",
    "supports_products": ["STOCK", "ETF", "INDEX"],
    "supports_markets": ["NYSE", "NASDAQ"],
    "data_types": ["daily", "intraday", "technical_indicators"],
    "features": {
      "real_time_quotes": true,
      "historical_data": true,
      "technical_indicators": true,
      "forex": true
    },
    "rate_limit_per_minute": 5,
    "free_plan": true,
    "requires_api_key": true
  }'::jsonb,
  5,
  30,
  true
) ON CONFLICT (name) DO NOTHING;

-- 2. FRED (Federal Reserve Economic Data) - 美国债券收益率
INSERT INTO finapp.price_data_sources (
  name,
  provider,
  api_endpoint,
  config,
  rate_limit,
  timeout_seconds,
  is_active
) VALUES (
  'FRED (Federal Reserve)',
  'fred',
  'https://api.stlouisfed.org/fred',
  '{
    "description": "美联储官方经济数据库，包含债券收益率、经济指标",
    "supports_products": ["BOND", "TREASURY"],
    "supports_markets": ["USA"],
    "data_types": ["economic_indicators", "bond_yields", "treasury_rates"],
    "features": {
      "bond_yields": true,
      "treasury_rates": true,
      "economic_indicators": true,
      "historical_data": true
    },
    "rate_limit_per_minute": 120,
    "free_plan": true,
    "requires_api_key": true
  }'::jsonb,
  120,
  30,
  true
) ON CONFLICT (name) DO NOTHING;

-- 3. 天天基金 API - 中国基金数据
INSERT INTO finapp.price_data_sources (
  name,
  provider,
  api_endpoint,
  config,
  rate_limit,
  timeout_seconds,
  is_active
) VALUES (
  '天天基金',
  'ttjj',
  'http://api.1234567.com.cn/fund',
  '{
    "description": "中国最大的基金数据平台，包含基金净值、排名、持仓",
    "supports_products": ["FUND", "ETF"],
    "supports_markets": ["SSE", "SZSE"],
    "data_types": ["fund_nav", "fund_ranking", "fund_holding"],
    "features": {
      "fund_nav": true,
      "fund_performance": true,
      "fund_holding": true,
      "fund_ranking": true,
      "manager_info": true
    },
    "rate_limit_per_minute": 60,
    "free_plan": false,
    "requires_api_key": true
  }'::jsonb,
  60,
  30,
  false
) ON CONFLICT (name) DO NOTHING;

-- 4. Polygon.io - 美股 + 期权 + 加密
INSERT INTO finapp.price_data_sources (
  name,
  provider,
  api_endpoint,
  config,
  rate_limit,
  timeout_seconds,
  is_active
) VALUES (
  'Polygon.io',
  'polygon',
  'https://api.polygon.io',
  '{
    "description": "美股、期权、加密货币、外汇多资产数据源",
    "supports_products": ["STOCK", "ETF", "OPTION", "CRYPTO", "FOREX"],
    "supports_markets": ["NYSE", "NASDAQ", "CRYPTO"],
    "data_types": ["real_time", "historical", "technical", "fundamental"],
    "features": {
      "real_time_quotes": true,
      "options_data": true,
      "crypto_data": true,
      "forex_data": true,
      "technical_indicators": true,
      "fundamental_data": true
    },
    "rate_limit_per_minute": 300,
    "free_plan": true,
    "requires_api_key": true
  }'::jsonb,
  300,
  30,
  true
) ON CONFLICT (name) DO NOTHING;

-- 5. IEX Cloud - 美股详细数据
INSERT INTO finapp.price_data_sources (
  name,
  provider,
  api_endpoint,
  config,
  rate_limit,
  timeout_seconds,
  is_active
) VALUES (
  'IEX Cloud',
  'iex_cloud',
  'https://cloud.iexapis.com/stable',
  '{
    "description": "美股详细数据，包含企业债券、财务数据、新闻",
    "supports_products": ["STOCK", "ETF", "BOND"],
    "supports_markets": ["NYSE", "NASDAQ"],
    "data_types": ["quotes", "fundamentals", "news", "financial_statements"],
    "features": {
      "real_time_quotes": true,
      "company_info": true,
      "financial_statements": true,
      "corporate_bonds": true,
      "news_feed": true,
      "earnings": true
    },
    "rate_limit_per_minute": 100,
    "free_plan": true,
    "requires_api_key": true
  }'::jsonb,
  100,
  30,
  true
) ON CONFLICT (name) DO NOTHING;

-- 6. 新浪财经 API - 综合数据
INSERT INTO finapp.price_data_sources (
  name,
  provider,
  api_endpoint,
  config,
  rate_limit,
  timeout_seconds,
  is_active
) VALUES (
  '新浪财经',
  'sina',
  'http://hq.sinajs.cn',
  '{
    "description": "新浪财经实时行情，支持A股、港股、美股、基金、债券",
    "supports_products": ["STOCK", "FUND", "BOND", "WARRANT"],
    "supports_markets": ["SSE", "SZSE", "HKEX", "NYSE", "NASDAQ"],
    "data_types": ["real_time_quotes", "historical", "technical"],
    "features": {
      "real_time_quotes": true,
      "historical_data": true,
      "technical_indicators": true,
      "flash_news": true,
      "fund_data": true
    },
    "rate_limit_per_minute": 200,
    "free_plan": true,
    "requires_api_key": false
  }'::jsonb,
  200,
  15,
  true
) ON CONFLICT (name) DO NOTHING;

-- 7. Tiingo - 全球股票数据
INSERT INTO finapp.price_data_sources (
  name,
  provider,
  api_endpoint,
  config,
  rate_limit,
  timeout_seconds,
  is_active
) VALUES (
  'Tiingo',
  'tiingo',
  'https://api.tiingo.com',
  '{
    "description": "全球股票数据，支持美股、国际股票、加密货币、ETF",
    "supports_products": ["STOCK", "ETF", "CRYPTO", "FUND"],
    "supports_markets": ["NYSE", "NASDAQ", "HKEX", "CRYPTO"],
    "data_types": ["quotes", "daily", "intraday", "news"],
    "features": {
      "real_time_quotes": true,
      "daily_data": true,
      "intraday_data": true,
      "international_stocks": true,
      "crypto_data": true,
      "news_feed": true
    },
    "rate_limit_per_minute": 400,
    "free_plan": true,
    "requires_api_key": true
  }'::jsonb,
  400,
  30,
  true
) ON CONFLICT (name) DO NOTHING;

-- 8. 币安 API - 加密数据 (如果需要)
INSERT INTO finapp.price_data_sources (
  name,
  provider,
  api_endpoint,
  config,
  rate_limit,
  timeout_seconds,
  is_active
) VALUES (
  'Binance API',
  'binance',
  'https://api.binance.com/api',
  '{
    "description": "币安加密货币交易所数据，包含实时行情、交易数据",
    "supports_products": ["CRYPTO"],
    "supports_markets": ["CRYPTO"],
    "data_types": ["real_time", "historical", "klines", "trades"],
    "features": {
      "real_time_prices": true,
      "kline_data": true,
      "trade_data": true,
      "account_management": true,
      "order_placement": true
    },
    "rate_limit_per_minute": 1200,
    "free_plan": true,
    "requires_api_key": false
  }'::jsonb,
  1200,
  15,
  false
) ON CONFLICT (name) DO NOTHING;

COMMIT;

-- 验证插入结果
SELECT 
  id,
  name,
  provider,
  is_active,
  config->'supports_products' as supports_products,
  config->'supports_markets' as supports_markets
FROM finapp.price_data_sources
ORDER BY created_at DESC
LIMIT 10;
