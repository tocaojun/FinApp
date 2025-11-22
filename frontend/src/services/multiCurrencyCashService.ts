import { apiGet, apiPost } from './api';

export interface MultiCurrencyBalance {
  tradingAccountId: string;
  accountName: string;
  currency: string;
  cashBalance: number;
  availableBalance: number;
  frozenBalance: number;
  lastUpdated: string;
}

export interface MultiCurrencyTransaction {
  id: string;
  tradingAccountId: string;
  transactionType: 'DEPOSIT' | 'WITHDRAW' | 'EXCHANGE' | 'FREEZE' | 'UNFREEZE';
  amount: number;
  currency: string;
  balanceAfter: number;
  description?: string;
  exchangeRate?: number;
  fromCurrency?: string;
  toCurrency?: string;
  fromAmount?: number;
  toAmount?: number;
  createdAt: string;
}

export interface MultiCurrencySummary {
  tradingAccountId: string;
  accountName: string;
  totalCurrencies: number;
  balances: Array<{
    currency: string;
    cashBalance: number;
    availableBalance: number;
    frozenBalance: number;
  }>;
}

export interface CurrencyExchangeRequest {
  tradingAccountId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  description?: string;
}

export interface FreezeUnfreezeRequest {
  tradingAccountId: string;
  currency: string;
  amount: number;
  description?: string;
}

export interface CreateMultiCurrencyTransactionRequest {
  tradingAccountId: string;
  transactionType: MultiCurrencyTransaction['transactionType'];
  amount: number;
  currency: string;
  description?: string;
}

export class MultiCurrencyCashService {
  /**
   * 获取多币种现金概览
   */
  static async getMultiCurrencySummary(): Promise<MultiCurrencySummary[]> {
    try {
      const response = await apiGet('/multi-currency-cash/summary');
      const rawData = response.data || [];
      
      // 转换API返回的数据结构为前端期望的格式
      return rawData.map((item: any) => ({
        tradingAccountId: item.tradingAccountId,
        accountName: item.accountName,
        totalCurrencies: item.currencyCount || item.currencyBalances?.length || 0,
        balances: (item.currencyBalances || []).map((balance: any) => ({
          currency: balance.currency,
          cashBalance: typeof balance.cash_balance === 'number' 
            ? balance.cash_balance 
            : (typeof balance.cash_balance === 'string' ? parseFloat(balance.cash_balance) : 0),
          availableBalance: typeof balance.available_balance === 'number' 
            ? balance.available_balance 
            : (typeof balance.available_balance === 'string' ? parseFloat(balance.available_balance) : 0),
          frozenBalance: typeof balance.frozen_balance === 'number' 
            ? balance.frozen_balance 
            : (typeof balance.frozen_balance === 'string' ? parseFloat(balance.frozen_balance) : 0)
        }))
      }));
    } catch (error) {
      console.error('获取多币种现金概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定账户的多币种余额
   */
  static async getMultiCurrencyBalances(tradingAccountId?: string): Promise<MultiCurrencyBalance[]> {
    try {
      const endpoint = tradingAccountId 
        ? `/multi-currency-cash/balances/${tradingAccountId}`
        : '/multi-currency-cash/balances';
      console.log('🔧 调用API端点:', endpoint);
      console.log('🔧 认证Token:', localStorage.getItem('auth_token') ? '已设置' : '未设置');
      const response = await apiGet(endpoint);
      console.log('🔧 API完整响应:', response);
      const rawData = response.data || [];
      console.log('🔧 原始数据长度:', rawData.length);
      console.log('🔧 原始数据前3条:', rawData.slice(0, 3));
      
      // 转换API返回的数据结构为前端期望的格式
      const transformedData = rawData.map((item: any) => {
        // 后端现在返回camelCase字段，优先使用camelCase，fallback到snake_case
        const cashBalance = typeof item.cashBalance === 'number' 
          ? item.cashBalance 
          : (typeof item.cash_balance === 'number' 
            ? item.cash_balance
            : parseFloat(item.cashBalance || item.cash_balance || '0'));
        const availableBalance = typeof item.availableBalance === 'number' 
          ? item.availableBalance 
          : (typeof item.available_balance === 'number' 
            ? item.available_balance
            : parseFloat(item.availableBalance || item.available_balance || '0'));
        const frozenBalance = typeof item.frozenBalance === 'number' 
          ? item.frozenBalance 
          : (typeof item.frozen_balance === 'number' 
            ? item.frozen_balance
            : parseFloat(item.frozenBalance || item.frozen_balance || '0'));
        
        return {
          tradingAccountId: item.tradingAccountId || item.trading_account_id,
          accountName: item.accountName || item.account_name,
          currency: item.currency,
          cashBalance: cashBalance,
          availableBalance: availableBalance,
          frozenBalance: frozenBalance,
          lastUpdated: item.lastUpdated || item.last_updated
        };
      });
      
      console.log('🔧 转换后的数据示例:', transformedData.slice(0, 3));
      console.log('🔧 有余额的记录:', transformedData.filter(item => item.cashBalance > 0));
      
      return transformedData;
    } catch (error) {
      console.error('获取多币种余额失败:', error);
      throw error;
    }
  }

  /**
   * 获取多币种交易记录
   */
  static async getMultiCurrencyTransactions(
    tradingAccountId?: string,
    currency?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    transactions: MultiCurrencyTransaction[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      if (tradingAccountId) {
        params.append('trading_account_id', tradingAccountId);
      }
      if (currency) {
        params.append('currency', currency);
      }
      
      const endpoint = `/multi-currency-cash/transactions?${params.toString()}`;
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
      console.error('获取多币种交易记录失败:', error);
      throw error;
    }
  }

  /**
   * 创建多币种交易
   */
  static async createMultiCurrencyTransaction(data: CreateMultiCurrencyTransactionRequest): Promise<MultiCurrencyTransaction> {
    try {
      const response = await apiPost('/multi-currency-cash/transactions', data);
      return response.data;
    } catch (error) {
      console.error('创建多币种交易失败:', error);
      throw error;
    }
  }

  /**
   * 币种兑换
   */
  static async exchangeCurrency(data: CurrencyExchangeRequest): Promise<MultiCurrencyTransaction> {
    try {
      const response = await apiPost('/multi-currency-cash/exchange', data);
      return response.data;
    } catch (error) {
      console.error('币种兑换失败:', error);
      throw error;
    }
  }

  /**
   * 冻结资金
   */
  static async freezeFunds(data: FreezeUnfreezeRequest): Promise<void> {
    try {
      await apiPost('/multi-currency-cash/freeze', data);
    } catch (error) {
      console.error('冻结资金失败:', error);
      throw error;
    }
  }

  /**
   * 解冻资金
   */
  static async unfreezeFunds(data: FreezeUnfreezeRequest): Promise<void> {
    try {
      await apiPost('/multi-currency-cash/unfreeze', data);
    } catch (error) {
      console.error('解冻资金失败:', error);
      throw error;
    }
  }

  /**
   * 获取支持的币种列表
   */
  static getSupportedCurrencies(): string[] {
    return ['CNY', 'USD', 'EUR', 'HKD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD'];
  }

  /**
   * 获取币种符号
   */
  static getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      CNY: '¥',
      USD: '$',
      EUR: '€',
      HKD: 'HK$',
      GBP: '£',
      JPY: '¥',
      AUD: 'A$',
      CAD: 'C$',
      CHF: 'Fr',
      SGD: 'S$'
    };
    return symbols[currency] || currency;
  }

  /**
   * 格式化多币种金额显示
   */
  static formatAmount(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString('zh-CN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  /**
   * 获取交易类型显示名称
   */
  static getTransactionTypeName(type: MultiCurrencyTransaction['transactionType']): string {
    const typeNames = {
      DEPOSIT: '存入',
      WITHDRAW: '取出',
      EXCHANGE: '兑换',
      FREEZE: '冻结',
      UNFREEZE: '解冻'
    };
    return typeNames[type] || type;
  }

  /**
   * 获取币种颜色
   */
  static getCurrencyColor(currency: string): string {
    const colors: Record<string, string> = {
      CNY: '#fa541c',
      USD: '#52c41a',
      EUR: '#1890ff',
      HKD: '#722ed1',
      GBP: '#eb2f96',
      JPY: '#faad14',
      AUD: '#13c2c2',
      CAD: '#f5222d',
      CHF: '#a0d911',
      SGD: '#2f54eb'
    };
    return colors[currency] || '#666666';
  }
}

export default MultiCurrencyCashService;