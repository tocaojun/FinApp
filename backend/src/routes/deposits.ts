import { Router } from 'express';
import { DepositController } from '../controllers/DepositController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const depositController = new DepositController();

// 存款产品相关路由
router.get('/products', depositController.getDepositProducts);
router.get('/products/:assetId/details', depositController.getDepositDetails);
router.post('/products/:assetId/details', authenticateToken, depositController.createDepositDetails);
router.put('/products/:assetId/details', authenticateToken, depositController.updateDepositDetails);

// 用户存款持仓相关路由
router.get('/positions', authenticateToken, depositController.getUserDepositPositions);
router.get('/statistics', authenticateToken, depositController.getDepositStatistics);

// 利息计算相关路由
router.post('/positions/:positionId/calculate-interest', authenticateToken, depositController.calculateInterest);
router.post('/positions/:positionId/record-interest', authenticateToken, depositController.recordInterest);

// 到期管理相关路由
router.get('/upcoming-maturity', authenticateToken, depositController.getUpcomingMaturityDeposits);
router.post('/maturity-alerts', authenticateToken, depositController.createMaturityAlert);
router.post('/positions/:positionId/process-maturity', authenticateToken, depositController.processMaturity);

export default router;