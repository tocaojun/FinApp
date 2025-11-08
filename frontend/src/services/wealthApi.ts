import axios from 'axios';

const API_BASE_URL = '/api/wealth';

// ============================================
// 类型定义
// ============================================

export interface DividendComparisonRequest {
  investment: number;
  expectedReturn: number;
  startDate?: string;
}

export interface NAVComparisonRequest {
  investment: number;
  purchaseNav: number;
  expectedAnnualReturn: number;
  holdingDays?: number;
}

export interface TransactionRequest {
  assetId: string;
  type: 'PURCHASE' | 'REDEMPTION' | 'DIVIDEND' | 'FEE' | 'ADJUSTMENT';
  date: string;
  amount: number;
  quantity?: number;
  navPerShare?: number;
  dividendRate?: number;
  feeAmount?: number;
  feeDescription?: string;
  notes?: string;
}

export interface ComparisonResponse {
  success: boolean;
  data: {
    productType: 'DIVIDEND' | 'NAV';
    status: 'NORMAL' | 'WARNING' | 'ALERT';
    deviationRatio: number;
    deviationPercentage: string;
    recommendation: string;
    alert: boolean;
    totalDividends?: number;
    expectedReturn?: number;
    actualReturn?: number;
    gainAmount?: number;
    gainPercentage?: string;
    gainRate?: number;
  };
}

export interface TrendResponse {
  success: boolean;
  data: {
    assetId: string;
    period: string;
    granularity: string;
    data: Array<{
      date: string;
      nav: string;
      dailyReturn: string;
      cumulativeReturn: string;
    }>;
  };
}

export interface AnalysisResponse {
  success: boolean;
  data: {
    assetId: string;
    analysis: {
      level: 'NORMAL' | 'WARNING' | 'ALERT';
      threshold: string;
      reasons: string[];
      recommendation: string;
      trend: number[];
      trendSummary: string;
    };
  };
}

export interface SummaryResponse {
  success: boolean;
  data: {
    summary: {
      totalProducts: number;
      productsByType: Record<string, number>;
      products: Array<{
        assetId: string;
        name: string;
        type: string;
        subtype: 'DIVIDEND' | 'NAV';
        issuer: string;
        expectedReturn: number;
        totalInvestment: number;
        dividendsReceived: number;
        currentValue: number;
        transactionCount: number;
        lastTransactionDate: string;
      }>;
    };
  };
}

// ============================================
// API 服务
// ============================================

export const wealthApi = {
  /**
   * 获取分红型产品的预期收益与实际收益对比
   */
  getDividendComparison: async (
    assetId: string,
    payload: DividendComparisonRequest
  ): Promise<ComparisonResponse> => {
    const response = await axios.post<ComparisonResponse>(
      `${API_BASE_URL}/dividend/${assetId}/comparison`,
      payload
    );
    return response.data;
  },

  /**
   * 获取净值型产品的预期收益与实际收益对比
   */
  getNAVComparison: async (
    assetId: string,
    payload: NAVComparisonRequest
  ): Promise<ComparisonResponse> => {
    const response = await axios.post<ComparisonResponse>(
      `${API_BASE_URL}/nav/${assetId}/comparison`,
      payload
    );
    return response.data;
  },

  /**
   * 分析产品的收益偏差原因
   */
  analyzeDeviations: async (assetId: string): Promise<AnalysisResponse> => {
    const response = await axios.get<AnalysisResponse>(
      `${API_BASE_URL}/${assetId}/analysis`
    );
    return response.data;
  },

  /**
   * 记录财富产品交易
   */
  recordTransaction: async (
    payload: TransactionRequest
  ): Promise<{ success: boolean; message: string; data: TransactionRequest }> => {
    const response = await axios.post<{ success: boolean; message: string; data: TransactionRequest }>(
      `${API_BASE_URL}/transaction`,
      payload
    );
    return response.data;
  },

  /**
   * 获取用户的财富产品汇总信息
   */
  getProductSummary: async (
    userId: string,
    productSubtype?: 'DIVIDEND' | 'NAV'
  ): Promise<SummaryResponse> => {
    const params = productSubtype ? { productSubtype } : {};
    const response = await axios.get<SummaryResponse>(
      `${API_BASE_URL}/users/${userId}/summary`,
      { params }
    );
    return response.data;
  },

  /**
   * 获取产品的收益趋势数据
   */
  getReturnTrend: async (
    assetId: string,
    days: number = 30,
    groupBy: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<TrendResponse> => {
    const response = await axios.get<TrendResponse>(
      `${API_BASE_URL}/${assetId}/trend`,
      {
        params: { days, groupBy }
      }
    );
    return response.data;
  },

  /**
   * 获取多个产品的对比数据
   */
  compareMultipleProducts: async (
    assetIds: string[]
  ): Promise<Array<ComparisonResponse['data']>> => {
    const responses = await Promise.all(
      assetIds.map(assetId => wealthApi.analyzeDeviations(assetId))
    );
    return responses.map(r => r.data.analysis as any);
  },

  /**
   * 批量获取产品的偏差分析
   */
  batchAnalyzeDeviations: async (
    assetIds: string[]
  ): Promise<AnalysisResponse['data']['analysis'][]> => {
    const responses = await Promise.all(
      assetIds.map(assetId => wealthApi.analyzeDeviations(assetId))
    );
    return responses.map(r => r.data.analysis);
  },

  /**
   * 导出产品数据 (CSV)
   */
  exportProductData: async (userId: string): Promise<Blob> => {
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/export`,
      {
        responseType: 'blob'
      }
    );
    return response.data;
  },

  /**
   * 生成产品报告
   */
  generateReport: async (userId: string, startDate: string, endDate: string) => {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/report`, {
      params: { startDate, endDate }
    });
    return response.data;
  }
};

export default wealthApi;
