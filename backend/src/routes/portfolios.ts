import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PortfolioController } from '../controllers/PortfolioController';

const portfolioController = new PortfolioController();
import { validateRequest } from '../middleware/validateRequest';
import { requirePermission } from '../middleware/permissionMiddleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Portfolio:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         baseCurrency:
 *           type: string
 *         totalValue:
 *           type: number
 *         totalCost:
 *           type: number
 *         totalReturn:
 *           type: number
 *         totalReturnPercent:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// 投资组合管理路由
/**
 * @swagger
 * /api/portfolios:
 *   get:
 *     summary: 获取用户的投资组合列表
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取投资组合列表
 *       401:
 *         description: 未授权
 */
router.get('/', 
  requirePermission('portfolios', 'read'),
  portfolioController.getPortfolios.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios/summary:
 *   get:
 *     summary: 获取用户所有投资组合的汇总统计
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取投资组合汇总
 *       401:
 *         description: 未授权
 */
// 注意：此路由必须定义在 /:id 路由之前，否则会被 /:id 捕获
router.get('/summary',
  requirePermission('portfolios', 'read'),
  portfolioController.getAllPortfoliosSummary.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios:
 *   post:
 *     summary: 创建新的投资组合
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - baseCurrency
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               baseCurrency:
 *                 type: string
 *     responses:
 *       201:
 *         description: 投资组合创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/',
  [
    body('name')
      .notEmpty()
      .withMessage('Portfolio name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Portfolio name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('baseCurrency')
      .notEmpty()
      .withMessage('Base currency is required')
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency code must be 3 characters')
      .isAlpha()
      .withMessage('Currency code must contain only letters')
  ],
  validateRequest,
  requirePermission('portfolios', 'create'),
  portfolioController.createPortfolio.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios/sort-order:
 *   put:
 *     summary: 更新投资组合排序
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - portfolioOrders
 *             properties:
 *               portfolioOrders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     sortOrder:
 *                       type: number
 *     responses:
 *       200:
 *         description: 投资组合排序更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.put('/sort-order',
  [
    body('portfolioOrders')
      .isArray()
      .withMessage('Portfolio orders must be an array'),
    body('portfolioOrders.*.id')
      .notEmpty()
      .withMessage('Portfolio ID is required'),
    body('portfolioOrders.*.sortOrder')
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer')
  ],
  validateRequest,
  requirePermission('portfolios', 'update'),
  portfolioController.updatePortfolioSortOrder.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   get:
 *     summary: 获取指定投资组合详情
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取投资组合详情
 *       404:
 *         description: 投资组合不存在
 */
router.get('/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Portfolio ID is required')
  ],
  validateRequest,
  requirePermission('portfolios', 'read'),
  portfolioController.getPortfolio.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   put:
 *     summary: 更新投资组合信息
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               baseCurrency:
 *                 type: string
 *     responses:
 *       200:
 *         description: 投资组合更新成功
 *       404:
 *         description: 投资组合不存在
 */
router.put('/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Portfolio ID is required'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Portfolio name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('baseCurrency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency code must be 3 characters')
      .isAlpha()
      .withMessage('Currency code must contain only letters')
  ],
  validateRequest,
  requirePermission('portfolios', 'update'),
  portfolioController.updatePortfolio.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios/{id}:
 *   delete:
 *     summary: 删除投资组合
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 投资组合删除成功
 *       404:
 *         description: 投资组合不存在
 */
router.delete('/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Portfolio ID is required')
  ],
  validateRequest,
  requirePermission('portfolios', 'delete'),
  portfolioController.deletePortfolio.bind(portfolioController)
);



/**
 * @swagger
 * /api/portfolios/{id}/summary:
 *   get:
 *     summary: 获取投资组合汇总统计
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取投资组合汇总
 *       404:
 *         description: 投资组合不存在
 */
router.get('/:id/summary',
  [
    param('id')
      .notEmpty()
      .withMessage('Portfolio ID is required')
  ],
  validateRequest,
  requirePermission('portfolios', 'read'),
  portfolioController.getPortfolioSummary.bind(portfolioController)
);

// 交易账户管理路由
/**
 * @swagger
 * /api/portfolios/{portfolioId}/accounts:
 *   get:
 *     summary: 获取投资组合的交易账户列表
 *     tags: [Trading Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: portfolioId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取交易账户列表
 */
router.get('/:portfolioId/accounts',
  [
    param('portfolioId')
      .notEmpty()
      .withMessage('Portfolio ID is required')
  ],
  validateRequest,
  requirePermission('accounts', 'read'),
  portfolioController.getTradingAccounts.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios/accounts:
 *   post:
 *     summary: 创建新的交易账户
 *     tags: [Trading Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - portfolioId
 *               - name
 *               - accountType
 *               - currency
 *               - balance
 *             properties:
 *               portfolioId:
 *                 type: string
 *               name:
 *                 type: string
 *               accountType:
 *                 type: string
 *                 enum: [BROKERAGE, BANK, CRYPTO, OTHER]
 *               currency:
 *                 type: string
 *               balance:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 交易账户创建成功
 */
router.post('/accounts',
  [
    body('portfolioId')
      .notEmpty()
      .withMessage('Portfolio ID is required'),
    body('name')
      .notEmpty()
      .withMessage('Account name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Account name must be between 1 and 100 characters'),
    body('accountType')
      .notEmpty()
      .withMessage('Account type is required')
      .isIn(['BROKERAGE', 'BANK', 'CRYPTO', 'OTHER'])
      .withMessage('Invalid account type'),
    body('currency')
      .notEmpty()
      .withMessage('Currency is required')
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency code must be 3 characters'),
    body('balance')
      .isNumeric()
      .withMessage('Balance must be a number')
      .custom((value) => {
        if (parseFloat(value) < 0) {
          throw new Error('Balance cannot be negative');
        }
        return true;
      }),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
  ],
  validateRequest,
  requirePermission('accounts', 'create'),
  portfolioController.createTradingAccount.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios/{portfolioId}/accounts/{accountId}:
 *   put:
 *     summary: 更新交易账户
 *     tags: [Trading Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: portfolioId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               broker:
 *                 type: string
 *               accountType:
 *                 type: string
 *                 enum: [BROKERAGE, BANK, CRYPTO, OTHER]
 *               currency:
 *                 type: string
 *               balance:
 *                 type: number
 *     responses:
 *       200:
 *         description: 交易账户更新成功
 */
router.put('/:portfolioId/accounts/:accountId',
  [
    param('portfolioId')
      .notEmpty()
      .withMessage('Portfolio ID is required'),
    param('accountId')
      .notEmpty()
      .withMessage('Account ID is required'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Account name must be between 1 and 100 characters'),
    body('broker')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Broker name must be between 1 and 100 characters'),
    body('accountType')
      .optional()
      .isIn(['BROKERAGE', 'BANK', 'CRYPTO', 'OTHER'])
      .withMessage('Invalid account type'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency code must be 3 characters'),
    body('balance')
      .optional()
      .isNumeric()
      .withMessage('Balance must be a number')
      .custom((value) => {
        if (value !== undefined && parseFloat(value) < 0) {
          throw new Error('Balance cannot be negative');
        }
        return true;
      })
  ],
  validateRequest,
  requirePermission('accounts', 'update'),
  portfolioController.updateTradingAccount.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios/{portfolioId}/accounts/{accountId}:
 *   delete:
 *     summary: 删除交易账户
 *     tags: [Trading Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: portfolioId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 交易账户删除成功
 *       404:
 *         description: 交易账户不存在
 */
router.delete('/:portfolioId/accounts/:accountId',
  [
    param('portfolioId')
      .notEmpty()
      .withMessage('Portfolio ID is required'),
    param('accountId')
      .notEmpty()
      .withMessage('Account ID is required')
  ],
  validateRequest,
  requirePermission('accounts', 'delete'),
  portfolioController.deleteTradingAccount.bind(portfolioController)
);

// 资产管理路由
/**
 * @swagger
 * /api/portfolios/assets:
 *   get:
 *     summary: 搜索和获取资产列表
 *     tags: [Assets]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（符号或名称）
 *       - in: query
 *         name: assetType
 *         schema:
 *           type: string
 *           enum: [STOCK, BOND, FUND, ETF, CRYPTO, CASH, OPTION, COMMODITY]
 *         description: 资产类型筛选
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取资产列表
 */
router.get('/assets',
  [
    query('search')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Search term must be between 1 and 50 characters'),
    query('assetType')
      .optional()
      .isIn(['STOCK', 'BOND', 'FUND', 'ETF', 'CRYPTO', 'CASH', 'OPTION', 'COMMODITY'])
      .withMessage('Invalid asset type'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  portfolioController.getAssets.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios/assets:
 *   post:
 *     summary: 创建新的资产
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *               - name
 *               - assetType
 *               - market
 *               - currency
 *             properties:
 *               symbol:
 *                 type: string
 *               name:
 *                 type: string
 *               assetType:
 *                 type: string
 *                 enum: [STOCK, BOND, FUND, ETF, CRYPTO, CASH, OPTION, COMMODITY]
 *               market:
 *                 type: string
 *               currency:
 *                 type: string
 *               currentPrice:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 资产创建成功
 */
router.post('/assets',
  [
    body('symbol')
      .notEmpty()
      .withMessage('Symbol is required')
      .isLength({ min: 1, max: 20 })
      .withMessage('Symbol must be between 1 and 20 characters'),
    body('name')
      .notEmpty()
      .withMessage('Asset name is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Asset name must be between 1 and 200 characters'),
    body('assetType')
      .notEmpty()
      .withMessage('Asset type is required')
      .isIn(['STOCK', 'BOND', 'FUND', 'ETF', 'CRYPTO', 'CASH', 'OPTION', 'COMMODITY'])
      .withMessage('Invalid asset type'),
    body('market')
      .notEmpty()
      .withMessage('Market is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Market must be between 1 and 50 characters'),
    body('currency')
      .notEmpty()
      .withMessage('Currency is required')
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency code must be 3 characters'),
    body('currentPrice')
      .optional()
      .isNumeric()
      .withMessage('Current price must be a number')
      .custom((value) => {
        if (parseFloat(value) < 0) {
          throw new Error('Price cannot be negative');
        }
        return true;
      }),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters')
  ],
  validateRequest,
  requirePermission('assets', 'create'),
  portfolioController.createAsset.bind(portfolioController)
);

/**
 * @swagger
 * /api/portfolios/assets/{id}:
 *   get:
 *     summary: 获取指定资产详情
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取资产详情
 *       404:
 *         description: 资产不存在
 */
router.get('/assets/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Asset ID is required')
  ],
  validateRequest,
  portfolioController.getAssetById.bind(portfolioController)
);

// 汇率转换路由
/**
 * @swagger
 * /api/portfolios/convert-currency:
 *   post:
 *     summary: 汇率转换
 *     tags: [Currency]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - fromCurrency
 *               - toCurrency
 *             properties:
 *               amount:
 *                 type: number
 *               fromCurrency:
 *                 type: string
 *               toCurrency:
 *                 type: string
 *     responses:
 *       200:
 *         description: 汇率转换成功
 */
router.post('/convert-currency',
  [
    body('amount')
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom((value) => {
        if (parseFloat(value) < 0) {
          throw new Error('Amount cannot be negative');
        }
        return true;
      }),
    body('fromCurrency')
      .notEmpty()
      .withMessage('From currency is required')
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency code must be 3 characters'),
    body('toCurrency')
      .notEmpty()
      .withMessage('To currency is required')
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency code must be 3 characters')
  ],
  validateRequest,
  portfolioController.convertCurrency.bind(portfolioController)
);

export { router as portfoliosRouter };