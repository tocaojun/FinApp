/**
 * 交易批量导入类型定义
 */

/**
 * 导入上下文（界面预选）
 */
export interface ImportContext {
  userId: string;
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
}

/**
 * 批量文件中的交易数据
 */
export interface ImportTransaction {
  // 必填字段
  date: string;              // YYYY-MM-DD
  type: TransactionType;     // 交易类型
  quantity: number;          // 数量
  price: number;             // 价格
  currency: string;          // 币种（ISO 4217）
  
  // 可选字段
  fee?: number;              // 手续费
  notes?: string;            // 备注
  tags?: string[];           // 标签
}

/**
 * 完整的交易记录（附加上下文）
 */
export interface EnrichedTransaction extends ImportTransaction {
  userId: string;
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  
  // 自动计算字段
  totalAmount: number;       // 总金额
  side: 'BUY' | 'SELL';     // 交易方向
  status: 'EXECUTED';        // 状态
  executedAt: Date;          // 执行时间
}

/**
 * 验证错误
 */
export interface ValidationError {
  row: number;               // 行号（从1开始）
  field: string;             // 字段名
  value: any;                // 错误值
  message: string;           // 错误信息
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean;
  count?: number;            // 成功导入的记录数
  errors?: ValidationError[]; // 验证错误列表
  summary?: string;          // 摘要信息
}

/**
 * 交易类型枚举（匹配数据库约束）
 */
export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  DIVIDEND = 'dividend',
  SPLIT = 'split',
  MERGER = 'merger',
  SPIN_OFF = 'spin_off',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal'
}

/**
 * 支持的文件格式
 */
export type FileFormat = 'excel' | 'json';

/**
 * Excel解析结果
 */
export interface ExcelParseResult {
  transactions: ImportTransaction[];
  errors: ValidationError[];
}

/**
 * JSON解析结果
 */
export interface JsonParseResult {
  transactions: ImportTransaction[];
  errors: ValidationError[];
}
