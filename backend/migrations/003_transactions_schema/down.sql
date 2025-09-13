-- 删除触发器
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS calculate_transactions_total ON transactions;

-- 删除函数
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS calculate_transaction_total();

-- 删除表（按依赖关系逆序删除）
DROP TABLE IF EXISTS transaction_tag_mappings;
DROP TABLE IF EXISTS transaction_tags;
DROP TABLE IF EXISTS cash_flows;
DROP TABLE IF EXISTS transactions;