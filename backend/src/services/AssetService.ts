import { databaseService } from './DatabaseService';

// 简化的类型定义
interface SimpleAsset {
  id: string;
  symbol: string;
  name: string;
  assetTypeId: string;
  marketId: string;
  currency: string;
  sector?: string;
  industry?: string;
  riskLevel: string;
  liquidityTag: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface SimpleAssetType {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
}

interface SimpleMarket {
  id: string;
  code: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
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

interface AssetStatistics {
  totalAssets: number;
  activeAssets: number;
  inactiveAssets: number;
  assetTypesCount: number;
  marketsCount: number;
  currenciesCount: number;
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

  // 获取市场
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
        currency: row.currency,
        timezone: row.timezone
      }));
    } catch (error) {
      console.error('Error fetching markets:', error);
      return [];
    }
  }

  // 获取统计信息
  async getAssetStatistics(): Promise<AssetStatistics> {
    try {
      const result = await this.db.prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_assets,
          COUNT(*) FILTER (WHERE is_active = true) as active_assets,
          COUNT(*) FILTER (WHERE is_active = false) as inactive_assets,
          COUNT(DISTINCT asset_type_id) as asset_types_count,
          COUNT(DISTINCT market_id) as markets_count,
          COUNT(DISTINCT currency) as currencies_count,
          COUNT(DISTINCT sector) as sectors_count
        FROM assets
      ` as any[];

      const row = result[0];
      return {
        totalAssets: parseInt(row.total_assets) || 0,
        activeAssets: parseInt(row.active_assets) || 0,
        inactiveAssets: parseInt(row.inactive_assets) || 0,
        assetTypesCount: parseInt(row.asset_types_count) || 0,
        marketsCount: parseInt(row.markets_count) || 0,
        currenciesCount: parseInt(row.currencies_count) || 0,
        sectorsCount: parseInt(row.sectors_count) || 0
      };
    } catch (error) {
      console.error('Error fetching asset statistics:', error);
      return {
        totalAssets: 0,
        activeAssets: 0,
        inactiveAssets: 0,
        assetTypesCount: 0,
        marketsCount: 0,
        currenciesCount: 0,
        sectorsCount: 0
      };
    }
  }

  // 搜索资产
  async searchAssets(criteria: any): Promise<{ assets: SimpleAsset[]; total: number }> {
    try {
      let whereConditions = [];
      let params: any[] = [];

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

      if (criteria.isActive !== undefined) {
        whereConditions.push(`a.is_active = ${criteria.isActive}`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const limit = criteria.limit || 20;
      const offset = ((criteria.page || 1) - 1) * limit;
      const sortBy = criteria.sortBy || 'updated_at';
      const sortOrder = criteria.sortOrder || 'DESC';

      // 获取总数
      const countResult = await this.db.prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as total
        FROM assets a
        ${whereClause}
      `) as any[];

      const total = parseInt(countResult[0].total) || 0;

      // 获取数据
      const result = await this.db.prisma.$queryRawUnsafe(`
        SELECT a.*, at.name as asset_type_name, m.name as market_name
        FROM assets a
        LEFT JOIN asset_types at ON a.asset_type_id = at.id
        LEFT JOIN markets m ON a.market_id = m.id
        ${whereClause}
        ORDER BY a.${sortBy === 'updatedAt' ? 'updated_at' : sortBy} ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `) as any[];

      const assets = result.map((row: any) => ({
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        assetTypeId: row.asset_type_id,
        assetTypeName: row.asset_type_name,
        marketId: row.market_id,
        marketName: row.market_name,
        currency: row.currency,
        sector: row.sector,
        industry: row.industry,
        riskLevel: row.risk_level,
        liquidityTag: row.liquidity_tag,
        isActive: row.is_active,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return { assets, total };
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
          symbol, name, asset_type_id, market_id, currency, 
          sector, industry, risk_level, liquidity_tag, description
        ) VALUES (
          ${data.symbol.toUpperCase()}, ${data.name}, ${data.assetTypeId}, ${data.marketId}, 
          ${data.currency.toUpperCase()}, ${data.sector || null}, ${data.industry || null},
          ${data.riskLevel || 'MEDIUM'}, ${data.liquidityTag || 'MEDIUM'}, ${data.description || null}
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
      const result = await this.db.prisma.$queryRaw`
        UPDATE assets SET
          symbol = ${data.symbol?.toUpperCase()},
          name = ${data.name},
          asset_type_id = ${data.assetTypeId},
          market_id = ${data.marketId},
          currency = ${data.currency?.toUpperCase()},
          sector = ${data.sector},
          industry = ${data.industry},
          risk_level = ${data.riskLevel},
          liquidity_tag = ${data.liquidityTag},
          description = ${data.description},
          is_active = ${data.isActive},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      ` as any[];

      if (result.length === 0) {
        throw new Error('Asset not found');
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
      console.error('Error updating asset:', error);
      throw new Error('Failed to update asset');
    }
  }

  // 删除资产
  async deleteAsset(id: string): Promise<boolean> {
    try {
      await this.db.prisma.$queryRaw`
        DELETE FROM assets WHERE id = ${id}
      `;
      return true;
    } catch (error) {
      console.error('Error deleting asset:', error);
      return false;
    }
  }

  // 获取资产详情
  async getAssetById(id: string): Promise<SimpleAsset | null> {
    try {
      const result = await this.db.prisma.$queryRaw`
        SELECT a.*, at.name as asset_type_name, m.name as market_name
        FROM assets a
        LEFT JOIN asset_types at ON a.asset_type_id = at.id
        LEFT JOIN markets m ON a.market_id = m.id
        WHERE a.id = ${id}
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
      console.error('Error fetching asset by id:', error);
      return null;
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
          source = ${data.source},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
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
        DELETE FROM asset_prices WHERE id = ${id}
      `;
      return true;
    } catch (error) {
      console.error('Error deleting price:', error);
      return false;
    }
  }

  // 批量导入（占位符）
  async bulkImportAssets(data: any): Promise<any> {
    return {
      success: true,
      totalRecords: 0,
      successCount: 0,
      errorCount: 0,
      errors: []
    };
  }

  async bulkImportPrices(data: any): Promise<any> {
    return {
      success: true,
      totalRecords: 0,
      successCount: 0,
      errorCount: 0,
      errors: []
    };
  }
}