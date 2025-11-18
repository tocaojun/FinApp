import { Request, Response } from 'express';
import { DepositService, DepositDetails, MaturityAlert } from '../services/DepositService';
import { databaseService } from '../services/DatabaseService';
import { AuthenticatedRequest } from '../types/auth';

export class DepositController {
  private depositService: DepositService;

  constructor() {
    this.depositService = new DepositService(databaseService);
  }

  /**
   * 获取存款产品列表
   */
  getDepositProducts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bank, depositType, minRate, maxRate } = req.query;

      let whereConditions = ['is_active = true'];
      const params: any[] = [];
      let paramIndex = 1;

      if (bank) {
        whereConditions.push(`bank_name ILIKE $${paramIndex++}`);
        params.push(`%${bank}%`);
      }

      if (depositType) {
        whereConditions.push(`deposit_type = $${paramIndex++}`);
        params.push(depositType);
      }

      if (minRate) {
        whereConditions.push(`interest_rate >= $${paramIndex++}`);
        params.push(parseFloat(minRate as string) / 100);
      }

      if (maxRate) {
        whereConditions.push(`interest_rate <= $${paramIndex++}`);
        params.push(parseFloat(maxRate as string) / 100);
      }

      const query = `
        SELECT * FROM finapp.deposit_products_summary
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY bank_name, deposit_type, term_months NULLS FIRST
      `;

      const result = await databaseService.prisma.$queryRawUnsafe(query, ...params) as any[];

      const products = result.map(row => ({
        assetId: row.asset_id,
        symbol: row.symbol,
        productName: row.product_name,
        currency: row.currency,
        depositType: row.deposit_type,
        bankName: row.bank_name,
        interestRate: parseFloat(row.interest_rate),
        interestRatePercent: parseFloat(row.interest_rate) * 100,
        rateType: row.rate_type,
        termMonths: row.term_months,
        maturityDate: row.maturity_date,
        autoRenewal: row.auto_renewal,
        earlyWithdrawalAllowed: row.early_withdrawal_allowed,
        earlyWithdrawalPenaltyRate: row.early_withdrawal_penalty_rate ? parseFloat(row.early_withdrawal_penalty_rate) : null,
        minDepositAmount: row.min_deposit_amount ? parseFloat(row.min_deposit_amount) : null,
        maxDepositAmount: row.max_deposit_amount ? parseFloat(row.max_deposit_amount) : null,
        depositInsuranceCovered: row.deposit_insurance_covered,
        insuranceAmount: row.insurance_amount ? parseFloat(row.insurance_amount) : null,
        effectiveAnnualRatePercent: parseFloat(row.effective_annual_rate_percent),
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.details_updated_at
      }));

      res.json({
        success: true,
        data: products,
        pagination: {
          total: products.length,
          page: 1,
          limit: products.length,
          totalPages: 1
        }
      });
    } catch (error) {
      console.error('Error fetching deposit products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch deposit products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * 获取存款产品详情
   */
  getDepositDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assetId } = req.params;

      const details = await this.depositService.getDepositDetails(assetId);
      if (!details) {
        res.status(404).json({
          success: false,
          message: 'Deposit product not found'
        });
        return;
      }

      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      console.error('Error fetching deposit details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch deposit details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * 创建存款产品详情
   */
  createDepositDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const details: DepositDetails = req.body;

      // 验证必填字段
      if (!details.assetId || !details.bankName || !details.depositType || details.interestRate === undefined) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: assetId, bankName, depositType, interestRate'
        });
        return;
      }

      const createdDetails = await this.depositService.createDepositDetails(details);

      res.status(201).json({
        success: true,
        data: createdDetails
      });
    } catch (error) {
      console.error('Error creating deposit details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create deposit details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * 更新存款产品详情
   */
  updateDepositDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assetId } = req.params;
      const updates: Partial<DepositDetails> = req.body;

      // 验证assetId
      if (!assetId) {
        res.status(400).json({
          success: false,
          message: 'Asset ID is required'
        });
        return;
      }

      const updatedDetails = await this.depositService.updateDepositDetails(assetId, updates);

      if (!updatedDetails) {
        res.status(404).json({
          success: false,
          message: 'Deposit details not found'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedDetails
      });
    } catch (error) {
      console.error('Error updating deposit details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update deposit details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * 获取用户存款持仓
   */
  getUserDepositPositions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('获取存款持仓 - 开始处理请求');
      console.log('Request user:', req.user);
      console.log('Query params:', req.query);
      
      const userId = req.user?.id;
      if (!userId) {
        console.error('用户未认证 - req.user:', req.user);
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { portfolioId } = req.query;
      console.log('获取存款持仓 - userId:', userId, 'portfolioId:', portfolioId);

      const positions = await this.depositService.getUserDepositPositions(
        userId,
        portfolioId as string
      );

      console.log('获取存款持仓 - 成功，返回', positions.length, '条记录');
      res.json({
        success: true,
        data: positions
      });
    } catch (error) {
      console.error('获取用户存款持仓失败:', error);
      console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        success: false,
        message: 'Failed to fetch deposit positions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * 计算存款利息
   */
  calculateInterest = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { positionId } = req.params;
      const { calculationDate, calculationMethod } = req.body;

      const calculation = await this.depositService.calculateInterest(
        positionId,
        new Date(calculationDate),
        calculationMethod || 'ACTUAL_365'
      );

      if (!calculation) {
        res.status(404).json({
          success: false,
          message: 'Position not found'
        });
        return;
      }

      res.json({
        success: true,
        data: calculation
      });
    } catch (error) {
      console.error('Error calculating interest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate interest',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * 记录利息计算
   */
  recordInterest = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const calculation = req.body;

      const recordId = await this.depositService.recordInterestCalculation(calculation);

      res.json({
        success: true,
        data: { id: recordId }
      });
    } catch (error) {
      console.error('Error recording interest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record interest',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * 获取即将到期的存款
   */
  getUpcomingMaturityDeposits = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { daysAhead = 30 } = req.query;

      const deposits = await this.depositService.getUpcomingMaturityDeposits(
        userId,
        parseInt(daysAhead as string)
      );

      res.json({
        success: true,
        data: deposits
      });
    } catch (error) {
      console.error('Error fetching upcoming maturity deposits:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming maturity deposits',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * 创建到期提醒
   */
  createMaturityAlert = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const alert: MaturityAlert = {
        ...req.body,
        userId
      };

      const alertId = await this.depositService.createMaturityAlert(alert);

      res.status(201).json({
        success: true,
        data: { id: alertId }
      });
    } catch (error) {
      console.error('Error creating maturity alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create maturity alert',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * 处理定期存款到期
   */
  processMaturity = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { positionId } = req.params;
      const { action, newTermMonths } = req.body;

      if (!['RENEW', 'TRANSFER_TO_DEMAND', 'WITHDRAW'].includes(action)) {
        res.status(400).json({
          success: false,
          message: 'Invalid action. Must be RENEW, TRANSFER_TO_DEMAND, or WITHDRAW'
        });
        return;
      }

      await this.depositService.processMaturity(positionId, action, newTermMonths);

      res.json({
        success: true,
        message: 'Maturity processed successfully'
      });
    } catch (error) {
      console.error('Error processing maturity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process maturity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * 获取存款统计信息
   */
  getDepositStatistics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const query = `
        SELECT 
          COUNT(*) as total_deposits,
          SUM(COALESCE(pos.balance, 0)) as total_balance,
          AVG(dd.interest_rate) * 100 as average_interest_rate,
          COUNT(CASE WHEN dd.deposit_type = 'DEMAND' THEN 1 END) as demand_deposits,
          COUNT(CASE WHEN dd.deposit_type = 'TIME' THEN 1 END) as time_deposits,
          COUNT(CASE WHEN dd.maturity_date <= CURRENT_DATE + INTERVAL '30 days' AND dd.maturity_date >= CURRENT_DATE THEN 1 END) as maturing_soon
        FROM finapp.positions pos
        JOIN finapp.portfolios p ON pos.portfolio_id = p.id
        JOIN finapp.assets a ON pos.asset_id = a.id
        JOIN finapp.asset_types at ON a.asset_type_id = at.id
        JOIN finapp.deposit_details dd ON a.id = dd.asset_id
        WHERE p.user_id = $1::uuid AND at.code = 'DEPOSIT'
      `;

      const result = await databaseService.prisma.$queryRawUnsafe(query, userId) as any[];

      const stats = result[0] || {};

      res.json({
        success: true,
        data: {
          totalDeposits: parseInt(stats.total_deposits) || 0,
          totalBalance: parseFloat(stats.total_balance) || 0,
          averageInterestRate: parseFloat(stats.average_interest_rate) || 0,
          demandDeposits: parseInt(stats.demand_deposits) || 0,
          timeDeposits: parseInt(stats.time_deposits) || 0,
          maturingSoon: parseInt(stats.maturing_soon) || 0
        }
      });
    } catch (error) {
      console.error('Error fetching deposit statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch deposit statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
