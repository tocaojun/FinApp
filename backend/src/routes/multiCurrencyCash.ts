import { Router } from 'express';
import { MultiCurrencyCashController } from '../controllers/MultiCurrencyCashController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const multiCurrencyCashController = new MultiCurrencyCashController();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取账户多币种现金汇总
router.get('/summary', multiCurrencyCashController.getAccountCashSummary.bind(multiCurrencyCashController));

// 获取所有账户的多币种余额列表
router.get('/balances', multiCurrencyCashController.getMultiCurrencyBalances.bind(multiCurrencyCashController));

// 获取特定账户的多币种余额
router.get('/balances/:accountId', multiCurrencyCashController.getAccountMultiCurrencyBalances.bind(multiCurrencyCashController));

// 获取特定账户特定币种的余额
router.get('/balance/:accountId/:currency', multiCurrencyCashController.getAccountCurrencyBalance.bind(multiCurrencyCashController));

// 创建多币种现金交易
router.post('/transactions', multiCurrencyCashController.createMultiCurrencyTransaction.bind(multiCurrencyCashController));

// 获取多币种交易记录
router.get('/transactions', multiCurrencyCashController.getMultiCurrencyTransactions.bind(multiCurrencyCashController));

// 货币兑换
router.post('/exchange', multiCurrencyCashController.exchangeCurrency.bind(multiCurrencyCashController));

// 冻结特定币种资金
router.post('/freeze', multiCurrencyCashController.freezeCurrencyFunds.bind(multiCurrencyCashController));

// 解冻特定币种资金
router.post('/unfreeze', multiCurrencyCashController.unfreezeCurrencyFunds.bind(multiCurrencyCashController));

export default router;