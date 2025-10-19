import { apiRequest } from './api';

// 交易相关的 API 接口
export interface Transaction {
  id: string;
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  transactionType: string;
  side: string;
  quantity: number;
  price: number;
  totalAmount: number;
  fees: number;
  currency: string;
  executedAt: string;
  notes?: string;
  tags: string[];
  status: string;
  portfolioName?: string;
  assetName?: string;
  assetSymbol?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilter {
  portfolioId?: string;
  tradingAccountId?: string;
  assetId?: string;
  transactionType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'ASC' | 'DESC';
}

export interface TransactionSummary {
  totalTransactions: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalFees: number;
  netCashFlow: number;
  transactionsByType: Array<{
    type: string;
    count: number;
    amount: number;
  }>;
  transactionsByMonth: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
}

// 获取交易记录列表
export const getTransactions = async (filter: TransactionFilter = {}): Promise<{
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await apiRequest<{
    success: boolean;
    data: {
      transactions: Transaction[];
      total: number;
      page: number;
      limit: number;
    };
  }>(`/transactions?${queryParams.toString()}`);
  
  return response.data;
};

// 创建交易记录
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Transaction> => {
  const response = await apiRequest<{
    success: boolean;
    data: Transaction;
  }>('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  });
  
  return response.data;
};

// 获取交易汇总统计
export const getTransactionSummary = async (portfolioId?: string): Promise<TransactionSummary> => {
  const queryParams = portfolioId ? `?portfolioId=${portfolioId}` : '';
  
  const response = await apiRequest<{
    success: boolean;
    data: TransactionSummary;
  }>(`/transactions/summary/stats${queryParams}`);
  
  return response.data;
};

// 删除交易记录
export const deleteTransaction = async (transactionId: string): Promise<void> => {
  await apiRequest(`/transactions/${transactionId}`, {
    method: 'DELETE',
  });
};

// 更新交易记录
export const updateTransaction = async (transactionId: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const response = await apiRequest<{
    success: boolean;
    data: Transaction;
  }>(`/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  
  return response.data;
};