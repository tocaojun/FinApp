-- FinApp Database Schema - Analytics and Reports Tables
-- Migration: 003_analytics_and_reports.sql
-- Description: Create analytics, performance tracking and reporting tables

-- Create portfolio_snapshots table (for historical portfolio values)
CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_value DECIMAL(20, 8) NOT NULL,
    cash_value DECIMAL(20, 8) NOT NULL DEFAULT 0,
    invested_value DECIMAL(20, 8) NOT NULL DEFAULT 0,
    unrealized_gain_loss DECIMAL(20, 8) NOT NULL DEFAULT 0,
    realized_gain_loss DECIMAL(20, 8) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL,
    metadata JSONB, -- Additional snapshot data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, snapshot_date)
);

-- Create position_snapshots table (for historical position values)
CREATE TABLE position_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    portfolio_snapshot_id UUID NOT NULL REFERENCES portfolio_snapshots(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    market_price DECIMAL(20, 8),
    market_value DECIMAL(20, 8),
    average_cost DECIMAL(20, 8) NOT NULL,
    total_cost DECIMAL(20, 8) NOT NULL,
    unrealized_gain_loss DECIMAL(20, 8),
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create performance_metrics table (for calculated performance metrics)
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- irr, total_return, sharpe_ratio, etc.
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly, yearly, all_time
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    value DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(3),
    metadata JSONB, -- Additional metric-specific data
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, metric_type, period_type, period_start, period_end)
);

-- Create cash_flows table (for IRR calculations)
CREATE TABLE cash_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    trading_account_id UUID REFERENCES trading_accounts(id),
    asset_id UUID REFERENCES assets(id),
    flow_type VARCHAR(20) NOT NULL CHECK (flow_type IN ('inflow', 'outflow')),
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    flow_date DATE NOT NULL,
    description TEXT,
    transaction_id UUID REFERENCES transactions(id), -- Link to originating transaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table (for saved reports)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL, -- performance, holdings, transactions, tax, etc.
    parameters JSONB NOT NULL, -- Report configuration and filters
    schedule JSONB, -- Scheduled report configuration
    is_scheduled BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create report_executions table (for report generation history)
CREATE TABLE report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    execution_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    file_path TEXT, -- Path to generated report file
    file_size BIGINT,
    error_message TEXT,
    metadata JSONB -- Additional execution data
);

-- Create benchmarks table (for performance comparison)
CREATE TABLE benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    asset_class VARCHAR(50),
    currency VARCHAR(3) NOT NULL,
    data_source VARCHAR(50), -- yahoo, bloomberg, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create benchmark_prices table (for benchmark historical data)
CREATE TABLE benchmark_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benchmark_id UUID NOT NULL REFERENCES benchmarks(id) ON DELETE CASCADE,
    price_date DATE NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(benchmark_id, price_date)
);

-- Create asset_prices table (for historical asset prices)
CREATE TABLE asset_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    price_date DATE NOT NULL,
    open_price DECIMAL(20, 8),
    high_price DECIMAL(20, 8),
    low_price DECIMAL(20, 8),
    close_price DECIMAL(20, 8) NOT NULL,
    volume BIGINT,
    adjusted_close DECIMAL(20, 8),
    currency VARCHAR(3) NOT NULL,
    data_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, price_date)
);

-- Create exchange_rates table (for currency conversion)
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate_date DATE NOT NULL,
    rate DECIMAL(20, 8) NOT NULL,
    data_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency, rate_date)
);

-- Create audit_logs table (for tracking data changes)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for analytics and reports tables
CREATE INDEX idx_portfolio_snapshots_portfolio_id ON portfolio_snapshots(portfolio_id);
CREATE INDEX idx_portfolio_snapshots_snapshot_date ON portfolio_snapshots(snapshot_date);
CREATE INDEX idx_portfolio_snapshots_portfolio_date ON portfolio_snapshots(portfolio_id, snapshot_date);

CREATE INDEX idx_position_snapshots_position_id ON position_snapshots(position_id);
CREATE INDEX idx_position_snapshots_portfolio_snapshot_id ON position_snapshots(portfolio_snapshot_id);
CREATE INDEX idx_position_snapshots_snapshot_date ON position_snapshots(snapshot_date);

CREATE INDEX idx_performance_metrics_portfolio_id ON performance_metrics(portfolio_id);
CREATE INDEX idx_performance_metrics_metric_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_period_type ON performance_metrics(period_type);
CREATE INDEX idx_performance_metrics_period_dates ON performance_metrics(period_start, period_end);

CREATE INDEX idx_cash_flows_portfolio_id ON cash_flows(portfolio_id);
CREATE INDEX idx_cash_flows_trading_account_id ON cash_flows(trading_account_id);
CREATE INDEX idx_cash_flows_asset_id ON cash_flows(asset_id);
CREATE INDEX idx_cash_flows_flow_date ON cash_flows(flow_date);
CREATE INDEX idx_cash_flows_transaction_id ON cash_flows(transaction_id);

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_portfolio_id ON reports(portfolio_id);
CREATE INDEX idx_reports_report_type ON reports(report_type);
CREATE INDEX idx_reports_is_scheduled ON reports(is_scheduled);
CREATE INDEX idx_reports_is_active ON reports(is_active);

CREATE INDEX idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX idx_report_executions_status ON report_executions(execution_status);
CREATE INDEX idx_report_executions_started_at ON report_executions(started_at);

CREATE INDEX idx_benchmarks_symbol ON benchmarks(symbol);
CREATE INDEX idx_benchmarks_is_active ON benchmarks(is_active);

CREATE INDEX idx_benchmark_prices_benchmark_id ON benchmark_prices(benchmark_id);
CREATE INDEX idx_benchmark_prices_price_date ON benchmark_prices(price_date);
CREATE INDEX idx_benchmark_prices_benchmark_date ON benchmark_prices(benchmark_id, price_date);

CREATE INDEX idx_asset_prices_asset_id ON asset_prices(asset_id);
CREATE INDEX idx_asset_prices_price_date ON asset_prices(price_date);
CREATE INDEX idx_asset_prices_asset_date ON asset_prices(asset_id, price_date);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_rate_date ON exchange_rates(rate_date);
CREATE INDEX idx_exchange_rates_currencies_date ON exchange_rates(from_currency, to_currency, rate_date);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Add updated_at triggers
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE portfolio_snapshots IS '投资组合快照表，用于历史价值追踪';
COMMENT ON TABLE position_snapshots IS '持仓快照表，用于历史持仓追踪';
COMMENT ON TABLE performance_metrics IS '绩效指标表，存储计算的性能指标';
COMMENT ON TABLE cash_flows IS '现金流表，用于IRR计算';
COMMENT ON TABLE reports IS '报表配置表';
COMMENT ON TABLE report_executions IS '报表执行历史表';
COMMENT ON TABLE benchmarks IS '基准指数表';
COMMENT ON TABLE benchmark_prices IS '基准指数价格历史表';
COMMENT ON TABLE asset_prices IS '资产价格历史表';
COMMENT ON TABLE exchange_rates IS '汇率表';
COMMENT ON TABLE audit_logs IS '审计日志表';