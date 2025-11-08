import { Request, Response } from 'express';
import { wealthProductReturnService, WealthTransaction } from '../services/WealthProductReturnService';
import { databaseService } from '../services/DatabaseService';
import { wealthMonitoringService } from '../jobs/wealthMonitoring';

export class WealthProductController {
  /**
   * 获取产品收益对比 (分红型)
   */
  getDividendComparison = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      const { investment, expectedReturn, startDate } = req.body;

      if (!assetId || !investment || !expectedReturn) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: assetId, investment, expectedReturn'
        });
        return;
      }

      const start = new Date(startDate || new Date());
      const result = await wealthProductReturnService.calculateDividendReturn(
        assetId,
        investment,
        expectedReturn,
        start
      );

      res.json({
        success: true,
        data: {
          productType: 'DIVIDEND',
          ...result,
          analysis: {
            status: result.status,
            deviationPercentage: result.deviationRatio.toFixed(2),
            recommendation: this.getRecommendation(result.status),
            alert: result.status !== 'NORMAL'
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting dividend comparison:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get dividend comparison'
      });
    }
  };

  /**
   * 获取产品收益对比 (净值型)
   */
  getNAVComparison = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      const { investment, purchaseNav, expectedAnnualReturn, holdingDays } = req.body;

      if (!assetId || !investment || !purchaseNav || !expectedAnnualReturn) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: assetId, investment, purchaseNav, expectedAnnualReturn'
        });
        return;
      }

      const result = await wealthProductReturnService.calculateNAVReturn(
        assetId,
        investment,
        purchaseNav,
        expectedAnnualReturn,
        holdingDays || 365
      );

      res.json({
        success: true,
        data: {
          productType: 'NAV',
          ...result,
          analysis: {
            status: result.status,
            deviationPercentage: result.deviationRatio.toFixed(2),
            gainPercentage: result.gainRate.toFixed(2),
            recommendation: this.getRecommendation(result.status),
            alert: result.status !== 'NORMAL'
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting NAV comparison:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get NAV comparison'
      });
    }
  };

  /**
   * 分析偏差原因
   */
  analyzeDeviations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;

      if (!assetId) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: assetId'
        });
        return;
      }

      const analysis = await wealthProductReturnService.analyzeDeviations(assetId);

      res.json({
        success: true,
        data: {
          assetId,
          analysis: {
            level: analysis.level,
            threshold: `±${analysis.threshold}%`,
            reasons: analysis.reasons,
            recommendation: analysis.recommendation,
            trend: analysis.trend,
            trendSummary: this.getTrendSummary(analysis.trend)
          }
        }
      });
    } catch (error: any) {
      console.error('Error analyzing deviations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to analyze deviations'
      });
    }
  };

  /**
   * 记录交易
   */
  recordTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const transaction: WealthTransaction = req.body;

      if (!transaction.assetId || !transaction.type || !transaction.date || !transaction.amount) {
        res.status(400).json({
          success: false,
          message: 'Missing required transaction fields'
        });
        return;
      }

      await wealthProductReturnService.recordTransaction(transaction);

      res.json({
        success: true,
        message: 'Transaction recorded successfully',
        data: transaction
      });
    } catch (error: any) {
      console.error('Error recording transaction:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to record transaction'
      });
    }
  };

  /**
   * 获取产品汇总信息
   */
  getWealthProductSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { productSubtype } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: userId'
        });
        return;
      }

      // 构建查询条件
      let query = `
        SELECT
          a.id as asset_id,
          a.name,
          a.asset_type,
          wpd.product_subtype,
          wpd.issuer,
          wpd.expected_return,
          wpd.total_investment,
          wpd.total_dividends_received,
          wpd.current_value,
          COUNT(wpt.id) as transaction_count,
          MAX(wpt.transaction_date) as last_transaction_date
        FROM finapp.assets a
        LEFT JOIN finapp.wealth_product_details wpd ON a.id = wpd.asset_id
        LEFT JOIN finapp.wealth_product_transactions wpt ON a.id = wpt.asset_id
        WHERE a.user_id = $1::uuid
          AND a.asset_type IN ('WEALTH_PRODUCT', 'FUND', 'BOND')
      `;

      const params: any[] = [userId];

      if (productSubtype) {
        query += ` AND wpd.product_subtype = $${params.length + 1}`;
        params.push(productSubtype);
      }

      query += `
        GROUP BY a.id, a.name, a.asset_type, wpd.product_subtype, wpd.issuer,
                 wpd.expected_return, wpd.total_investment, wpd.total_dividends_received,
                 wpd.current_value
        ORDER BY wpd.product_subtype, a.name
      `;

      const result = await databaseService.executeRawQuery(query, params);

      res.json({
        success: true,
        data: {
          summary: {
            totalProducts: result.length,
            productsByType: this.groupByProductType(result),
            products: result.map((p: any) => ({
              assetId: p.asset_id,
              name: p.name,
              type: p.asset_type,
              subtype: p.product_subtype,
              issuer: p.issuer,
              expectedReturn: parseFloat(p.expected_return || 0),
              totalInvestment: parseFloat(p.total_investment || 0),
              dividendsReceived: parseFloat(p.total_dividends_received || 0),
              currentValue: parseFloat(p.current_value || 0),
              transactionCount: p.transaction_count,
              lastTransactionDate: p.last_transaction_date
            }))
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting wealth product summary:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get wealth product summary'
      });
    }
  };

  /**
   * 获取收益趋势
   */
  getReturnTrend = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      const { days = 30, groupBy = 'daily' } = req.query;

      if (!assetId) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: assetId'
        });
        return;
      }

      const query = `
        SELECT
          nav_date as date,
          nav_per_share as nav,
          daily_return,
          holding_period_return as cumulative_return
        FROM finapp.wealth_product_nav_history
        WHERE asset_id = $1::uuid
          AND nav_date >= CURRENT_DATE - INTERVAL '1 day' * $2::int
        ORDER BY nav_date
      `;

      const result = await databaseService.executeRawQuery(query, [assetId, parseInt(days as string) || 30]);

      // 按时间粒度分组
      const grouped = this.groupByTimeGranularity(result, groupBy as string);

      res.json({
        success: true,
        data: {
          assetId,
          period: `${days} days`,
          granularity: groupBy,
          data: grouped
        }
      });
    } catch (error: any) {
      console.error('Error getting return trend:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get return trend'
      });
    }
  };

  /**
   * 私有方法：获取建议
   */
  private getRecommendation(status: 'NORMAL' | 'WARNING' | 'ALERT'): string {
    switch (status) {
      case 'NORMAL':
        return '产品运作正常，收益符合预期，建议继续持有';
      case 'WARNING':
        return '收益偏差较大，建议咨询产品经理或核查费用';
      case 'ALERT':
        return '收益偏差严重，建议咨询经理或考虑赎回';
      default:
        return '未知状态';
    }
  }

  /**
   * 私有方法：获取趋势总结
   */
  private getTrendSummary(trend: number[]): string {
    if (trend.length === 0) return '暂无数据';

    const recent = trend.slice(-7);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

    if (avg > 2) return '偏差持续扩大，需要关注';
    if (avg < -2) return '偏差在缩小，趋势向好';
    return '偏差相对稳定';
  }

  /**
   * 私有方法：按产品类型分组
   */
  private groupByProductType(data: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    data.forEach(item => {
      const type = item.product_subtype || 'UNKNOWN';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }

  /**
   * 私有方法：按时间粒度分组
   */
  private groupByTimeGranularity(data: any[], granularity: string): any[] {
    if (granularity === 'daily' || data.length <= 30) {
      return data;
    }

    if (granularity === 'weekly') {
      const grouped: Record<string, any> = {};
      data.forEach((item: any) => {
        const date = new Date(item.date);
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = weekStart.toISOString().split('T')[0];

        if (!grouped[key]) {
          grouped[key] = {
            date: key,
            navValues: [],
            dailyReturns: [],
            cumulativeReturns: []
          };
        }
        grouped[key].navValues.push(parseFloat(item.nav));
        grouped[key].dailyReturns.push(parseFloat(item.daily_return || 0));
        grouped[key].cumulativeReturns.push(parseFloat(item.cumulative_return || 0));
      });

      return Object.values(grouped).map((g: any) => ({
        date: g.date,
        nav: (g.navValues.reduce((a: number, b: number) => a + b, 0) / g.navValues.length).toFixed(4),
        dailyReturn: (g.dailyReturns.reduce((a: number, b: number) => a + b, 0) / g.dailyReturns.length).toFixed(2),
        cumulativeReturn: g.cumulativeReturns[g.cumulativeReturns.length - 1].toFixed(2)
      }));
    }

    return data;
  }

  /**
   * 获取用户的告警列表
   */
  getUserAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { days = 30, status } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: userId'
        });
        return;
      }

      let alerts = await wealthMonitoringService.getUserAlerts(userId, parseInt(days as string) || 30);

      // 过滤告警状态
      if (status) {
        alerts = alerts.filter(a => a.status === status);
      }

      res.json({
        success: true,
        data: {
          userId,
          total: alerts.length,
          alerts
        }
      });
    } catch (error: any) {
      console.error('Error getting user alerts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user alerts'
      });
    }
  };

  /**
   * 获取告警统计
   */
  getAlertStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: userId'
        });
        return;
      }

      const stats = await wealthMonitoringService.getAlertStats(userId);

      res.json({
        success: true,
        data: {
          userId,
          stats
        }
      });
    } catch (error: any) {
      console.error('Error getting alert stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get alert stats'
      });
    }
  };

  /**
   * 确认告警
   */
  acknowledgeAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const { alertId } = req.params;

      if (!alertId) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: alertId'
        });
        return;
      }

      const result = await wealthMonitoringService.acknowledgeAlert(alertId);

      res.json({
        success: result,
        message: result ? 'Alert acknowledged' : 'Failed to acknowledge alert'
      });
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to acknowledge alert'
      });
    }
  };

  /**
   * 解决告警
   */
  resolveAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const { alertId } = req.params;

      if (!alertId) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: alertId'
        });
        return;
      }

      const result = await wealthMonitoringService.resolveAlert(alertId);

      res.json({
        success: result,
        message: result ? 'Alert resolved' : 'Failed to resolve alert'
      });
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to resolve alert'
      });
    }
  };
}
