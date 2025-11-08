import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './DatabaseService';
import { HoldingService } from './HoldingService';
import { ExchangeRateService } from './ExchangeRateService';
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
    // 获取所有投资组合基本信息
    const query = `
      SELECT 
        p.id, p.user_id, p.name, p.description, p.base_currency, 
        p.sort_order, p.is_default, p.created_at, p.updated_at
      FROM finapp.portfolios p
      WHERE p.user_id = $1::uuid
      ORDER BY p.sort_order ASC, p.created_at ASC
    `;

    const rows = await databaseService.executeRawQuery(query, [userId]);
    if (!Array.isArray(rows)) {
      return [];
    }

    // 仅返回基本信息，不计算市值（避免循环调用）
    const portfolios: Portfolio[] = rows.map(row => this.mapRowToPortfolio(row));
    
    return portfolios;
  }

  async getPortfolioById(userId: string, portfolioId: string): Promise<Portfolio | null> {
    // 获取投资组合基本信息（不调用 getPortfolioSummary 以避免循环调用）
    const query = `
      SELECT 
        p.id, p.user_id, p.name, p.description, p.base_currency, 
        p.sort_order, p.is_default, p.created_at, p.updated_at
      FROM finapp.portfolios p
      WHERE p.id = $1::uuid AND p.user_id = $2::uuid
    `;

    const rows = await databaseService.executeRawQuery(query, [portfolioId, userId]);
    const result = Array.isArray(rows) ? rows : [];
    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    const portfolio = this.mapRowToPortfolio(row);
    
    // 仅返回基本信息，不计算市值
    // 市值计算在 getPortfolioSummary() 中进行
    return portfolio;
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
      UPDATE finapp.portfolios 
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
    await databaseService.executeRawCommand('DELETE FROM finapp.positions WHERE portfolio_id = $1::uuid', [portfolioId]);
    await databaseService.executeRawCommand('DELETE FROM finapp.trading_accounts WHERE portfolio_id = $1::uuid', [portfolioId]);
    await databaseService.executeRawCommand('DELETE FROM finapp.portfolios WHERE id = $1::uuid AND user_id = $2::uuid', [portfolioId, userId]);
    
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
    // 直接查询投资组合信息，不调用 getPortfolioById() 以避免循环调用
    const portfolioQuery = `
      SELECT 
        p.id, p.user_id, p.name, p.description, p.base_currency, 
        p.sort_order, p.is_default, p.created_at, p.updated_at
      FROM finapp.portfolios p
      WHERE p.id = $1::uuid AND p.user_id = $2::uuid
    `;
    
    const portfolioRows = await databaseService.executeRawQuery(portfolioQuery, [portfolioId, userId]);
    const portfolioResult = Array.isArray(portfolioRows) ? portfolioRows : [];
    
    if (portfolioResult.length === 0) {
      return null;
    }
    
    const portfolio = this.mapRowToPortfolio(portfolioResult[0]);
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

    // 获取持仓统计和市值计算（需要考虑汇率转换）
    const positionsQuery = `
      SELECT 
        COUNT(DISTINCT p.id) as position_count,
        COUNT(DISTINCT p.asset_id) as unique_assets,
        COALESCE(SUM(p.total_cost), 0) as total_cost,
        COALESCE(SUM(p.quantity * COALESCE(ap.close_price, 0)), 0) as market_value,
        p.currency
      FROM finapp.positions p
      LEFT JOIN LATERAL (
        SELECT close_price 
        FROM finapp.asset_prices 
        WHERE asset_id = p.asset_id 
        ORDER BY price_date DESC 
        LIMIT 1
      ) ap ON true
      WHERE p.portfolio_id = $1::uuid AND p.is_active = true
      GROUP BY p.currency
    `;
    
    const positionsResult = await databaseService.executeRawQuery(positionsQuery, [portfolioId]);
    const positionsDataArray = Array.isArray(positionsResult) ? positionsResult : [];

    // 获取汇率并计算转换后的总成本和市值
    let totalCost = 0;
    let totalValue = 0;

    for (const posData of positionsDataArray) {
      const cost = parseFloat(posData.total_cost) || 0;
      const value = parseFloat(posData.market_value) || 0;
      const currency = posData.currency || 'CNY';

      if (currency === portfolio.baseCurrency) {
        // 同币种，直接相加
        totalCost += cost;
        totalValue += value;
      } else {
        // 不同币种，需要转换
        try {
          const exchangeRateService = new ExchangeRateService();
          const rateData = await exchangeRateService.getLatestRate(currency, portfolio.baseCurrency);
          const rate = rateData?.rate || 1.0;
          totalCost += cost * rate;
          totalValue += value * rate;
        } catch (error) {
          console.warn(`Failed to get exchange rate for ${currency}/${portfolio.baseCurrency}:`, error);
          // 如果获取汇率失败，使用 1.0 作为默认汇率
          totalCost += cost;
          totalValue += value;
        }
      }
    }

    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // 计算总持仓数和唯一资产数
    let totalPositions = 0;
    let uniqueAssets = 0;
    for (const posData of positionsDataArray) {
      totalPositions += parseInt(posData.position_count) || 0;
      uniqueAssets += parseInt(posData.unique_assets) || 0;
    }

    return {
      portfolio,
      totalAccounts: parseInt(accountsData.account_count) || 0,
      totalBalance: parseFloat(accountsData.total_balance) || 0,
      totalPositions,
      uniqueAssets,
      totalPositionValue: totalCost,
      totalValue,
      totalCost,
      totalReturn,
      totalReturnPercent,
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
    // 验证投资组合所有权（轻量级查询）
    const portfolioCheck = await databaseService.executeRawQuery(
      `SELECT id FROM finapp.portfolios WHERE id = $1::uuid AND user_id = $2::uuid`,
      [portfolioId, userId]
    );
    
    if (!Array.isArray(portfolioCheck) || portfolioCheck.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    const query = `
      SELECT 
        id,
        portfolio_id,
        name,
        broker_name,
        account_number,
        account_type,
        currency,
        initial_balance,
        current_balance,
        is_active,
        created_at,
        updated_at
      FROM finapp.trading_accounts
      WHERE portfolio_id = $1::uuid AND is_active = true
      ORDER BY created_at ASC
    `;

    const result = await databaseService.executeRawQuery(query, [portfolioId]);
    const rows = Array.isArray(result) ? result : [];

    return rows.map(row => ({
      id: row.id,
      portfolioId: row.portfolio_id,
      name: row.name,
      broker: row.broker_name || '',
      accountNumber: row.account_number || '',
      accountType: row.account_type,
      currency: row.currency,
      balance: parseFloat(row.current_balance) || 0,
      availableBalance: parseFloat(row.current_balance) || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  async updateTradingAccount(userId: string, portfolioId: string, accountId: string, data: UpdateTradingAccountRequest): Promise<TradingAccount | null> {
    return null;
  }

  async deleteTradingAccount(userId: string, portfolioId: string, accountId: string): Promise<boolean> {
    return false;
  }

  async createAsset(userId: string, portfolioId: string, data: CreateAssetRequest): Promise<Asset> {
    throw new Error('Not implemented');
  }

  async getAllTradingAccounts(userId: string): Promise<TradingAccount[]> {
    return [];
  }

  private mapRowToPortfolio(row: any): Portfolio {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      baseCurrency: row.base_currency,
      sortOrder: row.sort_order,
      isDefault: row.is_default,
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}