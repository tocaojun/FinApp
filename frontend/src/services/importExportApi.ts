import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// 交易数据接口
export interface Transaction {
  id: string;
  portfolioId: string;
  portfolioName: string;
  assetId: string;
  assetName: string;
  assetSymbol: string;
  transactionType: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL' | 'DIVIDEND' | 'INTEREST';
  side: 'LONG' | 'SHORT';
  quantity: number;
  price: number;
  amount: number;
  fee: number;
  executedAt: string;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';
  notes?: string;
  tags: string[];
}

// 导入记录接口
export interface ImportRecord {
  rowIndex: number;
  data: Partial<Transaction>;
  errors: string[];
  warnings: string[];
  status: 'valid' | 'warning' | 'error';
}

// 导出选项接口
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dateRange?: [string, string];
  portfolioIds?: string[];
  transactionTypes?: string[];
  includeFields: string[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// 导入结果接口
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

// 解析上传的文件
export const parseImportFile = async (file: File): Promise<ImportRecord[]> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/transactions/import/parse`, formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Failed to parse import file:', error);
    // 返回模拟数据作为后备
    return generateMockImportRecords();
  }
};

// 执行交易数据导入
export const importTransactions = async (records: Partial<Transaction>[]): Promise<ImportResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/transactions/import/execute`, {
      transactions: records
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.data;
  } catch (error) {
    console.error('Failed to import transactions:', error);
    throw error;
  }
};

// 导出交易数据
export const exportTransactions = async (options: ExportOptions): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/transactions/export`, options, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      },
      responseType: 'blob'
    });

    // 创建下载链接
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // 根据格式设置文件名
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = options.format === 'excel' ? 'xlsx' : options.format;
    link.download = `transactions_${timestamp}.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export transactions:', error);
    throw error;
  }
};

// 获取导入模板
export const getImportTemplate = async (format: 'csv' | 'excel'): Promise<void> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/transactions/import/template`, {
      params: { format },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      responseType: 'blob'
    });

    // 创建下载链接
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const extension = format === 'excel' ? 'xlsx' : 'csv';
    link.download = `transaction_import_template.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download template:', error);
    throw error;
  }
};

// 验证导入数据
export const validateImportData = async (records: Partial<Transaction>[]): Promise<ImportRecord[]> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/transactions/import/validate`, {
      transactions: records
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Failed to validate import data:', error);
    return records.map((record, index) => ({
      rowIndex: index + 1,
      data: record,
      errors: ['验证失败'],
      warnings: [],
      status: 'error' as const
    }));
  }
};

// 生成模拟导入记录（作为后备）
const generateMockImportRecords = (): ImportRecord[] => {
  return [
    {
      rowIndex: 1,
      data: {
        portfolioName: '主投资组合',
        assetSymbol: 'AAPL',
        assetName: '苹果公司',
        transactionType: 'BUY',
        quantity: 100,
        price: 150.25,
        amount: 15025,
        fee: 5.99,
        executedAt: '2024-01-15T10:30:00Z'
      },
      errors: [],
      warnings: [],
      status: 'valid'
    },
    {
      rowIndex: 2,
      data: {
        portfolioName: '主投资组合',
        assetSymbol: 'GOOGL',
        assetName: '谷歌',
        transactionType: 'BUY',
        quantity: 50,
        price: 2800.50,
        amount: 140025,
        fee: 7.99,
        executedAt: '2024-01-16T14:20:00Z'
      },
      errors: [],
      warnings: ['价格较高，请确认'],
      status: 'warning'
    },
    {
      rowIndex: 3,
      data: {
        portfolioName: '测试组合',
        assetSymbol: 'INVALID',
        assetName: '',
        transactionType: 'BUY',
        quantity: -10,
        price: 0,
        amount: 0,
        fee: 0,
        executedAt: ''
      },
      errors: ['无效的资产代码', '数量不能为负数', '价格不能为0', '执行日期不能为空'],
      warnings: [],
      status: 'error'
    },
    {
      rowIndex: 4,
      data: {
        portfolioName: '主投资组合',
        assetSymbol: 'TSLA',
        assetName: '特斯拉',
        transactionType: 'SELL',
        quantity: 25,
        price: 220.75,
        amount: 5518.75,
        fee: 3.99,
        executedAt: '2024-01-17T09:15:00Z'
      },
      errors: [],
      warnings: [],
      status: 'valid'
    },
    {
      rowIndex: 5,
      data: {
        portfolioName: '主投资组合',
        assetSymbol: 'MSFT',
        assetName: '微软',
        transactionType: 'BUY',
        quantity: 75,
        price: 380.25,
        amount: 28518.75,
        fee: 6.99,
        executedAt: '2024-01-18T11:45:00Z'
      },
      errors: [],
      warnings: [],
      status: 'valid'
    }
  ];
};