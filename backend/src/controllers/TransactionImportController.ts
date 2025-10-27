/**
 * 交易导入控制器
 * 处理交易批量导入的HTTP请求
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TransactionImportService } from '../services/TransactionImportService';
import { TemplateGeneratorService } from '../services/TemplateGeneratorService';
import { parseExcelFile, parseJsonFile, validateFileFormat } from '../utils/fileParser';

const prisma = new PrismaClient();

export class TransactionImportController {
  private importService: TransactionImportService;
  private templateService: TemplateGeneratorService;

  constructor() {
    this.importService = new TransactionImportService(prisma);
    this.templateService = new TemplateGeneratorService();
  }

  /**
   * 下载Excel模板
   */
  downloadExcelTemplate = async (req: Request, res: Response) => {
    try {
      const buffer = this.templateService.generateExcelTemplate();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=transaction_import_template.xlsx');
      return res.send(buffer);
      
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * 下载JSON模板
   */
  downloadJsonTemplate = async (req: Request, res: Response) => {
    try {
      const json = this.templateService.generateJsonTemplate();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=transaction_import_template.json');
      return res.send(json);
      
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * 批量导入交易
   */
  importTransactions = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const { portfolioId, tradingAccountId, assetId } = req.body;
      const file = (req as any).file;
      
      // 1. 验证必填参数
      if (!portfolioId || !tradingAccountId || !assetId) {
        return res.status(400).json({
          error: '缺少必填参数：portfolioId, tradingAccountId, assetId'
        });
      }
      
      if (!file) {
        return res.status(400).json({ error: '未上传文件' });
      }
      
      // 2. 验证文件格式
      const fileFormat = validateFileFormat(file.mimetype);
      if (!fileFormat) {
        return res.status(400).json({ 
          error: '不支持的文件格式，请上传Excel(.xlsx)或JSON(.json)文件' 
        });
      }
      
      // 3. 解析文件
      let transactions;
      try {
        if (fileFormat === 'excel') {
          transactions = parseExcelFile(file.buffer);
        } else {
          transactions = parseJsonFile(file.buffer);
        }
      } catch (error: any) {
        return res.status(400).json({ 
          error: '文件解析失败',
          details: error.message 
        });
      }
      
      // 4. 导入交易
      const context = { userId, portfolioId, tradingAccountId, assetId };
      const result = await this.importService.importTransactions(context, transactions);
      
      // 5. 返回结果
      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
      
    } catch (error: any) {
      console.error('导入交易失败:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * 预览导入数据（不实际导入）
   */
  previewImport = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const { portfolioId, tradingAccountId, assetId } = req.body;
      const file = (req as any).file;
      
      if (!file) {
        return res.status(400).json({ error: '未上传文件' });
      }
      
      // 验证文件格式
      const fileFormat = validateFileFormat(file.mimetype);
      if (!fileFormat) {
        return res.status(400).json({ 
          error: '不支持的文件格式' 
        });
      }
      
      // 解析文件
      let transactions;
      try {
        if (fileFormat === 'excel') {
          transactions = parseExcelFile(file.buffer);
        } else {
          transactions = parseJsonFile(file.buffer);
        }
      } catch (error: any) {
        return res.status(400).json({ 
          error: '文件解析失败',
          details: error.message 
        });
      }
      
      // 只验证，不导入
      const context = { userId, portfolioId, tradingAccountId, assetId };
      
      // 验证上下文
      try {
        await (this.importService as any).validateContext(context);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      // 验证交易数据
      const errors = (this.importService as any).validateTransactions(transactions);
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors,
          summary: `发现${errors.length}个错误`
        });
      }
      
      // 返回预览数据
      return res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
      
    } catch (error: any) {
      console.error('预览失败:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}

// 导出单例
export const transactionImportController = new TransactionImportController();
