import { Router } from 'express';
import { HoldingController } from '../controllers/HoldingController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const holdingController = new HoldingController();

// 所有持仓路由都需要认证
router.use(authenticateToken);

// 持仓管理路由
// 支持两种格式：
// 1. GET /api/holdings?portfolioId=xxx (查询参数)
// 2. GET /api/holdings/portfolio/xxx (路径参数)
router.get('/', holdingController.getHoldingsByPortfolio);
router.get('/portfolio/:portfolioId', holdingController.getHoldingsByPortfolio);
router.get('/portfolio/:portfolioId/summary', holdingController.getPortfolioHoldingSummary);

// 理财产品相关路由 (兼容旧API)
router.get('/portfolio/:portfolioId/wealth-summary', holdingController.getWealthProductsSummary);
router.get('/portfolio/:portfolioId/category', holdingController.getPositionsByCategory);

// 理财产品更新路由
router.post('/:positionId/update-nav', holdingController.updateWealthProductNav);
router.post('/:positionId/update-balance', holdingController.updateWealthProductBalance);

// 余额历史记录路由
router.get('/:positionId/balance-history', holdingController.getBalanceHistory);
router.post('/:positionId/balance-history', holdingController.addBalanceHistoryRecord);
router.put('/balance-history/:recordId', holdingController.updateBalanceHistoryRecord);
router.delete('/balance-history/:recordId', holdingController.deleteBalanceHistoryRecord);
router.get('/portfolio/:portfolioId/balance-history-summary', holdingController.getPortfolioBalanceHistorySummary);

router.get('/:id', holdingController.getHoldingById);

export default router;