-- =====================================================
-- Currency 不一致修复脚本
-- =====================================================
-- 问题: Position和Transaction表中的currency与Asset表不一致
-- 影响: 6个资产，7个持仓，多条交易记录
-- 
-- 修复策略:
-- 1. 不能简单修改currency字段
-- 2. 需要根据交易记录重新计算持仓的成本
-- 3. 交易记录的price和total_amount已经是正确币种的值（只是currency字段标记错了）
-- =====================================================

BEGIN;

-- 创建临时表记录修复前的数据
CREATE TEMP TABLE currency_fix_backup AS
SELECT 
    p.id as position_id,
    p.asset_id,
    a.symbol,
    a.name,
    a.currency as asset_currency,
    p.currency as old_position_currency,
    p.quantity as old_quantity,
    p.average_cost as old_average_cost,
    p.total_cost as old_total_cost,
    p.updated_at as old_updated_at
FROM finapp.positions p
JOIN finapp.assets a ON p.asset_id = a.id
WHERE p.currency != a.currency;

-- 显示备份数据
SELECT '=== 修复前的数据备份 ===' as info;
SELECT * FROM currency_fix_backup ORDER BY symbol;

-- =====================================================
-- 步骤1: 修复 Transactions 表的 currency 字段
-- =====================================================
SELECT '=== 步骤1: 修复交易记录的currency ===' as info;

-- 00700 - 腾讯控股 (HKD)
UPDATE finapp.transactions t
SET currency = 'HKD'
FROM finapp.assets a
WHERE t.asset_id = a.id
  AND a.symbol = '00700'
  AND t.currency = 'CNY';

-- 03690 - 美团-W (HKD)
UPDATE finapp.transactions t
SET currency = 'HKD'
FROM finapp.assets a
WHERE t.asset_id = a.id
  AND a.symbol = '03690'
  AND t.currency = 'CNY';

-- 06186 - 中国飞鹤 (HKD)
UPDATE finapp.transactions t
SET currency = 'HKD'
FROM finapp.assets a
WHERE t.asset_id = a.id
  AND a.symbol = '06186'
  AND t.currency = 'CNY';

-- 09618 - 京东集团 (HKD)
UPDATE finapp.transactions t
SET currency = 'HKD'
FROM finapp.assets a
WHERE t.asset_id = a.id
  AND a.symbol = '09618'
  AND t.currency = 'CNY';

-- BILI - 哔哩哔哩 (USD)
UPDATE finapp.transactions t
SET currency = 'USD'
FROM finapp.assets a
WHERE t.asset_id = a.id
  AND a.symbol = 'BILI'
  AND t.currency = 'CNY';

-- T-OPTION-OFFER-7851 - 员工期权 (HKD)
UPDATE finapp.transactions t
SET currency = 'HKD'
FROM finapp.assets a
WHERE t.asset_id = a.id
  AND a.symbol = 'T-OPTION-OFFER-7851'
  AND t.currency = 'CNY';

SELECT '交易记录currency修复完成' as status;

-- =====================================================
-- 步骤2: 修复 Positions 表的 currency 字段
-- 注意: average_cost 和 total_cost 的值本身是正确的（只是currency标记错了）
-- =====================================================
SELECT '=== 步骤2: 修复持仓记录的currency ===' as info;

UPDATE finapp.positions p
SET 
    currency = a.currency,
    updated_at = CURRENT_TIMESTAMP
FROM finapp.assets a
WHERE p.asset_id = a.id
  AND p.currency != a.currency;

SELECT '持仓记录currency修复完成' as status;

-- =====================================================
-- 步骤3: 验证修复结果
-- =====================================================
SELECT '=== 步骤3: 验证修复结果 ===' as info;

-- 检查是否还有不一致的记录
SELECT 
    COUNT(*) as remaining_inconsistencies,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 所有持仓currency已一致'
        ELSE '❌ 仍有不一致的记录'
    END as status
FROM finapp.positions p
JOIN finapp.assets a ON p.asset_id = a.id
WHERE p.currency != a.currency;

-- 显示修复后的数据
SELECT '=== 修复后的持仓数据 ===' as info;
SELECT 
    a.symbol,
    a.name,
    a.currency as asset_currency,
    p.currency as position_currency,
    p.quantity,
    p.average_cost,
    p.total_cost,
    '✅' as status
FROM finapp.positions p
JOIN finapp.assets a ON p.asset_id = a.id
WHERE p.id IN (SELECT position_id FROM currency_fix_backup)
ORDER BY a.symbol;

-- 对比修复前后
SELECT '=== 修复前后对比 ===' as info;
SELECT 
    b.symbol,
    b.name,
    b.old_position_currency as before_currency,
    p.currency as after_currency,
    b.old_quantity as before_quantity,
    p.quantity as after_quantity,
    b.old_average_cost as before_avg_cost,
    p.average_cost as after_avg_cost,
    b.old_total_cost as before_total_cost,
    p.total_cost as after_total_cost,
    CASE 
        WHEN b.old_quantity = p.quantity 
         AND b.old_average_cost = p.average_cost 
         AND b.old_total_cost = p.total_cost 
        THEN '✅ 数值未变，仅currency修正'
        ELSE '⚠️ 数值有变化'
    END as change_status
FROM currency_fix_backup b
JOIN finapp.positions p ON b.position_id = p.id
ORDER BY b.symbol;

-- 检查交易记录的currency
SELECT '=== 交易记录currency验证 ===' as info;
SELECT 
    a.symbol,
    a.currency as asset_currency,
    t.currency as transaction_currency,
    COUNT(*) as transaction_count,
    CASE 
        WHEN a.currency = t.currency THEN '✅'
        ELSE '❌'
    END as status
FROM finapp.transactions t
JOIN finapp.assets a ON t.asset_id = a.id
WHERE a.symbol IN ('00700', '03690', '06186', '09618', 'BILI', 'T-OPTION-OFFER-7851')
GROUP BY a.symbol, a.currency, t.currency
ORDER BY a.symbol, t.currency;

COMMIT;

-- =====================================================
-- 如果需要回滚，运行以下命令:
-- ROLLBACK;
-- =====================================================

SELECT '=== 修复完成 ===' as info;
SELECT 'Currency不一致问题已修复，所有持仓和交易记录的currency现在与资产表一致' as message;
