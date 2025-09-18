// 投资组合相关类型定义

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  baseCurrency: string;
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
  currency: string;
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