import { Request, Response } from 'express';
import { portfolioService } from '../services/PortfolioService';
import { AuthenticatedRequest } from '../types/auth';
import { 
  CreatePortfolioRequest, 
  UpdatePortfolioRequest,
  CreateTradingAccountRequest,
  UpdateTradingAccountRequest,
  CreateAssetRequest,
  UpdateAssetRequest
} from '../types/portfolio';

export class PortfolioController {
  // 创建投资组合
  async createPortfolio(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const data: CreatePortfolioRequest = req.body;
      
      // 验证必填字段
      if (!data.name) {
        res.status(400).json({
          success: false,
          message: 'Portfolio name is required'
        });
        return;
      }

      const portfolio = await portfolioService.createPortfolio(userId, data);
      
      res.status(201).json({
        success: true,
        message: 'Portfolio created successfully',
        data: portfolio
      });
    } catch (error) {
      console.error('Create portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create portfolio',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取用户的所有投资组合
  async getPortfolios(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const portfolios = await portfolioService.getPortfoliosByUserId(userId);
      
      res.json({
        success: true,
        message: 'Portfolios retrieved successfully',
        data: portfolios
      });
    } catch (error) {
      console.error('Get portfolios error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve portfolios',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取单个投资组合
  async getPortfolio(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID is required'
        });
        return;
      }

      const portfolio = await portfolioService.getPortfolioById(userId, id);
      
      if (!portfolio) {
        res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Portfolio retrieved successfully',
        data: portfolio
      });
    } catch (error) {
      console.error('Get portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve portfolio',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 更新投资组合
  async updatePortfolio(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID is required'
        });
        return;
      }

      const data: UpdatePortfolioRequest = req.body;
      
      const portfolio = await portfolioService.updatePortfolio(userId, id, data);
      
      if (!portfolio) {
        res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Portfolio updated successfully',
        data: portfolio
      });
    } catch (error) {
      console.error('Update portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update portfolio',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 删除投资组合
  async deletePortfolio(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID is required'
        });
        return;
      }

      const deleted = await portfolioService.deletePortfolio(userId, id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Portfolio deleted successfully'
      });
    } catch (error) {
      console.error('Delete portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete portfolio',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 更新投资组合排序
  async updatePortfolioSortOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { portfolioOrders } = req.body;
      if (!Array.isArray(portfolioOrders)) {
        res.status(400).json({
          success: false,
          message: 'Portfolio orders must be an array'
        });
        return;
      }

      // 验证数据格式
      for (const order of portfolioOrders) {
        if (!order.id || typeof order.sortOrder !== 'number') {
          res.status(400).json({
            success: false,
            message: 'Each portfolio order must have id and sortOrder'
          });
          return;
        }
      }

      const success = await portfolioService.updatePortfolioSortOrder(userId, portfolioOrders);
      
      if (!success) {
        res.status(500).json({
          success: false,
          message: 'Failed to update portfolio sort order'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Portfolio sort order updated successfully'
      });
    } catch (error) {
      console.error('Update portfolio sort order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update portfolio sort order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取所有投资组合的汇总统计
  async getAllPortfoliosSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // 获取用户所有投资组合
      const portfolios = await portfolioService.getPortfoliosByUserId(userId);
      
      // 计算汇总统计 - 使用真实数据库数据
      const totalValue = portfolios.reduce((sum, p) => sum + (p.totalValue || 0), 0);
      const totalCost = portfolios.reduce((sum, p) => sum + (p.totalCost || 0), 0);
      const totalReturn = portfolios.reduce((sum, p) => sum + (p.totalGainLoss || 0), 0);
      
      // 计算今日收益 - 基于实际持仓变化，如果没有今日数据则为0
      const todayChange = portfolios.reduce((sum, p) => {
        // 这里应该从持仓表或价格变化表获取今日变化，暂时使用0
        return sum + 0;
      }, 0);
      
      // 计算今日收益率
      const todayChangePercent = totalValue > 0 ? (todayChange / totalValue) * 100 : 0;
      
      const summary = {
        totalAssets: portfolios.length,
        totalValue: totalValue,
        todayChange: todayChange,
        todayChangePercent: todayChangePercent,
        totalReturn: totalReturn,
        totalReturnPercent: totalCost > 0 ? (totalReturn / totalCost) * 100 : 0
      };

      res.json({
        success: true,
        message: 'Portfolio summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      console.error('Get all portfolios summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve portfolio summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取投资组合摘要
  async getPortfolioSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID is required'
        });
        return;
      }

      const summary = await portfolioService.getPortfolioSummary(userId, id);
      
      if (!summary) {
        res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Portfolio summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      console.error('Get portfolio summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve portfolio summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 创建交易账户
  async createTradingAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      console.log('收到创建交易账户请求:', req.body); // 调试日志
      const data: CreateTradingAccountRequest = req.body;
      const { portfolioId } = data;
      
      if (!portfolioId) {
        console.log('portfolioId 缺失'); // 调试日志
        res.status(400).json({
          success: false,
          message: 'Portfolio ID is required'
        });
        return;
      }
      
      console.log('调用 portfolioService.createTradingAccount, userId:', userId, 'portfolioId:', portfolioId); // 调试日志
      const account = await portfolioService.createTradingAccount(userId, portfolioId, data);
      
      res.status(201).json({
        success: true,
        message: 'Trading account created successfully',
        data: account
      });
    } catch (error) {
      console.error('Create trading account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create trading account',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取交易账户列表
  async getTradingAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { portfolioId } = req.params;
      if (!portfolioId) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID is required'
        });
        return;
      }

      const accounts = await portfolioService.getTradingAccounts(userId, portfolioId);
      
      // 设置正确的字符编码
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      res.json({
        success: true,
        message: 'Trading accounts retrieved successfully',
        data: accounts
      });
    } catch (error) {
      console.error('Get trading accounts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trading accounts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 更新交易账户
  async updateTradingAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { portfolioId, accountId } = req.params;
      if (!portfolioId || !accountId) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID and Account ID are required'
        });
        return;
      }

      const data = req.body;
      
      const account = await portfolioService.updateTradingAccount(userId, portfolioId, accountId, data);
      
      if (!account) {
        res.status(404).json({
          success: false,
          message: 'Trading account not found'
        });
        return;
      }

      // 设置正确的字符编码
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      res.json({
        success: true,
        message: 'Trading account updated successfully',
        data: account
      });
    } catch (error) {
      console.error('Update trading account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update trading account',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 删除交易账户
  async deleteTradingAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { portfolioId, accountId } = req.params;
      if (!portfolioId || !accountId) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID and Account ID are required'
        });
        return;
      }

      console.log('删除交易账户请求 - userId:', userId, 'portfolioId:', portfolioId, 'accountId:', accountId);
      
      const deleted = await portfolioService.deleteTradingAccount(userId, portfolioId, accountId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Trading account not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Trading account deleted successfully'
      });
    } catch (error) {
      console.error('Delete trading account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete trading account',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取资产列表
  async getAssets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { portfolioId } = req.params;
      if (!portfolioId) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID is required'
        });
        return;
      }

      // 简单返回空数组，实际实现需要从数据库获取
      res.json({
        success: true,
        message: 'Assets retrieved successfully',
        data: []
      });
    } catch (error) {
      console.error('Get assets error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve assets',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 创建资产
  async createAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { portfolioId } = req.params;
      if (!portfolioId) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID is required'
        });
        return;
      }

      const data: CreateAssetRequest = req.body;
      
      const asset = await portfolioService.createAsset(userId, portfolioId, data);
      
      res.status(201).json({
        success: true,
        message: 'Asset created successfully',
        data: asset
      });
    } catch (error) {
      console.error('Create asset error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create asset',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取单个资产
  async getAssetById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { portfolioId, assetId } = req.params;
      if (!portfolioId || !assetId) {
        res.status(400).json({
          success: false,
          message: 'Portfolio ID and Asset ID are required'
        });
        return;
      }

      // 简单返回 null，实际实现需要从数据库获取
      res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    } catch (error) {
      console.error('Get asset error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve asset',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取用户所有交易账户
  async getAllTradingAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const accounts = await portfolioService.getAllTradingAccounts(userId);

      res.json({
        success: true,
        message: 'All trading accounts retrieved successfully',
        data: accounts
      });
    } catch (error) {
      console.error('Get all trading accounts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve all trading accounts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 货币转换
  async convertCurrency(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { amount, from, to } = req.body;
      
      if (!amount || !from || !to) {
        res.status(400).json({
          success: false,
          message: 'Amount, from currency, and to currency are required'
        });
        return;
      }

      // 简单的汇率转换逻辑
      const exchangeRates: Record<string, number> = {
        'USD': 1.0,
        'EUR': 0.85,
        'GBP': 0.73,
        'JPY': 110.0,
        'CNY': 6.45,
        'HKD': 7.8
      };

      const fromRate = exchangeRates[from] || 1;
      const toRate = exchangeRates[to] || 1;
      const convertedAmount = (amount / fromRate) * toRate;

      res.json({
        success: true,
        message: 'Currency converted successfully',
        data: {
          originalAmount: amount,
          fromCurrency: from,
          toCurrency: to,
          convertedAmount: convertedAmount,
          exchangeRate: toRate / fromRate
        }
      });
    } catch (error) {
      console.error('Convert currency error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to convert currency',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const portfolioController = new PortfolioController();