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
    // 获取用户当前投资组合数量，用于设置排序顺序
    const countQuery = `SELECT COUNT(*) as count FROM finapp.portfolios WHERE user_id = $1::uuid`;
    const countResult = await databaseService.executeRawQuery(countQuery, [userId]);
    const nextSortOrder = data.sortOrder !== undefined ? data.sortOrder : (parseInt(countResult[0]?.count) || 0);

    const portfolio: Portfolio = {
      id: uuidv4(),
      userId,
      name: data.name,
      description: data.description,
      baseCurrency: data.baseCurrency || 'USD',
      sortOrder: nextSortOrder,
      isDefault: data.isDefault || false,
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

    // 如果设置为默认投资组合，先取消其他默认设置
    if (portfolio.isDefault) {
      const updateDefaultQuery = `
        UPDATE finapp.portfolios 
        SET is_default = false 
        WHERE user_id = $1::uuid AND is_default = true
      `;
      await databaseService.executeRawCommand(updateDefaultQuery, [userId]);
    }

    const query = `
      INSERT INTO finapp.portfolios (
        id, user_id, name, description, base_currency, sort_order, is_default
      ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    await databaseService.executeRawCommand(query, [
      portfolio.id, portfolio.userId, portfolio.name, portfolio.description,
      portfolio.baseCurrency, portfolio.sortOrder, portfolio.isDefault
    ]);

    return portfolio;
  }

  async getPortfoliosByUserId(userId: string): Promise<Portfolio[]> {
    const query = `
      SELECT 
        p.*,
        COALESCE(SUM(pos.quantity * pos.average_cost), 0) as total_cost,
        COALESCE(SUM(pos.quantity * COALESCE(ap.close_price, pos.average_cost)), 0) as total_value,
        COUNT(DISTINCT pos.asset_id) as asset_count,
        COUNT(pos.id) as position_count
      FROM finapp.portfolios p
      LEFT JOIN finapp.positions pos ON p.id = pos.portfolio_id AND pos.is_active = true
      LEFT JOIN finapp.assets a ON pos.asset_id = a.id
      LEFT JOIN finapp.asset_prices ap ON a.id = ap.asset_id 
        AND ap.price_date = (
          SELECT MAX(price_date) 
          FROM finapp.asset_prices ap2 
          WHERE ap2.asset_id = a.id
        )
      WHERE p.user_id = $1::uuid 
      GROUP BY p.id, p.user_id, p.name, p.description, p.base_currency, p.sort_order, p.is_default, p.created_at, p.updated_at
      ORDER BY p.sort_order ASC, p.created_at ASC
    `;
    
    const result = await databaseService.executeRawQuery(query, [userId]);
    return Array.isArray(result) ? result.map(this.mapRowToPortfolioWithCalculations) : [];
  }

  async getPortfolioById(userId: string, portfolioId: string): Promise<Portfolio | null> {
    const query = `
      SELECT 
        p.*,
        COALESCE(SUM(pos.quantity * pos.average_cost), 0) as total_cost,
        COALESCE(SUM(pos.quantity * COALESCE(ap.close_price, pos.average_cost)), 0) as total_value,
        COUNT(DISTINCT pos.asset_id) as asset_count,
        COUNT(pos.id) as position_count
      FROM finapp.portfolios p
      LEFT JOIN finapp.positions pos ON p.id = pos.portfolio_id AND pos.is_active = true
      LEFT JOIN finapp.assets a ON pos.asset_id = a.id
      LEFT JOIN finapp.asset_prices ap ON a.id = ap.asset_id 
        AND ap.price_date = (
          SELECT MAX(price_date) 
          FROM finapp.asset_prices ap2 
          WHERE ap2.asset_id = a.id
        )
      WHERE p.id = $1::uuid AND p.user_id = $2::uuid
      GROUP BY p.id, p.user_id, p.name, p.description, p.base_currency, p.created_at, p.updated_at
    `;
    
    const result = await databaseService.executeRawQuery(query, [portfolioId, userId]);
    const rows = Array.isArray(result) ? result : [];
    return rows.length > 0 ? this.mapRowToPortfolioWithCalculations(rows[0]) : null;
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

    // 如果设置为默认投资组合，先取消其他默认设置
    if (data.isDefault === true) {
      const updateDefaultQuery = `
        UPDATE finapp.portfolios 
        SET is_default = false 
        WHERE user_id = $1::uuid AND is_default = true AND id != $2::uuid
      `;
      await databaseService.executeRawCommand(updateDefaultQuery, [userId, portfolioId]);
    }

    const updatedPortfolio: Portfolio = {
      ...existingPortfolio,
      name: data.name ?? existingPortfolio.name,
      description: data.description ?? existingPortfolio.description,
      baseCurrency: data.baseCurrency ?? existingPortfolio.baseCurrency,
      sortOrder: data.sortOrder ?? existingPortfolio.sortOrder,
      isDefault: data.isDefault ?? existingPortfolio.isDefault,
      updatedAt: new Date()
    };

    const query = `
      UPDATE portfolios 
      SET name = $3, description = $4, base_currency = $5, sort_order = $6, is_default = $7, updated_at = $8
      WHERE id = $1::uuid AND user_id = $2::uuid
      RETURNING *
    `;
    
    const values = [
      portfolioId, userId, updatedPortfolio.name, updatedPortfolio.description,
      updatedPortfolio.baseCurrency, updatedPortfolio.sortOrder, updatedPortfolio.isDefault, updatedPortfolio.updatedAt
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

  async updatePortfolioSortOrder(userId: string, portfolioOrders: { id: string; sortOrder: number }[]): Promise<boolean> {
    try {
      // 使用事务批量更新排序
      for (const { id, sortOrder } of portfolioOrders) {
        const query = `
          UPDATE finapp.portfolios 
          SET sort_order = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2::uuid AND user_id = $3::uuid
        `;
        await databaseService.executeRawCommand(query, [sortOrder, id, userId]);
      }
      return true;
    } catch (error) {
      console.error('Failed to update portfolio sort order:', error);
      return false;
    }
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
    console.log('=== 创建交易账户开始 ===');
    console.log('userId:', userId, 'type:', typeof userId);
    console.log('portfolioId:', portfolioId, 'type:', typeof portfolioId);
    console.log('data:', JSON.stringify(data, null, 2));
    
    // 验证必填字段
    if (!data.name || !data.accountType) {
      const error = new Error('账户名称和账户类型为必填项');
      console.error('验证失败:', error.message);
      throw error;
    }
    
    // 验证投资组合所有权
    console.log('开始验证投资组合所有权...');
    const portfolio = await this.getPortfolioById(userId, portfolioId);
    if (!portfolio) {
      const error = new Error('投资组合未找到或无权访问');
      console.error('验证失败:', error.message);
      throw error;
    }
    console.log('投资组合验证成功:', portfolio.name);

    // 确保数值类型正确
    const balance = typeof data.balance === 'string' ? parseFloat(data.balance) : (data.balance || 0);
    const availableBalance = typeof data.availableBalance === 'string' 
      ? parseFloat(data.availableBalance) 
      : (data.availableBalance || balance);

    console.log('处理后的余额 - balance:', balance, 'type:', typeof balance);
    console.log('处理后的可用余额 - availableBalance:', availableBalance, 'type:', typeof availableBalance);

    const account: TradingAccount = {
      id: uuidv4(),
      portfolioId,
      name: data.name.trim(),
      broker: data.broker?.trim() || '',
      accountNumber: data.accountNumber?.trim() || '',
      accountType: data.accountType,
      currency: data.currency || portfolio.baseCurrency,
      balance: balance,
      availableBalance: availableBalance,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('准备插入的账户对象:', JSON.stringify(account, null, 2));

    const query = `
      INSERT INTO finapp.trading_accounts (
        id, portfolio_id, name, broker_name, account_number, account_type,
        currency, initial_balance, current_balance, is_active, created_at, updated_at
      ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::numeric, $9::numeric, $10, $11, $12)
      RETURNING *
    `;
    
    const params = [
      account.id, 
      account.portfolioId, 
      account.name, 
      account.broker,
      account.accountNumber, 
      account.accountType, 
      account.currency,
      account.balance, 
      account.availableBalance, 
      true, 
      account.createdAt, 
      account.updatedAt
    ];
    
    console.log('SQL 参数:', params.map((p, i) => `$${i+1}: ${p} (${typeof p})`).join('\n'));
    
    try {
      console.log('开始执行 SQL...');
      const result = await databaseService.executeRawQuery(query, params);
      
      console.log('SQL 执行成功，返回结果:', result);
      console.log('=== 创建交易账户成功 ===');

      return account;
    } catch (error: any) {
      console.error('=== SQL 执行失败 ===');
      console.error('错误类型:', error.constructor.name);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
      console.error('错误详情:', JSON.stringify(error, null, 2));
      
      // 提供更友好的错误消息
      if (error.message?.includes('invalid input syntax for type uuid')) {
        throw new Error('投资组合ID格式无效');
      } else if (error.message?.includes('violates foreign key constraint')) {
        throw new Error('投资组合不存在');
      } else if (error.message?.includes('duplicate key')) {
        throw new Error('账户已存在');
      } else {
        throw new Error(`创建账户失败: ${error.message}`);
      }
    }
  }

  async getTradingAccounts(userId: string, portfolioId: string): Promise<TradingAccount[]> {
    // 验证投资组合所有权
    const portfolio = await this.getPortfolioById(userId, portfolioId);
    if (!portfolio) {
      return [];
    }

    const query = `
      SELECT * FROM finapp.trading_accounts 
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
      SET name = CASE WHEN $3::text IS NOT NULL THEN $3::text ELSE name END,
          broker_name = CASE WHEN $4::text IS NOT NULL THEN $4::text ELSE broker_name END,
          account_number = CASE WHEN $5::text IS NOT NULL THEN $5::text ELSE account_number END,
          account_type = CASE WHEN $6::text IS NOT NULL THEN $6::text ELSE account_type END,
          currency = CASE WHEN $7::text IS NOT NULL THEN $7::text ELSE currency END,
          current_balance = CASE WHEN $8::numeric IS NOT NULL THEN $8::numeric ELSE current_balance END,
          updated_at = $9::timestamptz
      WHERE id = $1::uuid AND portfolio_id = $2::uuid
      RETURNING *
    `;
    
    const params = [
      accountId, 
      portfolioId, 
      data.name || null, 
      data.broker || null, 
      data.accountNumber || null,
      data.accountType || null, 
      data.currency || null, 
      data.balance !== undefined ? data.balance : null, 
      new Date()
    ];
    
    const result = await databaseService.executeRawQuery(query, params);
    const rows = Array.isArray(result) ? result : [];
    return rows.length > 0 ? this.mapRowToTradingAccount(rows[0]) : null;
  }

  async deleteTradingAccount(userId: string, portfolioId: string, accountId: string): Promise<boolean> {
    console.log('=== 删除交易账户开始 ===');
    console.log('userId:', userId);
    console.log('portfolioId:', portfolioId);
    console.log('accountId:', accountId);
    
    try {
      // 验证投资组合所有权
      console.log('验证投资组合所有权...');
      const portfolio = await this.getPortfolioById(userId, portfolioId);
      if (!portfolio) {
        console.log('投资组合未找到或无权访问');
        return false;
      }
      console.log('投资组合验证成功:', portfolio.name);

      // 检查账户是否存在
      console.log('检查账户是否存在...');
      const checkQuery = `
        SELECT id FROM finapp.trading_accounts 
        WHERE id = $1::uuid AND portfolio_id = $2::uuid
      `;
      const checkResult = await databaseService.executeRawQuery(checkQuery, [accountId, portfolioId]);
      
      if (!Array.isArray(checkResult) || checkResult.length === 0) {
        console.log('交易账户未找到');
        return false;
      }
      console.log('账户存在，准备删除');

      // 检查是否有关联的持仓
      console.log('检查关联的持仓...');
      const positionsQuery = `
        SELECT COUNT(*) as count FROM finapp.positions 
        WHERE trading_account_id = $1::uuid AND is_active = true
      `;
      const positionsResult = await databaseService.executeRawQuery(positionsQuery, [accountId]);
      const positionCount = parseInt(positionsResult[0]?.count) || 0;
      
      if (positionCount > 0) {
        console.log(`账户有 ${positionCount} 个活跃持仓，无法删除`);
        throw new Error(`无法删除账户：该账户有 ${positionCount} 个活跃持仓`);
      }
      console.log('无活跃持仓，可以删除');

      // 删除账户
      console.log('执行删除操作...');
      const deleteQuery = `
        DELETE FROM finapp.trading_accounts 
        WHERE id = $1::uuid AND portfolio_id = $2::uuid
      `;
      await databaseService.executeRawCommand(deleteQuery, [accountId, portfolioId]);
      
      console.log('=== 删除交易账户成功 ===');
      return true;
    } catch (error: any) {
      console.error('=== 删除交易账户失败 ===');
      console.error('错误:', error.message);
      console.error('错误堆栈:', error.stack);
      throw error;
    }
  }

  async getAllTradingAccounts(userId: string): Promise<TradingAccount[]> {
    const query = `
      SELECT ta.* FROM trading_accounts ta
      INNER JOIN portfolios p ON ta.portfolio_id = p.id
      WHERE p.user_id = $1::uuid
      ORDER BY ta.created_at DESC
    `;

    const result = await databaseService.executeRawQuery(query, [userId]);
    return Array.isArray(result) ? result.map(this.mapRowToTradingAccount) : [];
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
      sortOrder: parseInt(row.sort_order) || 0,
      isDefault: Boolean(row.is_default),
      totalValue: 0, // 这些字段需要通过计算得出
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToPortfolioWithCalculations(row: any): Portfolio {
    const totalCost = parseFloat(row.total_cost) || 0;
    const totalValue = parseFloat(row.total_value) || 0;
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name || '',
      description: row.description || '',
      baseCurrency: row.base_currency || 'CNY',
      sortOrder: parseInt(row.sort_order) || 0,
      isDefault: Boolean(row.is_default),
      totalValue: totalValue,
      totalCost: totalCost,
      totalGainLoss: totalGainLoss,
      totalGainLossPercentage: totalGainLossPercentage,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToTradingAccount(row: any): TradingAccount {
    return {
      id: row.id,
      portfolioId: row.portfolio_id,
      name: row.name,
      broker: row.broker_name,
      accountNumber: row.account_number,
      accountType: row.account_type,
      currency: row.currency,
      balance: parseFloat(row.current_balance) || 0,
      availableBalance: parseFloat(row.current_balance) || 0, // 使用current_balance作为可用余额
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