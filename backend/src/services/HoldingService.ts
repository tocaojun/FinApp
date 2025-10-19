import { databaseService } from './DatabaseService';

export interface Holding {
  id: string;
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  assetType: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  currency: string;
  firstPurchaseDate?: string;
  lastTransactionDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class HoldingService {
  
  // 获取投资组合的所有持仓
  async getHoldingsByPortfolio(userId: string, portfolioId: string): Promise<Holding[]> {
    // 验证投资组合所有权
    const portfolioCheck = await databaseService.prisma.$queryRaw`
      SELECT id FROM portfolios WHERE id = ${portfolioId}::uuid AND user_id = ${userId}::uuid
    `;
    
    if (!Array.isArray(portfolioCheck) || portfolioCheck.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    const query = `
      SELECT 
        p.id,
        p.portfolio_id,
        p.trading_account_id,
        p.asset_id,
        p.quantity,
        p.average_cost,
        p.total_cost,
        p.currency,
        p.first_purchase_date,
        p.last_transaction_date,
        p.is_active,
        p.created_at,
        p.updated_at,
        a.symbol as asset_symbol,
        a.name as asset_name,
        at.name as asset_type,
        COALESCE(ap.close_price, 0) as current_price
      FROM positions p
      JOIN assets a ON p.asset_id = a.id
      LEFT JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN LATERAL (
        SELECT close_price 
        FROM asset_prices 
        WHERE asset_id = p.asset_id 
        ORDER BY price_date DESC 
        LIMIT 1
      ) ap ON true
      WHERE p.portfolio_id = $1::uuid 
        AND p.is_active = true 
        AND p.quantity != 0
      ORDER BY p.updated_at DESC
    `;

    const result = await databaseService.executeRawQuery(query, [portfolioId]);
    const positions = Array.isArray(result) ? result : [];

    return positions.map(row => {
      const quantity = parseFloat(row.quantity) || 0;
      const averageCost = parseFloat(row.average_cost) || 0;
      const totalCost = Math.abs(parseFloat(row.total_cost) || 0); // 确保总成本为正数
      const currentPrice = parseFloat(row.current_price) || 0;
      const marketValue = quantity * currentPrice;
      // 正确的盈亏计算：(当前价格 - 平均成本) × 持仓数量
      const unrealizedPnL = (currentPrice - averageCost) * quantity;
      const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

      return {
        id: row.id,
        portfolioId: row.portfolio_id,
        tradingAccountId: row.trading_account_id,
        assetId: row.asset_id,
        assetSymbol: row.asset_symbol || 'N/A',
        assetName: row.asset_name || 'Unknown Asset',
        assetType: row.asset_type || 'Unknown',
        quantity,
        averageCost,
        totalCost,
        currentPrice,
        marketValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        currency: row.currency || 'CNY',
        firstPurchaseDate: row.first_purchase_date,
        lastTransactionDate: row.last_transaction_date,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
  }

  // 获取单个持仓详情
  async getHoldingById(userId: string, holdingId: string): Promise<Holding | null> {
    const query = `
      SELECT 
        p.id,
        p.portfolio_id,
        p.trading_account_id,
        p.asset_id,
        p.quantity,
        p.average_cost,
        p.total_cost,
        p.currency,
        p.first_purchase_date,
        p.last_transaction_date,
        p.is_active,
        p.created_at,
        p.updated_at,
        a.symbol as asset_symbol,
        a.name as asset_name,
        at.name as asset_type,
        COALESCE(ap.close_price, 0) as current_price,
        po.user_id
      FROM positions p
      JOIN assets a ON p.asset_id = a.id
      LEFT JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN LATERAL (
        SELECT close_price 
        FROM asset_prices 
        WHERE asset_id = p.asset_id 
        ORDER BY price_date DESC 
        LIMIT 1
      ) ap ON true
      JOIN portfolios po ON p.portfolio_id = po.id
      WHERE p.id = $1::uuid AND po.user_id = $2::uuid
    `;

    const result = await databaseService.executeRawQuery(query, [holdingId, userId]);
    const rows = Array.isArray(result) ? result : [];
    
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    const quantity = parseFloat(row.quantity) || 0;
    const averageCost = parseFloat(row.average_cost) || 0;
    const totalCost = Math.abs(parseFloat(row.total_cost) || 0); // 确保总成本为正数
    const currentPrice = parseFloat(row.current_price) || 0;
    const marketValue = quantity * currentPrice;
    // 正确的盈亏计算：(当前价格 - 平均成本) × 持仓数量
    const unrealizedPnL = (currentPrice - averageCost) * quantity;
    const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    return {
      id: row.id,
      portfolioId: row.portfolio_id,
      tradingAccountId: row.trading_account_id,
      assetId: row.asset_id,
      assetSymbol: row.asset_symbol || 'N/A',
      assetName: row.asset_name || 'Unknown Asset',
      assetType: row.asset_type || 'Unknown',
      quantity,
      averageCost,
      totalCost,
      currentPrice,
      marketValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      currency: row.currency || 'CNY',
      firstPurchaseDate: row.first_purchase_date,
      lastTransactionDate: row.last_transaction_date,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // 获取投资组合持仓汇总
  async getPortfolioHoldingSummary(userId: string, portfolioId: string): Promise<{
    totalValue: number;
    totalCost: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    assetCount: number;
    currency: string;
  }> {
    // 验证投资组合所有权
    const portfolioCheck = await databaseService.prisma.$queryRaw`
      SELECT id, base_currency FROM portfolios WHERE id = ${portfolioId}::uuid AND user_id = ${userId}::uuid
    `;
    
    if (!Array.isArray(portfolioCheck) || portfolioCheck.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    const baseCurrency = portfolioCheck[0].base_currency || 'CNY';

    const query = `
      SELECT 
        COUNT(*) as asset_count,
        SUM(p.total_cost) as total_cost,
        SUM(p.quantity * COALESCE(ap.close_price, 0)) as total_value
      FROM positions p
      LEFT JOIN LATERAL (
        SELECT close_price 
        FROM asset_prices 
        WHERE asset_id = p.asset_id 
        ORDER BY price_date DESC 
        LIMIT 1
      ) ap ON true
      WHERE p.portfolio_id = $1::uuid 
        AND p.is_active = true 
        AND p.quantity != 0
    `;

    const result = await databaseService.executeRawQuery(query, [portfolioId]);
    const rows = Array.isArray(result) ? result : [];
    
    if (rows.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        assetCount: 0,
        currency: baseCurrency
      };
    }

    const row = rows[0];
    const totalCost = parseFloat(row.total_cost) || 0;
    const totalValue = parseFloat(row.total_value) || 0;
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      assetCount: parseInt(row.asset_count) || 0,
      currency: baseCurrency
    };
  }
}