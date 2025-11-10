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
  country_id?: string;
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
      id: string;
      code: string;
      name: string;
    }>;
    countriesByProduct: Record<string, Array<{
      id: string;
      code: string;
      name: string;
    }>>;
  }> {
    console.log(`[Coverage] Getting coverage for data source: ${dataSourceId}`);
    
    // 获取数据源基本信息和配置
    const dataSource = await this.getDataSource(dataSourceId);
    if (!dataSource) {
      console.error(`[Coverage] Data source not found: ${dataSourceId}`);
      throw new Error('Data source not found');
    }

    console.log(`[Coverage] Found data source:`, { name: dataSource.name, config: dataSource.config });

    // 解析配置中的支持产品类型
    const productTypes = Array.isArray(dataSource.config?.supports_products)
      ? dataSource.config.supports_products
      : [];

    // 获取支持的国家信息（优先使用 supports_countries，如果没有则尝试 supports_markets）
    let countryCodes = Array.isArray(dataSource.config?.supports_countries)
      ? dataSource.config.supports_countries
      : [];
    
    console.log(`[Coverage] Parsed config:`, { productTypes, countryCodes });

    // 如果没有配置国家，尝试从市场配置转换
    if (countryCodes.length === 0) {
      const marketCodes = Array.isArray(dataSource.config?.supports_markets)
        ? dataSource.config.supports_markets
        : [];
      // 可以在这里添加市场到国家的映射逻辑
    }

    // 查询国家的详细信息
    let countries: Array<{ id: string; code: string; name: string }> = [];
    if (countryCodes.length > 0) {
      try {
        const countryResults = await this.db.prisma.$queryRawUnsafe(`
          SELECT id, code, name
          FROM finapp.countries
          WHERE code = ANY($1::text[])
          ORDER BY code
        `, countryCodes) as Array<{ id: string; code: string; name: string }>;
        countries = countryResults;
      } catch (error) {
        console.error('Failed to query countries:', error);
        // 如果查询失败，返回国家代码作为名称
        countries = countryCodes.map((code, idx) => ({ 
          id: `tmp-country-${idx}`, 
          code, 
          name: code 
        }));
      }
    }

    // 获取产品类型的详细信息
    let productTypeDetails: Array<{ id: string; code: string; name: string }> = [];
    if (productTypes.length > 0) {
      try {
        const typeResults = await this.db.prisma.$queryRawUnsafe(`
          SELECT id, code, name
          FROM finapp.asset_types
          WHERE code = ANY($1::text[])
          ORDER BY code
        `, productTypes) as Array<{ id: string; code: string; name: string }>;
        productTypeDetails = typeResults;
      } catch (error) {
        console.error('Failed to query asset types:', error);
        // 如果查询失败，返回代码作为名称（生成临时ID）
        productTypeDetails = productTypes.map((code, idx) => ({ id: `tmp-type-${idx}`, code, name: code }));
      }
    }

    // 构建 countriesByProduct 映射
    // 当前实现中，每个产品类型都支持该数据源支持的所有国家
    // 可以通过扩展配置来支持更细粒度的控制
    const countriesByProduct: Record<string, Array<{ id: string; code: string; name: string }>> = {};
    
    if (productTypes.length > 0) {
      productTypes.forEach(productCode => {
        countriesByProduct[productCode] = countries;
      });

      // 如果配置中有更细粒度的产品-国家映射，则使用它
      if (dataSource.config?.product_country_mapping) {
        const mapping = dataSource.config.product_country_mapping;
        Object.entries(mapping).forEach(([productCode, countryCodes]: [string, any]) => {
          if (Array.isArray(countryCodes)) {
            countriesByProduct[productCode] = countries.filter(c =>
              (countryCodes as string[]).includes(c.code)
            );
          }
        });
      }
    } else {
      // 如果没有产品类型，仍然需要返回国家列表供前端使用
      // 使用空的 productTypes，但在 countriesByProduct 中存储所有国家
      // 前端会自动处理这种情况
      if (countries.length > 0) {
        countriesByProduct['_all'] = countries;
      }
    }

    console.log(`[Coverage] DataSource: ${dataSource.name}, ProductTypes: ${productTypes.join(',') || 'none'}, Countries: ${countries.map(c => c.code).join(',')}`);

    return {
      id: dataSource.id,
      name: dataSource.name,
      provider: dataSource.provider,
      productTypes: productTypeDetails,
      countriesByProduct,
    };
  }

  /**
   * 获取指定数据源和产品类型组合支持的市场
   * 用于级联过滤中的第三级过滤
   * @deprecated 市场维度已移除，改用国家维度。使用 getCountriesByDataSourceAndAssetType 替代
   */
  async getMarketsByDataSourceAndAssetType(
    dataSourceId: string,
    assetTypeCode: string
  ): Promise<Array<{ id: string; code: string; name: string }>> {
    console.warn('getMarketsByDataSourceAndAssetType is deprecated. Use getCountriesByDataSourceAndAssetType instead.');
    return [];
  }

  /**
   * 获取指定数据源和产品类型组合支持的国家
   * 用于国家维度的资产（国债、理财、基金等）
   */
  async getCountriesByDataSourceAndAssetType(
    dataSourceId: string,
    assetTypeCode: string
  ): Promise<Array<{ id: string; code: string; name: string }>> {
    // 获取数据源基本信息和配置
    const dataSource = await this.getDataSource(dataSourceId);
    if (!dataSource) {
      throw new Error('Data source not found');
    }

    // 获取支持的国家列表
    const countryCodes = Array.isArray(dataSource.config?.supports_countries)
      ? dataSource.config.supports_countries
      : [];

    if (countryCodes.length === 0) {
      return [];
    }

    // 查询国家的详细信息
    try {
      const results = await this.db.prisma.$queryRaw`
        SELECT id, code, name
        FROM finapp.countries
        WHERE code = ANY(${countryCodes}::text[])
        ORDER BY code
      ` as Array<{ id: string; code: string; name: string }>;
      return results;
    } catch (error) {
      console.error('Failed to query countries:', error);
      return countryCodes.map((code, idx) => ({
        id: `${assetTypeCode}-country-${idx}`,
        code,
        name: code,
      }));
    }
  }

  /**
   * 获取资产类型的位置维度信息
   * 判断该资产类型是绑定市场、国家还是全球
   */
  async getAssetTypeLocationDimension(assetTypeCode: string): Promise<'market' | 'country' | 'global'> {
    try {
      const result = await this.db.prisma.$queryRaw`
        SELECT location_dimension
        FROM finapp.asset_types
        WHERE code = ${assetTypeCode}
      ` as Array<{ location_dimension: string }>;
      
      if (result && result.length > 0) {
        return (result[0].location_dimension || 'market') as 'market' | 'country' | 'global';
      }
      return 'market'; // 默认为市场维度
    } catch (error) {
      console.error('Failed to query asset type location dimension:', error);
      return 'market';
    }
  }

  /**
   * 获取数据源的完整覆盖范围信息（支持市场和国家维度）
   */
  async getDataSourceFullCoverage(dataSourceId: string): Promise<{
    id: string;
    name: string;
    provider: string;
    supportedMarkets: Array<{ code: string; name: string }>;
    supportedCountries: Array<{ code: string; name: string }>;
    productTypesCoverage: Array<{
      code: string;
      name: string;
      locationDimension: string;
      coverage: Array<{ code: string; name: string }>;
    }>;
  }> {
    const dataSource = await this.getDataSource(dataSourceId);
    if (!dataSource) {
      throw new Error('Data source not found');
    }

    // 获取市场列表
    const marketCodes = Array.isArray(dataSource.config?.supports_markets)
      ? dataSource.config.supports_markets
      : [];
    
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
        markets = marketCodes.map(code => ({ code, name: code }));
      }
    }

    // 获取国家列表
    const countryCodes = Array.isArray(dataSource.config?.supports_countries)
      ? dataSource.config.supports_countries
      : [];
    
    let countries: Array<{ code: string; name: string }> = [];
    if (countryCodes.length > 0) {
      try {
        const countryResults = await this.db.prisma.$queryRaw`
          SELECT code, name
          FROM finapp.countries
          WHERE code = ANY(${countryCodes}::text[])
          ORDER BY code
        ` as Array<{ code: string; name: string }>;
        countries = countryResults;
      } catch (error) {
        console.error('Failed to query countries:', error);
        countries = countryCodes.map(code => ({ code, name: code }));
      }
    }

    // 获取产品类型及其覆盖范围
    const productTypes = Array.isArray(dataSource.config?.supports_products)
      ? dataSource.config.supports_products
      : [];
    
    const productTypesCoverage: Array<{
      code: string;
      name: string;
      locationDimension: string;
      coverage: Array<{ code: string; name: string }>;
    }> = [];

    if (productTypes.length > 0) {
      try {
        const typeResults = await this.db.prisma.$queryRaw`
          SELECT code, name, location_dimension
          FROM finapp.asset_types
          WHERE code = ANY(${productTypes}::text[])
          ORDER BY code
        ` as Array<{ code: string; name: string; location_dimension: string }>;

        for (const type of typeResults) {
          let coverage: Array<{ code: string; name: string }> = [];
          if (type.location_dimension === 'market') {
            coverage = markets;
          } else if (type.location_dimension === 'country') {
            coverage = countries;
          }
          // 如果是 global，coverage 保持为空数组

          productTypesCoverage.push({
            code: type.code,
            name: type.name,
            locationDimension: type.location_dimension,
            coverage,
          });
        }
      } catch (error) {
        console.error('Failed to query asset types:', error);
        productTypes.forEach((code, idx) => {
          productTypesCoverage.push({
            code,
            name: code,
            locationDimension: 'market',
            coverage: markets,
          });
        });
      }
    }

    return {
      id: dataSource.id,
      name: dataSource.name,
      provider: dataSource.provider,
      supportedMarkets: markets,
      supportedCountries: countries,
      productTypesCoverage,
    };
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
    // 处理 asset_ids 数组：过滤并验证
    let assetIds: string[] | null = null;
    if (data.asset_ids && Array.isArray(data.asset_ids) && data.asset_ids.length > 0) {
      const validIds = data.asset_ids.filter((id: string) => id && id.trim());
      if (validIds.length > 0) {
        assetIds = validIds.map(id => id.trim());
      }
    }

    // 处理 asset_type_id：确保是单个UUID值
    let assetTypeId = data.asset_type_id || null;
    if (assetTypeId && typeof assetTypeId === 'string' && !assetTypeId.includes('-')) {
      // 这是一个资产类型代码，需要转换为UUID
      const typeResult = await this.db.prisma.$queryRaw`
        SELECT id FROM finapp.asset_types WHERE code = ${assetTypeId}
      ` as any[];
      assetTypeId = typeResult && typeResult.length > 0 ? typeResult[0].id : null;
    }

    // 处理 country_id：确保是单个UUID值
    let countryId = data.country_id || null;
    if (countryId && typeof countryId === 'string') {
      if (!countryId.includes('-')) {
        // 这是一个国家代码，需要转换为UUID
        const countryResult = await this.db.prisma.$queryRaw`
          SELECT id FROM finapp.countries WHERE code = ${countryId}
        ` as any[];
        countryId = countryResult && countryResult.length > 0 ? countryResult[0].id : null;
      } else {
        // 这是一个UUID格式，验证它是否存在于countries表中
        const countryCheck = await this.db.prisma.$queryRaw`
          SELECT id FROM finapp.countries WHERE id = ${countryId}::uuid
        ` as any[];
        if (!countryCheck || countryCheck.length === 0) {
          console.warn(`[CreateSyncTask] Country UUID not found: ${countryId}`);
          countryId = null;
        }
      }
    }

    const result = await this.db.prisma.$queryRawUnsafe(`
      INSERT INTO finapp.price_sync_tasks (
        name, description, data_source_id, asset_type_id, country_id, 
        asset_ids, schedule_type, cron_expression, interval_minutes,
        sync_days_back, overwrite_existing, is_active
      ) VALUES (
        $1, $2, $3::uuid, $4::uuid, $5::uuid,
        $6::uuid[], $7, $8, $9,
        $10, $11, $12
      )
      RETURNING *
    `,
      data.name,
      data.description || null,
      data.data_source_id,
      assetTypeId,
      countryId,
      assetIds,
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
    console.log(`[UpdateSyncTask] Input data:`, {
      asset_type_id: data.asset_type_id,
      country_id: data.country_id,
    });

    // 处理 asset_type_id：确保是单个UUID值
    let assetTypeId: any = data.asset_type_id;
    if (assetTypeId && typeof assetTypeId === 'string' && !assetTypeId.includes('-')) {
      // 这是一个资产类型代码，需要转换为UUID
      const typeResult = await this.db.prisma.$queryRaw`
        SELECT id FROM finapp.asset_types WHERE code = ${assetTypeId}
      ` as any[];
      assetTypeId = typeResult && typeResult.length > 0 ? typeResult[0].id : null;
    }

    // 处理 country_id：确保是单个UUID值
    let countryId: any = data.country_id;
    if (countryId && typeof countryId === 'string') {
      if (!countryId.includes('-')) {
        // 这是一个国家代码，需要转换为UUID
        const countryResult = await this.db.prisma.$queryRaw`
          SELECT id FROM finapp.countries WHERE code = ${countryId}
        ` as any[];
        countryId = countryResult && countryResult.length > 0 ? countryResult[0].id : null;
      } else {
        // 这是一个UUID格式，验证它是否存在于countries表中
        const countryCheck = await this.db.prisma.$queryRaw`
          SELECT id FROM finapp.countries WHERE id = ${countryId}::uuid
        ` as any[];
        if (!countryCheck || countryCheck.length === 0) {
          console.warn(`[UpdateSyncTask] Country UUID not found: ${countryId}`);
          countryId = null;
        }
      }
    }

    console.log(`[UpdateSyncTask] Processed IDs:`, {
      assetTypeId,
      countryId,
    });

    // 处理 asset_ids 数组
    let assetIds: any = null;
    if (data.asset_ids && Array.isArray(data.asset_ids) && data.asset_ids.length > 0) {
      const validIds = data.asset_ids.filter((id: string) => id && String(id).trim());
      if (validIds.length > 0) {
        assetIds = validIds.map(id => String(id).trim());
      }
    }

    console.log(`[UpdateSyncTask] Processing update for task ${id}:`, {
      name: data.name,
      data_source_id: data.data_source_id,
      asset_type_id: assetTypeId,
      country_id: countryId,
      asset_ids: assetIds,
    });

    // 构建动态更新语句，只包含提供的字段
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
    if (assetTypeId !== undefined) {
      updates.push(`asset_type_id = $${paramIndex++}::uuid`);
      values.push(assetTypeId);
    }
    if (countryId !== undefined) {
      // 只有当countryId是有效的UUID或null时才更新
      if (countryId === null || (typeof countryId === 'string' && countryId.includes('-'))) {
        updates.push(`country_id = $${paramIndex++}::uuid`);
        values.push(countryId);
      } else if (countryId) {
        console.warn(`[UpdateSyncTask] Skipping invalid country_id: ${countryId}`);
      }
    }
    if (assetIds !== undefined) {
      if (assetIds && assetIds.length > 0) {
        updates.push(`asset_ids = $${paramIndex++}::uuid[]`);
        values.push(assetIds);
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

    if (updates.length === 0) {
      // 没有要更新的字段，直接返回现有任务
      return this.getSyncTask(id);
    }

    values.push(id);
    const result = await this.db.prisma.$queryRawUnsafe(`
      UPDATE finapp.price_sync_tasks 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++}::uuid
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
    // 使用本地时区时间（CST/UTC+8）而不是 UTC
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
    if (task.country_id) {
      whereConditions.push(`country_id = '${task.country_id}'`);
    }
    if (task.asset_ids && task.asset_ids.length > 0) {
      const ids = task.asset_ids.map(id => `'${id}'`).join(',');
      whereConditions.push(`id IN (${ids})`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const assets = await this.db.prisma.$queryRawUnsafe(`
      SELECT id, symbol, name, asset_type_id, country_id, currency
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

    // 根据国家维度确定 Yahoo Finance 的后缀
    let yahooSymbol = asset.symbol;
    
    // 获取国家信息
    if (asset.country_id) {
      const countryResult = await this.db.prisma.$queryRaw`
        SELECT code FROM finapp.countries WHERE id = ${asset.country_id}::uuid
      ` as any[];
      
      if (countryResult.length > 0) {
        const countryCode = countryResult[0].code;
        
        // 根据国家代码添加 Yahoo Finance 后缀
        // 注意：同一个国家可能有多个交易所，这里使用国家代码作为基础
        // 具体的交易所应该由资产的 symbol 中的前缀或后缀指示
        switch (countryCode) {
          case 'HK':
            // 香港：处理前导零
            // 规则：如果是5位数字且以0开头，去掉第一个0
            // 00700 -> 0700, 03690 -> 3690, 09618 -> 9618
            let hkSymbol = asset.symbol;
            if (hkSymbol.length === 5 && hkSymbol.startsWith('0')) {
              hkSymbol = hkSymbol.substring(1);
            }
            yahooSymbol = `${hkSymbol}.HK`;
            break;
          case 'CN':
            // 中国：需要根据具体交易所判断
            // Yahoo Finance 中文转换规则：
            // - 100000-199999: 深交所基金 → .SZ (100138等)
            // - 500000-599999: 深交所 ETF 和基金 → .SZ
            // - 600000-609999: 上海股票 → .SS
            // - 000000-003999: 深圳股票 → .SZ
            // - 800000-899999: B股 → .SS
            if (asset.symbol.startsWith('1')) {
              // 100000+ → 深交所基金（含ETF），使用深交所后缀
              yahooSymbol = `${asset.symbol}.SZ`;
            } else if (asset.symbol.startsWith('6')) {
              // 600000+ → 上交所
              yahooSymbol = `${asset.symbol}.SS`;
            } else if (asset.symbol.startsWith('5')) {
              // 500000+ → 深交所 ETF/基金，使用深交所后缀
              yahooSymbol = `${asset.symbol}.SZ`;
            } else if (asset.symbol.startsWith('0') || asset.symbol.startsWith('3')) {
              // 000000-003999 → 深圳股票
              yahooSymbol = `${asset.symbol}.SZ`;
            } else if (asset.symbol.startsWith('8')) {
              // 800000+ → B股，使用上交所后缀
              yahooSymbol = `${asset.symbol}.SS`;
            } else {
              // 其他情况，尝试直接使用
              yahooSymbol = asset.symbol;
            }
            break;
          case 'JP':
            yahooSymbol = `${asset.symbol}.T`; // 东京交易所
            break;
          case 'GB':
            yahooSymbol = `${asset.symbol}.L`; // 伦敦交易所
            break;
          case 'DE':
            yahooSymbol = `${asset.symbol}.F`; // 法兰克福交易所
            break;
          case 'US':
            // 美国：NYSE 和 NASDAQ 通常不需要后缀
            yahooSymbol = asset.symbol;
            break;
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
    // 东方财富 API 实现
    try {
      // 转换符号为 EastMoney 的 secid 格式
      // 中国交易所代码：
      // - 0: 深交所 (000000-199999, 500000-599999)
      // - 1: 上交所 (600000-699999, 960000-969999)
      let secid = asset.symbol;
      const firstDigit = asset.symbol.charAt(0);
      
      if (firstDigit === '1' || firstDigit === '5' || firstDigit === '0' || firstDigit === '3') {
        // 深交所：1xxxxxx (基金), 5xxxxx (ETF), 0xxxxx (股票), 3xxxxx (创业板)
        secid = `0.${asset.symbol}`;
      } else if (firstDigit === '6' || firstDigit === '9') {
        // 上交所：6xxxxx (股票), 9xxxxx (债券)
        secid = `1.${asset.symbol}`;
      }
      
      console.log(`[EastMoney] Fetching ${asset.symbol} with secid: ${secid}`);

      const response = await axios.get(
        'http://push2.eastmoney.com/api/qt/stock/kline/get',
        {
          params: {
            secid: secid,
            fields1: 'f1,f2,f3,f4,f5',
            fields2: 'f51,f52,f53,f54,f55,f56,f57',
            klt: 101, // 日K
            fqt: 1, // 前复权
            lmt: daysBack,
          },
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'http://quote.eastmoney.com/',
          },
        }
      );

      if (!response.data || !response.data.data || !response.data.data.klines) {
        console.warn(`[EastMoney] No kline data returned for ${asset.symbol} (${secid})`);
        return [];
      }

      const klines = response.data.data.klines;
      const prices = klines.map((kline: string) => {
        const parts = kline.split(',');
        return {
          date: parts[0] || '',
          open: parseFloat(parts[1] || '0'),
          high: parseFloat(parts[3] || '0'),
          low: parseFloat(parts[4] || '0'),
          close: parseFloat(parts[2] || '0'),
          volume: parseInt(parts[5] || '0'),
          currency: asset.currency || 'CNY',
        };
      }).filter(p => p.date && p.close > 0);

      console.log(`[EastMoney] Fetched ${prices.length} price records for ${asset.symbol}`);
      return prices;
    } catch (error) {
      console.error(`[EastMoney] Error fetching data for ${asset.symbol}:`, error);
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
