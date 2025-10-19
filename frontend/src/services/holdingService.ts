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
  currency: string;
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
}