import { apiGet, apiPost, apiPut, apiDelete } from './api';

// 资产相关类型定义
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetTypeId: string;
  assetTypeName?: string;
  assetTypeCode?: string;
  countryId?: string | null;
  countryName?: string;
  currency: string;
  sector?: string;
  industry?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  liquidityTag: string; // UUID of liquidity tag
  isActive: boolean;
  listingDate?: string;
  delistingDate?: string;
  description?: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  volume?: number;
  marketCap?: number;
  details?: Record<string, any>; // 资产详情（动态字段）
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

// @deprecated 市场维度已移除，改用国家维度

export interface Country {
  id: string;
  code: string;
  name: string;
  currency?: string;
  timezone?: string;
  isActive?: boolean;
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
  countryId?: string;
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
  countryId?: string | null; // 可选：国家（支持NULL用于全球资产如加密货币）
  currency: string;
  sector?: string;
  industry?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  liquidityTag: string; // UUID of liquidity tag
  isActive?: boolean;
  listingDate?: string;
  delistingDate?: string;
  description?: string;
  lotSize?: number;
  tickSize?: number;
  minTradeAmount?: number;
  maxTradeAmount?: number;
  details?: Record<string, any>; // 资产详情（动态字段）
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
  totalCountries: number;
  totalTypes: number;
  sectorsCount: number;
}

export interface AssetStatisticsDetails {
  assetsByType: Record<string, number>;
  assetsByCountry: Record<string, number>;
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

// 移除所有模拟数据，完全依赖后端API

// 资产服务类
export class AssetService {
  // 获取资产类型列表
  static async getAssetTypes(): Promise<AssetType[]> {
    const response = await apiGet<ApiResponse<AssetType[]>>('/assets/types');
    return response.data;
  }

  // 获取国家列表
  static async getCountries(): Promise<Country[]> {
    const response = await apiGet<ApiResponse<Country[]>>('/assets/countries');
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
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
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
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  // 资产类型管理
  static async createAssetType(data: {
    code: string;
    name: string;
    category: string;
    description?: string;
  }): Promise<AssetType> {
    const response = await apiPost<ApiResponse<AssetType>>('/assets/types', data);
    return response.data;
  }

  static async updateAssetType(id: string, data: Partial<{
    code: string;
    name: string;
    category: string;
    description?: string;
    isActive: boolean;
  }>): Promise<AssetType> {
    const response = await apiPut<ApiResponse<AssetType>>(`/assets/types/${id}`, data);
    return response.data;
  }

  static async deleteAssetType(id: string): Promise<void> {
    await apiDelete<ApiResponse<void>>(`/assets/types/${id}`);
  }

  // 获取资产类型使用情况
  static async getAssetTypeUsage(id: string): Promise<{
    count: number;
    assets: Array<{
      id: string;
      name: string;
      symbol: string;
    }>;
  }> {
    const response = await apiGet<ApiResponse<{
      count: number;
      assets: Array<{
        id: string;
        name: string;
        symbol: string;
      }>;
    }>>(`/assets/types/${id}/usage`);
    return response.data;
  }

  // 批量价格更新
  static async bulkUpdatePrices(data: {
    updates: Array<{
      assetId: string;
      priceDate: string;
      closePrice: number;
      openPrice?: number;
      highPrice?: number;
      lowPrice?: number;
      volume?: number;
      adjustedPrice?: number;
    }>;
    source?: string;
  }): Promise<{
    success: boolean;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    errors: Array<{
      row: number;
      assetId: string;
      priceDate: string;
      message: string;
    }>;
  }> {
    const response = await apiPost<ApiResponse<any>>('/assets/prices/bulk-update', data);
    return response.data;
  }

  // 批量导入资产
  static async bulkImportAssets(data: {
    assets: AssetCreateRequest[];
    skipDuplicates?: boolean;
    updateExisting?: boolean;
  }): Promise<{
    success: boolean;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
    updatedCount: number;
    errors: Array<{
      row: number;
      symbol: string;
      message: string;
    }>;
  }> {
    const response = await apiPost<ApiResponse<any>>('/assets/import', data);
    return response.data;
  }

  // 批量导入价格
  static async bulkImportPrices(data: {
    prices: PriceCreateRequest[];
    skipDuplicates?: boolean;
    updateExisting?: boolean;
  }): Promise<{
    success: boolean;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
    updatedCount: number;
    errors: Array<{
      row: number;
      assetId: string;
      priceDate: string;
      message: string;
    }>;
  }> {
    const response = await apiPost<ApiResponse<any>>('/assets/prices/import', data);
    return response.data;
  }
}