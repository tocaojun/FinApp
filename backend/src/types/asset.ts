export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetTypeId: string;
  marketId: string;
  currency: string;
  isin?: string;
  description?: string;
  sector?: string;
  industry?: string;
  country?: string;
  exchange?: string;
  isActive: boolean;
  listingDate?: Date;
  delistingDate?: Date;
  dividendFrequency?: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'NONE';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  liquidityTag: 'HIGH' | 'MEDIUM' | 'LOW';
  minTradeUnit?: number;
  lotSize?: number;
  tickSize?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetType {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'EQUITY' | 'BOND' | 'FUND' | 'ETF' | 'OPTION' | 'FUTURE' | 'COMMODITY' | 'CURRENCY' | 'CRYPTO';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Market {
  id: string;
  name: string;
  code: string;
  country: string;
  currency: string;
  timezone: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
  tradingDays: string[];
  holidays?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetPrice {
  id: string;
  assetId: string;
  priceDate: Date;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice: number;
  volume?: number;
  turnover?: number;
  adjustedPrice?: number;
  splitRatio?: number;
  dividendAmount?: number;
  source: 'MANUAL' | 'API' | 'IMPORT';
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetSearchCriteria {
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
  isin?: string;
  description?: string;
  sector?: string;
  industry?: string;
  country?: string;
  exchange?: string;
  listingDate?: string;
  dividendFrequency?: string;
  riskLevel: string;
  liquidityTag: string;
  minTradeUnit?: number;
  lotSize?: number;
  tickSize?: number;
  metadata?: Record<string, any>;
}

export interface AssetUpdateRequest extends Partial<AssetCreateRequest> {
  isActive?: boolean;
  delistingDate?: string;
}

export interface PriceCreateRequest {
  assetId: string;
  priceDate: string;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice: number;
  volume?: number;
  turnover?: number;
  adjustedPrice?: number;
  splitRatio?: number;
  dividendAmount?: number;
  source?: string;
}

export interface PriceUpdateRequest extends Partial<PriceCreateRequest> {}

export interface PriceQueryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AssetStatistics {
  totalAssets: number;
  activeAssets: number;
  assetsByType: Record<string, number>;
  assetsByMarket: Record<string, number>;
  assetsByCurrency: Record<string, number>;
  recentlyAdded: number;
  priceUpdateStatus: {
    upToDate: number;
    outdated: number;
    neverUpdated: number;
  };
}

export interface PriceStatistics {
  latestPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  dividend?: number;
  dividendYield?: number;
}

export interface AssetWithPrice extends Asset {
  latestPrice?: AssetPrice;
  priceStatistics?: PriceStatistics;
}

export interface BulkAssetImportRequest {
  assets: AssetCreateRequest[];
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface BulkPriceImportRequest {
  prices: PriceCreateRequest[];
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface AssetValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AssetImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  errors: AssetValidationError[];
}

export interface PriceImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  errors: AssetValidationError[];
}