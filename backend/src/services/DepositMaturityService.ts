import { DatabaseService } from './DatabaseService';
import { DepositService, MaturityAlert } from './DepositService';

export interface MaturityNotification {
  id: string;
  userId: string;
  positionId: string;
  productName: string;
  bankName: string;
  principalAmount: number;
  estimatedInterest: number;
  maturityDate: Date;
  daysToMaturity: number;
  autoRenewal: boolean;
  renewalOption: string;
}

export class DepositMaturityService {
  constructor(
    private db: DatabaseService,
    private depositService: DepositService
  ) {}

  /**
   * 扫描即将到期的存款并创建提醒
   */
  async scanUpcomingMaturityDeposits(daysAhead: number = 30): Promise<MaturityAlert[]> {
    const query = `
      SELECT 
        pos.id as position_id,
        pos.asset_id,
        pos.portfolio_id,
        p.user_id,
        a.name as product_name,
        dd.bank_name,
        dd.maturity_date,
        COALESCE(pos.balance, pos.total_cost) as principal_amount,
        dd.interest_rate,
        dd.auto_renewal,
        EXTRACT(DAYS FROM dd.maturity_date - CURRENT_DATE) as days_to_maturity
      FROM finapp.positions pos
      JOIN finapp.portfolios p ON pos.portfolio_id = p.id
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.asset_types at ON a.asset_type_id = at.id
      JOIN finapp.deposit_details dd ON a.id = dd.asset_id
      WHERE at.code = 'DEPOSIT'
        AND dd.deposit_type = 'TIME'
        AND dd.maturity_date IS NOT NULL
        AND dd.maturity_date <= CURRENT_DATE + INTERVAL '$1 days'
        AND dd.maturity_date > CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1 FROM finapp.deposit_maturity_alerts dma 
          WHERE dma.position_id = pos.id 
            AND dma.status IN ('PENDING', 'NOTIFIED')
        )
      ORDER BY dd.maturity_date ASC
    `;

    const result = await this.db.prisma.$queryRawUnsafe(query, daysAhead) as any[];
    
    const alerts: MaturityAlert[] = [];
    
    for (const row of result) {
      const daysToMaturity = parseInt(row.days_to_maturity);
      const alertDaysBefore = this.calculateAlertDaysBefore(daysToMaturity);
      const alertDate = new Date();
      alertDate.setDate(alertDate.getDate() + (daysToMaturity - alertDaysBefore));

      // 估算利息
      const estimatedInterest = await this.estimateInterest(
        parseFloat(row.principal_amount),
        parseFloat(row.interest_rate),
        row.maturity_date
      );

      const alert: MaturityAlert = {
        positionId: row.position_id,
        assetId: row.asset_id,
        userId: row.user_id,
        maturityDate: new Date(row.maturity_date),
        principalAmount: parseFloat(row.principal_amount),
        estimatedInterest,
        alertDaysBefore,
        alertDate,
        renewalOption: row.auto_renewal ? 'AUTO' : 'MANUAL',
        status: 'PENDING'
      };

      const alertId = await this.depositService.createMaturityAlert(alert);
      alerts.push({ ...alert, id: alertId });
    }

    return alerts;
  }

  /**
   * 获取需要发送通知的到期提醒
   */
  async getPendingNotifications(): Promise<MaturityNotification[]> {
    const query = `
      SELECT 
        dma.id,
        dma.user_id,
        dma.position_id,
        a.name as product_name,
        dd.bank_name,
        dma.principal_amount,
        dma.estimated_interest,
        dma.maturity_date,
        EXTRACT(DAYS FROM dma.maturity_date - CURRENT_DATE) as days_to_maturity,
        dd.auto_renewal,
        dma.renewal_option
      FROM finapp.deposit_maturity_alerts dma
      JOIN finapp.positions pos ON dma.position_id = pos.id
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.deposit_details dd ON a.id = dd.asset_id
      WHERE dma.status = 'PENDING'
        AND dma.alert_date <= CURRENT_DATE
      ORDER BY dma.maturity_date ASC
    `;

    const result = await this.db.prisma.$queryRawUnsafe(query) as any[];
    
    return result.map(row => ({
      id: row.id,
      userId: row.user_id,
      positionId: row.position_id,
      productName: row.product_name,
      bankName: row.bank_name,
      principalAmount: parseFloat(row.principal_amount),
      estimatedInterest: parseFloat(row.estimated_interest) || 0,
      maturityDate: new Date(row.maturity_date),
      daysToMaturity: parseInt(row.days_to_maturity),
      autoRenewal: row.auto_renewal,
      renewalOption: row.renewal_option
    }));
  }

  /**
   * 标记通知已发送
   */
  async markNotificationSent(alertId: string): Promise<void> {
    await this.db.prisma.$queryRawUnsafe(`
      UPDATE finapp.deposit_maturity_alerts 
      SET status = 'NOTIFIED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::uuid
    `, alertId);
  }

  /**
   * 自动处理到期存款
   */
  async processAutoMaturityDeposits(): Promise<void> {
    // 获取今天到期且设置为自动续存的存款
    const query = `
      SELECT 
        pos.id as position_id,
        dma.id as alert_id,
        dma.renewal_option,
        dma.new_term_months,
        dd.term_months as original_term_months
      FROM finapp.deposit_maturity_alerts dma
      JOIN finapp.positions pos ON dma.position_id = pos.id
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.deposit_details dd ON a.id = dd.asset_id
      WHERE dma.maturity_date = CURRENT_DATE
        AND dma.renewal_option = 'AUTO'
        AND dma.status IN ('PENDING', 'NOTIFIED')
    `;

    const result = await this.db.prisma.$queryRawUnsafe(query) as any[];

    for (const row of result) {
      try {
        const newTermMonths = row.new_term_months || row.original_term_months;
        
        await this.depositService.processMaturity(
          row.position_id,
          'RENEW',
          newTermMonths
        );

        // 标记提醒已处理
        await this.db.prisma.$queryRawUnsafe(`
          UPDATE finapp.deposit_maturity_alerts 
          SET status = 'PROCESSED', processed_at = CURRENT_TIMESTAMP
          WHERE id = $1::uuid
        `, row.alert_id);

        console.log(`Auto-renewed deposit position ${row.position_id} for ${newTermMonths} months`);
      } catch (error) {
        console.error(`Failed to auto-renew deposit position ${row.position_id}:`, error);
        
        // 标记为需要手动处理
        await this.db.prisma.$queryRawUnsafe(`
          UPDATE finapp.deposit_maturity_alerts 
          SET renewal_option = 'MANUAL', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1::uuid
        `, row.alert_id);
      }
    }
  }

  /**
   * 获取到期存款报告
   */
  async getMaturityReport(userId: string, startDate: Date, endDate: Date): Promise<any> {
    const query = `
      SELECT 
        dd.bank_name,
        a.name as product_name,
        dd.deposit_type,
        dd.maturity_date,
        COALESCE(pos.balance, pos.total_cost) as principal_amount,
        dd.interest_rate,
        dd.auto_renewal,
        dma.renewal_option,
        dma.status as alert_status,
        CASE 
          WHEN dd.maturity_date < CURRENT_DATE THEN 'OVERDUE'
          WHEN dd.maturity_date = CURRENT_DATE THEN 'DUE_TODAY'
          WHEN dd.maturity_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'DUE_SOON'
          ELSE 'FUTURE'
        END as maturity_status
      FROM finapp.positions pos
      JOIN finapp.portfolios p ON pos.portfolio_id = p.id
      JOIN finapp.assets a ON pos.asset_id = a.id
      JOIN finapp.asset_types at ON a.asset_type_id = at.id
      JOIN finapp.deposit_details dd ON a.id = dd.asset_id
      LEFT JOIN finapp.deposit_maturity_alerts dma ON pos.id = dma.position_id
      WHERE p.user_id = $1::uuid
        AND at.code = 'DEPOSIT'
        AND dd.deposit_type = 'TIME'
        AND dd.maturity_date BETWEEN $2::date AND $3::date
      ORDER BY dd.maturity_date ASC
    `;

    const result = await this.db.prisma.$queryRawUnsafe(query, userId, startDate, endDate) as any[];

    // 统计信息
    const summary = {
      totalDeposits: result.length,
      totalAmount: result.reduce((sum, row) => sum + parseFloat(row.principal_amount), 0),
      overdueCount: result.filter(row => row.maturity_status === 'OVERDUE').length,
      dueTodayCount: result.filter(row => row.maturity_status === 'DUE_TODAY').length,
      dueSoonCount: result.filter(row => row.maturity_status === 'DUE_SOON').length,
      autoRenewalCount: result.filter(row => row.auto_renewal).length
    };

    return {
      summary,
      deposits: result.map(row => ({
        bankName: row.bank_name,
        productName: row.product_name,
        depositType: row.deposit_type,
        maturityDate: row.maturity_date,
        principalAmount: parseFloat(row.principal_amount),
        interestRate: parseFloat(row.interest_rate),
        autoRenewal: row.auto_renewal,
        renewalOption: row.renewal_option,
        alertStatus: row.alert_status,
        maturityStatus: row.maturity_status
      }))
    };
  }

  /**
   * 批量更新到期处理选项
   */
  async batchUpdateMaturityOptions(
    userId: string,
    updates: Array<{
      positionId: string;
      renewalOption: 'AUTO' | 'MANUAL' | 'TRANSFER_TO_DEMAND';
      newTermMonths?: number;
    }>
  ): Promise<void> {
    await this.db.prisma.$transaction(async (tx) => {
      for (const update of updates) {
        // 验证用户权限
        const ownershipCheck = await tx.$queryRawUnsafe(`
          SELECT 1 FROM finapp.positions pos
          JOIN finapp.portfolios p ON pos.portfolio_id = p.id
          WHERE pos.id = $1::uuid AND p.user_id = $2::uuid
        `, update.positionId, userId);

        if ((ownershipCheck as any[]).length === 0) {
          throw new Error(`Unauthorized access to position ${update.positionId}`);
        }

        // 更新到期提醒设置
        await tx.$queryRawUnsafe(`
          UPDATE finapp.deposit_maturity_alerts 
          SET renewal_option = $1, new_term_months = $2, updated_at = CURRENT_TIMESTAMP
          WHERE position_id = $3::uuid AND status IN ('PENDING', 'NOTIFIED')
        `, update.renewalOption, update.newTermMonths || null, update.positionId);
      }
    });
  }

  /**
   * 计算提醒提前天数
   */
  private calculateAlertDaysBefore(daysToMaturity: number): number {
    if (daysToMaturity <= 7) return Math.max(1, daysToMaturity - 1);
    if (daysToMaturity <= 30) return 7;
    if (daysToMaturity <= 90) return 14;
    return 30;
  }

  /**
   * 估算到期利息
   */
  private async estimateInterest(
    principalAmount: number,
    interestRate: number,
    maturityDate: Date
  ): Promise<number> {
    const now = new Date();
    const daysToMaturity = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // 简单的利息估算（实际应该根据复利频率计算）
    const dailyRate = interestRate / 365;
    return principalAmount * dailyRate * daysToMaturity;
  }
}