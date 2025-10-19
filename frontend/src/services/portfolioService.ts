import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { Portfolio } from '../types/portfolio';

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
      const response = await apiGet<{success: boolean, message: string, data: Portfolio[]}>('/portfolios');
      return response.data || [];
    } catch (error) {
      console.error('获取投资组合失败:', error);
      throw error;
    }
  }

  static async getPortfolioById(id: string): Promise<Portfolio> {
    try {
      const response = await apiGet<{success: boolean, message: string, data: Portfolio}>(`/portfolios/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取投资组合详情失败:', error);
      throw error;
    }
  }

  static async getPortfolioSummaryById(id: string): Promise<any> {
    try {
      const response = await apiGet<{success: boolean, message: string, data: any}>(`/portfolios/${id}/summary`);
      return response.data;
    } catch (error) {
      console.error('获取投资组合汇总失败:', error);
      throw error;
    }
  }

  static async getPortfolioSummary(): Promise<PortfolioSummary> {
    try {
      const response = await apiGet<{success: boolean, message: string, data: PortfolioSummary}>('/portfolios/summary');
      return response.data;
    } catch (error) {
      console.error('获取投资组合概览失败:', error);
      throw error;
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

  static async getTradingAccounts(portfolioId: string): Promise<any[]> {
    try {
      const response = await apiGet<{success: boolean, message: string, data: any[]}>(`/portfolios/${portfolioId}/accounts`);
      return response.data || [];
    } catch (error) {
      console.error('获取交易账户失败:', error);
      throw error;
    }
  }

  static async updateTradingAccount(portfolioId: string, accountId: string, data: any): Promise<any> {
    try {
      const response = await apiPut<{success: boolean, message: string, data: any}>(`/portfolios/${portfolioId}/accounts/${accountId}`, data);
      return response.data;
    } catch (error) {
      console.error('更新交易账户失败:', error);
      throw error;
    }
  }
}