-- PostgreSQL版本的用户标签系统

-- 创建标签分类表
CREATE TABLE IF NOT EXISTS tag_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#52c41a',
    icon VARCHAR(50),
    user_id UUID NOT NULL,
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES tag_categories(id) ON DELETE SET NULL
);

-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1890ff',
    icon VARCHAR(50),
    user_id UUID NOT NULL,
    category_id INTEGER,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE SET NULL
);

-- 创建投资组合标签关联表
CREATE TABLE IF NOT EXISTS portfolio_tags (
    id SERIAL PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    tag_id INTEGER NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(portfolio_id, tag_id),
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 插入默认数据
INSERT INTO tag_categories (name, description, color, user_id, sort_order) 
SELECT '投资策略', '与投资策略相关的标签分类', '#1890ff', id, 1
FROM users 
WHERE NOT EXISTS (SELECT 1 FROM tag_categories WHERE user_id = users.id AND name = '投资策略');

INSERT INTO tag_categories (name, description, color, user_id, sort_order) 
SELECT '风险等级', '风险等级相关的标签分类', '#fa8c16', id, 2
FROM users 
WHERE NOT EXISTS (SELECT 1 FROM tag_categories WHERE user_id = users.id AND name = '风险等级');

-- 插入默认标签
INSERT INTO tags (name, description, color, user_id, category_id, is_system) 
SELECT '长期投资', '适合长期持有的投资', '#1890ff', u.id, tc.id, TRUE
FROM users u
JOIN tag_categories tc ON tc.user_id = u.id AND tc.name = '投资策略'
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE user_id = u.id AND name = '长期投资');

INSERT INTO tags (name, description, color, user_id, category_id, is_system) 
SELECT '高风险', '高风险投资', '#ff4d4f', u.id, tc.id, TRUE
FROM users u
JOIN tag_categories tc ON tc.user_id = u.id AND tc.name = '风险等级'
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE user_id = u.id AND name = '高风险');