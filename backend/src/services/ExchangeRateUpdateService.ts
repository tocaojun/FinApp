import * as cron from 'node-cron';
import axios from 'axios';
import { ExchangeRateService } from './ExchangeRateService';
import { logger } from '../utils/logger';
import { NotificationService } from './NotificationService';

interface ExternalRateProvider {
  name: string;
  url: string;
  apiKey?: string;
  transform: (data: any) => { fromCurrency: string; toCurrency: string; rate: number }[];
}

export class ExchangeRateUpdateService {
  private static instance: ExchangeRateUpdateService;
  private exchangeRateService: ExchangeRateService;
  private notificationService: NotificationService;
  private isRunning = false;
  private updateJob: cron.ScheduledTask | null = null;

  // 外部汇率数据提供商配置
  private providers: ExternalRateProvider[] = [
    {
      name: 'frankfurter-cny',
      url: 'https://api.frankfurter.app/latest',
      transform: (data: any) => {
        const base = data.base;
        return Object.entries(data.rates).map(([currency, rate]) => ({
          fromCurrency: base,
          toCurrency: currency as string,
          rate: rate as number
        }));
      }
    },
    {
      name: 'fixer.io',
      url: 'https://api.fixer.io/latest',
      apiKey: process.env.FIXER_API_KEY,
      transform: (data: any) => {
        const base = data.base;
        return Object.entries(data.rates).map(([currency, rate]) => ({
          fromCurrency: base,
          toCurrency: currency as string,
          rate: rate as number
        }));
      }
    },
    {
      name: 'exchangerate-api.com',
      url: 'https://api.exchangerate-api.com/v4/latest/USD',
      transform: (data: any) => {
        const base = data.base;
        return Object.entries(data.rates).map(([currency, rate]) => ({
          fromCurrency: base,
          toCurrency: currency as string,
          rate: rate as number
        }));
      }
    },
    {
      name: 'currencylayer.com',
      url: 'http://api.currencylayer.com/live',
      apiKey: process.env.CURRENCYLAYER_API_KEY,
      transform: (data: any) => {
        const quotes = data.quotes;
        return Object.entries(quotes).map(([pair, rate]) => {
          const fromCurrency = pair.substring(0, 3);
          const toCurrency = pair.substring(3, 6);
          return {
            fromCurrency,
            toCurrency,
            rate: rate as number
          };
        });
      }
    }
  ];

  // 监控的主要货币对（各种货币转换为人民币CNY）
  private monitoredPairs = [
    { from: 'USD', to: 'CNY' },  // 美元→人民币
    { from: 'EUR', to: 'CNY' },  // 欧元→人民币
    { from: 'GBP', to: 'CNY' },  // 英镑→人民币
    { from: 'JPY', to: 'CNY' },  // 日元→人民币
    { from: 'HKD', to: 'CNY' },  // 港币→人民币
    { from: 'SGD', to: 'CNY' },  // 新币→人民币
    { from: 'AUD', to: 'CNY' },  // 澳元→人民币
    { from: 'CAD', to: 'CNY' },  // 加元→人民币
    { from: 'CHF', to: 'CNY' },  // 瑞郎→人民币
    { from: 'INR', to: 'CNY' },  // 印度卢比→人民币
  ];

  constructor() {
    this.exchangeRateService = new ExchangeRateService();
    this.notificationService = new NotificationService();
  }

  static getInstance(): ExchangeRateUpdateService {
    if (!ExchangeRateUpdateService.instance) {
      ExchangeRateUpdateService.instance = new ExchangeRateUpdateService();
    }
    return ExchangeRateUpdateService.instance;
  }

  // 启动自动更新服务
  startAutoUpdate(schedule: string = '0 */4 * * *'): void {
    if (this.isRunning) {
      logger.warn('Exchange rate auto update is already running');
      return;
    }

    try {
      // 每4小时更新一次汇率
      this.updateJob = cron.schedule(schedule, async () => {
        await this.updateAllRates();
      });

      this.isRunning = true;
      logger.info(`Exchange rate auto update started with schedule: ${schedule}`);
    } catch (error) {
      logger.error('Failed to start exchange rate auto update:', error);
      throw error;
    }
  }

  // 停止自动更新服务
  stopAutoUpdate(): void {
    if (this.updateJob) {
      this.updateJob.stop();
      this.updateJob = null;
    }
    this.isRunning = false;
    logger.info('Exchange rate auto update stopped');
  }

  // 导入历史汇率数据（优化版本）
  async importHistoricalRates(years: number = 10): Promise<{
    success: boolean;
    totalDays: number;
    successCount: number;
    errorCount: number;
    message: string;
  }> {
    logger.info(`Starting optimized historical exchange rate import for the past ${years} years...`);
    
    let successCount = 0;
    let errorCount = 0;
    const totalDays = years * 365;
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - years);
      
      // 获取唯一的基础货币列表
      const baseCurrencies = [...new Set(this.monitoredPairs.map(p => p.from))];
      logger.info(`Found ${baseCurrencies.length} base currencies: ${baseCurrencies.join(', ')}`);
      
      // 按月份批量生成日期列表（优化：按月而不是按天）
      const months: string[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        // 使用月底日期（大多数 API 返回月末数据）
        const lastDay = new Date(year, parseInt(month), 0).getDate();
        const dateStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        months.push(dateStr);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      logger.info(`Fetching ${months.length} monthly data points for ${baseCurrencies.length} base currencies...`);
      
      // 为每个基础货币并发获取历史数据
      const allRatesToInsert: any[] = [];
      const monthChunkSize = 50; // 每次并发处理 50 个月
      
      for (let i = 0; i < months.length; i += monthChunkSize) {
        const monthChunk = months.slice(i, i + monthChunkSize);
        
        // 并发获取所有基础货币在这个月份范围内的数据
        const promises = monthChunk.flatMap(dateStr =>
          baseCurrencies.map(baseCurrency =>
            this.fetchHistoricalRatesForDate(dateStr, baseCurrency)
              .then(rates => ({ dateStr, baseCurrency, rates }))
              .catch(error => {
                logger.warn(`Failed to fetch rates for ${baseCurrency} on ${dateStr}:`, error.message);
                return { dateStr, baseCurrency, rates: [] };
              })
          )
        );
        
        try {
          const results = await Promise.all(promises);
          
          // 收集所有要插入的记录
          for (const result of results) {
            if (result.rates && result.rates.length > 0) {
              for (const rate of result.rates) {
                const isMonitored = this.monitoredPairs.some(pair =>
                  pair.from === rate.fromCurrency && pair.to === rate.toCurrency
                );
                
                if (isMonitored) {
                  allRatesToInsert.push({
                    fromCurrency: rate.fromCurrency,
                    toCurrency: rate.toCurrency,
                    rate: rate.rate,
                    rateDate: result.dateStr,
                    dataSource: 'historical_import'
                  });
                }
              }
            }
          }
          
          // 每处理 50 个月后进行一次批量插入，减少内存占用
          if ((i + monthChunkSize) % 150 === 0 || i + monthChunkSize >= months.length) {
            const insertResult = await this.bulkInsertExchangeRates(allRatesToInsert);
            successCount += insertResult.success;
            errorCount += insertResult.errors;
            
            logger.info(`Batch insert completed: ${insertResult.success} success, ${insertResult.errors} errors. Progress: ${Math.min(i + monthChunkSize, months.length)}/${months.length} months`);
            
            // 清空待插入列表
            allRatesToInsert.length = 0;
          }
          
        } catch (error) {
          logger.error(`Error processing month batch starting at ${monthChunk[0]}:`, error);
          errorCount += monthChunk.length;
        }
        
        // 在批次之间暂停，避免 API 限制
        if (i + monthChunkSize < months.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // 处理最后剩余的记录
      if (allRatesToInsert.length > 0) {
        const insertResult = await this.bulkInsertExchangeRates(allRatesToInsert);
        successCount += insertResult.success;
        errorCount += insertResult.errors;
      }
      
      const message = `Optimized historical import completed. Success: ${successCount}, Errors: ${errorCount}`;
      logger.info(message);
      
      return {
        success: errorCount < successCount,
        totalDays,
        successCount,
        errorCount,
        message
      };
      
    } catch (error) {
      logger.error('Historical exchange rate import failed:', error);
      throw error;
    }
  }

  // 辅助函数：获取特定日期和基础货币的汇率
  private async fetchHistoricalRatesForDate(
    dateStr: string,
    baseCurrency: string
  ): Promise<{ fromCurrency: string; toCurrency: string; rate: number }[]> {
    try {
      const url = `https://api.frankfurter.app/${dateStr}?base=${baseCurrency}`;
      
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'FinApp/1.0'
        }
      });
      
      if (!response.data || !response.data.rates) {
        return [];
      }
      
      return Object.entries(response.data.rates).map(([currency, rate]) => ({
        fromCurrency: baseCurrency,
        toCurrency: currency as string,
        rate: rate as number
      }));
      
    } catch (error) {
      throw error;
    }
  }

  // 辅助函数：批量插入汇率数据
  private async bulkInsertExchangeRates(rates: any[]): Promise<{ success: number; errors: number }> {
    if (rates.length === 0) {
      return { success: 0, errors: 0 };
    }
    
    let success = 0;
    let errors = 0;
    
    try {
      // 按 100 条记录分批
      for (let i = 0; i < rates.length; i += 100) {
        const batch = rates.slice(i, i + 100);
        
        for (const rate of batch) {
          try {
            await this.exchangeRateService.createExchangeRate(rate);
            success++;
          } catch (error) {
            // 忽略重复数据错误
            if (!error.message?.includes('duplicate') && !error.message?.includes('unique')) {
              errors++;
            } else {
              success++; // 重复数据视为成功
            }
          }
        }
      }
    } catch (error) {
      logger.error('Bulk insert failed:', error);
      errors += rates.length;
    }
    
    return { success, errors };
  }

  // 手动触发更新所有汇率
  async updateAllRates(): Promise<void> {
    logger.info('Starting exchange rate update...');
    
    try {
      const results = await Promise.allSettled(
        this.providers.map(provider => this.updateFromProvider(provider))
      );

      let successCount = 0;
      let errorCount = 0;
      const failedProviders: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount += result.value;
        } else {
          errorCount++;
          failedProviders.push(this.providers[index].name);
          logger.error(`Provider ${this.providers[index].name} failed:`, result.reason);
        }
      });

      logger.info(`Exchange rate update completed. Success: ${successCount}, Errors: ${errorCount}`);
      
      // 即使没有从外部 API 获取到数据，也不要抛出错误
      // 这允许前端至少获得已有的本地汇率数据
      if (successCount === 0 && errorCount > 0) {
        logger.warn(`All ${errorCount} providers failed: ${failedProviders.join(', ')}. Using cached/local data.`);
      }

      // 发送更新通知
      await this.sendUpdateNotification(successCount, errorCount);

    } catch (error) {
      logger.error('Exchange rate update failed:', error);
      // 不抛出错误，允许前端继续使用现有数据
    }
  }

  // 从指定提供商更新汇率
  private async updateFromProvider(provider: ExternalRateProvider): Promise<number> {
    try {
      logger.info(`Fetching rates from ${provider.name}...`);

      const config: any = {
        timeout: 10000,
        headers: {
          'User-Agent': 'FinApp/1.0'
        }
      };

      // 针对 Frankfurter API，为每个基础货币发起请求
      // 这样可以获取以不同货币为基准的汇率
      let url = provider.url;
      if (provider.name === 'frankfurter-cny') {
        // 为每个监控对中的基础货币获取汇率
        const baseCurrencies = [...new Set(this.monitoredPairs.map(p => p.from))];
        let updateCount = 0;

        for (const baseCurrency of baseCurrencies) {
          try {
            const cnyUrl = `https://api.frankfurter.app/latest?base=${baseCurrency}`;
            const response = await axios.get(cnyUrl, config);
            
            if (!response.data || response.data.error) {
              throw new Error(`API error: ${response.data?.error?.info || 'Unknown error'}`);
            }

            const rates = provider.transform(response.data);
            
            for (const rate of rates) {
              try {
                const isMonitored = this.monitoredPairs.some(pair => 
                  pair.from === rate.fromCurrency && pair.to === rate.toCurrency
                );

                if (isMonitored) {
                  const today = new Date();
                  const rateDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  
                  await this.exchangeRateService.createExchangeRate({
                    fromCurrency: rate.fromCurrency,
                    toCurrency: rate.toCurrency,
                    rate: rate.rate,
                    rateDate: rateDate,
                    dataSource: 'api'
                  });
                  updateCount++;
                }
              } catch (error) {
                if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
                  logger.warn(`Failed to update rate ${rate.fromCurrency}/${rate.toCurrency}:`, error.message);
                }
              }
            }
          } catch (error) {
            logger.warn(`Failed to fetch rates from Frankfurter with base ${baseCurrency}:`, error.message);
          }
        }

        logger.info(`Updated ${updateCount} rates from ${provider.name}`);
        return updateCount;
      }

      // 添加API密钥（如果需要）
      if (provider.apiKey) {
        if (provider.name === 'fixer.io') {
          config.params = { access_key: provider.apiKey };
        } else if (provider.name === 'currencylayer.com') {
          config.params = { access_key: provider.apiKey };
        }
      }

      const response = await axios.get(url, config);
      
      if (!response.data || response.data.error) {
        throw new Error(`API error: ${response.data?.error?.info || 'Unknown error'}`);
      }

      const rates = provider.transform(response.data);
      let updateCount = 0;

      // 批量更新汇率
      for (const rate of rates) {
        try {
          // 只更新监控的货币对
          const isMonitored = this.monitoredPairs.some(pair => 
            pair.from === rate.fromCurrency && pair.to === rate.toCurrency
          );

          if (isMonitored) {
            const today = new Date();
            const rateDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            await this.exchangeRateService.createExchangeRate({
              fromCurrency: rate.fromCurrency,
              toCurrency: rate.toCurrency,
              rate: rate.rate,
              rateDate: rateDate,
              dataSource: 'api'
            });
            updateCount++;
          }
        } catch (error) {
          // 忽略重复数据错误，继续处理其他汇率
          if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
            logger.warn(`Failed to update rate ${rate.fromCurrency}/${rate.toCurrency}:`, error.message);
          }
        }
      }

      logger.info(`Updated ${updateCount} rates from ${provider.name}`);
      return updateCount;

    } catch (error) {
      logger.error(`Failed to fetch rates from ${provider.name}:`, error);
      throw error;
    }
  }

  // 检查汇率变动并发送通知
  async checkRateChanges(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      for (const pair of this.monitoredPairs) {
        const todayRate = await this.exchangeRateService.getLatestRate(
          pair.from, 
          pair.to
        );
        
        const yesterdayRate = await this.exchangeRateService.getLatestRate(
          pair.from, 
          pair.to
        );

        if (todayRate && yesterdayRate) {
          const change = todayRate.rate - yesterdayRate.rate;
          const changePercent = (change / yesterdayRate.rate) * 100;

          // 如果变动超过阈值，发送通知
          if (Math.abs(changePercent) > 2) { // 2%阈值
            await this.sendRateChangeNotification(
              pair.from,
              pair.to,
              yesterdayRate.rate,
              todayRate.rate,
              changePercent
            );
          }
        }
      }
    } catch (error) {
      logger.error('Failed to check rate changes:', error);
    }
  }

  // 发送更新通知
  private async sendUpdateNotification(successCount: number, errorCount: number): Promise<void> {
    try {
      const message = `汇率更新完成：成功更新 ${successCount} 条记录${errorCount > 0 ? `，${errorCount} 个提供商失败` : ''}`;
      
      await this.notificationService.sendSystemNotification({
        type: 'system',
        title: '汇率自动更新',
        message,
        level: errorCount > 0 ? 'warning' : 'info'
      });
    } catch (error) {
      logger.error('Failed to send update notification:', error);
    }
  }

  // 发送汇率变动通知
  private async sendRateChangeNotification(
    fromCurrency: string,
    toCurrency: string,
    oldRate: number,
    newRate: number,
    changePercent: number
  ): Promise<void> {
    try {
      const direction = changePercent > 0 ? '上涨' : '下跌';
      const message = `${fromCurrency}/${toCurrency} 汇率${direction} ${Math.abs(changePercent).toFixed(2)}%，从 ${oldRate.toFixed(6)} 变为 ${newRate.toFixed(6)}`;
      
      await this.notificationService.sendSystemNotification({
        type: 'rate_change',
        title: '汇率变动提醒',
        message,
        level: Math.abs(changePercent) > 5 ? 'warning' : 'info',
        metadata: {
          fromCurrency,
          toCurrency,
          oldRate,
          newRate,
          changePercent
        }
      });
    } catch (error) {
      logger.error('Failed to send rate change notification:', error);
    }
  }

  // 批量导入汇率数据
  async bulkImportRates(data: any[]): Promise<{ success: number; errors: string[] }> {
    const results = { success: 0, errors: [] as string[] };

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // 验证数据格式
        if (!row.fromCurrency || !row.toCurrency || !row.rate || !row.rateDate) {
          results.errors.push(`第 ${i + 1} 行：缺少必要字段`);
          continue;
        }

        if (isNaN(parseFloat(row.rate))) {
          results.errors.push(`第 ${i + 1} 行：汇率格式无效`);
          continue;
        }

        // 创建汇率记录
        await this.exchangeRateService.createExchangeRate({
          fromCurrency: row.fromCurrency.toUpperCase(),
          toCurrency: row.toCurrency.toUpperCase(),
          rate: parseFloat(row.rate),
          rateDate: row.rateDate,
          dataSource: 'import'
        });

        results.success++;
      } catch (error) {
        results.errors.push(`第 ${i + 1} 行：${error.message}`);
      }
    }

    logger.info(`Bulk import completed: ${results.success} success, ${results.errors.length} errors`);
    return results;
  }

  // 获取服务状态
  getStatus(): { isRunning: boolean; monitoredPairs: number } {
    return {
      isRunning: this.isRunning,
      monitoredPairs: this.monitoredPairs.length
    };
  }

  // 添加监控货币对
  addMonitoredPair(fromCurrency: string, toCurrency: string): void {
    const exists = this.monitoredPairs.some(pair => 
      pair.from === fromCurrency && pair.to === toCurrency
    );
    
    if (!exists) {
      this.monitoredPairs.push({ from: fromCurrency, to: toCurrency });
      logger.info(`Added monitored pair: ${fromCurrency}/${toCurrency}`);
    }
  }

  // 移除监控货币对
  removeMonitoredPair(fromCurrency: string, toCurrency: string): void {
    const index = this.monitoredPairs.findIndex(pair => 
      pair.from === fromCurrency && pair.to === toCurrency
    );
    
    if (index !== -1) {
      this.monitoredPairs.splice(index, 1);
      logger.info(`Removed monitored pair: ${fromCurrency}/${toCurrency}`);
    }
  }
}

// 导出单例实例
export const exchangeRateUpdateService = ExchangeRateUpdateService.getInstance();