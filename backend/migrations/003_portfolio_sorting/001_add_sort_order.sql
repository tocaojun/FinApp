-- 添加投资组合排序字段
-- Migration: 003_portfolio_sorting/001_add_sort_order.sql

-- 添加 sort_order 字段到 portfolios 表
ALTER TABLE portfolios 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- 为现有投资组合设置排序值（按创建时间顺序）
UPDATE portfolios 
SET sort_order = subquery.row_number 
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_number
    FROM portfolios
) AS subquery 
WHERE portfolios.id = subquery.id;

-- 创建索引以提高排序查询性能
CREATE INDEX idx_portfolios_user_sort ON portfolios(user_id, sort_order);

-- 添加注释
COMMENT ON COLUMN portfolios.sort_order IS '投资组合排序顺序，数值越小排序越靠前';