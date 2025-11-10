import { databaseService } from './DatabaseService';
import { v4 as uuidv4 } from 'uuid';

export interface QuarterlyReport {
  id: string;
  quarter: string;
  year: number;
  totalAssets: number;
  totalReturn: number;
  returnRate: number;
  portfolioCount: number;
  transactionCount: number;
  createdAt: string;
  status: 'completed' | 'generating' | 'failed';
}

export interface QuarterlySummary {
  totalAssets: number;
  totalReturn: number;
  returnRate: number;
  portfolioCount: number;
}

export interface IRRAnalysis {
  portfolioId: string;
  portfolioName: string;
  irr: number;
  npv: number;
  totalInvestment: number;
  currentValue: number;
  period: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CustomReport {
  id: string;
  name: string;
  type: 'portfolio' | 'transaction' | 'performance' | 'risk';
  dateRange: [string, string];
  filters: Record<string, any>;
  createdAt: string;
  lastRun: string;
}

export class ReportService {
  /**
   * 获取季度报表列表
   */
  async getQuarterlyReports(userId: string): Promise<QuarterlyReport[]> {
    try {
      const query = `
        SELECT 
          r.id,
          r.name as quarter,
          CAST(SUBSTRING(r.name, 1, 4) AS INTEGER) as year,
          COALESCE((r.parameters->>'totalAssets')::numeric, 0) as total_assets,
          COALESCE((r.parameters->>'totalReturn')::numeric, 0) as total_return,
          COALESCE((r.parameters->>'returnRate')::numeric, 0) as return_rate,
          COALESCE((r.parameters->>'portfolioCount')::integer, 0) as portfolio_count,
          COALESCE((r.parameters->>'transactionCount')::integer, 0) as transaction_count,
          r.created_at as created_at,
          CASE 
            WHEN r.last_generated_at IS NOT NULL THEN 'completed'
            WHEN r.is_scheduled THEN 'generating'
            ELSE 'failed'
          END as status
        FROM finapp.reports r
        WHERE r.user_id = $1::uuid AND r.report_type = 'quarterly'
        ORDER BY r.created_at DESC
        LIMIT 100
      `;

      const results = await databaseService.executeRawQuery<any[]>(query, [userId]);

      return results.map(row => ({
        id: row.id,
        quarter: row.quarter,
        year: row.year,
        totalAssets: parseFloat(row.total_assets || '0'),
        totalReturn: parseFloat(row.total_return || '0'),
        returnRate: parseFloat(row.return_rate || '0'),
        portfolioCount: parseInt(row.portfolio_count || '0'),
        transactionCount: parseInt(row.transaction_count || '0'),
        createdAt: new Date(row.created_at).toISOString(),
        status: row.status
      }));
    } catch (error) {
      console.error('Failed to get quarterly reports:', error);
      return [];
    }
  }

  /**
   * 获取季度概览统计
   */
  async getQuarterlySummary(userId: string, quarter: string): Promise<QuarterlySummary> {
    try {
      // 解析季度：2024Q3 -> 2024年第3季度
      const yearMatch = quarter.match(/(\d{4})/);
      const quarterMatch = quarter.match(/Q(\d)/);
      
      if (!yearMatch || !quarterMatch) {
        return { totalAssets: 0, totalReturn: 0, returnRate: 0, portfolioCount: 0 };
      }

      const year = parseInt(yearMatch[1]);
      const quarterNum = parseInt(quarterMatch[1]);
      const monthStart = (quarterNum - 1) * 3 + 1;
      const monthEnd = quarterNum * 3;

      // 获取该季度内的投资组合数
      const portfolioCountQuery = `
        SELECT COUNT(DISTINCT p.id) as count
        FROM finapp.portfolios p
        WHERE p.user_id = $1::uuid
      `;
      const portfolioCountResult = await databaseService.executeRawQuery<any[]>(
        portfolioCountQuery,
        [userId]
      );
      const portfolioCount = parseInt(portfolioCountResult[0]?.count || '0');

      // 获取该季度内的总资产（基于快照）
      const assetsQuery = `
        SELECT 
          COALESCE(SUM(ps.total_value), 0) as total_value,
          COALESCE(SUM(ps.unrealized_gain_loss + ps.realized_gain_loss), 0) as total_return
        FROM finapp.portfolio_snapshots ps
        JOIN finapp.portfolios p ON ps.portfolio_id = p.id
        WHERE p.user_id = $1::uuid
          AND EXTRACT(YEAR FROM ps.snapshot_date) = $2
          AND EXTRACT(MONTH FROM ps.snapshot_date) >= $3
          AND EXTRACT(MONTH FROM ps.snapshot_date) <= $4
      `;

      const assetsResult = await databaseService.executeRawQuery<any[]>(
        assetsQuery,
        [userId, year, monthStart, monthEnd]
      );

      const totalAssets = parseFloat(assetsResult[0]?.total_value || '0');
      const totalReturn = parseFloat(assetsResult[0]?.total_return || '0');
      const returnRate = totalAssets > 0 ? (totalReturn / totalAssets) * 100 : 0;

      return {
        totalAssets,
        totalReturn,
        returnRate,
        portfolioCount
      };
    } catch (error) {
      console.error('Failed to get quarterly summary:', error);
      return { totalAssets: 0, totalReturn: 0, returnRate: 0, portfolioCount: 0 };
    }
  }

  /**
   * 生成季度报表
   */
  async generateQuarterlyReport(userId: string, quarter: string): Promise<{ success: boolean; reportId?: string }> {
    try {
      // 首先获取季度数据
      const summary = await this.getQuarterlySummary(userId, quarter);
      
      // 获取该季度的交易数
      const yearMatch = quarter.match(/(\d{4})/);
      const quarterMatch = quarter.match(/Q(\d)/);
      
      if (!yearMatch || !quarterMatch) {
        return { success: false };
      }

      const year = parseInt(yearMatch[1]);
      const quarterNum = parseInt(quarterMatch[1]);
      const monthStart = (quarterNum - 1) * 3 + 1;
      const monthEnd = quarterNum * 3;

      const transactionCountQuery = `
        SELECT COUNT(*) as count
        FROM finapp.transactions t
        JOIN finapp.portfolios p ON t.portfolio_id = p.id
        WHERE p.user_id = $1::uuid
          AND EXTRACT(YEAR FROM COALESCE(t.transaction_date, t.executed_at::date)) = $2
          AND EXTRACT(MONTH FROM COALESCE(t.transaction_date, t.executed_at::date)) >= $3
          AND EXTRACT(MONTH FROM COALESCE(t.transaction_date, t.executed_at::date)) <= $4
      `;

      const transactionCountResult = await databaseService.executeRawQuery<any[]>(
        transactionCountQuery,
        [userId, year, monthStart, monthEnd]
      );
      const transactionCount = parseInt(transactionCountResult[0]?.count || '0');

      // 创建报表记录
      const reportId = uuidv4();
      const parameters = {
        totalAssets: summary.totalAssets,
        totalReturn: summary.totalReturn,
        returnRate: summary.returnRate,
        portfolioCount: summary.portfolioCount,
        transactionCount: transactionCount,
        quarter: quarter
      };

      const insertQuery = `
        INSERT INTO finapp.reports (
          id, user_id, name, description, report_type, parameters, 
          is_scheduled, is_active, last_generated_at, created_at, updated_at
        ) VALUES (
          $1::uuid, $2::uuid, $3, $4, $5, $6::jsonb, $7, $8, $9::timestamptz, $10::timestamp, $11::timestamp
        )
        ON CONFLICT (id) DO UPDATE SET
          last_generated_at = $9::timestamptz,
          parameters = $6::jsonb,
          updated_at = $11::timestamp
      `;

      await databaseService.executeRawCommand(
        insertQuery,
        [
          reportId,
          userId,
          quarter,
          `Quarterly report for ${quarter}`,
          'quarterly',
          JSON.stringify(parameters),
          true,
          true,
          new Date(),
          new Date(),
          new Date()
        ]
      );

      return { success: true, reportId };
    } catch (error) {
      console.error('Failed to generate quarterly report:', error);
      return { success: false };
    }
  }

  /**
   * 计算IRR（内部收益率）
   * 使用牛顿迭代法计算
   */
  private calculateIRR(cashFlows: Array<{ date: Date; amount: number }>): number {
    if (cashFlows.length < 2) return 0;

    // 按日期排序
    cashFlows.sort((a, b) => a.date.getTime() - b.date.getTime());

    const baseDate = cashFlows[0].date;
    const dayInYear = 365;

    // NPV 函数
    const npv = (rate: number): number => {
      let sum = 0;
      for (const cf of cashFlows) {
        const days = (cf.date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
        const years = days / dayInYear;
        sum += cf.amount / Math.pow(1 + rate, years);
      }
      return sum;
    };

    // NPV 导数
    const npvDerivative = (rate: number): number => {
      let sum = 0;
      for (const cf of cashFlows) {
        const days = (cf.date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
        const years = days / dayInYear;
        sum += -years * cf.amount / Math.pow(1 + rate, years + 1);
      }
      return sum;
    };

    // 牛顿迭代法求解
    let irr = 0.1; // 初始猜测值 10%
    for (let i = 0; i < 100; i++) {
      const npvValue = npv(irr);
      if (Math.abs(npvValue) < 1e-6) {
        break; // 收敛
      }
      const derivative = npvDerivative(irr);
      if (Math.abs(derivative) < 1e-10) {
        break;
      }
      irr = irr - npvValue / derivative;
    }

    return irr * 100; // 转换为百分比
  }

  /**
   * 获取IRR分析
   */
  async getIRRAnalysis(userId: string, portfolioId?: string): Promise<IRRAnalysis[]> {
    try {
      // 获取投资组合列表
      let portfolioQuery = `
        SELECT p.id, p.name
        FROM finapp.portfolios p
        WHERE p.user_id = $1::uuid
      `;

      const portfolioParams: any[] = [userId];
      if (portfolioId && portfolioId !== 'all') {
        portfolioQuery += ` AND p.id = $2::uuid`;
        portfolioParams.push(portfolioId);
      }

      portfolioQuery += ` ORDER BY p.created_at ASC`;

      const portfolios = await databaseService.executeRawQuery<any[]>(
        portfolioQuery,
        portfolioParams
      );

      const results: IRRAnalysis[] = [];

      for (const portfolio of portfolios) {
        try {
          // 获取现金流数据
          const cashFlowQuery = `
            SELECT 
              cf.flow_date as date,
              CASE 
                WHEN cf.flow_type = 'inflow' THEN -cf.amount
                ELSE cf.amount
              END as amount
            FROM finapp.cash_flows cf
            WHERE cf.portfolio_id = $1::uuid
            ORDER BY cf.flow_date ASC
          `;

          const cashFlows = await databaseService.executeRawQuery<any[]>(
            cashFlowQuery,
            [portfolio.id]
          );

          if (cashFlows.length < 2) {
            continue; // 需要至少2笔现金流
          }

          // 计算IRR
          const formattedCashFlows = cashFlows.map(cf => ({
            date: new Date(cf.date),
            amount: parseFloat(cf.amount)
          }));

          const irr = this.calculateIRR(formattedCashFlows);

          // 计算NPV（假设折现率为10%）
          const discountRate = 0.1;
          let npv = 0;
          const baseDate = formattedCashFlows[0].date;
          for (const cf of formattedCashFlows) {
            const days = (cf.date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
            const years = days / 365;
            npv += cf.amount / Math.pow(1 + discountRate, years);
          }

          // 计算总投资金额
          const totalInvestment = formattedCashFlows
            .filter(cf => cf.amount < 0) // inflow是负数
            .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);

          // 计算当前价值
          const currentValueQuery = `
            SELECT COALESCE(SUM(p.quantity * ap.close_price), 0) as current_value
            FROM finapp.positions p
            LEFT JOIN LATERAL (
              SELECT close_price
              FROM finapp.asset_prices
              WHERE asset_id = p.asset_id
              ORDER BY price_date DESC
              LIMIT 1
            ) ap ON true
            WHERE p.portfolio_id = $1::uuid
          `;

          const currentValueData = await databaseService.executeRawQuery<any[]>(
            currentValueQuery,
            [portfolio.id]
          );

          const currentValue = parseFloat(currentValueData[0]?.current_value || '0');

          // 计算风险等级（简化：基于收益率）
          let riskLevel: 'low' | 'medium' | 'high' = 'medium';
          if (irr < 5) {
            riskLevel = 'low';
          } else if (irr > 20) {
            riskLevel = 'high';
          }

          // 计算投资期间
          const daysDiff = (formattedCashFlows[formattedCashFlows.length - 1].date.getTime() - 
                           formattedCashFlows[0].date.getTime()) / (1000 * 60 * 60 * 24);
          const years = Math.floor(daysDiff / 365);
          const months = Math.floor((daysDiff % 365) / 30);
          const period = `${years}年${months}个月`;

          results.push({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            irr,
            npv,
            totalInvestment,
            currentValue,
            period,
            riskLevel
          });
        } catch (error) {
          console.error(`Failed to calculate IRR for portfolio ${portfolio.id}:`, error);
          // 继续处理其他投资组合
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to get IRR analysis:', error);
      return [];
    }
  }

  /**
   * 重新计算IRR
   */
  async recalculateIRR(userId: string, portfolioId?: string): Promise<IRRAnalysis[]> {
    // 这里可以添加缓存清除和重新计算的逻辑
    return this.getIRRAnalysis(userId, portfolioId);
  }

  /**
   * 获取自定义报表列表
   */
  async getCustomReports(userId: string): Promise<CustomReport[]> {
    try {
      const query = `
        SELECT 
          r.id,
          r.name,
          r.report_type as type,
          r.parameters->'dateRange' as date_range,
          r.parameters as filters,
          r.created_at,
          r.last_generated_at
        FROM finapp.reports r
        WHERE r.user_id = $1::uuid AND r.report_type != 'quarterly'
        ORDER BY r.created_at DESC
        LIMIT 50
      `;

      const results = await databaseService.executeRawQuery<any[]>(query, [userId]);

      return results.map(row => {
        const dateRange = row.date_range ? JSON.parse(row.date_range) : ['', ''];
        return {
          id: row.id,
          name: row.name,
          type: row.type,
          dateRange: dateRange,
          filters: row.filters ? JSON.parse(row.filters) : {},
          createdAt: new Date(row.created_at).toISOString(),
          lastRun: row.last_generated_at ? new Date(row.last_generated_at).toISOString() : ''
        };
      });
    } catch (error) {
      console.error('Failed to get custom reports:', error);
      return [];
    }
  }

  /**
   * 创建自定义报表
   */
  async createCustomReport(
    userId: string,
    data: {
      name: string;
      type: 'portfolio' | 'transaction' | 'performance' | 'risk';
      dateRange: [string, string];
      filters?: Record<string, any>;
    }
  ): Promise<CustomReport> {
    try {
      const reportId = uuidv4();
      const parameters = {
        dateRange: data.dateRange,
        ...data.filters
      };

      const insertQuery = `
        INSERT INTO finapp.reports (
          id, user_id, name, description, report_type, parameters,
          is_scheduled, is_active, created_at, updated_at
        ) VALUES (
          $1::uuid, $2::uuid, $3, $4, $5, $6::jsonb, $7, $8, $9::timestamp, $10::timestamp
        )
        RETURNING id, created_at, last_generated_at
      `;

      const result = await databaseService.executeRawQuery<any[]>(
        insertQuery,
        [
          reportId,
          userId,
          data.name,
          `Custom ${data.type} report`,
          data.type,
          JSON.stringify(parameters),
          false,
          true,
          new Date(),
          new Date()
        ]
      );

      return {
        id: reportId,
        name: data.name,
        type: data.type,
        dateRange: data.dateRange,
        filters: data.filters || {},
        createdAt: new Date().toISOString(),
        lastRun: ''
      };
    } catch (error) {
      console.error('Failed to create custom report:', error);
      throw error;
    }
  }

  /**
   * 运行自定义报表
   */
  async runCustomReport(userId: string, reportId: string): Promise<{ success: boolean; data?: any }> {
    try {
      // 更新最后运行时间
      const updateQuery = `
        UPDATE finapp.reports
        SET last_generated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid AND user_id = $2::uuid
      `;

      await databaseService.executeRawCommand(updateQuery, [reportId, userId]);

      // 获取报表数据并执行相应的查询
      // 这里简化实现，实际应该根据报表类型执行不同的查询
      return { success: true };
    } catch (error) {
      console.error('Failed to run custom report:', error);
      return { success: false };
    }
  }

  /**
   * 更新自定义报表
   */
  async updateCustomReport(
    userId: string,
    reportId: string,
    data: Partial<{
      name: string;
      type: string;
      dateRange: [string, string];
      filters: Record<string, any>;
    }>
  ): Promise<CustomReport> {
    try {
      const parameters = {
        dateRange: data.dateRange,
        ...data.filters
      };

      const updateQuery = `
        UPDATE finapp.reports
        SET name = COALESCE($3, name),
            report_type = COALESCE($4, report_type),
            parameters = COALESCE($5::jsonb, parameters),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid AND user_id = $2::uuid
        RETURNING id, name, report_type, parameters, created_at, last_generated_at
      `;

      const result = await databaseService.executeRawQuery<any[]>(
        updateQuery,
        [reportId, userId, data.name, data.type, JSON.stringify(parameters)]
      );

      if (result.length === 0) {
        throw new Error('Report not found');
      }

      const row = result[0];
      const parameters_obj = JSON.parse(row.parameters);

      return {
        id: row.id,
        name: row.name,
        type: row.report_type,
        dateRange: parameters_obj.dateRange || ['', ''],
        filters: parameters_obj,
        createdAt: new Date(row.created_at).toISOString(),
        lastRun: row.last_generated_at ? new Date(row.last_generated_at).toISOString() : ''
      };
    } catch (error) {
      console.error('Failed to update custom report:', error);
      throw error;
    }
  }

  /**
   * 删除自定义报表
   */
  async deleteCustomReport(userId: string, reportId: string): Promise<{ success: boolean }> {
    try {
      const deleteQuery = `
        DELETE FROM finapp.reports
        WHERE id = $1::uuid AND user_id = $2::uuid
      `;

      await databaseService.executeRawCommand(deleteQuery, [reportId, userId]);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete custom report:', error);
      return { success: false };
    }
  }

  /**
   * 获取报表详情
   */
  async getReportDetails(userId: string, reportId: string, type: 'quarterly' | 'custom'): Promise<any> {
    try {
      const query = `
        SELECT *
        FROM finapp.reports
        WHERE id = $1::uuid AND user_id = $2::uuid
      `;

      const results = await databaseService.executeRawQuery<any[]>(query, [reportId, userId]);

      if (results.length === 0) {
        throw new Error('Report not found');
      }

      return results[0];
    } catch (error) {
      console.error('Failed to get report details:', error);
      throw error;
    }
  }

  /**
   * 下载报表
   */
  async downloadReport(userId: string, reportId: string, type: 'quarterly' | 'custom'): Promise<Buffer> {
    try {
      const reportDetails = await this.getReportDetails(userId, reportId, type);
      
      // 返回 JSON 格式数据，让前端以 JSON 格式下载
      // 后续可以改为真实 PDF，但 JSON 格式对数据完整性更好
      const content = JSON.stringify(reportDetails, null, 2);
      return Buffer.from(content, 'utf-8');
    } catch (error) {
      console.error('Failed to download report:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
