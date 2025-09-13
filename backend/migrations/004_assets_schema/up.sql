-- 004_assets_schema/up.sql
-- 资产管理相关表结构

-- 创建资产类型表（如果不存在）
CREATE TABLE IF NOT EXISTS asset_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'equity', 'fixed_income', 'alternative', 'cash'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建市场表（如果不存在）
CREATE TABLE IF NOT EXISTS markets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    currency VARCHAR(10),
    timezone VARCHAR(50),
    trading_hours JSONB, -- 交易时间配置
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建或更新资产表
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    asset_type_id VARCHAR(50) REFERENCES asset_types(id),
    market_id VARCHAR(50) REFERENCES markets(id),
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
    
    -- 基本信息
    isin VARCHAR(50), -- 国际证券识别编码
    cusip VARCHAR(50), -- 美国统一证券识别程序编码
    sector VARCHAR(100), -- 行业分类
    industry VARCHAR(100), -- 细分行业
    
    -- 风险和流动性
    risk_level VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH'
    liquidity_tag VARCHAR(20) DEFAULT 'MEDIUM', -- 'HIGH', 'MEDIUM', 'LOW'
    
    -- 交易信息
    lot_size INTEGER DEFAULT 1, -- 最小交易单位
    tick_size DECIMAL(10,6) DEFAULT 0.01, -- 最小价格变动单位
    
    -- 状态信息
    is_active BOOLEAN DEFAULT true,
    listing_date DATE,
    delisting_date DATE,
    
    -- 元数据
    description TEXT,
    tags TEXT[], -- 标签数组
    metadata JSONB, -- 扩展信息
    
    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- 约束
    UNIQUE(symbol, market_id),
    CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    CHECK (liquidity_tag IN ('HIGH', 'MEDIUM', 'LOW'))
);

-- 创建资产价格表
CREATE TABLE IF NOT EXISTS asset_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    price_date DATE NOT NULL,
    
    -- 价格数据
    open_price DECIMAL(15,6),
    high_price DECIMAL(15,6),
    low_price DECIMAL(15,6),
    close_price DECIMAL(15,6) NOT NULL,
    volume BIGINT,
    adjusted_price DECIMAL(15,6), -- 复权价格
    
    -- 数据来源
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'api', 'import'
    source_id VARCHAR(100), -- 外部数据源ID
    
    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- 约束
    UNIQUE(asset_id, price_date),
    CHECK (open_price >= 0),
    CHECK (high_price >= 0),
    CHECK (low_price >= 0),
    CHECK (close_price >= 0),
    CHECK (volume >= 0),
    CHECK (adjusted_price >= 0),
    CHECK (high_price >= low_price),
    CHECK (high_price >= open_price OR open_price IS NULL),
    CHECK (high_price >= close_price),
    CHECK (low_price <= open_price OR open_price IS NULL),
    CHECK (low_price <= close_price)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets(asset_type_id);
CREATE INDEX IF NOT EXISTS idx_assets_market ON assets(market_id);
CREATE INDEX IF NOT EXISTS idx_assets_currency ON assets(currency);
CREATE INDEX IF NOT EXISTS idx_assets_sector ON assets(sector);
CREATE INDEX IF NOT EXISTS idx_assets_active ON assets(is_active);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);

CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_id ON asset_prices(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_prices_date ON asset_prices(price_date);
CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_date ON asset_prices(asset_id, price_date);
CREATE INDEX IF NOT EXISTS idx_asset_prices_created_at ON asset_prices(created_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为资产表添加更新时间触发器
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为价格表添加更新时间触发器
DROP TRIGGER IF EXISTS update_asset_prices_updated_at ON asset_prices;
CREATE TRIGGER update_asset_prices_updated_at
    BEFORE UPDATE ON asset_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入默认资产类型数据
INSERT INTO asset_types (id, name, description, category) VALUES
('stock', '股票', '上市公司股票', 'equity'),
('bond', '债券', '政府和企业债券', 'fixed_income'),
('fund', '基金', '公募和私募基金', 'equity'),
('etf', 'ETF', '交易型开放式指数基金', 'equity'),
('option', '期权', '股票期权和指数期权', 'alternative'),
('future', '期货', '商品和金融期货', 'alternative'),
('cash', '现金', '现金和现金等价物', 'cash'),
('crypto', '数字货币', '比特币等数字货币', 'alternative')
ON CONFLICT (id) DO NOTHING;

-- 插入默认市场数据
INSERT INTO markets (id, name, country, currency, timezone) VALUES
('SSE', '上海证券交易所', 'CN', 'CNY', 'Asia/Shanghai'),
('SZSE', '深圳证券交易所', 'CN', 'CNY', 'Asia/Shanghai'),
('HKEX', '香港交易所', 'HK', 'HKD', 'Asia/Hong_Kong'),
('NYSE', '纽约证券交易所', 'US', 'USD', 'America/New_York'),
('NASDAQ', '纳斯达克', 'US', 'USD', 'America/New_York'),
('LSE', '伦敦证券交易所', 'GB', 'GBP', 'Europe/London'),
('TSE', '东京证券交易所', 'JP', 'JPY', 'Asia/Tokyo'),
('OTC', '场外交易', 'GLOBAL', 'MULTI', 'UTC')
ON CONFLICT (id) DO NOTHING;

-- 创建资产统计视图
CREATE OR REPLACE VIEW asset_statistics AS
SELECT 
    COUNT(*) as total_assets,
    COUNT(*) FILTER (WHERE is_active = true) as active_assets,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_assets,
    COUNT(DISTINCT asset_type_id) as asset_types_count,
    COUNT(DISTINCT market_id) as markets_count,
    COUNT(DISTINCT currency) as currencies_count,
    COUNT(DISTINCT sector) as sectors_count
FROM assets;

-- 创建价格统计视图
CREATE OR REPLACE VIEW price_statistics AS
SELECT 
    asset_id,
    COUNT(*) as price_records_count,
    MIN(price_date) as earliest_price_date,
    MAX(price_date) as latest_price_date,
    AVG(close_price) as avg_price,
    MIN(close_price) as min_price,
    MAX(close_price) as max_price,
    STDDEV(close_price) as price_volatility
FROM asset_prices
GROUP BY asset_id;