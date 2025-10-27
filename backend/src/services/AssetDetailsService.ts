/**
 * 资产详情服务
 * 处理不同资产类型的详情数据
 */

import { databaseService } from './DatabaseService';
import {
  AssetTypeCode,
  StockDetails,
  FundDetails,
  BondDetails,
  FuturesDetails,
  WealthProductDetails,
  TreasuryDetails,
  CreateStockDetailsInput,
  CreateFundDetailsInput,
  CreateBondDetailsInput,
  CreateFuturesDetailsInput,
  CreateWealthProductDetailsInput,
  CreateTreasuryDetailsInput,
  AssetDetails,
  CreateAssetDetailsInput,
} from '../types/asset-details.types';

export class AssetDetailsService {
  
  /**
   * 根据资产ID和类型获取详情
   */
  async getAssetDetails(assetId: string, assetTypeCode: string): Promise<AssetDetails | null> {
    switch (assetTypeCode) {
      case AssetTypeCode.STOCK:
        return this.getStockDetails(assetId);
      case AssetTypeCode.FUND:
        return this.getFundDetails(assetId);
      case AssetTypeCode.BOND:
        return this.getBondDetails(assetId);
      case AssetTypeCode.FUTURES:
        return this.getFuturesDetails(assetId);
      case AssetTypeCode.WEALTH:
        return this.getWealthProductDetails(assetId);
      case AssetTypeCode.TREASURY:
        return this.getTreasuryDetails(assetId);
      default:
        return null;
    }
  }

  /**
   * 创建资产详情
   */
  async createAssetDetails(
    assetId: string,
    assetTypeCode: string,
    details: CreateAssetDetailsInput
  ): Promise<AssetDetails | null> {
    switch (assetTypeCode) {
      case AssetTypeCode.STOCK:
        return this.createStockDetails(assetId, details as CreateStockDetailsInput);
      case AssetTypeCode.FUND:
        return this.createFundDetails(assetId, details as CreateFundDetailsInput);
      case AssetTypeCode.BOND:
        return this.createBondDetails(assetId, details as CreateBondDetailsInput);
      case AssetTypeCode.FUTURES:
        return this.createFuturesDetails(assetId, details as CreateFuturesDetailsInput);
      case AssetTypeCode.WEALTH:
        return this.createWealthProductDetails(assetId, details as CreateWealthProductDetailsInput);
      case AssetTypeCode.TREASURY:
        return this.createTreasuryDetails(assetId, details as CreateTreasuryDetailsInput);
      default:
        return null;
    }
  }

  /**
   * 更新资产详情
   */
  async updateAssetDetails(
    assetId: string,
    assetTypeCode: string,
    details: Partial<CreateAssetDetailsInput>
  ): Promise<AssetDetails | null> {
    switch (assetTypeCode) {
      case AssetTypeCode.STOCK:
        return this.updateStockDetails(assetId, details as Partial<CreateStockDetailsInput>);
      case AssetTypeCode.FUND:
        return this.updateFundDetails(assetId, details as Partial<CreateFundDetailsInput>);
      case AssetTypeCode.BOND:
        return this.updateBondDetails(assetId, details as Partial<CreateBondDetailsInput>);
      case AssetTypeCode.FUTURES:
        return this.updateFuturesDetails(assetId, details as Partial<CreateFuturesDetailsInput>);
      case AssetTypeCode.WEALTH:
        return this.updateWealthProductDetails(assetId, details as Partial<CreateWealthProductDetailsInput>);
      case AssetTypeCode.TREASURY:
        return this.updateTreasuryDetails(assetId, details as Partial<CreateTreasuryDetailsInput>);
      default:
        return null;
    }
  }

  // ============================================
  // 股票详情
  // ============================================

  async getStockDetails(assetId: string): Promise<StockDetails | null> {
    const query = `
      SELECT * FROM finapp.stock_details
      WHERE asset_id = $1::uuid
    `;
    const result = await databaseService.executeRawQuery(query, [assetId]);
    return result.length > 0 ? this.mapStockDetails(result[0]) : null;
  }

  async createStockDetails(assetId: string, details: CreateStockDetailsInput): Promise<StockDetails> {
    const query = `
      INSERT INTO finapp.stock_details (
        asset_id, sector, industry, market_cap, shares_outstanding,
        pe_ratio, pb_ratio, dividend_yield, company_website, headquarters, founded_year
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING *
    `;
    const result = await databaseService.executeRawQuery(query, [
      assetId,
      details.sector || null,
      details.industry || null,
      details.marketCap || null,
      details.sharesOutstanding || null,
      details.peRatio || null,
      details.pbRatio || null,
      details.dividendYield || null,
      details.companyWebsite || null,
      details.headquarters || null,
      details.foundedYear || null,
    ]);
    return this.mapStockDetails(result[0]);
  }

  async updateStockDetails(assetId: string, details: Partial<CreateStockDetailsInput>): Promise<StockDetails> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(details).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(assetId);
    const query = `
      UPDATE finapp.stock_details
      SET ${fields.join(', ')}
      WHERE asset_id = $${paramIndex}::uuid
      RETURNING *
    `;

    const result = await databaseService.executeRawQuery(query, values);
    return this.mapStockDetails(result[0]);
  }

  // ============================================
  // 基金详情
  // ============================================

  async getFundDetails(assetId: string): Promise<FundDetails | null> {
    const query = `
      SELECT * FROM finapp.fund_details
      WHERE asset_id = $1::uuid
    `;
    const result = await databaseService.executeRawQuery(query, [assetId]);
    return result.length > 0 ? this.mapFundDetails(result[0]) : null;
  }

  async createFundDetails(assetId: string, details: CreateFundDetailsInput): Promise<FundDetails> {
    const query = `
      INSERT INTO finapp.fund_details (
        asset_id, fund_type, fund_category, management_fee, custodian_fee,
        subscription_fee, redemption_fee, nav, nav_date, accumulated_nav,
        fund_size, inception_date, fund_manager, fund_company,
        min_investment, min_redemption
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;
    const result = await databaseService.executeRawQuery(query, [
      assetId,
      details.fundType,
      details.fundCategory || null,
      details.managementFee || null,
      details.custodianFee || null,
      details.subscriptionFee || null,
      details.redemptionFee || null,
      details.nav || null,
      details.navDate || null,
      details.accumulatedNav || null,
      details.fundSize || null,
      details.inceptionDate || null,
      details.fundManager || null,
      details.fundCompany || null,
      details.minInvestment || null,
      details.minRedemption || null,
    ]);
    return this.mapFundDetails(result[0]);
  }

  async updateFundDetails(assetId: string, details: Partial<CreateFundDetailsInput>): Promise<FundDetails> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(details).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(assetId);
    const query = `
      UPDATE finapp.fund_details
      SET ${fields.join(', ')}
      WHERE asset_id = $${paramIndex}::uuid
      RETURNING *
    `;

    const result = await databaseService.executeRawQuery(query, values);
    return this.mapFundDetails(result[0]);
  }

  // ============================================
  // 债券详情
  // ============================================

  async getBondDetails(assetId: string): Promise<BondDetails | null> {
    const query = `
      SELECT * FROM finapp.bond_details
      WHERE asset_id = $1::uuid
    `;
    const result = await databaseService.executeRawQuery(query, [assetId]);
    return result.length > 0 ? this.mapBondDetails(result[0]) : null;
  }

  async createBondDetails(assetId: string, details: CreateBondDetailsInput): Promise<BondDetails> {
    const query = `
      INSERT INTO finapp.bond_details (
        asset_id, bond_type, credit_rating, face_value, coupon_rate,
        coupon_frequency, issue_date, maturity_date, years_to_maturity,
        yield_to_maturity, current_yield, issuer, issue_price, issue_size,
        callable, call_date, call_price
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *
    `;
    const result = await databaseService.executeRawQuery(query, [
      assetId,
      details.bondType,
      details.creditRating || null,
      details.faceValue,
      details.couponRate,
      details.couponFrequency || null,
      details.issueDate,
      details.maturityDate,
      details.yearsToMaturity || null,
      details.yieldToMaturity || null,
      details.currentYield || null,
      details.issuer || null,
      details.issuePrice || null,
      details.issueSize || null,
      details.callable || false,
      details.callDate || null,
      details.callPrice || null,
    ]);
    return this.mapBondDetails(result[0]);
  }

  async updateBondDetails(assetId: string, details: Partial<CreateBondDetailsInput>): Promise<BondDetails> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(details).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(assetId);
    const query = `
      UPDATE finapp.bond_details
      SET ${fields.join(', ')}
      WHERE asset_id = $${paramIndex}::uuid
      RETURNING *
    `;

    const result = await databaseService.executeRawQuery(query, values);
    return this.mapBondDetails(result[0]);
  }

  // ============================================
  // 期货详情
  // ============================================

  async getFuturesDetails(assetId: string): Promise<FuturesDetails | null> {
    const query = `
      SELECT * FROM finapp.futures_details
      WHERE asset_id = $1::uuid
    `;
    const result = await databaseService.executeRawQuery(query, [assetId]);
    return result.length > 0 ? this.mapFuturesDetails(result[0]) : null;
  }

  async createFuturesDetails(assetId: string, details: CreateFuturesDetailsInput): Promise<FuturesDetails> {
    const query = `
      INSERT INTO finapp.futures_details (
        asset_id, futures_type, underlying_asset, contract_month, contract_size,
        tick_size, tick_value, trading_hours, last_trading_date, delivery_date,
        delivery_method, initial_margin, maintenance_margin, margin_rate,
        position_limit, daily_price_limit
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;
    const result = await databaseService.executeRawQuery(query, [
      assetId,
      details.futuresType,
      details.underlyingAsset || null,
      details.contractMonth,
      details.contractSize || null,
      details.tickSize || null,
      details.tickValue || null,
      details.tradingHours || null,
      details.lastTradingDate || null,
      details.deliveryDate || null,
      details.deliveryMethod || null,
      details.initialMargin || null,
      details.maintenanceMargin || null,
      details.marginRate || null,
      details.positionLimit || null,
      details.dailyPriceLimit || null,
    ]);
    return this.mapFuturesDetails(result[0]);
  }

  async updateFuturesDetails(assetId: string, details: Partial<CreateFuturesDetailsInput>): Promise<FuturesDetails> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(details).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(assetId);
    const query = `
      UPDATE finapp.futures_details
      SET ${fields.join(', ')}
      WHERE asset_id = $${paramIndex}::uuid
      RETURNING *
    `;

    const result = await databaseService.executeRawQuery(query, values);
    return this.mapFuturesDetails(result[0]);
  }

  // ============================================
  // 理财产品详情
  // ============================================

  async getWealthProductDetails(assetId: string): Promise<WealthProductDetails | null> {
    const query = `
      SELECT * FROM finapp.wealth_product_details
      WHERE asset_id = $1::uuid
    `;
    const result = await databaseService.executeRawQuery(query, [assetId]);
    return result.length > 0 ? this.mapWealthProductDetails(result[0]) : null;
  }

  async createWealthProductDetails(assetId: string, details: CreateWealthProductDetailsInput): Promise<WealthProductDetails> {
    const query = `
      INSERT INTO finapp.wealth_product_details (
        asset_id, product_type, risk_level, expected_return, min_return,
        max_return, return_type, issue_date, start_date, maturity_date,
        lock_period, min_investment, max_investment, investment_increment,
        issuer, product_code, early_redemption, redemption_fee
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *
    `;
    const result = await databaseService.executeRawQuery(query, [
      assetId,
      details.productType,
      details.riskLevel,
      details.expectedReturn || null,
      details.minReturn || null,
      details.maxReturn || null,
      details.returnType || null,
      details.issueDate,
      details.startDate,
      details.maturityDate,
      details.lockPeriod || null,
      details.minInvestment || null,
      details.maxInvestment || null,
      details.investmentIncrement || null,
      details.issuer || null,
      details.productCode || null,
      details.earlyRedemption || false,
      details.redemptionFee || null,
    ]);
    return this.mapWealthProductDetails(result[0]);
  }

  async updateWealthProductDetails(assetId: string, details: Partial<CreateWealthProductDetailsInput>): Promise<WealthProductDetails> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(details).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(assetId);
    const query = `
      UPDATE finapp.wealth_product_details
      SET ${fields.join(', ')}
      WHERE asset_id = $${paramIndex}::uuid
      RETURNING *
    `;

    const result = await databaseService.executeRawQuery(query, values);
    return this.mapWealthProductDetails(result[0]);
  }

  // ============================================
  // 国债详情
  // ============================================

  async getTreasuryDetails(assetId: string): Promise<TreasuryDetails | null> {
    const query = `
      SELECT * FROM finapp.treasury_details
      WHERE asset_id = $1::uuid
    `;
    const result = await databaseService.executeRawQuery(query, [assetId]);
    return result.length > 0 ? this.mapTreasuryDetails(result[0]) : null;
  }

  async createTreasuryDetails(assetId: string, details: CreateTreasuryDetailsInput): Promise<TreasuryDetails> {
    const query = `
      INSERT INTO finapp.treasury_details (
        asset_id, treasury_type, term_type, face_value, coupon_rate,
        coupon_frequency, issue_date, maturity_date, term_years,
        issue_price, issue_number, yield_to_maturity, tradable, min_holding_period
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *
    `;
    const result = await databaseService.executeRawQuery(query, [
      assetId,
      details.treasuryType,
      details.termType || null,
      details.faceValue,
      details.couponRate,
      details.couponFrequency || null,
      details.issueDate,
      details.maturityDate,
      details.termYears || null,
      details.issuePrice || null,
      details.issueNumber || null,
      details.yieldToMaturity || null,
      details.tradable !== undefined ? details.tradable : true,
      details.minHoldingPeriod || null,
    ]);
    return this.mapTreasuryDetails(result[0]);
  }

  async updateTreasuryDetails(assetId: string, details: Partial<CreateTreasuryDetailsInput>): Promise<TreasuryDetails> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(details).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(assetId);
    const query = `
      UPDATE finapp.treasury_details
      SET ${fields.join(', ')}
      WHERE asset_id = $${paramIndex}::uuid
      RETURNING *
    `;

    const result = await databaseService.executeRawQuery(query, values);
    return this.mapTreasuryDetails(result[0]);
  }

  // ============================================
  // 辅助方法
  // ============================================

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private mapStockDetails(row: any): StockDetails {
    return {
      id: row.id,
      assetId: row.asset_id,
      sector: row.sector,
      industry: row.industry,
      marketCap: row.market_cap ? parseFloat(row.market_cap) : undefined,
      sharesOutstanding: row.shares_outstanding ? parseInt(row.shares_outstanding) : undefined,
      peRatio: row.pe_ratio ? parseFloat(row.pe_ratio) : undefined,
      pbRatio: row.pb_ratio ? parseFloat(row.pb_ratio) : undefined,
      dividendYield: row.dividend_yield ? parseFloat(row.dividend_yield) : undefined,
      companyWebsite: row.company_website,
      headquarters: row.headquarters,
      foundedYear: row.founded_year,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapFundDetails(row: any): FundDetails {
    return {
      id: row.id,
      assetId: row.asset_id,
      fundType: row.fund_type,
      fundCategory: row.fund_category,
      managementFee: row.management_fee ? parseFloat(row.management_fee) : undefined,
      custodianFee: row.custodian_fee ? parseFloat(row.custodian_fee) : undefined,
      subscriptionFee: row.subscription_fee ? parseFloat(row.subscription_fee) : undefined,
      redemptionFee: row.redemption_fee ? parseFloat(row.redemption_fee) : undefined,
      nav: row.nav ? parseFloat(row.nav) : undefined,
      navDate: row.nav_date,
      accumulatedNav: row.accumulated_nav ? parseFloat(row.accumulated_nav) : undefined,
      fundSize: row.fund_size ? parseFloat(row.fund_size) : undefined,
      inceptionDate: row.inception_date,
      fundManager: row.fund_manager,
      fundCompany: row.fund_company,
      minInvestment: row.min_investment ? parseFloat(row.min_investment) : undefined,
      minRedemption: row.min_redemption ? parseFloat(row.min_redemption) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapBondDetails(row: any): BondDetails {
    return {
      id: row.id,
      assetId: row.asset_id,
      bondType: row.bond_type,
      creditRating: row.credit_rating,
      faceValue: parseFloat(row.face_value),
      couponRate: parseFloat(row.coupon_rate),
      couponFrequency: row.coupon_frequency,
      issueDate: row.issue_date,
      maturityDate: row.maturity_date,
      yearsToMaturity: row.years_to_maturity ? parseFloat(row.years_to_maturity) : undefined,
      yieldToMaturity: row.yield_to_maturity ? parseFloat(row.yield_to_maturity) : undefined,
      currentYield: row.current_yield ? parseFloat(row.current_yield) : undefined,
      issuer: row.issuer,
      issuePrice: row.issue_price ? parseFloat(row.issue_price) : undefined,
      issueSize: row.issue_size ? parseFloat(row.issue_size) : undefined,
      callable: row.callable,
      callDate: row.call_date,
      callPrice: row.call_price ? parseFloat(row.call_price) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapFuturesDetails(row: any): FuturesDetails {
    return {
      id: row.id,
      assetId: row.asset_id,
      futuresType: row.futures_type,
      underlyingAsset: row.underlying_asset,
      contractMonth: row.contract_month,
      contractSize: row.contract_size ? parseFloat(row.contract_size) : undefined,
      tickSize: row.tick_size ? parseFloat(row.tick_size) : undefined,
      tickValue: row.tick_value ? parseFloat(row.tick_value) : undefined,
      tradingHours: row.trading_hours,
      lastTradingDate: row.last_trading_date,
      deliveryDate: row.delivery_date,
      deliveryMethod: row.delivery_method,
      initialMargin: row.initial_margin ? parseFloat(row.initial_margin) : undefined,
      maintenanceMargin: row.maintenance_margin ? parseFloat(row.maintenance_margin) : undefined,
      marginRate: row.margin_rate ? parseFloat(row.margin_rate) : undefined,
      positionLimit: row.position_limit,
      dailyPriceLimit: row.daily_price_limit ? parseFloat(row.daily_price_limit) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapWealthProductDetails(row: any): WealthProductDetails {
    return {
      id: row.id,
      assetId: row.asset_id,
      productType: row.product_type,
      riskLevel: row.risk_level,
      expectedReturn: row.expected_return ? parseFloat(row.expected_return) : undefined,
      minReturn: row.min_return ? parseFloat(row.min_return) : undefined,
      maxReturn: row.max_return ? parseFloat(row.max_return) : undefined,
      returnType: row.return_type,
      issueDate: row.issue_date,
      startDate: row.start_date,
      maturityDate: row.maturity_date,
      lockPeriod: row.lock_period,
      minInvestment: row.min_investment ? parseFloat(row.min_investment) : undefined,
      maxInvestment: row.max_investment ? parseFloat(row.max_investment) : undefined,
      investmentIncrement: row.investment_increment ? parseFloat(row.investment_increment) : undefined,
      issuer: row.issuer,
      productCode: row.product_code,
      earlyRedemption: row.early_redemption,
      redemptionFee: row.redemption_fee ? parseFloat(row.redemption_fee) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapTreasuryDetails(row: any): TreasuryDetails {
    return {
      id: row.id,
      assetId: row.asset_id,
      treasuryType: row.treasury_type,
      termType: row.term_type,
      faceValue: parseFloat(row.face_value),
      couponRate: parseFloat(row.coupon_rate),
      couponFrequency: row.coupon_frequency,
      issueDate: row.issue_date,
      maturityDate: row.maturity_date,
      termYears: row.term_years,
      issuePrice: row.issue_price ? parseFloat(row.issue_price) : undefined,
      issueNumber: row.issue_number,
      yieldToMaturity: row.yield_to_maturity ? parseFloat(row.yield_to_maturity) : undefined,
      tradable: row.tradable,
      minHoldingPeriod: row.min_holding_period,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const assetDetailsService = new AssetDetailsService();
