import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// 汇率数据接口
export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateDate: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRateQuery {
  fromCurrency?: string;
  toCurrency?: string;
  startDate?: string;
  endDate?: string;
  source?: string;
}

// 获取汇率历史数据
export const getExchangeRateHistory = async (params: ExchangeRateQuery): Promise<ExchangeRate[]> => {
  try {
    const { fromCurrency, toCurrency, startDate, endDate } = params;
    
    if (!fromCurrency || !toCurrency) {
      throw new Error('fromCurrency and toCurrency are required');
    }
    
    // 使用正确的后端路由格式
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const url = `${API_BASE_URL}/exchange-rates/${fromCurrency}/${toCurrency}/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 后端返回的数据格式转换
    const rates = response.data.data || [];
    return rates.map((rate: any) => ({
      id: rate.id,
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate,
      rateDate: rate.rateDate,
      source: rate.dataSource || 'unknown', // 使用 dataSource 字段
      createdAt: rate.createdAt,
      updatedAt: rate.createdAt // 后端没有 updatedAt，使用 createdAt
    }));
  } catch (error) {
    console.error('Failed to fetch exchange rate history:', error);
    throw error; // 不再返回 Mock 数据，直接抛出错误
  }
};

// 获取最新汇率
export const getLatestExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> => {
  try {
    // 使用正确的后端路由格式
    const response = await axios.get(`${API_BASE_URL}/exchange-rates/${fromCurrency}/${toCurrency}/latest`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const rate = response.data.data;
    if (!rate) return null;
    
    // 转换数据格式
    return {
      id: rate.id,
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate,
      rateDate: rate.rateDate,
      source: rate.dataSource || 'unknown',
      createdAt: rate.createdAt,
      updatedAt: rate.createdAt
    };
  } catch (error) {
    console.error('Failed to fetch latest exchange rate:', error);
    return null;
  }
};

// 获取支持的货币列表
export const getSupportedCurrencies = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exchange-rates/currencies`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 后端返回的是货币对象数组，提取 code
    const currencies = response.data.data || [];
    if (Array.isArray(currencies) && currencies.length > 0 && typeof currencies[0] === 'object') {
      return currencies.map((c: any) => c.code);
    }
    
    return currencies;
  } catch (error) {
    console.error('Failed to fetch supported currencies:', error);
    return ['USD', 'CNY', 'EUR', 'JPY', 'GBP', 'HKD'];
  }
};

// 已移除 Mock 数据生成函数，现在完全使用真实的后端API