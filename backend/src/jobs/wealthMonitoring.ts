/**
 * 财富产品监控告警系统
 * 定期检查产品的收益偏差并生成告警
 */

import * as cron from 'node-cron';
import { databaseService } from '../services/DatabaseService';
import { wealthProductReturnService } from '../services/WealthProductReturnService';
import { logger } from '../utils/logger';

// ============================================
// 类型定义
// ============================================

export interface AlertConfig {
  normalThreshold: number; // ±2%
  warningThreshold: number; // ±5%
  alertThreshold: number; // >5%
  checkInterval: string; // Cron 表达式
  retentionDays: number; // 告警保留天数
}

export interface WealthAlert {
  id?: string;
  assetId: string;
  userId: string;
  alertLevel: 'NORMAL' | 'WARNING' | 'ALERT';
  message: string;
  deviationRatio: number;
  recommendation: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
}

// ============================================
// 配置
// ============================================

const DEFAULT_CONFIG: AlertConfig = {
  normalThreshold: 2,
  warningThreshold: 5,
  alertThreshold: 10,
  checkInterval: '0 */6 * * *', // 每6小时检查一次
  retentionDays: 90
};

// ============================================
// 监控服务
// ============================================

export class WealthMonitoringService {
  private config: AlertConfig;
  private job: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 启动监控
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Wealth monitoring is already running');
      return;
    }

    this.job = cron.schedule(
      this.config.checkInterval,
      async () => {
        try {
          await this.checkAllProducts();
        } catch (error) {
          logger.error('Error in wealth monitoring job:', error);
        }
      }
    );

    this.isRunning = true;
    logger.info(`Wealth monitoring started with interval: ${this.config.checkInterval}`);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      logger.info('Wealth monitoring stopped');
    }
  }

  /**
   * 检查所有财富产品
   */
  private async checkAllProducts(): Promise<void> {
    try {
      const query = `
        SELECT DISTINCT
          a.id as asset_id,
          a.user_id,
          a.name,
          wpd.product_subtype,
          wpd.expected_return,
          wpd.total_investment,
          wpd.total_dividends_received,
          wpd.current_value
        FROM finapp.assets a
        JOIN finapp.wealth_product_details wpd ON a.id = wpd.asset_id
        WHERE a.asset_type IN ('WEALTH_PRODUCT', 'FUND', 'BOND')
        AND a.user_id IS NOT NULL
      `;

      const products = await databaseService.executeRawQuery(query, []);

      for (const product of products) {
        await this.checkProduct(product);
      }

      // 清理过期告警
      await this.cleanupOldAlerts();

      logger.info(`Wealth monitoring completed. Checked ${products.length} products`);
    } catch (error) {
      logger.error('Error checking all products:', error);
    }
  }

  /**
   * 检查单个产品
   */
  private async checkProduct(product: any): Promise<void> {
    try {
      const analysis = await wealthProductReturnService.analyzeDeviations(product.asset_id);

      // 确定告警级别
      const avgDeviation = analysis.trend.length > 0
        ? analysis.trend.reduce((a, b) => a + b, 0) / analysis.trend.length
        : 0;

      let alertLevel: 'NORMAL' | 'WARNING' | 'ALERT' = 'NORMAL';
      if (Math.abs(avgDeviation) > this.config.alertThreshold) {
        alertLevel = 'ALERT';
      } else if (Math.abs(avgDeviation) > this.config.warningThreshold) {
        alertLevel = 'WARNING';
      }

      // 生成告警消息
      const message = this.generateAlertMessage(product, analysis, alertLevel);

      // 保存告警
      const alert: WealthAlert = {
        assetId: product.asset_id,
        userId: product.user_id,
        alertLevel,
        message,
        deviationRatio: avgDeviation,
        recommendation: analysis.recommendation,
        triggeredAt: new Date(),
        status: 'ACTIVE'
      };

      await this.saveAlert(alert);

      // 如果是高级别告警，发送通知
      if (alertLevel !== 'NORMAL') {
        await this.sendNotification(alert, product);
      }
    } catch (error) {
      logger.error(`Error checking product ${product.asset_id}:`, error);
    }
  }

  /**
   * 保存告警
   */
  private async saveAlert(alert: WealthAlert): Promise<void> {
    try {
      const query = `
        INSERT INTO finapp.wealth_product_alerts (
          asset_id, user_id, alert_level, message,
          deviation_ratio, recommendation, triggered_at, status
        ) VALUES (
          $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8
        )
        ON CONFLICT (asset_id, triggered_at) DO UPDATE SET
          alert_level = $3,
          message = $4,
          deviation_ratio = $5,
          recommendation = $6,
          status = $8
      `;

      const params = [
        alert.assetId,
        alert.userId,
        alert.alertLevel,
        alert.message,
        alert.deviationRatio,
        alert.recommendation,
        alert.triggeredAt,
        alert.status
      ];

      await databaseService.executeRawQuery(query, params);
    } catch (error) {
      logger.error('Error saving alert:', error);
    }
  }

  /**
   * 生成告警消息
   */
  private generateAlertMessage(
    product: any,
    analysis: any,
    level: string
  ): string {
    let levelText = '';
    switch (level) {
      case 'WARNING':
        levelText = '⚠️ 预警';
        break;
      case 'ALERT':
        levelText = '🚨 告警';
        break;
      default:
        levelText = '✓ 正常';
    }

    const deviationText = analysis.trend.length > 0
      ? `偏差: ${(analysis.trend[analysis.trend.length - 1]).toFixed(2)}%`
      : '暂无偏差数据';

    return `${levelText} - ${product.name}: ${deviationText}`;
  }

  /**
   * 发送通知
   */
  private async sendNotification(alert: WealthAlert, product: any): Promise<void> {
    try {
      // TODO: 集成邮件、短信、推送等通知渠道
      logger.info(`[NOTIFICATION] ${alert.alertLevel}: ${alert.message}`, {
        userId: alert.userId,
        assetId: alert.assetId,
        recommendation: alert.recommendation
      });

      // 这里可以集成：
      // - 邮件通知
      // - 钉钉/企业微信通知
      // - 手机推送
      // - SMS 短信
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  /**
   * 清理过期告警
   */
  private async cleanupOldAlerts(): Promise<void> {
    try {
      const query = `
        DELETE FROM finapp.wealth_product_alerts
        WHERE triggered_at < CURRENT_DATE - INTERVAL '1 day' * $1
          AND status IN ('RESOLVED', 'ACKNOWLEDGED')
      `;

      await databaseService.executeRawQuery(query, [this.config.retentionDays]);
    } catch (error) {
      logger.error('Error cleaning up old alerts:', error);
    }
  }

  /**
   * 获取用户的告警
   */
  async getUserAlerts(userId: string, days: number = 30): Promise<WealthAlert[]> {
    try {
      const query = `
        SELECT
          id,
          asset_id,
          user_id,
          alert_level,
          message,
          deviation_ratio,
          recommendation,
          triggered_at,
          resolved_at,
          status
        FROM finapp.wealth_product_alerts
        WHERE user_id = $1::uuid
          AND triggered_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        ORDER BY triggered_at DESC
      `;

      const alerts = await databaseService.executeRawQuery(query, [userId, days]);

      return alerts.map((a: any) => ({
        id: a.id,
        assetId: a.asset_id,
        userId: a.user_id,
        alertLevel: a.alert_level,
        message: a.message,
        deviationRatio: parseFloat(a.deviation_ratio),
        recommendation: a.recommendation,
        triggeredAt: a.triggered_at,
        resolvedAt: a.resolved_at,
        status: a.status
      }));
    } catch (error) {
      logger.error('Error getting user alerts:', error);
      return [];
    }
  }

  /**
   * 确认告警
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE finapp.wealth_product_alerts
        SET status = 'ACKNOWLEDGED'
        WHERE id = $1::uuid
      `;

      await databaseService.executeRawQuery(query, [alertId]);
      return true;
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      return false;
    }
  }

  /**
   * 解决告警
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE finapp.wealth_product_alerts
        SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid
      `;

      await databaseService.executeRawQuery(query, [alertId]);
      return true;
    } catch (error) {
      logger.error('Error resolving alert:', error);
      return false;
    }
  }

  /**
   * 获取告警统计
   */
  async getAlertStats(userId: string): Promise<any> {
    try {
      const query = `
        SELECT
          alert_level,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_count
        FROM finapp.wealth_product_alerts
        WHERE user_id = $1::uuid
          AND triggered_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY alert_level
      `;

      const stats = await databaseService.executeRawQuery(query, [userId]);

      return {
        total: stats.reduce((sum: number, s: any) => sum + parseInt(s.count), 0),
        active: stats.reduce((sum: number, s: any) => sum + parseInt(s.active_count), 0),
        byLevel: stats.reduce((acc: any, s: any) => {
          acc[s.alert_level] = {
            total: parseInt(s.count),
            active: parseInt(s.active_count)
          };
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting alert stats:', error);
      return { total: 0, active: 0, byLevel: {} };
    }
  }
}

/**
 * 全局监控实例
 */
export const wealthMonitoringService = new WealthMonitoringService({
  checkInterval: process.env.WEALTH_MONITORING_INTERVAL || '0 */6 * * *'
});

export default wealthMonitoringService;
