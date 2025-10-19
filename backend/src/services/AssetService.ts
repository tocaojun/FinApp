import { databaseService } from './DatabaseService';

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
  marketId?: string;
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

  // 搜索资产
  async searchAssets(criteria: any): Promise<{ assets: SimpleAsset[], total: number }> {
    try {
      let whereConditions: string[] = [];

      if (criteria.keyword) {
        whereConditions.push(`(a.symbol ILIKE '%${criteria.keyword}%' OR a.name ILIKE '%${criteria.keyword}%')`);
      }

      if (criteria.assetTypeId) {
        whereConditions.push(`a.asset_type_id = '${criteria.assetTypeId}'`);
      }

      if (criteria.marketId) {
        whereConditions.push(`a.market_id = '${criteria.marketId}'`);
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
        whereConditions.push(`a.liquidity_tag = '${criteria.liquidityTag}'`);
      }

      if (typeof criteria.isActive === 'boolean') {
        whereConditions.push(`a.is_active = ${criteria.isActive}`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;

      const assets = await this.db.prisma.$queryRawUnsafe(`
        SELECT 
          a.*,
          at.name as "assetTypeName",
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
          marketId: row.market_id,
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
          ${data.liquidityTag || null}, ${data.description || null}
        )
        RETURNING *
      ` as any[];

      const row = result[0];
      return {
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        assetTypeId: row.asset_type_id,
        marketId: row.market_id,
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
          liquidity_tag = COALESCE(${data.liquidityTag}, liquidity_tag),
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
        marketId: row.market_id,
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
        SELECT a.*, at.name as asset_type_name, m.name as market_name
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
        marketId: row.market_id,
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
    const { updates, source = 'bulk_update' } = data;
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
            // 验证资产是否存在
            const asset = await prisma.$queryRaw`
              SELECT id FROM assets WHERE id = ${update.assetId}::uuid
            ` as any[];

            if (asset.length === 0) {
              throw new Error(`Asset with ID ${update.assetId} not found`);
            }

            // 插入或更新价格
            await prisma.$queryRaw`
              INSERT INTO asset_prices (
                asset_id, price_date, open_price, high_price, low_price, 
                close_price, volume, adjusted_price, source
              ) VALUES (
                ${update.assetId}, ${update.priceDate}, ${update.openPrice || null}, 
                ${update.highPrice || null}, ${update.lowPrice || null}, ${update.closePrice},
                ${update.volume || null}, ${update.adjustedPrice || null}, ${source}
              )
              ON CONFLICT (asset_id, price_date) 
              DO UPDATE SET
                open_price = EXCLUDED.open_price,
                high_price = EXCLUDED.high_price,
                low_price = EXCLUDED.low_price,
                close_price = EXCLUDED.close_price,
                volume = EXCLUDED.volume,
                adjusted_price = EXCLUDED.adjusted_price,
                source = EXCLUDED.source
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
}