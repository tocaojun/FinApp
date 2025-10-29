import { databaseService } from './DatabaseService';

// 简化的类型定义
interface SimpleExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rateDate: string;
  rate: number;
  dataSource?: string;
  createdAt: string;
}

interface ExchangeRateSearchCriteria {
  fromCurrency?: string;
  toCurrency?: string;
  startDate?: string;
  endDate?: string;
  dataSource?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ExchangeRateCreateRequest {
  fromCurrency: string;
  toCurrency: string;
  rateDate: string;
  rate: number;
  dataSource?: string;
}

interface ExchangeRateStatistics {
  totalRates: number;
  currencyPairs: number;
  latestUpdate: string;
  dataSourcesCount: number;
  supportedCurrencies: string[];
}

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

export class ExchangeRateService {
  private db = databaseService;

  // 获取汇率列表
  async searchExchangeRates(criteria: ExchangeRateSearchCriteria): Promise<{
    rates: SimpleExchangeRate[];
    total: number;
  }> {
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
      } = criteria;

      const offset = (page - 1) * limit;
      const conditions: string[] = [];
      const params: any[] = [];

      if (fromCurrency) {
        conditions.push(`from_currency = $${params.length + 1}`);
        params.push(fromCurrency);
      }

      if (toCurrency) {
        conditions.push(`to_currency = $${params.length + 1}`);
        params.push(toCurrency);
      }

      if (startDate) {
        conditions.push(`rate_date >= $${params.length + 1}`);
        params.push(startDate);
      }

      if (endDate) {
        conditions.push(`rate_date <= $${params.length + 1}`);
        params.push(endDate);
      }

      if (dataSource) {
        conditions.push(`data_source = $${params.length + 1}`);
        params.push(dataSource);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) as count FROM exchange_rates ${whereClause}`;
      const countResult = await this.db.prisma.$queryRawUnsafe(countQuery, ...params) as any[];
      const total = parseInt(countResult[0].count);

      // 获取数据
      // 将驼峰命名转换为下划线命名
      const sortColumn = sortBy === 'createdAt' ? 'created_at' : 
                        sortBy === 'rateDate' ? 'rate_date' :
                        sortBy === 'fromCurrency' ? 'from_currency' :
                        sortBy === 'toCurrency' ? 'to_currency' :
                        sortBy === 'dataSource' ? 'data_source' :
                        sortBy;
      
      const dataQuery = `
        SELECT * FROM exchange_rates 
        ${whereClause}
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      params.push(limit, offset);

      const result = await this.db.prisma.$queryRawUnsafe(dataQuery, ...params) as any[];

      const rates = result.map((row: any) => ({
        id: row.id,
        fromCurrency: row.from_currency,
        toCurrency: row.to_currency,
        rateDate: row.rate_date,
        rate: parseFloat(row.rate),
        dataSource: row.data_source,
        createdAt: row.created_at
      }));

      return { rates, total };
    } catch (error) {
      console.error('Error searching exchange rates:', error);
      throw error;
    }
  }

  // 创建汇率记录
  async createExchangeRate(data: ExchangeRateCreateRequest): Promise<SimpleExchangeRate> {
    try {
      // 确保日期格式正确 (YYYY-MM-DD)
      const rateDateStr = data.rateDate.includes('T') 
        ? data.rateDate.split('T')[0] 
        : data.rateDate;
      
      const result = await this.db.prisma.$queryRaw`
        INSERT INTO exchange_rates (
          from_currency, to_currency, rate_date, rate, data_source
        ) VALUES (
          ${data.fromCurrency.toUpperCase()}, ${data.toCurrency.toUpperCase()}, 
          ${rateDateStr}::date, ${data.rate}, ${data.dataSource || 'manual'}
        )
        ON CONFLICT (from_currency, to_currency, rate_date)
        DO UPDATE SET 
          rate = EXCLUDED.rate,
          data_source = EXCLUDED.data_source,
          created_at = CURRENT_TIMESTAMP
        RETURNING *
      ` as any[];

      const row = result[0];
      return {
        id: row.id,
        fromCurrency: row.from_currency,
        toCurrency: row.to_currency,
        rateDate: row.rate_date,
        rate: parseFloat(row.rate),
        dataSource: row.data_source,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error creating exchange rate:', error);
      throw new Error('Failed to create exchange rate');
    }
  }

  // 更新汇率记录
  async updateExchangeRate(id: string, data: Partial<ExchangeRateCreateRequest>): Promise<SimpleExchangeRate> {
    try {
      const result = await this.db.prisma.$queryRaw`
        UPDATE exchange_rates SET
          from_currency = COALESCE(${data.fromCurrency?.toUpperCase()}, from_currency),
          to_currency = COALESCE(${data.toCurrency?.toUpperCase()}, to_currency),
          rate_date = COALESCE(${data.rateDate}, rate_date),
          rate = COALESCE(${data.rate}, rate),
          data_source = COALESCE(${data.dataSource}, data_source)
        WHERE id = ${id}
        RETURNING *
      ` as any[];

      if (result.length === 0) {
        throw new Error('Exchange rate not found');
      }

      const row = result[0];
      return {
        id: row.id,
        fromCurrency: row.from_currency,
        toCurrency: row.to_currency,
        rateDate: row.rate_date,
        rate: parseFloat(row.rate),
        dataSource: row.data_source,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      throw new Error('Failed to update exchange rate');
    }
  }

  // 删除汇率记录
  async deleteExchangeRate(id: string): Promise<boolean> {
    try {
      const result = await this.db.prisma.$queryRaw`
        DELETE FROM exchange_rates WHERE id = ${id}
      ` as any[];

      return true;
    } catch (error) {
      console.error('Error deleting exchange rate:', error);
      throw new Error('Failed to delete exchange rate');
    }
  }

  // 获取最新汇率
  async getLatestRate(fromCurrency: string, toCurrency: string): Promise<SimpleExchangeRate | null> {
    try {
      const result = await this.db.prisma.$queryRaw`
        SELECT * FROM exchange_rates 
        WHERE from_currency = ${fromCurrency.toUpperCase()} 
          AND to_currency = ${toCurrency.toUpperCase()}
        ORDER BY rate_date DESC, created_at DESC
        LIMIT 1
      ` as any[];

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        fromCurrency: row.from_currency,
        toCurrency: row.to_currency,
        rateDate: row.rate_date,
        rate: parseFloat(row.rate),
        dataSource: row.data_source,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error getting latest rate:', error);
      return null;
    }
  }

  // 获取汇率历史
  async getRateHistory(
    fromCurrency: string, 
    toCurrency: string, 
    startDate?: string, 
    endDate?: string,
    limit: number = 30
  ): Promise<SimpleExchangeRate[]> {
    try {
      const conditions = [
        `from_currency = '${fromCurrency.toUpperCase()}'`,
        `to_currency = '${toCurrency.toUpperCase()}'`
      ];

      if (startDate) {
        conditions.push(`rate_date >= '${startDate}'`);
      }

      if (endDate) {
        conditions.push(`rate_date <= '${endDate}'`);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      const result = await this.db.prisma.$queryRawUnsafe(`
        SELECT * FROM exchange_rates 
        ${whereClause}
        ORDER BY rate_date DESC
        LIMIT ${limit}
      `) as any[];

      return result.map((row: any) => ({
        id: row.id,
        fromCurrency: row.from_currency,
        toCurrency: row.to_currency,
        rateDate: row.rate_date,
        rate: parseFloat(row.rate),
        dataSource: row.data_source,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error getting rate history:', error);
      return [];
    }
  }

  // 批量导入汇率
  async bulkImportRates(data: {
    rates: ExchangeRateCreateRequest[];
    skipDuplicates?: boolean;
    updateExisting?: boolean;
  }): Promise<{
    success: boolean;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
    updatedCount: number;
    errors: Array<{
      row: number;
      fromCurrency: string;
      toCurrency: string;
      rateDate: string;
      message: string;
    }>;
  }> {
    const { rates, skipDuplicates = false, updateExisting = true } = data;
    const result = {
      success: false,
      totalRecords: rates.length,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      updatedCount: 0,
      errors: [] as any[]
    };

    try {
      for (let i = 0; i < rates.length; i++) {
        const rate = rates[i];
        if (!rate) continue;
        
        try {
          // 检查是否已存在
          const existing = await this.db.prisma.$queryRaw`
            SELECT id FROM exchange_rates 
            WHERE from_currency = ${rate.fromCurrency.toUpperCase()}
              AND to_currency = ${rate.toCurrency.toUpperCase()}
              AND rate_date = ${rate.rateDate}
          ` as any[];

          if (existing.length > 0) {
            if (skipDuplicates) {
              result.skippedCount++;
              continue;
            } else if (updateExisting) {
              await this.updateExchangeRate(existing[0].id, rate);
              result.updatedCount++;
            } else {
              result.skippedCount++;
              continue;
            }
          } else {
            await this.createExchangeRate(rate);
            result.successCount++;
          }
        } catch (error) {
          result.errorCount++;
          result.errors.push({
            row: i + 1,
            fromCurrency: rate?.fromCurrency || 'Unknown',
            toCurrency: rate?.toCurrency || 'Unknown',
            rateDate: rate?.rateDate || 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.errorCount === 0;
      return result;
    } catch (error) {
      console.error('Error in bulk import:', error);
      throw new Error('Bulk import failed');
    }
  }

  // 获取统计信息
  async getExchangeRateStatistics(): Promise<ExchangeRateStatistics> {
    try {
      const totalRatesResult = await this.db.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM exchange_rates
      ` as any[];

      const currencyPairsResult = await this.db.prisma.$queryRaw`
        SELECT COUNT(DISTINCT CONCAT(from_currency, '-', to_currency)) as count 
        FROM exchange_rates
      ` as any[];

      const latestUpdateResult = await this.db.prisma.$queryRaw`
        SELECT MAX(created_at) as latest FROM exchange_rates
      ` as any[];

      const dataSourcesResult = await this.db.prisma.$queryRaw`
        SELECT COUNT(DISTINCT data_source) as count FROM exchange_rates
      ` as any[];

      const currenciesResult = await this.db.prisma.$queryRaw`
        SELECT DISTINCT from_currency as currency FROM exchange_rates
        UNION
        SELECT DISTINCT to_currency as currency FROM exchange_rates
        ORDER BY currency
      ` as any[];

      return {
        totalRates: parseInt(totalRatesResult[0].count),
        currencyPairs: parseInt(currencyPairsResult[0].count),
        latestUpdate: latestUpdateResult[0].latest || new Date().toISOString(),
        dataSourcesCount: parseInt(dataSourcesResult[0].count),
        supportedCurrencies: currenciesResult.map((row: any) => row.currency)
      };
    } catch (error) {
      console.error('Error getting exchange rate statistics:', error);
      return {
        totalRates: 0,
        currencyPairs: 0,
        latestUpdate: new Date().toISOString(),
        dataSourcesCount: 0,
        supportedCurrencies: []
      };
    }
  }

  // 获取支持的货币列表
  async getSupportedCurrencies(): Promise<CurrencyInfo[]> {
    const currencies = [
      { code: 'USD', name: '美元', symbol: '$', isActive: true },
      { code: 'EUR', name: '欧元', symbol: '€', isActive: true },
      { code: 'GBP', name: '英镑', symbol: '£', isActive: true },
      { code: 'JPY', name: '日元', symbol: '¥', isActive: true },
      { code: 'CNY', name: '人民币', symbol: '¥', isActive: true },
      { code: 'HKD', name: '港币', symbol: 'HK$', isActive: true },
      { code: 'AUD', name: '澳元', symbol: 'A$', isActive: true },
      { code: 'CAD', name: '加元', symbol: 'C$', isActive: true },
      { code: 'CHF', name: '瑞士法郎', symbol: 'CHF', isActive: true },
      { code: 'SGD', name: '新加坡元', symbol: 'S$', isActive: true },
      { code: 'KRW', name: '韩元', symbol: '₩', isActive: true },
      { code: 'INR', name: '印度卢比', symbol: '₹', isActive: true }
    ];

    return currencies;
  }

  // 汇率转换计算
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rateDate?: string
  ): Promise<{
    originalAmount: number;
    convertedAmount: number;
    rate: number;
    fromCurrency: string;
    toCurrency: string;
    rateDate: string;
  } | null> {
    try {
      if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
        return {
          originalAmount: amount,
          convertedAmount: amount,
          rate: 1,
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          rateDate: (rateDate || new Date().toISOString().split('T')[0]) as string
        };
      }

      let rate: SimpleExchangeRate | null = null;

      if (rateDate) {
        // 获取指定日期的汇率
        const result = await this.db.prisma.$queryRaw`
          SELECT * FROM exchange_rates 
          WHERE from_currency = ${fromCurrency.toUpperCase()} 
            AND to_currency = ${toCurrency.toUpperCase()}
            AND rate_date = ${rateDate}
          ORDER BY created_at DESC
          LIMIT 1
        ` as any[];

        if (result.length > 0) {
          const row = result[0];
          rate = {
            id: row.id,
            fromCurrency: row.from_currency,
            toCurrency: row.to_currency,
            rateDate: row.rate_date,
            rate: parseFloat(row.rate),
            dataSource: row.data_source,
            createdAt: row.created_at
          };
        }
      } else {
        // 获取最新汇率
        rate = await this.getLatestRate(fromCurrency, toCurrency);
      }

      if (!rate) {
        // 尝试反向汇率
        const reverseRate = await this.getLatestRate(toCurrency, fromCurrency);
        if (reverseRate) {
          return {
            originalAmount: amount,
            convertedAmount: amount / reverseRate.rate,
            rate: 1 / reverseRate.rate,
            fromCurrency: fromCurrency.toUpperCase(),
            toCurrency: toCurrency.toUpperCase(),
            rateDate: reverseRate.rateDate
          };
        }
        return null;
      }

      return {
        originalAmount: amount,
        convertedAmount: amount * rate.rate,
        rate: rate.rate,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        rateDate: rate.rateDate
      };
    } catch (error) {
      console.error('Error converting currency:', error);
      return null;
    }
  }
}

export const exchangeRateService = new ExchangeRateService();