# API 同步日志数据表结构说明

## 📊 数据表概览

API 同步的日志信息记录在 **4 个核心数据表** 中：

| 表名 | 用途 | 记录数量 |
|------|------|---------|
| `price_data_sources` | 数据源配置 | 配置信息 |
| `price_sync_tasks` | 同步任务定义 | 任务配置 |
| `price_sync_logs` | 同步执行日志 | 每次同步 1 条 |
| `price_sync_errors` | 同步错误详情 | 每个错误 1 条 |

---

## 1️⃣ price_data_sources（数据源配置表）

### 表结构

```sql
CREATE TABLE finapp.price_data_sources (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(100) NOT NULL,           -- 数据源名称
    provider           VARCHAR(50) NOT NULL,            -- 提供商
    api_endpoint       VARCHAR(500),                    -- API 端点
    api_key_encrypted  TEXT,                            -- 加密的 API Key
    config             JSONB,                           -- 配置信息
    rate_limit         INTEGER DEFAULT 60,              -- 速率限制（请求/分钟）
    timeout_seconds    INTEGER DEFAULT 30,              -- 超时时间（秒）
    is_active          BOOLEAN DEFAULT true,            -- 是否启用
    last_sync_at       TIMESTAMP,                       -- 最后同步时间
    last_sync_status   VARCHAR(20),                     -- 最后同步状态
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | UUID | 主键 | `a1b2c3d4-...` |
| `name` | VARCHAR(100) | 数据源名称 | "Yahoo Finance" |
| `provider` | VARCHAR(50) | 提供商代码 | "yahoo_finance" |
| `api_endpoint` | VARCHAR(500) | API 基础 URL | "https://query1.finance.yahoo.com" |
| `config` | JSONB | 额外配置 | `{"use_proxy": false}` |
| `rate_limit` | INTEGER | 每分钟请求限制 | 60 |
| `timeout_seconds` | INTEGER | 请求超时时间 | 30 |
| `is_active` | BOOLEAN | 是否启用 | true |
| `last_sync_at` | TIMESTAMP | 最后同步时间 | "2025-10-27 10:30:00" |
| `last_sync_status` | VARCHAR(20) | 最后同步状态 | "success" / "failed" |

### 支持的提供商

```sql
CHECK (provider IN (
    'yahoo_finance',
    'alpha_vantage',
    'tushare',
    'eastmoney',
    'custom'
))
```

### 查询示例

```sql
-- 查看所有活跃的数据源
SELECT id, name, provider, rate_limit, last_sync_status
FROM finapp.price_data_sources
WHERE is_active = true;

-- 查看数据源的同步历史
SELECT 
    ds.name,
    COUNT(CASE WHEN psl.status = 'success' THEN 1 END) as success_count,
    COUNT(CASE WHEN psl.status = 'failed' THEN 1 END) as failed_count,
    MAX(psl.started_at) as last_sync
FROM finapp.price_data_sources ds
LEFT JOIN finapp.price_sync_logs psl ON ds.id = psl.data_source_id
GROUP BY ds.id, ds.name;
```

---

## 2️⃣ price_sync_tasks（同步任务表）

### 表结构

```sql
CREATE TABLE finapp.price_sync_tasks (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(100) NOT NULL,           -- 任务名称
    description        TEXT,                            -- 任务描述
    data_source_id     UUID NOT NULL,                   -- 数据源 ID
    asset_type_id      UUID,                            -- 资产类型 ID（可选）
    market_id          UUID,                            -- 市场 ID（可选）
    asset_ids          UUID[],                          -- 指定资产 ID 列表
    schedule_type      VARCHAR(20) NOT NULL,            -- 调度类型
    schedule_config    JSONB,                           -- 调度配置
    is_active          BOOLEAN DEFAULT true,            -- 是否启用
    last_run_at        TIMESTAMP,                       -- 最后运行时间
    last_run_status    VARCHAR(20),                     -- 最后运行状态
    next_run_at        TIMESTAMP,                       -- 下次运行时间
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (data_source_id) REFERENCES finapp.price_data_sources(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_type_id) REFERENCES finapp.asset_types(id),
    FOREIGN KEY (market_id) REFERENCES finapp.markets(id)
);
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | UUID | 主键 | `3ed34abc-...` |
| `name` | VARCHAR(100) | 任务名称 | "港股日行情同步" |
| `data_source_id` | UUID | 数据源 ID | 关联 `price_data_sources.id` |
| `asset_type_id` | UUID | 资产类型（可选） | 股票/基金/债券 |
| `market_id` | UUID | 市场（可选） | 港股/A股/美股 |
| `asset_ids` | UUID[] | 指定资产列表 | `{uuid1, uuid2, ...}` |
| `schedule_type` | VARCHAR(20) | 调度类型 | "manual" / "cron" / "interval" |
| `schedule_config` | JSONB | 调度配置 | `{"cron": "0 9 * * *"}` |
| `is_active` | BOOLEAN | 是否启用 | true |
| `last_run_at` | TIMESTAMP | 最后运行时间 | "2025-10-27 10:30:00" |
| `last_run_status` | VARCHAR(20) | 最后运行状态 | "success" / "failed" / "running" |
| `next_run_at` | TIMESTAMP | 下次运行时间 | "2025-10-28 09:00:00" |

### 调度类型

```sql
CHECK (schedule_type IN (
    'manual',      -- 手动触发
    'cron',        -- Cron 表达式
    'interval'     -- 固定间隔
))
```

### 查询示例

```sql
-- 查看所有活跃任务
SELECT 
    t.id,
    t.name,
    ds.name as data_source,
    t.schedule_type,
    t.last_run_status,
    t.last_run_at,
    t.next_run_at
FROM finapp.price_sync_tasks t
JOIN finapp.price_data_sources ds ON t.data_source_id = ds.id
WHERE t.is_active = true
ORDER BY t.last_run_at DESC;

-- 查看任务的资产范围
SELECT 
    t.name,
    at.name as asset_type,
    m.name as market,
    COALESCE(array_length(t.asset_ids, 1), 0) as specific_assets_count
FROM finapp.price_sync_tasks t
LEFT JOIN finapp.asset_types at ON t.asset_type_id = at.id
LEFT JOIN finapp.markets m ON t.market_id = m.id;
```

---

## 3️⃣ price_sync_logs（同步日志表）⭐

### 表结构

```sql
CREATE TABLE finapp.price_sync_logs (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id            UUID,                            -- 任务 ID
    data_source_id     UUID,                            -- 数据源 ID
    started_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at       TIMESTAMP,                       -- 完成时间
    status             VARCHAR(20) NOT NULL,            -- 状态
    total_assets       INTEGER DEFAULT 0,               -- 总资产数
    total_records      INTEGER DEFAULT 0,               -- 总记录数
    success_count      INTEGER DEFAULT 0,               -- 成功数
    failed_count       INTEGER DEFAULT 0,               -- 失败数
    skipped_count      INTEGER DEFAULT 0,               -- 跳过数
    duration_seconds   INTEGER,                         -- 耗时（秒）
    result_summary     JSONB,                           -- 结果摘要
    error_message      TEXT,                            -- 错误信息
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES finapp.price_sync_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (data_source_id) REFERENCES finapp.price_data_sources(id) ON DELETE SET NULL
);
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | UUID | 主键 | `46d300a7-...` |
| `task_id` | UUID | 任务 ID | 关联 `price_sync_tasks.id` |
| `data_source_id` | UUID | 数据源 ID | 关联 `price_data_sources.id` |
| `started_at` | TIMESTAMP | 开始时间 | "2025-10-27 10:30:00" |
| `completed_at` | TIMESTAMP | 完成时间 | "2025-10-27 10:30:15" |
| `status` | VARCHAR(20) | 状态 | "success" / "failed" / "running" / "partial" |
| `total_assets` | INTEGER | 总资产数 | 10 |
| `total_records` | INTEGER | 总记录数 | 100 |
| `success_count` | INTEGER | 成功数 | 95 |
| `failed_count` | INTEGER | 失败数 | 5 |
| `skipped_count` | INTEGER | 跳过数 | 0 |
| `duration_seconds` | INTEGER | 耗时（秒） | 15 |
| `result_summary` | JSONB | 结果摘要 | `{"assets_processed": [...]}` |
| `error_message` | TEXT | 错误信息 | "Rate limit exceeded" |

### 状态值

```sql
CHECK (status IN (
    'running',     -- 运行中
    'success',     -- 成功
    'failed',      -- 失败
    'partial'      -- 部分成功
))
```

### 查询示例

```sql
-- 查看最近的同步日志
SELECT 
    l.id,
    t.name as task_name,
    ds.name as data_source,
    l.started_at,
    l.status,
    l.total_assets,
    l.total_records,
    l.success_count,
    l.failed_count,
    l.duration_seconds
FROM finapp.price_sync_logs l
LEFT JOIN finapp.price_sync_tasks t ON l.task_id = t.id
LEFT JOIN finapp.price_data_sources ds ON l.data_source_id = ds.id
ORDER BY l.started_at DESC
LIMIT 10;

-- 统计同步成功率
SELECT 
    DATE(started_at) as date,
    COUNT(*) as total_syncs,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
    SUM(total_records) as total_records,
    ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM finapp.price_sync_logs
WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- 查看同步耗时统计
SELECT 
    ds.name as data_source,
    COUNT(*) as sync_count,
    AVG(l.duration_seconds) as avg_duration,
    MIN(l.duration_seconds) as min_duration,
    MAX(l.duration_seconds) as max_duration,
    AVG(l.total_records) as avg_records
FROM finapp.price_sync_logs l
JOIN finapp.price_data_sources ds ON l.data_source_id = ds.id
WHERE l.status = 'success'
  AND l.started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ds.id, ds.name;
```

---

## 4️⃣ price_sync_errors（同步错误表）

### 表结构

```sql
CREATE TABLE finapp.price_sync_errors (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id         UUID NOT NULL,                   -- 日志 ID
    asset_id       UUID,                            -- 资产 ID
    asset_symbol   VARCHAR(50),                     -- 资产代码
    error_type     VARCHAR(50),                     -- 错误类型
    error_message  TEXT NOT NULL,                   -- 错误信息
    error_details  JSONB,                           -- 错误详情
    occurred_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (log_id) REFERENCES finapp.price_sync_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES finapp.assets(id) ON DELETE SET NULL
);
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | UUID | 主键 | `e1f2g3h4-...` |
| `log_id` | UUID | 日志 ID | 关联 `price_sync_logs.id` |
| `asset_id` | UUID | 资产 ID | 关联 `assets.id` |
| `asset_symbol` | VARCHAR(50) | 资产代码 | "00700.HK" |
| `error_type` | VARCHAR(50) | 错误类型 | "api_limit" / "network" / "parse" |
| `error_message` | TEXT | 错误信息 | "Rate limit exceeded" |
| `error_details` | JSONB | 错误详情 | `{"status": 429, "response": "..."}` |
| `occurred_at` | TIMESTAMP | 发生时间 | "2025-10-27 10:30:05" |

### 错误类型

```sql
CHECK (error_type IN (
    'network',      -- 网络错误
    'parse',        -- 解析错误
    'validation',   -- 验证错误
    'api_limit',    -- API 限流
    'other'         -- 其他错误
))
```

### 查询示例

```sql
-- 查看某次同步的所有错误
SELECT 
    e.asset_symbol,
    e.error_type,
    e.error_message,
    e.occurred_at
FROM finapp.price_sync_errors e
WHERE e.log_id = '46d300a7-65f4-4049-97ab-f5340efc5cd8'
ORDER BY e.occurred_at;

-- 统计错误类型分布
SELECT 
    error_type,
    COUNT(*) as error_count,
    COUNT(DISTINCT asset_id) as affected_assets
FROM finapp.price_sync_errors
WHERE occurred_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY error_type
ORDER BY error_count DESC;

-- 查看最常出错的资产
SELECT 
    a.symbol,
    a.name,
    COUNT(*) as error_count,
    array_agg(DISTINCT e.error_type) as error_types,
    MAX(e.occurred_at) as last_error
FROM finapp.price_sync_errors e
JOIN finapp.assets a ON e.asset_id = a.id
WHERE e.occurred_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY a.id, a.symbol, a.name
HAVING COUNT(*) > 5
ORDER BY error_count DESC;
```

---

## 🔗 表关系图

```
price_data_sources (数据源配置)
    ↓ (1:N)
price_sync_tasks (同步任务)
    ↓ (1:N)
price_sync_logs (同步日志) ← 主要日志表
    ↓ (1:N)
price_sync_errors (错误详情)
```

### 关系说明

1. **一个数据源** 可以有 **多个同步任务**
2. **一个任务** 可以有 **多次执行日志**
3. **一次执行** 可以有 **多个错误记录**

---

## 📈 常用查询场景

### 场景 1: 查看完整的同步历史

```sql
SELECT 
    l.started_at,
    t.name as task_name,
    ds.name as data_source,
    l.status,
    l.total_assets,
    l.total_records,
    l.success_count,
    l.failed_count,
    l.duration_seconds,
    (SELECT COUNT(*) FROM finapp.price_sync_errors WHERE log_id = l.id) as error_count
FROM finapp.price_sync_logs l
LEFT JOIN finapp.price_sync_tasks t ON l.task_id = t.id
LEFT JOIN finapp.price_data_sources ds ON l.data_source_id = ds.id
ORDER BY l.started_at DESC
LIMIT 20;
```

### 场景 2: 诊断同步失败原因

```sql
-- 查看失败的同步及其错误
SELECT 
    l.id as log_id,
    l.started_at,
    t.name as task_name,
    l.error_message as log_error,
    json_agg(
        json_build_object(
            'asset', e.asset_symbol,
            'type', e.error_type,
            'message', e.error_message
        )
    ) as errors
FROM finapp.price_sync_logs l
LEFT JOIN finapp.price_sync_tasks t ON l.task_id = t.id
LEFT JOIN finapp.price_sync_errors e ON e.log_id = l.id
WHERE l.status = 'failed'
  AND l.started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY l.id, l.started_at, t.name, l.error_message
ORDER BY l.started_at DESC;
```

### 场景 3: 监控数据源健康状态

```sql
SELECT 
    ds.name,
    ds.provider,
    ds.is_active,
    ds.last_sync_status,
    ds.last_sync_at,
    COUNT(l.id) as total_syncs_24h,
    SUM(CASE WHEN l.status = 'success' THEN 1 ELSE 0 END) as success_count_24h,
    SUM(CASE WHEN l.status = 'failed' THEN 1 ELSE 0 END) as failed_count_24h,
    (SELECT COUNT(*) FROM finapp.price_sync_errors e 
     JOIN finapp.price_sync_logs l2 ON e.log_id = l2.id 
     WHERE l2.data_source_id = ds.id 
       AND e.error_type = 'api_limit'
       AND e.occurred_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as rate_limit_errors_24h
FROM finapp.price_data_sources ds
LEFT JOIN finapp.price_sync_logs l ON ds.id = l.data_source_id 
    AND l.started_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY ds.id, ds.name, ds.provider, ds.is_active, ds.last_sync_status, ds.last_sync_at
ORDER BY ds.name;
```

### 场景 4: 分析同步性能

```sql
SELECT 
    ds.name as data_source,
    DATE_TRUNC('hour', l.started_at) as hour,
    COUNT(*) as sync_count,
    AVG(l.duration_seconds) as avg_duration,
    AVG(l.total_records) as avg_records,
    AVG(l.total_records::float / NULLIF(l.duration_seconds, 0)) as avg_records_per_second
FROM finapp.price_sync_logs l
JOIN finapp.price_data_sources ds ON l.data_source_id = ds.id
WHERE l.status = 'success'
  AND l.started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY ds.id, ds.name, DATE_TRUNC('hour', l.started_at)
ORDER BY hour DESC, ds.name;
```

---

## 🎯 关键指标

### 同步成功率

```sql
SELECT 
    ROUND(100.0 * 
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / 
        COUNT(*), 2
    ) as success_rate_percent
FROM finapp.price_sync_logs
WHERE started_at >= CURRENT_DATE - INTERVAL '7 days';
```

### 平均同步时间

```sql
SELECT 
    AVG(duration_seconds) as avg_duration_seconds,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_seconds) as median_duration,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_seconds) as p95_duration
FROM finapp.price_sync_logs
WHERE status = 'success'
  AND started_at >= CURRENT_DATE - INTERVAL '7 days';
```

### 限流错误频率

```sql
SELECT 
    DATE(occurred_at) as date,
    COUNT(*) as rate_limit_errors
FROM finapp.price_sync_errors
WHERE error_type = 'api_limit'
  AND occurred_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(occurred_at)
ORDER BY date DESC;
```

---

## 📝 数据保留策略

### 建议的清理策略

```sql
-- 清理 90 天前的成功日志（保留失败日志）
DELETE FROM finapp.price_sync_logs
WHERE status = 'success'
  AND started_at < CURRENT_DATE - INTERVAL '90 days';

-- 清理 180 天前的所有日志
DELETE FROM finapp.price_sync_logs
WHERE started_at < CURRENT_DATE - INTERVAL '180 days';

-- 错误记录会通过外键级联删除
```

---

**创建时间**: 2025-10-27  
**最后更新**: 2025-10-27  
**维护人员**: 开发团队  
**版本**: v1.0
