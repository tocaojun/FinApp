import { Router } from 'express';
import { AssetController } from '../controllers/AssetController';
import { requirePermission } from '../middleware/permissionMiddleware';

const router = Router();
const assetController = new AssetController();

// 资产管理路由
router.get('/', assetController.searchAssets);
router.post('/', requirePermission('asset', 'create'), assetController.createAsset);

// 具体路由必须在 /:id 之前定义
router.get('/types', assetController.getAssetTypes);
router.get('/types/all', requirePermission('asset', 'read'), assetController.getAllAssetTypes);
router.post('/types', requirePermission('asset', 'create'), assetController.createAssetType);
router.get('/types/:id/usage', requirePermission('asset', 'read'), assetController.getAssetTypeUsage);
router.put('/types/:id', requirePermission('asset', 'update'), assetController.updateAssetType);
router.delete('/types/:id', requirePermission('asset', 'delete'), assetController.deleteAssetType);

router.get('/countries', assetController.getCountries);
router.get('/statistics', assetController.getAssetStatistics);
router.get('/search', assetController.searchSuggestions);
router.get('/export', requirePermission('asset', 'export'), assetController.exportAssets);
router.post('/import', requirePermission('asset', 'import'), assetController.bulkImportAssets);

// 价格管理路由 - 必须在 /:id 之前
router.post('/prices/bulk', requirePermission('price', 'update'), assetController.bulkUpdatePrices);
router.post('/prices/import', requirePermission('price', 'import'), assetController.bulkImportPrices);

// 通用路由 /:id 和相关操作（必须在最后）
router.get('/:id/prices', assetController.getAssetPrices);
router.post('/:id/prices', requirePermission('price', 'create'), assetController.addPrice);
router.get('/:id/prices/export', requirePermission('price', 'export'), assetController.exportPrices);

router.get('/:id', assetController.getAssetById);
router.put('/:id', requirePermission('asset', 'update'), assetController.updateAsset);
router.delete('/:id', requirePermission('asset', 'delete'), assetController.deleteAsset);

// 价格相关的 /:id 路由（必须在最后）
router.put('/prices/:id', requirePermission('price', 'update'), assetController.updatePrice);
router.delete('/prices/:id', requirePermission('price', 'delete'), assetController.deletePrice);

export default router;