import { Router } from 'express';
import { PriceSyncController } from '../controllers/PriceSyncController';
import { requirePermission } from '../middleware/permissionMiddleware';

const router = Router();
const priceSyncController = new PriceSyncController();

// 数据源管理路由
router.get('/data-sources', priceSyncController.getDataSources);
router.get('/data-sources/:id', priceSyncController.getDataSource);
router.get('/data-sources/:id/coverage', priceSyncController.getDataSourceCoverage);
router.get('/data-sources/:id/markets', priceSyncController.getMarketsByDataSourceAndAssetType);
router.post('/data-sources', requirePermission('price', 'admin'), priceSyncController.createDataSource);
router.put('/data-sources/:id', requirePermission('price', 'admin'), priceSyncController.updateDataSource);
router.delete('/data-sources/:id', requirePermission('price', 'admin'), priceSyncController.deleteDataSource);

// 同步任务管理路由
router.get('/tasks', priceSyncController.getSyncTasks);
router.get('/tasks/:id', priceSyncController.getSyncTask);
router.post('/tasks', requirePermission('price', 'admin'), priceSyncController.createSyncTask);
router.put('/tasks/:id', requirePermission('price', 'admin'), priceSyncController.updateSyncTask);
router.delete('/tasks/:id', requirePermission('price', 'admin'), priceSyncController.deleteSyncTask);

// 同步执行路由
router.post('/tasks/:id/execute', requirePermission('price', 'update'), priceSyncController.executeSyncTask);

// 同步日志路由
router.get('/logs', priceSyncController.getSyncLogs);
router.get('/logs/:id', priceSyncController.getSyncLog);

export default router;
