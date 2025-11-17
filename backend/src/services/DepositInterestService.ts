import { DatabaseService } from './DatabaseService';

export interface InterestCalculationConfig {
  calculationMethod: 'ACTUAL_365' | 'ACTUAL_360' | '30_360';
  compoundFrequency: 'DAILY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'MATURITY';
  roundingMethod: 'ROUND' | 'FLOOR' | 'CEIL';
  decimalPlaces: number;
}

export interface InterestCalculationResult {
  positionId: string;
  calculationDate: Date;
  principalAmount: number;
  interestRate: number;
  daysCount: number;
  simpleInterest: number;
  compoundInterest: number;
  accruedInterest: number;
  totalAmount: number;
  effectiveRate: number;
}

export interface InterestPaymentRecord {
  id: string;
  positionId: string;
  paymentDate: Date;
  interestAmount: number;
  principalAmount: number;
  paymentType: 'ACCRUAL' | 'PAYMENT' | 'CAPITALIZATION';
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

export class DepositInterestService {
  constructor(private db: DatabaseService) {}

  /**
   * 计算存款利息（支持多种计息方法）
   */
  async calculateInterest(
    positionId: string,
    calculationDate: Date,
    config: InterestCalculationConfig = {
      calculationMethod: 'ACTUAL_365',
      compoundFrequency: 'MATURITY',
      roundingMethod: 'ROUND',
      decimalPlaces: 2
    }
  ): Promise<InterestCalculationResult | null> {
    // 获取持仓和存款详情
    const positionQuery = `
      SELECT 
        pos.id,
        pos.balance,
        pos.total_cost,
        pos.created_at,
        dd.interest_rate,
        dd.compound_frequency,
        dd.start_date,
        dd.maturity_date,
        dd.deposit_type,
        a.name as product_name
      FROM finapp.positions pos
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.deposit_details dd ON a.id = dd.asset_id
      WHERE pos.id = $1::uuid
    `;

    const result = await this.db.prisma.$queryRawUnsafe(positionQuery, positionId) as any[];
    if (result.length === 0) {
      return null;
    }

    const position = result[0];
    const principalAmount = parseFloat(position.balance) || parseFloat(position.total_cost);
    const interestRate = parseFloat(position.interest_rate);
    const startDate = new Date(position.start_date || position.created_at);
    const compoundFreq = config.compoundFrequency || position.compound_frequency;

    // 计算天数
    const { actualDays, yearDays } = this.calculateDays(startDate, calculationDate, config.calculationMethod);

    // 计算单利
    const simpleInterest = this.calculateSimpleInterest(principalAmount, interestRate, actualDays, yearDays);

    // 计算复利
    const compoundInterest = this.calculateCompoundInterest(
      principalAmount,
      interestRate,
      actualDays,
      yearDays,
      compoundFreq
    );

    // 获取已计利息
    const accruedInterest = await this.getAccruedInterest(positionId, calculationDate);

    // 计算实际利息（根据复利频率选择）
    const actualInterest = compoundFreq === 'MATURITY' ? simpleInterest : compoundInterest;
    const totalAmount = principalAmount + actualInterest;
    const effectiveRate = actualInterest / principalAmount;

    // 应用舍入规则
    const roundedInterest = this.applyRounding(actualInterest, config.roundingMethod, config.decimalPlaces);

    return {
      positionId,
      calculationDate,
      principalAmount,
      interestRate,
      daysCount: actualDays,
      simpleInterest: this.applyRounding(simpleInterest, config.roundingMethod, config.decimalPlaces),
      compoundInterest: this.applyRounding(compoundInterest, config.roundingMethod, config.decimalPlaces),
      accruedInterest,
      totalAmount: principalAmount + roundedInterest,
      effectiveRate
    };
  }

  /**
   * 批量计算多个存款的利息
   */
  async batchCalculateInterest(
    userId: string,
    calculationDate: Date,
    config?: InterestCalculationConfig
  ): Promise<InterestCalculationResult[]> {
    // 获取用户所有存款持仓
    const positionsQuery = `
      SELECT pos.id as position_id
      FROM finapp.positions pos
      JOIN finapp.portfolios p ON pos.portfolio_id = p.id
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.asset_types at ON a.asset_type_id = at.id
      WHERE p.user_id = $1::uuid AND at.code = 'DEPOSIT'
    `;

    const positions = await this.db.prisma.$queryRawUnsafe(positionsQuery, userId) as any[];
    
    const results: InterestCalculationResult[] = [];
    
    for (const position of positions) {
      const result = await this.calculateInterest(position.position_id, calculationDate, config);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 记录利息计算结果
   */
  async recordInterestCalculation(result: InterestCalculationResult): Promise<string> {
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
      result.positionId,
      result.calculationDate,
      result.principalAmount,
      result.interestRate,
      result.daysCount,
      result.compoundInterest, // 使用复利结果
      'ACTUAL_365' // 默认计息方法
    ];

    const recordResult = await this.db.prisma.$queryRawUnsafe(query, ...values) as any[];
    return recordResult[0].id;
  }

  /**
   * 支付利息（更新持仓余额）
   */
  async payInterest(
    positionId: string,
    interestAmount: number,
    paymentDate: Date,
    paymentType: 'ACCRUAL' | 'PAYMENT' | 'CAPITALIZATION' = 'PAYMENT'
  ): Promise<void> {
    await this.db.prisma.$transaction(async (tx) => {
      // 更新持仓余额
      await tx.$queryRawUnsafe(`
        UPDATE finapp.positions 
        SET balance = COALESCE(balance, total_cost) + $1::numeric,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2::uuid
      `, interestAmount, positionId);

      // 记录利息支付
      await tx.$queryRawUnsafe(`
        INSERT INTO finapp.deposit_interest_records (
          position_id, asset_id, calculation_date, principal_amount,
          interest_rate, days_count, interest_amount, calculation_method,
          compound_frequency, status, payment_date
        )
        SELECT 
          pos.id, pos.asset_id, $1::date, COALESCE(pos.balance, pos.total_cost),
          dd.interest_rate, 1, $2::numeric, 'ACTUAL_365',
          dd.compound_frequency, 'PAID', $1::date
        FROM finapp.positions pos
        JOIN finapp.assets a ON pos.asset_id = a.id
        JOIN finapp.deposit_details dd ON a.id = dd.asset_id
        WHERE pos.id = $3::uuid
      `, paymentDate, interestAmount, positionId);

      // 记录交易（利息收入）
      await tx.$queryRawUnsafe(`
        INSERT INTO finapp.transactions (
          portfolio_id, asset_id, transaction_type, quantity, price,
          total_amount, executed_at, notes
        )
        SELECT 
          pos.portfolio_id, pos.asset_id, 'INTEREST', $1::numeric, 1.0,
          $1::numeric, $2::timestamp, '利息收入'
        FROM finapp.positions pos
        WHERE pos.id = $3::uuid
      `, interestAmount, paymentDate, positionId);
    });
  }

  /**
   * 获取利息支付历史
   */
  async getInterestPaymentHistory(
    positionId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<InterestPaymentRecord[]> {
    let whereClause = 'WHERE position_id = $1::uuid AND status = \'PAID\'';
    const params: any[] = [positionId];

    if (startDate) {
      whereClause += ` AND payment_date >= $${params.length + 1}::date`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND payment_date <= $${params.length + 1}::date`;
      params.push(endDate);
    }

    const query = `
      SELECT 
        id,
        position_id,
        payment_date,
        interest_amount,
        principal_amount,
        'PAYMENT' as payment_type,
        status
      FROM finapp.deposit_interest_records
      ${whereClause}
      ORDER BY payment_date DESC
    `;

    const result = await this.db.prisma.$queryRawUnsafe(query, ...params) as any[];
    
    return result.map(row => ({
      id: row.id,
      positionId: row.position_id,
      paymentDate: new Date(row.payment_date),
      interestAmount: parseFloat(row.interest_amount),
      principalAmount: parseFloat(row.principal_amount),
      paymentType: row.payment_type,
      status: row.status
    }));
  }

  /**
   * 自动计息任务（定期执行）
   */
  async runDailyInterestAccrual(): Promise<void> {
    const today = new Date();
    
    // 获取所有活期存款（需要每日计息）
    const demandDepositsQuery = `
      SELECT pos.id as position_id
      FROM finapp.positions pos
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.asset_types at ON a.asset_type_id = at.id
      JOIN finapp.deposit_details dd ON a.id = dd.asset_id
      WHERE at.code = 'DEPOSIT'
        AND dd.deposit_type = 'DEMAND'
        AND dd.compound_frequency = 'DAILY'
    `;

    const demandDeposits = await this.db.prisma.$queryRawUnsafe(demandDepositsQuery) as any[];

    for (const deposit of demandDeposits) {
      try {
        const result = await this.calculateInterest(deposit.position_id, today);
        if (result && result.compoundInterest > 0) {
          // 计算日利息
          const dailyInterest = result.compoundInterest / result.daysCount;
          
          // 记录利息计提
          await this.recordInterestCalculation(result);
          
          console.log(`Daily interest accrued for position ${deposit.position_id}: ${dailyInterest}`);
        }
      } catch (error) {
        console.error(`Failed to accrue interest for position ${deposit.position_id}:`, error);
      }
    }
  }

  /**
   * 计算天数（支持不同的计息方法）
   */
  private calculateDays(
    startDate: Date,
    endDate: Date,
    method: 'ACTUAL_365' | 'ACTUAL_360' | '30_360'
  ): { actualDays: number; yearDays: number } {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    let actualDays: number;
    let yearDays: number;

    switch (method) {
      case 'ACTUAL_360':
        actualDays = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));
        yearDays = 360;
        break;
      case '30_360':
        // 30/360 方法：每月按30天计算
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();
        const startDay = Math.min(startDate.getDate(), 30);
        
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth();
        const endDay = Math.min(endDate.getDate(), 30);
        
        actualDays = (endYear - startYear) * 360 + (endMonth - startMonth) * 30 + (endDay - startDay);
        yearDays = 360;
        break;
      default: // ACTUAL_365
        actualDays = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));
        yearDays = 365;
    }

    return { actualDays, yearDays };
  }

  /**
   * 计算单利
   */
  private calculateSimpleInterest(
    principal: number,
    rate: number,
    days: number,
    yearDays: number
  ): number {
    return principal * rate * days / yearDays;
  }

  /**
   * 计算复利
   */
  private calculateCompoundInterest(
    principal: number,
    rate: number,
    days: number,
    yearDays: number,
    frequency: string
  ): number {
    let periodsPerYear: number;
    
    switch (frequency) {
      case 'DAILY':
        periodsPerYear = yearDays;
        break;
      case 'MONTHLY':
        periodsPerYear = 12;
        break;
      case 'QUARTERLY':
        periodsPerYear = 4;
        break;
      case 'ANNUALLY':
        periodsPerYear = 1;
        break;
      default: // MATURITY
        return this.calculateSimpleInterest(principal, rate, days, yearDays);
    }

    const periodsElapsed = days / (yearDays / periodsPerYear);
    const compoundAmount = principal * Math.pow(1 + rate / periodsPerYear, periodsElapsed);
    
    return compoundAmount - principal;
  }

  /**
   * 获取已计利息
   */
  private async getAccruedInterest(positionId: string, calculationDate: Date): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(interest_amount), 0) as accrued_interest
      FROM finapp.deposit_interest_records
      WHERE position_id = $1::uuid 
        AND calculation_date <= $2::date
        AND status IN ('CALCULATED', 'PAID')
    `;

    const result = await this.db.prisma.$queryRawUnsafe(query, positionId, calculationDate) as any[];
    return parseFloat(result[0]?.accrued_interest) || 0;
  }

  /**
   * 应用舍入规则
   */
  private applyRounding(value: number, method: 'ROUND' | 'FLOOR' | 'CEIL', decimalPlaces: number): number {
    const multiplier = Math.pow(10, decimalPlaces);
    
    switch (method) {
      case 'FLOOR':
        return Math.floor(value * multiplier) / multiplier;
      case 'CEIL':
        return Math.ceil(value * multiplier) / multiplier;
      default: // ROUND
        return Math.round(value * multiplier) / multiplier;
    }
  }
}