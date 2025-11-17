import { apiGet, apiPost, apiPut, apiDelete } from './api';

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
  
  // 理财产品相关字段
  productMode?: 'QUANTITY' | 'BALANCE';
  netAssetValue?: number; // 净值型产品的单位净值
  balance?: number; // 余额型产品的余额
  lastNavUpdate?: string; // 最后净值更新时间
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

  // 更新理财产品净值
  static async updateWealthProductNav(holdingId: string, netAssetValue: number): Promise<void> {
    await apiPost(`/holdings/${holdingId}/update-nav`, {
      netAssetValue
    });
  }

  // 更新理财产品余额
  static async updateWealthProductBalance(holdingId: string, balance: number): Promise<void> {
    await apiPost(`/holdings/${holdingId}/update-balance`, {
      balance
    });
  }

  // 获取余额历史记录
  static async getBalanceHistory(holdingId: string, limit: number = 50): Promise<any[]> {
    const response = await apiGet<ApiResponse<any[]>>(`/holdings/${holdingId}/balance-history?limit=${limit}`);
    return response.data;
  }

  // 获取投资组合余额历史汇总
  static async getPortfolioBalanceHistorySummary(portfolioId: string, days: number = 30): Promise<any[]> {
    const response = await apiGet<ApiResponse<any[]>>(`/holdings/portfolio/${portfolioId}/balance-history-summary?days=${days}`);
    return response.data;
  }

  // 添加余额历史记录
  static async addBalanceHistoryRecord(holdingId: string, data: {
    balance: number;
    change_type: string;
    notes?: string;
    update_date?: string; // 余额对应的业务日期
  }): Promise<void> {
    await apiPost(`/holdings/${holdingId}/balance-history`, data);
  }

  // 更新余额历史记录
  static async updateBalanceHistoryRecord(recordId: string, data: {
    balance?: number;
    change_type?: string;
    notes?: string;
    update_date?: string; // 余额对应的业务日期
  }): Promise<void> {
    await apiPut(`/holdings/balance-history/${recordId}`, data);
  }

  // 删除余额历史记录
  static async deleteBalanceHistoryRecord(recordId: string): Promise<void> {
    await apiDelete(`/holdings/balance-history/${recordId}`);
  }
}