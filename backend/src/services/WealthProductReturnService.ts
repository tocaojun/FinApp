/**
 * 财富产品收益追踪服务
 * 处理分红型和净值型产品的预期收益与实际收益的偏差计算
 */

import { databaseService } from './DatabaseService';

// ============================================
// 类型定义
// ============================================

export interface DividendRecord {
  id?: string;
  date: Date;
  rate: number; // 分红率(%)
  amount: number; // 分红金额
  cumulativeDividends?: number;
}

export interface DividendReturn {
  totalDividends: number;
  expectedReturn: number;
  actualReturn: number;
  deviation: number;
  deviationRatio: number; // 百分比
  dividendsList: DividendRecord[];
  status: 'NORMAL' | 'WARNING' | 'ALERT';
}

export interface NAVHistory {
  id?: string;
  date: Date;
  nav: number;
  dailyReturn: number; // 日涨幅(%)
  cumulativeReturn: number; // 累计收益率(%)
}

export interface NAVReturn {
  purchaseNav: number;
  currentNav: number;
  shareCount: number;
  marketValue: number;
  gainAmount: number;
  gainRate: number;
  expectedReturn: number;
  deviation: number;
  deviationRatio: number; // 百分比
  navHistory: NAVHistory[];
  status: 'NORMAL' | 'WARNING' | 'ALERT';
}

export interface WealthTransaction {
  id?: string;
  assetId: string;
  type: 'PURCHASE' | 'REDEMPTION' | 'DIVIDEND' | 'FEE' | 'ADJUSTMENT';
  date: Date;
  settlementDate?: Date;
  amount: number;
  quantity?: number; // 份额数
  navPerShare?: number;
  dividendRate?: number;
  feeAmount?: number;
  feeDescription?: string;
  notes?: string;
}

export interface DeviationAnalysis {
  level: 'NORMAL' | 'WARNING' | 'ALERT';
  threshold: number;
  reasons: string[];
  recommendation: string;
  trend: number[]; // 最近N天的偏差率走势
}

// ============================================
// 常量定义
// ============================================

const DEVIATION_THRESHOLDS = {
  NORMAL: 2,
  WARNING: 5,
  ALERT: 10,
};

const DEVIATION_REASONS = {
  MARKET_VOLATILITY: '市场波动',
  MANAGEMENT_PERFORMANCE: '基金经理操作',
  FEES_HIGHER: '费用高于预期',
  LIQUIDITY_RISK: '流动性风险',
  POLICY_CHANGE: '政策变化',
  TIMING_MISMATCH: '时间错配',
  DIVIDEND_DELAY: '分红延迟',
  EARLY_REDEMPTION: '提前赎回',
};

// ============================================
// 财富产品收益服务
// ============================================

export class WealthProductReturnService {
  /**
   * 计算分红型产品收益
   */
  async calculateDividendReturn(
    assetId: string,
    investment: number,
    expectedReturn: number,
    startDate: Date
  ): Promise<DividendReturn> {
    try {
      // 获取分红记录
      const dividends = await this.getDividendRecords(assetId);

      // 计算已收总分红
      const totalDividends = dividends.reduce((sum, d) => sum + d.amount, 0);

      // 计算预期收益
      const expectedAmount = investment * (expectedReturn / 100);

      // 计算实际收益
      const actualReturn = totalDividends;

      // 计算偏差
      const deviation = actualReturn - expectedAmount;
      const deviationRatio =
        expectedAmount !== 0 ? (deviation / expectedAmount) * 100 : 0;

      // 确定状态
      const status = this.getDeviationStatus(Math.abs(deviationRatio));

      return {
        totalDividends,
        expectedReturn: expectedAmount,
        actualReturn,
        deviation,
        deviationRatio,
        dividendsList: dividends,
        status,
      };
    } catch (error) {
      console.error('Error calculating dividend return:', error);
      throw error;
    }
  }

  /**
   * 计算净值型产品收益
   */
  async calculateNAVReturn(
    assetId: string,
    investment: number,
    purchaseNav: number,
    expectedAnnualReturn: number,
    holdingDays: number
  ): Promise<NAVReturn> {
    try {
      // 获取当前净值
      const currentNav = await this.getCurrentNAV(assetId);
      const navHistory = await this.getNAVHistory(assetId);

      // 计算份额数
      const shareCount = investment / purchaseNav;

      // 计算当前市值
      const marketValue = shareCount * currentNav;

      // 计算实际收益
      const gainAmount = marketValue - investment;
      const gainRate = (gainAmount / investment) * 100;

      // 计算预期收益（按比例时间计算）
      const expectedReturnRate = (expectedAnnualReturn / 365) * holdingDays;
      const expectedAmount = investment * (expectedReturnRate / 100);

      // 计算偏差
      const deviation = gainAmount - expectedAmount;
      const deviationRatio =
        expectedAmount !== 0 ? (deviation / expectedAmount) * 100 : 0;

      // 确定状态
      const status = this.getDeviationStatus(Math.abs(deviationRatio));

      return {
        purchaseNav,
        currentNav,
        shareCount,
        marketValue,
        gainAmount,
        gainRate,
        expectedReturn: expectedReturnRate,
        deviation,
        deviationRatio,
        navHistory,
        status,
      };
    } catch (error) {
      console.error('Error calculating NAV return:', error);
      throw error;
    }
  }

  /**
   * 计算年化收益率
   */
  calculateAnnualizedReturn(gainRate: number, holdingDays: number): number {
    if (holdingDays === 0) return 0;
    const years = holdingDays / 365.25;
    const annualizedReturn = ((1 + gainRate / 100) ** (1 / years) - 1) * 100;
    return annualizedReturn;
  }

  /**
   * 计算年化偏差
   */
  calculateAnnualizedDeviation(
    startDate: Date,
    endDate: Date,
    deviationRatio: number
  ): number {
    const days =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const years = days / 365.25;
    if (years === 0) return 0;
    return deviationRatio / years;
  }

  /**
   * 记录交易/分红
   */
  async recordTransaction(transaction: WealthTransaction): Promise<void> {
    try {
      const query = `
        INSERT INTO finapp.wealth_product_transactions (
          asset_id, transaction_type, transaction_date, settlement_date,
          amount, quantity, nav_per_share, dividend_rate,
          fee_amount, fee_description, status, notes
        ) VALUES (
          $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
      `;

      const params = [
        transaction.assetId,
        transaction.type,
        transaction.date,
        transaction.settlementDate || null,
        transaction.amount,
        transaction.quantity || null,
        transaction.navPerShare || null,
        transaction.dividendRate || null,
        transaction.feeAmount || null,
        transaction.feeDescription || null,
        'COMPLETED',
        transaction.notes || null,
      ];

      await databaseService.executeRawQuery(query, params);
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }

  /**
   * 记录净值历史
   */
  async recordNAVHistory(
    assetId: string,
    date: Date,
    nav: number,
    dailyReturn: number,
    cumulativeReturn: number
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO finapp.wealth_product_nav_history (
          asset_id, nav_date, nav_per_share, daily_return,
          holding_period_return
        ) VALUES (
          $1::uuid, $2, $3, $4, $5
        )
        ON CONFLICT (asset_id, nav_date) DO UPDATE SET
          nav_per_share = $3,
          daily_return = $4,
          holding_period_return = $5
      `;

      const params = [assetId, date, nav, dailyReturn, cumulativeReturn];

      await databaseService.executeRawQuery(query, params);
    } catch (error) {
      console.error('Error recording NAV history:', error);
      throw error;
    }
  }

  /**
   * 分析偏差原因
   */
  async analyzeDeviations(assetId: string): Promise<DeviationAnalysis> {
    try {
      const query = `
        SELECT
          wpd.product_subtype,
          wpd.expected_return,
          wpd.dividend_frequency,
          wpd.total_dividends_received,
          COUNT(wpt.id) as transaction_count,
          MAX(wpt.transaction_date) as last_transaction_date
        FROM finapp.wealth_product_details wpd
        LEFT JOIN finapp.wealth_product_transactions wpt
          ON wpd.asset_id = wpt.asset_id
        WHERE wpd.asset_id = $1::uuid
        GROUP BY wpd.product_subtype, wpd.expected_return, wpd.dividend_frequency, wpd.total_dividends_received
      `;

      const result = await databaseService.executeRawQuery(query, [assetId]);

      if (!result || result.length === 0) {
        return {
          level: 'NORMAL',
          threshold: DEVIATION_THRESHOLDS.NORMAL,
          reasons: [],
          recommendation: '暂无偏差数据',
          trend: [],
        };
      }

      const data = result[0];
      const reasons: string[] = [];

      // 分析偏差原因
      if (data.last_transaction_date) {
        const daysSinceLast =
          (Date.now() - new Date(data.last_transaction_date).getTime()) /
          (1000 * 60 * 60 * 24);

        if (daysSinceLast > 30 && data.product_subtype === 'DIVIDEND') {
          reasons.push(DEVIATION_REASONS.DIVIDEND_DELAY);
        }
      }

      // 获取偏差趋势
      const trend = await this.getDeviationTrend(assetId, 30);
      const avgDeviation =
        trend.length > 0 ? trend.reduce((a, b) => a + b, 0) / trend.length : 0;

      const level = this.getDeviationStatus(Math.abs(avgDeviation));

      return {
        level,
        threshold: this.getThreshold(level),
        reasons,
        recommendation: this.getRecommendation(level),
        trend,
      };
    } catch (error) {
      console.error('Error analyzing deviations:', error);
      throw error;
    }
  }

  /**
   * 获取偏差趋势（最近N天）
   */
  async getDeviationTrend(assetId: string, days: number): Promise<number[]> {
    try {
      const query = `
        SELECT
          nav_date,
          ((nav_per_share - LAG(nav_per_share) OVER (ORDER BY nav_date)) /
           LAG(nav_per_share) OVER (ORDER BY nav_date)) * 100 as daily_deviation
        FROM finapp.wealth_product_nav_history
        WHERE asset_id = $1::uuid
          AND nav_date >= CURRENT_DATE - INTERVAL '1 day' * $2
        ORDER BY nav_date
      `;

      const result = await databaseService.executeRawQuery(query, [
        assetId,
        days,
      ]);

      return result
        .filter((r: any) => r.daily_deviation !== null)
        .map((r: any) => parseFloat(r.daily_deviation));
    } catch (error) {
      console.error('Error getting deviation trend:', error);
      return [];
    }
  }

  /**
   * 获取分红记录
   */
  private async getDividendRecords(assetId: string): Promise<DividendRecord[]> {
    const query = `
      SELECT
        id,
        transaction_date as date,
        dividend_rate as rate,
        amount,
        SUM(amount) OVER (ORDER BY transaction_date) as cumulative_dividends
      FROM finapp.wealth_product_transactions
      WHERE asset_id = $1::uuid
        AND transaction_type = 'DIVIDEND'
      ORDER BY transaction_date
    `;

    const result = await databaseService.executeRawQuery(query, [assetId]);

    return result.map((r: any) => ({
      id: r.id,
      date: r.date,
      rate: parseFloat(r.rate || 0),
      amount: parseFloat(r.amount),
      cumulativeDividends: parseFloat(r.cumulative_dividends),
    }));
  }

  /**
   * 获取当前净值
   */
  private async getCurrentNAV(assetId: string): Promise<number> {
    const query = `
      SELECT nav_per_share
      FROM finapp.wealth_product_nav_history
      WHERE asset_id = $1::uuid
      ORDER BY nav_date DESC
      LIMIT 1
    `;

    const result = await databaseService.executeRawQuery(query, [assetId]);
    return result.length > 0 ? parseFloat(result[0].nav_per_share) : 1.0;
  }

  /**
   * 获取净值历史
   */
  private async getNAVHistory(assetId: string): Promise<NAVHistory[]> {
    const query = `
      SELECT
        id,
        nav_date as date,
        nav_per_share as nav,
        daily_return,
        holding_period_return as cumulative_return
      FROM finapp.wealth_product_nav_history
      WHERE asset_id = $1::uuid
      ORDER BY nav_date DESC
      LIMIT 100
    `;

    const result = await databaseService.executeRawQuery(query, [assetId]);

    return result.map((r: any) => ({
      id: r.id,
      date: r.date,
      nav: parseFloat(r.nav),
      dailyReturn: parseFloat(r.daily_return || 0),
      cumulativeReturn: parseFloat(r.cumulative_return || 0),
    }));
  }

  /**
   * 确定偏差状态
   */
  private getDeviationStatus(
    deviationRatio: number
  ): 'NORMAL' | 'WARNING' | 'ALERT' {
    if (deviationRatio <= DEVIATION_THRESHOLDS.NORMAL) {
      return 'NORMAL';
    }
    if (deviationRatio <= DEVIATION_THRESHOLDS.WARNING) {
      return 'WARNING';
    }
    return 'ALERT';
  }

  /**
   * 获取阈值
   */
  private getThreshold(level: 'NORMAL' | 'WARNING' | 'ALERT'): number {
    switch (level) {
      case 'NORMAL':
        return DEVIATION_THRESHOLDS.NORMAL;
      case 'WARNING':
        return DEVIATION_THRESHOLDS.WARNING;
      case 'ALERT':
        return DEVIATION_THRESHOLDS.ALERT;
    }
  }

  /**
   * 获取建议
   */
  private getRecommendation(level: 'NORMAL' | 'WARNING' | 'ALERT'): string {
    switch (level) {
      case 'NORMAL':
        return '产品运作正常，收益符合预期';
      case 'WARNING':
        return '收益偏差较大，建议核查产品表现和费用';
      case 'ALERT':
        return '收益偏差严重，建议咨询产品经理或考虑赎回';
    }
  }
}

export const wealthProductReturnService = new WealthProductReturnService();
