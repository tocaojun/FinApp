// 投资组合相关类型定义

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
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  id: string;
  portfolioId: string;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  assetType: 'STOCK' | 'FUND' | 'BOND' | 'CRYPTO' | 'OPTION';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  currency: string; // 资产币种
  portfolioCurrency?: string; // 投资组合基础币种
  exchangeRate?: number; // 汇率（资产币种 -> 投资组合币种）
  convertedMarketValue?: number; // 转换后的市值
  convertedTotalCost?: number; // 转换后的总成本
  convertedUnrealizedPnL?: number; // 转换后的未实现盈亏
  lastUpdated: string;
}

export interface Account {
  id: string;
  portfolioId: string;
  name: string;
  type: 'BROKERAGE' | 'RETIREMENT' | 'SAVINGS' | 'CHECKING';
  broker?: string;
  accountNumber?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetAllocation {
  assetType: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PortfolioPerformance {
  date: string;
  totalValue: number;
  totalReturn: number;
  returnPercent: number;
}

export interface PortfolioSummary {
  totalAssets: number;
  totalValue: number;
  todayChange: number;
  todayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  allocations: AssetAllocation[];
  performance: PortfolioPerformance[];
}