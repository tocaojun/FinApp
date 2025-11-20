import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface InsuranceAssetType {
  id: string;
  code: string;
  name: string;
  description: string;
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

export interface CreateInsuranceRequest {
  portfolioId: string;
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
  beneficiaryInfo?: any;
  isParticipating?: boolean;
  waitingPeriod?: number;
  metadata?: any;
}

export interface UpdateCashValueRequest {
  guaranteedCashValue: number;
  dividendCashValue: number;
  valuationDate?: string;
  notes?: string;
}

export interface PremiumPayment {
  id: string;
  insuranceDetailId: string;
  transactionId?: string;
  paymentDate: string;
  premiumAmount: number;
  currency: string;
  paymentMethod?: string;
  paymentPeriod?: number;
  isOverdue: boolean;
  overdueDays: number;
  paymentStatus: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CashValueHistory {
  id: string;
  insuranceDetailId: string;
  valuationDate: string;
  guaranteedCashValue: number;
  dividendCashValue: number;
  totalCashValue: number;
  totalPremiumPaid: number;
  yieldRate?: number;
  notes?: string;
  createdAt?: string;
}

export interface InsuranceSummary {
  portfolioId: string;
  portfolioName: string;
  totalPolicies: number;
  totalCoverageAmount: number;
  totalCashValue: number;
  annualPremiumAmount: number;
  activePolicies: number;
  participatingPolicies: number;
}

export interface RecordPremiumPaymentRequest {
  paymentDate: string;
  premiumAmount: number;
  currency: string;
  paymentMethod?: string;
  paymentPeriod?: number;
  isOverdue?: boolean;
  overdueDays?: number;
  paymentStatus?: string;
  notes?: string;
}

export class InsuranceService {
  /**
   * 获取保险资产类型列表
   */
  static async getInsuranceAssetTypes(): Promise<InsuranceAssetType[]> {
    try {
      const response = await apiGet('/insurance/asset-types');
      return response.data || [];
    } catch (error) {
      console.error('获取保险资产类型失败:', error);
      throw error;
    }
  }

  /**
   * 创建保险产品
   */
  static async createInsurance(data: CreateInsuranceRequest): Promise<InsuranceAsset> {
    try {
      const response = await apiPost('/insurance', data);
      return response.data;
    } catch (error) {
      console.error('创建保险产品失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的保险资产列表
   */
  static async getUserInsuranceAssets(portfolioId?: string): Promise<InsuranceAsset[]> {
    try {
      const endpoint = portfolioId ? `/insurance?portfolio_id=${portfolioId}` : '/insurance';
      const response = await apiGet(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('获取保险资产列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取保险详情
   */
  static async getInsuranceDetail(assetId: string): Promise<InsuranceAsset> {
    try {
      const response = await apiGet(`/insurance/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('获取保险详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新现金价值
   */
  static async updateCashValue(assetId: string, data: UpdateCashValueRequest): Promise<void> {
    try {
      await apiPut(`/insurance/${assetId}/cash-value`, data);
    } catch (error) {
      console.error('更新现金价值失败:', error);
      throw error;
    }
  }

  /**
   * 获取现金价值历史
   */
  static async getCashValueHistory(assetId: string): Promise<CashValueHistory[]> {
    try {
      const response = await apiGet(`/insurance/${assetId}/cash-value-history`);
      return response.data || [];
    } catch (error) {
      console.error('获取现金价值历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取保险统计信息
   */
  static async getInsuranceSummary(portfolioId?: string): Promise<InsuranceSummary[]> {
    try {
      const endpoint = portfolioId ? `/insurance/summary?portfolio_id=${portfolioId}` : '/insurance/summary';
      const response = await apiGet(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('获取保险统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 记录保费缴纳
   */
  static async recordPremiumPayment(assetId: string, data: RecordPremiumPaymentRequest): Promise<PremiumPayment> {
    try {
      const response = await apiPost(`/insurance/${assetId}/premium-payments`, data);
      return response.data;
    } catch (error) {
      console.error('记录保费缴纳失败:', error);
      throw error;
    }
  }

  /**
   * 获取缴费记录
   */
  static async getPremiumPayments(assetId: string): Promise<PremiumPayment[]> {
    try {
      const response = await apiGet(`/insurance/${assetId}/premium-payments`);
      return response.data || [];
    } catch (error) {
      console.error('获取缴费记录失败:', error);
      throw error;
    }
  }

  /**
   * 格式化保险类型显示名称
   */
  static formatInsuranceType(type: string): string {
    const typeMap: Record<string, string> = {
      'CRITICAL_ILLNESS': '重疾险',
      'LIFE_INSURANCE': '寿险',
      'ACCIDENT_INSURANCE': '意外险',
      'MEDICAL_INSURANCE': '医疗险'
    };
    return typeMap[type] || type;
  }

  /**
   * 格式化缴费频率显示名称
   */
  static formatPremiumFrequency(frequency: string): string {
    const frequencyMap: Record<string, string> = {
      'MONTHLY': '月缴',
      'QUARTERLY': '季缴',
      'ANNUALLY': '年缴',
      'LUMP_SUM': '趸缴'
    };
    return frequencyMap[frequency] || frequency;
  }

  /**
   * 格式化保单状态显示名称
   */
  static formatPolicyStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'ACTIVE': '有效',
      'LAPSED': '失效',
      'SURRENDERED': '退保',
      'CLAIMED': '已理赔'
    };
    return statusMap[status] || status;
  }

  /**
   * 格式化缴费状态显示名称
   */
  static formatPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'PAID': '已缴费',
      'PENDING': '待缴费',
      'OVERDUE': '逾期',
      'WAIVED': '豁免'
    };
    return statusMap[status] || status;
  }

  /**
   * 计算年化保费
   */
  static calculateAnnualPremium(premiumAmount: number, frequency: string): number {
    const multiplierMap: Record<string, number> = {
      'MONTHLY': 12,
      'QUARTERLY': 4,
      'ANNUALLY': 1,
      'LUMP_SUM': 0
    };
    const multiplier = multiplierMap[frequency] || 0;
    return premiumAmount * multiplier;
  }

  /**
   * 计算保险收益率（基于现金价值和累计缴费）
   */
  static calculateYieldRate(totalCashValue: number, totalPremiumPaid: number, years: number): number {
    if (totalPremiumPaid <= 0 || years <= 0) return 0;
    
    // 简单年化收益率计算
    const totalReturn = totalCashValue - totalPremiumPaid;
    const annualReturn = totalReturn / years;
    const yieldRate = (annualReturn / totalPremiumPaid) * 100;
    
    return Math.round(yieldRate * 100) / 100; // 保留两位小数
  }

  /**
   * 获取保险类型颜色
   */
  static getInsuranceTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      'CRITICAL_ILLNESS': '#f50',
      'LIFE_INSURANCE': '#2f54eb',
      'ACCIDENT_INSURANCE': '#fa8c16',
      'MEDICAL_INSURANCE': '#52c41a'
    };
    return colorMap[type] || '#666';
  }

  /**
   * 获取保单状态颜色
   */
  static getPolicyStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'ACTIVE': 'green',
      'LAPSED': 'red',
      'SURRENDERED': 'orange',
      'CLAIMED': 'blue'
    };
    return colorMap[status] || 'default';
  }

  /**
   * 获取缴费状态颜色
   */
  static getPaymentStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'PAID': 'green',
      'PENDING': 'orange',
      'OVERDUE': 'red',
      'WAIVED': 'blue'
    };
    return colorMap[status] || 'default';
  }
}