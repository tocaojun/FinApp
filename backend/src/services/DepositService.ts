import { databaseService } from './DatabaseService';

export interface DepositDetails {
  id?: string;
  assetId: string;
  depositType: 'DEMAND' | 'TIME' | 'NOTICE' | 'STRUCTURED';
  bankName: string;
  accountNumber?: string;
  branchName?: string;
  interestRate: number;
  rateType: 'FIXED' | 'FLOATING';
  compoundFrequency: 'DAILY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'MATURITY';
  termMonths?: number;
  startDate?: Date;
  maturityDate?: Date;
  autoRenewal: boolean;
  minDepositAmount?: number;
  maxDepositAmount?: number;
  depositIncrement?: number;
  earlyWithdrawalAllowed: boolean;
  earlyWithdrawalPenaltyRate?: number;
  noticePeriodDays?: number;
  depositInsuranceCovered: boolean;
  insuranceAmount?: number;
  specialFeatures?: Record<string, any>;
}

export interface DepositPosition {
  positionId: string;
  assetId: string;
  productName: string;
  bankName: string;
  depositType: string;
  currentBalance: number;
  principalAmount: number;
  accruedInterest: number;
  interestRate: number;
  termMonths?: number;
  startDate?: Date;
  maturityDate?: Date;
  daysToMaturity?: number;
  autoRenewal: boolean;
  earlyWithdrawalAllowed: boolean;
  effectiveAnnualRate: number;
}

export interface InterestCalculation {
  positionId: string;
  calculationDate: Date;
  principalAmount: number;
  interestRate: number;
  daysCount: number;
  interestAmount: number;
  calculationMethod: 'ACTUAL_365' | 'ACTUAL_360' | '30_360';
}

export interface MaturityAlert {
  id?: string;
  positionId: string;
  assetId: string;
  userId: string;
  maturityDate: Date;
  principalAmount: number;
  estimatedInterest?: number;
  alertDaysBefore: number;
  alertDate: Date;
  renewalOption: 'AUTO' | 'MANUAL' | 'TRANSFER_TO_DEMAND';
  newTermMonths?: number;
  status: 'PENDING' | 'NOTIFIED' | 'PROCESSED' | 'CANCELLED';
}

export class DepositService {
  constructor(private db: any) {}

  /**
   * 创建存款产品详情
   */
  async createDepositDetails(details: DepositDetails): Promise<DepositDetails> {
    const query = `
      INSERT INTO finapp.deposit_details (
        asset_id, deposit_type, bank_name, account_number, branch_name,
        interest_rate, rate_type, compound_frequency, term_months,
        start_date, maturity_date, auto_renewal, min_deposit_amount,
        max_deposit_amount, deposit_increment, early_withdrawal_allowed,
        early_withdrawal_penalty_rate, notice_period_days,
        deposit_insurance_covered, insurance_amount, special_features
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10::date, $11::date,
        $12, $13, $14, $15, $16, $17, $18, $19, $20, $21::jsonb
      ) RETURNING *
    `;

    const values = [
      details.assetId,
      details.depositType,
      details.bankName,
      details.accountNumber || null,
      details.branchName || null,
      details.interestRate,
      details.rateType,
      details.compoundFrequency,
      details.termMonths || null,
      details.startDate || null,
      details.maturityDate || null,
      details.autoRenewal,
      details.minDepositAmount || null,
      details.maxDepositAmount || null,
      details.depositIncrement || null,
      details.earlyWithdrawalAllowed,
      details.earlyWithdrawalPenaltyRate || null,
      details.noticePeriodDays || null,
      details.depositInsuranceCovered,
      details.insuranceAmount || null,
      details.specialFeatures ? JSON.stringify(details.specialFeatures) : null
    ];

    const result = await this.db.prisma.$queryRawUnsafe(query, ...values) as any[];
    return this.mapRowToDepositDetails(result[0]);
  }

  /**
   * 获取存款产品详情
   */
  async getDepositDetails(assetId: string): Promise<DepositDetails | null> {
    const query = `
      SELECT * FROM finapp.deposit_details WHERE asset_id = $1::uuid
    `;

    const result = await this.db.prisma.$queryRawUnsafe(query, assetId) as any[];
    return result.length > 0 ? this.mapRowToDepositDetails(result[0]) : null;
  }

  /**
   * 更新存款产品详情
   */
  async updateDepositDetails(assetId: string, updates: Partial<DepositDetails>): Promise<DepositDetails | null> {
    // 首先检查记录是否存在
    const existing = await this.getDepositDetails(assetId);
    if (!existing) {
      return null;
    }

    // 构建更新字段
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.depositType !== undefined) {
      updateFields.push(`deposit_type = $${paramIndex++}`);
      values.push(updates.depositType);
    }
    if (updates.bankName !== undefined) {
      updateFields.push(`bank_name = $${paramIndex++}`);
      values.push(updates.bankName);
    }
    if (updates.accountNumber !== undefined) {
      updateFields.push(`account_number = $${paramIndex++}`);
      values.push(updates.accountNumber);
    }
    if (updates.branchName !== undefined) {
      updateFields.push(`branch_name = $${paramIndex++}`);
      values.push(updates.branchName);
    }
    if (updates.interestRate !== undefined) {
      updateFields.push(`interest_rate = $${paramIndex++}`);
      values.push(updates.interestRate);
    }
    if (updates.rateType !== undefined) {
      updateFields.push(`rate_type = $${paramIndex++}`);
      values.push(updates.rateType);
    }
    if (updates.compoundFrequency !== undefined) {
      updateFields.push(`compound_frequency = $${paramIndex++}`);
      values.push(updates.compoundFrequency);
    }
    if (updates.termMonths !== undefined) {
      updateFields.push(`term_months = $${paramIndex++}`);
      values.push(updates.termMonths);
    }
    if (updates.startDate !== undefined) {
      updateFields.push(`start_date = $${paramIndex++}::date`);
      values.push(updates.startDate);
    }
    if (updates.maturityDate !== undefined) {
      updateFields.push(`maturity_date = $${paramIndex++}::date`);
      values.push(updates.maturityDate);
    }
    if (updates.autoRenewal !== undefined) {
      updateFields.push(`auto_renewal = $${paramIndex++}`);
      values.push(updates.autoRenewal);
    }
    if (updates.minDepositAmount !== undefined) {
      updateFields.push(`min_deposit_amount = $${paramIndex++}`);
      values.push(updates.minDepositAmount);
    }
    if (updates.maxDepositAmount !== undefined) {
      updateFields.push(`max_deposit_amount = $${paramIndex++}`);
      values.push(updates.maxDepositAmount);
    }
    if (updates.depositIncrement !== undefined) {
      updateFields.push(`deposit_increment = $${paramIndex++}`);
      values.push(updates.depositIncrement);
    }
    if (updates.earlyWithdrawalAllowed !== undefined) {
      updateFields.push(`early_withdrawal_allowed = $${paramIndex++}`);
      values.push(updates.earlyWithdrawalAllowed);
    }
    if (updates.earlyWithdrawalPenaltyRate !== undefined) {
      updateFields.push(`early_withdrawal_penalty_rate = $${paramIndex++}`);
      values.push(updates.earlyWithdrawalPenaltyRate);
    }
    if (updates.noticePeriodDays !== undefined) {
      updateFields.push(`notice_period_days = $${paramIndex++}`);
      values.push(updates.noticePeriodDays);
    }
    if (updates.depositInsuranceCovered !== undefined) {
      updateFields.push(`deposit_insurance_covered = $${paramIndex++}`);
      values.push(updates.depositInsuranceCovered);
    }
    if (updates.insuranceAmount !== undefined) {
      updateFields.push(`insurance_amount = $${paramIndex++}`);
      values.push(updates.insuranceAmount);
    }
    if (updates.specialFeatures !== undefined) {
      updateFields.push(`special_features = $${paramIndex++}::jsonb`);
      values.push(updates.specialFeatures ? JSON.stringify(updates.specialFeatures) : null);
    }

    // 如果没有任何更新字段，直接返回现有数据
    if (updateFields.length === 0) {
      return existing;
    }

    // 添加 updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // 添加 assetId 作为 WHERE 条件
    values.push(assetId);

    const query = `
      UPDATE finapp.deposit_details 
      SET ${updateFields.join(', ')}
      WHERE asset_id = $${paramIndex}::uuid
      RETURNING *
    `;

    const result = await this.db.prisma.$queryRawUnsafe(query, ...values) as any[];
    return result.length > 0 ? this.mapRowToDepositDetails(result[0]) : null;
  }

  /**
   * 获取用户的存款持仓列表
   */
  async getUserDepositPositions(userId: string, portfolioId?: string): Promise<DepositPosition[]> {
    let whereClause = 'WHERE p.user_id = $1::uuid AND at.code = \'DEPOSIT\'';
    const params: any[] = [userId];

    if (portfolioId) {
      whereClause += ' AND pos.portfolio_id = $2::uuid';
      params.push(portfolioId);
    }

    const query = `
      SELECT 
        pos.id as position_id,
        pos.asset_id,
        a.name as product_name,
        dd.bank_name,
        dd.deposit_type,
        COALESCE(pos.balance, pos.total_cost) as current_balance,
        pos.total_cost as principal_amount,
        COALESCE(pos.balance, pos.total_cost) - pos.total_cost as accrued_interest,
        dd.interest_rate,
        dd.term_months,
        dd.start_date,
        dd.maturity_date,
        CASE 
          WHEN dd.maturity_date IS NOT NULL THEN 
            (dd.maturity_date - CURRENT_DATE)::integer
          ELSE NULL 
        END as days_to_maturity,
        dd.auto_renewal,
        dd.early_withdrawal_allowed,
        CASE 
          WHEN dd.compound_frequency = 'DAILY' THEN 
            (POWER(1 + dd.interest_rate/365, 365) - 1) * 100
          WHEN dd.compound_frequency = 'MONTHLY' THEN 
            (POWER(1 + dd.interest_rate/12, 12) - 1) * 100
          WHEN dd.compound_frequency = 'QUARTERLY' THEN 
            (POWER(1 + dd.interest_rate/4, 4) - 1) * 100
          ELSE dd.interest_rate * 100
        END as effective_annual_rate
      FROM finapp.positions pos
      JOIN finapp.portfolios p ON pos.portfolio_id = p.id
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.asset_types at ON a.asset_type_id = at.id
      JOIN finapp.deposit_details dd ON a.id = dd.asset_id
      ${whereClause}
      ORDER BY dd.bank_name, a.name
    `;

    const result = await this.db.prisma.$queryRawUnsafe(query, ...params) as any[];
    return result.map(row => this.mapRowToDepositPosition(row));
  }

  /**
   * 计算存款利息
   */
  async calculateInterest(
    positionId: string,
    calculationDate: Date,
    calculationMethod: 'ACTUAL_365' | 'ACTUAL_360' | '30_360' = 'ACTUAL_365'
  ): Promise<InterestCalculation | null> {
    // 获取持仓信息
    const positionQuery = `
      SELECT 
        pos.id,
        pos.balance,
        pos.total_cost,
        dd.interest_rate,
        dd.compound_frequency,
        dd.start_date,
        pos.created_at
      FROM finapp.positions pos
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.deposit_details dd ON a.id = dd.asset_id
      WHERE pos.id = $1::uuid
    `;

    const positionResult = await this.db.prisma.$queryRawUnsafe(positionQuery, positionId) as any[];
    if (positionResult.length === 0) {
      return null;
    }

    const position = positionResult[0];
    const principalAmount = parseFloat(position.balance) || parseFloat(position.total_cost);
    const interestRate = parseFloat(position.interest_rate);
    const startDate = position.start_date || position.created_at;

    // 计算天数
    const startTime = new Date(startDate).getTime();
    const endTime = calculationDate.getTime();
    const actualDays = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));

    // 根据计息方法确定年天数
    let yearDays: number;
    switch (calculationMethod) {
      case 'ACTUAL_360':
        yearDays = 360;
        break;
      case '30_360':
        yearDays = 360;
        break;
      default:
        yearDays = 365;
    }

    // 计算利息
    const dailyRate = interestRate / yearDays;
    const interestAmount = principalAmount * dailyRate * actualDays;

    return {
      positionId,
      calculationDate,
      principalAmount,
      interestRate,
      daysCount: actualDays,
      interestAmount,
      calculationMethod
    };
  }

  /**
   * 记录利息计算结果
   */
  async recordInterestCalculation(calculation: InterestCalculation): Promise<string> {
    const query = `
      INSERT INTO finapp.deposit_interest_records (
        position_id, asset_id, calculation_date, principal_amount,
        interest_rate, days_count, interest_amount, calculation_method,
        compound_frequency, status
      )
      SELECT 
        $1::uuid, pos.asset_id, $2::date, $3::numeric, $4::numeric,
        $5::integer, $6::numeric, $7, dd.compound_frequency, 'CALCULATED'
      FROM finapp.positions pos
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.deposit_details dd ON a.id = dd.asset_id
      WHERE pos.id = $1::uuid
      RETURNING id
    `;

    const values = [
      calculation.positionId,
      calculation.calculationDate,
      calculation.principalAmount,
      calculation.interestRate,
      calculation.daysCount,
      calculation.interestAmount,
      calculation.calculationMethod
    ];

    const result = await this.db.prisma.$queryRawUnsafe(query, ...values) as any[];
    return result[0].id;
  }

  /**
   * 创建到期提醒
   */
  async createMaturityAlert(alert: MaturityAlert): Promise<string> {
    const query = `
      INSERT INTO finapp.deposit_maturity_alerts (
        position_id, asset_id, user_id, maturity_date, principal_amount,
        estimated_interest, alert_days_before, alert_date, renewal_option,
        new_term_months, status
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, $4::date, $5::numeric, $6::numeric,
        $7::integer, $8::date, $9, $10::integer, $11
      ) RETURNING id
    `;

    const values = [
      alert.positionId,
      alert.assetId,
      alert.userId,
      alert.maturityDate,
      alert.principalAmount,
      alert.estimatedInterest || null,
      alert.alertDaysBefore,
      alert.alertDate,
      alert.renewalOption,
      alert.newTermMonths || null,
      alert.status
    ];

    const result = await this.db.prisma.$queryRawUnsafe(query, ...values) as any[];
    return result[0].id;
  }

  /**
   * 获取即将到期的存款
   */
  async getUpcomingMaturityDeposits(userId: string, daysAhead: number = 30): Promise<DepositPosition[]> {
    const query = `
      SELECT 
        pos.id as position_id,
        pos.asset_id,
        a.name as product_name,
        dd.bank_name,
        dd.deposit_type,
        COALESCE(pos.balance, pos.total_cost) as current_balance,
        pos.total_cost as principal_amount,
        COALESCE(pos.balance, pos.total_cost) - pos.total_cost as accrued_interest,
        dd.interest_rate,
        dd.term_months,
        dd.start_date,
        dd.maturity_date,
        (dd.maturity_date - CURRENT_DATE)::integer as days_to_maturity,
        dd.auto_renewal,
        dd.early_withdrawal_allowed,
        dd.interest_rate * 100 as effective_annual_rate
      FROM finapp.positions pos
      JOIN finapp.portfolios p ON pos.portfolio_id = p.id
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.asset_types at ON a.asset_type_id = at.id
      JOIN finapp.deposit_details dd ON a.id = dd.asset_id
      WHERE p.user_id = $1::uuid 
        AND at.code = 'DEPOSIT'
        AND dd.maturity_date IS NOT NULL
        AND dd.maturity_date <= CURRENT_DATE + INTERVAL '$2 days'
        AND dd.maturity_date >= CURRENT_DATE
      ORDER BY dd.maturity_date ASC
    `;

    const result = await this.db.prisma.$queryRawUnsafe(query, userId, daysAhead) as any[];
    return result.map(row => this.mapRowToDepositPosition(row));
  }

  /**
   * 处理定期存款到期
   */
  async processMaturity(
    positionId: string,
    action: 'RENEW' | 'TRANSFER_TO_DEMAND' | 'WITHDRAW',
    newTermMonths?: number
  ): Promise<void> {
    await this.db.prisma.$transaction(async (tx) => {
      // 获取当前持仓信息
      const positionQuery = `
        SELECT pos.*, dd.* 
        FROM finapp.positions pos
        JOIN finapp.assets a ON pos.asset_id = a.id
        JOIN finapp.deposit_details dd ON a.id = dd.asset_id
        WHERE pos.id = $1::uuid
      `;
      
      const positionResult = await tx.$queryRawUnsafe(positionQuery, positionId) as any[];
      if (positionResult.length === 0) {
        throw new Error('Position not found');
      }

      const position = positionResult[0];
      const currentBalance = parseFloat(position.balance) || 0;

      switch (action) {
        case 'RENEW':
          // 续存：更新到期日
          if (newTermMonths) {
            const newMaturityDate = new Date();
            newMaturityDate.setMonth(newMaturityDate.getMonth() + newTermMonths);
            
            await tx.$queryRawUnsafe(`
              UPDATE finapp.deposit_details 
              SET maturity_date = $1::date, term_months = $2, start_date = CURRENT_DATE
              WHERE asset_id = $3::uuid
            `, newMaturityDate, newTermMonths, position.asset_id);
          }
          break;

        case 'TRANSFER_TO_DEMAND':
          // 转为活期：更新存款类型
          await tx.$queryRawUnsafe(`
            UPDATE finapp.deposit_details 
            SET deposit_type = 'DEMAND', maturity_date = NULL, term_months = NULL,
                compound_frequency = 'DAILY'
            WHERE asset_id = $1::uuid
          `, position.asset_id);
          break;

        case 'WITHDRAW':
          // 取出：删除持仓
          await tx.$queryRawUnsafe(`
            DELETE FROM finapp.positions WHERE id = $1::uuid
          `, positionId);
          
          // 记录取款交易
          await tx.$queryRawUnsafe(`
            INSERT INTO finapp.transactions (
              portfolio_id, asset_id, transaction_type, quantity, price, 
              total_amount, executed_at, notes
            ) VALUES (
              $1::uuid, $2::uuid, 'WITHDRAWAL', $3::numeric, 1.0, $3::numeric,
              CURRENT_TIMESTAMP, '定期存款到期取出'
            )
          `, position.portfolio_id, position.asset_id, currentBalance);
          break;
      }

      // 更新提醒状态
      await tx.$queryRawUnsafe(`
        UPDATE finapp.deposit_maturity_alerts 
        SET status = 'PROCESSED', processed_at = CURRENT_TIMESTAMP
        WHERE position_id = $1::uuid AND status = 'PENDING'
      `, positionId);
    });
  }

  /**
   * 映射数据库行到存款详情对象
   */
  private mapRowToDepositDetails(row: any): DepositDetails {
    return {
      id: row.id,
      assetId: row.asset_id,
      depositType: row.deposit_type,
      bankName: row.bank_name,
      accountNumber: row.account_number,
      branchName: row.branch_name,
      interestRate: parseFloat(row.interest_rate),
      rateType: row.rate_type,
      compoundFrequency: row.compound_frequency,
      termMonths: row.term_months,
      startDate: row.start_date,
      maturityDate: row.maturity_date,
      autoRenewal: row.auto_renewal,
      minDepositAmount: row.min_deposit_amount ? parseFloat(row.min_deposit_amount) : undefined,
      maxDepositAmount: row.max_deposit_amount ? parseFloat(row.max_deposit_amount) : undefined,
      depositIncrement: row.deposit_increment ? parseFloat(row.deposit_increment) : undefined,
      earlyWithdrawalAllowed: row.early_withdrawal_allowed,
      earlyWithdrawalPenaltyRate: row.early_withdrawal_penalty_rate ? parseFloat(row.early_withdrawal_penalty_rate) : undefined,
      noticePeriodDays: row.notice_period_days,
      depositInsuranceCovered: row.deposit_insurance_covered,
      insuranceAmount: row.insurance_amount ? parseFloat(row.insurance_amount) : undefined,
      specialFeatures: row.special_features
    };
  }

  /**
   * 映射数据库行到存款持仓对象
   */
  private mapRowToDepositPosition(row: any): DepositPosition {
    return {
      positionId: row.position_id,
      assetId: row.asset_id,
      productName: row.product_name,
      bankName: row.bank_name,
      depositType: row.deposit_type,
      currentBalance: parseFloat(row.current_balance) || 0,
      principalAmount: parseFloat(row.principal_amount) || 0,
      accruedInterest: parseFloat(row.accrued_interest) || 0,
      interestRate: parseFloat(row.interest_rate),
      termMonths: row.term_months,
      startDate: row.start_date,
      maturityDate: row.maturity_date,
      daysToMaturity: row.days_to_maturity ? parseInt(row.days_to_maturity) : undefined,
      autoRenewal: row.auto_renewal,
      earlyWithdrawalAllowed: row.early_withdrawal_allowed,
      effectiveAnnualRate: parseFloat(row.effective_annual_rate) || 0
    };
  }
}