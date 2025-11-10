import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface Transaction {
  id: string;
  portfolioId: string;
  portfolioName?: string;
  tradingAccountId: string;
  assetId: string;
  assetName?: string;
  assetSymbol?: string;
  type?: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT' | 'TRANSFER';
  transactionType: string;  // 交易类型（后端主要字段）
  side?: string;  // 交易方向
  quantity: number;
  price: number;
  totalAmount: number;
  amount?: number;  // 兼容前端使用的 amount 字段
  fee: number;
  fees?: number;  // 兼容后端字段
  currency: string;
  transactionDate?: string | Date;  // 用户选择的交易日期（纯日期，必需）
  executedAt?: string | Date;  // 系统执行/更新的时刻（系统管理，对应数据库 executed_at）
  settledAt?: string | Date;  // 交易结算时刻（可选）
  notes?: string;
  tags: string[];  // 标签数组
  status?: string;  // 交易状态
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

export interface TransactionSummaryWithConversion {
  totalTransactions: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalFees: number;
  totalAmountInBaseCurrency: number;
  totalFeesInBaseCurrency: number;
  netCashFlow: number;
  currencyBreakdown: Array<{
    currency: string;
    totalAmount: number;
    totalFees: number;
    exchangeRate: number;
  }>;
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
      const response = await apiGet<{ success: boolean; data: { transactions: Transaction[]; total: number; page: number; limit: number }}>(`/transactions${queryString}`);
      // 后端返回格式: { success: true, data: { transactions: [...], total: ..., page: ..., limit: ... } }
      return response.data || { transactions: [], total: 0 };
    } catch (error) {
      console.error('获取交易记录失败:', error);
      throw error;
    }
  }

  static async getTransactionById(id: string): Promise<Transaction> {
    try {
      const response = await apiGet<{ success: boolean; data: Transaction }>(`/transactions/${id}`);
      return response.data || {} as Transaction;
    } catch (error) {
      console.error('获取交易详情失败:', error);
      throw error;
    }
  }

  static async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      const response = await apiGet<{ success: boolean; data: { transactions: Transaction[]; total: number }}>(`/transactions?limit=${limit}&page=1`);
      return response.data?.transactions || [];
    } catch (error) {
      console.error('获取最近交易记录失败:', error);
      // 返回空数组
      return [];
    }
  }

  static async getTransactionSummary(): Promise<TransactionSummary> {
    try {
      const response = await apiGet<{ success: boolean; data: TransactionSummary }>('/transactions/summary');
      return response.data || {
        totalTransactions: 0,
        totalBuyAmount: 0,
        totalSellAmount: 0,
        totalFees: 0,
        recentTransactions: []
      };
    } catch (error) {
      console.error('获取交易概览失败:', error);
      // 返回空数据
      return {
        totalTransactions: 0,
        totalBuyAmount: 0,
        totalSellAmount: 0,
        totalFees: 0,
        recentTransactions: []
      };
    }
  }

  static async getTransactionSummaryWithConversion(portfolioId?: string, baseCurrency: string = 'CNY'): Promise<TransactionSummaryWithConversion> {
    try {
      const params = new URLSearchParams();
      if (portfolioId) params.append('portfolioId', portfolioId);
      params.append('baseCurrency', baseCurrency);
      const queryString = params.toString() ? '?' + params.toString() : '';

      console.log('[TransactionService.getTransactionSummaryWithConversion] Calling API with URL:', `/transactions/summary/stats-with-conversion${queryString}`);
      const response = await apiGet<{ success: boolean; data: TransactionSummaryWithConversion }>(`/transactions/summary/stats-with-conversion${queryString}`);
      console.log('[TransactionService.getTransactionSummaryWithConversion] Full response:', response);
      console.log('[TransactionService.getTransactionSummaryWithConversion] Response type:', typeof response);
      console.log('[TransactionService.getTransactionSummaryWithConversion] Response keys:', Object.keys(response || {}));
      console.log('[TransactionService.getTransactionSummaryWithConversion] response.data:', response?.data);
      console.log('[TransactionService.getTransactionSummaryWithConversion] response.data type:', typeof response?.data);
      
      if (response && response.data) {
        console.log('[TransactionService.getTransactionSummaryWithConversion] Returning data:', {
          totalTransactions: response.data.totalTransactions,
          totalAmountInBaseCurrency: response.data.totalAmountInBaseCurrency,
          totalFeesInBaseCurrency: response.data.totalFeesInBaseCurrency
        });
        return response.data;
      } else {
        console.warn('[TransactionService.getTransactionSummaryWithConversion] response.data is falsy');
        console.warn('[TransactionService.getTransactionSummaryWithConversion] response:', response);
        return {
          totalTransactions: 0,
          totalBuyAmount: 0,
          totalSellAmount: 0,
          totalFees: 0,
          totalAmountInBaseCurrency: 0,
          totalFeesInBaseCurrency: 0,
          netCashFlow: 0,
          currencyBreakdown: []
        };
      }
    } catch (error) {
      console.error('[TransactionService.getTransactionSummaryWithConversion] API call failed:', error);
      // 返回空数据
      return {
        totalTransactions: 0,
        totalBuyAmount: 0,
        totalSellAmount: 0,
        totalFees: 0,
        totalAmountInBaseCurrency: 0,
        totalFeesInBaseCurrency: 0,
        netCashFlow: 0,
        currencyBreakdown: []
      };
    }
  }

  static async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const response = await apiPost<{ success: boolean; data: Transaction }>('/transactions', transaction);
      return response.data || {} as Transaction;
    } catch (error) {
      console.error('创建交易记录失败:', error);
      throw error;
    }
  }

  static async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await apiPut<{ success: boolean; data: Transaction }>(`/transactions/${id}`, transaction);
      return response.data || {} as Transaction;
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
