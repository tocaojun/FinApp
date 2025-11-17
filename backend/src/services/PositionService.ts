import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './DatabaseService';

export interface Position {
  id: string;
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currency: string;
  firstPurchaseDate?: Date;
  lastTransactionDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // 理财产品支持字段
  productMode?: 'QUANTITY' | 'BALANCE';
  balance?: number;
  netAssetValue?: number;
  lastNavUpdate?: Date;
}

export interface WealthProductUpdate {
  positionId: string;
  productMode: 'QUANTITY' | 'BALANCE';
  netAssetValue?: number;
  balance?: number;
}

export class PositionService {
  
  /**
   * 根据交易更新持仓
   * @param portfolioId 投资组合ID
   * @param tradingAccountId 交易账户ID
   * @param assetId 资产ID
   * @param transactionType 交易类型
   * @param quantity 数量
   * @param price 价格
   * @param currency 货币
   * @param transactionDate 交易日期
   */
  async updatePositionFromTransaction(
    portfolioId: string,
    tradingAccountId: string,
    assetId: string,
    transactionType: string,
    quantity: number,
    price: number,
    currency: string,
    transactionDate: Date
  ): Promise<Position> {
    

    
    // 查找现有持仓
    const existingPosition = await this.getPosition(portfolioId, tradingAccountId, assetId);
    
    if (existingPosition) {
      // 更新现有持仓
      return await this.updateExistingPosition(
        existingPosition,
        transactionType,
        quantity,
        price,
        transactionDate
      );
    } else {
      // 创建新持仓
      return await this.createNewPosition(
        portfolioId,
        tradingAccountId,
        assetId,
        transactionType,
        quantity,
        price,
        currency,
        transactionDate
      );
    }
  }

  /**
   * 获取持仓
   */
  private async getPosition(
    portfolioId: string,
    tradingAccountId: string,
    assetId: string
  ): Promise<Position | null> {
    const query = `
      SELECT * FROM finapp.positions 
      WHERE portfolio_id = $1::uuid 
        AND trading_account_id = $2::uuid 
        AND asset_id = $3::uuid
        AND is_active = true
    `;
    
    const result = await databaseService.executeRawQuery(query, [portfolioId, tradingAccountId, assetId]);
    
    if (Array.isArray(result) && result.length > 0) {
      return this.mapRowToPosition(result[0]);
    }
    
    return null;
  }

  /**
   * 创建新持仓
   */
  private async createNewPosition(
    portfolioId: string,
    tradingAccountId: string,
    assetId: string,
    transactionType: string,
    quantity: number,
    price: number,
    currency: string,
    transactionDate: Date
  ): Promise<Position> {
    
    // 从asset表获取正确的currency和asset_type信息
    const assetQuery = `
      SELECT a.currency, at.code as asset_type_code 
      FROM finapp.assets a 
      LEFT JOIN finapp.asset_types at ON a.asset_type_id = at.id 
      WHERE a.id = $1::uuid
    `;
    const assetResult = await databaseService.executeRawQuery(assetQuery, [assetId]);
    
    if (!Array.isArray(assetResult) || assetResult.length === 0) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    const correctCurrency = assetResult[0].currency;
    const assetTypeCode = assetResult[0].asset_type_code;
    
    // 根据交易类型计算持仓数量
    const positionQuantity = this.isBuyTransaction(transactionType) ? quantity : -quantity;
    // totalCost 应该反映实际持有的成本，对于正持仓是正数，负持仓是负数
    const totalCost = positionQuantity * price;
    const averageCost = price;

    // 根据资产类型确定product_mode和balance
    const isBalanceType = assetTypeCode === 'WEALTH_BALANCE';
    const productMode = isBalanceType ? 'BALANCE' : 'QUANTITY';
    const balance = isBalanceType ? positionQuantity : null;

    const positionId = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO finapp.positions (
        id, portfolio_id, trading_account_id, asset_id,
        quantity, average_cost, total_cost, currency,
        first_purchase_date, last_transaction_date,
        is_active, created_at, updated_at,
        product_mode, balance
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, $4::uuid,
        $5, $6, $7, $8, $9::date, $10::date,
        $11, $12::timestamp, $13::timestamp,
        $14, $15
      ) RETURNING *
    `;

    const values = [
      positionId,
      portfolioId,
      tradingAccountId,
      assetId,
      positionQuantity,
      averageCost,
      totalCost,
      correctCurrency,  // 使用从asset表获取的currency
      transactionDate,
      transactionDate,
      positionQuantity > 0, // 如果数量大于0，设置为活跃
      now,
      now,
      productMode,
      balance
    ];

    const result = await databaseService.executeRawQuery(query, values);
    
    if (Array.isArray(result) && result.length > 0) {
      return this.mapRowToPosition(result[0]);
    }
    
    throw new Error('Failed to create position');
  }

  /**
   * 更新现有持仓
   */
  private async updateExistingPosition(
    existingPosition: Position,
    transactionType: string,
    quantity: number,
    price: number,
    transactionDate: Date
  ): Promise<Position> {
    
    const isBuy = this.isBuyTransaction(transactionType);
    const transactionQuantity = isBuy ? quantity : -quantity;
    
    // 计算新的持仓数量
    const newQuantity = existingPosition.quantity + transactionQuantity;
    
    let newAverageCost = existingPosition.averageCost;
    let newTotalCost = existingPosition.totalCost;
    
    if (isBuy && newQuantity > 0) {
      // 买入交易：重新计算平均成本
      const existingValue = existingPosition.quantity * existingPosition.averageCost;
      const newValue = quantity * price;
      const totalValue = existingValue + newValue;
      
      newAverageCost = totalValue / newQuantity;
      newTotalCost = newQuantity * newAverageCost;
    } else if (!isBuy) {
      // 卖出交易：保持平均成本不变，但更新总成本
      newTotalCost = newQuantity * existingPosition.averageCost;
    }

    // 更新首次购买日期（如果这是更早的买入交易）
    let firstPurchaseDate = existingPosition.firstPurchaseDate;
    if (isBuy && (!firstPurchaseDate || transactionDate < firstPurchaseDate)) {
      firstPurchaseDate = transactionDate;
    }

    const query = `
      UPDATE finapp.positions 
      SET 
        quantity = $2,
        average_cost = $3,
        total_cost = $4,
        first_purchase_date = $5::date,
        last_transaction_date = $6::date,
        updated_at = $7::timestamp,
        is_active = $8
      WHERE id = $1::uuid
      RETURNING *
    `;

    const values = [
      existingPosition.id,
      newQuantity,
      newAverageCost,
      newTotalCost,
      firstPurchaseDate,
      transactionDate,
      new Date(),
      newQuantity > 0 // 如果数量为0或负数，设置为非活跃
    ];

    const result = await databaseService.executeRawQuery(query, values);
    
    if (Array.isArray(result) && result.length > 0) {
      return this.mapRowToPosition(result[0]);
    }
    
    throw new Error('Failed to update position');
  }

  /**
   * 判断是否为买入交易
   */
  private isBuyTransaction(transactionType: string): boolean {
    // 转换为大写进行比较，支持大小写不敏感
    const upperType = transactionType.toUpperCase();
    
    const buyTypes = [
      'BUY',           // 通用买入类型
      'STOCK_BUY',
      'BOND_BUY', 
      'FUND_BUY',
      'FUND_SUBSCRIBE',
      'ETF_BUY',
      'CRYPTO_BUY',
      'OPTION_BUY',
      'FUTURES_BUY',
      'DEPOSIT',       // 存入也算作增加持仓
      'TRANSFER_IN',   // 转入也算作增加持仓
      'APPLY',         // 申购理财产品
      'SUBSCRIBE'      // 认购理财产品
    ];
    
    return buyTypes.includes(upperType);
  }

  /**
   * 获取投资组合的所有持仓
   */
  async getPortfolioPositions(portfolioId: string): Promise<Position[]> {
    const query = `
      SELECT 
        p.*,
        a.symbol as asset_symbol,
        a.name as asset_name
      FROM finapp.positions p
      LEFT JOIN finapp.assets a ON p.asset_id = a.id
      WHERE p.portfolio_id = $1::uuid AND p.is_active = true
      ORDER BY p.last_transaction_date DESC
    `;
    
    const result = await databaseService.executeRawQuery(query, [portfolioId]);
    
    if (Array.isArray(result)) {
      return result.map(this.mapRowToPosition);
    }
    
    return [];
  }

  /**
   * 删除持仓（当交易被删除时）
   */
  async adjustPositionForDeletedTransaction(
    portfolioId: string,
    tradingAccountId: string,
    assetId: string,
    transactionType: string,
    quantity: number,
    price: number,
    transactionDate: Date
  ): Promise<void> {
    
    const existingPosition = await this.getPosition(portfolioId, tradingAccountId, assetId);
    
    if (!existingPosition) {
      console.warn('No position found to adjust for deleted transaction');
      return;
    }

    // 反向操作：如果原来是买入，现在要减去；如果原来是卖出，现在要加上
    const isBuy = this.isBuyTransaction(transactionType);
    const adjustmentQuantity = isBuy ? -quantity : quantity;
    
    const newQuantity = existingPosition.quantity + adjustmentQuantity;
    
    if (newQuantity <= 0) {
      // 如果持仓数量变为0或负数，将持仓设为非活跃
      await this.deactivatePosition(existingPosition.id);
    } else {
      // 重新计算平均成本和总成本
      // 这里简化处理，实际应用中可能需要更复杂的逻辑来准确计算
      const newTotalCost = newQuantity * existingPosition.averageCost;
      
      const query = `
        UPDATE finapp.positions 
        SET 
          quantity = $2,
          total_cost = $3,
          updated_at = $4::timestamp
        WHERE id = $1::uuid
      `;

      await databaseService.executeRawQuery(query, [
        existingPosition.id,
        newQuantity,
        newTotalCost,
        new Date()
      ]);
    }
  }

  /**
   * 停用持仓
   */
  private async deactivatePosition(positionId: string): Promise<void> {
    const query = `
      UPDATE finapp.positions 
      SET is_active = false, updated_at = $2::timestamp
      WHERE id = $1::uuid
    `;
    
    await databaseService.executeRawQuery(query, [positionId, new Date()]);
  }

  /**
   * 将数据库行映射为Position对象
   */
  private mapRowToPosition(row: any): Position {
    return {
      id: row.id,
      portfolioId: row.portfolio_id,
      tradingAccountId: row.trading_account_id,
      assetId: row.asset_id,
      quantity: parseFloat(row.quantity),
      averageCost: parseFloat(row.average_cost),
      totalCost: parseFloat(row.total_cost),
      currency: row.currency,
      firstPurchaseDate: row.first_purchase_date ? new Date(row.first_purchase_date) : undefined,
      lastTransactionDate: row.last_transaction_date ? new Date(row.last_transaction_date) : undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async getPositionById(positionId: string): Promise<Position> {
    const query = `
      SELECT 
        p.*,
        a.symbol as asset_symbol,
        a.name as asset_name,
        a.asset_type_id
      FROM finapp.positions p
      JOIN finapp.assets a ON p.asset_id = a.id
      WHERE p.id = $1::uuid
    `;
    
    const result = await databaseService.executeRawQuery(query, [positionId]);
    
    if (Array.isArray(result) && result.length > 0) {
      return this.mapRowToPosition(result[0]);
    }
    
    throw new Error('Position not found');
  }

  // 理财产品相关方法
  async getWealthProductsSummary(portfolioId: string): Promise<any[]> {
    const query = `
      SELECT 
        p.id,
        p.asset_id,
        a.symbol,
        a.name as asset_name,
        p.quantity,
        p.average_cost,
        p.total_cost,
        p.currency,
        COALESCE(wpd.product_mode, 'QUANTITY') as product_mode,
        wpd.balance,
        wpd.net_asset_value,
        wpd.last_nav_update
      FROM finapp.positions p
      JOIN finapp.assets a ON p.asset_id = a.id
      LEFT JOIN finapp.wealth_product_details wpd ON p.id = wpd.position_id
      WHERE p.portfolio_id = $1 AND p.is_active = true
      ORDER BY a.name
    `;
    
    const result = await databaseService.executeRawQuery(query, [portfolioId]);
    return Array.isArray(result) ? result : [];
  }

  async getPositionsByCategory(portfolioId: string, category: string): Promise<any[]> {
    const query = `
      SELECT 
        p.id,
        p.asset_id,
        a.symbol,
        a.name as asset_name,
        a.asset_type,
        p.quantity,
        p.average_cost,
        p.total_cost,
        p.currency,
        p.first_purchase_date,
        p.last_transaction_date
      FROM finapp.positions p
      JOIN finapp.assets a ON p.asset_id = a.id
      WHERE p.portfolio_id = $1 
        AND p.is_active = true
        AND a.asset_type = $2
      ORDER BY a.name
    `;
    
    const result = await databaseService.executeRawQuery(query, [portfolioId, category]);
    return Array.isArray(result) ? result : [];
  }

  async updateWealthProductNav(positionId: string, netAssetValue: number): Promise<Position> {
    const now = new Date();
    
    const query = `
      UPDATE finapp.wealth_product_details 
      SET 
        net_asset_value = $2,
        last_nav_update = $3,
        updated_at = $4
      WHERE position_id = $1
      RETURNING *
    `;
    
    const result = await databaseService.executeRawQuery(query, [positionId, netAssetValue, now, now]);
    
    if (Array.isArray(result) && result.length > 0) {
      return await this.getPositionById(positionId);
    }
    throw new Error('Failed to update wealth product NAV');
  }

  async updateWealthProductBalance(positionId: string, balance: number, userId?: string): Promise<Position> {
    const now = new Date();
    
    // 获取当前余额
    const getCurrentBalanceQuery = `
      SELECT balance FROM finapp.positions WHERE id = $1::uuid
    `;
    const currentResult = await databaseService.executeRawQuery(getCurrentBalanceQuery, [positionId]);

    if (!Array.isArray(currentResult) || currentResult.length === 0) {
      throw new Error('Position not found');
    }

    const previousBalance = parseFloat(currentResult[0].balance || '0');

    // 更新余额和份额（余额型产品份额等于余额）
    const updatePositionQuery = `
      UPDATE finapp.positions 
      SET 
        balance = $2::numeric,
        quantity = $2::numeric
      WHERE id = $1::uuid
    `;

    await databaseService.executeRawQuery(updatePositionQuery, [positionId, balance]);

    // 记录余额历史
    if (previousBalance !== balance) {
      const changeType = 'MANUAL_UPDATE';
      await this.recordBalanceHistory(positionId, balance, previousBalance, changeType, userId);
    }
    
    return await this.getPositionById(positionId);
  }

  /**
   * 添加余额历史记录
   * @param positionId 持仓ID
   * @param balance 余额金额
   * @param changeType 变更类型
   * @param userId 操作用户ID
   * @param updateDate 余额对应的业务日期（非记录创建日期）
   * @param notes 备注
   */
  async addBalanceHistoryRecord(
    positionId: string,
    balance: number,
    changeType: string,
    userId?: string,
    updateDate?: string,
    notes?: string
  ): Promise<void> {
    // 获取当前余额作为previous_balance
    const getCurrentBalanceQuery = `
      SELECT balance FROM finapp.positions WHERE id = $1::uuid
    `;
    const currentResult = await databaseService.executeRawQuery(getCurrentBalanceQuery, [positionId]);

    if (!Array.isArray(currentResult) || currentResult.length === 0) {
      throw new Error('Position not found');
    }

    const previousBalance = parseFloat(currentResult[0].balance || '0');

    // 创建历史记录
    const insertHistoryQuery = `
      INSERT INTO finapp.balance_history (position_id, balance, previous_balance, change_type, created_by, update_date, notes)
      VALUES ($1::uuid, $2::numeric, $3::numeric, $4, $5::uuid, $6::date, $7)
    `;
    
    await databaseService.executeRawQuery(insertHistoryQuery, [
      positionId, balance, previousBalance, changeType, userId, updateDate || new Date().toISOString().split('T')[0], notes
    ]);

    // 同时更新positions表中的余额
    const updatePositionQuery = `
      UPDATE finapp.positions 
      SET balance = $2::numeric, quantity = $2::numeric
      WHERE id = $1::uuid
    `;
    await databaseService.executeRawQuery(updatePositionQuery, [positionId, balance]);
  }

  private async recordBalanceHistory(
    positionId: string,
    newBalance: number,
    previousBalance: number,
    changeType: string,
    userId?: string,
    updateDate?: string
  ): Promise<void> {
    const insertHistoryQuery = `
      INSERT INTO finapp.balance_history (position_id, balance, previous_balance, change_type, created_by, update_date)
      VALUES ($1::uuid, $2::numeric, $3::numeric, $4, $5::uuid, $6::date)
    `;
    
    await databaseService.executeRawQuery(insertHistoryQuery, [
      positionId, newBalance, previousBalance, changeType, userId, updateDate || new Date().toISOString().split('T')[0]
    ]);
  }

  async getBalanceHistory(positionId: string, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT 
        bh.id,
        bh.position_id,
        bh.balance,
        bh.previous_balance,
        bh.change_amount,
        bh.change_type,
        bh.notes,
        bh.update_date,
        bh.created_by as user_id,
        u.email as user_email,
        bh.created_at as update_time,
        CASE 
          WHEN bh.previous_balance > 0 THEN 
            ((bh.balance - bh.previous_balance) / bh.previous_balance * 100)
          ELSE 0 
        END as return_percentage
      FROM finapp.balance_history bh
      LEFT JOIN finapp.users u ON bh.created_by = u.id
      WHERE bh.position_id = $1::uuid
      ORDER BY bh.created_at DESC
      LIMIT $2
    `;
    
    const result = await databaseService.executeRawQuery(query, [positionId, limit]);
    return Array.isArray(result) ? result : [];
  }

  async getPortfolioBalanceHistorySummary(portfolioId: string, days: number = 30): Promise<any[]> {
    const query = `
      SELECT 
        DATE(bh.created_at) as date,
        SUM(bh.balance) as total_balance,
        COUNT(*) as transaction_count
      FROM finapp.balance_history bh
      JOIN finapp.positions p ON bh.position_id = p.id
      WHERE p.portfolio_id = $1
        AND bh.created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(bh.created_at)
      ORDER BY date DESC
    `;
    
    const result = await databaseService.executeRawQuery(query, [portfolioId]);
    return Array.isArray(result) ? result : [];
  }

  async deleteBalanceHistoryRecord(recordId: string, userId: string): Promise<void> {
    try {
      // 验证记录存在且属于用户
      const checkQuery = `
        SELECT bh.id FROM finapp.balance_history bh
        JOIN finapp.positions p ON bh.position_id = p.id
        JOIN finapp.portfolios po ON p.portfolio_id = po.id
        WHERE bh.id = $1::uuid AND po.user_id = $2::uuid
      `;
      
      const checkResult = await databaseService.executeRawQuery(checkQuery, [recordId, userId]);
      
      if (!Array.isArray(checkResult) || checkResult.length === 0) {
        throw new Error('Balance history record not found or access denied');
      }
      
      // 删除记录
      const deleteQuery = `DELETE FROM finapp.balance_history WHERE id = $1::uuid`;
      await databaseService.executeRawQuery(deleteQuery, [recordId]);
    } catch (error) {
      console.error('Error deleting balance history record:', error);
      throw error;
    }
  }

  /**
   * 更新余额历史记录
   * @param recordId 记录ID
   * @param userId 操作用户ID
   * @param updates 更新数据，其中 update_date 表示余额对应的业务日期
   */
  async updateBalanceHistoryRecord(
    recordId: string,
    userId: string,
    updates: {
      balance?: number;
      change_type?: string;
      notes?: string;
      update_date?: string;
    }
  ): Promise<void> {
    try {
      // 验证记录存在且属于用户
      const checkQuery = `
        SELECT bh.id FROM finapp.balance_history bh
        JOIN finapp.positions p ON bh.position_id = p.id
        JOIN finapp.portfolios po ON p.portfolio_id = po.id
        WHERE bh.id = $1::uuid AND po.user_id = $2::uuid
      `;
      
      const checkResult = await databaseService.executeRawQuery(checkQuery, [recordId, userId]);
      
      if (!Array.isArray(checkResult) || checkResult.length === 0) {
        throw new Error('Balance history record not found or access denied');
      }
      
      // 构建更新查询
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      
      if (updates.balance !== undefined) {
        updateFields.push(`balance = $${paramIndex++}::numeric`);
        values.push(updates.balance);
      }
      
      if (updates.change_type !== undefined) {
        updateFields.push(`change_type = $${paramIndex++}`);
        values.push(updates.change_type);
      }
      
      if (updates.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(updates.notes);
      }
      
      if (updates.update_date !== undefined) {
        updateFields.push(`update_date = $${paramIndex++}::date`);
        values.push(updates.update_date);
      }
      
      if (updateFields.length === 0) {
        return; // 没有需要更新的字段
      }
      
      // 不需要手动设置 updated_at，数据库触发器会自动处理
      
      values.push(recordId); // WHERE 条件的参数
      
      const updateQuery = `
        UPDATE finapp.balance_history 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}::uuid
      `;
      
      await databaseService.executeRawQuery(updateQuery, values);
    } catch (error) {
      console.error('Error updating balance history record:', error);
      throw error;
    }
  }
}

export const positionService = new PositionService();