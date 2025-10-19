-- 005_product_management_data.sql
-- 产品管理系统基础数据初始化

-- 插入基础资产类型
INSERT INTO asset_types (id, name, code, category, description, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '股票', 'STOCK', 'EQUITY', '上市公司股票', true, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440002', '债券', 'BOND', 'BOND', '政府和企业债券', true, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440003', '基金', 'FUND', 'FUND', '投资基金', true, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440004', 'ETF', 'ETF', 'ETF', '交易所交易基金', true, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440005', '期权', 'OPTION', 'OPTION', '期权合约', true, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440006', '期货', 'FUTURE', 'FUTURE', '期货合约', true, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440007', '商品', 'COMMODITY', 'COMMODITY', '大宗商品', true, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440008', '货币', 'CURRENCY', 'CURRENCY', '外汇货币', true, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440009', '加密货币', 'CRYPTO', 'CRYPTO', '数字加密货币', true, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- 插入基础市场数据
INSERT INTO markets (id, name, code, country, currency, timezone, is_active, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '上海证券交易所', 'SSE', 'CN', 'CNY', 'Asia/Shanghai', true, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440002', '深圳证券交易所', 'SZSE', 'CN', 'CNY', 'Asia/Shanghai', true, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440003', '纽约证券交易所', 'NYSE', 'US', 'USD', 'America/New_York', true, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440004', '纳斯达克', 'NASDAQ', 'US', 'USD', 'America/New_York', true, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440005', '香港交易所', 'HKEX', 'HK', 'HKD', 'Asia/Hong_Kong', true, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440006', '伦敦证券交易所', 'LSE', 'GB', 'GBP', 'Europe/London', true, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440007', '东京证券交易所', 'TSE', 'JP', 'JPY', 'Asia/Tokyo', true, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440008', '法兰克福证券交易所', 'FSE', 'DE', 'EUR', 'Europe/Berlin', true, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440009', '多伦多证券交易所', 'TSX', 'CA', 'CAD', 'America/Toronto', true, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440010', '澳大利亚证券交易所', 'ASX', 'AU', 'AUD', 'Australia/Sydney', true, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- 插入示例资产数据
INSERT INTO assets (id, symbol, name, asset_type_id, market_id, currency, sector, industry, risk_level, liquidity_tag, is_active, description, created_at, updated_at) VALUES
-- 中国股票
('770e8400-e29b-41d4-a716-446655440001', '000001', '平安银行', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'CNY', '金融', '银行', 'MEDIUM', 'HIGH', true, '中国平安保险（集团）股份有限公司控股的银行', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('770e8400-e29b-41d4-a716-446655440002', '000002', '万科A', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'CNY', '房地产', '房地产开发', 'MEDIUM', 'HIGH', true, '万科企业股份有限公司', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('770e8400-e29b-41d4-a716-446655440003', '600036', '招商银行', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'CNY', '金融', '银行', 'MEDIUM', 'HIGH', true, '招商银行股份有限公司', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('770e8400-e29b-41d4-a716-446655440004', '600519', '贵州茅台', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'CNY', '消费品', '白酒', 'LOW', 'HIGH', true, '贵州茅台酒股份有限公司', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 美国股票
('770e8400-e29b-41d4-a716-446655440005', 'AAPL', '苹果公司', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 'USD', '科技', '消费电子', 'MEDIUM', 'HIGH', true, 'Apple Inc.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('770e8400-e29b-41d4-a716-446655440006', 'MSFT', '微软公司', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 'USD', '科技', '软件', 'MEDIUM', 'HIGH', true, 'Microsoft Corporation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('770e8400-e29b-41d4-a716-446655440007', 'GOOGL', '谷歌A', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 'USD', '科技', '互联网', 'MEDIUM', 'HIGH', true, 'Alphabet Inc. Class A', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('770e8400-e29b-41d4-a716-446655440008', 'TSLA', '特斯拉', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 'USD', '汽车', '电动汽车', 'HIGH', 'HIGH', true, 'Tesla, Inc.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 香港股票
('770e8400-e29b-41d4-a716-446655440009', '00700', '腾讯控股', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005', 'HKD', '科技', '互联网', 'MEDIUM', 'HIGH', true, '腾讯控股有限公司', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('770e8400-e29b-41d4-a716-446655440010', '00941', '中国移动', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005', 'HKD', '通信', '电信运营', 'LOW', 'HIGH', true, '中国移动有限公司', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- ETF
('770e8400-e29b-41d4-a716-446655440011', 'SPY', 'SPDR S&P 500 ETF', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 'USD', 'ETF', '指数基金', 'LOW', 'HIGH', true, '跟踪标普500指数的ETF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('770e8400-e29b-41d4-a716-446655440012', 'QQQ', 'Invesco QQQ Trust', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'USD', 'ETF', '科技指数', 'MEDIUM', 'HIGH', true, '跟踪纳斯达克100指数的ETF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 债券
('770e8400-e29b-41d4-a716-446655440013', 'TLT', 'iShares 20+ Year Treasury Bond ETF', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 'USD', '债券', '国债', 'LOW', 'HIGH', true, '20年期以上美国国债ETF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 加密货币
('770e8400-e29b-41d4-a716-446655440014', 'BTC', '比特币', '550e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440004', 'USD', '加密货币', '数字货币', 'HIGH', 'MEDIUM', true, '比特币数字货币', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('770e8400-e29b-41d4-a716-446655440015', 'ETH', '以太坊', '550e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440004', 'USD', '加密货币', '智能合约', 'HIGH', 'MEDIUM', true, '以太坊区块链平台代币', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (symbol) DO NOTHING;

-- 插入示例价格数据
INSERT INTO asset_prices (id, asset_id, price_date, open_price, high_price, low_price, close_price, volume, source, created_at, updated_at) VALUES
-- 平安银行价格数据
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '2024-01-15', 12.50, 12.80, 12.30, 12.45, 15678900, 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '2024-01-16', 12.45, 12.60, 12.20, 12.35, 13456780, 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 苹果公司价格数据
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440005', '2024-01-15', 175.00, 177.50, 174.20, 175.43, 45678900, 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440005', '2024-01-16', 175.43, 178.20, 175.10, 177.58, 52341200, 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 腾讯控股价格数据
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440009', '2024-01-15', 320.00, 325.50, 318.00, 322.40, 8765432, 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440009', '2024-01-16', 322.40, 328.00, 320.50, 325.80, 9876543, 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- SPY ETF价格数据
('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440011', '2024-01-15', 478.50, 480.20, 477.80, 479.30, 25678900, 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('880e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440011', '2024-01-16', 479.30, 481.50, 478.90, 480.75, 28765432, 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 比特币价格数据
('880e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440014', '2024-01-15', 42500.00, 43200.00, 42100.00, 42850.00, 1234567890, 'api', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('880e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440014', '2024-01-16', 42850.00, 43500.00, 42600.00, 43280.00, 1345678901, 'api', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (asset_id, price_date) DO NOTHING;

-- 插入基础汇率数据
INSERT INTO exchange_rates (id, from_currency, to_currency, rate_date, rate, data_source, created_at) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'USD', 'CNY', '2024-01-15', 7.2345, 'manual', CURRENT_TIMESTAMP),
('990e8400-e29b-41d4-a716-446655440002', 'USD', 'HKD', '2024-01-15', 7.8123, 'manual', CURRENT_TIMESTAMP),
('990e8400-e29b-41d4-a716-446655440003', 'USD', 'EUR', '2024-01-15', 0.9123, 'manual', CURRENT_TIMESTAMP),
('990e8400-e29b-41d4-a716-446655440004', 'USD', 'GBP', '2024-01-15', 0.7856, 'manual', CURRENT_TIMESTAMP),
('990e8400-e29b-41d4-a716-446655440005', 'USD', 'JPY', '2024-01-15', 149.25, 'manual', CURRENT_TIMESTAMP),
('990e8400-e29b-41d4-a716-446655440006', 'CNY', 'HKD', '2024-01-15', 1.0798, 'manual', CURRENT_TIMESTAMP),
('990e8400-e29b-41d4-a716-446655440007', 'EUR', 'CNY', '2024-01-15', 7.9345, 'manual', CURRENT_TIMESTAMP),
('990e8400-e29b-41d4-a716-446655440008', 'GBP', 'CNY', '2024-01-15', 9.2134, 'manual', CURRENT_TIMESTAMP)
ON CONFLICT (from_currency, to_currency, rate_date) DO NOTHING;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type_id ON assets(asset_type_id);
CREATE INDEX IF NOT EXISTS idx_assets_market_id ON assets(market_id);
CREATE INDEX IF NOT EXISTS idx_assets_currency ON assets(currency);
CREATE INDEX IF NOT EXISTS idx_assets_sector ON assets(sector);
CREATE INDEX IF NOT EXISTS idx_assets_is_active ON assets(is_active);

CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_id ON asset_prices(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_prices_price_date ON asset_prices(price_date);
CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_date ON asset_prices(asset_id, price_date);

CREATE INDEX IF NOT EXISTS idx_asset_types_category ON asset_types(category);
CREATE INDEX IF NOT EXISTS idx_asset_types_is_active ON asset_types(is_active);

CREATE INDEX IF NOT EXISTS idx_markets_country ON markets(country);
CREATE INDEX IF NOT EXISTS idx_markets_currency ON markets(currency);
CREATE INDEX IF NOT EXISTS idx_markets_is_active ON markets(is_active);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(rate_date);

-- 更新统计信息
ANALYZE assets;
ANALYZE asset_prices;
ANALYZE asset_types;
ANALYZE markets;
ANALYZE exchange_rates;