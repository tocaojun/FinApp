export interface Transaction {
  id: string;
  userId: string;
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  transactionType: TransactionType;
  side: TransactionSide;
  quantity: number;
  price: number;
  totalAmount: number;
  fees: number;
  currency: string;
  transactionDate?: Date; // 交易发生日期（用户选择）
  executedAt: Date; // 录入执行时刻（系统自动记录）
  settledAt?: Date;
  notes?: string;
  tags: string[];
  liquidityTag?: LiquidityTag;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 
  | 'STOCK_BUY' 
  | 'STOCK_SELL'
  | 'FUND_SUBSCRIBE'
  | 'FUND_REDEEM'
  | 'BOND_BUY'
  | 'BOND_SELL'
  | 'OPTION_BUY'
  | 'OPTION_SELL'
  | 'OPTION_EXERCISE'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'DIVIDEND'
  | 'INTEREST'
  | 'FEE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT';

export type TransactionSide = 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL';

export type TransactionStatus = 'PENDING' | 'EXECUTED' | 'SETTLED' | 'CANCELLED' | 'FAILED';

export type LiquidityTag = 'HIGH' | 'MEDIUM' | 'LOW' | 'ILLIQUID';

export interface TransactionFilter {
  portfolioId?: string;
  tradingAccountId?: string;
  assetId?: string;
  transactionType?: TransactionType;
  side?: TransactionSide;
  status?: TransactionStatus;
  liquidityTag?: LiquidityTag;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'executedAt' | 'totalAmount' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateTransactionRequest {
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  transactionType: TransactionType;
  side: TransactionSide;
  quantity: number;
  price: number;
  fees?: number;
  currency: string;
  transactionDate?: Date | string; // 交易发生日期（用户选择的日期）
  executedAt: Date | string; // 录入执行时刻（系统记录）
  settledAt?: Date | string;
  notes?: string;
  tags?: string[];
  liquidityTag?: LiquidityTag;
}

export interface UpdateTransactionRequest {
  transactionType?: TransactionType;
  side?: TransactionSide;
  quantity?: number;
  price?: number;
  fees?: number;
  currency?: string;
  transactionDate?: Date | string; // 交易发生日期
  executedAt?: Date | string;
  settledAt?: Date | string;
  notes?: string;
  tags?: string[];
  liquidityTag?: LiquidityTag;
  status?: TransactionStatus;
}

export interface BatchImportTransactionRequest {
  transactions: CreateTransactionRequest[];
  validateOnly?: boolean;
}

export interface TransactionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BatchImportResult {
  totalCount: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    index: number;
    transaction: CreateTransactionRequest;
    errors: string[];
  }>;
  createdTransactions: Transaction[];
}

export interface TransactionSummary {
  totalTransactions: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalFees: number;
  netCashFlow: number;
  transactionsByType: Array<{
    type: TransactionType;
    count: number;
    totalAmount: number;
  }>;
  transactionsByMonth: Array<{
    month: string;
    count: number;
    totalAmount: number;
  }>;
}

export interface PositionUpdate {
  positionId?: string;
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  quantityChange: number;
  newQuantity: number;
  newAverageCost: number;
  newMarketValue: number;
  newTotalCost: number;
  newUnrealizedGain: number;
  newUnrealizedGainPercent: number;
}

export interface CashFlowEntry {
  id: string;
  transactionId: string;
  portfolioId: string;
  tradingAccountId: string;
  amount: number;
  currency: string;
  flowType: 'INFLOW' | 'OUTFLOW';
  category: 'INVESTMENT' | 'DIVIDEND' | 'FEE' | 'TRANSFER' | 'OTHER';
  date: Date;
  description?: string;
}

export interface TransactionExportOptions {
  format: 'CSV' | 'XLSX' | 'JSON';
  filter?: TransactionFilter;
  includeHeaders?: boolean;
  dateFormat?: string;
  currency?: string;
}

export interface TransactionImportTemplate {
  portfolioId: string;
  tradingAccountId: string;
  assetSymbol: string;
  transactionType: string;
  side: string;
  quantity: number;
  price: number;
  fees?: number;
  currency: string;
  executedAt: string;
  notes?: string;
  tags?: string;
  liquidityTag?: string;
}