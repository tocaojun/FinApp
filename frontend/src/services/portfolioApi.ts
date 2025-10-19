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

// 获取所有投资组合汇总
export const getAllPortfoliosSummary = async (): Promise<PortfolioSummary> => {
  const response = await apiRequest<{
    success: boolean;
    data: PortfolioSummary;
  }>('/portfolios/summary');
  
  return response.data;
};

// 转换持仓数据为图表数据
export const convertHoldingsToChartData = (holdings: Holding[]) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#f5222d', '#fa8c16', '#13c2c2', '#eb2f96'];
  
  return holdings.map((holding, index) => ({
    name: holding.assetName || holding.assetSymbol,
    value: holding.marketValue,
    percentage: 0, // 需要在外部计算
    color: colors[index % colors.length]
  }));
};

// 生成模拟的流动性分布数据（基于实际持仓）
export const generateLiquidityData = (holdings: Holding[]) => {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  
  // 简单的流动性分类逻辑（可以根据资产类型进一步优化）
  const highLiquidity = holdings.filter(h => h.assetSymbol.match(/^[0-9]{5}$/)); // 港股
  const mediumLiquidity = holdings.filter(h => !h.assetSymbol.match(/^[0-9]{5}$/) && h.assetSymbol.length <= 4); // 美股等
  const lowLiquidity = holdings.filter(h => h.assetSymbol.length > 4 && !h.assetSymbol.match(/^[0-9]{5}$/)); // 其他
  
  const highValue = highLiquidity.reduce((sum, h) => sum + h.marketValue, 0);
  const mediumValue = mediumLiquidity.reduce((sum, h) => sum + h.marketValue, 0);
  const lowValue = lowLiquidity.reduce((sum, h) => sum + h.marketValue, 0);
  
  return [
    {
      category: '高流动性',
      amount: highValue,
      percentage: totalValue > 0 ? Math.round((highValue / totalValue) * 100) : 0,
      description: '可在1天内变现'
    },
    {
      category: '中等流动性',
      amount: mediumValue,
      percentage: totalValue > 0 ? Math.round((mediumValue / totalValue) * 100) : 0,
      description: '可在1周内变现'
    },
    {
      category: '低流动性',
      amount: lowValue,
      percentage: totalValue > 0 ? Math.round((lowValue / totalValue) * 100) : 0,
      description: '需要1个月以上变现'
    }
  ];
};