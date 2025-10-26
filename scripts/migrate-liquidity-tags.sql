-- 迁移脚本：将资产表中的流动性标签从硬编码值更新为UUID引用
-- 执行前请备份数据库！

-- 1. 首先查看当前的流动性标签
SELECT id, name, color FROM finapp.liquidity_tags ORDER BY name;

-- 2. 查看需要迁移的资产数量
SELECT liquidity_tag, COUNT(*) as count 
FROM finapp.assets 
GROUP BY liquidity_tag;

-- 3. 执行迁移
-- 将 'HIGH' 映射到 '高流动性'
UPDATE finapp.assets 
SET liquidity_tag = (SELECT id FROM finapp.liquidity_tags WHERE name = '高流动性' LIMIT 1)
WHERE liquidity_tag = 'HIGH';

-- 将 'MEDIUM' 映射到 '中等流动性'
UPDATE finapp.assets 
SET liquidity_tag = (SELECT id FROM finapp.liquidity_tags WHERE name = '中等流动性' LIMIT 1)
WHERE liquidity_tag = 'MEDIUM';

-- 将 'LOW' 映射到 '低流动性'
UPDATE finapp.assets 
SET liquidity_tag = (SELECT id FROM finapp.liquidity_tags WHERE name = '低流动性' LIMIT 1)
WHERE liquidity_tag = 'LOW';

-- 4. 验证迁移结果
SELECT 
    a.symbol,
    a.name,
    a.liquidity_tag,
    lt.name as liquidity_tag_name,
    lt.color
FROM finapp.assets a
LEFT JOIN finapp.liquidity_tags lt ON a.liquidity_tag = lt.id
LIMIT 10;

-- 5. 检查是否有未迁移的数据（liquidity_tag 不是有效的 UUID）
SELECT symbol, name, liquidity_tag
FROM finapp.assets
WHERE liquidity_tag NOT IN (SELECT id::text FROM finapp.liquidity_tags)
LIMIT 10;
