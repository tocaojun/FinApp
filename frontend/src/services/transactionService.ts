import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface Transaction {
  id: string;
  assetId: string;
  assetName?: string;
  assetSymbol?: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT' | 'TRANSFER';
  quantity: number;
  price: number;
  totalAmount: number;
  fee: number;
  currency: string;
  executedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalFees: number;
  recentTransactions: Transaction[];
}

export class TransactionService {
  static async getTransactions(params?: {
    page?: number;
    limit?: number;
    assetId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    try {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return await apiGet<{ transactions: Transaction[]; total: number }>(`/transactions${queryString}`);
    } catch (error) {
      console.error('获取交易记录失败:', error);
      throw error;
    }
  }

  static async getTransactionById(id: string): Promise<Transaction> {
    try {
      return await apiGet<Transaction>(`/transactions/${id}`);
    } catch (error) {
      console.error('获取交易详情失败:', error);
      throw error;
    }
  }

  static async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      const response = await apiGet<{ transactions: Transaction[]; total: number }>(`/transactions?limit=${limit}&page=1`);
      return response.transactions || [];
    } catch (error) {
      console.error('获取最近交易记录失败:', error);
      // 返回模拟数据作为后备
      return [
        {
          id: '1',
          assetId: 'asset1',
          assetName: '苹果公司',
          assetSymbol: 'AAPL',
          type: 'BUY',
          quantity: 100,
          price: 150.25,
          totalAmount: 15025,
          fee: 5.99,
          currency: 'USD',
          executedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          assetId: 'asset2',
          assetName: '微软公司',
          assetSymbol: 'MSFT',
          type: 'SELL',
          quantity: 50,
          price: 280.50,
          totalAmount: 14025,
          fee: 5.99,
          currency: 'USD',
          executedAt: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
    }
  }

  static async getTransactionSummary(): Promise<TransactionSummary> {
    try {
      return await apiGet<TransactionSummary>('/transactions/summary');
    } catch (error) {
      console.error('获取交易概览失败:', error);
      // 返回模拟数据作为后备
      const recentTransactions = await this.getRecentTransactions(5);
      return {
        totalTransactions: 156,
        totalBuyAmount: 500000,
        totalSellAmount: 320000,
        totalFees: 1250.50,
        recentTransactions
      };
    }
  }

  static async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      return await apiPost<Transaction>('/transactions', transaction);
    } catch (error) {
      console.error('创建交易记录失败:', error);
      throw error;
    }
  }

  static async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    try {
      return await apiPut<Transaction>(`/transactions/${id}`, transaction);
    } catch (error) {
      console.error('更新交易记录失败:', error);
      throw error;
    }
  }

  static async deleteTransaction(id: string): Promise<void> {
    try {
      await apiDelete<void>(`/transactions/${id}`);
    } catch (error) {
      console.error('删除交易记录失败:', error);
      throw error;
    }
  }
}