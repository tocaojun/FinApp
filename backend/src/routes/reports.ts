import { Router } from 'express';
import { reportController } from '../controllers/ReportController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// 所有报表路由都需要身份验证
router.use(authenticateToken);

// ============= 季度报表相关路由 =============

// 获取季度报表列表
router.get('/quarterly', (req, res) => reportController.getQuarterlyReports(req, res));

// 获取季度概览统计
router.get('/quarterly/:quarter/summary', (req, res) => reportController.getQuarterlySummary(req, res));

// 生成季度报表
router.post('/quarterly/generate', (req, res) => reportController.generateQuarterlyReport(req, res));

// ============= IRR分析相关路由 =============

// 获取IRR分析数据
router.get('/irr', (req, res) => reportController.getIRRAnalysis(req, res));

// 重新计算IRR
router.post('/irr/recalculate', (req, res) => reportController.recalculateIRR(req, res));

// ============= 自定义报表相关路由 =============

// 获取自定义报表列表
router.get('/custom', (req, res) => reportController.getCustomReports(req, res));

// 创建自定义报表
router.post('/custom', (req, res) => reportController.createCustomReport(req, res));

// 获取报表详情
router.get('/:type/:reportId', (req, res) => reportController.getReportDetails(req, res));

// 下载报表
router.get('/:type/:reportId/download', (req, res) => reportController.downloadReport(req, res));

// 运行自定义报表
router.post('/custom/:reportId/run', (req, res) => reportController.runCustomReport(req, res));

// 更新自定义报表
router.put('/custom/:reportId', (req, res) => reportController.updateCustomReport(req, res));

// 删除自定义报表
router.delete('/custom/:reportId', (req, res) => reportController.deleteCustomReport(req, res));

export { router as reportsRouter };