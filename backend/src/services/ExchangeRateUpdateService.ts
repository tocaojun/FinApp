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

  // 监控的主要货币对
  private monitoredPairs = [
    { from: 'USD', to: 'CNY' },
    { from: 'EUR', to: 'USD' },
    { from: 'GBP', to: 'USD' },
    { from: 'JPY', to: 'USD' },
    { from: 'USD', to: 'HKD' },
    { from: 'USD', to: 'SGD' },
    { from: 'AUD', to: 'USD' },
    { from: 'CAD', to: 'USD' },
    { from: 'CHF', to: 'USD' },
    { from: 'SEK', to: 'USD' },
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

  // 导入历史汇率数据
  async importHistoricalRates(years: number = 10): Promise<{
    success: boolean;
    totalDays: number;
    successCount: number;
    errorCount: number;
    message: string;
  }> {
    logger.info(`Starting historical exchange rate import for the past ${years} years...`);
    
    let successCount = 0;
    let errorCount = 0;
    const totalDays = years * 365;
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - years);
      
      // 按月份批量导入，避免API限制
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        try {
          // 使用 Frankfurter API 的历史数据端点（免费，支持历史数据）
          const url = `https://api.frankfurter.app/${dateStr}?base=USD`;
          
          const response = await axios.get(url, {
            timeout: 10000,
            headers: {
              'User-Agent': 'FinApp/1.0'
            }
          });
          
          if (response.data && response.data.rates) {
            const rates = response.data.rates;
            
            // 只导入监控的货币对
            for (const pair of this.monitoredPairs) {
              if (pair.from === 'USD' && rates[pair.to]) {
                try {
                  await this.exchangeRateService.createExchangeRate({
                    fromCurrency: 'USD',
                    toCurrency: pair.to,
                    rate: rates[pair.to],
                    rateDate: dateStr,
                    dataSource: 'historical_import'
                  });
                  successCount++;
                } catch (error) {
                  // 忽略重复数据错误
                  if (!error.message?.includes('duplicate') && !error.message?.includes('unique')) {
                    errorCount++;
                  }
                }
              }
            }
            
            // 处理反向货币对（如 EUR/USD）
            for (const pair of this.monitoredPairs) {
              if (pair.to === 'USD' && rates[pair.from]) {
                try {
                  await this.exchangeRateService.createExchangeRate({
                    fromCurrency: pair.from,
                    toCurrency: 'USD',
                    rate: rates[pair.from],
                    rateDate: dateStr,
                    dataSource: 'historical_import'
                  });
                  successCount++;
                } catch (error) {
                  if (!error.message?.includes('duplicate') && !error.message?.includes('unique')) {
                    errorCount++;
                  }
                }
              }
            }
          }
          
          // 每导入30天的数据，暂停1秒，避免API限制
          if (currentDate.getDate() === 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            logger.info(`Historical import progress: ${dateStr}, Success: ${successCount}, Errors: ${errorCount}`);
          }
          
        } catch (error) {
          errorCount++;
          if (errorCount % 100 === 0) {
            logger.warn(`Historical import error at ${dateStr}:`, error.message);
          }
        }
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const message = `Historical import completed. Success: ${successCount}, Errors: ${errorCount}`;
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

  // 手动触发更新所有汇率
  async updateAllRates(): Promise<void> {
    logger.info('Starting exchange rate update...');
    
    try {
      const results = await Promise.allSettled(
        this.providers.map(provider => this.updateFromProvider(provider))
      );

      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount += result.value;
        } else {
          errorCount++;
          logger.error(`Provider ${this.providers[index].name} failed:`, result.reason);
        }
      });

      logger.info(`Exchange rate update completed. Success: ${successCount}, Errors: ${errorCount}`);

      // 发送更新通知
      await this.sendUpdateNotification(successCount, errorCount);

    } catch (error) {
      logger.error('Exchange rate update failed:', error);
      throw error;
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

      // 添加API密钥（如果需要）
      if (provider.apiKey) {
        if (provider.name === 'fixer.io') {
          config.params = { access_key: provider.apiKey };
        } else if (provider.name === 'currencylayer.com') {
          config.params = { access_key: provider.apiKey };
        }
      }

      const response = await axios.get(provider.url, config);
      
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