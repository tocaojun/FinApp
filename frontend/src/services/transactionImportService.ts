/**
 * 交易批量导入服务
 */

import axios from 'axios';

// 使用环境变量配置API基础路径
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ImportTransaction {
  date: string;
  type: string;
  quantity: number;
  price: number;
  currency: string;
  fee?: number;
  notes?: string;
  tags?: string[];
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ImportResult {
  success: boolean;
  count?: number;
  errors?: ValidationError[];
  summary?: string;
}

export interface PreviewResult {
  success: boolean;
  data?: ImportTransaction[];
  count?: number;
  errors?: ValidationError[];
  summary?: string;
}

export class TransactionImportService {
  /**
   * 下载Excel模板
   */
  static async downloadExcelTemplate(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_BASE_URL}/transactions/import/template/excel`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transaction_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载Excel模板失败:', error);
      throw error;
    }
  }

  /**
   * 下载JSON模板
   */
  static async downloadJsonTemplate(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_BASE_URL}/transactions/import/template/json`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transaction_import_template.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载JSON模板失败:', error);
      throw error;
    }
  }

  /**
   * 预览导入数据
   */
  static async previewImport(
    file: File,
    portfolioId: string,
    tradingAccountId: string,
    assetId: string
  ): Promise<PreviewResult> {
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('portfolioId', portfolioId);
      formData.append('tradingAccountId', tradingAccountId);
      formData.append('assetId', assetId);

      const response = await axios.post(
        `${API_BASE_URL}/transactions/import/preview`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('预览导入失败:', error);
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * 批量导入交易
   */
  static async importTransactions(
    file: File,
    portfolioId: string,
    tradingAccountId: string,
    assetId: string
  ): Promise<ImportResult> {
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('portfolioId', portfolioId);
      formData.append('tradingAccountId', tradingAccountId);
      formData.append('assetId', assetId);

      const response = await axios.post(
        `${API_BASE_URL}/transactions/import/batch`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('批量导入失败:', error);
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }
}
