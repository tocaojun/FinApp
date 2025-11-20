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
  assetType: 'STOCK' | 'FUND' | 'BOND' | 'CRYPTO' | 'OPTION' | 'WEALTH_NAV' | 'WEALTH_BALANCE' | 'DEPOSIT' | 'CASH_MGMT';
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
  
  // 理财产品相关字段
  productMode?: 'QUANTITY' | 'BALANCE';
  netAssetValue?: number; // 净值型产品的单位净值
  balance?: number; // 余额型产品的余额
  lastNavUpdate?: string; // 最后净值更新时间
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

// 理财产品相关类型
export interface WealthProduct {
  id: string;
  portfolioId: string;
  tradingAccountId: string;
  productName: string;
  productCode: string;
  productMode: 'QUANTITY' | 'BALANCE';
  currentValue: number;
  unrealizedPnl: number;
  quantity?: number;
  netAssetValue?: number;
  balance?: number;
  totalCost: number;
  currency: string;
  lastNavUpdate?: string;
  firstPurchaseDate?: string;
  lastTransactionDate?: string;
  accountName: string;
  assetCategory: string;
}

export interface WealthProductType {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
}

export interface CreateWealthProductRequest {
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  productMode: 'QUANTITY' | 'BALANCE';
  initialAmount: number;
  currency: string;
  netAssetValue?: number;
}

export interface WealthProductUpdate {
  positionId: string;
  productMode: 'QUANTITY' | 'BALANCE';
  netAssetValue?: number;
  balance?: number;
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
  totalCashValue?: number; // 总现金价值（按基础货币计算）
  allocations: AssetAllocation[];
  performance: PortfolioPerformance[];
}