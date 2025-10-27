/**
 * 交易导入服务
 * 处理批量交易导入的业务逻辑
 */

import { PrismaClient } from '@prisma/client';
import { 
  ImportContext, 
  ImportTransaction, 
  EnrichedTransaction,
  ValidationError,
  ImportResult,
  TransactionType 
} from '../types/import.types';
import { positionService } from './PositionService';

export class TransactionImportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 批量导入交易
   */
  async importTransactions(
    context: ImportContext,
    transactions: ImportTransaction[]
  ): Promise<ImportResult> {
    try {
      // 1. 验证上下文（投资组合、账户、资产的关联关系）
      await this.validateContext(context);
      
      // 2. 验证交易数据
      const errors = this.validateTransactions(transactions);
      if (errors.length > 0) {
        return {
          success: false,
          errors,
          summary: `发现${errors.length}个错误，请修正后重新上传`
        };
      }
      
      // 3. 附加上下文信息
      const enrichedTransactions = this.enrichTransactions(context, transactions);
      
      // 4. 原子性导入
      await this.importAllTransactions(enrichedTransactions);
      
      // 5. 更新持仓数据
      await this.updatePositionsAfterImport(enrichedTransactions);
      
      return {
        success: true,
        count: transactions.length,
        summary: `成功导入${transactions.length}条交易记录`
      };
      
    } catch (error: any) {
      return {
        success: false,
        errors: [{
          row: 0,
          field: 'system',
          value: null,
          message: error.message
        }],
        summary: '导入失败：' + error.message
      };
    }
  }

  /**
   * 验证上下文（投资组合、账户、资产的关联关系）
   */
  private async validateContext(context: ImportContext): Promise<void> {
    const { userId, portfolioId, tradingAccountId, assetId } = context;
    
    // 1. 验证投资组合属于用户
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { 
        id: portfolioId, 
        userId: userId, 
        isActive: true 
      }
    });
    
    if (!portfolio) {
      throw new Error('投资组合不存在或无权访问');
    }
    
    // 2. 验证交易账户属于该组合
    const account = await this.prisma.tradingAccount.findFirst({
      where: { 
        id: tradingAccountId, 
        portfolioId: portfolioId, 
        isActive: true 
      }
    });
    
    if (!account) {
      throw new Error('交易账户不存在或不属于该投资组合');
    }
    
    // 3. 验证资产存在
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId }
    });
    
    if (!asset) {
      throw new Error('资产不存在');
    }
  }

  /**
   * 验证交易数据
   */
  private validateTransactions(
    transactions: ImportTransaction[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    transactions.forEach((transaction, index) => {
      const row = index + 2; // Excel行号（从2开始，第1行是表头）
      
      // 验证日期
      const dateError = this.validateDate(transaction.date);
      if (dateError) {
        errors.push({ row, field: 'date', value: transaction.date, message: dateError });
      }
      
      // 验证交易类型
      const typeError = this.validateType(transaction.type);
      if (typeError) {
        errors.push({ row, field: 'type', value: transaction.type, message: typeError });
      }
      
      // 验证数量
      const quantityError = this.validateQuantity(transaction.quantity);
      if (quantityError) {
        errors.push({ row, field: 'quantity', value: transaction.quantity, message: quantityError });
      }
      
      // 验证价格
      const priceError = this.validatePrice(transaction.price);
      if (priceError) {
        errors.push({ row, field: 'price', value: transaction.price, message: priceError });
      }
      
      // 验证币种
      const currencyError = this.validateCurrency(transaction.currency);
      if (currencyError) {
        errors.push({ row, field: 'currency', value: transaction.currency, message: currencyError });
      }
      
      // 验证手续费（可选）
      if (transaction.fee !== undefined) {
        const feeError = this.validateFee(transaction.fee);
        if (feeError) {
          errors.push({ row, field: 'fee', value: transaction.fee, message: feeError });
        }
      }
      
      // 验证标签（可选）
      if (transaction.tags !== undefined) {
        const tagsError = this.validateTags(transaction.tags);
        if (tagsError) {
          errors.push({ row, field: 'tags', value: transaction.tags, message: tagsError });
        }
      }
    });
    
    return errors;
  }

  /**
   * 验证日期
   */
  private validateDate(date: string): string | null {
    if (!date) {
      return '日期不能为空';
    }
    
    // 1. 格式验证
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return '日期格式错误，必须是 YYYY-MM-DD';
    }
    
    // 2. 有效性验证
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return '无效的日期';
    }
    
    // 3. 不能是未来日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate > today) {
      return '交易日期不能是未来日期';
    }
    
    return null;
  }

  /**
   * 验证交易类型
   */
  private validateType(type: string): string | null {
    if (!type) {
      return '交易类型不能为空';
    }
    
    const validTypes = Object.values(TransactionType);
    
    if (!validTypes.includes(type as TransactionType)) {
      return `无效的交易类型 "${type}"。支持的类型：${validTypes.join(', ')}`;
    }
    
    return null;
  }

  /**
   * 验证数量
   */
  private validateQuantity(quantity: number): string | null {
    // 1. 必须是数字
    if (isNaN(quantity)) {
      return '数量必须是数字';
    }
    
    // 2. 必须大于0
    if (quantity <= 0) {
      return '数量必须大于0';
    }
    
    // 3. 小数位数不超过8位
    const decimalPlaces = (quantity.toString().split('.')[1] || '').length;
    if (decimalPlaces > 8) {
      return '数量最多支持8位小数';
    }
    
    return null;
  }

  /**
   * 验证价格
   */
  private validatePrice(price: number): string | null {
    // 1. 必须是数字
    if (isNaN(price)) {
      return '价格必须是数字';
    }
    
    // 2. 必须大于等于0
    if (price < 0) {
      return '价格不能为负数';
    }
    
    // 3. 小数位数不超过8位
    const decimalPlaces = (price.toString().split('.')[1] || '').length;
    if (decimalPlaces > 8) {
      return '价格最多支持8位小数';
    }
    
    return null;
  }

  /**
   * 验证币种
   */
  private validateCurrency(currency: string): string | null {
    if (!currency) {
      return '币种不能为空';
    }
    
    // 1. 长度必须是3个字符
    if (currency.length !== 3) {
      return '币种代码必须是3个字符';
    }
    
    // 2. 必须是大写字母
    if (!/^[A-Z]{3}$/.test(currency)) {
      return '币种代码必须是3个大写字母';
    }
    
    // 3. 可选：验证是否是有效的ISO 4217代码
    const validCurrencies = ['CNY', 'USD', 'HKD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CAD', 'KRW', 'TWD'];
    if (!validCurrencies.includes(currency)) {
      return `不支持的币种代码 "${currency}"`;
    }
    
    return null;
  }

  /**
   * 验证手续费
   */
  private validateFee(fee: number): string | null {
    // 1. 必须是数字
    if (isNaN(fee)) {
      return '手续费必须是数字';
    }
    
    // 2. 必须大于等于0
    if (fee < 0) {
      return '手续费不能为负数';
    }
    
    // 3. 小数位数不超过8位
    const decimalPlaces = (fee.toString().split('.')[1] || '').length;
    if (decimalPlaces > 8) {
      return '手续费最多支持8位小数';
    }
    
    return null;
  }

  /**
   * 验证标签
   */
  private validateTags(tags: any): string | null {
    // 1. 必须是数组
    if (!Array.isArray(tags)) {
      return '标签必须是数组';
    }
    
    // 2. 数组元素必须是字符串
    if (!tags.every(tag => typeof tag === 'string')) {
      return '标签数组中的每个元素必须是字符串';
    }
    
    return null;
  }

  /**
   * 附加上下文信息
   */
  private enrichTransactions(
    context: ImportContext,
    transactions: ImportTransaction[]
  ): EnrichedTransaction[] {
    return transactions.map(transaction => ({
      ...transaction,
      userId: context.userId,
      portfolioId: context.portfolioId,
      tradingAccountId: context.tradingAccountId,
      assetId: context.assetId,
      
      // 自动计算字段
      totalAmount: this.calculateTotalAmount(transaction),
      side: this.determineSide(transaction.type),
      status: 'EXECUTED' as const,
      executedAt: new Date(transaction.date)
    }));
  }

  /**
   * 计算总金额
   */
  private calculateTotalAmount(transaction: ImportTransaction): number {
    const baseAmount = transaction.quantity * transaction.price;
    const fee = transaction.fee || 0;
    
    // 买入：总金额 = 数量 × 价格 + 手续费
    // 卖出：总金额 = 数量 × 价格 - 手续费
    const side = this.determineSide(transaction.type);
    return side === 'BUY' ? baseAmount + fee : baseAmount - fee;
  }

  /**
   * 确定交易方向
   */
  private determineSide(type: TransactionType | string): 'BUY' | 'SELL' {
    const buyTypes = [
      TransactionType.BUY,
      TransactionType.DEPOSIT,
      TransactionType.DIVIDEND
    ];
    
    return buyTypes.includes(type as TransactionType) ? 'BUY' : 'SELL';
  }

  /**
   * 原子性导入所有交易
   */
  private async importAllTransactions(
    transactions: EnrichedTransaction[]
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        for (const transaction of transactions) {
          await tx.transaction.create({
            data: {
              user_id: transaction.userId,
              portfolioId: transaction.portfolioId,
              tradingAccountId: transaction.tradingAccountId,
              assetId: transaction.assetId,
              transactionDate: transaction.executedAt,
              transactionType: transaction.type,
              side: transaction.side,
              quantity: transaction.quantity,
              price: transaction.price,
              totalAmount: transaction.totalAmount,
              currency: transaction.currency,
              fees: transaction.fee || 0,
              notes: transaction.notes,
              tags: transaction.tags || [],
              status: transaction.status,
              executed_at: transaction.executedAt
            }
          });
        }
      },
      {
        maxWait: 10000,      // 最大等待时间：10秒
        timeout: 30000,      // 超时时间：30秒
        isolationLevel: 'Serializable'  // 最高隔离级别
      }
    );
  }

  /**
   * 导入后更新持仓数据
   */
  private async updatePositionsAfterImport(
    transactions: EnrichedTransaction[]
  ): Promise<void> {
    console.log(`开始更新持仓数据，共${transactions.length}条交易记录`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const transaction of transactions) {
      try {
        await positionService.updatePositionFromTransaction(
          transaction.portfolioId,
          transaction.tradingAccountId,
          transaction.assetId,
          transaction.type,
          transaction.quantity,
          transaction.price,
          transaction.currency,
          transaction.executedAt
        );
        successCount++;
      } catch (error: any) {
        console.error(`更新持仓失败 - 交易ID: ${transaction.assetId}`, error.message);
        failureCount++;
        // 不抛出错误，继续处理其他交易
      }
    }
    
    console.log(`持仓更新完成 - 成功: ${successCount}, 失败: ${failureCount}`);
  }
}
