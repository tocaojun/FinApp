import { Request, Response } from 'express';
import { AssetService } from '../services/AssetService';
import { 
  AssetSearchCriteria,
  AssetCreateRequest,
  AssetUpdateRequest,
  PriceCreateRequest,
  PriceUpdateRequest,
  PriceQueryParams,
  BulkAssetImportRequest,
  BulkPriceImportRequest
} from '../types/asset';

export class AssetController {
  private assetService: AssetService;

  constructor() {
    this.assetService = new AssetService();
  }

  // 资产管理
  createAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetData: AssetCreateRequest = req.body;
      
      // 检查是否包含详情数据，如果有则使用新的createAssetWithDetails方法
      if (assetData.details && Object.keys(assetData.details).length > 0) {
        // 获取资产类型代码
        const assetTypes = await this.assetService.getAssetTypes();
        const assetType = assetTypes.find(t => t.id === assetData.assetTypeId);
        
        if (!assetType) {
          res.status(400).json({
            success: false,
            message: 'Invalid asset type'
          });
          return;
        }
        
        // 使用新的createAssetWithDetails方法
        const createRequest = {
          ...assetData,
          assetTypeCode: assetType.code,
        };
        
        const asset = await this.assetService.createAssetWithDetails(createRequest);
        
        res.status(201).json({
          success: true,
          data: asset,
          message: 'Asset created successfully with details'
        });
      } else {
        // 使用旧的createAsset方法（向后兼容）
        const asset = await this.assetService.createAsset(assetData);
        
        res.status(201).json({
          success: true,
          data: asset,
          message: 'Asset created successfully'
        });
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create asset'
      });
    }
  };

  updateAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Asset ID is required'
        });
        return;
      }
      
      const updateData: AssetUpdateRequest = req.body;
      
      // 检查是否包含详情数据，如果有则使用新的updateAssetWithDetails方法
      if (updateData.details && Object.keys(updateData.details).length > 0) {
        // 获取资产类型代码
        const assetTypes = await this.assetService.getAssetTypes();
        const assetType = assetTypes.find(t => t.id === updateData.assetTypeId);
        
        if (assetType) {
          const updateRequest = {
            ...updateData,
            assetTypeCode: assetType.code,
          };
          
          const asset = await this.assetService.updateAssetWithDetails(id, updateRequest);
          
          res.json({
            success: true,
            data: asset,
            message: 'Asset updated successfully with details'
          });
          return;
        }
      }
      
      // 使用旧的updateAsset方法（向后兼容）
      const asset = await this.assetService.updateAsset(id, updateData);
      
      res.json({
        success: true,
        data: asset,
        message: 'Asset updated successfully'
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      const statusCode = error instanceof Error && error.message === 'Asset not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update asset'
      });
    }
  };

  deleteAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Asset ID is required'
        });
        return;
      }
      
      const success = await this.assetService.deleteAsset(id);
      
      if (success) {
        res.json({
          success: true,
          message: 'Asset deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete asset'
      });
    }
  };

  getAssetById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Asset ID is required'
        });
        return;
      }
      
      // 尝试获取完整资产信息（包含详情）
      const assetWithDetails = await this.assetService.getAssetWithDetails(id);
      
      if (assetWithDetails) {
        res.json({
          success: true,
          data: assetWithDetails
        });
        return;
      }
      
      res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    } catch (error) {
      console.error('Error fetching asset:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch asset'
      });
    }
  };

  getAssetByIdOld = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Asset ID is required'
        });
        return;
      }
      
      const asset = await this.assetService.getAssetById(id);
      
      if (asset) {
        res.json({
          success: true,
          data: asset
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get asset'
      });
    }
  };

  searchAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      const criteria: AssetSearchCriteria = {
        keyword: req.query.keyword as string,
        assetTypeId: req.query.assetTypeId as string,
        countryId: req.query.countryId as string,
        currency: req.query.currency as string,
        sector: req.query.sector as string,
        riskLevel: req.query.riskLevel as string,
        liquidityTag: req.query.liquidityTag as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC'
      };

      // 只返回基础信息，不获取详情（详情在编辑时单独获取）
      const result = await this.assetService.searchAssets(criteria);
      
      res.json({
        success: true,
        data: result.assets,
        pagination: {
          total: result.total,
          page: criteria.page || 1,
          limit: criteria.limit || 20,
          totalPages: Math.ceil(result.total / (criteria.limit || 20))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search assets'
      });
    }
  };

  // 价格管理
  addPrice = async (req: Request, res: Response): Promise<void> => {
    try {
      const priceData: PriceCreateRequest = req.body;
      const price = await this.assetService.addPrice(priceData);
      
      res.status(201).json({
        success: true,
        data: price,
        message: 'Price added successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add price'
      });
    }
  };

  updatePrice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Price ID is required'
        });
        return;
      }
      
      const updateData: PriceUpdateRequest = req.body;
      const price = await this.assetService.updatePrice(id, updateData);
      
      res.json({
        success: true,
        data: price,
        message: 'Price updated successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Price record not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update price'
      });
    }
  };

  deletePrice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Price ID is required'
        });
        return;
      }
      
      const success = await this.assetService.deletePrice(id);
      
      if (success) {
        res.json({
          success: true,
          message: 'Price deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Price record not found'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete price'
      });
    }
  };

  getAssetPrices = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Asset ID is required'
        });
        return;
      }
      
      const params: PriceQueryParams = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC'
      };

      const prices = await this.assetService.getAssetPrices(id, params);
      
      res.json({
        success: true,
        data: prices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get asset prices'
      });
    }
  };

  // 资产类型和市场
  getAssetTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetTypes = await this.assetService.getAssetTypes();
      
      res.json({
        success: true,
        data: assetTypes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get asset types'
      });
    }
  };



  getCountries = async (req: Request, res: Response): Promise<void> => {
    try {
      const countries = await this.assetService.getCountries();
      
      res.json({
        success: true,
        data: countries
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get countries'
      });
    }
  };

  // 统计信息
  getAssetStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const statistics = await this.assetService.getAssetStatistics();
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get asset statistics'
      });
    }
  };

  // 批量导入
  bulkImportAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      const importData: BulkAssetImportRequest = req.body;
      const result = await this.assetService.bulkImportAssets(importData);
      
      const statusCode = result.success ? 200 : 207; // 207 Multi-Status for partial success
      
      res.status(statusCode).json({
        success: result.success,
        data: result,
        message: result.success 
          ? 'Assets imported successfully' 
          : 'Assets imported with some errors'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import assets'
      });
    }
  };

  bulkImportPrices = async (req: Request, res: Response): Promise<void> => {
    try {
      const importData: BulkPriceImportRequest = req.body;
      const result = await this.assetService.bulkImportPrices(importData);
      
      const statusCode = result.success ? 200 : 207; // 207 Multi-Status for partial success
      
      res.status(statusCode).json({
        success: result.success,
        data: result,
        message: result.success 
          ? 'Prices imported successfully' 
          : 'Prices imported with some errors'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import prices'
      });
    }
  };

  // 导出功能
  exportAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      const criteria: AssetSearchCriteria = {
        keyword: req.query.keyword as string,
        assetTypeId: req.query.assetTypeId as string,
        countryId: req.query.countryId as string,
        currency: req.query.currency as string,
        sector: req.query.sector as string,
        riskLevel: req.query.riskLevel as string,
        liquidityTag: req.query.liquidityTag as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        limit: 10000, // 导出时不限制数量
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC'
      };

      const result = await this.assetService.searchAssets(criteria);
      
      // 设置CSV下载头
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
      
      // 生成CSV内容
      const csvHeader = 'Symbol,Name,Asset Type,Country,Currency,Sector,Risk Level,Liquidity Tag,Is Active,Created At\n';
      const csvRows = result.assets.map(asset => 
        `"${asset.symbol}","${asset.name}","${asset.assetTypeId}","${asset.countryId}","${asset.currency}","${asset.sector || ''}","${asset.riskLevel}","${asset.liquidityTag}","${asset.isActive}","${asset.createdAt}"`
      ).join('\n');
      
      res.send(csvHeader + csvRows);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export assets'
      });
    }
  };

  exportPrices = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Asset ID is required'
        });
        return;
      }
      
      const params: PriceQueryParams = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: 10000, // 导出时不限制数量
        sortOrder: 'ASC'
      };

      const prices = await this.assetService.getAssetPrices(id, params);
      
      // 设置CSV下载头
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=prices_${id}.csv`);
      
      // 生成CSV内容
      const csvHeader = 'Date,Open,High,Low,Close,Volume,Adjusted Close,Source\n';
      const csvRows = prices.map(price => 
        `"${price.priceDate}","${price.openPrice || ''}","${price.highPrice || ''}","${price.lowPrice || ''}","${price.closePrice}","${price.volume || ''}","${price.adjustedPrice || ''}","${price.source}"`
      ).join('\n');
      
      res.send(csvHeader + csvRows);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export prices'
      });
    }
  };

  // 搜索建议
  searchSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyword } = req.query;
      
      if (!keyword || (keyword as string).length < 2) {
        res.json({
          success: true,
          data: []
        });
        return;
      }

      const criteria: AssetSearchCriteria = {
        keyword: keyword as string,
        isActive: true,
        limit: 10
      };

      const result = await this.assetService.searchAssets(criteria);
      
      const suggestions = result.assets.map(asset => ({
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetTypeId,
        country: asset.countryId,
        currency: asset.currency
      }));
      
      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get search suggestions'
      });
    }
  };

  // 资产类型管理
  createAssetType = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetType = await this.assetService.createAssetType(req.body);
      
      res.status(201).json({
        success: true,
        data: assetType,
        message: 'Asset type created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create asset type'
      });
    }
  };

  updateAssetType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Asset type ID is required'
        });
        return;
      }
      
      const assetType = await this.assetService.updateAssetType(id, req.body);
      
      res.json({
        success: true,
        data: assetType,
        message: 'Asset type updated successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Asset type not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update asset type'
      });
    }
  };

  deleteAssetType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Asset type ID is required'
        });
        return;
      }
      
      const success = await this.assetService.deleteAssetType(id);
      
      if (success) {
        res.json({
          success: true,
          message: 'Asset type deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Asset type not found'
        });
      }
    } catch (error) {
      // 根据错误类型返回不同的状态码和错误信息
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: error.message
          });
        } else if (error.message.includes('being used by')) {
          res.status(409).json({
            success: false,
            message: error.message,
            code: 'ASSET_TYPE_IN_USE'
          });
        } else {
          res.status(400).json({
            success: false,
            message: error.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete asset type'
        });
      }
    }
  };

  // 获取资产类型使用情况
  getAssetTypeUsage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Asset type ID is required'
        });
        return;
      }
      
      const usage = await this.assetService.getAssetTypeUsage(id);
      
      res.json({
        success: true,
        message: 'Asset type usage retrieved successfully',
        data: usage
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to get asset type usage'
        });
      }
    }
  };

  // 批量价格更新
  bulkUpdatePrices = async (req: Request, res: Response): Promise<void> => {
    try {
      const { updates } = req.body;
      
      // 验证逻辑
      if (!updates || !Array.isArray(updates)) {
        res.status(400).json({ success: false, message: '无效的请求数据' });
        return;
      }

      const result = await this.assetService.bulkUpdatePrices({ 
        updates, 
        source: 'MANUAL' 
      });
      
      const statusCode = result.success ? 200 : 207; // 207 Multi-Status for partial success
      
      res.status(statusCode).json({
        success: result.success,
        data: result,
        message: result.success 
          ? `成功保存 ${result.successCount} 条价格记录` 
          : `保存了 ${result.successCount} 条记录，${result.errorCount} 条失败`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '保存价格失败'
      });
    }
  };
}