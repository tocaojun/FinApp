import { databaseService } from './DatabaseService';
import { ExchangeRateService } from './ExchangeRateService';

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
  currency: string; // 资产币种（从assets表获取）
  portfolioCurrency?: string; // 投资组合基础币种
  exchangeRate?: number; // 汇率（资产币种 -> 投资组合币种）
  convertedMarketValue?: number; // 转换后的市值
  convertedTotalCost?: number; // 转换后的总成本
  convertedUnrealizedPnL?: number; // 转换后的未实现盈亏
  firstPurchaseDate?: string;
  lastTransactionDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 理财产品相关字段
  productMode?: 'QUANTITY' | 'BALANCE';
  netAssetValue?: number; // 数量型产品的单位净值
  balance?: number; // 余额型产品的余额
  lastNavUpdate?: string; // 最后净值更新时间
}

export class HoldingService {
  private exchangeRateService: ExchangeRateService;

  constructor() {
    this.exchangeRateService = new ExchangeRateService();
  }
  
  // 获取投资组合的所有持仓
  async getHoldingsByPortfolio(userId: string, portfolioId: string): Promise<Holding[]> {
    // 验证投资组合所有权并获取基础币种
    const portfolioCheck = await databaseService.prisma.$queryRaw<Array<{id: string, base_currency: string}>>`
      SELECT id, base_currency FROM portfolios WHERE id = ${portfolioId}::uuid AND user_id = ${userId}::uuid
    `;
    
    if (!Array.isArray(portfolioCheck) || portfolioCheck.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    const portfolioCurrency = portfolioCheck[0].base_currency || 'CNY';

    const query = `
      SELECT 
        p.id,
        p.portfolio_id,
        p.trading_account_id,
        p.asset_id,
        p.quantity,
        p.average_cost,
        p.total_cost,
        p.currency as position_currency,  -- 使用 position 表的 currency
        a.currency as asset_currency,     -- 保留 asset currency 用于对比
        p.first_purchase_date,
        p.last_transaction_date,
        p.is_active,
        p.created_at,
        p.updated_at,
        -- 理财产品相关字段
        p.product_mode,
        p.net_asset_value,
        p.balance,
        p.last_nav_update,
        a.symbol as asset_symbol,
        a.name as asset_name,
        at.name as asset_type,
        at.code as asset_type_code,
        -- 股票期权特殊字段
        sod.underlying_stock_id,
        sod.strike_price,
        sod.option_type,
        -- 计算当前价格：
        -- 对于股票期权，使用标的股票价格计算内在价值
        -- 对于其他资产，使用资产自身价格
        CASE 
          WHEN at.code = 'STOCK_OPTION' THEN
            COALESCE(
              (SELECT close_price FROM asset_prices 
               WHERE asset_id = sod.underlying_stock_id 
               ORDER BY price_date DESC LIMIT 1),
              0
            )
          ELSE
            COALESCE(ap.close_price, 0)
        END as current_price,
        -- 标的股票价格（仅用于股票期权）
        CASE 
          WHEN at.code = 'STOCK_OPTION' THEN
            COALESCE(
              (SELECT close_price FROM asset_prices 
               WHERE asset_id = sod.underlying_stock_id 
               ORDER BY price_date DESC LIMIT 1),
              0
            )
          ELSE NULL
        END as underlying_stock_price
      FROM positions p
      JOIN assets a ON p.asset_id = a.id
      LEFT JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN finapp.stock_option_details sod ON a.id = sod.asset_id
      LEFT JOIN LATERAL (
        SELECT close_price 
        FROM asset_prices 
        WHERE asset_id = p.asset_id 
        ORDER BY price_date DESC 
        LIMIT 1
      ) ap ON true
      WHERE p.portfolio_id = $1::uuid 
        AND p.is_active = true 
        AND (
          (p.product_mode = 'BALANCE' AND COALESCE(p.balance, 0) > 0)
          OR (p.product_mode != 'BALANCE' AND p.quantity != 0)
          OR (p.product_mode IS NULL AND p.quantity != 0)
        )
      ORDER BY p.updated_at DESC
    `;

    const result = await databaseService.executeRawQuery(query, [portfolioId]);
    const positions = Array.isArray(result) ? result : [];

    // 收集所有需要的汇率对，使用 position_currency
    const currencyPairs = new Set<string>();
    positions.forEach(row => {
      const positionCurrency = row.position_currency || 'CNY';
      if (positionCurrency !== portfolioCurrency) {
        currencyPairs.add(`${positionCurrency}/${portfolioCurrency}`);
      }
    });

    // 批量获取汇率
    const exchangeRates = new Map<string, number>();
    for (const pair of currencyPairs) {
      const [from, to] = pair.split('/');
      try {
        const rateData = await this.exchangeRateService.getLatestRate(from, to);
        if (rateData) {
          exchangeRates.set(pair, rateData.rate);
        }
      } catch (error) {
        console.warn(`Failed to get exchange rate for ${pair}:`, error);
        // 使用默认汇率1.0
        exchangeRates.set(pair, 1.0);
      }
    }

    return positions.map(row => {
      const quantity = parseFloat(row.quantity) || 0;
      const averageCost = parseFloat(row.average_cost) || 0;
      const totalCost = Math.abs(parseFloat(row.total_cost) || 0); // 确保总成本为正数
      
      let currentPrice = parseFloat(row.current_price) || 0;
      let marketValue = 0;
      
      // 理财产品特殊处理
      if (row.product_mode === 'QUANTITY' && row.net_asset_value) {
        // 数量型净值产品：使用净值作为当前价格
        currentPrice = parseFloat(row.net_asset_value);
        marketValue = quantity * currentPrice;
      } else if (row.product_mode === 'BALANCE' && row.balance) {
        // 余额型理财产品：余额就是市值，价格设为1
        currentPrice = 1;
        marketValue = parseFloat(row.balance);
      } else if (row.asset_type_code === 'STOCK_OPTION') {
        const underlyingStockPrice = parseFloat(row.underlying_stock_price) || 0;
        const strikePrice = parseFloat(row.strike_price) || 0;
        const optionType = row.option_type;
        
        // 计算期权内在价值
        let intrinsicValue = 0;
        if (optionType === 'CALL') {
          // 看涨期权：max(标的价格 - 行权价, 0)
          intrinsicValue = Math.max(underlyingStockPrice - strikePrice, 0);
        } else if (optionType === 'PUT') {
          // 看跌期权：max(行权价 - 标的价格, 0)
          intrinsicValue = Math.max(strikePrice - underlyingStockPrice, 0);
        }
        
        // 期权的当前价格就是内在价值（简化计算，不考虑时间价值）
        currentPrice = intrinsicValue;
        marketValue = quantity * intrinsicValue;
      } else {
        // 其他资产：市值 = 数量 × 当前价格
        marketValue = quantity * currentPrice;
      }
      
      // 盈亏计算：根据产品类型使用不同的计算方式
      let unrealizedPnL = 0;
      if (row.product_mode === 'BALANCE') {
        // 余额型产品：当前余额 - 总成本
        unrealizedPnL = marketValue - totalCost;
      } else {
        // 其他产品：(当前价格 - 平均成本) × 持仓数量
        unrealizedPnL = (currentPrice - averageCost) * quantity;
      }
      const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

      // 使用 position 表的 currency，而不是 asset 表的
      const positionCurrency = row.position_currency || 'CNY';
      const assetCurrency = row.asset_currency || 'CNY';
      
      // 如果 position currency 与 asset currency 不一致，记录警告
      if (positionCurrency !== assetCurrency) {
        console.warn(
          `[Currency Mismatch Detected] Position ${row.id}: ` +
          `position.currency=${positionCurrency}, asset.currency=${assetCurrency}. ` +
          `Asset: ${row.asset_symbol} (${row.asset_name})`
        );
      }
      
      const exchangeRateKey = `${positionCurrency}/${portfolioCurrency}`;
      const exchangeRate = positionCurrency === portfolioCurrency ? 1.0 : (exchangeRates.get(exchangeRateKey) || 1.0);

      // 计算转换后的金额
      const convertedMarketValue = marketValue * exchangeRate;
      const convertedTotalCost = totalCost * exchangeRate;
      const convertedUnrealizedPnL = unrealizedPnL * exchangeRate;

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
        currency: positionCurrency,  // 使用 position 的 currency
        portfolioCurrency,
        exchangeRate,
        convertedMarketValue,
        convertedTotalCost,
        convertedUnrealizedPnL,
        firstPurchaseDate: row.first_purchase_date,
        lastTransactionDate: row.last_transaction_date,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        
        // 理财产品相关字段
        productMode: row.product_mode as 'QUANTITY' | 'BALANCE' | undefined,
        netAssetValue: row.net_asset_value ? parseFloat(row.net_asset_value) : undefined,
        balance: row.balance ? parseFloat(row.balance) : undefined,
        lastNavUpdate: row.last_nav_update
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
        p.currency as position_currency,  -- 使用 position 表的 currency
        a.currency as asset_currency,     -- 保留 asset currency 用于对比
        p.first_purchase_date,
        p.last_transaction_date,
        p.is_active,
        p.created_at,
        p.updated_at,
        -- 理财产品相关字段
        p.product_mode,
        p.net_asset_value,
        p.balance,
        p.last_nav_update,
        a.symbol as asset_symbol,
        a.name as asset_name,
        at.name as asset_type,
        at.code as asset_type_code,
        po.user_id,
        po.base_currency as portfolio_currency,
        -- 股票期权特殊字段
        sod.underlying_stock_id,
        sod.strike_price,
        sod.option_type,
        -- 计算当前价格
        CASE 
          WHEN at.code = 'STOCK_OPTION' THEN
            COALESCE(
              (SELECT close_price FROM asset_prices 
               WHERE asset_id = sod.underlying_stock_id 
               ORDER BY price_date DESC LIMIT 1),
              0
            )
          ELSE
            COALESCE(ap.close_price, 0)
        END as current_price,
        -- 标的股票价格
        CASE 
          WHEN at.code = 'STOCK_OPTION' THEN
            COALESCE(
              (SELECT close_price FROM asset_prices 
               WHERE asset_id = sod.underlying_stock_id 
               ORDER BY price_date DESC LIMIT 1),
              0
            )
          ELSE NULL
        END as underlying_stock_price
      FROM positions p
      JOIN assets a ON p.asset_id = a.id
      LEFT JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN finapp.stock_option_details sod ON a.id = sod.asset_id
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
    const portfolioCurrency = row.portfolio_currency || 'CNY';
    const positionCurrency = row.position_currency || 'CNY';  // 使用 position_currency
    const assetCurrency = row.asset_currency || 'CNY';
    
    // 如果 position currency 与 asset currency 不一致，记录警告
    if (positionCurrency !== assetCurrency) {
      console.warn(
        `[Currency Mismatch Detected] Position ${row.id}: ` +
        `position.currency=${positionCurrency}, asset.currency=${assetCurrency}. ` +
        `Asset: ${row.asset_symbol} (${row.asset_name})`
      );
    }
    
    const quantity = parseFloat(row.quantity) || 0;
    const averageCost = parseFloat(row.average_cost) || 0;
    const totalCost = Math.abs(parseFloat(row.total_cost) || 0); // 确保总成本为正数
    
    let currentPrice = parseFloat(row.current_price) || 0;
    let marketValue = 0;
    
    // 理财产品特殊处理
    if (row.product_mode === 'QUANTITY' && row.net_asset_value) {
      // 数量型净值产品：使用净值作为当前价格
      currentPrice = parseFloat(row.net_asset_value);
      marketValue = quantity * currentPrice;
    } else if (row.product_mode === 'BALANCE' && row.balance) {
      // 余额型理财产品：余额就是市值，价格设为1
      currentPrice = 1;
      marketValue = parseFloat(row.balance);
    } else if (row.asset_type_code === 'STOCK_OPTION') {
      const underlyingStockPrice = parseFloat(row.underlying_stock_price) || 0;
      const strikePrice = parseFloat(row.strike_price) || 0;
      const optionType = row.option_type;
      
      // 计算期权内在价值
      let intrinsicValue = 0;
      if (optionType === 'CALL') {
        // 看涨期权：max(标的价格 - 行权价, 0)
        intrinsicValue = Math.max(underlyingStockPrice - strikePrice, 0);
      } else if (optionType === 'PUT') {
        // 看跌期权：max(行权价 - 标的价格, 0)
        intrinsicValue = Math.max(strikePrice - underlyingStockPrice, 0);
      }
      
      // 期权的当前价格就是内在价值
      currentPrice = intrinsicValue;
      marketValue = quantity * intrinsicValue;
    } else {
      // 其他资产：市值 = 数量 × 当前价格
      marketValue = quantity * currentPrice;
    }
    
    // 盈亏计算：根据产品类型使用不同的计算方式
    let unrealizedPnL = 0;
    if (row.product_mode === 'BALANCE') {
      // 余额型产品：当前余额 - 总成本
      unrealizedPnL = marketValue - totalCost;
    } else {
      // 其他产品：(当前价格 - 平均成本) × 持仓数量
      unrealizedPnL = (currentPrice - averageCost) * quantity;
    }
    const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    // 使用 position_currency 获取汇率
    let exchangeRate = 1.0;
    if (positionCurrency !== portfolioCurrency) {
      try {
        const rateData = await this.exchangeRateService.getLatestRate(positionCurrency, portfolioCurrency);
        if (rateData) {
          exchangeRate = rateData.rate;
        }
      } catch (error) {
        console.warn(`Failed to get exchange rate for ${positionCurrency}/${portfolioCurrency}:`, error);
      }
    }

    // 计算转换后的金额
    const convertedMarketValue = marketValue * exchangeRate;
    const convertedTotalCost = totalCost * exchangeRate;
    const convertedUnrealizedPnL = unrealizedPnL * exchangeRate;

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
      currency: positionCurrency,  // 使用 position 的 currency
      portfolioCurrency,
      exchangeRate,
      convertedMarketValue,
      convertedTotalCost,
      convertedUnrealizedPnL,
      firstPurchaseDate: row.first_purchase_date,
      lastTransactionDate: row.last_transaction_date,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      
      // 理财产品相关字段
      productMode: row.product_mode as 'QUANTITY' | 'BALANCE' | undefined,
      netAssetValue: row.net_asset_value ? parseFloat(row.net_asset_value) : undefined,
      balance: row.balance ? parseFloat(row.balance) : undefined,
      lastNavUpdate: row.last_nav_update
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
    // 使用getHoldingsByPortfolio获取所有持仓（已包含币种转换）
    const holdings = await this.getHoldingsByPortfolio(userId, portfolioId);
    
    if (holdings.length === 0) {
      // 获取投资组合基础币种
      const portfolioCheck = await databaseService.prisma.$queryRaw<Array<{base_currency: string}>>`
        SELECT base_currency FROM portfolios WHERE id = ${portfolioId}::uuid AND user_id = ${userId}::uuid
      `;
      const baseCurrency = (portfolioCheck && portfolioCheck[0]?.base_currency) || 'CNY';
      
      return {
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        assetCount: 0,
        currency: baseCurrency
      };
    }

    // 使用转换后的金额进行汇总
    let totalValue = 0;
    let totalCost = 0;
    
    holdings.forEach(holding => {
      totalValue += holding.convertedMarketValue || 0;
      totalCost += holding.convertedTotalCost || 0;
    });

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      assetCount: holdings.length,
      currency: holdings[0].portfolioCurrency || 'CNY'
    };
  }
}