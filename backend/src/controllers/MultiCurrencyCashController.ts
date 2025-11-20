import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { MultiCurrencyCashService } from '../services/MultiCurrencyCashService';
import { databaseService } from '../services/DatabaseService';

export class MultiCurrencyCashController {
  private multiCurrencyCashService: MultiCurrencyCashService;

  constructor() {
    this.multiCurrencyCashService = new MultiCurrencyCashService(databaseService);
  }

  /**
   * 获取账户多币种现金汇总
   * GET /api/multi-currency-cash/summary?portfolio_id=xxx
   */
  public async getAccountCashSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const portfolioId = req.query.portfolio_id as string;
      const summary = await this.multiCurrencyCashService.getAccountCashSummary(userId, portfolioId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      console.error('获取多币种现金汇总失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取多币种现金汇总失败'
      });
    }
  }

  /**
   * 获取特定账户特定币种的余额
   * GET /api/multi-currency-cash/balance/:accountId/:currency
   */
  public async getAccountCurrencyBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const { accountId, currency } = req.params;
      
      if (!accountId || !currency) {
        res.status(400).json({
          success: false,
          message: '请提供账户ID和货币代码'
        });
        return;
      }

      const balance = await this.multiCurrencyCashService.getAccountCurrencyBalance(
        userId, 
        accountId, 
        currency.toUpperCase()
      );

      if (!balance) {
        res.status(404).json({
          success: false,
          message: `未找到账户 ${accountId} 的 ${currency} 余额记录`
        });
        return;
      }

      res.json({
        success: true,
        data: balance
      });
    } catch (error: any) {
      console.error('获取币种余额失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取币种余额失败'       
      });
    }
  }

  /**
   * 获取所有账户的多币种余额列表
   * GET /api/multi-currency-cash/balances
   */
  public async getMultiCurrencyBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const balances = await this.multiCurrencyCashService.getAllUserCurrencyBalances(userId);

      res.json({
        success: true,
        data: balances
      });
    } catch (error: any) {
      console.error('获取多币种余额列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取多币种余额列表失败'
      });
    }
  }

  /**
   * 获取特定账户的多币种余额
   * GET /api/multi-currency-cash/balances/:accountId
   */
  public async getAccountMultiCurrencyBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const { accountId } = req.params;
      
      if (!accountId) {
        res.status(400).json({
          success: false,
          message: '请提供账户ID'
        });
        return;
      }

      const balances = await this.multiCurrencyCashService.getAccountCurrencyBalances(userId, accountId);

      res.json({
        success: true,
        data: balances
      });
    } catch (error: any) {
      console.error('获取账户多币种余额失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取账户多币种余额失败'
      });
    }
  }

  /**
   * 创建多币种现金交易
   * POST /api/multi-currency-cash/transactions
   */
  public async createMultiCurrencyTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const {
        tradingAccountId,
        currency,
        transactionType,
        amount,
        description,
        referenceTransactionId,
        exchangeRate,
        baseCurrencyAmount,
        metadata
      } = req.body;

      if (!tradingAccountId || !currency || !transactionType || !amount) {
        res.status(400).json({
          success: false,
          message: '请提供完整的交易信息'
        });
        return;
      }

      console.log('创建多币种现金交易 - 用户ID:', userId);
      console.log('创建多币种现金交易 - 账户ID:', tradingAccountId);
      console.log('创建多币种现金交易 - 币种:', currency);
      console.log('创建多币种现金交易 - 金额:', amount);

      const transactionId = await this.multiCurrencyCashService.createMultiCurrencyTransaction(userId, {
        tradingAccountId,
        currency: currency.toUpperCase(),
        transactionType,
        amount: parseFloat(amount),
        description,
        referenceTransactionId,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
        baseCurrencyAmount: baseCurrencyAmount ? parseFloat(baseCurrencyAmount) : undefined,
        metadata
      });

      res.json({
        success: true,
        message: '交易创建成功',
        data: {
          transactionId
        }
      });
    } catch (error: any) {
      console.error('创建多币种交易失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建多币种交易失败'
      });
    }
  }

  /**
   * 货币兑换
   * POST /api/multi-currency-cash/exchange
   */
  public async exchangeCurrency(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const {
        tradingAccountId,
        fromCurrency,
        toCurrency,
        fromAmount,
        exchangeRate,
        description
      } = req.body;

      if (!tradingAccountId || !fromCurrency || !toCurrency || !fromAmount || !exchangeRate) {
        res.status(400).json({
          success: false,
          message: '请提供完整的兑换信息'
        });
        return;
      }

      if (fromCurrency === toCurrency) {
        res.status(400).json({
          success: false,
          message: '源货币和目标货币不能相同'
        });
        return;
      }

      const result = await this.multiCurrencyCashService.exchangeCurrency(userId, {
        tradingAccountId,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        fromAmount: parseFloat(fromAmount),
        exchangeRate: parseFloat(exchangeRate),
        description
      });

      res.json({
        success: true,
        message: '货币兑换成功',
        data: result
      });
    } catch (error: any) {
      console.error('货币兑换失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '货币兑换失败'
      });
    }
  }

  /**
   * 获取多币种交易记录
   * GET /api/multi-currency-cash/transactions?account_id=xxx&currency=xxx&page=1&limit=20
   */
  public async getMultiCurrencyTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const tradingAccountId = req.query.account_id as string;
      const currency = req.query.currency as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;

      const result = await this.multiCurrencyCashService.getMultiCurrencyTransactions(
        userId,
        tradingAccountId,
        currency?.toUpperCase(),
        limit,
        offset
      );

      res.json({
        success: true,
        data: {
          transactions: result.transactions,
          pagination: {
            ...result.pagination,
            page,
            totalPages: Math.ceil(result.pagination.total / limit)
          }
        }
      });
    } catch (error: any) {
      console.error('获取多币种交易记录失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取多币种交易记录失败'
      });
    }
  }

  /**
   * 冻结特定币种资金
   * POST /api/multi-currency-cash/freeze
   */
  public async freezeCurrencyFunds(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const { tradingAccountId, currency, amount, description } = req.body;
      
      if (!tradingAccountId || !currency || !amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: '请提供有效的账户ID、货币和冻结金额'
        });
        return;
      }

      await this.multiCurrencyCashService.freezeOrUnfreezeCurrencyFunds(
        userId,
        tradingAccountId,
        currency.toUpperCase(),
        parseFloat(amount),
        true,
        description
      );
      
      res.json({
        success: true,
        message: `${currency} 资金冻结成功`
      });
    } catch (error: any) {
      console.error('冻结资金失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '冻结资金失败'
      });
    }
  }

  /**
   * 解冻特定币种资金
   * POST /api/multi-currency-cash/unfreeze
   */
  public async unfreezeCurrencyFunds(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户认证失败'
        });
        return;
      }

      const { tradingAccountId, currency, amount, description } = req.body;
      
      if (!tradingAccountId || !currency || !amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: '请提供有效的账户ID、货币和解冻金额'
        });
        return;
      }

      await this.multiCurrencyCashService.freezeOrUnfreezeCurrencyFunds(
        userId,
        tradingAccountId,
        currency.toUpperCase(),
        parseFloat(amount),
        false,
        description
      );
      
      res.json({
        success: true,
        message: `${currency} 资金解冻成功`
      });
    } catch (error: any) {
      console.error('解冻资金失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '解冻资金失败'
      });
    }
  }
}