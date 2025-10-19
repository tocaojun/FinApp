import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface TradingAccount {
  id: string;
  portfolioId: string;
  name: string;
  accountType: string;
  brokerName?: string;
  accountNumber?: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTradingAccountRequest {
  portfolioId: string;
  name: string;
  accountType: string;
  brokerName?: string;
  accountNumber?: string;
  currency?: string;
  balance?: number;
  availableBalance?: number;
}

export interface UpdateTradingAccountRequest {
  name?: string;
  accountType?: string;
  brokerName?: string;
  accountNumber?: string;
  currency?: string;
  balance?: number;
  availableBalance?: number;
}

export class TradingAccountService {
  /**
   * 获取指定投资组合的交易账户列表
   */
  static async getTradingAccounts(portfolioId: string): Promise<TradingAccount[]> {
    try {
      const response = await apiGet<{success: boolean, message: string, data: TradingAccount[]}>(`/portfolios/${portfolioId}/accounts`);
      return response.data || [];
    } catch (error) {
      console.error('获取交易账户失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有交易账户（跨投资组合）
   */
  static async getAllTradingAccounts(): Promise<TradingAccount[]> {
    try {
      const response = await apiGet<{success: boolean, message: string, data: TradingAccount[]}>('/trading-accounts');
      return response.data || [];
    } catch (error) {
      console.error('获取所有交易账户失败:', error);
      throw error;
    }
  }

  /**
   * 创建交易账户
   */
  static async createTradingAccount(account: CreateTradingAccountRequest): Promise<TradingAccount> {
    try {
      const response = await apiPost<{success: boolean, message: string, data: TradingAccount}>('/portfolios/accounts', account);
      return response.data;
    } catch (error) {
      console.error('创建交易账户失败:', error);
      throw error;
    }
  }
}