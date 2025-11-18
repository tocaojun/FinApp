/**
 * 存款服务API
 * 提供存款管理相关的所有API调用
 */

export interface DepositStatistics {
  totalDeposits: number;
  totalBalance: number;
  averageInterestRate: number;
  demandDeposits: number;
  timeDeposits: number;
  maturingSoon: number;
}

export interface UpcomingMaturityDeposit {
  positionId: string;
  assetId: string;
  productName: string;
  bankName: string;
  principalAmount: number;
  estimatedInterest: number;
  maturityDate: string;
  daysToMaturity: number;
  autoRenewal: boolean;
}

class DepositService {
  private static instance: DepositService;
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/deposits`;

  private constructor() {}

  public static getInstance(): DepositService {
    if (!DepositService.instance) {
      DepositService.instance = new DepositService();
    }
    return DepositService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * 获取存款统计信息
   */
  async getStatistics(): Promise<DepositStatistics | null> {
    try {
      const response = await fetch(`${this.baseUrl}/statistics`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      throw new Error(data.message || '获取存款统计失败');
    } catch (error) {
      console.error('获取存款统计失败:', error);
      return null;
    }
  }

  /**
   * 获取即将到期的存款
   * @param daysAhead 提前天数，默认30天
   */
  async getUpcomingMaturityDeposits(daysAhead: number = 30): Promise<UpcomingMaturityDeposit[]> {
    try {
      const response = await fetch(`${this.baseUrl}/upcoming-maturity?daysAhead=${daysAhead}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.data || [];
      }
      throw new Error(data.message || '获取到期提醒失败');
    } catch (error) {
      console.error('获取到期提醒失败:', error);
      return [];
    }
  }

  /**
   * 获取指定投资组合的存款持仓
   * @param portfolioId 投资组合ID
   */
  async getPositionsByPortfolio(portfolioId: string): Promise<any[]> {
    try {
      console.log('调用存款持仓API - portfolioId:', portfolioId);
      console.log('API URL:', `${this.baseUrl}/positions?portfolioId=${portfolioId}`);
      
      const response = await fetch(`${this.baseUrl}/positions?portfolioId=${portfolioId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      console.log('API响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('获取存款持仓失败 - HTTP状态:', response.status);
        console.error('错误响应内容:', errorText);
        
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('API响应数据:', data);
      
      if (data.success) {
        return data.data || [];
      }
      throw new Error(data.message || '获取存款持仓失败');
    } catch (error) {
      console.error('获取存款持仓失败 - catch块:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('获取存款持仓失败');
    }
  }
}

export const depositService = DepositService.getInstance();
export type { DepositService };
