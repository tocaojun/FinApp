/**
 * 文件解析工具
 * 支持Excel和JSON格式的交易数据解析
 */

import * as XLSX from 'xlsx';
import { ImportTransaction, ValidationError } from '../types/import.types';

/**
 * 解析Excel文件
 */
export function parseExcelFile(buffer: Buffer): ImportTransaction[] {
  try {
    // 读取工作簿
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    // 映射字段
    const transactions: ImportTransaction[] = data.map((row: any) => {
      // 处理标签字段（Excel中用逗号分隔）
      let tags: string[] | undefined;
      if (row['标签'] || row['tags']) {
        const tagStr = row['标签'] || row['tags'];
        tags = tagStr ? tagStr.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined;
      }
      
      return {
        date: row['日期'] || row['date'],
        type: row['交易类型'] || row['type'],
        quantity: parseFloat(row['数量'] || row['quantity']),
        price: parseFloat(row['价格'] || row['price']),
        currency: row['币种'] || row['currency'],
        fee: row['手续费'] || row['fee'] ? parseFloat(row['手续费'] || row['fee']) : undefined,
        notes: row['备注'] || row['notes'] || undefined,
        tags
      };
    });
    
    return transactions;
  } catch (error) {
    throw new Error(`Excel文件解析失败: ${error.message}`);
  }
}

/**
 * 解析JSON文件
 */
export function parseJsonFile(buffer: Buffer): ImportTransaction[] {
  try {
    const jsonStr = buffer.toString('utf-8');
    const data = JSON.parse(jsonStr);
    
    // 支持两种格式
    // 格式1: { transactions: [...] }
    // 格式2: [...]
    const transactions = Array.isArray(data) ? data : data.transactions;
    
    if (!Array.isArray(transactions)) {
      throw new Error('JSON格式错误：必须包含transactions数组');
    }
    
    return transactions;
  } catch (error) {
    throw new Error(`JSON文件解析失败: ${error.message}`);
  }
}

/**
 * 验证文件格式
 */
export function validateFileFormat(mimetype: string): 'excel' | 'json' | null {
  if (mimetype.includes('excel') || 
      mimetype.includes('spreadsheet') || 
      mimetype.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      mimetype.includes('application/vnd.ms-excel')) {
    return 'excel';
  }
  
  if (mimetype.includes('json') || mimetype.includes('application/json')) {
    return 'json';
  }
  
  return null;
}
