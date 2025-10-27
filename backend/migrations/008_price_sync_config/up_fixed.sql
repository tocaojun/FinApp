-- 008_price_sync_config/up_fixed.sql
-- 价格同步配置表结构（修复版）

-- 设置 schema
SET search_path TO finapp;

-- 创建数据源配置表
CREATE TABLE IF NOT EXISTS price_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL, -- 'yahoo_finance', 'alpha_vantage', 'tushare', 'custom'
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT, -- 加密存储的API密钥
    
    -- 配置参数
    config JSONB DEFAULT '{}', -- 额外配置参数
    rate_limit INTEGER DEFAULT 60, -- 每分钟请求限制
    timeout_seconds INTEGER DEFAULT 30,
    
    -- 状态
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(20), -- 'success', 'failed', 'partial'
    last_error_message TEXT,
    
    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    CHECK (provider IN ('yahoo_finance', 'alpha_vantage', 'tushare', 'eastmoney', 'custom')),
    CHECK (last_sync_status IS NULL OR last_sync_status IN ('success', 'failed', 'partial'))
);

-- 创建同步任务配置表（修复外键类型）
CREATE TABLE IF NOT EXISTS price_sync_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 数据源
    data_source_id UUID NOT NULL REFERENCES price_data_sources(id) ON DELETE CASCADE,
    
    -- 同步范围（修复：使用UUID类型）
    asset_type_id UUID REFERENCES asset_types(id),
    market_id UUID REFERENCES markets(id),
    asset_ids UUID[], -- 指定资产列表（为空表示所有）
    
    -- 调度配置
    schedule_type VARCHAR(20) NOT NULL DEFAULT 'manual', -- 'manual', 'cron', 'interval'
    cron_expression VARCHAR(100), -- cron表达式，如 '0 0 16 * * ?' 表示每天16:00
    interval_minutes INTEGER, -- 间隔分钟数
    
    -- 同步策略
    sync_days_back INTEGER DEFAULT 1, -- 回溯天数
    overwrite_existing BOOLEAN DEFAULT false, -- 是否覆盖已有数据
    
    -- 状态
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    last_run_status VARCHAR(20), -- 'success', 'failed', 'running'
    last_run_result JSONB, -- 最后一次运行结果统计
    
    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    CHECK (schedule_type IN ('manual', 'cron', 'interval')),
    CHECK (last_run_status IS NULL OR last_run_status IN ('success', 'failed', 'running', 'partial'))
);

-- 创建同步日志表
CREATE TABLE IF NOT EXISTS price_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES price_sync_tasks(id) ON DELETE CASCADE,
    data_source_id UUID REFERENCES price_data_sources(id) ON DELETE SET NULL,
    
    -- 执行信息
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'success', 'failed', 'partial'
    
    -- 统计信息
    total_assets INTEGER DEFAULT 0,
    total_records INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    
    -- 结果详情
    result_summary JSONB, -- 详细统计信息
    error_message TEXT,
    
    CHECK (status IN ('running', 'success', 'failed', 'partial'))
);

-- 创建同步错误详情表
CREATE TABLE IF NOT EXISTS price_sync_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES price_sync_logs(id) ON DELETE CASCADE,
    
    -- 错误信息
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    asset_symbol VARCHAR(50),
    error_type VARCHAR(50), -- 'network', 'parse', 'validation', 'api_limit'
    error_message TEXT NOT NULL,
    error_details JSONB,
    
    -- 时间
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (error_type IN ('network', 'parse', 'validation', 'api_limit', 'other'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_price_data_sources_provider ON price_data_sources(provider);
CREATE INDEX IF NOT EXISTS idx_price_data_sources_active ON price_data_sources(is_active);

CREATE INDEX IF NOT EXISTS idx_price_sync_tasks_data_source ON price_sync_tasks(data_source_id);
CREATE INDEX IF NOT EXISTS idx_price_sync_tasks_active ON price_sync_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_price_sync_tasks_schedule ON price_sync_tasks(schedule_type, is_active);
CREATE INDEX IF NOT EXISTS idx_price_sync_tasks_next_run ON price_sync_tasks(next_run_at) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_price_sync_logs_task ON price_sync_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_price_sync_logs_status ON price_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_price_sync_logs_started ON price_sync_logs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_sync_errors_log ON price_sync_errors(log_id);
CREATE INDEX IF NOT EXISTS idx_price_sync_errors_asset ON price_sync_errors(asset_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_price_data_sources_updated_at ON price_data_sources;
CREATE TRIGGER update_price_data_sources_updated_at
    BEFORE UPDATE ON price_data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_price_sync_tasks_updated_at ON price_sync_tasks;
CREATE TRIGGER update_price_sync_tasks_updated_at
    BEFORE UPDATE ON price_sync_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入默认数据源
INSERT INTO price_data_sources (name, provider, api_endpoint, config, is_active)
VALUES 
    ('Yahoo Finance', 'yahoo_finance', 'https://query1.finance.yahoo.com/v8/finance/chart/', 
     '{"supports_markets": ["US", "HK", "CN"], "rate_limit_per_minute": 60}'::jsonb, true),
    ('东方财富', 'eastmoney', 'http://push2.eastmoney.com/api/qt/stock/kline/get',
     '{"supports_markets": ["CN"], "rate_limit_per_minute": 100}'::jsonb, true),
    ('Tushare', 'tushare', 'http://api.tushare.pro',
     '{"supports_markets": ["CN"], "requires_api_key": true, "rate_limit_per_minute": 200}'::jsonb, false)
ON CONFLICT (name) DO NOTHING;

-- 创建视图：同步任务概览
CREATE OR REPLACE VIEW v_price_sync_task_overview AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.schedule_type,
    t.is_active,
    t.last_run_at,
    t.next_run_at,
    t.last_run_status,
    ds.name as data_source_name,
    ds.provider,
    (SELECT COUNT(*) FROM price_sync_logs WHERE task_id = t.id) as total_runs,
    (SELECT COUNT(*) FROM price_sync_logs WHERE task_id = t.id AND status = 'success') as successful_runs
FROM price_sync_tasks t
LEFT JOIN price_data_sources ds ON t.data_source_id = ds.id;

-- 添加注释
COMMENT ON TABLE price_data_sources IS '价格数据源配置表';
COMMENT ON TABLE price_sync_tasks IS '价格同步任务配置表';
COMMENT ON TABLE price_sync_logs IS '价格同步执行日志表';
COMMENT ON TABLE price_sync_errors IS '价格同步错误详情表';
