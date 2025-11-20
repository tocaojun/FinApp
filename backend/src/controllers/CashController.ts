import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { CashService } from '../services/CashService';
import { logger } from '../utils/logger';

/**
 * 现金管理控制器
 * 处理现金账户余额、交易记录、资金冻结等操作
 */
export class CashController {
  private cashService: CashService;

  constructor() {
    this.cashService = new CashService();
  }

  /**
   * 获取现金账户汇总信息
   * GET /api/cash/summary
   */
  public async getCashSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const summary = await this.cashService.getCashSummary(userId);
      
      res.json({
        success: true,
        message: '获取现金汇总信息成功',
        data: summary
      });
    } catch (error) {
      logger.error('获取现金汇总信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取现金汇总信息失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取各交易账户的现金余额
   * GET /api/cash/balances?portfolio_id=xxx
   */
  public async getCashBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const portfolioId = req.query.portfolio_id as string;
      const balances = await this.cashService.getCashBalances(userId, portfolioId);
      
      res.json({
        success: true,
        message: '获取现金余额成功',
        data: balances
      });
    } catch (error) {
      logger.error('获取现金余额失败:', error);
      res.status(500).json({
        success: false,
        message: '获取现金余额失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取现金交易记录
   * GET /api/cash/transactions?account_id=xxx&page=1&limit=20&start_date=xxx&end_date=xxx
   */
  public async getCashTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const accountId = req.query.account_id as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;

      const result = await this.cashService.getCashTransactions(userId, accountId, limit, offset);
      
      res.json({
        success: true,
        message: '获取现金交易记录成功',
        data: result
      });
    } catch (error) {
      logger.error('获取现金交易记录失败:', error);
      res.status(500).json({
        success: false,
        message: '获取现金交易记录失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 创建现金交易记录（充值、提现等）
   * POST /api/cash/transactions
   */
  public async createCashTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const result = await this.cashService.createCashTransaction(userId, req.body);
      
      res.status(201).json({
        success: true,
        message: '创建现金交易记录成功',
        data: result
      });
    } catch (error) {
      logger.error('创建现金交易记录失败:', error);
      res.status(500).json({
        success: false,
        message: '创建现金交易记录失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 冻结资金
   * POST /api/cash/freeze
   */
  public async freezeFunds(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const { tradingAccountId, amount, description } = req.body;
      
      if (!tradingAccountId || !amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: '请提供有效的账户ID和冻结金额'
        });
        return;
      }

      await this.cashService.freezeOrUnfreezeFunds(userId, tradingAccountId, amount, true, description);
      
      res.json({
        success: true,
        message: '资金冻结成功'
      });
    } catch (error) {
      logger.error('资金冻结失败:', error);
      res.status(500).json({
        success: false,
        message: '资金冻结失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 解冻资金
   * POST /api/cash/unfreeze
   */
  public async unfreezeFunds(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const { tradingAccountId, amount, description } = req.body;
      
      if (!tradingAccountId || !amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: '请提供有效的账户ID和解冻金额'
        });
        return;
      }

      await this.cashService.freezeOrUnfreezeFunds(userId, tradingAccountId, amount, false, description);
      
      res.json({
        success: true,
        message: '资金解冻成功'
      });
    } catch (error) {
      logger.error('资金解冻失败:', error);
      res.status(500).json({
        success: false,
        message: '资金解冻失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}

// 导出控制器实例
export const cashController = new CashController();