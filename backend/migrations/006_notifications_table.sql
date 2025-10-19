-- 006_notifications_table.sql
-- 通知系统表结构

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL COMMENT '通知类型：system, rate_change, alert, info',
    title VARCHAR(255) NOT NULL COMMENT '通知标题',
    message TEXT NOT NULL COMMENT '通知内容',
    level ENUM('info', 'warning', 'error', 'success') DEFAULT 'info' COMMENT '通知级别',
    user_id BIGINT NULL COMMENT '用户ID，NULL表示系统通知',
    metadata JSON NULL COMMENT '附加数据',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_user_unread (user_id, is_read),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- 创建通知订阅表（用户可以订阅特定类型的通知）
CREATE TABLE IF NOT EXISTS notification_subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    notification_type VARCHAR(50) NOT NULL COMMENT '通知类型',
    is_enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    settings JSON NULL COMMENT '订阅设置',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_user_type (user_id, notification_type),
    INDEX idx_user_id (user_id),
    INDEX idx_type (notification_type),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知订阅表';

-- 插入默认通知订阅设置
INSERT INTO notification_subscriptions (user_id, notification_type, is_enabled, settings)
SELECT 
    u.id,
    'rate_change',
    TRUE,
    JSON_OBJECT(
        'threshold', 2.0,
        'currencies', JSON_ARRAY('USD', 'EUR', 'GBP', 'JPY'),
        'frequency', 'immediate'
    )
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notification_subscriptions ns 
    WHERE ns.user_id = u.id AND ns.notification_type = 'rate_change'
);

INSERT INTO notification_subscriptions (user_id, notification_type, is_enabled, settings)
SELECT 
    u.id,
    'system',
    TRUE,
    JSON_OBJECT(
        'maintenance', TRUE,
        'updates', TRUE,
        'security', TRUE
    )
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notification_subscriptions ns 
    WHERE ns.user_id = u.id AND ns.notification_type = 'system'
);

-- 创建汇率监控配置表
CREATE TABLE IF NOT EXISTS exchange_rate_monitors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    from_currency VARCHAR(3) NOT NULL COMMENT '基础货币',
    to_currency VARCHAR(3) NOT NULL COMMENT '目标货币',
    threshold_percent DECIMAL(5,2) DEFAULT 2.00 COMMENT '变动阈值百分比',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活监控',
    last_notified_at TIMESTAMP NULL COMMENT '最后通知时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_user_currency_pair (user_id, from_currency, to_currency),
    INDEX idx_user_id (user_id),
    INDEX idx_currency_pair (from_currency, to_currency),
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='汇率监控配置表';

-- 插入默认汇率监控配置
INSERT INTO exchange_rate_monitors (user_id, from_currency, to_currency, threshold_percent)
SELECT 
    u.id,
    'USD',
    'CNY',
    2.00
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM exchange_rate_monitors erm 
    WHERE erm.user_id = u.id AND erm.from_currency = 'USD' AND erm.to_currency = 'CNY'
);

INSERT INTO exchange_rate_monitors (user_id, from_currency, to_currency, threshold_percent)
SELECT 
    u.id,
    'EUR',
    'USD',
    1.50
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM exchange_rate_monitors erm 
    WHERE erm.user_id = u.id AND erm.from_currency = 'EUR' AND erm.to_currency = 'USD'
);

-- 创建系统配置表（用于存储汇率更新配置等）
CREATE TABLE IF NOT EXISTS system_configurations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT NOT NULL COMMENT '配置值',
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT '配置类型',
    description TEXT NULL COMMENT '配置描述',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_config_key (config_key),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入默认系统配置
INSERT INTO system_configurations (config_key, config_value, config_type, description) VALUES
('exchange_rate_update_schedule', '0 */4 * * *', 'string', '汇率自动更新计划（cron表达式）'),
('exchange_rate_providers', '["exchangerate-api.com"]', 'json', '汇率数据提供商列表'),
('notification_retention_days', '30', 'number', '通知保留天数'),
('rate_change_threshold', '2.0', 'number', '汇率变动通知阈值（百分比）'),
('auto_cleanup_enabled', 'true', 'boolean', '是否启用自动清理过期数据'),
('system_maintenance_mode', 'false', 'boolean', '系统维护模式'),
('max_notifications_per_user', '1000', 'number', '每用户最大通知数量');

-- 创建数据更新日志表
CREATE TABLE IF NOT EXISTS data_update_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    update_type VARCHAR(50) NOT NULL COMMENT '更新类型：exchange_rate, asset_price, etc.',
    data_source VARCHAR(100) NOT NULL COMMENT '数据源',
    records_processed INT DEFAULT 0 COMMENT '处理记录数',
    records_success INT DEFAULT 0 COMMENT '成功记录数',
    records_failed INT DEFAULT 0 COMMENT '失败记录数',
    error_details TEXT NULL COMMENT '错误详情',
    started_at TIMESTAMP NOT NULL COMMENT '开始时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    status ENUM('running', 'completed', 'failed', 'cancelled') DEFAULT 'running' COMMENT '状态',
    
    INDEX idx_update_type (update_type),
    INDEX idx_data_source (data_source),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据更新日志表';

-- 创建触发器：自动清理过期通知
DELIMITER //
CREATE TRIGGER tr_cleanup_notifications
AFTER INSERT ON notifications
FOR EACH ROW
BEGIN
    -- 每插入100条通知后，清理过期通知
    IF (SELECT COUNT(*) FROM notifications) % 100 = 0 THEN
        DELETE FROM notifications 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND is_read = TRUE;
    END IF;
END//
DELIMITER ;

-- 插入初始系统通知
INSERT INTO notifications (type, title, message, level, metadata) VALUES
('system', '汇率管理系统初始化', '汇率管理系统已成功初始化，自动更新功能已启用。', 'success', 
 JSON_OBJECT('module', 'exchange_rate', 'action', 'initialization')),
('system', '通知系统启用', '通知系统已启用，您将收到重要的系统更新和汇率变动提醒。', 'info',
 JSON_OBJECT('module', 'notification', 'action', 'activation'));

-- 创建视图：用户通知统计
CREATE VIEW v_user_notification_stats AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(n.id) as total_notifications,
    SUM(CASE WHEN n.is_read = FALSE THEN 1 ELSE 0 END) as unread_count,
    SUM(CASE WHEN n.type = 'rate_change' THEN 1 ELSE 0 END) as rate_change_count,
    SUM(CASE WHEN n.type = 'system' THEN 1 ELSE 0 END) as system_count,
    MAX(n.created_at) as last_notification_at
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id OR n.user_id IS NULL
GROUP BY u.id, u.username;

-- 创建视图：汇率监控摘要
CREATE VIEW v_exchange_rate_monitor_summary AS
SELECT 
    erm.user_id,
    u.username,
    COUNT(erm.id) as monitored_pairs,
    SUM(CASE WHEN erm.is_active = TRUE THEN 1 ELSE 0 END) as active_monitors,
    GROUP_CONCAT(CONCAT(erm.from_currency, '/', erm.to_currency) SEPARATOR ', ') as currency_pairs
FROM exchange_rate_monitors erm
JOIN users u ON erm.user_id = u.id
GROUP BY erm.user_id, u.username;