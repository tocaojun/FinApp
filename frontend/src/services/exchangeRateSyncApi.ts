import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ExchangeRateSyncApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/exchange-rates`,
      timeout: 30000,
    });

    // 添加请求拦截器 - 自动添加认证令牌
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // 添加响应拦截器
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  // ==================== 汇率同步相关 ====================

  /**
   * 获取汇率同步统计
   */
  async getExchangeRateStats() {
    return this.client.get('/statistics');
  }

  /**
   * 获取支持的货币列表
   */
  async getSupportedCurrencies() {
    return this.client.get('/currencies');
  }

  /**
   * 手动刷新汇率
   */
  async refreshExchangeRates(params?: {
    fromCurrency?: string;
    toCurrency?: string;
    daysBack?: number;
  }) {
    return this.client.post('/refresh', params);
  }

  /**
   * 导入历史汇率数据
   */
  async importHistoricalRates(params: {
    fromCurrency: string;
    toCurrency: string;
    startDate: string;
    endDate: string;
    daysBack?: number;
  }) {
    return this.client.post('/import-historical', params);
  }

  /**
   * 获取自动更新状态
   */
  async getAutoUpdateStatus() {
    return this.client.get('/auto-update-status');
  }

  /**
   * 搜索汇率记录
   */
  async searchExchangeRates(params: {
    fromCurrency?: string;
    toCurrency?: string;
    startDate?: string;
    endDate?: string;
    dataSource?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.client.get('/', { params });
  }

  /**
   * 获取特定货币对的最新汇率
   */
  async getLatestRate(fromCurrency: string, toCurrency: string) {
    return this.client.get(`/${fromCurrency}/${toCurrency}/latest`);
  }

  /**
   * 获取特定货币对的历史汇率
   */
  async getRateHistory(fromCurrency: string, toCurrency: string, params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return this.client.get(`/${fromCurrency}/${toCurrency}/history`, { params });
  }

  /**
   * 创建汇率记录（手动输入）
   */
  async createExchangeRate(data: {
    fromCurrency: string;
    toCurrency: string;
    rateDate: string;
    rate: number;
    dataSource?: string;
  }) {
    return this.client.post('/', data);
  }

  /**
   * 批量导入汇率数据
   */
  async bulkImportRates(data: any) {
    return this.client.post('/bulk-import', data);
  }

  /**
   * 更新汇率记录
   */
  async updateExchangeRate(id: string, data: any) {
    return this.client.put(`/${id}`, data);
  }

  /**
   * 删除汇率记录
   */
  async deleteExchangeRate(id: string) {
    return this.client.delete(`/${id}`);
  }
}

const exchangeRateSyncApiClient = new ExchangeRateSyncApiClient();
export default exchangeRateSyncApiClient;
