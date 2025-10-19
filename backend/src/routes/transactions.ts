import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requirePermission } from '../middleware/permissionMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { body, query, param } from 'express-validator';

const router = Router();
const transactionController = new TransactionController();

// 验证规则
const createTransactionValidation = [
  body('portfolioId').isUUID().withMessage('Portfolio ID must be a valid UUID'),
  body('tradingAccountId').isUUID().withMessage('Trading account ID must be a valid UUID'),
  body('assetId').isUUID().withMessage('Asset ID must be a valid UUID'),
  body('transactionType').isIn([
    'buy', 'sell', 'dividend', 'split', 'merger', 'spin_off', 'deposit', 'withdrawal'
  ]).withMessage('Invalid transaction type'),
  body('side').isIn(['BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL']).withMessage('Invalid transaction side'),
  body('quantity').isFloat({ min: 0.000001 }).withMessage('Quantity must be greater than 0'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('fees').optional().isFloat({ min: 0 }).withMessage('Fees cannot be negative'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('executedAt').isISO8601().withMessage('Executed at must be a valid date'),
  body('settledAt').optional().isISO8601().withMessage('Settled at must be a valid date'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('liquidityTag').optional().isIn(['HIGH', 'MEDIUM', 'LOW', 'ILLIQUID']).withMessage('Invalid liquidity tag')
];

const updateTransactionValidation = [
  param('id').isUUID().withMessage('Transaction ID must be a valid UUID'),
  body('transactionType').optional().isIn([
    'buy', 'sell', 'dividend', 'split', 'merger', 'spin_off', 'deposit', 'withdrawal'
  ]).withMessage('Invalid transaction type'),
  body('side').optional().isIn(['BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL']).withMessage('Invalid transaction side'),
  body('quantity').optional().isFloat({ min: 0.000001 }).withMessage('Quantity must be greater than 0'),
  body('price').optional().isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('fees').optional().isFloat({ min: 0 }).withMessage('Fees cannot be negative'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('executedAt').optional().isISO8601().withMessage('Executed at must be a valid date'),
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

// 获取导入模板
router.get('/import/template', 
  query('format').optional().isIn(['CSV', 'JSON']).withMessage('Invalid template format'),
  validateRequest,
  transactionController.getImportTemplate
);

// 获取交易汇总统计
router.get('/summary/stats', 
  authenticateToken, 
  requirePermission('transactions', 'read'),
  query('portfolioId').optional().isUUID().withMessage('Portfolio ID must be a valid UUID'),
  validateRequest,
  transactionController.getTransactionSummary
);

export { router as transactionsRouter };