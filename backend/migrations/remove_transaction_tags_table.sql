-- 移除 transaction_tags 表设计，使用 tags 表统一管理标签
-- 每个交易可以在每个分类中选择一个标签

BEGIN;

-- 1. 删除旧的 transaction_tag_mappings 表（因为它引用了 transaction_tags）
DROP TABLE IF EXISTS finapp.transaction_tag_mappings CASCADE;

-- 2. 删除 transaction_tags 表
DROP TABLE IF EXISTS finapp.transaction_tags CASCADE;

-- 3. 创建新的 transaction_tag_mappings 表
-- 引用 tags 表（integer），并添加唯一约束确保每个交易在每个分类中只能选一个标签
CREATE TABLE finapp.transaction_tag_mappings (
    transaction_id uuid NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (transaction_id, tag_id),
    
    -- 外键约束
    CONSTRAINT transaction_tag_mappings_transaction_id_fkey 
        FOREIGN KEY (transaction_id) 
        REFERENCES finapp.transactions(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT transaction_tag_mappings_tag_id_fkey 
        FOREIGN KEY (tag_id) 
        REFERENCES finapp.tags(id) 
        ON DELETE CASCADE
);

-- 4. 创建函数来获取标签的分类ID
CREATE OR REPLACE FUNCTION finapp.get_tag_category_id(tag_id_param integer)
RETURNS integer AS $$
    SELECT category_id FROM finapp.tags WHERE id = tag_id_param;
$$ LANGUAGE SQL IMMUTABLE;

-- 5. 添加唯一约束：每个交易在每个分类中只能选一个标签
CREATE UNIQUE INDEX idx_transaction_category_unique 
    ON finapp.transaction_tag_mappings (transaction_id, finapp.get_tag_category_id(tag_id))
    WHERE finapp.get_tag_category_id(tag_id) IS NOT NULL;

-- 6. 创建索引以提高查询性能
CREATE INDEX idx_transaction_tag_mappings_transaction_id 
    ON finapp.transaction_tag_mappings(transaction_id);

CREATE INDEX idx_transaction_tag_mappings_tag_id 
    ON finapp.transaction_tag_mappings(tag_id);

-- 7. 添加注释
COMMENT ON TABLE finapp.transaction_tag_mappings IS '交易标签映射表：每个交易可以在每个分类中选择一个标签';
COMMENT ON COLUMN finapp.transaction_tag_mappings.transaction_id IS '交易ID';
COMMENT ON COLUMN finapp.transaction_tag_mappings.tag_id IS '标签ID（引用tags表）';
COMMENT ON COLUMN finapp.transaction_tag_mappings.created_at IS '创建时间';

COMMIT;
