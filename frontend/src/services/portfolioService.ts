import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  returnRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  totalAssets: number;
  totalValue: number;
  todayChange: number;
  todayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export class PortfolioService {
  static async getPortfolios(): Promise<Portfolio[]> {
    try {
      return await apiGet<Portfolio[]>('/portfolios');
    } catch (error) {
      console.error('获取投资组合失败:', error);
      throw error;
    }
  }

  static async getPortfolioById(id: string): Promise<Portfolio> {
    try {
      return await apiGet<Portfolio>(`/portfolios/${id}`);
    } catch (error) {
      console.error('获取投资组合详情失败:', error);
      throw error;
    }
  }

  static async getPortfolioSummary(): Promise<PortfolioSummary> {
    try {
      return await apiGet<PortfolioSummary>('/portfolios/summary');
    } catch (error) {
      console.error('获取投资组合概览失败:', error);
      // 返回模拟数据作为后备
      return {
        totalAssets: 5,
        totalValue: 1234567.89,
        todayChange: 12345.67,
        todayChangePercent: 1.02,
        totalReturn: 234567.89,
        totalReturnPercent: 23.45
      };
    }
  }

  static async createPortfolio(portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>): Promise<Portfolio> {
    try {
      return await apiPost<Portfolio>('/portfolios', portfolio);
    } catch (error) {
      console.error('创建投资组合失败:', error);
      throw error;
    }
  }

  static async updatePortfolio(id: string, portfolio: Partial<Portfolio>): Promise<Portfolio> {
    try {
      return await apiPut<Portfolio>(`/portfolios/${id}`, portfolio);
    } catch (error) {
      console.error('更新投资组合失败:', error);
      throw error;
    }
  }

  static async deletePortfolio(id: string): Promise<void> {
    try {
      await apiDelete<void>(`/portfolios/${id}`);
    } catch (error) {
      console.error('删除投资组合失败:', error);
      throw error;
    }
  }
}