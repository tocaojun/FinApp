export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  baseCurrency: string;
  sortOrder: number;
  isDefault: boolean;
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradingAccount {
  id: string;
  portfolioId: string;
  name: string;
  broker?: string;
  accountNumber?: string;
  accountType: 'BROKERAGE' | 'BANK' | 'CRYPTO' | 'OTHER';
  currency: string;
  balance: number;
  availableBalance: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  assetType: 'STOCK' | 'BOND' | 'FUND' | 'ETF' | 'CRYPTO' | 'CASH' | 'OPTION' | 'COMMODITY';
  exchange?: string;
  currency: string;
  currentPrice: number;
  previousClose?: number;
  marketCap?: number;
  volume?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  id: string;
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioSummary {
  portfolio: Portfolio;
  totalPositions: number;
  totalAccounts: number;
  totalBalance: number;
  uniqueAssets: number;
  totalPositionValue: number;
  totalValue: number;  // 市值
  totalCost: number;   // 总成本
  totalReturn: number; // 总收益（盈亏）
  totalReturnPercent: number; // 收益率
  lastUpdated: Date;
}

export interface AssetAllocation {
  assetType: string;
  value: number;
  percentage: number;
  count: number;
}

export interface CurrencyAllocation {
  currency: string;
  value: number;
  percentage: number;
  valueInBaseCurrency: number;
}

export interface TopHolding {
  assetId: string;
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  quantity: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
}

export interface PerformanceMetrics {
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  yearChange: number;
  yearChangePercent: number;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  baseCurrency: string;
  sortOrder?: number;
  isDefault?: boolean;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  baseCurrency?: string;
  sortOrder?: number;
  isDefault?: boolean;
}

export interface CreateTradingAccountRequest {
  portfolioId: string;
  name: string;
  broker: string;
  accountNumber: string;
  accountType: 'BROKERAGE' | 'BANK' | 'CRYPTO' | 'OTHER';
  currency?: string;
  balance?: number;
  availableBalance?: number;
}

export interface UpdateTradingAccountRequest {
  name?: string;
  broker?: string;
  accountNumber?: string;
  accountType?: 'BROKERAGE' | 'BANK' | 'CRYPTO' | 'OTHER';
  currency?: string;
  balance?: number;
  availableBalance?: number;
  isActive?: boolean;
}

export interface CreateAssetRequest {
  symbol: string;
  name: string;
  assetType: 'STOCK' | 'BOND' | 'FUND' | 'ETF' | 'CRYPTO' | 'CASH' | 'OPTION' | 'COMMODITY';
  exchange?: string;
  currency: string;
  currentPrice?: number;
  previousClose?: number;
  marketCap?: number;
  volume?: number;
}

export interface UpdateAssetRequest {
  symbol?: string;
  name?: string;
  assetType?: 'STOCK' | 'BOND' | 'FUND' | 'ETF' | 'CRYPTO' | 'CASH' | 'OPTION' | 'COMMODITY';
  market?: string;
  currency?: string;
  currentPrice?: number;
  description?: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'HKD';

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
}