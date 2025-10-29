import { apiGet } from './api';

export interface Holding {
  id: string;
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  assetType: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  currency: string; // 资产币种
  portfolioCurrency?: string; // 投资组合基础币种
  exchangeRate?: number; // 汇率
  convertedMarketValue?: number; // 转换后的市值
  convertedTotalCost?: number; // 转换后的总成本
  convertedUnrealizedPnL?: number; // 转换后的未实现盈亏
  firstPurchaseDate?: string;
  lastTransactionDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  assetCount: number;
  currency: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class HoldingService {
  // 获取投资组合的所有持仓
  static async getHoldingsByPortfolio(portfolioId: string): Promise<Holding[]> {
    const response = await apiGet<ApiResponse<Holding[]>>(`/holdings/portfolio/${portfolioId}`);
    return response.data;
  }

  // 获取单个持仓详情
  static async getHoldingById(holdingId: string): Promise<Holding> {
    const response = await apiGet<ApiResponse<Holding>>(`/holdings/${holdingId}`);
    return response.data;
  }

  // 获取投资组合持仓汇总
  static async getPortfolioHoldingSummary(portfolioId: string): Promise<HoldingSummary> {
    const response = await apiGet<ApiResponse<HoldingSummary>>(`/holdings/portfolio/${portfolioId}/summary`);
    return response.data;
  }

  // 获取用户所有投资组合的持仓资产总数
  static async getUserTotalHoldingAssets(): Promise<number> {
    try {
      // 先获取用户的所有投资组合
      const portfoliosResponse = await apiGet<ApiResponse<any[]>>('/portfolios');
      const portfolios = portfoliosResponse.data || [];
      
      // 获取所有投资组合的持仓，并统计唯一资产数量
      const allHoldings: Holding[] = [];
      const uniqueAssetIds = new Set<string>();
      
      for (const portfolio of portfolios) {
        try {
          const holdings = await this.getHoldingsByPortfolio(portfolio.id);
          allHoldings.push(...holdings);
          
          // 统计唯一的资产ID
          holdings.forEach(holding => {
            if (holding.isActive && holding.quantity > 0) {
              uniqueAssetIds.add(holding.assetId);
            }
          });
        } catch (error) {
          console.warn(`获取投资组合 ${portfolio.id} 持仓失败:`, error);
          // 继续处理其他投资组合
        }
      }
      
      return uniqueAssetIds.size;
    } catch (error) {
      console.error('获取用户持仓资产总数失败:', error);
      return 0;
    }
  }
}