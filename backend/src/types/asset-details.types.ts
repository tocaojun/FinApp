/**
 * 多资产类型详情接口定义
 * 对应数据库中的各个详情表
 */

// ============================================
// 基础资产接口
// ============================================
export interface BaseAsset {
  id: string;
  symbol: string;
  name: string;
  assetTypeId: string;
  assetTypeName?: string;
  assetTypeCode?: string;
  countryId?: string | null;
  countryName?: string;
  currency: string;
  isin?: string;
  cusip?: string;
  description?: string;
  riskLevel?: string;
  liquidityTag?: string;
  isActive: boolean;
  currentPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// 股票详情
// ============================================
export interface StockDetails {
  id: string;
  assetId: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  sharesOutstanding?: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  companyWebsite?: string;
  headquarters?: string;
  foundedYear?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStockDetailsInput {
  sector?: string;
  industry?: string;
  marketCap?: number;
  sharesOutstanding?: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  companyWebsite?: string;
  headquarters?: string;
  foundedYear?: number;
}

// ============================================
// 基金详情
// ============================================
export interface FundDetails {
  id: string;
  assetId: string;
  fundType: string; // equity, bond, hybrid, money_market, index
  fundCategory?: string;
  managementFee?: number;
  custodianFee?: number;
  subscriptionFee?: number;
  redemptionFee?: number;
  nav?: number;
  navDate?: Date;
  accumulatedNav?: number;
  fundSize?: number;
  inceptionDate?: Date;
  fundManager?: string;
  fundCompany?: string;
  minInvestment?: number;
  minRedemption?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFundDetailsInput {
  fundType: string;
  fundCategory?: string;
  managementFee?: number;
  custodianFee?: number;
  subscriptionFee?: number;
  redemptionFee?: number;
  nav?: number;
  navDate?: Date;
  accumulatedNav?: number;
  fundSize?: number;
  inceptionDate?: Date;
  fundManager?: string;
  fundCompany?: string;
  minInvestment?: number;
  minRedemption?: number;
}

// ============================================
// 债券详情
// ============================================
export interface BondDetails {
  id: string;
  assetId: string;
  bondType: string; // government, corporate, municipal, convertible
  creditRating?: string;
  faceValue: number;
  couponRate: number;
  couponFrequency?: string;
  issueDate: Date;
  maturityDate: Date;
  yearsToMaturity?: number;
  yieldToMaturity?: number;
  currentYield?: number;
  issuer?: string;
  issuePrice?: number;
  issueSize?: number;
  callable?: boolean;
  callDate?: Date;
  callPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBondDetailsInput {
  bondType: string;
  creditRating?: string;
  faceValue: number;
  couponRate: number;
  couponFrequency?: string;
  issueDate: Date;
  maturityDate: Date;
  yearsToMaturity?: number;
  yieldToMaturity?: number;
  currentYield?: number;
  issuer?: string;
  issuePrice?: number;
  issueSize?: number;
  callable?: boolean;
  callDate?: Date;
  callPrice?: number;
}

// ============================================
// 期货详情
// ============================================
export interface FuturesDetails {
  id: string;
  assetId: string;
  futuresType: string; // commodity, financial, index, currency
  underlyingAsset?: string;
  contractMonth: string;
  contractSize?: number;
  tickSize?: number;
  tickValue?: number;
  tradingHours?: string;
  lastTradingDate?: Date;
  deliveryDate?: Date;
  deliveryMethod?: string;
  initialMargin?: number;
  maintenanceMargin?: number;
  marginRate?: number;
  positionLimit?: number;
  dailyPriceLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFuturesDetailsInput {
  futuresType: string;
  underlyingAsset?: string;
  contractMonth: string;
  contractSize?: number;
  tickSize?: number;
  tickValue?: number;
  tradingHours?: string;
  lastTradingDate?: Date;
  deliveryDate?: Date;
  deliveryMethod?: string;
  initialMargin?: number;
  maintenanceMargin?: number;
  marginRate?: number;
  positionLimit?: number;
  dailyPriceLimit?: number;
}

// ============================================
// 理财产品详情
// ============================================
export interface WealthProductDetails {
  id: string;
  assetId: string;
  productType: string; // fixed_income, floating, structured
  riskLevel: string; // R1, R2, R3, R4, R5
  expectedReturn?: number;
  minReturn?: number;
  maxReturn?: number;
  returnType?: string;
  issueDate: Date;
  startDate: Date;
  maturityDate: Date;
  lockPeriod?: number;
  minInvestment?: number;
  maxInvestment?: number;
  investmentIncrement?: number;
  issuer?: string;
  productCode?: string;
  earlyRedemption?: boolean;
  redemptionFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWealthProductDetailsInput {
  productType: string;
  riskLevel: string;
  expectedReturn?: number;
  minReturn?: number;
  maxReturn?: number;
  returnType?: string;
  issueDate: Date;
  startDate: Date;
  maturityDate: Date;
  lockPeriod?: number;
  minInvestment?: number;
  maxInvestment?: number;
  investmentIncrement?: number;
  issuer?: string;
  productCode?: string;
  earlyRedemption?: boolean;
  redemptionFee?: number;
}

// ============================================
// 国债详情
// ============================================
export interface TreasuryDetails {
  id: string;
  assetId: string;
  treasuryType: string; // savings, book_entry, certificate
  termType?: string; // short_term, medium_term, long_term
  faceValue: number;
  couponRate: number;
  couponFrequency?: string;
  issueDate: Date;
  maturityDate: Date;
  termYears?: number;
  issuePrice?: number;
  issueNumber?: string;
  yieldToMaturity?: number;
  tradable?: boolean;
  minHoldingPeriod?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTreasuryDetailsInput {
  treasuryType: string;
  termType?: string;
  faceValue: number;
  couponRate: number;
  couponFrequency?: string;
  issueDate: Date;
  maturityDate: Date;
  termYears?: number;
  issuePrice?: number;
  issueNumber?: string;
  yieldToMaturity?: number;
  tradable?: boolean;
  minHoldingPeriod?: number;
}

// ============================================
// 联合类型
// ============================================
export type AssetDetails =
  | StockDetails
  | FundDetails
  | BondDetails
  | FuturesDetails
  | WealthProductDetails
  | TreasuryDetails;

export type CreateAssetDetailsInput =
  | CreateStockDetailsInput
  | CreateFundDetailsInput
  | CreateBondDetailsInput
  | CreateFuturesDetailsInput
  | CreateWealthProductDetailsInput
  | CreateTreasuryDetailsInput;

// ============================================
// 完整资产类型（带详情）
// ============================================
export interface AssetWithDetails extends BaseAsset {
  details?: AssetDetails;
}

// ============================================
// 创建资产请求
// ============================================
export interface CreateAssetWithDetailsRequest {
  // 基础字段
  symbol: string;
  name: string;
  assetTypeCode: string;
  countryId?: string | null;
  currency: string;
  isin?: string;
  cusip?: string;
  description?: string;
  riskLevel?: string;
  liquidityTag?: string;
  
  // 详情字段
  details?: CreateAssetDetailsInput;
}

// ============================================
// 资产类型枚举
// ============================================
export enum AssetTypeCode {
  STOCK = 'STOCK',
  OPTION = 'OPTION',
  STOCK_OPTION = 'STOCK_OPTION',
  FUND = 'FUND',
  BOND = 'BOND',
  FUTURES = 'FUTURES',
  WEALTH = 'WEALTH',
  TREASURY = 'TREASURY',
}

// ============================================
// 基金类型枚举
// ============================================
export enum FundType {
  EQUITY = 'equity',
  BOND = 'bond',
  HYBRID = 'hybrid',
  MONEY_MARKET = 'money_market',
  INDEX = 'index',
}

// ============================================
// 债券类型枚举
// ============================================
export enum BondType {
  GOVERNMENT = 'government',
  CORPORATE = 'corporate',
  MUNICIPAL = 'municipal',
  CONVERTIBLE = 'convertible',
}

// ============================================
// 期货类型枚举
// ============================================
export enum FuturesType {
  COMMODITY = 'commodity',
  FINANCIAL = 'financial',
  INDEX = 'index',
  CURRENCY = 'currency',
}

// ============================================
// 理财产品类型枚举
// ============================================
export enum WealthProductType {
  FIXED_INCOME = 'fixed_income',
  FLOATING = 'floating',
  STRUCTURED = 'structured',
}

// ============================================
// 风险等级枚举
// ============================================
export enum RiskLevel {
  R1 = 'R1',
  R2 = 'R2',
  R3 = 'R3',
  R4 = 'R4',
  R5 = 'R5',
}

// ============================================
// 国债类型枚举
// ============================================
export enum TreasuryType {
  SAVINGS = 'savings',
  BOOK_ENTRY = 'book_entry',
  CERTIFICATE = 'certificate',
}

// ============================================
// 股票期权详情
// ============================================
export interface StockOptionDetails {
  id: string;
  assetId: string;
  
  // 标的股票信息
  underlyingStockId?: string;
  underlyingStockSymbol?: string;
  underlyingStockName?: string;
  
  // 期权基本信息
  optionType: 'CALL' | 'PUT';
  strikePrice: number;
  expirationDate: Date;
  
  // 合约信息
  contractSize?: number;
  exerciseStyle?: 'AMERICAN' | 'EUROPEAN' | 'BERMUDA';
  settlementType?: 'PHYSICAL' | 'CASH';
  
  // 交易信息
  multiplier?: number;
  tradingUnit?: string;
  minPriceChange?: number;
  
  // 保证金和费用
  marginRequirement?: number;
  commissionRate?: number;
  
  // 希腊字母（Greeks）
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  
  // 波动率
  impliedVolatility?: number;
  historicalVolatility?: number;
  
  // 定价相关
  premiumCurrency?: string;
  intrinsicValue?: number;
  timeValue?: number;
  
  // 成本计算
  costDivisor?: number; // 默认 3.5
  
  // 备注
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStockOptionDetailsInput {
  // 标的股票信息
  underlyingStockId?: string;
  underlyingStockSymbol?: string;
  underlyingStockName?: string;
  
  // 期权基本信息
  optionType: 'CALL' | 'PUT';
  strikePrice: number;
  expirationDate: Date | string;
  
  // 合约信息
  contractSize?: number;
  exerciseStyle?: 'AMERICAN' | 'EUROPEAN' | 'BERMUDA';
  settlementType?: 'PHYSICAL' | 'CASH';
  
  // 交易信息
  multiplier?: number;
  tradingUnit?: string;
  minPriceChange?: number;
  
  // 保证金和费用
  marginRequirement?: number;
  commissionRate?: number;
  
  // 希腊字母
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  
  // 波动率
  impliedVolatility?: number;
  historicalVolatility?: number;
  
  // 定价相关
  premiumCurrency?: string;
  intrinsicValue?: number;
  timeValue?: number;
  
  // 成本计算
  costDivisor?: number;
  
  // 备注
  notes?: string;
}

// ============================================
// 期权类型枚举
// ============================================
export enum OptionType {
  CALL = 'CALL',
  PUT = 'PUT',
}

export enum ExerciseStyle {
  AMERICAN = 'AMERICAN',
  EUROPEAN = 'EUROPEAN',
  BERMUDA = 'BERMUDA',
}

export enum SettlementType {
  PHYSICAL = 'PHYSICAL',
  CASH = 'CASH',
}
