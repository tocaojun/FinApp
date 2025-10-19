import { Router } from 'express';
import { AssetController } from '../controllers/AssetController';
import { requirePermission } from '../middleware/permissionMiddleware';

const router = Router();
const assetController = new AssetController();

// 资产管理路由
router.get('/', assetController.searchAssets);
router.post('/', requirePermission('asset', 'create'), assetController.createAsset);
router.get('/types', assetController.getAssetTypes);
router.post('/types', requirePermission('asset', 'create'), assetController.createAssetType);
router.get('/types/:id/usage', requirePermission('asset', 'read'), assetController.getAssetTypeUsage);
router.put('/types/:id', requirePermission('asset', 'update'), assetController.updateAssetType);
router.delete('/types/:id', requirePermission('asset', 'delete'), assetController.deleteAssetType);
router.get('/markets', assetController.getMarkets);
router.get('/statistics', assetController.getAssetStatistics);
router.get('/search', assetController.searchSuggestions);
router.get('/export', requirePermission('asset', 'export'), assetController.exportAssets);
router.post('/import', requirePermission('asset', 'import'), assetController.bulkImportAssets);

router.get('/:id', assetController.getAssetById);
router.put('/:id', requirePermission('asset', 'update'), assetController.updateAsset);
router.delete('/:id', requirePermission('asset', 'delete'), assetController.deleteAsset);

// 价格管理路由
router.get('/:id/prices', assetController.getAssetPrices);
router.post('/:id/prices', requirePermission('price', 'create'), assetController.addPrice);
router.get('/:id/prices/export', requirePermission('price', 'export'), assetController.exportPrices);
router.post('/prices/import', requirePermission('price', 'import'), assetController.bulkImportPrices);
router.post('/prices/bulk-update', requirePermission('price', 'update'), assetController.bulkUpdatePrices);

router.put('/prices/:id', requirePermission('price', 'update'), assetController.updatePrice);
router.delete('/prices/:id', requirePermission('price', 'delete'), assetController.deletePrice);

export default router;