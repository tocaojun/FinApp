-- 007_user_tags_system.sql
-- 用户标签系统数据库结构

-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '标签名称',
    description TEXT NULL COMMENT '标签描述',
    color VARCHAR(7) DEFAULT '#1890ff' COMMENT '标签颜色（十六进制）',
    icon VARCHAR(50) NULL COMMENT '标签图标',
    user_id BIGINT NOT NULL COMMENT '创建用户ID',
    category_id BIGINT NULL COMMENT '标签分类ID',
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否为系统标签',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    usage_count INT DEFAULT 0 COMMENT '使用次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_user_tag_name (user_id, name),
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_name (name),
    INDEX idx_is_active (is_active),
    INDEX idx_usage_count (usage_count),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- 创建标签分类表
CREATE TABLE IF NOT EXISTS tag_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description TEXT NULL COMMENT '分类描述',
    color VARCHAR(7) DEFAULT '#52c41a' COMMENT '分类颜色',
    icon VARCHAR(50) NULL COMMENT '分类图标',
    user_id BIGINT NOT NULL COMMENT '创建用户ID',
    parent_id BIGINT NULL COMMENT '父分类ID',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_user_category_name (user_id, name),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES tag_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签分类表';

-- 添加外键约束到标签表
ALTER TABLE tags ADD CONSTRAINT fk_tags_category_id 
FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE SET NULL;

-- 创建投资组合标签关联表
CREATE TABLE IF NOT EXISTS portfolio_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id BIGINT NOT NULL COMMENT '投资组合ID',
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    created_by BIGINT NOT NULL COMMENT '创建用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    UNIQUE KEY uk_portfolio_tag (portfolio_id, tag_id),
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_tag_id (tag_id),
    INDEX idx_created_by (created_by),
    
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投资组合标签关联表';

-- 创建交易记录标签关联表
CREATE TABLE IF NOT EXISTS transaction_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL COMMENT '交易记录ID',
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    created_by BIGINT NOT NULL COMMENT '创建用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    UNIQUE KEY uk_transaction_tag (transaction_id, tag_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_tag_id (tag_id),
    INDEX idx_created_by (created_by),
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录标签关联表';

-- 创建资产标签关联表
CREATE TABLE IF NOT EXISTS asset_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    asset_id BIGINT NOT NULL COMMENT '资产ID',
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    created_by BIGINT NOT NULL COMMENT '创建用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    UNIQUE KEY uk_asset_tag (asset_id, tag_id),
    INDEX idx_asset_id (asset_id),
    INDEX idx_tag_id (tag_id),
    INDEX idx_created_by (created_by),
    
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产标签关联表';

-- 创建标签使用统计表
CREATE TABLE IF NOT EXISTS tag_usage_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    entity_type ENUM('portfolio', 'transaction', 'asset') NOT NULL COMMENT '实体类型',
    usage_date DATE NOT NULL COMMENT '使用日期',
    usage_count INT DEFAULT 1 COMMENT '使用次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_tag_user_entity_date (tag_id, user_id, entity_type, usage_date),
    INDEX idx_tag_id (tag_id),
    INDEX idx_user_id (user_id),
    INDEX idx_entity_type (entity_type),
    INDEX idx_usage_date (usage_date),
    
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签使用统计表';

-- 插入默认标签分类
INSERT INTO tag_categories (name, description, color, icon, user_id, sort_order) 
SELECT 
    '投资策略',
    '与投资策略相关的标签分类',
    '#1890ff',
    'strategy',
    u.id,
    1
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM tag_categories tc 
    WHERE tc.user_id = u.id AND tc.name = '投资策略'
);

INSERT INTO tag_categories (name, description, color, icon, user_id, sort_order) 
SELECT 
    '风险等级',
    '风险等级相关的标签分类',
    '#fa8c16',
    'warning',
    u.id,
    2
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM tag_categories tc 
    WHERE tc.user_id = u.id AND tc.name = '风险等级'
);

INSERT INTO tag_categories (name, description, color, icon, user_id, sort_order) 
SELECT 
    '行业板块',
    '行业和板块相关的标签分类',
    '#52c41a',
    'apartment',
    u.id,
    3
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM tag_categories tc 
    WHERE tc.user_id = u.id AND tc.name = '行业板块'
);

INSERT INTO tag_categories (name, description, color, icon, user_id, sort_order) 
SELECT 
    '地区市场',
    '地区和市场相关的标签分类',
    '#722ed1',
    'global',
    u.id,
    4
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM tag_categories tc 
    WHERE tc.user_id = u.id AND tc.name = '地区市场'
);

-- 插入默认系统标签
INSERT INTO tags (name, description, color, icon, user_id, category_id, is_system) 
SELECT 
    '长期投资',
    '适合长期持有的投资',
    '#1890ff',
    'clock-circle',
    u.id,
    tc.id,
    TRUE
FROM users u
JOIN tag_categories tc ON tc.user_id = u.id AND tc.name = '投资策略'
WHERE NOT EXISTS (
    SELECT 1 FROM tags t 
    WHERE t.user_id = u.id AND t.name = '长期投资'
);

INSERT INTO tags (name, description, color, icon, user_id, category_id, is_system) 
SELECT 
    '短期交易',
    '短期交易和投机',
    '#fa541c',
    'thunderbolt',
    u.id,
    tc.id,
    TRUE
FROM users u
JOIN tag_categories tc ON tc.user_id = u.id AND tc.name = '投资策略'
WHERE NOT EXISTS (
    SELECT 1 FROM tags t 
    WHERE t.user_id = u.id AND t.name = '短期交易'
);

INSERT INTO tags (name, description, color, icon, user_id, category_id, is_system) 
SELECT 
    '价值投资',
    '基于价值分析的投资',
    '#52c41a',
    'rise',
    u.id,
    tc.id,
    TRUE
FROM users u
JOIN tag_categories tc ON tc.user_id = u.id AND tc.name = '投资策略'
WHERE NOT EXISTS (
    SELECT 1 FROM tags t 
    WHERE t.user_id = u.id AND t.name = '价值投资'
);

INSERT INTO tags (name, description, color, icon, user_id, category_id, is_system) 
SELECT 
    '高风险',
    '高风险投资',
    '#ff4d4f',
    'exclamation-circle',
    u.id,
    tc.id,
    TRUE
FROM users u
JOIN tag_categories tc ON tc.user_id = u.id AND tc.name = '风险等级'
WHERE NOT EXISTS (
    SELECT 1 FROM tags t 
    WHERE t.user_id = u.id AND t.name = '高风险'
);

INSERT INTO tags (name, description, color, icon, user_id, category_id, is_system) 
SELECT 
    '中等风险',
    '中等风险投资',
    '#fa8c16',
    'info-circle',
    u.id,
    tc.id,
    TRUE
FROM users u
JOIN tag_categories tc ON tc.user_id = u.id AND tc.name = '风险等级'
WHERE NOT EXISTS (
    SELECT 1 FROM tags t 
    WHERE t.user_id = u.id AND t.name = '中等风险'
);

INSERT INTO tags (name, description, color, icon, user_id, category_id, is_system) 
SELECT 
    '低风险',
    '低风险稳健投资',
    '#52c41a',
    'check-circle',
    u.id,
    tc.id,
    TRUE
FROM users u
JOIN tag_categories tc ON tc.user_id = u.id AND tc.name = '风险等级'
WHERE NOT EXISTS (
    SELECT 1 FROM tags t 
    WHERE t.user_id = u.id AND t.name = '低风险'
);

-- 创建触发器：更新标签使用次数
DELIMITER //
CREATE TRIGGER tr_update_tag_usage_portfolio
AFTER INSERT ON portfolio_tags
FOR EACH ROW
BEGIN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    
    INSERT INTO tag_usage_stats (tag_id, user_id, entity_type, usage_date, usage_count)
    VALUES (NEW.tag_id, NEW.created_by, 'portfolio', CURDATE(), 1)
    ON DUPLICATE KEY UPDATE usage_count = usage_count + 1;
END//

CREATE TRIGGER tr_update_tag_usage_transaction
AFTER INSERT ON transaction_tags
FOR EACH ROW
BEGIN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    
    INSERT INTO tag_usage_stats (tag_id, user_id, entity_type, usage_date, usage_count)
    VALUES (NEW.tag_id, NEW.created_by, 'transaction', CURDATE(), 1)
    ON DUPLICATE KEY UPDATE usage_count = usage_count + 1;
END//

CREATE TRIGGER tr_update_tag_usage_asset
AFTER INSERT ON asset_tags
FOR EACH ROW
BEGIN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    
    INSERT INTO tag_usage_stats (tag_id, user_id, entity_type, usage_date, usage_count)
    VALUES (NEW.tag_id, NEW.created_by, 'asset', CURDATE(), 1)
    ON DUPLICATE KEY UPDATE usage_count = usage_count + 1;
END//

-- 减少使用次数的触发器
CREATE TRIGGER tr_decrease_tag_usage_portfolio
AFTER DELETE ON portfolio_tags
FOR EACH ROW
BEGIN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
END//

CREATE TRIGGER tr_decrease_tag_usage_transaction
AFTER DELETE ON transaction_tags
FOR EACH ROW
BEGIN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
END//

CREATE TRIGGER tr_decrease_tag_usage_asset
AFTER DELETE ON asset_tags
FOR EACH ROW
BEGIN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
END//
DELIMITER ;

-- 创建视图：用户标签统计
CREATE VIEW v_user_tag_stats AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT t.id) as total_tags,
    COUNT(DISTINCT tc.id) as total_categories,
    COUNT(DISTINCT pt.portfolio_id) as tagged_portfolios,
    COUNT(DISTINCT tt.transaction_id) as tagged_transactions,
    COUNT(DISTINCT at.asset_id) as tagged_assets,
    SUM(t.usage_count) as total_usage_count
FROM users u
LEFT JOIN tags t ON u.id = t.user_id AND t.is_active = TRUE
LEFT JOIN tag_categories tc ON u.id = tc.user_id AND tc.is_active = TRUE
LEFT JOIN portfolio_tags pt ON t.id = pt.tag_id
LEFT JOIN transaction_tags tt ON t.id = tt.tag_id
LEFT JOIN asset_tags at ON t.id = at.tag_id
GROUP BY u.id, u.username;

-- 创建视图：热门标签
CREATE VIEW v_popular_tags AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.color,
    t.icon,
    t.usage_count,
    tc.name as category_name,
    u.username as creator,
    COUNT(DISTINCT pt.portfolio_id) as portfolio_count,
    COUNT(DISTINCT tt.transaction_id) as transaction_count,
    COUNT(DISTINCT at.asset_id) as asset_count
FROM tags t
LEFT JOIN tag_categories tc ON t.category_id = tc.id
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN portfolio_tags pt ON t.id = pt.tag_id
LEFT JOIN transaction_tags tt ON t.id = tt.tag_id
LEFT JOIN asset_tags at ON t.id = at.tag_id
WHERE t.is_active = TRUE
GROUP BY t.id, t.name, t.description, t.color, t.icon, t.usage_count, tc.name, u.username
ORDER BY t.usage_count DESC;

-- 创建视图：标签分类树
CREATE VIEW v_tag_category_tree AS
SELECT 
    tc.id,
    tc.name,
    tc.description,
    tc.color,
    tc.icon,
    tc.user_id,
    tc.parent_id,
    tc.sort_order,
    parent.name as parent_name,
    COUNT(t.id) as tag_count,
    tc.created_at
FROM tag_categories tc
LEFT JOIN tag_categories parent ON tc.parent_id = parent.id
LEFT JOIN tags t ON tc.id = t.category_id AND t.is_active = TRUE
WHERE tc.is_active = TRUE
GROUP BY tc.id, tc.name, tc.description, tc.color, tc.icon, tc.user_id, 
         tc.parent_id, tc.sort_order, parent.name, tc.created_at
ORDER BY tc.sort_order, tc.name;