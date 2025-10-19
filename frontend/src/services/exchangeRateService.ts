import { apiGet, apiPost, apiPut, apiDelete } from './api';

// 类型定义
export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rateDate: string;
  rate: number;
  dataSource?: string;
  createdAt: string;
}

export interface ExchangeRateCreateRequest {
  fromCurrency: string;
  toCurrency: string;
  rateDate: string;
  rate: number;
  dataSource?: string;
}

export interface ExchangeRateUpdateRequest extends Partial<ExchangeRateCreateRequest> {}

export interface ExchangeRateSearchCriteria {
  fromCurrency?: string;
  toCurrency?: string;
  startDate?: string;
  endDate?: string;
  dataSource?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExchangeRateStatistics {
  totalRates: number;
  currencyPairs: number;
  latestUpdate: string;
  dataSourcesCount: number;
  supportedCurrencies: string[];
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

export interface CurrencyConversion {
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  rateDate: string;
}

export interface BulkImportResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  updatedCount: number;
  errors: Array<{
    row: number;
    fromCurrency: string;
    toCurrency: string;
    rateDate: string;
    message: string;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export class ExchangeRateService {
  // 获取汇率列表
  static async searchExchangeRates(criteria: ExchangeRateSearchCriteria = {}): Promise<{
    rates: ExchangeRate[];
    total: number;
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await apiGet<ApiResponse<{ rates: ExchangeRate[]; total: number }>>(
      `/exchange-rates?${queryParams}`
    );
    return response.data;
  }

  // 创建汇率记录
  static async createExchangeRate(data: ExchangeRateCreateRequest): Promise<ExchangeRate> {
    const response = await apiPost<ApiResponse<ExchangeRate>>('/exchange-rates', data);
    return response.data;
  }

  // 更新汇率记录
  static async updateExchangeRate(id: string, data: ExchangeRateUpdateRequest): Promise<ExchangeRate> {
    const response = await apiPut<ApiResponse<ExchangeRate>>(`/exchange-rates/${id}`, data);
    return response.data;
  }

  // 删除汇率记录
  static async deleteExchangeRate(id: string): Promise<void> {
    await apiDelete<ApiResponse<void>>(`/exchange-rates/${id}`);
  }

  // 获取最新汇率
  static async getLatestRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    const response = await apiGet<ApiResponse<ExchangeRate>>(
      `/exchange-rates/${fromCurrency}/${toCurrency}/latest`
    );
    return response.data;
  }

  // 获取汇率历史
  static async getRateHistory(
    fromCurrency: string,
    toCurrency: string,
    params: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): Promise<ExchangeRate[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await apiGet<ApiResponse<ExchangeRate[]>>(
      `/exchange-rates/${fromCurrency}/${toCurrency}/history?${queryParams}`
    );
    return response.data;
  }

  // 批量导入汇率
  static async bulkImportRates(data: {
    rates: ExchangeRateCreateRequest[];
    skipDuplicates?: boolean;
    updateExisting?: boolean;
  }): Promise<BulkImportResult> {
    const response = await apiPost<ApiResponse<BulkImportResult>>('/exchange-rates/bulk-import', data);
    return response.data;
  }

  // 获取统计信息
  static async getStatistics(): Promise<ExchangeRateStatistics> {
    const response = await apiGet<ApiResponse<ExchangeRateStatistics>>('/exchange-rates/statistics');
    return response.data;
  }

  // 获取支持的货币列表
  static async getSupportedCurrencies(): Promise<CurrencyInfo[]> {
    const response = await apiGet<ApiResponse<CurrencyInfo[]>>('/exchange-rates/currencies');
    return response.data;
  }

  // 货币转换
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rateDate?: string
  ): Promise<CurrencyConversion> {
    const queryParams = new URLSearchParams({
      amount: String(amount),
      fromCurrency,
      toCurrency
    });

    if (rateDate) {
      queryParams.append('rateDate', rateDate);
    }

    const response = await apiGet<ApiResponse<CurrencyConversion>>(
      `/exchange-rates/convert?${queryParams}`
    );
    return response.data;
  }

  // 导出汇率数据
  static async exportRates(params: {
    fromCurrency?: string;
    toCurrency?: string;
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'xlsx';
  } = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await fetch(`/api/exchange-rates/export?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  // 获取汇率趋势数据
  static async getRateTrend(
    fromCurrency: string,
    toCurrency: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    dates: string[];
    rates: number[];
    change: number;
    changePercent: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const history = await this.getRateHistory(fromCurrency, toCurrency, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 100
    });

    // 按日期排序
    const sortedHistory = history.sort((a, b) => 
      new Date(a.rateDate).getTime() - new Date(b.rateDate).getTime()
    );

    const dates = sortedHistory.map(rate => rate.rateDate);
    const rates = sortedHistory.map(rate => rate.rate);
    
    const firstRate = rates[0] || 0;
    const lastRate = rates[rates.length - 1] || 0;
    const change = lastRate - firstRate;
    const changePercent = firstRate !== 0 ? (change / firstRate) * 100 : 0;

    return {
      dates,
      rates,
      change,
      changePercent
    };
  }

  // 获取热门货币对
  static async getPopularCurrencyPairs(): Promise<Array<{
    fromCurrency: string;
    toCurrency: string;
    latestRate: number;
    change24h: number;
    changePercent24h: number;
  }>> {
    // 常见的货币对
    const popularPairs = [
      { from: 'USD', to: 'CNY' },
      { from: 'EUR', to: 'USD' },
      { from: 'GBP', to: 'USD' },
      { from: 'USD', to: 'JPY' },
      { from: 'USD', to: 'HKD' },
      { from: 'EUR', to: 'CNY' },
      { from: 'GBP', to: 'CNY' },
      { from: 'AUD', to: 'USD' }
    ];

    const results = [];

    for (const pair of popularPairs) {
      try {
        const history = await this.getRateHistory(pair.from, pair.to, { limit: 2 });
        if (history.length > 0) {
          const latestRate = history[0].rate;
          const previousRate = history[1]?.rate || latestRate;
          const change24h = latestRate - previousRate;
          const changePercent24h = previousRate !== 0 ? (change24h / previousRate) * 100 : 0;

          results.push({
            fromCurrency: pair.from,
            toCurrency: pair.to,
            latestRate,
            change24h,
            changePercent24h
          });
        }
      } catch (error) {
        console.warn(`Failed to get data for ${pair.from}/${pair.to}:`, error);
      }
    }

    return results;
  }

  // 获取汇率变动通知设置
  static async getRateAlerts(): Promise<Array<{
    id: string;
    fromCurrency: string;
    toCurrency: string;
    targetRate: number;
    condition: 'above' | 'below';
    isActive: boolean;
    createdAt: string;
  }>> {
    // 这里可以实现汇率提醒功能
    // 暂时返回空数组，后续可以扩展
    return [];
  }

  // 设置汇率变动通知
  static async setRateAlert(data: {
    fromCurrency: string;
    toCurrency: string;
    targetRate: number;
    condition: 'above' | 'below';
  }): Promise<void> {
    // 这里可以实现汇率提醒设置功能
    // 暂时为空实现，后续可以扩展
    console.log('Rate alert set:', data);
  }
}

export default ExchangeRateService;