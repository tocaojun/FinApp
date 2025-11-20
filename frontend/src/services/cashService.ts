import { apiGet, apiPost } from './api';

export interface CashTransaction {
  id: string;
  tradingAccountId: string;
  transactionType: 'DEPOSIT' | 'WITHDRAW' | 'INVESTMENT' | 'REDEMPTION' | 'TRANSFER';
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceTransactionId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CashBalance {
  tradingAccountId: string;
  accountName: string;
  currency: string;
  cashBalance: number;
  availableBalance: number;
  frozenBalance: number;
}

export interface CashSummary {
  totalCashBalance: number;
  totalAvailableBalance: number;
  totalFrozenBalance: number;
  currency: string;
  accountCount: number;
}

export interface CreateCashTransactionRequest {
  tradingAccountId: string;
  transactionType: CashTransaction['transactionType'];
  amount: number;
  description?: string;
  referenceTransactionId?: string;
  metadata?: Record<string, any>;
}

export interface CashTransactionResponse {
  transactions: CashTransaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class CashService {
  /**
   * 获取现金余额概览
   */
  static async getCashSummary(currency?: string): Promise<CashSummary[]> {
    try {
      const endpoint = currency ? `/cash/summary?currency=${currency}` : '/cash/summary';
      const response = await apiGet(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('获取现金概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取现金账户余额列表
   */
  static async getCashBalances(portfolioId?: string): Promise<CashBalance[]> {
    try {
      const endpoint = portfolioId ? `/cash/balances?portfolio_id=${portfolioId}` : '/cash/balances';
      const response = await apiGet(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('获取现金余额失败:', error);
      throw error;
    }
  }

  /**
   * 获取现金流水记录
   */
  static async getCashTransactions(
    tradingAccountId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CashTransactionResponse> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      if (tradingAccountId) {
        params.append('trading_account_id', tradingAccountId);
      }
      
      const endpoint = `/cash/transactions?${params.toString()}`;
      const response = await apiGet(endpoint);
      return {
        transactions: response.data?.transactions || [],
        pagination: response.data?.pagination || {
          total: response.data?.total || 0,
          limit,
          offset,
          hasMore: false
        }
      };
    } catch (error) {
      console.error('获取现金流水失败:', error);
      throw error;
    }
  }

  /**
   * 创建现金交易（存入/取出）
   */
  static async createCashTransaction(data: CreateCashTransactionRequest): Promise<CashTransaction> {
    try {
      const response = await apiPost('/cash/transactions', data);
      return response.data;
    } catch (error) {
      console.error('创建现金交易失败:', error);
      throw error;
    }
  }

  /**
   * 冻结资金
   */
  static async freezeFunds(
    tradingAccountId: string, 
    amount: number, 
    description?: string
  ): Promise<void> {
    try {
      await apiPost('/cash/freeze', {
        tradingAccountId,
        amount,
        description
      });
    } catch (error) {
      console.error('冻结资金失败:', error);
      throw error;
    }
  }

  /**
   * 解冻资金
   */
  static async unfreezeFunds(
    tradingAccountId: string, 
    amount: number, 
    description?: string
  ): Promise<void> {
    try {
      await apiPost('/cash/unfreeze', {
        tradingAccountId,
        amount,
        description
      });
    } catch (error) {
      console.error('解冻资金失败:', error);
      throw error;
    }
  }

  /**
   * 获取交易类型的显示名称
   */
  static getTransactionTypeName(type: CashTransaction['transactionType']): string {
    const typeNames = {
      DEPOSIT: '存入',
      WITHDRAW: '取出',
      INVESTMENT: '投资',
      REDEMPTION: '赎回',
      TRANSFER: '转账'
    };
    return typeNames[type] || type;
  }

  /**
   * 格式化金额显示
   */
  static formatAmount(amount: number, currency: string = 'CNY'): string {
    const currencySymbols = {
      CNY: '¥',
      USD: '$',
      HKD: 'HK$'
    };
    
    const symbol = currencySymbols[currency as keyof typeof currencySymbols] || currency;
    return `${symbol}${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export default CashService;