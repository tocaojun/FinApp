import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  TransactionFilter,
  BatchImportTransactionRequest,
  TransactionExportOptions
} from '../types/transaction';
import { AuthenticatedRequest } from '../types/auth';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  // 创建交易记录
  createTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const request: CreateTransactionRequest = req.body;

      const transaction = await this.transactionService.createTransaction(userId, request);

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create transaction'
      });
    }
  };

  // 获取交易记录列表
  getTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      
      // 构建筛选条件
      const filter: TransactionFilter = {
        portfolioId: req.query.portfolioId as string,
        tradingAccountId: req.query.tradingAccountId as string,
        assetId: req.query.assetId as string,
        transactionType: req.query.transactionType as any,
        side: req.query.side as any,
        status: req.query.status as any,
        liquidityTag: req.query.liquidityTag as any,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        sortBy: req.query.sortBy as any || 'executedAt',
        sortOrder: req.query.sortOrder as any || 'DESC'
      };

      const result = await this.transactionService.getTransactions(userId, filter);

      // 调试：打印返回的数据
      if (result.transactions && result.transactions.length > 0) {
        console.log('TransactionController.getTransactions - first transaction:', result.transactions[0]);
        console.log('TransactionController.getTransactions - has transactionDate?', 'transactionDate' in result.transactions[0]);
      }

      res.json({
        success: true,
        data: result,
        message: 'Transactions retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get transactions'
      });
    }
  };

  // 获取单个交易记录
  getTransactionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const transactionId = req.params.id;
      


      if (!transactionId) {
        res.status(400).json({
          success: false,
          message: 'Transaction ID is required'
        });
        return;
      }

      const transaction = await this.transactionService.getTransactionById(userId, transactionId);

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
        return;
      }

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting transaction:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get transaction'
      });
    }
  };

  // 更新交易记录
  updateTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const transactionId = req.params.id;
      const request: UpdateTransactionRequest = req.body;



      if (!transactionId) {
        res.status(400).json({
          success: false,
          message: 'Transaction ID is required'
        });
        return;
      }

      const transaction = await this.transactionService.updateTransaction(userId, transactionId, request);

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction updated successfully'
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update transaction'
      });
    }
  };

  // 删除交易记录
  deleteTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    console.log('=== DELETE TRANSACTION REQUEST RECEIVED ===');
    console.log('User ID:', req.user?.id);
    console.log('Transaction ID:', req.params.id);
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    try {
      const userId = req.user!.id;
      const transactionId = req.params.id;

      if (!transactionId) {
        res.status(400).json({
          success: false,
          message: 'Transaction ID is required'
        });
        return;
      }

      await this.transactionService.deleteTransaction(userId, transactionId);

      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete transaction'
      });
    }
  };

  // 批量导入交易记录
  batchImportTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const request: BatchImportTransactionRequest = req.body;

      const result = await this.transactionService.batchImportTransactions(userId, request);

      const statusCode = result.failureCount > 0 ? 207 : 201; // 207 Multi-Status for partial success

      res.status(statusCode).json({
        success: result.failureCount === 0,
        data: result,
        message: `Import completed: ${result.successCount} successful, ${result.failureCount} failed`
      });
    } catch (error) {
      console.error('Error importing transactions:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import transactions'
      });
    }
  };

  // 获取交易汇总统计
  getTransactionSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const portfolioId = req.query.portfolioId as string;

      const summary = await this.transactionService.getTransactionSummary(userId, portfolioId);

      res.json({
        success: true,
        data: summary,
        message: 'Transaction summary retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting transaction summary:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get transaction summary'
      });
    }
  };

  // 获取交易汇总统计（支持币种转换为人民币）
  getTransactionSummaryWithConversion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const portfolioId = req.query.portfolioId as string;
      const baseCurrency = (req.query.baseCurrency as string) || 'CNY';

      const summary = await this.transactionService.getTransactionSummaryWithConversion(userId, portfolioId, baseCurrency);

      res.json({
        success: true,
        data: summary,
        message: 'Transaction summary with conversion retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting transaction summary with conversion:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get transaction summary with conversion'
      });
    }
  };

  // 导出交易记录
  exportTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      
      // 构建导出选项
      const options: TransactionExportOptions = {
        format: (req.query.format as any) || 'CSV',
        includeHeaders: req.query.includeHeaders !== 'false',
        dateFormat: req.query.dateFormat as string || 'YYYY-MM-DD',
        currency: req.query.currency as string
      };

      // 构建筛选条件
      const filter: TransactionFilter = {
        portfolioId: req.query.portfolioId as string,
        tradingAccountId: req.query.tradingAccountId as string,
        assetId: req.query.assetId as string,
        transactionType: req.query.transactionType as any,
        side: req.query.side as any,
        status: req.query.status as any,
        liquidityTag: req.query.liquidityTag as any,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
      };

      options.filter = filter;

      // 获取交易数据
      const result = await this.transactionService.getTransactions(userId, filter);

      // 根据格式生成导出数据
      let exportData: string;
      let contentType: string;
      let filename: string;

      switch (options.format) {
        case 'CSV':
          exportData = this.generateCSV(result.transactions, options);
          contentType = 'text/csv';
          filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'JSON':
          exportData = JSON.stringify(result.transactions, null, 2);
          contentType = 'application/json';
          filename = `transactions_${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          throw new Error('Unsupported export format');
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);

    } catch (error) {
      console.error('Error exporting transactions:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export transactions'
      });
    }
  };

  // 获取交易导入模板
  getImportTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const format = (req.query.format as string) || 'CSV';

      const templateHeaders = [
        'portfolioId',
        'tradingAccountId', 
        'assetSymbol',
        'transactionType',
        'side',
        'quantity',
        'price',
        'fees',
        'currency',
        'executedAt',
        'notes',
        'tags',
        'liquidityTag'
      ];

      const sampleData = [
        {
          portfolioId: 'portfolio-uuid-here',
          tradingAccountId: 'account-uuid-here',
          assetSymbol: 'AAPL',
          transactionType: 'STOCK_BUY',
          side: 'BUY',
          quantity: 100,
          price: 150.00,
          fees: 9.95,
          currency: 'USD',
          executedAt: '2025-09-13T10:00:00Z',
          notes: 'Sample transaction',
          tags: 'tech,growth',
          liquidityTag: 'HIGH'
        }
      ];

      let templateData: string;
      let contentType: string;
      let filename: string;

      switch (format.toUpperCase()) {
        case 'CSV':
          templateData = this.generateTemplateCSV(templateHeaders, sampleData);
          contentType = 'text/csv';
          filename = 'transaction_import_template.csv';
          break;
        case 'JSON':
          templateData = JSON.stringify(sampleData, null, 2);
          contentType = 'application/json';
          filename = 'transaction_import_template.json';
          break;
        default:
          throw new Error('Unsupported template format');
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(templateData);

    } catch (error) {
      console.error('Error generating import template:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate import template'
      });
    }
  };

  // 生成CSV格式数据
  private generateCSV(transactions: any[], options: TransactionExportOptions): string {
    const headers = [
      'ID',
      'Portfolio ID',
      'Trading Account ID',
      'Asset ID',
      'Transaction Type',
      'Side',
      'Quantity',
      'Price',
      'Total Amount',
      'Fees',
      'Currency',
      'Executed At',
      'Settled At',
      'Notes',
      'Tags',
      'Liquidity Tag',
      'Status',
      'Created At'
    ];

    let csv = '';
    
    if (options.includeHeaders) {
      csv += headers.join(',') + '\n';
    }

    transactions.forEach(transaction => {
      const row = [
        transaction.id,
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
        this.formatDate(transaction.executedAt, options.dateFormat),
        transaction.settledAt ? this.formatDate(transaction.settledAt, options.dateFormat) : '',
        transaction.notes || '',
        transaction.tags ? transaction.tags.join(';') : '',
        transaction.liquidityTag || '',
        transaction.status,
        this.formatDate(transaction.createdAt, options.dateFormat)
      ];

      csv += row.map(field => `"${field}"`).join(',') + '\n';
    });

    return csv;
  }

  // 生成模板CSV
  private generateTemplateCSV(headers: string[], sampleData: any[]): string {
    let csv = headers.join(',') + '\n';
    
    sampleData.forEach(data => {
      const row = headers.map(header => data[header] || '');
      csv += row.map(field => `"${field}"`).join(',') + '\n';
    });

    return csv;
  }

  // 格式化日期
  private formatDate(date: Date, format?: string): string {
    if (!format) {
      return date.toISOString();
    }

    // 简单的日期格式化实现
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
}