import { Router } from 'express';
import { param } from 'express-validator';
import { portfolioController } from '../controllers/PortfolioController';
import { validateRequest } from '../middleware/validateRequest';
import { requirePermission } from '../middleware/permissionMiddleware';

const router = Router();

/**
 * @swagger
 * /api/trading-accounts:
 *   get:
 *     summary: 获取用户的所有交易账户
 *     tags: [Trading Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取交易账户列表
 *       401:
 *         description: 未授权
 */
router.get('/',
  requirePermission('accounts', 'read'),
  portfolioController.getAllTradingAccounts.bind(portfolioController)
);

export { router as tradingAccountsRouter };