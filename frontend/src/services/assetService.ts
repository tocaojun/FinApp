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

// 资产服务类
export class AssetService {
  // 获取资产类型列表
  static async getAssetTypes(): Promise<AssetType[]> {
    const response = await apiGet<ApiResponse<AssetType[]>>('/assets/types');
    return response.data;
  }

  // 获取市场列表
  static async getMarkets(): Promise<Market[]> {
    const response = await apiGet<ApiResponse<Market[]>>('/assets/markets');
    return response.data;
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
    const response = await apiGet<ApiResponse<AssetStatistics>>('/assets/statistics');
    return response.data;
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