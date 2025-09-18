import { apiGet, apiPost, apiPut, apiDelete } from './api';

// 资产相关类型定义
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetTypeId: string;
  assetTypeName?: string;
  marketId: string;
  marketName?: string;
  currency: string;
  sector?: string;
  industry?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  liquidityTag: 'HIGH' | 'MEDIUM' | 'LOW';
  isActive: boolean;
  listingDate?: string;
  delistingDate?: string;
  description?: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  volume?: number;
  marketCap?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssetType {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
}

export interface Market {
  id: string;
  code: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
}

export interface AssetPrice {
  id: string;
  assetId: string;
  priceDate: string;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice: number;
  volume?: number;
  adjustedPrice?: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetSearchParams {
  keyword?: string;
  assetTypeId?: string;
  marketId?: string;
  currency?: string;
  sector?: string;
  riskLevel?: string;
  liquidityTag?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AssetCreateRequest {
  symbol: string;
  name: string;
  assetTypeId: string;
  marketId: string;
  currency: string;
  sector?: string;
  industry?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  liquidityTag: 'HIGH' | 'MEDIUM' | 'LOW';
  isActive?: boolean;
  listingDate?: string;
  delistingDate?: string;
  description?: string;
  lotSize?: number;
  tickSize?: number;
  minTradeAmount?: number;
  maxTradeAmount?: number;
}

export interface AssetUpdateRequest extends Partial<AssetCreateRequest> {}

export interface PriceCreateRequest {
  assetId: string;
  priceDate: string;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice: number;
  volume?: number;
  adjustedPrice?: number;
  source: string;
}

export interface PriceUpdateRequest extends Partial<Omit<PriceCreateRequest, 'assetId'>> {}

export interface AssetStatistics {
  totalAssets: number;
  activeAssets: number;
  assetsByType: Record<string, number>;
  assetsByMarket: Record<string, number>;
  assetsByCurrency: Record<string, number>;
  assetsWithPrices: number;
  latestPriceUpdates: number;
}

// API 响应类型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 模拟数据
const mockAssetTypes: AssetType[] = [
  { id: '1', code: 'STOCK', name: '股票', category: 'EQUITY', description: '上市公司股票' },
  { id: '2', code: 'BOND', name: '债券', category: 'FIXED_INCOME', description: '政府和企业债券' },
  { id: '3', code: 'FUND', name: '基金', category: 'FUND', description: '投资基金' },
  { id: '4', code: 'ETF', name: 'ETF', category: 'FUND', description: '交易所交易基金' },
  { id: '5', code: 'CRYPTO', name: '加密货币', category: 'CRYPTO', description: '数字货币' },
];

const mockMarkets: Market[] = [
  { id: '1', code: 'SSE', name: '上海证券交易所', country: 'CN', currency: 'CNY', timezone: 'Asia/Shanghai' },
  { id: '2', code: 'SZSE', name: '深圳证券交易所', country: 'CN', currency: 'CNY', timezone: 'Asia/Shanghai' },
  { id: '3', code: 'NYSE', name: '纽约证券交易所', country: 'US', currency: 'USD', timezone: 'America/New_York' },
  { id: '4', code: 'NASDAQ', name: '纳斯达克', country: 'US', currency: 'USD', timezone: 'America/New_York' },
  { id: '5', code: 'HKEX', name: '香港交易所', country: 'HK', currency: 'HKD', timezone: 'Asia/Hong_Kong' },
];

const mockAssets: Asset[] = [
  {
    id: '1',
    symbol: 'AAPL',
    name: '苹果公司',
    assetTypeId: '1',
    assetTypeName: '股票',
    marketId: '3',
    marketName: '纽约证券交易所',
    currency: 'USD',
    sector: '科技',
    industry: '消费电子',
    riskLevel: 'MEDIUM',
    liquidityTag: 'HIGH',
    isActive: true,
    currentPrice: 175.43,
    priceChange: 2.15,
    priceChangePercent: 1.24,
    volume: 45678900,
    marketCap: 2750000000000,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    symbol: '000001',
    name: '平安银行',
    assetTypeId: '1',
    assetTypeName: '股票',
    marketId: '2',
    marketName: '深圳证券交易所',
    currency: 'CNY',
    sector: '金融',
    industry: '银行',
    riskLevel: 'MEDIUM',
    liquidityTag: 'HIGH',
    isActive: true,
    currentPrice: 12.45,
    priceChange: -0.23,
    priceChangePercent: -1.81,
    volume: 12345678,
    marketCap: 241000000000,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockStatistics: AssetStatistics = {
  totalAssets: 1250,
  activeAssets: 1180,
  assetsByType: {
    '股票': 850,
    '基金': 200,
    '债券': 150,
    'ETF': 50,
  },
  assetsByMarket: {
    '上海证券交易所': 400,
    '深圳证券交易所': 350,
    '纽约证券交易所': 200,
    '纳斯达克': 150,
    '香港交易所': 100,
  },
  assetsByCurrency: {
    'CNY': 750,
    'USD': 350,
    'HKD': 100,
    'EUR': 50,
  },
  assetsWithPrices: 1150,
  latestPriceUpdates: 1120,
};

// 资产服务类
export class AssetService {
  // 获取资产类型列表
  static async getAssetTypes(): Promise<AssetType[]> {
    try {
      const response = await apiGet<ApiResponse<AssetType[]>>('/assets/types');
      return response.data;
    } catch (error) {
      console.warn('使用模拟数据 - 资产类型:', error);
      return mockAssetTypes;
    }
  }

  // 获取市场列表
  static async getMarkets(): Promise<Market[]> {
    try {
      const response = await apiGet<ApiResponse<Market[]>>('/assets/markets');
      return response.data;
    } catch (error) {
      console.warn('使用模拟数据 - 市场列表:', error);
      return mockMarkets;
    }
  }

  // 搜索资产
  static async searchAssets(params: AssetSearchParams = {}): Promise<{
    assets: Asset[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await apiGet<PaginatedResponse<Asset>>(`/assets?${queryParams}`);
      return {
        assets: response.data,
        pagination: response.pagination,
      };
    } catch (error) {
      console.warn('使用模拟数据 - 资产搜索:', error);
      
      // 模拟搜索逻辑
      let filteredAssets = [...mockAssets];
      
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase();
        filteredAssets = filteredAssets.filter(asset => 
          asset.symbol.toLowerCase().includes(keyword) ||
          asset.name.toLowerCase().includes(keyword)
        );
      }
      
      if (params.assetTypeId) {
        filteredAssets = filteredAssets.filter(asset => asset.assetTypeId === params.assetTypeId);
      }
      
      if (params.marketId) {
        filteredAssets = filteredAssets.filter(asset => asset.marketId === params.marketId);
      }
      
      const page = params.page || 1;
      const limit = params.limit || 20;
      const total = filteredAssets.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return {
        assets: filteredAssets.slice(startIndex, endIndex),
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    }
  }

  // 获取资产详情
  static async getAssetById(id: string): Promise<Asset> {
    const response = await apiGet<ApiResponse<Asset>>(`/assets/${id}`);
    return response.data;
  }

  // 创建资产
  static async createAsset(data: AssetCreateRequest): Promise<Asset> {
    const response = await apiPost<ApiResponse<Asset>>('/assets', data);
    return response.data;
  }

  // 更新资产
  static async updateAsset(id: string, data: AssetUpdateRequest): Promise<Asset> {
    const response = await apiPut<ApiResponse<Asset>>(`/assets/${id}`, data);
    return response.data;
  }

  // 删除资产
  static async deleteAsset(id: string): Promise<void> {
    await apiDelete<ApiResponse<void>>(`/assets/${id}`);
  }

  // 获取资产价格历史
  static async getAssetPrices(
    assetId: string,
    params: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ): Promise<AssetPrice[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await apiGet<ApiResponse<AssetPrice[]>>(`/assets/${assetId}/prices?${queryParams}`);
    return response.data;
  }

  // 添加价格记录
  static async addPrice(data: PriceCreateRequest): Promise<AssetPrice> {
    const response = await apiPost<ApiResponse<AssetPrice>>(`/assets/${data.assetId}/prices`, data);
    return response.data;
  }

  // 更新价格记录
  static async updatePrice(id: string, data: PriceUpdateRequest): Promise<AssetPrice> {
    const response = await apiPut<ApiResponse<AssetPrice>>(`/assets/prices/${id}`, data);
    return response.data;
  }

  // 删除价格记录
  static async deletePrice(id: string): Promise<void> {
    await apiDelete<ApiResponse<void>>(`/assets/prices/${id}`);
  }

  // 获取资产统计信息
  static async getAssetStatistics(): Promise<AssetStatistics> {
    try {
      const response = await apiGet<ApiResponse<AssetStatistics>>('/assets/statistics');
      return response.data;
    } catch (error) {
      console.warn('使用模拟数据 - 资产统计:', error);
      return mockStatistics;
    }
  }

  // 搜索建议
  static async getSearchSuggestions(keyword: string): Promise<Asset[]> {
    const response = await apiGet<ApiResponse<Asset[]>>(`/assets/search?keyword=${encodeURIComponent(keyword)}`);
    return response.data;
  }

  // 导出资产
  static async exportAssets(params: AssetSearchParams = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await fetch(`/api/assets/export?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  // 导出价格数据
  static async exportPrices(
    assetId: string,
    params: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await fetch(`/api/assets/${assetId}/prices/export?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }
}