-- 创建数据源覆盖范围分析视图
-- 用于快速查询和分析各数据源支持的产品和市场

-- 视图1: 数据源产品覆盖范围
CREATE OR REPLACE VIEW v_data_source_product_coverage AS
SELECT 
  ds.id,
  ds.name,
  ds.provider,
  ds.is_active,
  jsonb_array_elements_text(ds.config -> 'supports_products') as product_type
FROM finapp.price_data_sources ds
WHERE ds.config -> 'supports_products' IS NOT NULL
ORDER BY ds.name, product_type;

-- 视图2: 数据源市场覆盖范围
CREATE OR REPLACE VIEW v_data_source_market_coverage AS
SELECT 
  ds.id,
  ds.name,
  ds.provider,
  ds.is_active,
  jsonb_array_elements_text(ds.config -> 'supports_markets') as market_code,
  m.name as market_name,
  m.country,
  m.currency
FROM finapp.price_data_sources ds
LEFT JOIN LATERAL jsonb_array_elements_text(ds.config -> 'supports_markets') AS market_code ON true
LEFT JOIN finapp.markets m ON m.code = market_code
WHERE ds.config -> 'supports_markets' IS NOT NULL
ORDER BY ds.name, market_code;

-- 视图3: 按产品类型统计数据源
CREATE OR REPLACE VIEW v_product_type_source_count AS
SELECT 
  COALESCE(pct.product_type, 'UNKNOWN') as product_type,
  COUNT(DISTINCT pct.id) as source_count,
  STRING_AGG(DISTINCT pct.name, ', ' ORDER BY pct.name) as source_names,
  MAX(CASE WHEN pct.is_active THEN 1 ELSE 0 END) > 0 as has_active_source
FROM v_data_source_product_coverage pct
GROUP BY pct.product_type
ORDER BY source_count DESC, product_type;

-- 视图4: 按市场统计数据源
CREATE OR REPLACE VIEW v_market_source_count AS
SELECT 
  market_code,
  market_name,
  country,
  currency,
  COUNT(DISTINCT id) as source_count,
  STRING_AGG(DISTINCT name, ', ' ORDER BY name) as source_names,
  MAX(CASE WHEN is_active THEN 1 ELSE 0 END) > 0 as has_active_source
FROM v_data_source_market_coverage
GROUP BY market_code, market_name, country, currency
ORDER BY source_count DESC, market_code;

-- 视图5: 数据源完整配置视图
CREATE OR REPLACE VIEW v_data_source_config AS
SELECT 
  ds.id,
  ds.name,
  ds.provider,
  ds.is_active,
  ds.api_endpoint,
  CASE WHEN ds.api_key_encrypted IS NOT NULL THEN '已配置' ELSE '未配置' END as api_key_status,
  ds.rate_limit,
  ds.timeout_seconds,
  ds.config -> 'description' as description,
  ds.config -> 'requires_api_key' as requires_api_key,
  ds.config -> 'free_plan' as free_plan,
  ds.config -> 'features' as features,
  ds.last_sync_at,
  ds.last_sync_status,
  COALESCE(ds.last_error_message, '无') as last_error_message,
  ds.created_at,
  ds.updated_at
FROM finapp.price_data_sources ds
ORDER BY ds.created_at DESC;

-- 视图6: 数据源简洁对比表
CREATE OR REPLACE VIEW v_data_source_comparison AS
SELECT 
  ds.name,
  ds.provider,
  CASE WHEN ds.is_active THEN '✅ 激活' ELSE '❌ 未激活' END as status,
  CASE WHEN ds.api_key_encrypted IS NOT NULL THEN '已配置' ELSE '未配置' END as api_key,
  ds.rate_limit as rate_limit_per_minute,
  ds.config ->> 'free_plan' as free_plan,
  ds.config ->> 'requires_api_key' as requires_api_key,
  (SELECT COUNT(*) FROM v_data_source_product_coverage WHERE id = ds.id) as product_count,
  (SELECT COUNT(*) FROM v_data_source_market_coverage WHERE id = ds.id) as market_count,
  ds.last_sync_at,
  ds.last_sync_status
FROM finapp.price_data_sources ds
ORDER BY ds.is_active DESC, ds.name;

-- 验证视图创建
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'finapp' 
  AND table_type = 'VIEW' 
  AND table_name LIKE 'v_data_source%'
ORDER BY table_name;
