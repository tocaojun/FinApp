import { databaseService } from './DatabaseService';

export interface CurrencyBalance {
  currency: string;
  cashBalance: number;
  availableBalance: number;
  frozenBalance: number;
  lastUpdated: string;
}

export interface MultiCurrencyBalance {
  tradingAccountId: string;
  accountName: string;
  currency: string;
  cashBalance: number;
  availableBalance: number;
  frozenBalance: number;
  lastUpdated: string;
}

export interface AccountCashSummary {
  tradingAccountId: string;
  accountName: string;
  accountType: string;
  brokerName: string;
  portfolioName: string;
  portfolioBaseCurrency: string;
  currencyBalances: CurrencyBalance[];
  currencyCount: number;
  mainCurrencyBalance: number;
  mainCurrency: string;
}

export interface MultiCurrencyCashTransaction {
  tradingAccountId: string;
  currency: string;
  transactionType: 'DEPOSIT' | 'WITHDRAW' | 'INVESTMENT' | 'REDEMPTION' | 'TRANSFER' | 'EXCHANGE';
  amount: number;
  description?: string;
  referenceTransactionId?: string;
  exchangeRate?: number;
  baseCurrencyAmount?: number;
  metadata?: any;
}

export interface CurrencyExchangeRequest {
  tradingAccountId: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  exchangeRate: number;
  description?: string;
}

export class MultiCurrencyCashService {
  constructor(private db: typeof databaseService) {}

  /**
   * 获取账户的多币种现金汇总
   */
  async getAccountCashSummary(userId: string, portfolioId?: string): Promise<AccountCashSummary[]> {
    let query = `
      SELECT 
        trading_account_id,
        account_name,
        account_type,
        broker_name,
        portfolio_name,
        portfolio_base_currency,
        currency_balances,
        currency_count,
        main_currency_balance,
        main_currency
      FROM finapp.v_account_cash_summary
      WHERE trading_account_id IN (
        SELECT ta.id 
        FROM finapp.trading_accounts ta
        JOIN finapp.portfolios p ON ta.portfolio_id = p.id
        WHERE p.user_id::text = $1
    `;
    
    const params: string[] = [userId];
    
    if (portfolioId) {
      query += ` AND p.id::text = $2`;
      params.push(portfolioId);
    }
    
    query += `) ORDER BY account_name`;
    
    const result = await this.db.executeRawQuery(query, params);
    
    if (!result || result.length === 0) {
      return [];
    }
    
    return result.map(row => ({
      tradingAccountId: row.trading_account_id,
      accountName: row.account_name,
      accountType: row.account_type,
      brokerName: row.broker_name,
      portfolioName: row.portfolio_name,
      portfolioBaseCurrency: row.portfolio_base_currency,
      currencyBalances: row.currency_balances || [],
      currencyCount: parseInt(row.currency_count) || 0,
      mainCurrencyBalance: parseFloat(row.main_currency_balance) || 0,
      mainCurrency: row.main_currency
    }));
  }

  /**
   * 获取特定账户特定币种的余额
   */
  async getAccountCurrencyBalance(
    userId: string, 
    tradingAccountId: string, 
    currency: string
  ): Promise<CurrencyBalance | null> {
    // 首先验证账户所有权
    const ownershipQuery = `
      SELECT 1 FROM finapp.trading_accounts ta
      JOIN finapp.portfolios p ON ta.portfolio_id = p.id
      WHERE ta.id::text = $1 AND p.user_id::text = $2
    `;
    
    const ownershipResult = await this.db.executeRawQuery(ownershipQuery, [tradingAccountId, userId]);
    if (!ownershipResult || ownershipResult.length === 0) {
      throw new Error('账户不存在或无权限访问');
    }

    const query = `
      SELECT 
        currency,
        cash_balance,
        available_balance,
        frozen_balance,
        last_updated
      FROM finapp.account_cash_balances
      WHERE trading_account_id = $1::uuid AND currency = $2
    `;
    
    const result = await this.db.executeRawQuery(query, [tradingAccountId, currency]);
    
    if (!result || result.length === 0) {
      return null;
    }
    
    const row = result[0];
    return {
      currency: row.currency,
      cashBalance: parseFloat(row.cash_balance),
      availableBalance: parseFloat(row.available_balance),
      frozenBalance: parseFloat(row.frozen_balance),
      lastUpdated: row.last_updated
    };
  }

  /**
   * 获取用户所有账户的多币种余额列表
   */
  async getAllUserCurrencyBalances(userId: string): Promise<MultiCurrencyBalance[]> {
    const query = `
      SELECT 
        acb.trading_account_id,
        CASE 
          WHEN ta.name IS NOT NULL AND ta.name != '' THEN ta.name
          ELSE ta.account_type::text
        END as account_name,
        acb.currency,
        acb.cash_balance,
        acb.available_balance,
        acb.frozen_balance,
        acb.last_updated
      FROM finapp.account_cash_balances acb
      JOIN finapp.trading_accounts ta ON acb.trading_account_id = ta.id
      JOIN finapp.portfolios p ON ta.portfolio_id = p.id
      WHERE p.user_id = $1::uuid AND ta.is_active = true
      ORDER BY account_name, acb.currency
    `;
    
    const result = await this.db.executeRawQuery(query, [userId]);
    
    return result.map((row: any) => ({
      tradingAccountId: row.trading_account_id,
      accountName: row.account_name,
      currency: row.currency,
      cashBalance: parseFloat(row.cash_balance),
      availableBalance: parseFloat(row.available_balance),
      frozenBalance: parseFloat(row.frozen_balance),
      lastUpdated: row.last_updated
    }));
  }

  /**
   * 获取特定账户的多币种余额
   */
  async getAccountCurrencyBalances(userId: string, tradingAccountId: string): Promise<MultiCurrencyBalance[]> {
    // 首先验证账户所有权
    const ownershipQuery = `
      SELECT 1 FROM finapp.trading_accounts ta
      JOIN finapp.portfolios p ON ta.portfolio_id = p.id
      WHERE ta.id::text = $1 AND p.user_id::text = $2
    `;
    
    const ownershipResult = await this.db.executeRawQuery(ownershipQuery, [tradingAccountId, userId]);
    if (!ownershipResult || ownershipResult.length === 0) {
      throw new Error('账户不存在或无权限访问');
    }

    const query = `
      SELECT 
        acb.trading_account_id,
        CASE 
          WHEN ta.name IS NOT NULL AND ta.name != '' THEN ta.name
          ELSE ta.account_type::text
        END as account_name,
        acb.currency,
        acb.cash_balance,
        acb.available_balance,
        acb.frozen_balance,
        acb.last_updated
      FROM finapp.account_cash_balances acb
      JOIN finapp.trading_accounts ta ON acb.trading_account_id = ta.id
      WHERE acb.trading_account_id = $1::uuid
      ORDER BY acb.currency
    `;
    
    const result = await this.db.executeRawQuery(query, [tradingAccountId]);
    
    return result.map((row: any) => ({
      tradingAccountId: row.trading_account_id,
      accountName: row.account_name,
      currency: row.currency,
      cashBalance: parseFloat(row.cash_balance),
      availableBalance: parseFloat(row.available_balance),
      frozenBalance: parseFloat(row.frozen_balance),
      lastUpdated: row.last_updated
    }));
  }

  /**
   * 创建多币种现金交易
   */
  async createMultiCurrencyTransaction(
    userId: string,
    transaction: MultiCurrencyCashTransaction
  ): Promise<string> {
    // 验证账户所有权
    const ownershipQuery = `
      SELECT 1 FROM finapp.trading_accounts ta
      JOIN finapp.portfolios p ON ta.portfolio_id = p.id
      WHERE ta.id = $1::uuid AND p.user_id = $2::uuid
    `;
    
    const ownershipResult = await this.db.executeRawQuery(ownershipQuery, [transaction.tradingAccountId, userId]);
    
    if (!ownershipResult || ownershipResult.length === 0) {
      throw new Error('账户不存在或无权限访问');
    }

    // 更新账户余额
    const updateBalanceQuery = `
      SELECT finapp.update_account_cash_balance($1::uuid, $2, $3, $4)
    `;
    
    await this.db.executeRawQuery(updateBalanceQuery, [
      transaction.tradingAccountId,
      transaction.currency,
      transaction.amount,
      transaction.transactionType
    ]);

    // 获取更新后的余额
    const balanceQuery = `
      SELECT cash_balance FROM finapp.account_cash_balances
      WHERE trading_account_id = $1::uuid AND currency = $2
    `;
    
    const balanceResult = await this.db.executeRawQuery(balanceQuery, [
      transaction.tradingAccountId,
      transaction.currency
    ]);
    
    if (!balanceResult || balanceResult.length === 0) {
      throw new Error('获取余额失败');
    }
    
    const newBalance = parseFloat(balanceResult[0]?.cash_balance || '0');

    // 创建交易记录
    const transactionQuery = `
      INSERT INTO finapp.cash_transactions (
        trading_account_id, currency, transaction_type, amount, balance_after,
        description, reference_transaction_id, exchange_rate, base_currency_amount, metadata
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, $8, $9, $10)
      RETURNING id
    `;
    
    const transactionResult = await this.db.executeRawQuery(transactionQuery, [
      transaction.tradingAccountId,
      transaction.currency,
      transaction.transactionType,
      transaction.amount,
      newBalance,
      transaction.description,
      transaction.referenceTransactionId,
      transaction.exchangeRate,
      transaction.baseCurrencyAmount,
      transaction.metadata || {}
    ]);
    
    if (!transactionResult || transactionResult.length === 0) {
      throw new Error('创建交易记录失败');
    }
    
    return transactionResult[0].id;
  }

  /**
   * 货币兑换交易
   */
  async exchangeCurrency(
    userId: string,
    exchange: CurrencyExchangeRequest
  ): Promise<{ fromTransactionId: string; toTransactionId: string }> {
    // 验证账户所有权
    const ownershipQuery = `
      SELECT 1 FROM finapp.trading_accounts ta
      JOIN finapp.portfolios p ON ta.portfolio_id = p.id
      WHERE ta.id = $1::uuid AND p.user_id = $2::uuid
    `;
    
    const ownershipResult = await this.db.executeRawQuery(ownershipQuery, [exchange.tradingAccountId, userId]);
    if (!ownershipResult || ownershipResult.length === 0) {
      throw new Error('账户不存在或无权限访问');
    }

    // 检查源货币余额是否足够
    const fromBalance = await this.getAccountCurrencyBalance(userId, exchange.tradingAccountId, exchange.fromCurrency);
    if (!fromBalance || fromBalance.availableBalance < exchange.fromAmount) {
      throw new Error(`${exchange.fromCurrency} 余额不足`);
    }

    const toAmount = exchange.fromAmount * exchange.exchangeRate;
    
    // 使用简单的顺序执行，因为每个交易内部已经有事务保护
    // 创建扣款交易（负数）
    const fromTransactionId = await this.createMultiCurrencyTransaction(userId, {
      tradingAccountId: exchange.tradingAccountId,
      currency: exchange.fromCurrency,
      transactionType: 'EXCHANGE',
      amount: -exchange.fromAmount,
      description: `${exchange.description || '货币兑换'} - 兑出 ${exchange.fromCurrency}`,
      exchangeRate: exchange.exchangeRate,
      baseCurrencyAmount: toAmount
    });

    // 创建入账交易（正数）
    const toTransactionId = await this.createMultiCurrencyTransaction(userId, {
      tradingAccountId: exchange.tradingAccountId,
      currency: exchange.toCurrency,
      transactionType: 'EXCHANGE',
      amount: toAmount,
      description: `${exchange.description || '货币兑换'} - 兑入 ${exchange.toCurrency}`,
      referenceTransactionId: fromTransactionId,
      exchangeRate: 1 / exchange.exchangeRate,
      baseCurrencyAmount: exchange.fromAmount
    });

    return { fromTransactionId, toTransactionId };
  }

  /**
   * 获取多币种现金交易记录
   */
  async getMultiCurrencyTransactions(
    userId: string,
    tradingAccountId?: string,
    currency?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    transactions: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    let baseQuery = `
      FROM finapp.cash_transactions ct
      JOIN finapp.trading_accounts ta ON ct.trading_account_id = ta.id
      JOIN finapp.portfolios p ON ta.portfolio_id = p.id
      WHERE p.user_id::text = $1
    `;
    
    const params: any[] = [userId];
    let paramIndex = 1;
    
    if (tradingAccountId) {
      paramIndex++;
      baseQuery += ` AND ct.trading_account_id = $${paramIndex}::uuid`;
      params.push(tradingAccountId);
    }
    
    if (currency) {
      paramIndex++;
      baseQuery += ` AND ct.currency = $${paramIndex}`;
      params.push(currency);
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await this.db.executeRawQuery(countQuery, params);
    const total = parseInt(countResult[0].total);
    
    // 获取分页数据
    const dataQuery = `
      SELECT 
        ct.id,
        ct.trading_account_id,
        ta.name as account_name,
        ct.currency,
        ct.transaction_type,
        ct.amount,
        ct.balance_after,
        ct.description,
        ct.reference_transaction_id,
        ct.exchange_rate,
        ct.base_currency_amount,
        ct.metadata,
        ct.created_at,
        ct.updated_at
      ${baseQuery}
      ORDER BY ct.created_at DESC
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `;
    
    params.push(limit, offset);
    const dataResult = await this.db.executeRawQuery(dataQuery, params);
    
    return {
      transactions: dataResult.map(row => ({
        id: row.id,
        tradingAccountId: row.trading_account_id,
        accountName: row.account_name,
        currency: row.currency,
        transactionType: row.transaction_type,
        amount: parseFloat(row.amount),
        balanceAfter: parseFloat(row.balance_after),
        description: row.description,
        referenceTransactionId: row.reference_transaction_id,
        exchangeRate: row.exchange_rate ? parseFloat(row.exchange_rate) : null,
        baseCurrencyAmount: row.base_currency_amount ? parseFloat(row.base_currency_amount) : null,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * 冻结/解冻特定币种的资金
   */
  async freezeOrUnfreezeCurrencyFunds(
    userId: string,
    tradingAccountId: string,
    currency: string,
    amount: number,
    freeze: boolean,
    description?: string
  ): Promise<void> {
    // 验证账户所有权
    const ownershipQuery = `
      SELECT 1 FROM finapp.trading_accounts ta
      JOIN finapp.portfolios p ON ta.portfolio_id = p.id
      WHERE ta.id = $1::uuid AND p.user_id = $2::uuid
    `;
    
    const ownershipResult = await this.db.executeRawQuery(ownershipQuery, [tradingAccountId, userId]);
    if (!ownershipResult || ownershipResult.length === 0) {
      throw new Error('账户不存在或无权限访问');
    }

    // 获取当前余额
    const balanceQuery = `
      SELECT cash_balance, available_balance, frozen_balance
      FROM finapp.account_cash_balances
      WHERE trading_account_id = $1::uuid AND currency = $2
    `;
    
    const balanceResult = await this.db.executeRawQuery(balanceQuery, [tradingAccountId, currency]);
    
    if (!balanceResult || balanceResult.length === 0) {
      throw new Error(`账户中没有 ${currency} 余额记录`);
    }
    
    const currentBalance = balanceResult[0];
    const cashBalance = parseFloat(currentBalance.cash_balance);
    const availableBalance = parseFloat(currentBalance.available_balance);
    const frozenBalance = parseFloat(currentBalance.frozen_balance);
    
    let newFrozenBalance: number;
    let newAvailableBalance: number;
    
    if (freeze) {
      // 冻结资金
      if (availableBalance < amount) {
        throw new Error(`可用余额不足，当前可用: ${availableBalance} ${currency}`);
      }
      newFrozenBalance = frozenBalance + amount;
      newAvailableBalance = availableBalance - amount;
    } else {
      // 解冻资金
      if (frozenBalance < amount) {
        throw new Error(`冻结余额不足，当前冻结: ${frozenBalance} ${currency}`);
      }
      newFrozenBalance = frozenBalance - amount;
      newAvailableBalance = availableBalance + amount;
    }
    
    // 更新余额
    const updateQuery = `
      UPDATE finapp.account_cash_balances
      SET 
        frozen_balance = $1,
        available_balance = $2,
        last_updated = NOW(),
        updated_at = NOW()
      WHERE trading_account_id = $3::uuid AND currency = $4
    `;
    
    await this.db.executeRawQuery(updateQuery, [
      newFrozenBalance,
      newAvailableBalance,
      tradingAccountId,
      currency
    ]);
    
    // 创建交易记录
    const transactionQuery = `
      INSERT INTO finapp.cash_transactions (
        trading_account_id, currency, transaction_type, amount, balance_after, description, metadata
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
    `;
    
    await this.db.executeRawQuery(transactionQuery, [
      tradingAccountId,
      currency,
      freeze ? 'FREEZE' : 'UNFREEZE',
      freeze ? -amount : amount,
      cashBalance, // 现金总余额不变
      description || (freeze ? '资金冻结' : '资金解冻'),
      {
        operation: freeze ? 'freeze' : 'unfreeze',
        frozen_amount: amount,
        new_frozen_balance: newFrozenBalance,
        new_available_balance: newAvailableBalance
      }
    ]);
  }
}