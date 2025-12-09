-- FinApp 生产环境数据库表结构修复脚本
-- 修复缺失的字段

\c finapp_production

-- 1. 检查并添加 price_data_sources.priority 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'finapp' 
        AND table_name = 'price_data_sources' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE finapp.price_data_sources 
        ADD COLUMN priority INTEGER DEFAULT 10;
        
        -- 设置默认优先级
        UPDATE finapp.price_data_sources 
        SET priority = CASE 
            WHEN provider = 'tiantian' THEN 1
            WHEN provider = 'sina' THEN 2
            WHEN provider = 'futu' THEN 3
            WHEN provider = 'binance' THEN 4
            WHEN provider = 'yahoo' THEN 5
            ELSE 10
        END;
        
        RAISE NOTICE '✅ 已添加 price_data_sources.priority 字段';
    ELSE
        RAISE NOTICE 'ℹ️  price_data_sources.priority 字段已存在';
    END IF;
END $$;

-- 2. 检查并添加 price_sync_tasks.schedule 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'finapp' 
        AND table_name = 'price_sync_tasks' 
        AND column_name = 'schedule'
    ) THEN
        ALTER TABLE finapp.price_sync_tasks 
        ADD COLUMN schedule VARCHAR(100);
        
        -- 设置默认调度（每小时）
        UPDATE finapp.price_sync_tasks 
        SET schedule = '0 */1 * * *'
        WHERE schedule IS NULL;
        
        RAISE NOTICE '✅ 已添加 price_sync_tasks.schedule 字段';
    ELSE
        RAISE NOTICE 'ℹ️  price_sync_tasks.schedule 字段已存在';
    END IF;
END $$;

-- 3. 验证修复结果
SELECT 
    'price_data_sources' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'finapp' 
    AND table_name = 'price_data_sources'
    AND column_name IN ('priority')
UNION ALL
SELECT 
    'price_sync_tasks' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'finapp' 
    AND table_name = 'price_sync_tasks'
    AND column_name IN ('schedule');

RAISE NOTICE '✅ 数据库表结构修复完成';
