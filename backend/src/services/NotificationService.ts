import { databaseService } from './DatabaseService';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface NotificationData {
  type: 'system' | 'rate_change' | 'alert' | 'info';
  title: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  metadata?: any;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  level: string;
  userId?: string;
  metadata?: any;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationService extends EventEmitter {
  private static instance: NotificationService;

  constructor() {
    super();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 发送系统通知
  async sendSystemNotification(data: NotificationData): Promise<Notification> {
    try {
      const notification = await databaseService.executeRawQuery(`
        INSERT INTO notifications (
          type, title, message, level, user_id, metadata, is_read, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, false, NOW(), NOW())
      `, [
        data.type,
        data.title,
        data.message,
        data.level,
        data.userId || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]);

      const createdNotification: Notification = {
        id: notification.insertId.toString(),
        type: data.type,
        title: data.title,
        message: data.message,
        level: data.level,
        userId: data.userId,
        metadata: data.metadata,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 触发通知事件
      this.emit('notification', createdNotification);

      logger.info(`System notification sent: ${data.title}`);
      return createdNotification;

    } catch (error) {
      logger.error('Failed to send system notification:', error);
      throw error;
    }
  }

  // 发送用户通知
  async sendUserNotification(userId: string, data: Omit<NotificationData, 'userId'>): Promise<Notification> {
    return this.sendSystemNotification({ ...data, userId });
  }

  // 获取用户通知列表
  async getUserNotifications(
    userId: string, 
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: string;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const { page = 1, limit = 20, unreadOnly = false, type } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE user_id = ? OR user_id IS NULL';
      const params: any[] = [userId];

      if (unreadOnly) {
        whereClause += ' AND is_read = false';
      }

      if (type) {
        whereClause += ' AND type = ?';
        params.push(type);
      }

      // 获取通知列表
      const notifications = await databaseService.executeRawQuery(`
        SELECT * FROM notifications 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // 获取总数
      const countResult = await databaseService.executeRawQuery(`
        SELECT COUNT(*) as total FROM notifications ${whereClause}
      `, params);

      const total = countResult[0]?.total || 0;

      const formattedNotifications: Notification[] = notifications.map((row: any) => ({
        id: row.id.toString(),
        type: row.type,
        title: row.title,
        message: row.message,
        level: row.level,
        userId: row.user_id,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        isRead: Boolean(row.is_read),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));

      return { notifications: formattedNotifications, total };

    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  // 标记通知为已读
  async markAsRead(notificationId: string, userId?: string): Promise<void> {
    try {
      let whereClause = 'WHERE id = ?';
      const params = [notificationId];

      if (userId) {
        whereClause += ' AND (user_id = ? OR user_id IS NULL)';
        params.push(userId);
      }

      await databaseService.executeRawQuery(`
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        ${whereClause}
      `, params);

      logger.info(`Notification ${notificationId} marked as read`);

    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // 批量标记为已读
  async markAllAsRead(userId: string, type?: string): Promise<void> {
    try {
      let whereClause = 'WHERE (user_id = ? OR user_id IS NULL) AND is_read = false';
      const params = [userId];

      if (type) {
        whereClause += ' AND type = ?';
        params.push(type);
      }

      await databaseService.executeRawQuery(`
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        ${whereClause}
      `, params);

      logger.info(`All notifications marked as read for user ${userId}`);

    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // 删除通知
  async deleteNotification(notificationId: string, userId?: string): Promise<void> {
    try {
      let whereClause = 'WHERE id = ?';
      const params = [notificationId];

      if (userId) {
        whereClause += ' AND (user_id = ? OR user_id IS NULL)';
        params.push(userId);
      }

      await databaseService.executeRawQuery(`
        DELETE FROM notifications ${whereClause}
      `, params);

      logger.info(`Notification ${notificationId} deleted`);

    } catch (error) {
      logger.error('Failed to delete notification:', error);
      throw error;
    }
  }

  // 清理过期通知
  async cleanupExpiredNotifications(daysToKeep: number = 30): Promise<number> {
    try {
      const result = await databaseService.executeRawQuery(`
        DELETE FROM notifications 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [daysToKeep]);

      const deletedCount = result.affectedRows || 0;
      logger.info(`Cleaned up ${deletedCount} expired notifications`);
      return deletedCount;

    } catch (error) {
      logger.error('Failed to cleanup expired notifications:', error);
      throw error;
    }
  }

  // 获取未读通知数量
  async getUnreadCount(userId: string, type?: string): Promise<number> {
    try {
      let whereClause = 'WHERE (user_id = ? OR user_id IS NULL) AND is_read = false';
      const params = [userId];

      if (type) {
        whereClause += ' AND type = ?';
        params.push(type);
      }

      const result = await databaseService.executeRawQuery(`
        SELECT COUNT(*) as count FROM notifications ${whereClause}
      `, params);

      return result[0]?.count || 0;

    } catch (error) {
      logger.error('Failed to get unread count:', error);
      throw error;
    }
  }

  // 发送汇率变动通知
  async sendExchangeRateAlert(
    fromCurrency: string,
    toCurrency: string,
    oldRate: number,
    newRate: number,
    changePercent: number,
    userId?: string
  ): Promise<void> {
    try {
      const direction = changePercent > 0 ? '上涨' : '下跌';
      const level = Math.abs(changePercent) > 5 ? 'warning' : 'info';
      
      await this.sendSystemNotification({
        type: 'rate_change',
        title: '汇率变动提醒',
        message: `${fromCurrency}/${toCurrency} 汇率${direction} ${Math.abs(changePercent).toFixed(2)}%`,
        level,
        userId,
        metadata: {
          fromCurrency,
          toCurrency,
          oldRate,
          newRate,
          changePercent,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Failed to send exchange rate alert:', error);
      throw error;
    }
  }

  // 发送系统维护通知
  async sendMaintenanceNotification(
    title: string,
    message: string,
    scheduledTime?: Date
  ): Promise<void> {
    try {
      await this.sendSystemNotification({
        type: 'system',
        title,
        message,
        level: 'warning',
        metadata: {
          scheduledTime: scheduledTime?.toISOString(),
          maintenanceType: 'system'
        }
      });

    } catch (error) {
      logger.error('Failed to send maintenance notification:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const notificationService = NotificationService.getInstance();