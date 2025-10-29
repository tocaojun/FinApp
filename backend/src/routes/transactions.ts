import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { transactionImportController } from '../controllers/TransactionImportController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requirePermission } from '../middleware/permissionMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { body, query, param } from 'express-validator';
import multer from 'multer';

const router = Router();
const transactionController = new TransactionController();

// 配置文件上传
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 验证规则
const createTransactionValidation = [
  body('portfolioId').isUUID().withMessage('Portfolio ID must be a valid UUID'),
  body('tradingAccountId').isUUID().withMessage('Trading account ID must be a valid UUID'),
  body('assetId').isUUID().withMessage('Asset ID must be a valid UUID'),
  body('transactionType').isIn([
    'buy', 'sell', 'dividend', 'split', 'merger', 'spin_off', 'deposit', 'withdrawal',
    'BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'MERGER', 'SPIN_OFF', 'DEPOSIT', 'WITHDRAWAL',
    'STOCK_BUY', 'STOCK_SELL', 'FUND_SUBSCRIBE', 'FUND_REDEEM', 'BOND_BUY', 'BOND_SELL',
    'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE', 'TRANSFER_IN', 'TRANSFER_OUT', 'FEE', 'INTEREST'
  ]).withMessage('Invalid transaction type'),
  body('side').isIn(['BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL']).withMessage('Invalid transaction side'),
  body('quantity').isFloat({ min: 0.000001 }).withMessage('Quantity must be greater than 0'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('fees').optional().isFloat({ min: 0 }).withMessage('Fees cannot be negative'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('executedAt').isISO8601().withMessage('Execution date must be a valid date'),
  body('settledAt').optional().isISO8601().withMessage('Settled at must be a valid date'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('liquidityTag').optional().isIn(['HIGH', 'MEDIUM', 'LOW', 'ILLIQUID']).withMessage('Invalid liquidity tag')
];

const updateTransactionValidation = [
  param('id').isUUID().withMessage('Transaction ID must be a valid UUID'),
  body('transactionType').optional().isIn([
    'buy', 'sell', 'dividend', 'split', 'merger', 'spin_off', 'deposit', 'withdrawal',
    'BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'MERGER', 'SPIN_OFF', 'DEPOSIT', 'WITHDRAWAL',
    'STOCK_BUY', 'STOCK_SELL', 'FUND_SUBSCRIBE', 'FUND_REDEEM', 'BOND_BUY', 'BOND_SELL',
    'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE', 'TRANSFER_IN', 'TRANSFER_OUT', 'FEE', 'INTEREST'
  ]).withMessage('Invalid transaction type'),
  body('side').optional().isIn(['BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL']).withMessage('Invalid transaction side'),
  body('quantity').optional().isFloat({ min: 0.000001 }).withMessage('Quantity must be greater than 0'),
  body('price').optional().isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('fees').optional().isFloat({ min: 0 }).withMessage('Fees cannot be negative'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('executedAt').optional().isISO8601().withMessage('Execution date must be a valid date'),
  body('settledAt').optional().isISO8601().withMessage('Settled at must be a valid date'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('liquidityTag').optional().isIn(['HIGH', 'MEDIUM', 'LOW', 'ILLIQUID']).withMessage('Invalid liquidity tag'),
  body('status').optional().isIn(['PENDING', 'EXECUTED', 'SETTLED', 'CANCELLED', 'FAILED']).withMessage('Invalid status')
];

const batchImportValidation = [
  body('transactions').isArray({ min: 1 }).withMessage('Transactions array is required and must not be empty'),
  body('transactions.*.portfolioId').isUUID().withMessage('Portfolio ID must be a valid UUID'),
  body('transactions.*.tradingAccountId').isUUID().withMessage('Trading account ID must be a valid UUID'),
  body('transactions.*.assetId').isUUID().withMessage('Asset ID must be a valid UUID'),
  body('transactions.*.transactionType').isIn([
    'buy', 'sell', 'dividend', 'split', 'merger', 'spin_off', 'deposit', 'withdrawal'
  ]).withMessage('Invalid transaction type'),
  body('transactions.*.side').isIn(['BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL']).withMessage('Invalid transaction side'),
  body('transactions.*.quantity').isFloat({ min: 0.000001 }).withMessage('Quantity must be greater than 0'),
  body('transactions.*.price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('validateOnly').optional().isBoolean().withMessage('Validate only must be a boolean')
];

const queryValidation = [
  query('portfolioId').optional().isUUID().withMessage('Portfolio ID must be a valid UUID'),
  query('tradingAccountId').optional().isUUID().withMessage('Trading account ID must be a valid UUID'),
  query('assetId').optional().isUUID().withMessage('Asset ID must be a valid UUID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date'),
  query('minAmount').optional().isFloat({ min: 0 }).withMessage('Min amount must be non-negative'),
  query('maxAmount').optional().isFloat({ min: 0 }).withMessage('Max amount must be non-negative')
];

// 交易记录路由

// 获取交易记录列表
router.get('/', 
  authenticateToken, 
  requirePermission('transactions', 'read'),
  queryValidation,
  validateRequest,
  transactionController.getTransactions
);

// 创建交易记录
router.post('/', 
  authenticateToken, 
  requirePermission('transactions', 'create'),
  createTransactionValidation,
  validateRequest,
  transactionController.createTransaction
);

// 获取单个交易记录
router.get('/:id', 
  authenticateToken, 
  requirePermission('transactions', 'read'),
  param('id').isUUID().withMessage('Transaction ID must be a valid UUID'),
  validateRequest,
  transactionController.getTransactionById
);

// 更新交易记录
router.put('/:id', 
  authenticateToken, 
  requirePermission('transactions', 'update'),
  updateTransactionValidation,
  validateRequest,
  transactionController.updateTransaction
);

// 删除交易记录
router.delete('/:id', 
  authenticateToken, 
  requirePermission('transactions', 'delete'),
  param('id').isUUID().withMessage('Transaction ID must be a valid UUID'),
  validateRequest,
  transactionController.deleteTransaction
);

// 批量导入交易记录
router.post('/import', 
  authenticateToken, 
  requirePermission('transactions', 'import'),
  batchImportValidation,
  validateRequest,
  transactionController.batchImportTransactions
);

// 导出交易记录
router.get('/export/data', 
  authenticateToken, 
  requirePermission('transactions', 'read'),
  query('format').optional().isIn(['CSV', 'JSON', 'XLSX']).withMessage('Invalid export format'),
  queryValidation,
  validateRequest,
  transactionController.exportTransactions
);

// ========== 新增：批量导入v2.0路由 ==========
// 注意：更具体的路由必须放在通用路由之前，避免被提前匹配

// 下载Excel模板（需要认证，但不需要特殊权限）
router.get('/import/template/excel',
  // authenticateToken 已在 app.ts 中全局添加
  transactionImportController.downloadExcelTemplate
);

// 下载JSON模板（需要认证，但不需要特殊权限）
router.get('/import/template/json',
  // authenticateToken 已在 app.ts 中全局添加
  transactionImportController.downloadJsonTemplate
);

// 获取导入模板（旧版本，保持向后兼容）
router.get('/import/template', 
  authenticateToken,
  query('format').optional().isIn(['CSV', 'JSON']).withMessage('Invalid template format'),
  validateRequest,
  transactionController.getImportTemplate
);

// 预览导入数据（不实际导入）
router.post('/import/preview',
  authenticateToken,
  requirePermission('transactions', 'create'),
  upload.single('file'),
  transactionImportController.previewImport
);

// 批量导入交易（v2.0）
router.post('/import/batch',
  authenticateToken,
  requirePermission('transactions', 'create'),
  upload.single('file'),
  transactionImportController.importTransactions
);

// ========== 结束：批量导入v2.0路由 ==========

// 获取交易汇总统计
router.get('/summary/stats', 
  authenticateToken, 
  requirePermission('transactions', 'read'),
  query('portfolioId').optional().isUUID().withMessage('Portfolio ID must be a valid UUID'),
  validateRequest,
  transactionController.getTransactionSummary
);

export { router as transactionsRouter };