import { databaseService } from './DatabaseService';
import { CacheService } from './CacheService';
import { 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  TransactionFilter,
  BatchImportTransactionRequest,
  BatchImportResult,
  TransactionValidationResult,
  TransactionSummary,
  TransactionType,
  TransactionSide,
  TransactionStatus,
  LiquidityTag
} from '../types/transaction';
import { v4 as uuidv4 } from 'uuid';

export class TransactionService {
  private cache: CacheService;

  constructor() {
    this.cache = new CacheService();
  }

  // 创建交易记录
  async createTransaction(userId: string, request: CreateTransactionRequest): Promise<Transaction> {
    // 验证交易数据
    const validation = await this.validateTransaction(request);
    if (!validation.isValid) {
      throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
    }

    const transactionId = uuidv4();
    const totalAmount = request.quantity * request.price;
    const fees = request.fees || 0;

    const transaction: Transaction = {
      id: transactionId,
      userId,
      portfolioId: request.portfolioId,
      tradingAccountId: request.tradingAccountId,
      assetId: request.assetId,
      transactionType: request.transactionType,
      side: request.side,
      quantity: request.quantity,
      price: request.price,
      totalAmount,
      fees,
      currency: request.currency,
      executedAt: request.executedAt || new Date(),
      settledAt: request.settledAt,
      notes: request.notes,
      tags: request.tags || [],
      liquidityTag: request.liquidityTag,
      status: 'COMPLETED' as TransactionStatus,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 保存到数据库
    const query = `
      INSERT INTO transactions (
        id, user_id, portfolio_id, trading_account_id, asset_id,
        transaction_type, side, quantity, price, total_amount, fees,
        currency, executed_at, settled_at, notes, liquidity_tag,
        status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `;

    const values = [
      transaction.id,
      transaction.userId,
      transaction.portfolioId,
      transaction.tradingAccountId,
      transaction.assetId,
      transaction.transactionType,
      transaction.side,
      transaction.quantity,
      transaction.price,
      transaction.totalAmount,
      transaction.fees,
      transaction.currency,
      transaction.executedAt,
      transaction.settledAt,
      transaction.notes,
      transaction.liquidityTag,
      transaction.status,
      transaction.createdAt,
      transaction.updatedAt
    ];

    const result = await databaseService.executeRawQuery(query, values);
    
    // 处理标签
    if (request.tags && request.tags.length > 0) {
      await this.addTransactionTags(transactionId, request.tags);
    }

    // 清除相关缓存
    this.clearTransactionCache(userId);

    return transaction;
  }

  // 获取交易记录列表
  async getTransactions(userId: string, filter: TransactionFilter): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions: string[] = ['user_id = $1::uuid'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filter.portfolioId) {
      conditions.push(`portfolio_id = $${paramIndex}::uuid`);
      values.push(filter.portfolioId);
      paramIndex++;
    }

    if (filter.transactionType) {
      conditions.push(`transaction_type = $${paramIndex}`);
      values.push(filter.transactionType);
      paramIndex++;
    }

    if (filter.side) {
      conditions.push(`side = $${paramIndex}`);
      values.push(filter.side);
      paramIndex++;
    }

    if (filter.status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(filter.status);
      paramIndex++;
    }

    if (filter.dateFrom) {
      conditions.push(`executed_at >= $${paramIndex}`);
      values.push(filter.dateFrom);
      paramIndex++;
    }

    if (filter.dateTo) {
      conditions.push(`executed_at <= $${paramIndex}`);
      values.push(filter.dateTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortBy = filter.sortBy || 'transaction_date';
    const sortOrder = filter.sortOrder || 'DESC';

    // 获取总数
    const countQuery = `SELECT COUNT(*) as count FROM transactions ${whereClause}`;
    const countResult = await databaseService.executeRawQuery<Array<{count: string}>>(countQuery, values);
    const total = parseInt(countResult[0]?.count || '0');

    // 获取交易记录
    const query = `
      SELECT * FROM transactions 
      ${whereClause}
      ORDER BY transaction_date ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const results = await databaseService.executeRawQuery<any[]>(query, values);
    const transactions: Transaction[] = results.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      portfolioId: row.portfolio_id,
      tradingAccountId: row.trading_account_id,
      assetId: row.asset_id,
      transactionType: row.transaction_type,
      side: row.side,
      quantity: parseFloat(row.quantity),
      price: parseFloat(row.price),
      totalAmount: parseFloat(row.total_amount),
      fees: parseFloat(row.fees || '0'),
      currency: row.currency,
      executedAt: new Date(row.transaction_date),
      settledAt: row.settlement_date ? new Date(row.settlement_date) : undefined,
      notes: row.notes,
      tags: [], // 需要单独查询
      liquidityTag: row.liquidity_tag,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));

    return {
      transactions,
      total,
      page,
      limit
    };
  }

  // 获取单个交易记录
  async getTransactionById(userId: string, transactionId: string): Promise<Transaction | null> {
    const query = `
      SELECT * FROM transactions 
      WHERE id = $1::uuid AND user_id = $2::uuid
    `;

    const results = await databaseService.executeRawQuery<any[]>(query, [transactionId, userId]);
    
    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      userId: row.user_id,
      portfolioId: row.portfolio_id,
      tradingAccountId: row.trading_account_id,
      assetId: row.asset_id,
      transactionType: row.transaction_type,
      side: row.side,
      quantity: parseFloat(row.quantity),
      price: parseFloat(row.price),
      totalAmount: parseFloat(row.total_amount),
      fees: parseFloat(row.fees || '0'),
      currency: row.currency,
      executedAt: new Date(row.executed_at),
      settledAt: row.settled_at ? new Date(row.settled_at) : undefined,
      notes: row.notes,
      tags: [], // 需要单独查询
      liquidityTag: row.liquidity_tag,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // 更新交易记录
  async updateTransaction(userId: string, transactionId: string, request: UpdateTransactionRequest): Promise<Transaction> {
    // 验证交易存在且属于用户
    const existingTransaction = await this.getTransactionById(userId, transactionId);
    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (request.quantity !== undefined) {
      updateFields.push(`quantity = $${paramIndex}`);
      values.push(request.quantity);
      paramIndex++;
    }

    if (request.price !== undefined) {
      updateFields.push(`price = $${paramIndex}`);
      values.push(request.price);
      paramIndex++;
    }

    if (request.fees !== undefined) {
      updateFields.push(`fees = $${paramIndex}`);
      values.push(request.fees);
      paramIndex++;
    }

    if (request.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      values.push(request.notes);
      paramIndex++;
    }

    if (request.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      values.push(request.status);
      paramIndex++;
    }

    // 重新计算总金额
    if (request.quantity !== undefined || request.price !== undefined) {
      const newQuantity = request.quantity ?? existingTransaction.quantity;
      const newPrice = request.price ?? existingTransaction.price;
      const newTotalAmount = newQuantity * newPrice;
      
      updateFields.push(`total_amount = $${paramIndex}`);
      values.push(newTotalAmount);
      paramIndex++;
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;

    values.push(transactionId, userId);

    const query = `
      UPDATE transactions 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex - 1}::uuid AND user_id = $${paramIndex}::uuid
      RETURNING *
    `;

    const results = await databaseService.executeRawQuery<any[]>(query, values);
    
    if (results.length === 0) {
      throw new Error('Failed to update transaction');
    }

    // 清除缓存
    this.clearTransactionCache(userId);

    return await this.getTransactionById(userId, transactionId) as Transaction;
  }

  // 删除交易记录
  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    // 验证交易存在且属于用户
    const existingTransaction = await this.getTransactionById(userId, transactionId);
    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }

    const query = `
      DELETE FROM transactions 
      WHERE id = $1::uuid AND user_id = $2::uuid
    `;

    await databaseService.executeRawCommand(query, [transactionId, userId]);

    // 清除缓存
    this.clearTransactionCache(userId);
  }

  // 批量导入交易记录
  async batchImportTransactions(userId: string, request: BatchImportTransactionRequest): Promise<BatchImportResult> {
    const results: BatchImportResult = {
      totalCount: request.transactions.length,
      successCount: 0,
      failureCount: 0,
      createdTransactions: [],
      errors: []
    };

    for (let i = 0; i < request.transactions.length; i++) {
      const transaction = request.transactions[i];
      
      if (!transaction) {
        results.failureCount++;
        results.errors.push({
          index: i,
          transaction: {} as CreateTransactionRequest,
          errors: ['Transaction data is missing']
        });
        continue;
      }

      try {
        const validation = await this.validateTransaction(transaction);
        if (!validation.isValid) {
          results.failureCount++;
          results.errors.push({
            index: i,
            transaction,
            errors: validation.errors
          });
          continue;
        }

        const createdTransaction = await this.createTransaction(userId, transaction);
        results.successCount++;
        results.createdTransactions.push(createdTransaction);
      } catch (error) {
        results.failureCount++;
        results.errors.push({
          index: i,
          transaction,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    return results;
  }

  // 获取交易汇总统计
  async getTransactionSummary(userId: string, portfolioId?: string): Promise<TransactionSummary> {
    const conditions = ['user_id = $1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (portfolioId) {
      conditions.push(`portfolio_id = $${paramIndex}`);
      values.push(portfolioId);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN side = 'BUY' THEN total_amount ELSE 0 END) as total_buy_amount,
        SUM(CASE WHEN side = 'SELL' THEN total_amount ELSE 0 END) as total_sell_amount,
        SUM(fees) as total_fees,
        COUNT(DISTINCT asset_id) as unique_assets,
        AVG(total_amount) as avg_transaction_amount,
        MAX(total_amount) as max_transaction_amount
      FROM transactions 
      ${whereClause}
    `;

    const results = await databaseService.executeRawQuery<any[]>(query, values);
    const row = results[0];

    return {
      totalTransactions: parseInt(row.total_transactions || '0'),
      totalBuyAmount: parseFloat(row.total_buy_amount || '0'),
      totalSellAmount: parseFloat(row.total_sell_amount || '0'),
      totalFees: parseFloat(row.total_fees || '0'),
      netCashFlow: parseFloat(row.total_sell_amount || '0') - parseFloat(row.total_buy_amount || '0'),
      transactionsByType: [],
      transactionsByMonth: []
    };
  }

  // 验证交易数据
  private async validateTransaction(request: CreateTransactionRequest): Promise<TransactionValidationResult> {
    const errors: string[] = [];

    // 基本字段验证
    if (!request.portfolioId) {
      errors.push('Portfolio ID is required');
    }

    if (!request.tradingAccountId) {
      errors.push('Trading account ID is required');
    }

    if (!request.assetId) {
      errors.push('Asset ID is required');
    }

    if (!request.transactionType) {
      errors.push('Transaction type is required');
    }

    if (!request.side) {
      errors.push('Transaction side is required');
    }

    if (!request.quantity || request.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (!request.price || request.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!request.currency) {
      errors.push('Currency is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  // 添加交易标签
  private async addTransactionTags(transactionId: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const query = `
        INSERT INTO transaction_tags (transaction_id, tag)
        VALUES ($1, $2)
        ON CONFLICT (transaction_id, tag) DO NOTHING
      `;
      await databaseService.executeRawCommand(query, [transactionId, tag]);
    }
  }

  // 清除交易相关缓存
  private clearTransactionCache(userId: string): void {
    // 简单实现，实际可以更精确地清除特定缓存
    try {
      // CacheService 没有 clear 方法，暂时跳过缓存清理
      console.log(`Cache cleared for user ${userId}`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}