-- 完整的流动性标签迁移脚本
-- 将 assets 表的 liquidity_tag 字段从硬编码值迁移到 UUID 引用
-- 执行前请备份数据库！

BEGIN;

-- 1. 查看当前状态
SELECT '=== 当前流动性标签 ===' as info;
SELECT id, name, color FROM finapp.liquidity_tags ORDER BY name;

SELECT '=== 迁移前的资产统计 ===' as info;
SELECT liquidity_tag, COUNT(*) as count 
FROM finapp.assets 
GROUP BY liquidity_tag;

-- 2. 添加临时列存储新的 UUID 值
ALTER TABLE finapp.assets ADD COLUMN liquidity_tag_new UUID;

-- 3. 迁移数据
UPDATE finapp.assets 
SET liquidity_tag_new = (SELECT id FROM finapp.liquidity_tags WHERE name = '高流动性' LIMIT 1)
WHERE liquidity_tag = 'HIGH';

UPDATE finapp.assets 
SET liquidity_tag_new = (SELECT id FROM finapp.liquidity_tags WHERE name = '中等流动性' LIMIT 1)
WHERE liquidity_tag = 'MEDIUM';

UPDATE finapp.assets 
SET liquidity_tag_new = (SELECT id FROM finapp.liquidity_tags WHERE name = '低流动性' LIMIT 1)
WHERE liquidity_tag = 'LOW';

-- 4. 删除旧列，重命名新列
ALTER TABLE finapp.assets DROP COLUMN liquidity_tag;
ALTER TABLE finapp.assets RENAME COLUMN liquidity_tag_new TO liquidity_tag;

-- 5. 添加外键约束
ALTER TABLE finapp.assets 
ADD CONSTRAINT fk_assets_liquidity_tag 
FOREIGN KEY (liquidity_tag) 
REFERENCES finapp.liquidity_tags(id);

-- 6. 验证迁移结果
SELECT '=== 迁移后的验证 ===' as info;
SELECT 
    a.symbol,
    a.name,
    lt.name as liquidity_tag_name,
    lt.color
FROM finapp.assets a
LEFT JOIN finapp.liquidity_tags lt ON a.liquidity_tag = lt.id
LIMIT 10;

SELECT '=== 迁移后的统计 ===' as info;
SELECT 
    lt.name as liquidity_tag,
    COUNT(*) as count
FROM finapp.assets a
LEFT JOIN finapp.liquidity_tags lt ON a.liquidity_tag = lt.id
GROUP BY lt.name
ORDER BY lt.name;

COMMIT;

SELECT '=== 迁移完成！===' as info;
