import { Router } from 'express';
import { InsuranceController } from '../controllers/InsuranceController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { body, param, query } from 'express-validator';

const router = Router();
const insuranceController = new InsuranceController();

// 验证规则
const createInsuranceValidation = [
  body('portfolioId').isUUID().withMessage('投资组合ID必须是有效的UUID'),
  body('symbol').isString().trim().isLength({ min: 1, max: 50 }).withMessage('资产代码必须是1-50个字符的字符串'),
  body('name').isString().trim().isLength({ min: 1, max: 200 }).withMessage('资产名称必须是1-200个字符的字符串'),
  body('currency').isString().isLength({ min: 3, max: 3 }).withMessage('货币代码必须是3个字符'),
  body('insuranceCompany').isString().trim().isLength({ min: 1, max: 200 }).withMessage('保险公司名称必须是1-200个字符的字符串'),
  body('insuranceType').isIn(['CRITICAL_ILLNESS', 'LIFE_INSURANCE', 'ACCIDENT_INSURANCE', 'MEDICAL_INSURANCE']).withMessage('保险类型无效'),
  body('coverageAmount').isFloat({ min: 0.01 }).withMessage('保额必须大于0'),
  body('premiumAmount').isFloat({ min: 0.01 }).withMessage('保费必须大于0'),
  body('premiumFrequency').isIn(['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'LUMP_SUM']).withMessage('缴费频率无效'),
  body('coveragePeriod').optional().isString().trim().withMessage('保障期限必须是字符串'),
  body('coverageStartDate').optional().isISO8601().withMessage('保障开始日期格式无效'),
  body('coverageEndDate').optional().isISO8601().withMessage('保障结束日期格式无效'),
  body('premiumPeriod').optional().isInt({ min: 1 }).withMessage('缴费期限必须是正整数'),
  body('premiumStartDate').optional().isISO8601().withMessage('缴费开始日期格式无效'),
  body('premiumEndDate').optional().isISO8601().withMessage('缴费结束日期格式无效'),
  body('currentCashValue').optional().isFloat({ min: 0 }).withMessage('当前现金价值不能为负数'),
  body('guaranteedCashValue').optional().isFloat({ min: 0 }).withMessage('保证现金价值不能为负数'),
  body('dividendCashValue').optional().isFloat({ min: 0 }).withMessage('分红现金价值不能为负数'),
  body('isParticipating').optional().isBoolean().withMessage('是否分红险必须是布尔值'),
  body('waitingPeriod').optional().isInt({ min: 0 }).withMessage('等待期必须是非负整数'),
  body('policyNumber').optional().isString().trim().withMessage('保单号必须是字符串'),
  body('beneficiaryInfo').optional().isObject().withMessage('受益人信息必须是对象'),
  body('metadata').optional().isObject().withMessage('元数据必须是对象')
];

const updateCashValueValidation = [
  param('assetId').isUUID().withMessage('资产ID必须是有效的UUID'),
  body('guaranteedCashValue').isFloat({ min: 0 }).withMessage('保证现金价值不能为负数'),
  body('dividendCashValue').isFloat({ min: 0 }).withMessage('分红现金价值不能为负数'),
  body('valuationDate').optional().isISO8601().withMessage('估值日期格式无效'),
  body('notes').optional().isString().trim().withMessage('备注必须是字符串')
];

const recordPremiumPaymentValidation = [
  param('assetId').isUUID().withMessage('资产ID必须是有效的UUID'),
  body('paymentDate').isISO8601().withMessage('缴费日期格式无效'),
  body('premiumAmount').isFloat({ min: 0.01 }).withMessage('保费金额必须大于0'),
  body('currency').isString().isLength({ min: 3, max: 3 }).withMessage('货币代码必须是3个字符'),
  body('paymentMethod').optional().isString().trim().withMessage('支付方式必须是字符串'),
  body('paymentPeriod').optional().isInt({ min: 1 }).withMessage('缴费期数必须是正整数'),
  body('isOverdue').optional().isBoolean().withMessage('是否逾期必须是布尔值'),
  body('overdueDays').optional().isInt({ min: 0 }).withMessage('逾期天数必须是非负整数'),
  body('paymentStatus').optional().isIn(['PAID', 'PENDING', 'OVERDUE', 'WAIVED']).withMessage('缴费状态无效'),
  body('notes').optional().isString().trim().withMessage('备注必须是字符串')
];

const assetIdValidation = [
  param('assetId').isUUID().withMessage('资产ID必须是有效的UUID')
];

const portfolioIdValidation = [
  query('portfolioId').optional().isUUID().withMessage('投资组合ID必须是有效的UUID')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     InsuranceAssetType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 * 
 *     CreateInsuranceRequest:
 *       type: object
 *       required:
 *         - portfolioId
 *         - symbol
 *         - name
 *         - currency
 *         - insuranceCompany
 *         - insuranceType
 *         - coverageAmount
 *         - premiumAmount
 *         - premiumFrequency
 *       properties:
 *         portfolioId:
 *           type: string
 *           format: uuid
 *         symbol:
 *           type: string
 *         name:
 *           type: string
 *         currency:
 *           type: string
 *         insuranceCompany:
 *           type: string
 *         insuranceType:
 *           type: string
 *           enum: [CRITICAL_ILLNESS, LIFE_INSURANCE, ACCIDENT_INSURANCE, MEDICAL_INSURANCE]
 *         coverageAmount:
 *           type: number
 *         premiumAmount:
 *           type: number
 *         premiumFrequency:
 *           type: string
 *           enum: [MONTHLY, QUARTERLY, ANNUALLY, LUMP_SUM]
 * 
 *     InsuranceAsset:
 *       type: object
 *       properties:
 *         assetId:
 *           type: string
 *           format: uuid
 *         symbol:
 *           type: string
 *         assetName:
 *           type: string
 *         insuranceCompany:
 *           type: string
 *         insuranceType:
 *           type: string
 *         coverageAmount:
 *           type: number
 *         premiumAmount:
 *           type: number
 *         currentCashValue:
 *           type: number
 *         policyStatus:
 *           type: string
 */

/**
 * @swagger
 * /api/insurance/asset-types:
 *   get:
 *     summary: 获取保险资产类型列表
 *     tags: [Insurance]
 *     responses:
 *       200:
 *         description: 成功获取保险资产类型列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InsuranceAssetType'
 */
router.get('/asset-types', insuranceController.getInsuranceAssetTypes);

/**
 * @swagger
 * /api/insurance:
 *   post:
 *     summary: 创建保险产品
 *     tags: [Insurance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInsuranceRequest'
 *     responses:
 *       201:
 *         description: 创建保险产品成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 用户未认证
 */
router.post('/', authenticateToken, createInsuranceValidation, validateRequest, insuranceController.createInsurance);

/**
 * @swagger
 * /api/insurance/summary:
 *   get:
 *     summary: 获取保险统计信息
 *     tags: [Insurance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: portfolioId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 投资组合ID（可选）
 *     responses:
 *       200:
 *         description: 成功获取保险统计信息
 */
router.get('/summary', authenticateToken, portfolioIdValidation, validateRequest, insuranceController.getInsuranceSummary);

/**
 * @swagger
 * /api/insurance:
 *   get:
 *     summary: 获取用户的保险资产列表
 *     tags: [Insurance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: portfolioId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 投资组合ID（可选）
 *     responses:
 *       200:
 *         description: 成功获取保险资产列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InsuranceAsset'
 */
router.get('/', authenticateToken, portfolioIdValidation, validateRequest, insuranceController.getUserInsuranceAssets);

/**
 * @swagger
 * /api/insurance/{assetId}:
 *   get:
 *     summary: 获取保险详情
 *     tags: [Insurance]
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 成功获取保险详情
 *       404:
 *         description: 保险产品不存在
 */
router.get('/:assetId', assetIdValidation, validateRequest, insuranceController.getInsuranceDetail);

/**
 * @swagger
 * /api/insurance/{assetId}/cash-value:
 *   put:
 *     summary: 更新现金价值
 *     tags: [Insurance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guaranteedCashValue
 *               - dividendCashValue
 *             properties:
 *               guaranteedCashValue:
 *                 type: number
 *               dividendCashValue:
 *                 type: number
 *               valuationDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新现金价值成功
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 保险产品不存在
 */
router.put('/:assetId/cash-value', authenticateToken, updateCashValueValidation, validateRequest, insuranceController.updateCashValue);

/**
 * @swagger
 * /api/insurance/{assetId}/cash-value-history:
 *   get:
 *     summary: 获取现金价值历史
 *     tags: [Insurance]
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses200:
 *         description: 成功获取现金价值历史
 */
router.get('/:assetId/cash-value-history', assetIdValidation, validateRequest, insuranceController.getCashValueHistory);

/**
 * @swagger
 * /api/insurance/{assetId}/premium-payments:
 *   post:
 *     summary: 记录保费缴纳
 *     tags: [Insurance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentDate
 *               - premiumAmount
 *               - currency
 *             properties:
 *               paymentDate:
 *                 type: string
 *                 format: date
 *               premiumAmount:
 *                 type: number
 *               currency:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               paymentPeriod:
 *                 type: integer
 *               paymentStatus:
 *                 type: string
 *                 enum: [PAID, PENDING, OVERDUE, WAIVED]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: 成功记录保费缴纳
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 保险产品不存在
 */
router.post('/:assetId/premium-payments', authenticateToken, recordPremiumPaymentValidation, validateRequest, insuranceController.recordPremiumPayment);

/**
 * @swagger
 * /api/insurance/{assetId}/premium-payments:
 *   get:
 *     summary: 获取缴费记录
 *     tags: [Insurance]
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 成功获取缴费记录
 */
router.get('/:assetId/premium-payments', assetIdValidation, validateRequest, insuranceController.getPremiumPayments);

export default router;