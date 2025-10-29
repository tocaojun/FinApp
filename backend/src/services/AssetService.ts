import { databaseService } from './DatabaseService';
import { assetDetailsService } from './AssetDetailsService';
import { AssetWithDetails, CreateAssetWithDetailsRequest } from '../types/asset-details.types';

interface SimpleAssetType {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
}

interface SimpleAsset {
  id: string;
  symbol: string;
  name: string;
  assetTypeId: string;
  assetTypeName?: string;
  marketId?: string;
  marketName?: string;
  currency: string;
  sector?: string;
  industry?: string;
  riskLevel?: string;
  liquidityTag?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface SimpleAssetPrice {
  id: string;
  assetId: string;
  priceDate: string;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice: number;
  volume?: number;
  adjustedPrice?: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface SimpleMarket {
  id: string;
  code: string;
  name: string;
  country: string;
  timezone: string;
}

interface AssetStatistics {
  totalAssets: number;
  activeAssets: number;
  totalMarkets: number;
  totalTypes: number;
  sectorsCount: number;
}

export class AssetService {
  private db = databaseService;

  // 获取资产类型
  async getAssetTypes(): Promise<SimpleAssetType[]> {
    try {
      const result = await this.db.prisma.$queryRaw`
        SELECT * FROM asset_types WHERE is_active = true ORDER BY name
      ` as any[];

      return result.map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        description: row.description
      }));
    } catch (error) {
      console.error('Error fetching asset types:', error);
      return [];
    }
  }

  // 创建资产类型
  async createAssetType(data: {
    code: string;
    name: string;
    category: string;
    description?: string;
  }): Promise<SimpleAssetType> {
    try {
      // 检查代码是否已存在
      const existing = await this.db.prisma.$queryRaw`
        SELECT id FROM asset_types WHERE code = ${data.code} OR name = ${data.name}
      ` as any[];

      if (existing.length > 0) {
        throw new Error('Asset type code or name already exists');
      }

      const result = await this.db.prisma.$queryRaw`
        INSERT INTO asset_types (code, name, category, description)
        VALUES (${data.code}, ${data.name}, ${data.category}, ${data.description || null})
        RETURNING *
      ` as any[];

      const row = result[0];
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        description: row.description
      };
    } catch (error) {
      console.error('Error creating asset type:', error);
      throw new Error('Failed to create asset type');
    }
  }

  // 更新资产类型
  async updateAssetType(id: string, data: Partial<{
    code: string;
    name: string;
    category: string;
    description?: string;
    isActive: boolean;
  }>): Promise<SimpleAssetType> {
    try {
      // 检查资产类型是否存在
      const existing = await this.db.prisma.$queryRaw`
        SELECT id FROM asset_types WHERE id = ${id}::uuid
      ` as any[];

      if (existing.length === 0) {
        throw new Error('Asset type not found');
      }

      // 如果更新代码或名称，检查是否与其他记录冲突
      if (data.code || data.name) {
        const conflict = await this.db.prisma.$queryRaw`
          SELECT id FROM asset_types 
          WHERE id != ${id}::uuid AND (code = ${data.code || ''} OR name = ${data.name || ''})
        ` as any[];

        if (conflict.length > 0) {
          throw new Error('Asset type code or name already exists');
        }
      }

      const result = await this.db.prisma.$queryRaw`
        UPDATE asset_types SET
          code = COALESCE(${data.code}, code),
          name = COALESCE(${data.name}, name),
          category = COALESCE(${data.category}, category),
          description = COALESCE(${data.description}, description),
          is_active = COALESCE(${data.isActive}, is_active)
        WHERE id = ${id}::uuid
        RETURNING *
      ` as any[];

      const row = result[0];
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        description: row.description
      };
    } catch (error) {
      console.error('Error updating asset type:', error);
      throw new Error('Failed to update asset type');
    }
  }

  // 删除资产类型
  async deleteAssetType(id: string): Promise<boolean> {
    try {
      // 检查资产类型是否存在
      const existing = await this.db.prisma.$queryRaw`
        SELECT id, name FROM asset_types WHERE id = ${id}::uuid
      ` as any[];

      if (existing.length === 0) {
        throw new Error('Asset type not found');
      }

      // 检查是否有资产使用此类型
      const assetsCount = await this.db.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM assets WHERE asset_type_id = ${id}::uuid
      ` as any[];

      const count = parseInt(assetsCount[0].count) || 0;
      if (count > 0) {
        throw new Error(`Cannot delete asset type "${existing[0].name}" because it is being used by ${count} asset(s). Please reassign or delete these assets first.`);
      }

      await this.db.prisma.$queryRaw`
        DELETE FROM asset_types WHERE id = ${id}::uuid
      `;

      return true;
    } catch (error) {
      console.error('Error deleting asset type:', error);
      throw error;
    }
  }

  // 获取资产类型使用情况
  async getAssetTypeUsage(id: string): Promise<any> {
    try {
      // 检查资产类型是否存在
      const existing = await this.db.prisma.$queryRaw`
        SELECT id, name FROM asset_types WHERE id = ${id}::uuid
      ` as any[];

      if (existing.length === 0) {
        throw new Error('Asset type not found');
      }

      // 获取使用此类型的资产
      const assets = await this.db.prisma.$queryRaw`
        SELECT id, symbol, name FROM assets WHERE asset_type_id = ${id}::uuid
      ` as any[];

      return {
        assetType: existing[0],
        usageCount: assets.length,
        assets: assets
      };
    } catch (error) {
      console.error('Error getting asset type usage:', error);
      throw error;
    }
  }

  // 获取市场列表
  async getMarkets(): Promise<SimpleMarket[]> {
    try {
      const result = await this.db.prisma.$queryRaw`
        SELECT * FROM markets WHERE is_active = true ORDER BY name
      ` as any[];

      return result.map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        country: row.country,
        timezone: row.timezone
      }));
    } catch (error) {
      console.error('Error fetching markets:', error);
      return [];
    }
  }

  // 获取资产统计信息
  async getAssetStatistics(): Promise<AssetStatistics> {
    try {
      const totalAssets = await this.db.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM assets
      ` as any[];

      const activeAssets = await this.db.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM assets WHERE is_active = true
      ` as any[];

      const totalMarkets = await this.db.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM markets WHERE is_active = true
      ` as any[];

      const totalTypes = await this.db.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM asset_types WHERE is_active = true
      ` as any[];

      const sectors = await this.db.prisma.$queryRaw`
        SELECT COUNT(DISTINCT sector) as count FROM assets WHERE sector IS NOT NULL
      ` as any[];

      return {
        totalAssets: parseInt(totalAssets[0].count) || 0,
        activeAssets: parseInt(activeAssets[0].count) || 0,
        totalMarkets: parseInt(totalMarkets[0].count) || 0,
        totalTypes: parseInt(totalTypes[0].count) || 0,
        sectorsCount: parseInt(sectors[0].count) || 0
      };
    } catch (error) {
      console.error('Error fetching asset statistics:', error);
      return { totalAssets: 0, activeAssets: 0, totalMarkets: 0, totalTypes: 0, sectorsCount: 0 };
    }
  }

  // 搜索资产（带详情）
  async searchAssetsWithDetails(criteria: any): Promise<{ assets: any[], total: number }> {
    try {
      // 先获取基础资产列表
      const result = await this.searchAssets(criteria);
      
      // 为每个资产获取详情
      const assetsWithDetails = await Promise.all(
        result.assets.map(async (asset) => {
          try {
            const fullAsset = await this.getAssetWithDetails(asset.id);
            return fullAsset || asset;
          } catch (error) {
            console.error(`Error fetching details for asset ${asset.id}:`, error);
            return asset;
          }
        })
      );
      
      return {
        assets: assetsWithDetails,
        total: result.total
      };
    } catch (error) {
      console.error('Error searching assets with details:', error);
      return { assets: [], total: 0 };
    }
  }

  // 搜索资产
  async searchAssets(criteria: any): Promise<{ assets: SimpleAsset[], total: number }> {
    try {
      let whereConditions: string[] = [];

      if (criteria.keyword) {
        const keyword = criteria.keyword.replace(/'/g, "''"); // 转义单引号
        whereConditions.push(`(a.symbol ILIKE '%${keyword}%' OR a.name ILIKE '%${keyword}%')`);
      }

      if (criteria.assetTypeId) {
        whereConditions.push(`a.asset_type_id = '${criteria.assetTypeId}'::uuid`);
      }

      if (criteria.marketId) {
        whereConditions.push(`a.market_id = '${criteria.marketId}'::uuid`);
      }

      if (criteria.currency) {
        whereConditions.push(`a.currency = '${criteria.currency}'`);
      }

      if (criteria.sector) {
        whereConditions.push(`a.sector = '${criteria.sector}'`);
      }

      if (criteria.riskLevel) {
        whereConditions.push(`a.risk_level = '${criteria.riskLevel}'`);
      }

      if (criteria.liquidityTag) {
        whereConditions.push(`a.liquidity_tag = '${criteria.liquidityTag}'::uuid`);
      }

      if (typeof criteria.isActive === 'boolean') {
        whereConditions.push(`a.is_active = ${criteria.isActive}`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const limit = criteria.limit || 50;
      const page = criteria.page || 1;
      const offset = (page - 1) * limit;

      const assets = await this.db.prisma.$queryRawUnsafe(`
        SELECT 
          a.*,
          at.name as "assetTypeName",
          at.code as "assetTypeCode",
          m.name as "marketName"
        FROM assets a
        LEFT JOIN asset_types at ON a.asset_type_id = at.id
        LEFT JOIN markets m ON a.market_id = m.id
        ${whereClause}
        ORDER BY a.symbol
        LIMIT ${limit} OFFSET ${offset}
      `) as any[];

      const totalResult = await this.db.prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count
        FROM assets a
        ${whereClause}
      `) as any[];

      const total = parseInt(totalResult[0].count) || 0;

      return {
        assets: assets.map((row: any) => ({
          id: row.id,
          symbol: row.symbol,
          name: row.name,
          assetTypeId: row.asset_type_id,
          assetTypeName: row.assetTypeName,
          assetTypeCode: row.assetTypeCode,
          marketId: row.market_id,
          marketName: row.marketName,
          currency: row.currency,
          sector: row.sector,
          industry: row.industry,
          riskLevel: row.risk_level,
          liquidityTag: row.liquidity_tag,
          isActive: row.is_active,
          description: row.description,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })),
        total
      };
    } catch (error) {
      console.error('Error searching assets:', error);
      return { assets: [], total: 0 };
    }
  }

  // 创建资产
  async createAsset(data: any): Promise<SimpleAsset> {
    try {
      const result = await this.db.prisma.$queryRaw`
        INSERT INTO assets (
          symbol, name, asset_type_id, market_id, currency, sector, 
          industry, risk_level, liquidity_tag, description
        ) VALUES (
          ${data.symbol.toUpperCase()}, ${data.name}, ${data.assetTypeId}::uuid, 
          ${data.marketId || null}::uuid, ${data.currency}, ${data.sector || null},
          ${data.industry || null}, ${data.riskLevel || null}, 
          ${data.liquidityTag || null}::uuid, ${data.description || null}
        )
        RETURNING *
      ` as any[];

      const row = result[0];
      return {
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        assetTypeId: row.asset_type_id,
        assetTypeName: row.assetTypeName,
        marketId: row.market_id,
        marketName: row.marketName,
        currency: row.currency,
        sector: row.sector,
        industry: row.industry,
        riskLevel: row.risk_level,
        liquidityTag: row.liquidity_tag,
        isActive: row.is_active,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error creating asset:', error);
      throw new Error('Failed to create asset');
    }
  }

  // 更新资产
  async updateAsset(id: string, data: any): Promise<SimpleAsset> {
    try {
      // 检查资产是否存在
      const existing = await this.db.prisma.$queryRaw`
        SELECT id FROM assets WHERE id = ${id}::uuid
      ` as any[];

      if (existing.length === 0) {
        throw new Error('Asset not found');
      }

      const result = await this.db.prisma.$queryRaw`
        UPDATE assets SET
          symbol = COALESCE(${data.symbol?.toUpperCase()}, symbol),
          name = COALESCE(${data.name}, name),
          asset_type_id = COALESCE(${data.assetTypeId}::uuid, asset_type_id),
          market_id = COALESCE(${data.marketId}::uuid, market_id),
          currency = COALESCE(${data.currency}, currency),
          sector = COALESCE(${data.sector}, sector),
          industry = COALESCE(${data.industry}, industry),
          risk_level = COALESCE(${data.riskLevel}, risk_level),
          liquidity_tag = COALESCE(${data.liquidityTag}::uuid, liquidity_tag),
          is_active = COALESCE(${data.isActive}, is_active),
          description = COALESCE(${data.description}, description)
        WHERE id = ${id}::uuid
        RETURNING *
      ` as any[];

      const row = result[0];
      return {
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        assetTypeId: row.asset_type_id,
        assetTypeName: row.assetTypeName,
        marketId: row.market_id,
        marketName: row.marketName,
        currency: row.currency,
        sector: row.sector,
        industry: row.industry,
        riskLevel: row.risk_level,
        liquidityTag: row.liquidity_tag,
        isActive: row.is_active,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error updating asset:', error);
      throw new Error('Failed to update asset');
    }
  }

  // 根据ID获取资产
  async getAssetById(id: string): Promise<SimpleAsset | null> {
    try {
      const result = await this.db.prisma.$queryRaw`
        SELECT a.*, at.name as "assetTypeName", m.name as "marketName"
        FROM assets a
        LEFT JOIN asset_types at ON a.asset_type_id = at.id
        LEFT JOIN markets m ON a.market_id = m.id
        WHERE a.id = ${id}::uuid
      ` as any[];

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        assetTypeId: row.asset_type_id,
        assetTypeName: row.assetTypeName,
        marketId: row.market_id,
        marketName: row.marketName,
        currency: row.currency,
        sector: row.sector,
        industry: row.industry,
        riskLevel: row.risk_level,
        liquidityTag: row.liquidity_tag,
        isActive: row.is_active,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error getting asset by id:', error);
      throw new Error('Failed to get asset');
    }
  }

  // 删除资产
  async deleteAsset(id: string): Promise<boolean> {
    try {
      // 检查资产是否存在
      const existing = await this.db.prisma.$queryRaw`
        SELECT id, name FROM assets WHERE id = ${id}::uuid
      ` as any[];

      if (existing.length === 0) {
        throw new Error('Asset not found');
      }

      // 检查是否有交易记录使用此资产
      const transactionsCount = await this.db.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM transactions WHERE asset_id = ${id}::uuid
      ` as any[];

      const count = parseInt(transactionsCount[0].count) || 0;
      if (count > 0) {
        throw new Error(`Cannot delete asset "${existing[0].name}" because it has ${count} transaction record(s). Please delete these transactions first.`);
      }

      // 执行删除
      await this.db.prisma.$queryRaw`
        DELETE FROM assets WHERE id = ${id}::uuid
      `;
      
      return true;
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  }

  // 获取资产价格
  async getAssetPrices(assetId: string, params: any): Promise<SimpleAssetPrice[]> {
    try {
      let whereConditions = [`asset_id = '${assetId}'`];

      if (params.startDate) {
        whereConditions.push(`price_date >= '${params.startDate}'`);
      }

      if (params.endDate) {
        whereConditions.push(`price_date <= '${params.endDate}'`);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      const limit = params.limit || 100;
      const offset = params.offset || 0;
      const sortOrder = params.sortOrder || 'DESC';

      const result = await this.db.prisma.$queryRawUnsafe(`
        SELECT * FROM asset_prices
        ${whereClause}
        ORDER BY price_date ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `) as any[];

      return result.map((row: any) => ({
        id: row.id,
        assetId: row.asset_id,
        priceDate: row.price_date,
        openPrice: row.open_price ? parseFloat(row.open_price) : undefined,
        highPrice: row.high_price ? parseFloat(row.high_price) : undefined,
        lowPrice: row.low_price ? parseFloat(row.low_price) : undefined,
        closePrice: parseFloat(row.close_price),
        volume: row.volume ? parseInt(row.volume) : undefined,
        adjustedPrice: row.adjusted_price ? parseFloat(row.adjusted_price) : undefined,
        source: row.source,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error fetching asset prices:', error);
      return [];
    }
  }

  // 添加价格
  async addPrice(data: any): Promise<SimpleAssetPrice> {
    try {
      const result = await this.db.prisma.$queryRaw`
        INSERT INTO asset_prices (
          asset_id, price_date, open_price, high_price, low_price, 
          close_price, volume, adjusted_price, source
        ) VALUES (
          ${data.assetId}, ${data.priceDate}, ${data.openPrice || null}, 
          ${data.highPrice || null}, ${data.lowPrice || null}, ${data.closePrice},
          ${data.volume || null}, ${data.adjustedPrice || null}, ${data.source || 'manual'}
        )
        RETURNING *
      ` as any[];

      const row = result[0];
      return {
        id: row.id,
        assetId: row.asset_id,
        priceDate: row.price_date,
        openPrice: row.open_price ? parseFloat(row.open_price) : undefined,
        highPrice: row.high_price ? parseFloat(row.high_price) : undefined,
        lowPrice: row.low_price ? parseFloat(row.low_price) : undefined,
        closePrice: parseFloat(row.close_price),
        volume: row.volume ? parseInt(row.volume) : undefined,
        adjustedPrice: row.adjusted_price ? parseFloat(row.adjusted_price) : undefined,
        source: row.source,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error adding price:', error);
      throw new Error('Failed to add price');
    }
  }

  // 更新价格
  async updatePrice(id: string, data: any): Promise<SimpleAssetPrice> {
    try {
      const result = await this.db.prisma.$queryRaw`
        UPDATE asset_prices SET
          price_date = ${data.priceDate},
          open_price = ${data.openPrice},
          high_price = ${data.highPrice},
          low_price = ${data.lowPrice},
          close_price = ${data.closePrice},
          volume = ${data.volume},
          adjusted_price = ${data.adjustedPrice},
          source = ${data.source}
        WHERE id = ${id}::uuid
        RETURNING *
      ` as any[];

      if (result.length === 0) {
        throw new Error('Price record not found');
      }

      const row = result[0];
      return {
        id: row.id,
        assetId: row.asset_id,
        priceDate: row.price_date,
        openPrice: row.open_price ? parseFloat(row.open_price) : undefined,
        highPrice: row.high_price ? parseFloat(row.high_price) : undefined,
        lowPrice: row.low_price ? parseFloat(row.low_price) : undefined,
        closePrice: parseFloat(row.close_price),
        volume: row.volume ? parseInt(row.volume) : undefined,
        adjustedPrice: row.adjusted_price ? parseFloat(row.adjusted_price) : undefined,
        source: row.source,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error updating price:', error);
      throw new Error('Failed to update price');
    }
  }

  // 删除价格
  async deletePrice(id: string): Promise<boolean> {
    try {
      await this.db.prisma.$queryRaw`
        DELETE FROM asset_prices WHERE id = ${id}::uuid
      `;
      return true;
    } catch (error) {
      console.error('Error deleting price:', error);
      return false;
    }
  }

  // 批量导入资产
  async bulkImportAssets(data: any): Promise<any> {
    const { assets, skipDuplicates = true, updateExisting = false } = data;
    const results = {
      success: true,
      totalRecords: assets?.length || 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      updatedCount: 0,
      errors: [] as any[]
    };

    if (!assets || !Array.isArray(assets)) {
      results.success = false;
      results.errors.push({ message: 'Invalid assets data provided' });
      return results;
    }

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      try {
        // 检查是否已存在
        const existingAsset = await this.db.prisma.$queryRaw`
          SELECT id FROM assets WHERE symbol = ${asset.symbol.toUpperCase()}
        ` as any[];

        if (existingAsset.length > 0) {
          if (updateExisting) {
            // 更新现有资产
            await this.updateAsset(existingAsset[0].id, asset);
            results.updatedCount++;
          } else if (skipDuplicates) {
            results.skippedCount++;
            continue;
          } else {
            throw new Error(`Asset with symbol ${asset.symbol} already exists`);
          }
        } else {
          // 创建新资产
          await this.createAsset(asset);
          results.successCount++;
        }
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          row: i + 1,
          symbol: asset.symbol,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    results.success = results.errorCount === 0;
    return results;
  }

  // 批量导入价格
  async bulkImportPrices(data: any): Promise<any> {
    const { prices, skipDuplicates = true, updateExisting = false } = data;
    const results = {
      success: true,
      totalRecords: prices?.length || 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      updatedCount: 0,
      errors: [] as any[]
    };

    if (!prices || !Array.isArray(prices)) {
      results.success = false;
      results.errors.push({ message: 'Invalid prices data provided' });
      return results;
    }

    for (let i = 0; i < prices.length; i++) {
      const price = prices[i];
      try {
        // 检查是否已存在
        const existingPrice = await this.db.prisma.$queryRaw`
          SELECT id FROM asset_prices 
          WHERE asset_id = ${price.assetId}::uuid AND price_date = ${price.priceDate}
        ` as any[];

        if (existingPrice.length > 0) {
          if (updateExisting) {
            // 更新现有价格
            await this.updatePrice(existingPrice[0].id, price);
            results.updatedCount++;
          } else if (skipDuplicates) {
            results.skippedCount++;
            continue;
          } else {
            throw new Error(`Price for asset ${price.assetId} on ${price.priceDate} already exists`);
          }
        } else {
          // 创建新价格记录
          await this.addPrice(price);
          results.successCount++;
        }
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          row: i + 1,
          assetId: price.assetId,
          priceDate: price.priceDate,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    results.success = results.errorCount === 0;
    return results;
  }

  // 批量价格更新（支持多种数据源）
  async bulkUpdatePrices(data: any): Promise<any> {
    const { updates, source = 'MANUAL' } = data;
    const results = {
      success: true,
      totalRecords: updates?.length || 0,
      successCount: 0,
      errorCount: 0,
      errors: [] as any[]
    };

    if (!updates || !Array.isArray(updates)) {
      results.success = false;
      results.errors.push({ message: 'Invalid updates data provided' });
      return results;
    }

    // 开始事务
    try {
      await this.db.prisma.$transaction(async (prisma) => {
        for (let i = 0; i < updates.length; i++) {
          const update = updates[i];
          try {
            // 验证资产是否存在并获取币种
            const asset = await prisma.$queryRaw`
              SELECT id, currency FROM assets WHERE id = ${update.assetId}::uuid
            ` as any[];

            if (asset.length === 0) {
              throw new Error(`资产 ${update.assetId} 不存在`);
            }

            // 验证收盘价必填
            if (!update.closePrice || update.closePrice <= 0) {
              throw new Error('收盘价必须大于0');
            }

            // 使用资产的币种或更新中提供的币种
            const currency = update.currency || asset[0].currency;

            // 插入或更新价格
            await prisma.$queryRaw`
              INSERT INTO asset_prices (
                asset_id, price_date, open_price, high_price, low_price, 
                close_price, volume, adjusted_close, currency, data_source
              ) VALUES (
                ${update.assetId}::uuid, ${update.priceDate}::date, ${update.openPrice || null}, 
                ${update.highPrice || null}, ${update.lowPrice || null}, ${update.closePrice},
                ${update.volume || null}, ${update.adjustedPrice || null}, ${currency}, ${source}
              )
              ON CONFLICT (asset_id, price_date) 
              DO UPDATE SET
                open_price = EXCLUDED.open_price,
                high_price = EXCLUDED.high_price,
                low_price = EXCLUDED.low_price,
                close_price = EXCLUDED.close_price,
                volume = EXCLUDED.volume,
                adjusted_close = EXCLUDED.adjusted_close,
                currency = EXCLUDED.currency,
                data_source = EXCLUDED.data_source
            `;

            results.successCount++;
          } catch (error) {
            results.errorCount++;
            results.errors.push({
              row: i + 1,
              assetId: update.assetId,
              priceDate: update.priceDate,
              message: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      });
    } catch (error) {
      results.success = false;
      results.errors.push({
        message: 'Transaction failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }

    results.success = results.errorCount === 0;
    return results;
  }

  // ============================================
  // 多资产类型支持（新增）
  // ============================================

  /**
   * 获取完整资产信息（包含详情）
   */
  async getAssetWithDetails(assetId: string): Promise<AssetWithDetails | null> {
    try {
      // 1. 获取基础资产信息
      const query = `
        SELECT 
          a.*,
          at.name as asset_type_name,
          at.code as asset_type_code,
          m.name as market_name
        FROM finapp.assets a
        LEFT JOIN finapp.asset_types at ON a.asset_type_id = at.id
        LEFT JOIN finapp.markets m ON a.market_id = m.id
        WHERE a.id = $1::uuid
      `;
      
      const result = await this.db.executeRawQuery(query, [assetId]);
      
      if (!result || result.length === 0) {
        return null;
      }
      
      const row = result[0];
      const baseAsset: AssetWithDetails = {
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        assetTypeId: row.asset_type_id,
        assetTypeName: row.asset_type_name,
        assetTypeCode: row.asset_type_code,
        marketId: row.market_id,
        marketName: row.market_name,
        currency: row.currency,
        isin: row.isin,
        cusip: row.cusip,
        description: row.description,
        riskLevel: row.risk_level,
        liquidityTag: row.liquidity_tag,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
      
      // 2. 获取类型特定的详情
      if (row.asset_type_code) {
        const details = await assetDetailsService.getAssetDetails(assetId, row.asset_type_code);
        if (details) {
          baseAsset.details = details;
        }
      }
      
      return baseAsset;
    } catch (error) {
      console.error('Error fetching asset with details:', error);
      throw error;
    }
  }

  /**
   * 创建资产（带详情）
   */
  async createAssetWithDetails(data: CreateAssetWithDetailsRequest): Promise<AssetWithDetails> {
    try {
      // 使用 Prisma 事务确保原子性
      return await this.db.prisma.$transaction(async (tx) => {
        // 1. 获取资产类型ID
        const assetTypeQuery = `
          SELECT id FROM finapp.asset_types WHERE code = $1
        `;
        const assetTypeResult = await tx.$queryRawUnsafe(assetTypeQuery, data.assetTypeCode);
        
        if (!assetTypeResult || (assetTypeResult as any[]).length === 0) {
          throw new Error(`Asset type not found: ${data.assetTypeCode}`);
        }
        
        const assetTypeId = (assetTypeResult as any[])[0].id;
        
        // 2. 创建基础资产
        const createAssetQuery = `
          INSERT INTO finapp.assets (
            symbol, name, asset_type_id, market_id, currency,
            isin, cusip, description, risk_level, liquidity_tag
          ) VALUES (
            $1, $2, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10::uuid
          )
          RETURNING *
        `;
        
        const assetResult = await tx.$queryRawUnsafe(
          createAssetQuery,
          data.symbol.toUpperCase(),
          data.name,
          assetTypeId,
          data.marketId || null,
          data.currency,
          data.isin || null,
          data.cusip || null,
          data.description || null,
          data.riskLevel || null,
          data.liquidityTag || null
        );
        
        const asset = (assetResult as any[])[0];
        
        // 3. 创建详情记录（在同一事务中）
        let details = null;
        if (data.details) {
          details = await assetDetailsService.createAssetDetails(
            asset.id,
            data.assetTypeCode,
            data.details,
            tx // 传入事务客户端
          );
        }
        
        // 4. 返回完整资产
        return {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          assetTypeId: asset.asset_type_id,
          assetTypeCode: data.assetTypeCode,
          marketId: asset.market_id,
          currency: asset.currency,
          isin: asset.isin,
          cusip: asset.cusip,
          description: asset.description,
          riskLevel: asset.risk_level,
          liquidityTag: asset.liquidity_tag,
          isActive: asset.is_active,
          createdAt: asset.created_at,
          updatedAt: asset.updated_at,
          details: details || undefined,
        };
      });
    } catch (error) {
      console.error('Error creating asset with details:', error);
      throw error;
    }
  }

  /**
   * 更新资产（带详情）
   */
  async updateAssetWithDetails(
    assetId: string,
    data: Partial<CreateAssetWithDetailsRequest>
  ): Promise<AssetWithDetails> {
    try {
      return await this.db.prisma.$transaction(async (tx) => {
        // 1. 获取当前资产信息
        const currentAsset = await this.getAssetWithDetails(assetId);
        if (!currentAsset) {
          throw new Error('Asset not found');
        }
        
        // 2. 更新基础资产
        if (data.symbol || data.name || data.currency || data.description || data.riskLevel) {
          const updateFields: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;
          
          if (data.symbol) {
            updateFields.push(`symbol = $${paramIndex}`);
            values.push(data.symbol.toUpperCase());
            paramIndex++;
          }
          if (data.name) {
            updateFields.push(`name = $${paramIndex}`);
            values.push(data.name);
            paramIndex++;
          }
          if (data.currency) {
            updateFields.push(`currency = $${paramIndex}`);
            values.push(data.currency);
            paramIndex++;
          }
          if (data.description !== undefined) {
            updateFields.push(`description = $${paramIndex}`);
            values.push(data.description);
            paramIndex++;
          }
          if (data.riskLevel !== undefined) {
            updateFields.push(`risk_level = $${paramIndex}`);
            values.push(data.riskLevel);
            paramIndex++;
          }
          
          if (updateFields.length > 0) {
            values.push(assetId);
            const updateQuery = `
              UPDATE finapp.assets
              SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
              WHERE id = $${paramIndex}::uuid
            `;
            await this.db.executeRawQuery(updateQuery, values);
          }
        }
        
        // 3. 更新详情
        if (data.details && currentAsset.assetTypeCode) {
          await assetDetailsService.updateAssetDetails(
            assetId,
            currentAsset.assetTypeCode,
            data.details
          );
        }
        
        // 4. 返回更新后的资产
        return await this.getAssetWithDetails(assetId) as AssetWithDetails;
      });
    } catch (error) {
      console.error('Error updating asset with details:', error);
      throw error;
    }
  }

  /**
   * 使用视图查询完整资产列表
   */
  async getAssetsFullView(filters?: {
    assetTypeCode?: string;
    marketId?: string;
    sector?: string;
    fundType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ assets: AssetWithDetails[]; total: number }> {
    try {
      const conditions: string[] = ['a.is_active = true'];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (filters?.assetTypeCode) {
        conditions.push(`at.code = $${paramIndex}`);
        values.push(filters.assetTypeCode);
        paramIndex++;
      }
      
      if (filters?.marketId) {
        conditions.push(`a.market_id = $${paramIndex}::uuid`);
        values.push(filters.marketId);
        paramIndex++;
      }
      
      if (filters?.sector) {
        conditions.push(`sd.sector = $${paramIndex}`);
        values.push(filters.sector);
        paramIndex++;
      }
      
      if (filters?.fundType) {
        conditions.push(`fd.fund_type = $${paramIndex}`);
        values.push(filters.fundType);
        paramIndex++;
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM finapp.v_assets_full a
        LEFT JOIN finapp.asset_types at ON a.asset_type_id = at.id
        LEFT JOIN finapp.stock_details sd ON a.id = sd.asset_id
        LEFT JOIN finapp.fund_details fd ON a.id = fd.asset_id
        ${whereClause}
      `;
      
      const countResult = await this.db.executeRawQuery(countQuery, values);
      const total = parseInt(countResult[0].total);
      
      // 查询数据
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      
      const dataQuery = `
        SELECT * FROM finapp.v_assets_full
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const assets = await this.db.executeRawQuery(dataQuery, [...values, limit, offset]);
      
      return {
        assets: assets.map((row: any) => this.mapAssetFullView(row)),
        total,
      };
    } catch (error) {
      console.error('Error fetching assets full view:', error);
      throw error;
    }
  }

  /**
   * 映射视图数据到AssetWithDetails
   */
  private mapAssetFullView(row: any): AssetWithDetails {
    const base: AssetWithDetails = {
      id: row.id,
      symbol: row.symbol,
      name: row.name,
      assetTypeId: row.asset_type_id,
      assetTypeName: row.asset_type_name,
      assetTypeCode: row.asset_type_code,
      marketId: row.market_id,
      marketName: row.market_name,
      currency: row.currency,
      isin: row.isin,
      cusip: row.cusip,
      description: row.description,
      riskLevel: row.risk_level,
      liquidityTag: row.liquidity_tag,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    
    // 根据资产类型添加详情
    if (row.asset_type_code === 'STOCK' && (row.sector || row.industry)) {
      base.details = {
        sector: row.sector,
        industry: row.industry,
        marketCap: row.market_cap,
        peRatio: row.pe_ratio,
        pbRatio: row.pb_ratio,
        dividendYield: row.dividend_yield,
      } as any;
    } else if (row.asset_type_code === 'FUND' && row.fund_type) {
      base.details = {
        fundType: row.fund_type,
        managementFee: row.management_fee,
        nav: row.nav,
        navDate: row.nav_date,
      } as any;
    }
    // 可以继续添加其他类型...
    
    return base;
  }
}