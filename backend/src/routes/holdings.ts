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
router.get('/:id', holdingController.getHoldingById);

export default router;