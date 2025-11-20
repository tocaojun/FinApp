import express from 'express';
import { cashController } from '../controllers/CashController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// 应用认证中间件
router.use(authenticateToken);

/**
 * @route GET /api/cash/summary
 * @desc 获取现金余额概览
 * @query currency - 可选，筛选特定币种
 */
router.get('/summary', cashController.getCashSummary.bind(cashController));

/**
 * @route GET /api/cash/balances
 * @desc 获取现金账户余额列表
 * @query portfolio_id - 可选，筛选特定投资组合
 */
router.get('/balances', cashController.getCashBalances.bind(cashController));

/**
 * @route GET /api/cash/transactions
 * @desc 获取现金流水记录
 * @query trading_account_id - 可选，筛选特定交易账户
 * @query limit - 可选，每页数量，默认50
 * @query offset - 可选，偏移量，默认0
 */
router.get('/transactions', cashController.getCashTransactions.bind(cashController));

/**
 * @route POST /api/cash/transactions
 * @desc 创建现金交易（存入/取出）
 * @body tradingAccountId - 交易账户ID
 * @body transactionType - 交易类型：DEPOSIT, WITHDRAW, INVESTMENT, REDEMPTION
 * @body amount - 交易金额
 * @body description - 可选，交易描述
 * @body referenceTransactionId - 可选，关联交易ID
 * @body metadata - 可选，额外信息
 */
router.post('/transactions', cashController.createCashTransaction.bind(cashController));

/**
 * @route POST /api/cash/freeze
 * @desc 冻结资金
 * @body tradingAccountId - 交易账户ID
 * @body amount - 冻结金额
 * @body description - 可选，冻结原因
 */
router.post('/freeze', cashController.freezeFunds.bind(cashController));

/**
 * @route POST /api/cash/unfreeze
 * @desc 解冻资金
 * @body tradingAccountId - 交易账户ID
 * @body amount - 解冻金额
 * @body description - 可选，解冻原因
 */
router.post('/unfreeze', cashController.unfreezeFunds.bind(cashController));

export default router;