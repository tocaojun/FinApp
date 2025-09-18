import React, { useState } from 'react';
import { Badge, Button, Dropdown, List, Typography, Empty, Divider } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: '交易提醒',
      content: '您的苹果股票交易已成功执行',
      type: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
      read: false,
    },
    {
      id: '2',
      title: '价格警报',
      content: '特斯拉股价已达到您设置的目标价格',
      type: 'warning',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
      read: false,
    },
    {
      id: '3',
      title: '系统通知',
      content: '您的投资组合月度报告已生成',
      type: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return `${days}天前`;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return '#52c41a';
      case 'warning': return '#faad14';
      case 'error': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  const notificationContent = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Text strong>通知中心</Text>
        <div>
          {unreadCount > 0 && (
            <Button 
              type="link" 
              size="small" 
              onClick={markAllAsRead}
              style={{ padding: 0, marginRight: 8 }}
            >
              全部已读
            </Button>
          )}
          <Button 
            type="link" 
            size="small" 
            onClick={clearAll}
            style={{ padding: 0 }}
            danger
          >
            清空
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: 20 }}>
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知"
          />
        </div>
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px 16px',
                backgroundColor: item.read ? 'transparent' : '#f6ffed',
                borderLeft: `3px solid ${getTypeColor(item.type)}`,
              }}
              actions={[
                !item.read && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => markAsRead(item.id)}
                  />
                ),
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => deleteNotification(item.id)}
                  danger
                />
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong={!item.read}>{item.title}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </div>
                }
                description={
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {item.content}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={notificationContent}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ display: 'flex', alignItems: 'center' }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationCenter;