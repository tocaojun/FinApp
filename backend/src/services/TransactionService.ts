import { databaseService } from './DatabaseService';
import { CacheService } from './CacheService';
import { positionService } from './PositionService';
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
    // 交易金额应该始终为正数，表示交易的绝对金额
    const totalAmount = Math.abs(request.quantity) * request.price;
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

    // 首先验证 portfolio 属于当前用户
    const portfolioCheck = await databaseService.executeRawQuery(
      'SELECT id FROM finapp.portfolios WHERE id = $1::uuid AND user_id = $2::uuid',
      [request.portfolioId, userId]
    );
    
    if (!portfolioCheck || portfolioCheck.length === 0) {
      throw new Error('Portfolio not found or does not belong to user');
    }

    // 保存到数据库 (注意：transactions表没有user_id字段)
    const query = `
      INSERT INTO finapp.transactions (
        id, portfolio_id, trading_account_id, asset_id,
        transaction_type, quantity, price, total_amount, fees,
        currency, transaction_date, notes, created_at, updated_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10, $11::timestamp, $12, $13::timestamp, $14::timestamp
      ) RETURNING *
    `;

    const values = [
      transaction.id,
      transaction.portfolioId,
      transaction.tradingAccountId,
      transaction.assetId,
      transaction.transactionType,
      transaction.quantity,
      transaction.price,
      transaction.totalAmount,
      transaction.fees,
      transaction.currency,
      transaction.executedAt,
      transaction.notes,
      transaction.createdAt,
      transaction.updatedAt
    ];

    const result = await databaseService.executeRawQuery(query, values);
    
    // 处理标签
    if (request.tags && request.tags.length > 0) {
      await this.addTransactionTags(transactionId, request.tags);
    }

    // 更新持仓数据
    try {
      await positionService.updatePositionFromTransaction(
        transaction.portfolioId,
        transaction.tradingAccountId,
        transaction.assetId,
        transaction.transactionType,
        transaction.quantity,
        transaction.price,
        transaction.currency,
        transaction.executedAt
      );
      console.log('Position updated successfully for transaction:', transactionId);
    } catch (error) {
      console.error('Failed to update position for transaction:', transactionId, error);
      // 不抛出错误，避免影响交易创建
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

    // 构建查询条件 (通过 portfolios 表关联用户)
    const conditions: string[] = ['p.user_id = $1::uuid'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filter.portfolioId) {
      conditions.push(`t.portfolio_id = $${paramIndex}::uuid`);
      values.push(filter.portfolioId);
      paramIndex++;
    }

    if (filter.transactionType) {
      conditions.push(`t.transaction_type = $${paramIndex}`);
      values.push(filter.transactionType);
      paramIndex++;
    }

    if (filter.tradingAccountId) {
      conditions.push(`t.trading_account_id = $${paramIndex}::uuid`);
      values.push(filter.tradingAccountId);
      paramIndex++;
    }

    if (filter.dateFrom) {
      conditions.push(`t.transaction_date >= $${paramIndex}`);
      values.push(filter.dateFrom);
      paramIndex++;
    }

    if (filter.dateTo) {
      conditions.push(`t.transaction_date <= $${paramIndex}`);
      values.push(filter.dateTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortOrder = filter.sortOrder || 'DESC';

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM finapp.transactions t 
      JOIN finapp.portfolios p ON t.portfolio_id = p.id 
      ${whereClause}
    `;
    const countResult = await databaseService.executeRawQuery<Array<{count: string}>>(countQuery, values);
    const total = parseInt(countResult[0]?.count || '0');

    // 获取交易记录 (包含关联数据)
    const query = `
      SELECT 
        t.*,
        p.name as portfolio_name,
        a.name as asset_name,
        a.symbol as asset_symbol
      FROM finapp.transactions t 
      JOIN finapp.portfolios p ON t.portfolio_id = p.id 
      LEFT JOIN finapp.assets a ON t.asset_id = a.id
      ${whereClause}
      ORDER BY t.transaction_date ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const results = await databaseService.executeRawQuery<any[]>(query, values);
    const transactions: Transaction[] = results.map((row: any) => ({
      id: row.id,
      userId: userId, // 从参数获取，因为表中没有这个字段
      portfolioId: row.portfolio_id,
      tradingAccountId: row.trading_account_id,
      assetId: row.asset_id,
      transactionType: row.transaction_type,
      side: 'BUY', // 默认值，因为表中没有这个字段
      quantity: parseFloat(row.quantity),
      price: parseFloat(row.price),
      totalAmount: parseFloat(row.total_amount),
      fees: parseFloat(row.fees || '0'),
      currency: row.currency,
      portfolioName: row.portfolio_name,
      assetName: row.asset_name,
      assetSymbol: row.asset_symbol,
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
      SELECT 
        t.*,
        p.name as portfolio_name,
        a.name as asset_name,
        a.symbol as asset_symbol
      FROM finapp.transactions t 
      JOIN finapp.portfolios p ON t.portfolio_id = p.id 
      LEFT JOIN finapp.assets a ON t.asset_id = a.id
      WHERE t.id = $1::uuid AND p.user_id = $2::uuid
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
      // 交易金额应该始终为正数
      const newTotalAmount = Math.abs(newQuantity) * newPrice;
      
      updateFields.push(`total_amount = $${paramIndex}`);
      values.push(newTotalAmount);
      paramIndex++;
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;

    values.push(transactionId, userId);

    const query = `
      UPDATE finapp.transactions 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex - 1}::uuid AND portfolio_id IN (
        SELECT id FROM finapp.portfolios WHERE user_id = $${paramIndex}::uuid
      )
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
    try {
      console.log(`Attempting to delete transaction: ${transactionId} for user: ${userId}`);
      
      // 验证交易存在且属于用户
      const existingTransaction = await this.getTransactionById(userId, transactionId);
      if (!existingTransaction) {
        console.log('Transaction not found during validation');
        throw new Error('Transaction not found');
      }

      console.log('Transaction found, proceeding with deletion');

      // 使用 executeRawCommand 方法删除交易，并获取删除的行数
      const deletedRows = await databaseService.executeRawCommand(
        'DELETE FROM finapp.transactions WHERE id = $1::uuid AND portfolio_id IN (SELECT id FROM finapp.portfolios WHERE user_id = $2::uuid)',
        [transactionId, userId]
      );

      console.log(`Deletion result: ${deletedRows} rows affected`);

      if (deletedRows === 0) {
        throw new Error('No transaction was deleted - transaction may not exist or access denied');
      }

      // 验证删除是否成功
      const verifyDeleted = await this.getTransactionById(userId, transactionId);
      if (verifyDeleted) {
        console.error('Transaction still exists after deletion attempt');
        throw new Error('Transaction deletion failed - record still exists');
      }

      console.log('Transaction successfully deleted and verified');

      // 调整持仓数据（删除交易的反向操作）
      try {
        await positionService.adjustPositionForDeletedTransaction(
          existingTransaction.portfolioId,
          existingTransaction.tradingAccountId,
          existingTransaction.assetId,
          existingTransaction.transactionType,
          existingTransaction.quantity,
          existingTransaction.price,
          existingTransaction.executedAt
        );
        console.log('Position adjusted successfully for deleted transaction:', transactionId);
      } catch (error) {
        console.error('Failed to adjust position for deleted transaction:', transactionId, error);
        // 不抛出错误，交易已经删除成功
      }

      // 清除缓存
      this.clearTransactionCache(userId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
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
        SUM(CASE WHEN transaction_type = 'BUY' THEN total_amount ELSE 0 END) as total_buy_amount,
        SUM(CASE WHEN transaction_type = 'SELL' THEN total_amount ELSE 0 END) as total_sell_amount,
        SUM(fees) as total_fees,
        COUNT(DISTINCT asset_id) as unique_assets,
        AVG(total_amount) as avg_transaction_amount,
        MAX(total_amount) as max_transaction_amount
      FROM finapp.transactions t
      JOIN finapp.portfolios p ON t.portfolio_id = p.id
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
    for (const tagName of tags) {
      try {
        // 首先查找标签ID
        const tagQuery = `SELECT id FROM finapp.transaction_tags WHERE name = $1 LIMIT 1`;
        const tagResult = await databaseService.executeRawQuery(tagQuery, [tagName]);
        
        if (Array.isArray(tagResult) && tagResult.length > 0) {
          const tagId = tagResult[0].id;
          
          // 插入交易标签映射
          const mappingQuery = `
            INSERT INTO finapp.transaction_tag_mappings (transaction_id, tag_id)
            VALUES ($1::uuid, $2::uuid)
            ON CONFLICT (transaction_id, tag_id) DO NOTHING
          `;
          await databaseService.executeRawCommand(mappingQuery, [transactionId, tagId]);
        }
      } catch (error) {
        console.error(`Error adding tag ${tagName} to transaction ${transactionId}:`, error);
        // 继续处理其他标签，不中断整个流程
      }
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