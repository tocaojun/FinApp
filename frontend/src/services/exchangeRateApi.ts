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
    const response = await axios.get(`${API_BASE_URL}/exchange-rates/history`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch exchange rate history:', error);
    // 返回模拟数据作为后备
    return generateMockExchangeRates(params);
  }
};

// 获取最新汇率
export const getLatestExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exchange-rates/latest`, {
      params: { fromCurrency, toCurrency },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data;
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
    return response.data.data || ['USD', 'CNY', 'EUR', 'JPY', 'GBP', 'HKD'];
  } catch (error) {
    console.error('Failed to fetch supported currencies:', error);
    return ['USD', 'CNY', 'EUR', 'JPY', 'GBP', 'HKD'];
  }
};

// 生成模拟汇率数据（作为后备）
const generateMockExchangeRates = (params: ExchangeRateQuery): ExchangeRate[] => {
  const { fromCurrency = 'USD', toCurrency = 'CNY', startDate, endDate } = params;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  
  // 基础汇率映射
  const baseRates: Record<string, number> = {
    'USD/CNY': 7.2,
    'EUR/CNY': 7.8,
    'JPY/CNY': 0.048,
    'GBP/CNY': 8.9,
    'HKD/CNY': 0.92,
    'USD/EUR': 0.92,
    'USD/JPY': 150,
    'USD/GBP': 0.81,
    'USD/HKD': 7.8
  };
  
  const pair = `${fromCurrency}/${toCurrency}`;
  const baseRate = baseRates[pair] || 1.0;
  
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    const variation = (Math.random() - 0.5) * 0.02; // ±2% 变化
    const rate = Number((baseRate * (1 + variation)).toFixed(4));
    
    return {
      id: `mock_rate_${index}`,
      fromCurrency,
      toCurrency,
      rate,
      rateDate: date.toISOString().split('T')[0],
      source: 'Mock API',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    };
  });
};