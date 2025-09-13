-- FinApp Database Schema - Portfolios and Trading Accounts Tables
-- Migration: 002_portfolios_and_accounts.sql
-- Description: Create portfolios, trading accounts and related tables

-- Create markets table (market configuration)
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(3) NOT NULL, -- ISO 3166-1 alpha-3 country code
    currency VARCHAR(3) NOT NULL, -- ISO 4217 currency code
    timezone VARCHAR(50) NOT NULL,
    trading_hours JSONB, -- Trading hours configuration
    holidays JSONB, -- Market holidays
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create asset_types table
CREATE TABLE asset_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- stock, bond, fund, option, crypto, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create liquidity_tags table
CREATE TABLE liquidity_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create portfolios table
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'CNY',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Create trading_accounts table
CREATE TABLE trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- broker, bank, crypto_exchange, etc.
    broker_name VARCHAR(100),
    account_number VARCHAR(100),
    currency VARCHAR(3) NOT NULL,
    initial_balance DECIMAL(20, 8) DEFAULT 0,
    current_balance DECIMAL(20, 8) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    market_id UUID REFERENCES markets(id),
    currency VARCHAR(3) NOT NULL,
    isin VARCHAR(12), -- International Securities Identification Number
    cusip VARCHAR(9), -- Committee on Uniform Securities Identification Procedures
    sector VARCHAR(100),
    industry VARCHAR(100),
    description TEXT,
    metadata JSONB, -- Additional asset-specific data
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, market_id)
);

-- Create option_details table (for option-specific information)
CREATE TABLE option_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    underlying_asset_id UUID REFERENCES assets(id),
    option_type VARCHAR(10) NOT NULL CHECK (option_type IN ('call', 'put')),
    strike_price DECIMAL(20, 8) NOT NULL,
    expiration_date DATE NOT NULL,
    contract_size INTEGER DEFAULT 100,
    exercise_style VARCHAR(20) DEFAULT 'american', -- american, european
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'split', 'merger', 'spin_off', 'deposit', 'withdrawal')),
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8),
    total_amount DECIMAL(20, 8) NOT NULL,
    fees DECIMAL(20, 8) DEFAULT 0,
    taxes DECIMAL(20, 8) DEFAULT 0,
    currency VARCHAR(3) NOT NULL,
    exchange_rate DECIMAL(20, 8) DEFAULT 1, -- Rate to portfolio base currency
    transaction_date DATE NOT NULL,
    settlement_date DATE,
    notes TEXT,
    tags TEXT[], -- Array of tags for categorization
    liquidity_tag_id UUID REFERENCES liquidity_tags(id),
    external_id VARCHAR(100), -- ID from external system (broker, etc.)
    metadata JSONB, -- Additional transaction-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create positions table (current holdings)
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id),
    quantity DECIMAL(20, 8) NOT NULL DEFAULT 0,
    average_cost DECIMAL(20, 8) NOT NULL DEFAULT 0,
    total_cost DECIMAL(20, 8) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL,
    first_purchase_date DATE,
    last_transaction_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, trading_account_id, asset_id)
);

-- Create indexes for portfolios and accounts tables
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_is_active ON portfolios(is_active);
CREATE INDEX idx_portfolios_is_default ON portfolios(is_default);

CREATE INDEX idx_trading_accounts_portfolio_id ON trading_accounts(portfolio_id);
CREATE INDEX idx_trading_accounts_is_active ON trading_accounts(is_active);
CREATE INDEX idx_trading_accounts_account_type ON trading_accounts(account_type);

CREATE INDEX idx_assets_symbol ON assets(symbol);
CREATE INDEX idx_assets_asset_type_id ON assets(asset_type_id);
CREATE INDEX idx_assets_market_id ON assets(market_id);
CREATE INDEX idx_assets_is_active ON assets(is_active);
CREATE INDEX idx_assets_symbol_market ON assets(symbol, market_id);

CREATE INDEX idx_option_details_asset_id ON option_details(asset_id);
CREATE INDEX idx_option_details_underlying_asset_id ON option_details(underlying_asset_id);
CREATE INDEX idx_option_details_expiration_date ON option_details(expiration_date);

CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX idx_transactions_trading_account_id ON transactions(trading_account_id);
CREATE INDEX idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_liquidity_tag_id ON transactions(liquidity_tag_id);
CREATE INDEX idx_transactions_external_id ON transactions(external_id);
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);

CREATE INDEX idx_positions_portfolio_id ON positions(portfolio_id);
CREATE INDEX idx_positions_trading_account_id ON positions(trading_account_id);
CREATE INDEX idx_positions_asset_id ON positions(asset_id);
CREATE INDEX idx_positions_is_active ON positions(is_active);
CREATE INDEX idx_positions_quantity ON positions(quantity) WHERE quantity > 0;

CREATE INDEX idx_markets_code ON markets(code);
CREATE INDEX idx_markets_is_active ON markets(is_active);

CREATE INDEX idx_asset_types_code ON asset_types(code);
CREATE INDEX idx_asset_types_category ON asset_types(category);
CREATE INDEX idx_asset_types_is_active ON asset_types(is_active);

CREATE INDEX idx_liquidity_tags_is_active ON liquidity_tags(is_active);
CREATE INDEX idx_liquidity_tags_sort_order ON liquidity_tags(sort_order);

-- Add updated_at triggers
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON trading_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE markets IS '市场配置表';
COMMENT ON TABLE asset_types IS '资产类型表';
COMMENT ON TABLE liquidity_tags IS '流动性标签表';
COMMENT ON TABLE portfolios IS '投资组合表';
COMMENT ON TABLE trading_accounts IS '交易账户表';
COMMENT ON TABLE assets IS '资产表';
COMMENT ON TABLE option_details IS '期权详情表';
COMMENT ON TABLE transactions IS '交易记录表';
COMMENT ON TABLE positions IS '持仓表';