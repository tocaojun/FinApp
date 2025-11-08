import { databaseService } from './DatabaseService';
import axios from 'axios';
import * as cron from 'node-cron';

interface DataSource {
  id: string;
  name: string;
  provider: string;
  api_endpoint: string;
  api_key_encrypted?: string;
  config: any;
  rate_limit: number;
  timeout_seconds: number;
  is_active: boolean;
}

interface SyncTask {
  id: string;
  name: string;
  data_source_id: string;
  asset_type_id?: string;
  market_id?: string;
  asset_ids?: string[];
  schedule_type: 'manual' | 'cron' | 'interval';
  cron_expression?: string;
  interval_minutes?: number;
  sync_days_back: number;
  overwrite_existing: boolean;
  is_active: boolean;
}

interface SyncResult {
  success: boolean;
  total_assets: number;
  total_records: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  errors: any[];
  duration_seconds: number;
}

export class PriceSyncService {
  private db = databaseService;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    // db is already initialized
  }

  // ==================== 数据源管理 ====================

  async getDataSources(): Promise<DataSource[]> {
    const result = await this.db.prisma.$queryRaw`
      SELECT id, name, provider, api_endpoint, config, rate_limit, 
             timeout_seconds, is_active, last_sync_at, last_sync_status
      FROM finapp.price_data_sources
      WHERE is_active = true
      ORDER BY name
    ` as DataSource[];
    return result;
  }

  async getDataSource(id: string): Promise<DataSource | null> {
    const result = await this.db.prisma.$queryRaw`
      SELECT id, name, provider, api_endpoint, config, rate_limit, 
             timeout_seconds, is_active, last_sync_at, last_sync_status
      FROM finapp.price_data_sources
      WHERE id = ${id}::uuid
    ` as DataSource[];
    return result[0] || null;
  }

  /**
   * 获取数据源支持的产品类型和市场覆盖范围
   * 返回产品类型和对应的市场关联关系（级联过滤）
   */
  async getDataSourceCoverage(dataSourceId: string): Promise<{
    id: string;
    name: string;
    provider: string;
    productTypes: Array<{
      code: string;
      name: string;
    }>;
    marketsByProduct: Record<string, Array<{
      code: string;
      name: string;
    }>>;
  }> {
    // 获取数据源基本信息和配置
    const dataSource = await this.getDataSource(dataSourceId);
    if (!dataSource) {
      throw new Error('Data source not found');
    }

    // 解析配置中的支持产品类型
    const productTypes = Array.isArray(dataSource.config?.supports_products)
      ? dataSource.config.supports_products
      : [];

    // 获取支持的市场信息
    const marketCodes = Array.isArray(dataSource.config?.supports_markets)
      ? dataSource.config.supports_markets
      : [];

    // 查询市场的详细信息
    let markets: Array<{ code: string; name: string }> = [];
    if (marketCodes.length > 0) {
      try {
        const marketResults = await this.db.prisma.$queryRaw`
          SELECT code, name
          FROM finapp.markets
          WHERE code = ANY(${marketCodes}::text[])
          ORDER BY code
        ` as Array<{ code: string; name: string }>;
        markets = marketResults;
      } catch (error) {
        console.error('Failed to query markets:', error);
        // 如果查询失败，返回市场代码作为名称
        markets = marketCodes.map(code => ({ code, name: code }));
      }
    }

    // 获取产品类型的详细信息
    let productTypeDetails: Array<{ code: string; name: string }> = [];
    if (productTypes.length > 0) {
      try {
        const typeResults = await this.db.prisma.$queryRaw`
          SELECT id, code, name
          FROM finapp.asset_types
          WHERE code = ANY(${productTypes}::text[])
          ORDER BY code
        ` as Array<{ code: string; name: string }>;
        productTypeDetails = typeResults;
      } catch (error) {
        console.error('Failed to query asset types:', error);
        // 如果查询失败，返回代码作为名称
        productTypeDetails = productTypes.map(code => ({ code, name: code }));
      }
    }

    // 构建 marketsByProduct 映射
    // 当前实现中，每个产品类型都支持该数据源支持的所有市场
    // 可以通过扩展配置来支持更细粒度的控制
    const marketsByProduct: Record<string, Array<{ code: string; name: string }>> = {};
    productTypes.forEach(productCode => {
      marketsByProduct[productCode] = markets;
    });

    // 如果配置中有更细粒度的产品-市场映射，则使用它
    if (dataSource.config?.product_market_mapping) {
      const mapping = dataSource.config.product_market_mapping;
      Object.entries(mapping).forEach(([productCode, marketCodes]: [string, any]) => {
        if (Array.isArray(marketCodes)) {
          marketsByProduct[productCode] = markets.filter(m =>
            (marketCodes as string[]).includes(m.code)
          );
        }
      });
    }

    return {
      id: dataSource.id,
      name: dataSource.name,
      provider: dataSource.provider,
      productTypes: productTypeDetails,
      marketsByProduct,
    };
  }

  /**
   * 获取指定数据源和产品类型组合支持的市场
   * 用于级联过滤中的第三级过滤
   */
  async getMarketsByDataSourceAndAssetType(
    dataSourceId: string,
    assetTypeCode: string
  ): Promise<Array<{ id: string; code: string; name: string }>> {
    // 获取数据源覆盖范围
    const coverage = await this.getDataSourceCoverage(dataSourceId);

    // 获取该产品类型对应的市场
    const marketCodes = coverage.marketsByProduct[assetTypeCode] || [];

    // 补充完整的市场信息（包括 id）
    if (marketCodes.length > 0) {
      try {
        const results = await this.db.prisma.$queryRaw`
          SELECT id, code, name
          FROM finapp.markets
          WHERE code = ANY(${marketCodes.map(m => m.code)}::text[])
          ORDER BY code
        ` as Array<{ id: string; code: string; name: string }>;
        return results;
      } catch (error) {
        console.error('Failed to query markets:', error);
        return marketCodes.map((m, idx) => ({
          id: `${assetTypeCode}-${idx}`,
          code: m.code,
          name: m.name,
        }));
      }
    }

    return [];
  }

  async createDataSource(data: any): Promise<DataSource> {
    const configJson = JSON.stringify(data.config || {});
    const result = await this.db.prisma.$queryRaw`
      INSERT INTO finapp.price_data_sources (
        name, provider, api_endpoint, api_key_encrypted, config, 
        rate_limit, timeout_seconds, is_active
      ) VALUES (
        ${data.name}, ${data.provider}, ${data.api_endpoint || null},
        ${data.api_key || null}, ${configJson}::jsonb,
        ${data.rate_limit || 60}, ${data.timeout_seconds || 30}, 
        ${data.is_active !== false}
      )
      RETURNING *
    ` as DataSource[];
    return result[0];
  }

  async updateDataSource(id: string, data: any): Promise<DataSource> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.provider !== undefined) {
      updates.push(`provider = $${paramIndex++}`);
      values.push(data.provider);
    }
    if (data.api_endpoint !== undefined) {
      updates.push(`api_endpoint = $${paramIndex++}`);
      values.push(data.api_endpoint);
    }
    if (data.api_key !== undefined) {
      updates.push(`api_key_encrypted = $${paramIndex++}`);
      values.push(data.api_key);
    }
    if (data.config !== undefined) {
      updates.push(`config = $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(data.config));
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }

    values.push(id);
    const result = await this.db.prisma.$queryRawUnsafe(`
      UPDATE finapp.price_data_sources 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}::uuid
      RETURNING *
    `, ...values) as DataSource[];

    return result[0];
  }

  async deleteDataSource(id: string): Promise<boolean> {
    await this.db.prisma.$queryRaw`
      DELETE FROM finapp.price_data_sources WHERE id = ${id}::uuid
    `;
    return true;
  }

  // ==================== 同步任务管理 ====================

  async getSyncTasks(): Promise<SyncTask[]> {
    const result = await this.db.prisma.$queryRaw`
      SELECT t.*, ds.name as data_source_name, ds.provider
      FROM finapp.price_sync_tasks t
      LEFT JOIN finapp.price_data_sources ds ON t.data_source_id = ds.id
      ORDER BY t.created_at DESC
    ` as any[];
    return result;
  }

  async getSyncTask(id: string): Promise<SyncTask | null> {
    const result = await this.db.prisma.$queryRaw`
      SELECT t.*, ds.name as data_source_name, ds.provider
      FROM finapp.price_sync_tasks t
      LEFT JOIN finapp.price_data_sources ds ON t.data_source_id = ds.id
      WHERE t.id = ${id}::uuid
    ` as SyncTask[];
    return result[0] || null;
  }

  async createSyncTask(data: any): Promise<SyncTask> {
    // 处理asset_ids数组
    const assetIdsArray = data.asset_ids && Array.isArray(data.asset_ids) && data.asset_ids.length > 0
      ? `ARRAY[${data.asset_ids.map((id: string) => `'${id}'::uuid`).join(',')}]`
      : 'NULL';

    // 处理 asset_type_id：如果是代码（字符串且不是UUID格式），则查询获取UUID
    let assetTypeId = data.asset_type_id || null;
    if (assetTypeId && typeof assetTypeId === 'string' && !assetTypeId.includes('-')) {
      // 这是一个资产类型代码，需要转换为UUID
      const typeResult = await this.db.prisma.$queryRaw`
        SELECT id FROM finapp.asset_types WHERE code = ${assetTypeId}
      ` as any[];
      assetTypeId = typeResult && typeResult.length > 0 ? typeResult[0].id : null;
    }

    // 处理 market_id：如果是代码（字符串且不是UUID格式），则查询获取UUID
    let marketId = data.market_id || null;
    if (marketId && typeof marketId === 'string' && !marketId.includes('-')) {
      // 这是一个市场代码，需要转换为UUID
      const marketResult = await this.db.prisma.$queryRaw`
        SELECT id FROM finapp.markets WHERE code = ${marketId}
      ` as any[];
      marketId = marketResult && marketResult.length > 0 ? marketResult[0].id : null;
    }

    const result = await this.db.prisma.$queryRawUnsafe(`
      INSERT INTO finapp.price_sync_tasks (
        name, description, data_source_id, asset_type_id, market_id, 
        asset_ids, schedule_type, cron_expression, interval_minutes,
        sync_days_back, overwrite_existing, is_active
      ) VALUES (
        $1, $2, $3::uuid, $4::uuid, $5::uuid,
        ${assetIdsArray}, $6, $7, $8,
        $9, $10, $11
      )
      RETURNING *
    `,
      data.name,
      data.description || null,
      data.data_source_id,
      assetTypeId,
      marketId,
      data.schedule_type || 'manual',
      data.cron_expression || null,
      data.interval_minutes || null,
      data.sync_days_back || 1,
      data.overwrite_existing || false,
      data.is_active !== false
    ) as SyncTask[];

    // 如果是定时任务，启动调度
    const task = result[0];
    if (task && task.is_active && task.schedule_type !== 'manual') {
      await this.scheduleTask(task);
    }

    return task;
  }

  async updateSyncTask(id: string, data: any): Promise<SyncTask> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.data_source_id !== undefined) {
      updates.push(`data_source_id = $${paramIndex++}::uuid`);
      values.push(data.data_source_id);
    }
    if (data.asset_type_id !== undefined) {
      // 处理 asset_type_id：如果是代码（字符串且不是UUID格式），则查询获取UUID
      let assetTypeId = data.asset_type_id;
      if (assetTypeId && typeof assetTypeId === 'string' && !assetTypeId.includes('-')) {
        // 这是一个资产类型代码，需要转换为UUID
        const typeResult = await this.db.prisma.$queryRaw`
          SELECT id FROM finapp.asset_types WHERE code = ${assetTypeId}
        ` as any[];
        assetTypeId = typeResult && typeResult.length > 0 ? typeResult[0].id : null;
      }
      updates.push(`asset_type_id = $${paramIndex++}::uuid`);
      values.push(assetTypeId);
    }
    if (data.market_id !== undefined) {
      // 处理 market_id：如果是代码（字符串且不是UUID格式），则查询获取UUID
      let marketId = data.market_id;
      if (marketId && typeof marketId === 'string' && !marketId.includes('-')) {
        // 这是一个市场代码，需要转换为UUID
        const marketResult = await this.db.prisma.$queryRaw`
          SELECT id FROM finapp.markets WHERE code = ${marketId}
        ` as any[];
        marketId = marketResult && marketResult.length > 0 ? marketResult[0].id : null;
      }
      updates.push(`market_id = $${paramIndex++}::uuid`);
      values.push(marketId);
    }
    if (data.asset_ids !== undefined) {
      if (Array.isArray(data.asset_ids) && data.asset_ids.length > 0) {
        updates.push(`asset_ids = ARRAY[${data.asset_ids.map((id: string) => `'${id}'::uuid`).join(',')}]`);
      } else {
        updates.push(`asset_ids = NULL`);
      }
    }
    if (data.schedule_type !== undefined) {
      updates.push(`schedule_type = $${paramIndex++}`);
      values.push(data.schedule_type);
    }
    if (data.cron_expression !== undefined) {
      updates.push(`cron_expression = $${paramIndex++}`);
      values.push(data.cron_expression);
    }
    if (data.interval_minutes !== undefined) {
      updates.push(`interval_minutes = $${paramIndex++}`);
      values.push(data.interval_minutes);
    }
    if (data.sync_days_back !== undefined) {
      updates.push(`sync_days_back = $${paramIndex++}`);
      values.push(data.sync_days_back);
    }
    if (data.overwrite_existing !== undefined) {
      updates.push(`overwrite_existing = $${paramIndex++}`);
      values.push(data.overwrite_existing);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }

    values.push(id);
    const result = await this.db.prisma.$queryRawUnsafe(`
      UPDATE finapp.price_sync_tasks 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}::uuid
      RETURNING *
    `, ...values) as SyncTask[];

    // 重新调度任务
    const task = result[0];
    this.unscheduleTask(id);
    if (task && task.is_active && task.schedule_type !== 'manual') {
      await this.scheduleTask(task);
    }

    return task;
  }

  async deleteSyncTask(id: string): Promise<boolean> {
    this.unscheduleTask(id);
    await this.db.prisma.$queryRaw`
      DELETE FROM finapp.price_sync_tasks WHERE id = ${id}::uuid
    `;
    return true;
  }

  // ==================== 任务调度 ====================

  private async scheduleTask(task: SyncTask): Promise<void> {
    if (task.schedule_type === 'cron' && task.cron_expression) {
      // 使用 cron 表达式调度
      const cronTask = cron.schedule(task.cron_expression, async () => {
        console.log(`Running scheduled task: ${task.name}`);
        await this.executeSyncTask(task.id);
      });
      this.scheduledTasks.set(task.id, cronTask);
      console.log(`Scheduled cron task: ${task.name} with expression: ${task.cron_expression}`);
    } else if (task.schedule_type === 'interval' && task.interval_minutes) {
      // 使用间隔调度
      const intervalMs = task.interval_minutes * 60 * 1000;
      const intervalTask = setInterval(async () => {
        console.log(`Running interval task: ${task.name}`);
        await this.executeSyncTask(task.id);
      }, intervalMs);
      
      // 包装成 ScheduledTask 接口
      const wrappedTask = {
        start: () => {},
        stop: () => clearInterval(intervalTask),
      } as cron.ScheduledTask;
      
      this.scheduledTasks.set(task.id, wrappedTask);
      console.log(`Scheduled interval task: ${task.name} every ${task.interval_minutes} minutes`);
    }
  }

  private unscheduleTask(taskId: string): void {
    const task = this.scheduledTasks.get(taskId);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(taskId);
      console.log(`Unscheduled task: ${taskId}`);
    }
  }

  async initializeScheduledTasks(): Promise<void> {
    const tasks = await this.db.prisma.$queryRaw`
      SELECT * FROM finapp.price_sync_tasks
      WHERE is_active = true AND schedule_type != 'manual'
    ` as SyncTask[];

    for (const task of tasks) {
      await this.scheduleTask(task);
    }

    console.log(`Initialized ${tasks.length} scheduled tasks`);
  }

  // ==================== 同步执行 ====================

  async executeSyncTask(taskId: string): Promise<SyncResult> {
    console.log(`[PriceSync] Starting sync task: ${taskId}`);
    
    const task = await this.getSyncTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    console.log(`[PriceSync] Task found: ${task.name}`);

    const dataSource = await this.getDataSource(task.data_source_id);
    if (!dataSource || !dataSource.is_active) {
      throw new Error('Data source not found or inactive');
    }
    console.log(`[PriceSync] Data source: ${dataSource.name} (${dataSource.provider})`);

    // 创建同步日志
    const logResult = await this.db.prisma.$queryRaw`
      INSERT INTO finapp.price_sync_logs (task_id, data_source_id, status)
      VALUES (${taskId}::uuid, ${dataSource!.id}::uuid, 'running')
      RETURNING id
    ` as any[];
    const logId = logResult[0].id;
    console.log(`[PriceSync] Created sync log: ${logId}`);

    const startTime = Date.now();
    let result: SyncResult = {
      success: false,
      total_assets: 0,
      total_records: 0,
      success_count: 0,
      failed_count: 0,
      skipped_count: 0,
      errors: [],
      duration_seconds: 0,
    };

    try {
      // 更新任务状态
      await this.db.prisma.$queryRaw`
        UPDATE finapp.price_sync_tasks 
        SET last_run_at = CURRENT_TIMESTAMP, last_run_status = 'running'
        WHERE id = ${taskId}::uuid
      `;

      // 获取需要同步的资产列表
      const assets = await this.getAssetsForSync(task);
      result.total_assets = assets.length;
      console.log(`[PriceSync] Found ${assets.length} assets to sync`);

      if (assets.length === 0) {
        console.warn(`[PriceSync] No assets found for sync task ${task.name}`);
      }

      // 执行同步
      for (const asset of assets) {
        console.log(`[PriceSync] Processing asset: ${asset.symbol} (${asset.name})`);
        try {
          const prices = await this.fetchPricesFromSource(
            dataSource!,
            asset,
            task.sync_days_back
          );
          console.log(`[PriceSync] Fetched ${prices.length} price records for ${asset.symbol}`);

          for (const price of prices) {
            try {
              await this.savePriceData(asset.id, price, task.overwrite_existing);
              result.success_count++;
              result.total_records++;
            } catch (error) {
              console.error(`[PriceSync] Failed to save price for ${asset.symbol} on ${price.date}:`, error);
              result.failed_count++;
              result.errors.push({
                asset_id: asset.id,
                symbol: asset.symbol,
                date: price.date,
                error: error instanceof Error ? error.message : 'Unknown error',
              });

              // 记录错误
              await this.logSyncError(logId, asset.id, price.date, error);
            }
          }
        } catch (error) {
          console.error(`[PriceSync] Failed to fetch prices for ${asset.symbol}:`, error);
          result.failed_count++;
          result.errors.push({
            asset_id: asset.id,
            symbol: asset.symbol,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          await this.logSyncError(logId, asset.id, null, error);
        }
      }

      result.duration_seconds = Math.floor((Date.now() - startTime) / 1000);
      result.success = result.failed_count === 0;

      // 更新任务状态
      const status = result.success ? 'success' : (result.success_count > 0 ? 'partial' : 'failed');
      console.log(`[PriceSync] Sync completed with status: ${status}`);
      console.log(`[PriceSync] Results: ${result.total_assets} assets, ${result.total_records} records, ${result.success_count} success, ${result.failed_count} failed`);
      
      // 使用 $queryRawUnsafe 以便正确处理 JSONB 类型
      await this.db.prisma.$queryRawUnsafe(`
        UPDATE finapp.price_sync_tasks 
        SET last_run_status = $1,
            last_run_result = $2::jsonb
        WHERE id = $3::uuid
      `, status, JSON.stringify(result), taskId);

      // 更新日志（注意：表中没有 duration_seconds 和 sync_result 字段）
      await this.db.prisma.$queryRawUnsafe(`
        UPDATE finapp.price_sync_logs 
        SET completed_at = CURRENT_TIMESTAMP,
            status = $1,
            total_assets = $2,
            total_records = $3,
            success_count = $4,
            failed_count = $5,
            skipped_count = $6,
            result_summary = $7::jsonb
        WHERE id = $8::uuid
      `, status, result.total_assets, result.total_records, 
         result.success_count, result.failed_count, result.skipped_count,
         JSON.stringify(result), logId);

      // 更新数据源状态
      await this.db.prisma.$queryRaw`
        UPDATE finapp.price_data_sources
        SET last_sync_at = CURRENT_TIMESTAMP,
            last_sync_status = ${status}
        WHERE id = ${dataSource!.id}::uuid
      `;

    } catch (error) {
      console.error(`[PriceSync] Sync task failed with error:`, error);
      result.success = false;
      result.duration_seconds = Math.floor((Date.now() - startTime) / 1000);

      // 更新失败状态
      await this.db.prisma.$queryRaw`
        UPDATE finapp.price_sync_tasks 
        SET last_run_status = 'failed'
        WHERE id = ${taskId}::uuid
      `;

      // 更新日志（注意：表中没有 duration_seconds 字段）
      await this.db.prisma.$queryRawUnsafe(`
        UPDATE finapp.price_sync_logs 
        SET completed_at = CURRENT_TIMESTAMP,
            status = 'failed',
            error_message = $1
        WHERE id = $2::uuid
      `, error instanceof Error ? error.message : 'Unknown error', logId);

      throw error;
    }

    return result;
  }

  private async getAssetsForSync(task: SyncTask): Promise<any[]> {
    let whereConditions: string[] = ['is_active = true'];
    
    if (task.asset_type_id) {
      whereConditions.push(`asset_type_id = '${task.asset_type_id}'`);
    }
    if (task.market_id) {
      whereConditions.push(`market_id = '${task.market_id}'`);
    }
    if (task.asset_ids && task.asset_ids.length > 0) {
      const ids = task.asset_ids.map(id => `'${id}'`).join(',');
      whereConditions.push(`id IN (${ids})`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const assets = await this.db.prisma.$queryRawUnsafe(`
      SELECT id, symbol, name, asset_type_id, market_id, currency
      FROM finapp.assets
      ${whereClause}
      ORDER BY symbol
    `) as any[];

    return assets;
  }

  private async fetchPricesFromSource(
    dataSource: DataSource,
    asset: any,
    daysBack: number
  ): Promise<any[]> {
    // 根据不同的数据源提供商调用不同的API
    switch (dataSource.provider) {
      case 'yahoo_finance':
        return await this.fetchFromYahooFinance(asset, daysBack);
      case 'eastmoney':
        return await this.fetchFromEastMoney(asset, daysBack);
      case 'tushare':
        return await this.fetchFromTushare(dataSource, asset, daysBack);
      case 'sina':
        return await this.fetchFromSina(asset, daysBack);
      default:
        throw new Error(`Unsupported provider: ${dataSource.provider}`);
    }
  }

  private async fetchFromYahooFinance(asset: any, daysBack: number): Promise<any[]> {
    // Yahoo Finance API 实现
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);

    // 根据市场添加后缀
    let yahooSymbol = asset.symbol;
    
    // 获取市场信息
    if (asset.market_id) {
      const marketResult = await this.db.prisma.$queryRaw`
        SELECT code FROM finapp.markets WHERE id = ${asset.market_id}::uuid
      ` as any[];
      
      if (marketResult.length > 0) {
        const marketCode = marketResult[0].code;
        
        // 根据市场代码添加后缀
        switch (marketCode) {
          case 'HKEX':
            // 港股：处理前导零
            // 规则：如果是5位数字且以0开头，去掉第一个0
            // 00700 -> 0700, 03690 -> 3690, 09618 -> 9618
            let hkSymbol = asset.symbol;
            if (hkSymbol.length === 5 && hkSymbol.startsWith('0')) {
              hkSymbol = hkSymbol.substring(1);
            }
            yahooSymbol = `${hkSymbol}.HK`;
            break;
          case 'SSE':
            yahooSymbol = `${asset.symbol}.SS`;
            break;
          case 'SZSE':
            yahooSymbol = `${asset.symbol}.SZ`;
            break;
          case 'TSE':
            yahooSymbol = `${asset.symbol}.T`;
            break;
          case 'LSE':
            yahooSymbol = `${asset.symbol}.L`;
            break;
          case 'FWB':
            yahooSymbol = `${asset.symbol}.F`;
            break;
          // NYSE 和 NASDAQ 通常不需要后缀
          default:
            yahooSymbol = asset.symbol;
        }
      }
    }

    console.log(`Fetching Yahoo Finance data for ${asset.symbol} (Yahoo symbol: ${yahooSymbol})`);

    try {
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
        {
          params: {
            period1,
            period2,
            interval: '1d',
          },
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }
      );

      // 检查响应数据
      if (!response.data || !response.data.chart || !response.data.chart.result || response.data.chart.result.length === 0) {
        console.warn(`No data returned from Yahoo Finance for ${yahooSymbol}`);
        return [];
      }

      const chart = response.data.chart.result[0];
      
      if (!chart.timestamp || !chart.indicators || !chart.indicators.quote || chart.indicators.quote.length === 0) {
        console.warn(`Invalid data structure from Yahoo Finance for ${yahooSymbol}`);
        console.warn(`Chart data:`, JSON.stringify({
          hasTimestamp: !!chart.timestamp,
          timestampLength: chart.timestamp?.length,
          hasIndicators: !!chart.indicators,
          hasQuote: !!chart.indicators?.quote,
          quoteLength: chart.indicators?.quote?.length,
        }));
        return [];
      }

      const timestamps = chart.timestamp;
      const quotes = chart.indicators.quote[0];

      const prices = timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index],
        currency: asset.currency || 'USD', // 使用资产的货币
      }));

      const validPrices = prices.filter(p => p.close !== null);
      console.log(`Fetched ${validPrices.length} price records for ${yahooSymbol}`);
      return validPrices;
    } catch (error: any) {
      const errorMsg = error.response?.data?.chart?.error?.description || error.message || 'Unknown error';
      const statusCode = error.response?.status;
      const responseText = error.response?.data;
      
      console.error(`Error fetching from Yahoo Finance for ${yahooSymbol}:`, {
        status: statusCode,
        message: errorMsg,
        response: typeof responseText === 'string' ? responseText.substring(0, 200) : responseText,
      });
      
      // 处理限流错误
      if (statusCode === 429 || (typeof responseText === 'string' && responseText.includes('Too Many Requests'))) {
        throw new Error(`Rate limit exceeded for ${yahooSymbol}. Yahoo Finance API is temporarily unavailable. Please try again later.`);
      }
      
      // 如果是404或symbol not found，返回空数组而不是抛出错误
      if (statusCode === 404 || errorMsg.includes('No data found')) {
        console.warn(`Symbol ${yahooSymbol} not found in Yahoo Finance`);
        return [];
      }
      
      throw new Error(`Yahoo Finance API error for ${yahooSymbol}: ${errorMsg}`);
    }
  }

  private async fetchFromEastMoney(asset: any, daysBack: number): Promise<any[]> {
    // 东方财富 API 实现（示例）
    try {
      const response = await axios.get(
        'http://push2.eastmoney.com/api/qt/stock/kline/get',
        {
          params: {
            secid: asset.symbol,
            fields1: 'f1,f2,f3,f4,f5',
            fields2: 'f51,f52,f53,f54,f55,f56,f57',
            klt: 101, // 日K
            fqt: 1, // 前复权
            lmt: daysBack,
          },
          timeout: 30000,
        }
      );

      const klines = response.data.data.klines;
      return klines.map((kline: string) => {
        const [date, open, close, high, low, volume] = kline.split(',');
        return {
          date: date || '',
          open: parseFloat(open || '0'),
          high: parseFloat(high || '0'),
          low: parseFloat(low || '0'),
          close: parseFloat(close || '0'),
          volume: parseInt(volume || '0'),
          currency: asset.currency || 'CNY',
        };
      });
    } catch (error) {
      console.error(`Error fetching from EastMoney for ${asset.symbol}:`, error);
      throw error;
    }
  }

  private async fetchFromTushare(
    dataSource: DataSource,
    asset: any,
    daysBack: number
  ): Promise<any[]> {
    // Tushare API 实现（需要 API token）
    if (!dataSource.api_key_encrypted) {
      throw new Error('Tushare API key not configured');
    }

    const endDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');

    try {
      const response = await axios.post(
        'http://api.tushare.pro',
        {
          api_name: 'daily',
          token: dataSource.api_key_encrypted,
          params: {
            ts_code: asset.symbol,
            start_date: startDateStr,
            end_date: endDate,
          },
          fields: 'trade_date,open,high,low,close,vol',
        },
        { timeout: 30000 }
      );

      const items = response.data?.data?.items || [];
      return items.map((item: any[]) => ({
        date: (item[0] || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        open: item[1] || 0,
        high: item[2] || 0,
        low: item[3] || 0,
        close: item[4] || 0,
        volume: item[5] || 0,
        currency: asset.currency || 'CNY',
      }));
    } catch (error) {
      console.error(`Error fetching from Tushare for ${asset.symbol}:`, error);
      throw error;
    }
  }

  private async fetchFromSina(asset: any, daysBack: number): Promise<any[]> {
    // 新浪财经数据源 - 由于Sina本身不提供历史数据API，我们使用Yahoo Finance作为替代方案
    // 这样可以获取中国股票的历史价格数据
    console.log(`[Sina] Using Yahoo Finance as fallback for ${asset.symbol} to get historical data`);
    return await this.fetchFromYahooFinance(asset, daysBack);
  }

  private async savePriceData(
    assetId: string,
    price: any,
    overwrite: boolean
  ): Promise<void> {
    if (overwrite) {
      // 使用 UPSERT
      await this.db.prisma.$queryRaw`
        INSERT INTO finapp.asset_prices (
          asset_id, price_date, open_price, high_price, low_price, 
          close_price, volume, currency, data_source
        ) VALUES (
          ${assetId}::uuid, ${price.date}::date, ${price.open || null},
          ${price.high || null}, ${price.low || null}, ${price.close},
          ${price.volume || null}, ${price.currency || 'USD'}, 'api'
        )
        ON CONFLICT (asset_id, price_date) 
        DO UPDATE SET
          open_price = EXCLUDED.open_price,
          high_price = EXCLUDED.high_price,
          low_price = EXCLUDED.low_price,
          close_price = EXCLUDED.close_price,
          volume = EXCLUDED.volume,
          currency = EXCLUDED.currency,
          data_source = EXCLUDED.data_source
      `;
    } else {
      // 只插入不存在的记录
      await this.db.prisma.$queryRaw`
        INSERT INTO finapp.asset_prices (
          asset_id, price_date, open_price, high_price, low_price, 
          close_price, volume, currency, data_source
        ) VALUES (
          ${assetId}::uuid, ${price.date}::date, ${price.open || null},
          ${price.high || null}, ${price.low || null}, ${price.close},
          ${price.volume || null}, ${price.currency || 'USD'}, 'api'
        )
        ON CONFLICT (asset_id, price_date) DO NOTHING
      `;
    }
  }

  private async logSyncError(
    logId: string,
    assetId: string,
    priceDate: string | null,
    error: any
  ): Promise<void> {
    const errorType = this.categorizeError(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 获取资产symbol用于错误记录
    let assetSymbol = null;
    try {
      const assetResult = await this.db.prisma.$queryRaw`
        SELECT symbol FROM finapp.assets WHERE id = ${assetId}::uuid
      ` as any[];
      if (assetResult.length > 0) {
        assetSymbol = assetResult[0].symbol;
      }
    } catch (e) {
      console.error('Failed to get asset symbol:', e);
    }

    // 构建错误详情，包含price_date信息
    const errorDetails = priceDate ? { price_date: priceDate } : null;

    await this.db.prisma.$queryRawUnsafe(`
      INSERT INTO finapp.price_sync_errors (
        log_id, asset_id, asset_symbol, error_type, error_message, error_details
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4, $5, $6::jsonb
      )
    `, logId, assetId, assetSymbol, errorType, errorMessage, errorDetails ? JSON.stringify(errorDetails) : null);
  }

  private categorizeError(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return 'network';
      }
      if (error.response?.status === 429) {
        return 'api_limit';
      }
      return 'network';
    }
    
    // 检查是否是解析错误
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('parse') || errorMsg.includes('JSON') || errorMsg.includes('Invalid')) {
      return 'parse';
    }
    
    // 检查是否是验证错误
    if (errorMsg.includes('validation') || errorMsg.includes('required') || errorMsg.includes('invalid')) {
      return 'validation';
    }
    
    return 'other';
  }

  // ==================== 同步日志查询 ====================

  async getSyncLogs(taskId?: string, limit: number = 50): Promise<any[]> {
    const whereClause = taskId ? `WHERE task_id = '${taskId}'::uuid` : '';
    
    const logs = await this.db.prisma.$queryRawUnsafe(`
      SELECT l.*, t.name as task_name, ds.name as data_source_name
      FROM finapp.price_sync_logs l
      LEFT JOIN finapp.price_sync_tasks t ON l.task_id = t.id
      LEFT JOIN finapp.price_data_sources ds ON l.data_source_id = ds.id
      ${whereClause}
      ORDER BY l.started_at DESC
      LIMIT ${limit}
    `) as any[];

    return logs;
  }

  async getSyncLog(logId: string): Promise<any> {
    const result = await this.db.prisma.$queryRaw`
      SELECT l.*, t.name as task_name, ds.name as data_source_name
      FROM finapp.price_sync_logs l
      LEFT JOIN finapp.price_sync_tasks t ON l.task_id = t.id
      LEFT JOIN finapp.price_data_sources ds ON l.data_source_id = ds.id
      WHERE l.id = ${logId}::uuid
    ` as any[];

    if (result.length === 0) return null;

    const log = result[0];

    // 获取错误详情
    const errors = await this.db.prisma.$queryRaw`
      SELECT e.*, a.symbol, a.name as asset_name
      FROM finapp.price_sync_errors e
      LEFT JOIN finapp.assets a ON e.asset_id = a.id
      WHERE e.log_id = ${logId}::uuid
      ORDER BY e.created_at
    ` as any[];

    log.errors = errors;
    return log;
  }
}
