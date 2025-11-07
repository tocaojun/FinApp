import { Response } from 'express';
import { HoldingService } from '../services/HoldingService';
import { AuthenticatedRequest } from '../types/auth';

export class HoldingController {
  private holdingService: HoldingService;

  constructor() {
    this.holdingService = new HoldingService();
  }

  // 获取投资组合的所有持仓
  // 支持两种格式：
  // 1. GET /api/holdings?portfolioId=xxx
  // 2. GET /api/holdings/portfolio/:portfolioId
  getHoldingsByPortfolio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // 从路径参数或查询参数获取 portfolioId
      const portfolioId = req.params.portfolioId || req.query.portfolioId as string;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!portfolioId) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID is required'
        });
        return;
      }

      const holdings = await this.holdingService.getHoldingsByPortfolio(userId, portfolioId);
      
      res.status(200).json({
        success: true,
        data: holdings
      });
    } catch (error) {
      console.error('Error getting holdings by portfolio:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get holdings'
      });
    }
  };

  // 获取单个持仓详情
  getHoldingById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Holding ID is required'
        });
        return;
      }

      const holding = await this.holdingService.getHoldingById(userId, id);
      
      if (!holding) {
        res.status(404).json({
          success: false,
          message: 'Holding not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: holding
      });
    } catch (error) {
      console.error('Error getting holding by ID:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get holding'
      });
    }
  };

  // 获取投资组合持仓汇总
  getPortfolioHoldingSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // 从路径参数或查询参数获取 portfolioId
      const portfolioId = req.params.portfolioId || req.query.portfolioId as string;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!portfolioId) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID is required'
        });
        return;
      }

      const summary = await this.holdingService.getPortfolioHoldingSummary(userId, portfolioId);
      
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting portfolio holding summary:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get portfolio summary'
      });
    }
  };
}