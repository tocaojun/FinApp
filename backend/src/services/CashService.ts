import { databaseService } from './DatabaseService';

export interface CashTransaction {
  id: string;
  tradingAccountId: string;
  transactionType: 'DEPOSIT' | 'WITHDRAW' | 'INVESTMENT' | 'REDEMPTION' | 'TRANSFER';
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceTransactionId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CashBalance {
  tradingAccountId: string;
  accountName: string;
  currency: string;
  cashBalance: number;
  availableBalance: number;
  frozenBalance: number;
}

export interface CashSummary {
  totalCashBalance: number;
  totalAvailableBalance: number;
  totalFrozenBalance: number;
  currency: string;
  accountCount: number;
}

export interface CreateCashTransactionRequest {
  tradingAccountId: string;
  transactionType: CashTransaction['transactionType'];
  amount: number;
  description?: string;
  referenceTransactionId?: string;
  metadata?: Record<string, any>;
}

export class CashService {
  private db = databaseService;

  /**
   * 获取用户的现金余额概览
   */
  async getCashSummary(userId: string, currency?: string): Promise<CashSummary[]> {
    let query = `
      SELECT 
        acb.currency,
        COUNT(DISTINCT acb.trading_account_id) as account_count,
        SUM(acb.cash_balance) as total_cash_balance,
        SUM(acb.available_balance) as total_available_balance,
        SUM(acb.frozen_balance) as total_frozen_balance
      FROM finapp.account_cash_balances acb
      JOIN finapp.trading_accounts ta ON acb.trading_account_id = ta.id
      JOIN finapp.portfolios p ON ta.portfolio_id = p.id
      WHERE p.user_id = $1::uuid AND ta.is_active = true
    `;
    
    const params = [userId];
    
    if (currency) {
      query += ' AND acb.currency = $2';
      params.push(currency);
    } else {
      // 现金管理默认只显示CNY数据
      query += ' AND acb.currency = \'CNY\'';
    }
    
    query += ' GROUP BY acb.currency ORDER BY acb.currency';
    
    const result = await this.db.executeRawQuery(query, params);
    
    return result.map((row: any) => ({
      totalCashBalance: parseFloat(row.total_cash_balance || 0),
      totalAvailableBalance: parseFloat(row.total_available_balance || 0),
      totalFrozenBalance: parseFloat(row.total_frozen_balance || 0),
      currency: row.currency,
      accountCount: parseInt(row.account_count || 0)
    }));
  }

  /**
   * 获取用户的现金账户余额列表
   */
  async getCashBalances(userId: string, portfolioId?: string): Promise<CashBalance[]> {
    let query = `
      SELECT 
        acb.trading_account_id,
        COALESCE(ta.name, ta.account_type::text) as account_name,
        acb.currency,
        acb.cash_balance,
        acb.available_balance,
        acb.frozen_balance
      FROM finapp.account_cash_balances acb
      JOIN finapp.trading_accounts ta ON acb.trading_account_id = ta.id
      JOIN finapp.portfolios p ON ta.portfolio_id = p.id
      WHERE p.user_id = $1::uuid AND ta.is_active = true AND acb.currency = 'CNY'
    `;
    
    const params = [userId];
    
    if (portfolioId) {
      query += ' AND p.id = $2::uuid';
      params.push(portfolioId);
    }
    
    query += ' ORDER BY acb.currency, account_name';
    
    const result = await this.db.executeRawQuery(query, params);
    
    return result.map((row: any) => ({
      tradingAccountId: row.trading_account_id,
      accountName: row.account_name,
      currency: row.currency,
      cashBalance: parseFloat(row.cash_balance || 0),
      availableBalance: parseFloat(row.available_balance || 0),
      frozenBalance: parseFloat(row.frozen_balance || 0)
    }));
  }

  /**
   * 获取现金流水记录
   */
  async getCashTransactions(
    userId: string, 
    tradingAccountId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ transactions: CashTransaction[], total: number }> {
    let baseQuery = `
      FROM finapp.cash_transactions ct
      JOIN finapp.trading_accounts ta ON ct.trading_account_id = ta.id
      JOIN finapp.portfolios p ON ta.portfolio_id = p.id
      WHERE p.user_id = $1::uuid
    `;
    
    const params = [userId];
    let paramIndex = 1;
    
    if (tradingAccountId) {
      paramIndex++;
      baseQuery += ` AND ct.trading_account_id = $${paramIndex}::uuid`;
      params.push(tradingAccountId);
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
        ct.transaction_type,
        ct.amount,
        ct.balance_after,
        ct.description,
        ct.reference_transaction_id,
        ct.metadata,
        ct.created_at,
        ct.updated_at
      ${baseQuery}
      ORDER BY ct.created_at DESC
      LIMIT $${paramIndex + 1}::bigint OFFSET $${paramIndex + 2}::bigint
    `;
    
    params.push(limit.toString(), offset.toString());
    const result = await this.db.executeRawQuery(dataQuery, params);
    
    const transactions = result.map((row: any) => ({
      id: row.id,
      tradingAccountId: row.trading_account_id,
      transactionType: row.transaction_type,
      amount: parseFloat(row.amount),
      balanceAfter: parseFloat(row.balance_after),
      description: row.description,
      referenceTransactionId: row.reference_transaction_id,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    return { transactions, total };
  }

  /**
   * 创建现金交易记录（存入/取出现金）
   */
  async createCashTransaction(userId: string, data: CreateCashTransactionRequest): Promise<CashTransaction> {
    return await this.db.executeTransaction(async (prisma) => {
      // 1. 验证账户所有权
      const accountQuery = `
        SELECT ta.id, ta.cash_balance, ta.available_balance, ta.frozen_balance
        FROM finapp.trading_accounts ta
        JOIN finapp.portfolios p ON ta.portfolio_id = p.id
        WHERE ta.id = $1::uuid AND p.user_id = $2::uuid AND ta.is_active = true
      `;
      
      const accountResult = await this.db.executeRawQuery(accountQuery, [data.tradingAccountId, userId]);
      
      if (accountResult.length === 0) {
        throw new Error('交易账户不存在或无权限访问');
      }
      
      const account = accountResult[0];
      const currentCashBalance = parseFloat(account.cash_balance || 0);
      const currentAvailableBalance = parseFloat(account.available_balance || 0);
      
      // 2. 计算新余额
      let newCashBalance = currentCashBalance;
      let newAvailableBalance = currentAvailableBalance;
      
      if (data.transactionType === 'DEPOSIT') {
        // 存入现金
        newCashBalance += data.amount;
        newAvailableBalance += data.amount;
      } else if (data.transactionType === 'WITHDRAW') {
        // 取出现金
        if (currentAvailableBalance < data.amount) {
          throw new Error('可用余额不足');
        }
        newCashBalance -= data.amount;
        newAvailableBalance -= data.amount;
      } else if (data.transactionType === 'INVESTMENT') {
        // 投资支出
        if (currentAvailableBalance < data.amount) {
          throw new Error('可用余额不足');
        }
        newCashBalance -= data.amount;
        newAvailableBalance -= data.amount;
      } else if (data.transactionType === 'REDEMPTION') {
        // 投资赎回
        newCashBalance += data.amount;
        newAvailableBalance += data.amount;
      }
      
      // 3. 更新账户余额
      const updateAccountQuery = `
        UPDATE finapp.trading_accounts 
        SET 
          cash_balance = $1,
          available_balance = $2,
          updated_at = NOW()
        WHERE id = $3::uuid
      `;
      
      await this.db.executeRawQuery(updateAccountQuery, [
        newCashBalance,
        newAvailableBalance,
        data.tradingAccountId
      ]);
      
      // 4. 创建现金流水记录
      const transactionQuery = `
        INSERT INTO finapp.cash_transactions (
          trading_account_id, transaction_type, amount, balance_after,
          description, reference_transaction_id, metadata, created_at, updated_at
        ) VALUES (
          $1::uuid, $2, $3, $4, $5, $6::uuid, $7, NOW(), NOW()
        )
        RETURNING *
      `;
      
      const transactionResult = await this.db.executeRawQuery(transactionQuery, [
        data.tradingAccountId,
        data.transactionType,
        data.amount,
        newCashBalance,
        data.description,
        data.referenceTransactionId,
        data.metadata || {}
      ]);
      
      const transaction = transactionResult[0];
      
      return {
        id: transaction.id,
        tradingAccountId: transaction.trading_account_id,
        transactionType: transaction.transaction_type,
        amount: parseFloat(transaction.amount),
        balanceAfter: parseFloat(transaction.balance_after),
        description: transaction.description,
        referenceTransactionId: transaction.reference_transaction_id,
        metadata: transaction.metadata || {},
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      };
    });
  }

  /**
   * 冻结/解冻资金
   */
  async freezeOrUnfreezeFunds(
    userId: string, 
    tradingAccountId: string, 
    amount: number, 
    freeze: boolean,
    description?: string
  ): Promise<void> {
    return await this.db.executeTransaction(async (prisma) => {
      // 1. 验证账户所有权
      const accountQuery = `
        SELECT ta.id, ta.available_balance, ta.frozen_balance
        FROM finapp.trading_accounts ta
        JOIN finapp.portfolios p ON ta.portfolio_id = p.id
        WHERE ta.id = $1::uuid AND p.user_id = $2::uuid AND ta.is_active = true
      `;
      
      const accountResult = await this.db.executeRawQuery(accountQuery, [tradingAccountId, userId]);
      
      if (accountResult.length === 0) {
        throw new Error('交易账户不存在或无权限访问');
      }
      
      const account = accountResult[0];
      const currentAvailableBalance = parseFloat(account.available_balance || 0);
      const currentFrozenBalance = parseFloat(account.frozen_balance || 0);
      
      let newAvailableBalance = currentAvailableBalance;
      let newFrozenBalance = currentFrozenBalance;
      
      if (freeze) {
        // 冻结资金
        if (currentAvailableBalance < amount) {
          throw new Error('可用余额不足');
        }
        newAvailableBalance -= amount;
        newFrozenBalance += amount;
      } else {
        // 解冻资金
        if (currentFrozenBalance < amount) {
          throw new Error('冻结余额不足');
        }
        newAvailableBalance += amount;
        newFrozenBalance -= amount;
      }
      
      // 2. 更新账户余额
      const updateQuery = `
        UPDATE finapp.trading_accounts 
        SET 
          available_balance = $1,
          frozen_balance = $2,
          updated_at = NOW()
        WHERE id = $3::uuid
      `;
      
      await this.db.executeRawQuery(updateQuery, [
        newAvailableBalance,
        newFrozenBalance,
        tradingAccountId
      ]);
    });
  }
}

export const cashService = new CashService();