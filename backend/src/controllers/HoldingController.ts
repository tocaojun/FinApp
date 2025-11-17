import { Response } from 'express';
import { HoldingService } from '../services/HoldingService';
import { positionService } from '../services/PositionService';
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

  // 获取理财产品持仓汇总 (兼容旧API)
  getWealthProductsSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const portfolioId = req.params.portfolioId;
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

      const summary = await positionService.getWealthProductsSummary(portfolioId);
      
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting wealth products summary:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get wealth products summary'
      });
    }
  };

  // 获取指定类别的持仓
  getPositionsByCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const portfolioId = req.params.portfolioId;
      const category = req.query.category as string;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!portfolioId || !category) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID and category are required'
        });
        return;
      }

      const positions = await positionService.getPositionsByCategory(portfolioId, category);
      
      res.status(200).json({
        success: true,
        data: positions
      });
    } catch (error) {
      console.error('Error getting positions by category:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get positions'
      });
    }
  };

  // 更新理财产品净值
  updateWealthProductNav = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const positionId = req.params.positionId;
      const { netAssetValue } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!positionId || !netAssetValue) {
        res.status(400).json({
          success: false,
          message: 'Position ID and net asset value are required'
        });
        return;
      }

      const position = await positionService.updateWealthProductNav(positionId, netAssetValue);
      
      res.status(200).json({
        success: true,
        data: position
      });
    } catch (error) {
      console.error('Error updating wealth product nav:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update nav'
      });
    }
  };

  // 更新理财产品余额
  updateWealthProductBalance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const positionId = req.params.positionId;
      const { balance } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!positionId || balance === undefined) {
        res.status(400).json({
          success: false,
          message: 'Position ID and balance are required'
        });
        return;
      }

      const position = await positionService.updateWealthProductBalance(positionId, balance, userId);
      
      res.status(200).json({
        success: true,
        data: position
      });
    } catch (error) {
      console.error('Error updating wealth product balance:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update balance'
      });
    }
  };

  // 获取余额历史记录
  getBalanceHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const positionId = req.params.positionId;
      const limit = parseInt(req.query.limit as string) || 50;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!positionId) {
        res.status(400).json({
          success: false,
          message: 'Position ID is required'
        });
        return;
      }

      const history = await positionService.getBalanceHistory(positionId, limit);
      
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error getting balance history:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get balance history'
      });
    }
  };

  // 获取投资组合余额历史汇总
  getPortfolioBalanceHistorySummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const portfolioId = req.params.portfolioId;
      const days = parseInt(req.query.days as string) || 30;
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

      const history = await positionService.getPortfolioBalanceHistorySummary(portfolioId, days);
      
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error getting portfolio balance history summary:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get balance history summary'
      });
    }
  };

  // 添加余额历史记录
  addBalanceHistoryRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const positionId = req.params.positionId;
      const { balance, change_type, notes, update_date } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!positionId || balance === undefined) {
        res.status(400).json({
          success: false,
          message: 'Position ID and balance are required'
        });
        return;
      }

      // 添加余额历史记录
      await positionService.addBalanceHistoryRecord(positionId, balance, change_type || 'MANUAL_UPDATE', userId, update_date, notes);
      
      res.status(200).json({
        success: true,
        message: 'Balance history record added successfully'
      });
    } catch (error) {
      console.error('Error adding balance history record:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add balance history record'
      });
    }
  };

  // 更新余额历史记录
  updateBalanceHistoryRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const recordId = req.params.recordId;
      const { balance, change_type, notes, update_date } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!recordId) {
        res.status(400).json({
          success: false,
          message: 'Record ID is required'
        });
        return;
      }

      await positionService.updateBalanceHistoryRecord(recordId, userId, {
        balance,
        change_type,
        notes,
        update_date
      });
      
      res.status(200).json({
        success: true,
        message: 'Balance history record updated successfully'
      });
    } catch (error) {
      console.error('Error updating balance history record:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update balance history record'
      });
    }
  };

  // 删除余额历史记录
  deleteBalanceHistoryRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const recordId = req.params.recordId;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!recordId) {
        res.status(400).json({
          success: false,
          message: 'Record ID is required'
        });
        return;
      }

      await positionService.deleteBalanceHistoryRecord(recordId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Balance history record deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting balance history record:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete balance history record'
      });
    }
  };
}