/**
 * 富途证券数据源服务
 * 
 * 支持的金融产品:
 * - 股票 (港股、美股、A股)
 * - ETF
 * - 期权
 * - 期货
 * - 窝轮/牛熊证 (香港市场)
 * 
 * 市场覆盖:
 * - 香港市场 (HK): 股票、ETF、期权、期货、窝轮、牛熊证
 * - 美国市场 (US): 股票、ETF、期权、期货
 * - 中国市场 (CN): A股通股票、ETF
 * - 新加坡市场 (SG): 期货模拟交易
 * - 日本市场 (JP): 期货模拟交易
 */

import axios from 'axios';
import { databaseService } from './DatabaseService';

export interface FutuMarketInfo {
  code: string;
  name: string;
  country: string;
  timezone: string;
  tradingHours: {
    open: string;
    close: string;
  };
}

export interface FutuAssetType {
  code: string;
  name: string;
  futuType: string; // 富途内部的产品类型代码
  supportedMarkets: string[];
}

export interface FutuHistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount?: number;
  currency: string;
}

export interface FutuApiConfig {
  host: string;
  port: number;
  apiKey?: string;
  enableEncryption: boolean;
  timeout: number;
}

/**
 * 富途支持的资产类型映射
 */
export const FUTU_ASSET_TYPES: Record<string, FutuAssetType> = {
  STOCK: {
    code: 'STOCK',
    name: '股票',
    futuType: 'STOCK',
    supportedMarkets: ['HK', 'US', 'CN'],
  },
  ETF: {
    code: 'ETF',
    name: 'ETF基金',
    futuType: 'ETF',
    supportedMarkets: ['HK', 'US', 'CN'],
  },
  OPTION: {
    code: 'OPTION',
    name: '期权',
    futuType: 'OPTION',
    supportedMarkets: ['HK', 'US'],
  },
  FUTURE: {
    code: 'FUTURE',
    name: '期货',
    futuType: 'FUTURE',
    supportedMarkets: ['HK', 'US', 'SG', 'JP'],
  },
  WARRANT: {
    code: 'WARRANT',
    name: '窝轮',
    futuType: 'WARRANT',
    supportedMarkets: ['HK'],
  },
  CBBC: {
    code: 'CBBC',
    name: '牛熊证',
    futuType: 'CBBC',
    supportedMarkets: ['HK'],
  },
};

/**
 * 富途支持的市场信息
 */
export const FUTU_MARKETS: Record<string, FutuMarketInfo> = {
  HK: {
    code: 'HK',
    name: '香港市场',
    country: 'HK',
    timezone: 'Asia/Hong_Kong',
    tradingHours: {
      open: '09:30',
      close: '16:00',
    },
  },
  US: {
    code: 'US',
    name: '美国市场',
    country: 'US',
    timezone: 'America/New_York',
    tradingHours: {
      open: '09:30',
      close: '16:00',
    },
  },
  CN: {
    code: 'CN',
    name: '中国A股',
    country: 'CN',
    timezone: 'Asia/Shanghai',
    tradingHours: {
      open: '09:30',
      close: '15:00',
    },
  },
  SG: {
    code: 'SG',
    name: '新加坡市场',
    country: 'SG',
    timezone: 'Asia/Singapore',
    tradingHours: {
      open: '09:00',
      close: '17:00',
    },
  },
  JP: {
    code: 'JP',
    name: '日本市场',
    country: 'JP',
    timezone: 'Asia/Tokyo',
    tradingHours: {
      open: '09:00',
      close: '15:00',
    },
  },
};

export class FutuDataSourceService {
  private db = databaseService;
  private config: FutuApiConfig;
  private isConnected: boolean = false;

  constructor(config?: FutuApiConfig) {
    this.config = config || {
      host: process.env.FUTU_API_HOST || 'localhost',
      port: parseInt(process.env.FUTU_API_PORT || '11111'),
      apiKey: process.env.FUTU_API_KEY,
      enableEncryption: process.env.FUTU_ENABLE_ENCRYPTION === 'true',
      timeout: 30000,
    };
  }

  /**
   * 获取富途支持的产品类型列表
   */
  getSupportedAssetTypes(): FutuAssetType[] {
    return Object.values(FUTU_ASSET_TYPES);
  }

  /**
   * 获取富途支持的市场列表
   */
  getSupportedMarkets(): FutuMarketInfo[] {
    return Object.values(FUTU_MARKETS);
  }

  /**
   * 获取特定资产类型支持的市场
   */
  getMarketsForAssetType(assetTypeCode: string): FutuMarketInfo[] {
    const assetType = FUTU_ASSET_TYPES[assetTypeCode];
    if (!assetType) {
      return [];
    }

    return assetType.supportedMarkets.map(marketCode => FUTU_MARKETS[marketCode]).filter(Boolean);
  }

  /**
   * 将富途市场代码转换为股票代码格式
   * 例如: HK.00700 -> 00700, US.AAPL -> AAPL
   */
  private parseFutuSymbol(futuSymbol: string): { market: string; symbol: string } {
    const parts = futuSymbol.split('.');
    if (parts.length === 2) {
      return {
        market: parts[0],
        symbol: parts[1],
      };
    }
    return {
      market: 'US',
      symbol: futuSymbol,
    };
  }

  /**
   * 将系统资产转换为富途格式的股票代码
   * 基于资产的国家/市场信息生成富途格式代码
   */
  private async buildFutuSymbol(asset: any): Promise<string> {
    // 如果已经是富途格式(包含点号),直接返回
    if (asset.symbol.includes('.')) {
      return asset.symbol;
    }

    let marketCode = 'US'; // 默认美股

    // 从资产的国家信息获取市场代码
    if (asset.country_id) {
      const countryResult = await this.db.prisma.$queryRaw`
        SELECT code FROM finapp.countries WHERE id = ${asset.country_id}::uuid
      ` as any[];

      if (countryResult.length > 0) {
        const countryCode = countryResult[0].code;
        // 富途的市场代码与国家代码一致
        marketCode = countryCode;
      }
    }

    // 构建富途格式: MARKET.SYMBOL
    return `${marketCode}.${asset.symbol}`;
  }

  /**
   * 获取股票历史K线数据
   * 
   * @param symbol 富途格式的股票代码 (如 HK.00700, US.AAPL)
   * @param startDate 开始日期 (YYYY-MM-DD)
   * @param endDate 结束日期 (YYYY-MM-DD)
   * @param kType K线类型: K_DAY(日K), K_WEEK(周K), K_MON(月K), K_1M(1分钟), K_5M(5分钟) 等
   * @param rehab 复权类型: NONE(不复权), FORWARD(前复权), BACKWARD(后复权)
   */
  async getHistoricalKLine(
    symbol: string,
    startDate: string,
    endDate: string,
    kType: string = 'K_DAY',
    rehab: string = 'FORWARD'
  ): Promise<FutuHistoricalPrice[]> {
    try {
      console.log(`[Futu] Fetching historical K-line for ${symbol} from ${startDate} to ${endDate}`);

      // 注意：这里使用富途OpenAPI的HTTP接口
      // 实际使用时需要通过OpenD进程与富途服务器通信
      // 这里提供的是接口调用示例
      const response = await axios.post(
        `http://${this.config.host}:${this.config.port}/api/qot/request-history-kline`,
        {
          security: symbol,
          start: startDate,
          end: endDate,
          ktype: kType,
          rehab_type: rehab,
          max_ack_kline_num: 1000, // 最多返回1000条K线
        },
        {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ret !== 0) {
        throw new Error(`Futu API error: ${response.data.msg}`);
      }

      // 解析返回的K线数据
      const klines = response.data.data?.klList || [];
      
      return klines.map((kl: any) => ({
        date: kl.time.split(' ')[0], // 取日期部分
        open: parseFloat(kl.open),
        high: parseFloat(kl.high),
        low: parseFloat(kl.low),
        close: parseFloat(kl.close),
        volume: parseInt(kl.volume),
        amount: parseFloat(kl.turnover || 0),
        currency: this.getCurrencyByMarket(symbol.split('.')[0]),
      }));
    } catch (error) {
      console.error(`[Futu] Error fetching K-line for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 根据市场代码获取货币代码
   */
  private getCurrencyByMarket(marketCode: string): string {
    const currencyMap: Record<string, string> = {
      HK: 'HKD',
      US: 'USD',
      CN: 'CNY',
      SG: 'SGD',
      JP: 'JPY',
    };
    return currencyMap[marketCode] || 'USD';
  }

  /**
   * 获取股票实时报价
   */
  async getRealtimeQuote(symbol: string): Promise<{
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: string;
  } | null> {
    try {
      const response = await axios.post(
        `http://${this.config.host}:${this.config.port}/api/qot/get-stock-quote`,
        {
          security: symbol,
        },
        {
          timeout: this.config.timeout,
        }
      );

      if (response.data.ret !== 0) {
        throw new Error(`Futu API error: ${response.data.msg}`);
      }

      const quote = response.data.data;
      if (!quote) {
        return null;
      }

      return {
        symbol,
        price: parseFloat(quote.cur_price),
        change: parseFloat(quote.price_change),
        changePercent: parseFloat(quote.change_rate),
        volume: parseInt(quote.volume),
        timestamp: quote.update_time,
      };
    } catch (error) {
      console.error(`[Futu] Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * 批量同步资产历史价格到数据库
   * 
   * @param assetIds 资产ID列表
   * @param daysBack 回溯天数
   * @param overwrite 是否覆盖已存在的数据
   */
  async syncHistoricalPrices(
    assetIds: string[],
    daysBack: number = 365,
    overwrite: boolean = false
  ): Promise<{
    success: number;
    failed: number;
    errors: any[];
  }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    for (const assetId of assetIds) {
      try {
        // 获取资产信息
        const assetResult = await this.db.prisma.$queryRaw`
          SELECT id, symbol, name, asset_type_id, country_id, currency
          FROM finapp.assets
          WHERE id = ${assetId}::uuid AND is_active = true
        ` as any[];

        if (assetResult.length === 0) {
          result.failed++;
          result.errors.push({
            assetId,
            error: 'Asset not found or inactive',
          });
          continue;
        }

        const asset = assetResult[0];

        // 构建富途格式的股票代码
        const futuSymbol = await this.buildFutuSymbol(asset);
        console.log(`[Futu] Syncing ${asset.symbol} as ${futuSymbol}`);

        // 获取历史K线数据
        const prices = await this.getHistoricalKLine(
          futuSymbol,
          startDateStr,
          endDateStr,
          'K_DAY',
          'FORWARD'
        );

        console.log(`[Futu] Fetched ${prices.length} price records for ${futuSymbol}`);

        // 保存到数据库
        for (const price of prices) {
          try {
            if (overwrite) {
              // 使用 UPSERT
              await this.db.prisma.$queryRaw`
                INSERT INTO finapp.asset_prices (
                  asset_id, price_date, open_price, high_price, low_price,
                  close_price, volume, currency, data_source, price_source
                ) VALUES (
                  ${assetId}::uuid, ${price.date}::date, ${price.open},
                  ${price.high}, ${price.low}, ${price.close},
                  ${price.volume}, ${price.currency}, 'futu', 'FUTU_API'
                )
                ON CONFLICT (asset_id, price_date)
                DO UPDATE SET
                  open_price = EXCLUDED.open_price,
                  high_price = EXCLUDED.high_price,
                  low_price = EXCLUDED.low_price,
                  close_price = EXCLUDED.close_price,
                  volume = EXCLUDED.volume,
                  currency = EXCLUDED.currency,
                  data_source = EXCLUDED.data_source,
                  price_source = EXCLUDED.price_source,
                  updated_at = CURRENT_TIMESTAMP
              `;
            } else {
              // 只插入不存在的记录
              await this.db.prisma.$queryRaw`
                INSERT INTO finapp.asset_prices (
                  asset_id, price_date, open_price, high_price, low_price,
                  close_price, volume, currency, data_source, price_source
                ) VALUES (
                  ${assetId}::uuid, ${price.date}::date, ${price.open},
                  ${price.high}, ${price.low}, ${price.close},
                  ${price.volume}, ${price.currency}, 'futu', 'FUTU_API'
                )
                ON CONFLICT (asset_id, price_date) DO NOTHING
              `;
            }
          } catch (error) {
            console.error(`[Futu] Error saving price for ${asset.symbol} on ${price.date}:`, error);
          }
        }

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          assetId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`[Futu] Error syncing asset ${assetId}:`, error);
      }
    }

    return result;
  }

  /**
   * 测试富途API连接
   */
  async testConnection(): Promise<{
    connected: boolean;
    message: string;
    version?: string;
  }> {
    try {
      const response = await axios.post(
        `http://${this.config.host}:${this.config.port}/api/get-global-state`,
        {},
        {
          timeout: 5000,
        }
      );

      if (response.data.ret === 0) {
        this.isConnected = true;
        return {
          connected: true,
          message: 'Connected to Futu OpenD successfully',
          version: response.data.data?.server_ver,
        };
      } else {
        return {
          connected: false,
          message: `Connection failed: ${response.data.msg}`,
        };
      }
    } catch (error) {
      this.isConnected = false;
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Unknown connection error',
      };
    }
  }

  /**
   * 获取富途支持的股票列表
   * 
   * @param market 市场代码 (HK, US, CN 等)
   * @param stockType 股票类型 (STOCK, ETF, WARRANT 等)
   */
  async getStockList(market: string, stockType: string = 'STOCK'): Promise<any[]> {
    try {
      const response = await axios.post(
        `http://${this.config.host}:${this.config.port}/api/qot/get-plate-stock`,
        {
          plate: `${market}.${stockType}`,
        },
        {
          timeout: this.config.timeout,
        }
      );

      if (response.data.ret !== 0) {
        throw new Error(`Futu API error: ${response.data.msg}`);
      }

      return response.data.data?.staticInfoList || [];
    } catch (error) {
      console.error(`[Futu] Error fetching stock list for ${market}.${stockType}:`, error);
      return [];
    }
  }
}

// 导出单例
export const futuDataSourceService = new FutuDataSourceService();
