-- 修复同步日志的时区问题
-- 这个脚本应该在 PostgreSQL 数据库中执行

-- 首先备份当前数据
CREATE TABLE IF NOT EXISTS finapp.price_sync_logs_backup AS 
SELECT * FROM finapp.price_sync_logs;

-- 修改表结构，设置正确的时区
ALTER TABLE finapp.price_sync_logs 
ALTER COLUMN started_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::timestamp without time zone;

-- 更新现有记录，将 UTC 时间转换为本地时间（UTC+8）
-- 注意：这只在 started_at 列没有时区信息的情况下需要
-- 如果列本身就是 TIMESTAMP WITH TIME ZONE 类型，则不需要这一步

-- 验证修改
SELECT column_name, column_default, data_type 
FROM information_schema.columns 
WHERE table_schema = 'finapp' 
  AND table_name = 'price_sync_logs' 
  AND column_name IN ('started_at', 'completed_at');
