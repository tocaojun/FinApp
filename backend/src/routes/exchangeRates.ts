import { Router } from 'express';
import { exchangeRateController } from '../controllers/ExchangeRateController';
import { requirePermission } from '../middleware/permissionMiddleware';

const router = Router();

// 汇率管理路由
router.get('/', exchangeRateController.searchExchangeRates);
router.post('/', requirePermission('exchange_rate', 'create'), exchangeRateController.createExchangeRate);
router.get('/statistics', exchangeRateController.getStatistics);
router.get('/currencies', exchangeRateController.getSupportedCurrencies);
router.get('/convert', exchangeRateController.convertCurrency);
router.post('/bulk-import', requirePermission('exchange_rate', 'import'), exchangeRateController.bulkImportRates);

// 特定货币对路由
router.get('/:fromCurrency/:toCurrency/latest', exchangeRateController.getLatestRate);
router.get('/:fromCurrency/:toCurrency/history', exchangeRateController.getRateHistory);

// 单个汇率记录操作
router.put('/:id', requirePermission('exchange_rate', 'update'), exchangeRateController.updateExchangeRate);
router.delete('/:id', requirePermission('exchange_rate', 'delete'), exchangeRateController.deleteExchangeRate);

export default router;