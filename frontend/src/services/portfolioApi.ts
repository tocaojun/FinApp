import { apiRequest } from './api';

// 投资组合相关的 API 接口
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  baseCurrency: string;
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;
  assetAllocation: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  performanceData: Array<{
    date: string;
    portfolioReturn: number;
    benchmarkReturn: number;
    cumulativeReturn: number;
  }>;
  liquidityDistribution: Array<{
    category: string;
    amount: number;
    percentage: number;
    description: string;
  }>;
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    var95: number;
    var99: number;
    beta: number;
    alpha: number;
    informationRatio: number;
    calmarRatio: number;
    sortinoRatio: number;
  };
}

export interface Holding {
  id: string;
  portfolioId: string;
  assetId: string;
  assetName: string;
  assetSymbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  currency: string;
}

// 获取投资组合列表
export const getPortfolios = async (): Promise<Portfolio[]> => {
  const response = await apiRequest<{
    success: boolean;
    data: Portfolio[];
  }>('/portfolios');
  
  return response.data || [];
};

// 获取投资组合详情
export const getPortfolio = async (portfolioId: string): Promise<Portfolio> => {
  const response = await apiRequest<{
    success: boolean;
    data: Portfolio;
  }>(`/portfolios/${portfolioId}`);
  
  return response.data;
};

// 获取投资组合汇总数据
export const getPortfolioSummary = async (portfolioId: string): Promise<PortfolioSummary> => {
  const response = await apiRequest<{
    success: boolean;
    data: PortfolioSummary;
  }>(`/portfolios/${portfolioId}/summary`);
  
  return response.data;
};

// 获取投资组合持仓
export const getPortfolioHoldings = async (portfolioId: string): Promise<Holding[]> => {
  const response = await apiRequest<{
    success: boolean;
    data: Holding[];
  }>(`/holdings?portfolioId=${portfolioId}`);
  
  return response.data || [];
};

// 获取投资组合余额历史数据
export const getPortfolioBalanceHistory = async (portfolioId: string, days: number = 30): Promise<Array<{
  date: string;
  total_balance: number;
  transaction_count: number;
}>> => {
  const response = await apiRequest<{
    success: boolean;
    data: Array<{
      date: string;
      total_balance: number;
      transaction_count: number;
    }>;
  }>(`/holdings/portfolio/${portfolioId}/balance-history-summary?days=${days}`);
  
  return response.data || [];
};

// 获取所有投资组合汇总
export const getAllPortfoliosSummary = async (): Promise<PortfolioSummary> => {
  try {
    const response = await apiRequest<{
      success: boolean;
      data: any;
    }>('/portfolios/summary');
    
    const data = response.data || {};
    
    // 处理后端返回的简化数据，转换为前端期望的完整格式
    return {
      totalValue: data.totalValue || 0,
      totalCost: data.totalValue || 0,
      totalReturn: data.totalReturn || 0,
      totalReturnPercent: data.totalReturnPercent || 0,
      assetAllocation: [],
      performanceData: [],
      liquidityDistribution: [],
      riskMetrics: {
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        var95: 0,
        var99: 0,
        beta: 0,
        alpha: 0,
        informationRatio: 0,
        calmarRatio: 0,
        sortinoRatio: 0,
      },
    };
  } catch (error) {
    console.error('获取投资组合汇总失败:', error);
    // 返回空数据结构而不是抛出异常
    return {
      totalValue: 0,
      totalCost: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      assetAllocation: [],
      performanceData: [],
      liquidityDistribution: [],
      riskMetrics: {
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        var95: 0,
        var99: 0,
        beta: 0,
        alpha: 0,
        informationRatio: 0,
        calmarRatio: 0,
        sortinoRatio: 0,
      },
    };
  }
};

// 转换持仓数据为图表数据
export const convertHoldingsToChartData = (holdings: Holding[]) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#f5222d', '#fa8c16', '#13c2c2', '#eb2f96'];
  
  return holdings.map((holding, index) => ({
    name: holding.assetName || holding.assetSymbol,
    // 使用转换后的市值（考虑汇率），如果没有则使用原市值
    value: holding.convertedMarketValue || holding.marketValue,
    percentage: 0, // 需要在外部计算
    color: colors[index % colors.length]
  }));
};

// 转换余额历史数据为收益率趋势数据
export const convertBalanceHistoryToReturnTrend = (
  balanceHistory: Array<{
    date: string;
    total_balance: number;
    transaction_count: number;
  }>
): Array<{
  date: string;
  portfolioReturn: number;
  benchmarkReturn?: number;
  cumulativeReturn: number;
  cumulativeBenchmark?: number;
}> => {
  if (balanceHistory.length === 0) return [];

  // 按日期排序（从早到晚）
  const sortedHistory = [...balanceHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const initialBalance = sortedHistory[0].total_balance;
  
  return sortedHistory.map((item, index) => {
    const currentBalance = item.total_balance;
    const previousBalance = index > 0 ? sortedHistory[index - 1].total_balance : initialBalance;
    
    // 计算日收益率
    const dailyReturn = previousBalance > 0 
      ? ((currentBalance - previousBalance) / previousBalance) * 100 
      : 0;
    
    // 计算累计收益率
    const cumulativeReturn = initialBalance > 0 
      ? ((currentBalance - initialBalance) / initialBalance) * 100 
      : 0;

    return {
      date: item.date,
      portfolioReturn: dailyReturn,
      benchmarkReturn: 0, // 暂时设为0，后续可以添加基准数据
      cumulativeReturn: cumulativeReturn,
      cumulativeBenchmark: 0, // 暂时设为0，后续可以添加基准数据
    };
  });
};
// 流动性数据接口（与组件接口匹配）
export interface LiquidityData {
  category: string;
  value: number;
  percentage: number;
  liquidityLevel: 'high' | 'medium' | 'low';
  avgLiquidationDays: number;
  assets: Array<{
    name: string;
    value: number;
    liquidityScore: number;
  }>;
}

// 根据资产类型和市场判断流动性等级
const getLiquidityLevel = (holding: Holding): 'high' | 'medium' | 'low' => {
  const symbol = holding.assetSymbol;
  const assetType = holding.assetType;
  
  // 现金类资产 - 高流动性
  if (assetType === 'CASH' || symbol === 'CASH') {
    return 'high';
  }
  
  // 港股 (5位数字) - 高流动性
  if (symbol.match(/^[0-9]{5}$/)) {
    return 'high';
  }
  
  // 美股主要股票 (1-4位字母) - 高流动性
  if (symbol.match(/^[A-Z]{1,4}$/)) {
    return 'high';
  }
  
  // A股 (6位数字) - 中等流动性
  if (symbol.match(/^[0-9]{6}$/)) {
    return 'medium';
  }
  
  // 基金、ETF - 中等流动性
  if (assetType === 'FUND' || assetType === 'ETF' || symbol.includes('ETF')) {
    return 'medium';
  }
  
  // 债券 - 中等流动性
  if (assetType === 'BOND' || symbol.includes('BOND')) {
    return 'medium';
  }
  
  // 其他复杂产品 - 低流动性
  return 'low';
};

// 根据流动性等级获取平均变现天数
const getAvgLiquidationDays = (level: 'high' | 'medium' | 'low'): number => {
  switch (level) {
    case 'high': return 1;
    case 'medium': return 7;
    case 'low': return 30;
  }
};

// 计算流动性评分 (0-100)
const getLiquidityScore = (holding: Holding): number => {
  const level = getLiquidityLevel(holding);
  const marketValue = holding.convertedMarketValue || holding.marketValue;
  
  // 基础分数
  let baseScore = 0;
  switch (level) {
    case 'high': baseScore = 90; break;
    case 'medium': baseScore = 60; break;
    case 'low': baseScore = 30; break;
  }
  
  // 根据市值调整（市值越大，流动性可能越好）
  const valueBonus = Math.min(10, Math.log10(marketValue) * 2);
  
  return Math.min(100, baseScore + valueBonus);
};

export const generateLiquidityData = (holdings: Holding[]): LiquidityData[] => {
  // 使用转换后的市值（考虑汇率），如果没有则使用原市值
  const totalValue = holdings.reduce((sum, holding) => sum + (holding.convertedMarketValue || holding.marketValue), 0);
  
  // 按流动性等级分类持仓
  const highLiquidityHoldings = holdings.filter(h => getLiquidityLevel(h) === 'high');
  const mediumLiquidityHoldings = holdings.filter(h => getLiquidityLevel(h) === 'medium');
  const lowLiquidityHoldings = holdings.filter(h => getLiquidityLevel(h) === 'low');
  
  // 计算各类别的总价值
  const highValue = highLiquidityHoldings.reduce((sum, h) => sum + (h.convertedMarketValue || h.marketValue), 0);
  const mediumValue = mediumLiquidityHoldings.reduce((sum, h) => sum + (h.convertedMarketValue || h.marketValue), 0);
  const lowValue = lowLiquidityHoldings.reduce((sum, h) => sum + (h.convertedMarketValue || h.marketValue), 0);
  
  // 构建符合接口的数据结构
  const result: LiquidityData[] = [
    {
      category: '高流动性资产',
      value: highValue,
      percentage: totalValue > 0 ? Math.round((highValue / totalValue) * 100) : 0,
      liquidityLevel: 'high',
      avgLiquidationDays: getAvgLiquidationDays('high'),
      assets: highLiquidityHoldings.map(h => ({
        name: h.assetName || h.assetSymbol,
        value: h.convertedMarketValue || h.marketValue,
        liquidityScore: getLiquidityScore(h)
      }))
    },
    {
      category: '中等流动性资产',
      value: mediumValue,
      percentage: totalValue > 0 ? Math.round((mediumValue / totalValue) * 100) : 0,
      liquidityLevel: 'medium',
      avgLiquidationDays: getAvgLiquidationDays('medium'),
      assets: mediumLiquidityHoldings.map(h => ({
        name: h.assetName || h.assetSymbol,
        value: h.convertedMarketValue || h.marketValue,
        liquidityScore: getLiquidityScore(h)
      }))
    },
    {
      category: '低流动性资产',
      value: lowValue,
      percentage: totalValue > 0 ? Math.round((lowValue / totalValue) * 100) : 0,
      liquidityLevel: 'low',
      avgLiquidationDays: getAvgLiquidationDays('low'),
      assets: lowLiquidityHoldings.map(h => ({
        name: h.assetName || h.assetSymbol,
        value: h.convertedMarketValue || h.marketValue,
        liquidityScore: getLiquidityScore(h)
      }))
    }
  ];
  
  // 过滤掉价值为0的类别
  return result.filter(item => item.value > 0);
};