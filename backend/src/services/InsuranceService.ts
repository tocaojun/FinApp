import { databaseService } from './DatabaseService';

export interface InsuranceAssetType {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface CreateInsuranceRequest {
  symbol: string;
  name: string;
  currency: string;
  policyNumber?: string;
  insuranceCompany: string;
  insuranceType: string;
  coverageAmount: number;
  coveragePeriod?: string;
  coverageStartDate?: string;
  coverageEndDate?: string;
  premiumAmount: number;
  premiumFrequency: string;
  premiumPeriod?: number;
  premiumStartDate?: string;
  premiumEndDate?: string;
  currentCashValue?: number;
  guaranteedCashValue?: number;
  dividendCashValue?: number;
  isParticipating?: boolean;
  waitingPeriod?: number;
}

export interface InsuranceAsset {
  assetId: string;
  symbol: string;
  assetName: string;
  assetTypeName: string;
  insuranceDetailId: string;
  policyNumber?: string;
  insuranceCompany: string;
  insuranceType: string;
  coverageAmount: number;
  coveragePeriod?: string;
  coverageStartDate?: string;
  coverageEndDate?: string;
  premiumAmount: number;
  premiumFrequency: string;
  premiumPeriod?: number;
  premiumStartDate?: string;
  premiumEndDate?: string;
  currentCashValue: number;
  guaranteedCashValue: number;
  dividendCashValue: number;
  cashValueUpdateDate?: string;
  policyStatus: string;
  isParticipating: boolean;
  waitingPeriod: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateCashValueRequest {
  guaranteedCashValue: number;
  dividendCashValue: number;
  valuationDate?: string;
  notes?: string;
}

export class InsuranceService {
  private db = databaseService;

  /**
   * 获取保险资产类型列表
   */
  async getInsuranceAssetTypes(): Promise<InsuranceAssetType[]> {
    const query = `
      SELECT id, code, name, description 
      FROM finapp.asset_types 
      WHERE category = 'INSURANCE' AND is_active = true
      ORDER BY name
    `;
    
    return await this.db.executeRawQuery(query);
  }

  /**
   * 创建保险产品
   */
  async createInsurance(userId: string, portfolioId: string, data: CreateInsuranceRequest): Promise<InsuranceAsset> {
    return await this.db.executeTransaction(async (prisma) => {
      // 1. 获取保险资产类型ID
      const assetTypeQuery = `
        SELECT id FROM finapp.asset_types 
        WHERE code = $1 AND category = 'INSURANCE'
      `;
      const assetTypeResult = await this.db.executeRawQuery(assetTypeQuery, [data.insuranceType]);
      
      if (assetTypeResult.length === 0) {
        throw new Error(`未找到保险类型: ${data.insuranceType}`);
      }
      
      const assetTypeId = assetTypeResult[0].id;

      // 2. 创建资产记录  
      const assetQuery = `
        INSERT INTO finapp.assets (
          symbol, name, asset_type_id, currency, is_active, 
          created_at, updated_at
        ) VALUES ($1, $2, $3::uuid, $4, true, NOW(), NOW())
        RETURNING id
      `;
      
      const assetResult = await this.db.executeRawQuery(assetQuery, [
        data.symbol,
        data.name,
        assetTypeId,
        data.currency
      ]);
      
      const assetId = assetResult[0].id;

      // 3. 创建保险详情记录
      const guaranteedCashValue = data.guaranteedCashValue || data.currentCashValue || 0;
      const dividendCashValue = data.dividendCashValue || 0;
      const totalCashValue = guaranteedCashValue + dividendCashValue;
      
      const insuranceQuery = `
        INSERT INTO finapp.insurance_details (
          asset_id, policy_number, insurance_company, insurance_type,
          coverage_amount, coverage_period, coverage_start_date, coverage_end_date,
          premium_amount, premium_frequency, premium_period,
          premium_start_date, premium_end_date, current_cash_value,
          guaranteed_cash_value, dividend_cash_value, policy_status,
          is_participating, waiting_period, beneficiary_info,
          created_at, updated_at
        ) VALUES (
          $1::uuid, $2, $3, $4, $5, $6, $7::date, $8::date, $9, $10,
          $11, $12::date, $13::date, $14, $15, $16, 'ACTIVE', $17, $18, '{}',
          NOW(), NOW()
        )
        RETURNING id
      `;
      
      const insuranceResult = await this.db.executeRawQuery(insuranceQuery, [
        assetId,
        data.policyNumber,
        data.insuranceCompany,
        data.insuranceType,
        data.coverageAmount,
        data.coveragePeriod,
        data.coverageStartDate,
        data.coverageEndDate,
        data.premiumAmount,
        data.premiumFrequency,
        data.premiumPeriod,
        data.premiumStartDate,
        data.premiumEndDate,
        totalCashValue,
        guaranteedCashValue,
        dividendCashValue,
        data.isParticipating || false,
        data.waitingPeriod || 0
      ]);

      // 4. 创建持仓记录 - 需要先获取交易账户
      const accountQuery = `
        SELECT id FROM finapp.trading_accounts 
        WHERE portfolio_id = $1::uuid AND is_active = true 
        ORDER BY created_at ASC
        LIMIT 1
      `;
      
      const accountResult = await this.db.executeRawQuery(accountQuery, [portfolioId]);
      
      if (accountResult.length === 0) {
        throw new Error('未找到活跃的交易账户');
      }
      
      const tradingAccountId = accountResult[0].id;
      
      const positionQuery = `
        INSERT INTO finapp.positions (
          portfolio_id, trading_account_id, asset_id, quantity, 
          average_cost, total_cost, currency, balance, net_asset_value,
          first_purchase_date, last_transaction_date, is_active,
          created_at, updated_at
        ) VALUES (
          $1::uuid, $2::uuid, $3::uuid, 1, $4, $4, $5, $4, $4,
          CURRENT_DATE, CURRENT_DATE, true, NOW(), NOW()
        )
      `;
      
      await this.db.executeRawQuery(positionQuery, [
        portfolioId,
        tradingAccountId,
        assetId,
        totalCashValue,
        data.currency
      ]);

      // 5. 如果有现金价值，记录现金价值历史
      if (totalCashValue > 0) {
        const cashValueHistoryQuery = `
          INSERT INTO finapp.insurance_cash_value_history (
            insurance_detail_id, valuation_date, guaranteed_cash_value,
            dividend_cash_value, total_premium_paid, created_at
          ) VALUES ($1::uuid, CURRENT_DATE, $2, $3, 0, NOW())
        `;
        
        await this.db.executeRawQuery(cashValueHistoryQuery, [
          insuranceResult[0].id,
          guaranteedCashValue,
          dividendCashValue
        ]);
      }

      // 6. 返回创建的保险资产信息
      return await this.getInsuranceByAssetId(assetId);
    });
  }

  /**
   * 获取用户的保险资产列表
   */
  async getUserInsuranceAssets(userId: string, portfolioId?: string): Promise<InsuranceAsset[]> {
    let query = `
      SELECT 
        a.id as asset_id,
        a.symbol,
        a.name as asset_name,
        at.name as asset_type_name,
        id.id as insurance_detail_id,
        id.policy_number,
        id.insurance_company,
        at.code as insurance_type,
        id.coverage_amount,
        id.coverage_period,
        id.coverage_start_date,
        id.coverage_end_date,
        id.premium_amount,
        id.premium_frequency,
        id.premium_period,
        id.premium_start_date,
        id.premium_end_date,
        id.current_cash_value,
        id.guaranteed_cash_value,
        id.dividend_cash_value,
        id.cash_value_update_date,
        id.policy_status,
        id.is_participating,
        id.waiting_period,
        a.currency,
        a.created_at,
        a.updated_at
      FROM finapp.assets a
      JOIN finapp.asset_types at ON a.asset_type_id = at.id
      JOIN finapp.insurance_details id ON a.id = id.asset_id
      JOIN finapp.positions pos ON a.id = pos.asset_id
      JOIN finapp.portfolios p ON pos.portfolio_id = p.id
      WHERE at.category = 'INSURANCE' 
        AND a.is_active = true 
        AND p.user_id = $1::uuid
    `;
    
    const params = [userId];
    
    if (portfolioId) {
      query += ' AND p.id = $2';
      params.push(portfolioId);
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const result = await this.db.executeRawQuery(query, params);
    
    return result.map((row: any) => ({
      assetId: row.asset_id,
      symbol: row.symbol,
      assetName: row.asset_name,
      assetTypeName: row.asset_type_name,
      insuranceDetailId: row.insurance_detail_id,
      policyNumber: row.policy_number,
      insuranceCompany: row.insurance_company,
      insuranceType: row.insurance_type,
      coverageAmount: parseFloat(row.coverage_amount),
      coveragePeriod: row.coverage_period,
      coverageStartDate: row.coverage_start_date,
      coverageEndDate: row.coverage_end_date,
      premiumAmount: parseFloat(row.premium_amount),
      premiumFrequency: row.premium_frequency,
      premiumPeriod: row.premium_period,
      premiumStartDate: row.premium_start_date,
      premiumEndDate: row.premium_end_date,
      currentCashValue: parseFloat(row.current_cash_value),
      guaranteedCashValue: parseFloat(row.guaranteed_cash_value),
      dividendCashValue: parseFloat(row.dividend_cash_value),
      cashValueUpdateDate: row.cash_value_update_date,
      policyStatus: row.policy_status,
      isParticipating: row.is_participating,
      waitingPeriod: row.waiting_period,
      currency: row.currency,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * 根据资产ID获取保险详情
   */
  async getInsuranceByAssetId(assetId: string): Promise<InsuranceAsset> {
    const query = `
      SELECT 
        a.id as asset_id,
        a.symbol,
        a.name as asset_name,
        at.name as asset_type_name,
        id.id as insurance_detail_id,
        id.policy_number,
        id.insurance_company,
        at.code as insurance_type,
        id.coverage_amount,
        id.coverage_period,
        id.coverage_start_date,
        id.coverage_end_date,
        id.premium_amount,
        id.premium_frequency,
        id.premium_period,
        id.premium_start_date,
        id.premium_end_date,
        id.current_cash_value,
        id.guaranteed_cash_value,
        id.dividend_cash_value,
        id.cash_value_update_date,
        id.policy_status,
        id.is_participating,
        id.waiting_period,
        a.currency,
        a.created_at,
        a.updated_at
      FROM finapp.assets a
      JOIN finapp.asset_types at ON a.asset_type_id = at.id
      JOIN finapp.insurance_details id ON a.id = id.asset_id
      WHERE a.id = $1::uuid AND at.category = 'INSURANCE'
    `;
    
    const result = await this.db.executeRawQuery(query, [assetId]);
    
    if (result.length === 0) {
      throw new Error('保险产品不存在');
    }
    
    const row = result[0];
    return {
      assetId: row.asset_id,
      symbol: row.symbol,
      assetName: row.asset_name,
      assetTypeName: row.asset_type_name,
      insuranceDetailId: row.insurance_detail_id,
      policyNumber: row.policy_number,
      insuranceCompany: row.insurance_company,
      insuranceType: row.insurance_type,
      coverageAmount: parseFloat(row.coverage_amount),
      coveragePeriod: row.coverage_period,
      coverageStartDate: row.coverage_start_date,
      coverageEndDate: row.coverage_end_date,
      premiumAmount: parseFloat(row.premium_amount),
      premiumFrequency: row.premium_frequency,
      premiumPeriod: row.premium_period,
      premiumStartDate: row.premium_start_date,
      premiumEndDate: row.premium_end_date,
      currentCashValue: parseFloat(row.current_cash_value),
      guaranteedCashValue: parseFloat(row.guaranteed_cash_value),
      dividendCashValue: parseFloat(row.dividend_cash_value),
      cashValueUpdateDate: row.cash_value_update_date,
      policyStatus: row.policy_status,
      isParticipating: row.is_participating,
      waitingPeriod: row.waiting_period,
      currency: row.currency,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * 更新现金价值
   */
  async updateCashValue(assetId: string, data: UpdateCashValueRequest, userId: string): Promise<void> {
    return await this.db.executeTransaction(async (prisma) => {
      // 1. 验证资产所有权
      const ownershipQuery = `
        SELECT id.id as insurance_detail_id
        FROM finapp.insurance_details id
        JOIN finapp.assets a ON id.asset_id = a.id
        JOIN finapp.positions pos ON a.id = pos.asset_id
        JOIN finapp.portfolios p ON pos.portfolio_id = p.id
        WHERE a.id = $1::uuid AND p.user_id = $2::uuid
      `;
      
      const ownershipResult = await this.db.executeRawQuery(ownershipQuery, [assetId, userId]);
      
      if (ownershipResult.length === 0) {
        throw new Error('保险产品不存在或无权限访问');
      }
      
      const insuranceDetailId = ownershipResult[0].insurance_detail_id;
      const totalCashValue = data.guaranteedCashValue + data.dividendCashValue;
      
      // 2. 更新保险详情表的现金价值
      const updateInsuranceQuery = `
        UPDATE finapp.insurance_details 
        SET 
          current_cash_value = $1,
          guaranteed_cash_value = $2,
          dividend_cash_value = $3,
          cash_value_update_date = CURRENT_DATE,
          updated_at = NOW()
        WHERE id = $4::uuid
      `;
      
      await this.db.executeRawQuery(updateInsuranceQuery, [
        totalCashValue,
        data.guaranteedCashValue,
        data.dividendCashValue,
        insuranceDetailId
      ]);
      
      // 3. 更新持仓表的市值
      const updatePositionQuery = `
        UPDATE finapp.positions 
        SET 
          balance = $1,
          net_asset_value = $1,
          updated_at = NOW()
        WHERE asset_id = $2::uuid
      `;
      
      await this.db.executeRawQuery(updatePositionQuery, [totalCashValue, assetId]);
      
      // 4. 记录现金价值历史
      const historyQuery = `
        INSERT INTO finapp.insurance_cash_value_history (
          insurance_detail_id, valuation_date, guaranteed_cash_value,
          dividend_cash_value, total_premium_paid, notes, created_at
        ) VALUES ($1::uuid, $2::date, $3, $4, 
          (SELECT COALESCE(SUM(premium_amount), 0) FROM finapp.insurance_premium_payments WHERE insurance_detail_id = $1::uuid),
          $5, NOW())
      `;
      
      await this.db.executeRawQuery(historyQuery, [
        insuranceDetailId,
        data.valuationDate || new Date().toISOString().split('T')[0],
        data.guaranteedCashValue,
        data.dividendCashValue,
        data.notes
      ]);
    });
  }

  /**
   * 获取现金价值历史
   */
  async getCashValueHistory(assetId: string): Promise<any[]> {
    const query = `
      SELECT 
        cvh.id,
        cvh.valuation_date,
        cvh.guaranteed_cash_value,
        cvh.dividend_cash_value,
        cvh.total_cash_value,
        cvh.total_premium_paid,
        cvh.yield_rate,
        cvh.notes,
        cvh.created_at
      FROM finapp.insurance_cash_value_history cvh
      JOIN finapp.insurance_details id ON cvh.insurance_detail_id = id.id
      WHERE id.asset_id = $1
      ORDER BY cvh.valuation_date DESC
    `;
    
    return await this.db.executeRawQuery(query, [assetId]);
  }

  /**
   * 记录保费缴纳
   */
  async recordPremiumPayment(assetId: string, data: any): Promise<any> {
    return await this.db.executeTransaction(async (prisma) => {
      // 获取保险详情ID
      const insuranceQuery = `
        SELECT id.id as insurance_detail_id
        FROM finapp.insurance_details id
        WHERE id.asset_id = $1
      `;
      
      const insuranceResult = await this.db.executeRawQuery(insuranceQuery, [assetId]);
      
      if (insuranceResult.length === 0) {
        throw new Error('保险产品不存在');
      }
      
      const insuranceDetailId = insuranceResult[0].insurance_detail_id;
      
      // 插入保费缴纳记录
      const paymentQuery = `
        INSERT INTO finapp.insurance_premium_payments (
          insurance_detail_id, payment_date, premium_amount, currency,
          payment_method, payment_period, is_overdue, overdue_days,
          payment_status, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await this.db.executeRawQuery(paymentQuery, [
        insuranceDetailId,
        data.paymentDate,
        data.premiumAmount,
        data.currency,
        data.paymentMethod,
        data.paymentPeriod,
        data.isOverdue || false,
        data.overdueDays || 0,
        data.paymentStatus || 'PAID',
        data.notes
      ]);
      
      return result[0];
    });
  }

  /**
   * 获取保费缴纳记录
   */
  async getPremiumPayments(assetId: string): Promise<any[]> {
    const query = `
      SELECT 
        pp.id,
        pp.payment_date,
        pp.premium_amount,
        pp.currency,
        pp.payment_method,
        pp.payment_period,
        pp.is_overdue,
        pp.overdue_days,
        pp.payment_status,
        pp.notes,
        pp.created_at,
        pp.updated_at
      FROM finapp.insurance_premium_payments pp
      JOIN finapp.insurance_details id ON pp.insurance_detail_id = id.id
      WHERE id.asset_id = $1
      ORDER BY pp.payment_date DESC
    `;
    
    return await this.db.executeRawQuery(query, [assetId]);
  }

  /**
   * 获取保险统计信息
   */
  async getInsuranceSummary(userId: string, portfolioId?: string): Promise<any[]> {
    let query = `
      SELECT 
        p.id as portfolio_id,
        p.name as portfolio_name,
        COUNT(id.id) as total_policies,
        SUM(id.coverage_amount) as total_coverage_amount,
        SUM(id.current_cash_value) as total_cash_value,
        SUM(CASE id.premium_frequency 
          WHEN 'MONTHLY' THEN id.premium_amount * 12
          WHEN 'QUARTERLY' THEN id.premium_amount * 4
          WHEN 'ANNUALLY' THEN id.premium_amount
          ELSE 0
        END) as annual_premium_amount,
        COUNT(CASE WHEN id.policy_status = 'ACTIVE' THEN 1 END) as active_policies,
        COUNT(CASE WHEN id.is_participating = true THEN 1 END) as participating_policies
      FROM finapp.portfolios p
      LEFT JOIN finapp.positions pos ON p.id = pos.portfolio_id
      LEFT JOIN finapp.assets a ON pos.asset_id = a.id
      LEFT JOIN finapp.asset_types at ON a.asset_type_id = at.id
      LEFT JOIN finapp.insurance_details id ON a.id = id.asset_id
      WHERE p.user_id = $1::uuid AND (at.category = 'INSURANCE' OR at.category IS NULL)
    `;
    
    const params = [userId];
    
    if (portfolioId) {
      query += ' AND p.id = $2';
      params.push(portfolioId);
    }
    
    query += ' GROUP BY p.id, p.name ORDER BY p.name';
    
    const result = await this.db.executeRawQuery(query, params);
    
    // 转换BigInt为数字
    return result.map(row => ({
      ...row,
      total_policies: Number(row.total_policies || 0),
      total_coverage_amount: Number(row.total_coverage_amount || 0),
      total_cash_value: Number(row.total_cash_value || 0),
      annual_premium_amount: Number(row.annual_premium_amount || 0),
      active_policies: Number(row.active_policies || 0),
      participating_policies: Number(row.participating_policies || 0)
    }));
  }
}

export const insuranceService = new InsuranceService();