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
    
    // 从asset表获取正确的currency，而不是使用传入的参数
    const assetQuery = `
      SELECT currency FROM finapp.assets WHERE id = $1::uuid
    `;
    const assetResult = await databaseService.executeRawQuery(assetQuery, [assetId]);
    
    if (!Array.isArray(assetResult) || assetResult.length === 0) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    const correctCurrency = assetResult[0].currency;
    
    // 根据交易类型计算持仓数量
    const positionQuantity = this.isBuyTransaction(transactionType) ? quantity : -quantity;
    // totalCost 应该反映实际持有的成本，对于正持仓是正数，负持仓是负数
    const totalCost = positionQuantity * price;
    const averageCost = price;

    const positionId = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO finapp.positions (
        id, portfolio_id, trading_account_id, asset_id,
        quantity, average_cost, total_cost, currency,
        first_purchase_date, last_transaction_date,
        is_active, created_at, updated_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, $4::uuid,
        $5, $6, $7, $8, $9::date, $10::date,
        $11, $12::timestamp, $13::timestamp
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
      true,
      now,
      now
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
      'TRANSFER_IN'    // 转入也算作增加持仓
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
}

export const positionService = new PositionService();