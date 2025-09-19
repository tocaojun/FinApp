import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './DatabaseService';
import { 
  Portfolio, 
  CreatePortfolioRequest, 
  UpdatePortfolioRequest,
  TradingAccount,
  CreateTradingAccountRequest,
  UpdateTradingAccountRequest,
  Asset,
  CreateAssetRequest,
  UpdateAssetRequest,
  Position,
  PortfolioSummary,
  CurrencyCode
} from '../types/portfolio';

export class PortfolioService {
  private readonly SUPPORTED_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD'];
  
  // 汇率缓存 (实际应用中应该从外部API获取)
  private readonly EXCHANGE_RATES: Record<string, number> = {
    'USD': 1.0,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110.0,
    'CNY': 6.45,
    'HKD': 7.8
  };

  async createPortfolio(userId: string, data: CreatePortfolioRequest): Promise<Portfolio> {
    const portfolio: Portfolio = {
      id: uuidv4(),
      userId,
      name: data.name,
      description: data.description,
      baseCurrency: data.baseCurrency || 'USD',
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 验证基础货币
    if (!this.SUPPORTED_CURRENCIES.includes(portfolio.baseCurrency as CurrencyCode)) {
      throw new Error(`Unsupported base currency: ${portfolio.baseCurrency}`);
    }

    const query = `
      INSERT INTO finapp.portfolios (
        id, user_id, name, description, base_currency
      ) VALUES ($1::uuid, $2::uuid, $3, $4, $5)
      RETURNING *
    `;
    
    await databaseService.executeRawCommand(query, [
      portfolio.id, portfolio.userId, portfolio.name, portfolio.description,
      portfolio.baseCurrency
    ]);

    return portfolio;
  }

  async getPortfoliosByUserId(userId: string): Promise<Portfolio[]> {
    const query = `
      SELECT * FROM finapp.portfolios 
      WHERE user_id = $1::uuid 
      ORDER BY created_at DESC
    `;
    
    const result = await databaseService.executeRawQuery(query, [userId]);
    return Array.isArray(result) ? result.map(this.mapRowToPortfolio) : [];
  }

  async getPortfolioById(userId: string, portfolioId: string): Promise<Portfolio | null> {
    const query = `
      SELECT * FROM finapp.portfolios 
      WHERE id = $1::uuid AND user_id = $2::uuid
    `;
    
    const result = await databaseService.executeRawQuery(query, [portfolioId, userId]);
    const rows = Array.isArray(result) ? result : [];
    return rows.length > 0 ? this.mapRowToPortfolio(rows[0]) : null;
  }

  async updatePortfolio(userId: string, portfolioId: string, data: UpdatePortfolioRequest): Promise<Portfolio | null> {
    const existingPortfolio = await this.getPortfolioById(userId, portfolioId);
    if (!existingPortfolio) {
      return null;
    }

    // 验证基础货币
    if (data.baseCurrency && !this.SUPPORTED_CURRENCIES.includes(data.baseCurrency as CurrencyCode)) {
      throw new Error(`Unsupported base currency: ${data.baseCurrency}`);
    }

    const updatedPortfolio: Portfolio = {
      ...existingPortfolio,
      name: data.name ?? existingPortfolio.name,
      description: data.description ?? existingPortfolio.description,
      baseCurrency: data.baseCurrency ?? existingPortfolio.baseCurrency,
      updatedAt: new Date()
    };

    const query = `
      UPDATE portfolios 
      SET name = $3, description = $4, base_currency = $5, updated_at = $6
      WHERE id = $1::uuid AND user_id = $2::uuid
      RETURNING *
    `;
    
    const values = [
      portfolioId, userId, updatedPortfolio.name, updatedPortfolio.description,
      updatedPortfolio.baseCurrency, updatedPortfolio.updatedAt
    ];
    
    const result = await databaseService.executeRawQuery(query, values);
    const rows = Array.isArray(result) ? result : [];
    return rows.length > 0 ? this.mapRowToPortfolio(rows[0]) : null;
  }

  async deletePortfolio(userId: string, portfolioId: string): Promise<boolean> {
    // 删除相关的持仓和交易账户
    await databaseService.executeRawCommand('DELETE FROM positions WHERE portfolio_id = $1::uuid', [portfolioId]);
    await databaseService.executeRawCommand('DELETE FROM trading_accounts WHERE portfolio_id = $1::uuid', [portfolioId]);
    await databaseService.executeRawCommand('DELETE FROM portfolios WHERE id = $1::uuid AND user_id = $2::uuid', [portfolioId, userId]);
    
    return true;
  }

  async getPortfolioSummary(userId: string, portfolioId: string): Promise<PortfolioSummary | null> {
    const portfolio = await this.getPortfolioById(userId, portfolioId);
    if (!portfolio) {
      return null;
    }

    // 获取交易账户统计
    const accountsQuery = `
      SELECT COUNT(*) as account_count, 
             COALESCE(SUM(current_balance), 0) as total_balance
      FROM finapp.trading_accounts 
      WHERE portfolio_id = $1::uuid
    `;
    
    const accountsResult = await databaseService.executeRawQuery(accountsQuery, [portfolioId]);
    const accountsData = Array.isArray(accountsResult) ? accountsResult[0] : { account_count: 0, total_balance: 0 };

    // 获取持仓统计
    const positionsQuery = `
      SELECT COUNT(*) as position_count,
             COUNT(DISTINCT asset_id) as unique_assets,
             COALESCE(SUM(total_cost), 0) as total_position_value
      FROM finapp.positions 
      WHERE portfolio_id = $1::uuid AND is_active = true
    `;
    
    const positionsResult = await databaseService.executeRawQuery(positionsQuery, [portfolioId]);
    const positionsData = Array.isArray(positionsResult) ? positionsResult[0] : { 
      position_count: 0, 
      unique_assets: 0, 
      total_position_value: 0 
    };

    return {
      portfolio,
      totalAccounts: parseInt(accountsData.account_count) || 0,
      totalBalance: parseFloat(accountsData.total_balance) || 0,
      totalPositions: parseInt(positionsData.position_count) || 0,
      uniqueAssets: parseInt(positionsData.unique_assets) || 0,
      totalPositionValue: parseFloat(positionsData.total_position_value) || 0,
      lastUpdated: portfolio.updatedAt
    };
  }

  // 交易账户管理
  async createTradingAccount(userId: string, portfolioId: string, data: CreateTradingAccountRequest): Promise<TradingAccount> {
    // 验证投资组合所有权
    const portfolio = await this.getPortfolioById(userId, portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const account: TradingAccount = {
      id: uuidv4(),
      portfolioId,
      name: data.name,
      broker: data.broker,
      accountNumber: data.accountNumber,
      accountType: data.accountType,
      currency: data.currency || portfolio.baseCurrency,
      balance: data.balance || 0,
      availableBalance: data.availableBalance || data.balance || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const query = `
      INSERT INTO trading_accounts (
        id, portfolio_id, name, broker, account_number, account_type,
        currency, balance, available_balance, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    await databaseService.executeRawCommand(query, [
      account.id, account.portfolioId, account.name, account.broker,
      account.accountNumber, account.accountType, account.currency,
      account.balance, account.availableBalance, account.createdAt, account.updatedAt
    ]);

    return account;
  }

  async getTradingAccounts(userId: string, portfolioId: string): Promise<TradingAccount[]> {
    // 验证投资组合所有权
    const portfolio = await this.getPortfolioById(userId, portfolioId);
    if (!portfolio) {
      return [];
    }

    const query = `
      SELECT * FROM trading_accounts 
      WHERE portfolio_id = $1::uuid 
      ORDER BY created_at DESC
    `;
    
    const result = await databaseService.executeRawQuery(query, [portfolioId]);
    return Array.isArray(result) ? result.map(this.mapRowToTradingAccount) : [];
  }

  async updateTradingAccount(
    userId: string, 
    portfolioId: string, 
    accountId: string, 
    data: UpdateTradingAccountRequest
  ): Promise<TradingAccount | null> {
    // 验证投资组合所有权
    const portfolio = await this.getPortfolioById(userId, portfolioId);
    if (!portfolio) {
      return null;
    }

    const query = `
      UPDATE trading_accounts 
      SET name = COALESCE($4, name),
          broker = COALESCE($5, broker),
          account_number = COALESCE($6, account_number),
          account_type = COALESCE($7, account_type),
          currency = COALESCE($8, currency),
          balance = COALESCE($9, balance),
          available_balance = COALESCE($10, available_balance),
          updated_at = $11
      WHERE id = $1::uuid AND portfolio_id = $2::uuid
      RETURNING *
    `;
    
    const params = [
      accountId, portfolioId, userId, data.name, data.broker, data.accountNumber,
      data.accountType, data.currency, data.balance, data.availableBalance, new Date()
    ];
    
    const result = await databaseService.executeRawQuery(query, params);
    const rows = Array.isArray(result) ? result : [];
    return rows.length > 0 ? this.mapRowToTradingAccount(rows[0]) : null;
  }

  // 资产管理
  async createAsset(userId: string, portfolioId: string, data: CreateAssetRequest): Promise<Asset> {
    // 验证投资组合所有权
    const portfolio = await this.getPortfolioById(userId, portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const asset: Asset = {
      id: uuidv4(),
      portfolioId,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      assetType: data.assetType,
      exchange: data.exchange,
      currency: data.currency || portfolio.baseCurrency,
      currentPrice: data.currentPrice || 0,
      previousClose: data.previousClose,
      marketCap: data.marketCap,
      volume: data.volume,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const query = `
      INSERT INTO assets (
        id, portfolio_id, symbol, name, asset_type, exchange, currency,
        current_price, previous_close, market_cap, volume, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const result = await databaseService.executeRawQuery(query, [
      asset.id, asset.portfolioId, asset.symbol, asset.name, asset.assetType,
      asset.exchange, asset.currency, asset.currentPrice, asset.previousClose,
      asset.marketCap, asset.volume, asset.createdAt, asset.updatedAt
    ]);

    return asset;
  }

  // 辅助方法
  private mapRowToPortfolio(row: any): Portfolio {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name || '',
      description: row.description || '',
      baseCurrency: row.base_currency || 'CNY',
      totalValue: 0, // 这些字段需要通过计算得出
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToTradingAccount(row: any): TradingAccount {
    return {
      id: row.id,
      portfolioId: row.portfolio_id,
      name: row.name,
      broker: row.broker,
      accountNumber: row.account_number,
      accountType: row.account_type,
      currency: row.currency,
      balance: parseFloat(row.balance) || 0,
      availableBalance: parseFloat(row.available_balance) || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const fromRate = this.EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = this.EXCHANGE_RATES[toCurrency] || 1;
    
    return (amount / fromRate) * toRate;
  }
}

export const portfolioService = new PortfolioService();