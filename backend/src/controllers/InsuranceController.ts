import { Request, Response } from 'express';
import { InsuranceService, CreateInsuranceRequest, UpdateCashValueRequest } from '../services/InsuranceService';
import { AuthenticatedRequest } from '../types/auth';

export class InsuranceController {
  private insuranceService: InsuranceService;

  constructor() {
    this.insuranceService = new InsuranceService();
  }

  /**
   * 获取保险资产类型列表
   */
  getInsuranceAssetTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetTypes = await this.insuranceService.getInsuranceAssetTypes();
      
      res.json({
        success: true,
        data: assetTypes,
        message: '获取保险资产类型成功'
      });
    } catch (error) {
      console.error('获取保险资产类型失败:', error);
      res.status(500).json({
        success: false,
        message: '获取保险资产类型失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 创建保险产品
   */
  createInsurance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const { portfolioId, ...insuranceData } = req.body as CreateInsuranceRequest & { portfolioId: string };
      
      if (!portfolioId) {
        res.status(400).json({
          success: false, 
          message: '投资组合ID不能为空'
        });
        return;
      }

      // 验证必填字段
      const requiredFields = ['symbol', 'name', 'insuranceCompany', 'insuranceType', 'coverageAmount', 'premiumAmount', 'premiumFrequency'];
      const missingFields = requiredFields.filter(field => !insuranceData[field as keyof CreateInsuranceRequest]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `缺少必填字段: ${missingFields.join(', ')}`
        });
        return;
      }

      const insurance = await this.insuranceService.createInsurance(userId, portfolioId, insuranceData);

      res.status(201).json({
        success: true,
        data: insurance,
        message: '创建保险产品成功'
      });
    } catch (error) {
      console.error('创建保险产品失败:', error);
      res.status(500).json({
        success: false,
        message: '创建保险产品失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 获取用户的保险资产列表
   */
  getUserInsuranceAssets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const portfolioId = req.query.portfolioId as string;
      const insuranceAssets = await this.insuranceService.getUserInsuranceAssets(userId, portfolioId);

      res.json({
        success: true,
        data: insuranceAssets,
        message: '获取保险资产列表成功'
      });
    } catch (error) {
      console.error('获取保险资产列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取保险资产列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 获取保险详情
   */
  getInsuranceDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      
      if (!assetId) {
        res.status(400).json({
          success: false,
          message: '资产ID不能为空'
        });
        return;
      }

      const insurance = await this.insuranceService.getInsuranceByAssetId(assetId);

      res.json({
        success: true,
        data: insurance,
        message: '获取保险详情成功'
      });
    } catch (error) {
      console.error('获取保险详情失败:', error);
      
      if (error instanceof Error && error.message.includes('不存在')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '获取保险详情失败',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }
  };

  /**
   * 更新现金价值
   */
  updateCashValue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const { assetId } = req.params;
      const cashValueData = req.body as UpdateCashValueRequest;
      
      if (!assetId) {
        res.status(400).json({
          success: false,
          message: '资产ID不能为空'
        });
        return;
      }

      // 验证必填字段
      if (typeof cashValueData.guaranteedCashValue !== 'number' || typeof cashValueData.dividendCashValue !== 'number') {
        res.status(400).json({
          success: false,
          message: '保证现金价值和分红现金价值必须为数字'
        });
        return;
      }

      if (cashValueData.guaranteedCashValue < 0 || cashValueData.dividendCashValue < 0) {
        res.status(400).json({
          success: false,
          message: '现金价值不能为负数'
        });
        return;
      }

      await this.insuranceService.updateCashValue(assetId, cashValueData, userId);

      res.json({
        success: true,
        message: '更新现金价值成功'
      });
    } catch (error) {
      console.error('更新现金价值失败:', error);
      
      if (error instanceof Error && error.message.includes('不存在')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新现金价值失败',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }
  };

  /**
   * 获取现金价值历史
   */
  getCashValueHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      
      if (!assetId) {
        res.status(400).json({
          success: false,
          message: '资产ID不能为空'
        });
        return;
      }

      const history = await this.insuranceService.getCashValueHistory(assetId);

      res.json({
        success: true,
        data: history,
        message: '获取现金价值历史成功'
      });
    } catch (error) {
      console.error('获取现金价值历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取现金价值历史失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 获取保险统计信息
   */
  getInsuranceSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const portfolioId = req.query.portfolioId as string;
      const summary = await this.insuranceService.getInsuranceSummary(userId, portfolioId);

      res.json({
        success: true,
        data: summary,
        message: '获取保险统计信息成功'
      });
    } catch (error) {
      console.error('获取保险统计信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取保险统计信息失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  /**
   * 记录保费缴纳
   */
  recordPremiumPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      const paymentData = req.body;
      
      if (!assetId) {
        res.status(400).json({
          success: false,
          message: '资产ID不能为空'
        });
        return;
      }

      // 验证必填字段
      const requiredFields = ['paymentDate', 'premiumAmount', 'currency'];
      const missingFields = requiredFields.filter(field => !paymentData[field]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `缺少必填字段: ${missingFields.join(', ')}`
        });
        return;
      }

      if (paymentData.premiumAmount <= 0) {
        res.status(400).json({
          success: false,
          message: '保费金额必须大于0'
        });
        return;
      }

      const payment = await this.insuranceService.recordPremiumPayment(assetId, paymentData);

      res.status(201).json({
        success: true,
        data: payment,
        message: '记录保费缴纳成功'
      });
    } catch (error) {
      console.error('记录保费缴纳失败:', error);
      
      if (error instanceof Error && error.message.includes('不存在')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '记录保费缴纳失败',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }
  };

  /**
   * 获取缴费记录
   */
  getPremiumPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      
      if (!assetId) {
        res.status(400).json({
          success: false,
          message: '资产ID不能为空'
        });
        return;
      }

      const payments = await this.insuranceService.getPremiumPayments(assetId);

      res.json({
        success: true,
        data: payments,
        message: '获取缴费记录成功'
      });
    } catch (error) {
      console.error('获取缴费记录失败:', error);
      res.status(500).json({
        success: false,
        message: '获取缴费记录失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  };
}