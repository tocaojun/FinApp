import { Request, Response } from 'express';
import { exchangeRateService } from '../services/ExchangeRateService';

export class ExchangeRateController {
  // 获取汇率列表
  searchExchangeRates = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        fromCurrency,
        toCurrency,
        startDate,
        endDate,
        dataSource,
        page = 1,
        limit = 20,
        sortBy = 'rateDate',
        sortOrder = 'desc'
      } = req.query;

      const criteria = {
        fromCurrency: fromCurrency as string,
        toCurrency: toCurrency as string,
        startDate: startDate as string,
        endDate: endDate as string,
        dataSource: dataSource as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await exchangeRateService.searchExchangeRates(criteria);

      res.json({
        success: true,
        data: result,
        message: 'Exchange rates retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve exchange rates'
      });
    }
  };

  // 创建汇率记录
  createExchangeRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromCurrency, toCurrency, rateDate, rate, dataSource } = req.body;

      if (!fromCurrency || !toCurrency || !rateDate || !rate) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: fromCurrency, toCurrency, rateDate, rate'
        });
        return;
      }

      if (fromCurrency === toCurrency) {
        res.status(400).json({
          success: false,
          message: 'From currency and to currency cannot be the same'
        });
        return;
      }

      if (rate <= 0) {
        res.status(400).json({
          success: false,
          message: 'Exchange rate must be greater than 0'
        });
        return;
      }

      const exchangeRate = await exchangeRateService.createExchangeRate({
        fromCurrency,
        toCurrency,
        rateDate,
        rate: parseFloat(rate),
        dataSource
      });

      res.status(201).json({
        success: true,
        data: exchangeRate,
        message: 'Exchange rate created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create exchange rate'
      });
    }
  };

  // 更新汇率记录
  updateExchangeRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Exchange rate ID is required'
        });
        return;
      }

      const { fromCurrency, toCurrency, rateDate, rate, dataSource } = req.body;

      if (fromCurrency === toCurrency) {
        res.status(400).json({
          success: false,
          message: 'From currency and to currency cannot be the same'
        });
        return;
      }

      if (rate !== undefined && rate <= 0) {
        res.status(400).json({
          success: false,
          message: 'Exchange rate must be greater than 0'
        });
        return;
      }

      const updateData: any = {};
      if (fromCurrency) updateData.fromCurrency = fromCurrency;
      if (toCurrency) updateData.toCurrency = toCurrency;
      if (rateDate) updateData.rateDate = rateDate;
      if (rate !== undefined) updateData.rate = parseFloat(rate);
      if (dataSource) updateData.dataSource = dataSource;

      const exchangeRate = await exchangeRateService.updateExchangeRate(id, updateData);

      res.json({
        success: true,
        data: exchangeRate,
        message: 'Exchange rate updated successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Exchange rate not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update exchange rate'
      });
    }
  };

  // 删除汇率记录
  deleteExchangeRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Exchange rate ID is required'
        });
        return;
      }

      const success = await exchangeRateService.deleteExchangeRate(id);

      if (success) {
        res.json({
          success: true,
          message: 'Exchange rate deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Exchange rate not found'
        });
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete exchange rate'
      });
    }
  };

  // 获取最新汇率
  getLatestRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromCurrency, toCurrency } = req.params;

      if (!fromCurrency || !toCurrency) {
        res.status(400).json({
          success: false,
          message: 'Both fromCurrency and toCurrency are required'
        });
        return;
      }

      const rate = await exchangeRateService.getLatestRate(fromCurrency, toCurrency);

      if (rate) {
        res.json({
          success: true,
          data: rate,
          message: 'Latest exchange rate retrieved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Exchange rate not found'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve latest exchange rate'
      });
    }
  };

  // 获取汇率历史
  getRateHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromCurrency, toCurrency } = req.params;
      const { startDate, endDate, limit = 30 } = req.query;

      if (!fromCurrency || !toCurrency) {
        res.status(400).json({
          success: false,
          message: 'Both fromCurrency and toCurrency are required'
        });
        return;
      }

      const history = await exchangeRateService.getRateHistory(
        fromCurrency,
        toCurrency,
        startDate as string,
        endDate as string,
        parseInt(limit as string) || 30
      );

      res.json({
        success: true,
        data: history,
        message: 'Exchange rate history retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve exchange rate history'
      });
    }
  };

  // 批量导入汇率
  bulkImportRates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rates, skipDuplicates, updateExisting } = req.body;

      if (!rates || !Array.isArray(rates) || rates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Rates array is required and cannot be empty'
        });
        return;
      }

      // 验证每个汇率记录
      for (let i = 0; i < rates.length; i++) {
        const rate = rates[i];
        if (!rate.fromCurrency || !rate.toCurrency || !rate.rateDate || !rate.rate) {
          res.status(400).json({
            success: false,
            message: `Invalid rate data at index ${i}: missing required fields`
          });
          return;
        }

        if (rate.fromCurrency === rate.toCurrency) {
          res.status(400).json({
            success: false,
            message: `Invalid rate data at index ${i}: from and to currency cannot be the same`
          });
          return;
        }

        if (rate.rate <= 0) {
          res.status(400).json({
            success: false,
            message: `Invalid rate data at index ${i}: rate must be greater than 0`
          });
          return;
        }
      }

      const result = await exchangeRateService.bulkImportRates({
        rates,
        skipDuplicates,
        updateExisting
      });

      const statusCode = result.success ? 200 : 207; // 207 Multi-Status for partial success

      res.status(statusCode).json({
        success: result.success,
        data: result,
        message: result.success 
          ? 'Exchange rates imported successfully' 
          : 'Exchange rates imported with some errors'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import exchange rates'
      });
    }
  };

  // 获取统计信息
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const statistics = await exchangeRateService.getExchangeRateStatistics();

      res.json({
        success: true,
        data: statistics,
        message: 'Exchange rate statistics retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve statistics'
      });
    }
  };

  // 获取支持的货币列表
  getSupportedCurrencies = async (req: Request, res: Response): Promise<void> => {
    try {
      const currencies = await exchangeRateService.getSupportedCurrencies();

      res.json({
        success: true,
        data: currencies,
        message: 'Supported currencies retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve supported currencies'
      });
    }
  };

  // 货币转换
  convertCurrency = async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, fromCurrency, toCurrency, rateDate } = req.query;

      if (!amount || !fromCurrency || !toCurrency) {
        res.status(400).json({
          success: false,
          message: 'Amount, fromCurrency, and toCurrency are required'
        });
        return;
      }

      const amountNum = parseFloat(amount as string);
      if (isNaN(amountNum) || amountNum <= 0) {
        res.status(400).json({
          success: false,
          message: 'Amount must be a positive number'
        });
        return;
      }

      const result = await exchangeRateService.convertCurrency(
        amountNum,
        fromCurrency as string,
        toCurrency as string,
        rateDate as string
      );

      if (result) {
        res.json({
          success: true,
          data: result,
          message: 'Currency conversion completed successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Exchange rate not found for the specified currency pair'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to convert currency'
      });
    }
  };
}

export const exchangeRateController = new ExchangeRateController();