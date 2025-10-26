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

  static async createTradingAccount(data: any): Promise<any> {
    try {
      console.log('PortfolioService.createTradingAccount 调用，数据:', data);
      const response = await apiPost<{success: boolean, message: string, data: any}>('/portfolios/accounts', data);
      console.log('PortfolioService.createTradingAccount 响应:', response);
      return response.data;
    } catch (error: any) {
      console.error('创建交易账户失败:', error);
      console.error('错误响应:', error.response);
      console.error('错误状态:', error.status);
      console.error('错误消息:', error.message);
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

  static async deleteTradingAccount(portfolioId: string, accountId: string): Promise<void> {
    try {
      console.log('PortfolioService.deleteTradingAccount 调用 - portfolioId:', portfolioId, 'accountId:', accountId);
      await apiDelete<void>(`/portfolios/${portfolioId}/accounts/${accountId}`);
      console.log('PortfolioService.deleteTradingAccount 成功');
    } catch (error: any) {
      console.error('删除交易账户失败:', error);
      console.error('错误响应:', error.response);
      console.error('错误消息:', error.message);
      throw error;
    }
  }

  static async updatePortfolioSortOrder(portfolioOrders: { id: string; sortOrder: number }[]): Promise<void> {
    try {
      await apiPut<void>('/portfolios/sort-order', { portfolioOrders });
    } catch (error) {
      console.error('更新投资组合排序失败:', error);
      throw error;
    }
  }
}