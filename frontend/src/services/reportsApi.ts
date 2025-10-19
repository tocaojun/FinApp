import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// 类型定义
export interface QuarterlyReport {
  id: string;
  quarter: string;
  year: number;
  totalAssets: number;
  totalReturn: number;
  returnRate: number;
  portfolioCount: number;
  transactionCount: number;
  createdAt: string;
  status: 'completed' | 'generating' | 'failed';
}

export interface IRRAnalysis {
  portfolioId: string;
  portfolioName: string;
  irr: number;
  npv: number;
  totalInvestment: number;
  currentValue: number;
  period: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CustomReport {
  id: string;
  name: string;
  type: 'portfolio' | 'transaction' | 'performance' | 'risk';
  dateRange: [string, string];
  filters: Record<string, any>;
  createdAt: string;
  lastRun: string;
}

export interface QuarterlySummary {
  totalAssets: number;
  totalReturn: number;
  returnRate: number;
  portfolioCount: number;
}

// 获取季度报表列表
export const getQuarterlyReports = async (): Promise<QuarterlyReport[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/reports/quarterly`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取季度报表失败:', error);
    // 返回模拟数据作为后备
    return [
      {
        id: '1',
        quarter: 'Q3',
        year: 2024,
        totalAssets: 1234567.89,
        totalReturn: 234567.89,
        returnRate: 23.46,
        portfolioCount: 3,
        transactionCount: 45,
        createdAt: '2024-09-15',
        status: 'completed'
      },
      {
        id: '2',
        quarter: 'Q2',
        year: 2024,
        totalAssets: 1000000.00,
        totalReturn: 150000.00,
        returnRate: 17.65,
        portfolioCount: 2,
        transactionCount: 32,
        createdAt: '2024-06-30',
        status: 'completed'
      }
    ];
  }
};

// 获取季度概览统计
export const getQuarterlySummary = async (quarter: string): Promise<QuarterlySummary> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/reports/quarterly/${quarter}/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取季度概览失败:', error);
    // 返回模拟数据作为后备
    return {
      totalAssets: 1234567.89,
      totalReturn: 234567.89,
      returnRate: 23.46,
      portfolioCount: 3
    };
  }
};

// 生成季度报表
export const generateQuarterlyReport = async (quarter: string): Promise<{ success: boolean; reportId?: string }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/reports/quarterly/generate`, 
      { quarter },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('生成季度报表失败:', error);
    return { success: false };
  }
};

// 获取IRR分析数据
export const getIRRAnalysis = async (portfolioId?: string): Promise<IRRAnalysis[]> => {
  try {
    const token = localStorage.getItem('token');
    const url = portfolioId && portfolioId !== 'all' 
      ? `${API_BASE_URL}/reports/irr?portfolioId=${portfolioId}`
      : `${API_BASE_URL}/reports/irr`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取IRR分析失败:', error);
    // 返回模拟数据作为后备
    return [
      {
        portfolioId: '1',
        portfolioName: '核心投资组合',
        irr: 18.5,
        npv: 125000.00,
        totalInvestment: 500000.00,
        currentValue: 625000.00,
        period: '2年3个月',
        riskLevel: 'medium'
      },
      {
        portfolioId: '2',
        portfolioName: '稳健增长组合',
        irr: 12.3,
        npv: 85000.00,
        totalInvestment: 400000.00,
        currentValue: 485000.00,
        period: '1年8个月',
        riskLevel: 'low'
      }
    ];
  }
};

// 重新计算IRR
export const recalculateIRR = async (portfolioId?: string, dateRange?: [string, string]): Promise<IRRAnalysis[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/reports/irr/recalculate`, 
      { portfolioId, dateRange },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('重新计算IRR失败:', error);
    throw error;
  }
};

// 获取自定义报表列表
export const getCustomReports = async (): Promise<CustomReport[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/reports/custom`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取自定义报表失败:', error);
    // 返回模拟数据作为后备
    return [
      {
        id: '1',
        name: '月度投资组合表现报告',
        type: 'portfolio',
        dateRange: ['2024-08-01', '2024-08-31'],
        filters: { portfolioIds: ['1', '2'] },
        createdAt: '2024-08-15',
        lastRun: '2024-09-01'
      },
      {
        id: '2',
        name: '交易手续费分析报告',
        type: 'transaction',
        dateRange: ['2024-01-01', '2024-08-31'],
        filters: { transactionTypes: ['buy', 'sell'] },
        createdAt: '2024-07-20',
        lastRun: '2024-08-31'
      }
    ];
  }
};

// 创建自定义报表
export const createCustomReport = async (report: Omit<CustomReport, 'id' | 'createdAt' | 'lastRun'>): Promise<CustomReport> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/reports/custom`, 
      report,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('创建自定义报表失败:', error);
    throw error;
  }
};

// 运行自定义报表
export const runCustomReport = async (reportId: string): Promise<{ success: boolean; data?: any }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/reports/custom/${reportId}/run`, 
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('运行自定义报表失败:', error);
    return { success: false };
  }
};

// 更新自定义报表
export const updateCustomReport = async (reportId: string, report: Partial<CustomReport>): Promise<CustomReport> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_BASE_URL}/reports/custom/${reportId}`, 
      report,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('更新自定义报表失败:', error);
    throw error;
  }
};

// 删除自定义报表
export const deleteCustomReport = async (reportId: string): Promise<{ success: boolean }> => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE_URL}/reports/custom/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return { success: true };
  } catch (error) {
    console.error('删除自定义报表失败:', error);
    return { success: false };
  }
};

// 下载报表
export const downloadReport = async (reportId: string, type: 'quarterly' | 'custom'): Promise<Blob> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/reports/${type}/${reportId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('下载报表失败:', error);
    throw error;
  }
};

// 获取报表详情
export const getReportDetails = async (reportId: string, type: 'quarterly' | 'custom'): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/reports/${type}/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取报表详情失败:', error);
    throw error;
  }
};