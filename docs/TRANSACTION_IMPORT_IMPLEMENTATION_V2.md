# 交易导入导出实现方案 v2.0

## 📋 版本更新说明

### v2.0 主要变更
- ✨ **优化导入流程**：界面预选投资组合、交易账户、资产
- ✨ **简化文件结构**：批量文件不再包含portfolio、account、asset字段
- ✨ **提供标准模板**：可下载Excel和JSON模板文件
- ✨ **减少验证复杂度**：从8个必填字段降至5个
- 🔧 **优化用户体验**：减少错误，提高导入成功率

---

## 一、技术架构

### 1.1 后端架构

```
backend/src/
├── controllers/
│   └── TransactionImportController.ts    # 导入导出控制器
├── services/
│   ├── TransactionImportService.ts       # 导入业务逻辑
│   ├── TransactionExportService.ts       # 导出业务逻辑
│   ├── TemplateGeneratorService.ts       # 模板生成服务（新增）
│   └── validators/
│       ├── ExcelValidator.ts             # Excel验证
│       └── JsonValidator.ts              # JSON验证
├── types/
│   └── import.types.ts                   # 导入导出类型定义
└── utils/
    ├── excelParser.ts                    # Excel解析工具
    └── jsonParser.ts                     # JSON解析工具
```

### 1.2 前端架构

```
frontend/src/pages/admin/TransactionManagement/
├── ImportExport/
│   ├── index.tsx                         # 主入口
│   ├── ImportModal.tsx                   # 导入弹窗（重构）
│   ├── ExportModal.tsx                   # 导出弹窗
│   ├── PreviewTable.tsx                  # 预览表格
│   ├── ContextSelector.tsx               # 上下文选择器（新增）
│   └── TemplateDownloader.tsx            # 模板下载器（新增）
└── templates/
    ├── transaction_template.xlsx         # Excel模板
    └── transaction_template.json         # JSON模板
```

---

## 二、数据格式定义

### 2.1 导入规则说明

**⚠️ 重要约束**:
1. **界面预选**：必须先在界面选择投资组合、交易账户、资产
2. **原子性操作**：一批数据要么全部成功，要么全部失败
3. **事务保证**：使用数据库事务确保数据一致性
4. **简化验证**：批量文件只需验证交易明细，无需验证关联关系

**验证流程**:
```
界面选择上下文 → 上传文件 → 解析数据 → 验证交易明细 → 事务导入 → 全部成功/全部回滚
```

### 2.2 Excel格式

**文件名**: `transaction_import_template.xlsx`

**Sheet1: 交易数据**

| 日期 | 交易类型 | 数量 | 价格 | 币种 | 手续费 | 备注 | 标签 |
|------|---------|------|------|------|--------|------|------|
| 2024-01-15 | STOCK_BUY | 100 | 320.5 | HKD | 10 | 建仓 | 长期持有,核心资产 |
| 2024-02-20 | STOCK_SELL | 50 | 185.2 | USD | 5 | 减仓 | |
| 2024-03-10 | DIVIDEND | 100 | 2.5 | HKD | 0 | 分红收入 | 被动收入 |

**注意**: 
- 不包含投资组合、交易账户、资产信息（已在界面选择）
- 标签字段多个值用逗号分隔，系统自动拆分为数组
- 所有交易使用相同的投资组合、账户、资产

### 2.3 JSON格式

**文件名**: `transaction_import_template.json`

```json
{
  "version": "2.0",
  "metadata": {
    "description": "交易批量导入模板",
    "note": "使用前必须在界面选择：投资组合、交易账户、资产"
  },
  "transactions": [
    {
      "date": "2024-01-15",
      "type": "STOCK_BUY",
      "quantity": 100,
      "price": 320.5,
      "currency": "HKD",
      "fee": 10,
      "notes": "建仓",
      "tags": ["长期持有", "核心资产"]
    },
    {
      "date": "2024-02-20",
      "type": "STOCK_SELL",
      "quantity": 50,
      "price": 185.2,
      "currency": "USD",
      "fee": 5,
      "notes": "减仓",
      "tags": []
    },
    {
      "date": "2024-03-10",
      "type": "DIVIDEND",
      "quantity": 100,
      "price": 2.5,
      "currency": "HKD",
      "fee": 0,
      "notes": "分红收入",
      "tags": ["被动收入"]
    }
  ]
}
```

### 2.4 CSV格式（导出专用）

```csv
日期,交易类型,数量,价格,币种,手续费,备注,标签
2024-01-15,STOCK_BUY,100,320.5,HKD,10,建仓,"长期持有,核心资产"
2024-02-20,STOCK_SELL,50,185.2,USD,5,减仓,
2024-03-10,DIVIDEND,100,2.5,HKD,0,分红收入,被动收入
```

---

## 三、核心代码实现

### 3.1 类型定义

```typescript
// backend/src/types/import.types.ts

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
  executedAt: Date;          // 执行日期
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
 * 交易类型枚举
 */
export enum TransactionType {
  // 股票
  STOCK_BUY = 'STOCK_BUY',
  STOCK_SELL = 'STOCK_SELL',
  
  // 基金
  FUND_SUBSCRIBE = 'FUND_SUBSCRIBE',
  FUND_REDEEM = 'FUND_REDEEM',
  
  // 债券
  BOND_BUY = 'BOND_BUY',
  BOND_SELL = 'BOND_SELL',
  
  // 期权
  OPTION_BUY = 'OPTION_BUY',
  OPTION_SELL = 'OPTION_SELL',
  OPTION_EXERCISE = 'OPTION_EXERCISE',
  
  // 现金流
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  DIVIDEND = 'DIVIDEND',
  INTEREST = 'INTEREST',
  FEE = 'FEE',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT'
}
```

### 3.2 导入服务

```typescript
// backend/src/services/TransactionImportService.ts

import { PrismaClient } from '@prisma/client';
import { 
  ImportContext, 
  ImportTransaction, 
  EnrichedTransaction,
  ValidationError,
  ImportResult,
  TransactionType 
} from '../types/import.types';

export class TransactionImportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 批量导入交易
   */
  async importTransactions(
    context: ImportContext,
    transactions: ImportTransaction[]
  ): Promise<ImportResult> {
    try {
      // 1. 验证上下文（投资组合、账户、资产的关联关系）
      await this.validateContext(context);
      
      // 2. 验证交易数据
      const errors = this.validateTransactions(transactions);
      if (errors.length > 0) {
        return {
          success: false,
          errors,
          summary: `发现${errors.length}个错误，请修正后重新上传`
        };
      }
      
      // 3. 附加上下文信息
      const enrichedTransactions = this.enrichTransactions(context, transactions);
      
      // 4. 原子性导入
      await this.importAllTransactions(enrichedTransactions);
      
      return {
        success: true,
        count: transactions.length,
        summary: `成功导入${transactions.length}条交易记录`
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [{
          row: 0,
          field: 'system',
          value: null,
          message: error.message
        }],
        summary: '导入失败：' + error.message
      };
    }
  }

  /**
   * 验证上下文（投资组合、账户、资产的关联关系）
   */
  private async validateContext(context: ImportContext): Promise<void> {
    const { userId, portfolioId, tradingAccountId, assetId } = context;
    
    // 1. 验证投资组合属于用户
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { 
        id: portfolioId, 
        user_id: userId, 
        is_active: true 
      }
    });
    
    if (!portfolio) {
      throw new Error('投资组合不存在或无权访问');
    }
    
    // 2. 验证交易账户属于该组合
    const account = await this.prisma.tradingAccount.findFirst({
      where: { 
        id: tradingAccountId, 
        portfolio_id: portfolioId, 
        is_active: true 
      }
    });
    
    if (!account) {
      throw new Error('交易账户不存在或不属于该投资组合');
    }
    
    // 3. 验证资产存在
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId }
    });
    
    if (!asset) {
      throw new Error('资产不存在');
    }
  }

  /**
   * 验证交易数据
   */
  private validateTransactions(
    transactions: ImportTransaction[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    transactions.forEach((transaction, index) => {
      const row = index + 2; // Excel行号（从2开始，第1行是表头）
      
      // 验证日期
      const dateError = this.validateDate(transaction.date);
      if (dateError) {
        errors.push({ row, field: 'date', value: transaction.date, message: dateError });
      }
      
      // 验证交易类型
      const typeError = this.validateType(transaction.type);
      if (typeError) {
        errors.push({ row, field: 'type', value: transaction.type, message: typeError });
      }
      
      // 验证数量
      const quantityError = this.validateQuantity(transaction.quantity);
      if (quantityError) {
        errors.push({ row, field: 'quantity', value: transaction.quantity, message: quantityError });
      }
      
      // 验证价格
      const priceError = this.validatePrice(transaction.price);
      if (priceError) {
        errors.push({ row, field: 'price', value: transaction.price, message: priceError });
      }
      
      // 验证币种
      const currencyError = this.validateCurrency(transaction.currency);
      if (currencyError) {
        errors.push({ row, field: 'currency', value: transaction.currency, message: currencyError });
      }
      
      // 验证手续费（可选）
      if (transaction.fee !== undefined) {
        const feeError = this.validateFee(transaction.fee);
        if (feeError) {
          errors.push({ row, field: 'fee', value: transaction.fee, message: feeError });
        }
      }
      
      // 验证标签（可选）
      if (transaction.tags !== undefined) {
        const tagsError = this.validateTags(transaction.tags);
        if (tagsError) {
          errors.push({ row, field: 'tags', value: transaction.tags, message: tagsError });
        }
      }
    });
    
    return errors;
  }

  /**
   * 验证日期
   */
  private validateDate(date: string): string | null {
    // 1. 格式验证
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return '日期格式错误，必须是 YYYY-MM-DD';
    }
    
    // 2. 有效性验证
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return '无效的日期';
    }
    
    // 3. 不能是未来日期
    if (parsedDate > new Date()) {
      return '交易日期不能是未来日期';
    }
    
    return null;
  }

  /**
   * 验证交易类型
   */
  private validateType(type: string): string | null {
    const validTypes = Object.values(TransactionType);
    
    if (!validTypes.includes(type as TransactionType)) {
      return `无效的交易类型 "${type}"。支持的类型：${validTypes.join(', ')}`;
    }
    
    return null;
  }

  /**
   * 验证数量
   */
  private validateQuantity(quantity: number): string | null {
    // 1. 必须是数字
    if (isNaN(quantity)) {
      return '数量必须是数字';
    }
    
    // 2. 必须大于0
    if (quantity <= 0) {
      return '数量必须大于0';
    }
    
    // 3. 小数位数不超过8位
    const decimalPlaces = (quantity.toString().split('.')[1] || '').length;
    if (decimalPlaces > 8) {
      return '数量最多支持8位小数';
    }
    
    return null;
  }

  /**
   * 验证价格
   */
  private validatePrice(price: number): string | null {
    // 1. 必须是数字
    if (isNaN(price)) {
      return '价格必须是数字';
    }
    
    // 2. 必须大于等于0
    if (price < 0) {
      return '价格不能为负数';
    }
    
    // 3. 小数位数不超过8位
    const decimalPlaces = (price.toString().split('.')[1] || '').length;
    if (decimalPlaces > 8) {
      return '价格最多支持8位小数';
    }
    
    return null;
  }

  /**
   * 验证币种
   */
  private validateCurrency(currency: string): string | null {
    // 1. 长度必须是3个字符
    if (currency.length !== 3) {
      return '币种代码必须是3个字符';
    }
    
    // 2. 必须是大写字母
    if (!/^[A-Z]{3}$/.test(currency)) {
      return '币种代码必须是3个大写字母';
    }
    
    // 3. 可选：验证是否是有效的ISO 4217代码
    const validCurrencies = ['CNY', 'USD', 'HKD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CAD'];
    if (!validCurrencies.includes(currency)) {
      return `不支持的币种代码 "${currency}"`;
    }
    
    return null;
  }

  /**
   * 验证手续费
   */
  private validateFee(fee: number): string | null {
    // 1. 必须是数字
    if (isNaN(fee)) {
      return '手续费必须是数字';
    }
    
    // 2. 必须大于等于0
    if (fee < 0) {
      return '手续费不能为负数';
    }
    
    // 3. 小数位数不超过8位
    const decimalPlaces = (fee.toString().split('.')[1] || '').length;
    if (decimalPlaces > 8) {
      return '手续费最多支持8位小数';
    }
    
    return null;
  }

  /**
   * 验证标签
   */
  private validateTags(tags: any): string | null {
    // 1. 必须是数组
    if (!Array.isArray(tags)) {
      return '标签必须是数组';
    }
    
    // 2. 数组元素必须是字符串
    if (!tags.every(tag => typeof tag === 'string')) {
      return '标签数组中的每个元素必须是字符串';
    }
    
    return null;
  }

  /**
   * 附加上下文信息
   */
  private enrichTransactions(
    context: ImportContext,
    transactions: ImportTransaction[]
  ): EnrichedTransaction[] {
    return transactions.map(transaction => ({
      ...transaction,
      userId: context.userId,
      portfolioId: context.portfolioId,
      tradingAccountId: context.tradingAccountId,
      assetId: context.assetId,
      
      // 自动计算字段
      totalAmount: this.calculateTotalAmount(transaction),
      side: this.determineSide(transaction.type),
      status: 'EXECUTED' as const,
      executedAt: new Date(transaction.date)
    }));
  }

  /**
   * 计算总金额
   */
  private calculateTotalAmount(transaction: ImportTransaction): number {
    const baseAmount = transaction.quantity * transaction.price;
    const fee = transaction.fee || 0;
    
    // 买入：总金额 = 数量 × 价格 + 手续费
    // 卖出：总金额 = 数量 × 价格 - 手续费
    const side = this.determineSide(transaction.type);
    return side === 'BUY' ? baseAmount + fee : baseAmount - fee;
  }

  /**
   * 确定交易方向
   */
  private determineSide(type: TransactionType): 'BUY' | 'SELL' {
    const buyTypes = [
      TransactionType.STOCK_BUY,
      TransactionType.FUND_SUBSCRIBE,
      TransactionType.BOND_BUY,
      TransactionType.OPTION_BUY,
      TransactionType.DEPOSIT,
      TransactionType.DIVIDEND,
      TransactionType.INTEREST,
      TransactionType.TRANSFER_IN
    ];
    
    return buyTypes.includes(type) ? 'BUY' : 'SELL';
  }

  /**
   * 原子性导入所有交易
   */
  private async importAllTransactions(
    transactions: EnrichedTransaction[]
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        for (const transaction of transactions) {
          await tx.transaction.create({
            data: {
              user_id: transaction.userId,
              portfolio_id: transaction.portfolioId,
              trading_account_id: transaction.tradingAccountId,
              asset_id: transaction.assetId,
              date: transaction.executedAt,
              type: transaction.type,
              side: transaction.side,
              quantity: transaction.quantity,
              price: transaction.price,
              total_amount: transaction.totalAmount,
              currency: transaction.currency,
              fee: transaction.fee || 0,
              notes: transaction.notes,
              tags: transaction.tags || [],
              status: transaction.status,
              executed_at: transaction.executedAt
            }
          });
        }
      },
      {
        maxWait: 10000,      // 最大等待时间：10秒
        timeout: 30000,      // 超时时间：30秒
        isolationLevel: 'Serializable'  // 最高隔离级别
      }
    );
  }
}
```

### 3.3 模板生成服务

```typescript
// backend/src/services/TemplateGeneratorService.ts

import * as XLSX from 'xlsx';
import { ImportContext } from '../types/import.types';

export class TemplateGeneratorService {
  /**
   * 生成Excel模板
   */
  generateExcelTemplate(context?: ImportContext): Buffer {
    // Sheet1: 交易数据
    const dataSheet = XLSX.utils.aoa_to_sheet([
      // 表头
      ['日期', '交易类型', '数量', '价格', '币种', '手续费', '备注', '标签'],
      // 示例数据
      ['2024-01-15', 'STOCK_BUY', 100, 320.5, 'HKD', 10, '建仓', '长期持有,核心资产'],
      ['2024-02-20', 'STOCK_SELL', 50, 185.2, 'USD', 5, '减仓', ''],
      ['2024-03-10', 'DIVIDEND', 100, 2.5, 'HKD', 0, '分红收入', '被动收入']
    ]);
    
    // Sheet2: 说明
    const instructionSheet = XLSX.utils.aoa_to_sheet([
      ['批量导入交易说明'],
      [''],
      ['1. 使用前提：'],
      ['   - 必须先在界面选择：投资组合、交易账户、资产（产品）'],
      ['   - 本文件仅包含交易明细，不包含投资组合/账户/资产信息'],
      [''],
      ['2. 必填字段（5个）：'],
      ['   - 日期：格式 YYYY-MM-DD，不能是未来日期'],
      ['   - 交易类型：见下方类型列表'],
      ['   - 数量：必须 > 0'],
      ['   - 价格：必须 ≥ 0'],
      ['   - 币种：3位ISO代码（如CNY、USD、HKD）'],
      [''],
      ['3. 可选字段（3个）：'],
      ['   - 手续费：默认0'],
      ['   - 备注：任意文本'],
      ['   - 标签：多个标签用逗号分隔'],
      [''],
      ['4. 支持的交易类型：'],
      ['   股票：STOCK_BUY, STOCK_SELL'],
      ['   基金：FUND_SUBSCRIBE, FUND_REDEEM'],
      ['   债券：BOND_BUY, BOND_SELL'],
      ['   期权：OPTION_BUY, OPTION_SELL, OPTION_EXERCISE'],
      ['   现金流：DEPOSIT, WITHDRAWAL, DIVIDEND, INTEREST, FEE, TRANSFER_IN, TRANSFER_OUT'],
      [''],
      ['5. 常用币种代码：'],
      ['   CNY-人民币, USD-美元, HKD-港币, EUR-欧元, GBP-英镑, JPY-日元'],
      [''],
      ['6. 注意事项：'],
      ['   - 一批数据要么全部成功，要么全部失败'],
      ['   - 请确保数据准确，避免导入失败']
    ]);
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, dataSheet, '交易数据');
    XLSX.utils.book_append_sheet(workbook, instructionSheet, '说明');
    
    // 生成Buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 生成JSON模板
   */
  generateJsonTemplate(context?: ImportContext): string {
    const template = {
      version: '2.0',
      metadata: {
        description: '交易批量导入模板',
        note: '使用前必须在界面选择：投资组合、交易账户、资产'
      },
      transactions: [
        {
          date: '2024-01-15',
          type: 'STOCK_BUY',
          quantity: 100,
          price: 320.5,
          currency: 'HKD',
          fee: 10,
          notes: '建仓',
          tags: ['长期持有', '核心资产']
        },
        {
          date: '2024-02-20',
          type: 'STOCK_SELL',
          quantity: 50,
          price: 185.2,
          currency: 'USD',
          fee: 5,
          notes: '减仓',
          tags: []
        },
        {
          date: '2024-03-10',
          type: 'DIVIDEND',
          quantity: 100,
          price: 2.5,
          currency: 'HKD',
          fee: 0,
          notes: '分红收入',
          tags: ['被动收入']
        }
      ],
      schema: {
        required_fields: ['date', 'type', 'quantity', 'price', 'currency'],
        optional_fields: ['fee', 'notes', 'tags'],
        transaction_types: [
          'STOCK_BUY', 'STOCK_SELL',
          'FUND_SUBSCRIBE', 'FUND_REDEEM',
          'BOND_BUY', 'BOND_SELL',
          'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE',
          'DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST',
          'FEE', 'TRANSFER_IN', 'TRANSFER_OUT'
        ],
        currency_codes: ['CNY', 'USD', 'HKD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CAD']
      }
    };
    
    return JSON.stringify(template, null, 2);
  }
}
```

### 3.4 控制器

```typescript
// backend/src/controllers/TransactionImportController.ts

import { Request, Response } from 'express';
import { TransactionImportService } from '../services/TransactionImportService';
import { TemplateGeneratorService } from '../services/TemplateGeneratorService';
import { parseExcelFile, parseJsonFile } from '../utils/excelParser';

export class TransactionImportController {
  constructor(
    private importService: TransactionImportService,
    private templateService: TemplateGeneratorService
  ) {}

  /**
   * 下载Excel模板
   */
  async downloadExcelTemplate(req: Request, res: Response) {
    try {
      const buffer = this.templateService.generateExcelTemplate();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=transaction_import_template.xlsx');
      res.send(buffer);
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 下载JSON模板
   */
  async downloadJsonTemplate(req: Request, res: Response) {
    try {
      const json = this.templateService.generateJsonTemplate();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=transaction_import_template.json');
      res.send(json);
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 批量导入交易
   */
  async importTransactions(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { portfolioId, tradingAccountId, assetId } = req.body;
      const file = req.file;
      
      // 1. 验证必填参数
      if (!portfolioId || !tradingAccountId || !assetId) {
        return res.status(400).json({
          error: '缺少必填参数：portfolioId, tradingAccountId, assetId'
        });
      }
      
      if (!file) {
        return res.status(400).json({ error: '未上传文件' });
      }
      
      // 2. 解析文件
      let transactions;
      if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet')) {
        transactions = parseExcelFile(file.buffer);
      } else if (file.mimetype.includes('json')) {
        transactions = parseJsonFile(file.buffer);
      } else {
        return res.status(400).json({ error: '不支持的文件格式' });
      }
      
      // 3. 导入交易
      const context = { userId, portfolioId, tradingAccountId, assetId };
      const result = await this.importService.importTransactions(context, transactions);
      
      // 4. 返回结果
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

### 3.5 前端实现

```typescript
// frontend/src/pages/admin/TransactionManagement/ImportExport/ImportModal.tsx

import React, { useState } from 'react';
import { Modal, Steps, Select, Upload, Button, Table, message } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ visible, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // 步骤1：选择上下文
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // 步骤2：上传文件
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileType, setFileType] = useState<'excel' | 'json'>('excel');
  
  // 步骤3：预览数据
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  // 加载投资组合列表
  useEffect(() => {
    fetchPortfolios();
  }, []);

  // 投资组合变化时，加载交易账户
  useEffect(() => {
    if (selectedPortfolio) {
      fetchAccounts(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  // 下载模板
  const handleDownloadTemplate = (format: 'excel' | 'json') => {
    const url = format === 'excel' 
      ? '/api/transactions/import/template/excel'
      : '/api/transactions/import/template/json';
    
    window.open(url, '_blank');
  };

  // 上传文件
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    
    // 解析并预览
    const formData = new FormData();
    formData.append('file', file);
    formData.append('portfolioId', selectedPortfolio.id);
    formData.append('tradingAccountId', selectedAccount.id);
    formData.append('assetId', selectedAsset.id);
    
    try {
      const response = await fetch('/api/transactions/import/preview', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPreviewData(result.data);
        setValidationErrors([]);
        setCurrentStep(2);
      } else {
        setValidationErrors(result.errors);
        message.error(`发现${result.errors.length}个错误`);
      }
    } catch (error) {
      message.error('文件解析失败：' + error.message);
    }
  };

  // 确认导入
  const handleConfirmImport = async () => {
    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('portfolioId', selectedPortfolio.id);
    formData.append('tradingAccountId', selectedAccount.id);
    formData.append('assetId', selectedAsset.id);
    
    try {
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success(result.summary);
        onSuccess();
        onClose();
      } else {
        message.error(result.summary);
        setValidationErrors(result.errors);
      }
    } catch (error) {
      message.error('导入失败：' + error.message);
    }
  };

  return (
    <Modal
      title="批量导入交易"
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Steps current={currentStep}>
        <Steps.Step title="选择上下文" />
        <Steps.Step title="上传文件" />
        <Steps.Step title="预览确认" />
      </Steps>

      {/* 步骤1：选择上下文 */}
      {currentStep === 0 && (
        <div style={{ marginTop: 24 }}>
          <Select
            placeholder="选择投资组合"
            style={{ width: '100%', marginBottom: 16 }}
            value={selectedPortfolio?.id}
            onChange={(id) => setSelectedPortfolio(portfolios.find(p => p.id === id))}
          >
            {portfolios.map(p => (
              <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
            ))}
          </Select>

          <Select
            placeholder="选择交易账户"
            style={{ width: '100%', marginBottom: 16 }}
            value={selectedAccount?.id}
            onChange={(id) => setSelectedAccount(accounts.find(a => a.id === id))}
            disabled={!selectedPortfolio}
          >
            {accounts.map(a => (
              <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
            ))}
          </Select>

          <Select
            showSearch
            placeholder="搜索并选择资产"
            style={{ width: '100%', marginBottom: 16 }}
            value={selectedAsset?.id}
            onChange={(id) => setSelectedAsset(assets.find(a => a.id === id))}
            onSearch={handleAssetSearch}
            filterOption={false}
          >
            {assets.map(a => (
              <Select.Option key={a.id} value={a.id}>
                {a.symbol} - {a.name}
              </Select.Option>
            ))}
          </Select>

          <Button
            type="primary"
            onClick={() => setCurrentStep(1)}
            disabled={!selectedPortfolio || !selectedAccount || !selectedAsset}
          >
            下一步
          </Button>
        </div>
      )}

      {/* 步骤2：上传文件 */}
      {currentStep === 1 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadTemplate('excel')}
              style={{ marginRight: 8 }}
            >
              下载Excel模板
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadTemplate('json')}
            >
              下载JSON模板
            </Button>
          </div>

          <Upload
            accept=".xlsx,.xls,.json"
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false;
            }}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>

          {validationErrors.length > 0 && (
            <Table
              dataSource={validationErrors}
              columns={[
                { title: '行号', dataIndex: 'row', key: 'row' },
                { title: '字段', dataIndex: 'field', key: 'field' },
                { title: '错误值', dataIndex: 'value', key: 'value' },
                { title: '错误信息', dataIndex: 'message', key: 'message' }
              ]}
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )}

      {/* 步骤3：预览确认 */}
      {currentStep === 2 && (
        <div style={{ marginTop: 24 }}>
          <Table
            dataSource={previewData}
            columns={[
              { title: '日期', dataIndex: 'date', key: 'date' },
              { title: '类型', dataIndex: 'type', key: 'type' },
              { title: '数量', dataIndex: 'quantity', key: 'quantity' },
              { title: '价格', dataIndex: 'price', key: 'price' },
              { title: '币种', dataIndex: 'currency', key: 'currency' },
              { title: '手续费', dataIndex: 'fee', key: 'fee' },
              { title: '备注', dataIndex: 'notes', key: 'notes' }
            ]}
          />

          <div style={{ marginTop: 16 }}>
            <Button onClick={() => setCurrentStep(1)} style={{ marginRight: 8 }}>
              上一步
            </Button>
            <Button type="primary" onClick={handleConfirmImport}>
              确认导入
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
```

---

## 四、API接口定义

### 4.1 下载Excel模板

```
GET /api/transactions/import/template/excel

Response:
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename=transaction_import_template.xlsx
```

### 4.2 下载JSON模板

```
GET /api/transactions/import/template/json

Response:
- Content-Type: application/json
- Content-Disposition: attachment; filename=transaction_import_template.json
```

### 4.3 批量导入交易

```
POST /api/transactions/import

Request:
- Content-Type: multipart/form-data
- Body:
  - file: File (Excel或JSON文件)
  - portfolioId: string
  - tradingAccountId: string
  - assetId: string

Response (成功):
{
  "success": true,
  "count": 10,
  "summary": "成功导入10条交易记录"
}

Response (失败):
{
  "success": false,
  "errors": [
    {
      "row": 2,
      "field": "date",
      "value": "2025-12-31",
      "message": "交易日期不能是未来日期"
    }
  ],
  "summary": "发现1个错误，请修正后重新上传"
}
```

---

## 五、测试用例

### 5.1 单元测试

```typescript
// backend/src/services/__tests__/TransactionImportService.test.ts

describe('TransactionImportService', () => {
  describe('validateDate', () => {
    it('应该接受有效的日期格式', () => {
      const error = service.validateDate('2024-01-15');
      expect(error).toBeNull();
    });

    it('应该拒绝无效的日期格式', () => {
      const error = service.validateDate('2024/01/15');
      expect(error).toBe('日期格式错误，必须是 YYYY-MM-DD');
    });

    it('应该拒绝未来日期', () => {
      const futureDate = '2025-12-31';
      const error = service.validateDate(futureDate);
      expect(error).toBe('交易日期不能是未来日期');
    });
  });

  describe('validateType', () => {
    it('应该接受有效的交易类型', () => {
      const error = service.validateType('STOCK_BUY');
      expect(error).toBeNull();
    });

    it('应该拒绝无效的交易类型', () => {
      const error = service.validateType('INVALID_TYPE');
      expect(error).toContain('无效的交易类型');
    });
  });

  describe('importTransactions', () => {
    it('应该成功导入有效的交易数据', async () => {
      const context = {
        userId: 'user1',
        portfolioId: 'portfolio1',
        tradingAccountId: 'account1',
        assetId: 'asset1'
      };

      const transactions = [
        {
          date: '2024-01-15',
          type: 'STOCK_BUY',
          quantity: 100,
          price: 320.5,
          currency: 'HKD'
        }
      ];

      const result = await service.importTransactions(context, transactions);
      
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });

    it('应该拒绝包含错误的交易数据', async () => {
      const context = {
        userId: 'user1',
        portfolioId: 'portfolio1',
        tradingAccountId: 'account1',
        assetId: 'asset1'
      };

      const transactions = [
        {
          date: '2025-12-31',  // 未来日期
          type: 'STOCK_BUY',
          quantity: 100,
          price: 320.5,
          currency: 'HKD'
        }
      ];

      const result = await service.importTransactions(context, transactions);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
```

---

## 六、部署清单

### 6.1 后端部署

- [ ] 安装依赖：`xlsx`
- [ ] 创建服务类：`TransactionImportService`, `TemplateGeneratorService`
- [ ] 创建控制器：`TransactionImportController`
- [ ] 注册路由：`/api/transactions/import/*`
- [ ] 配置文件上传中间件（multer）
- [ ] 运行单元测试

### 6.2 前端部署

- [ ] 创建导入弹窗组件：`ImportModal.tsx`
- [ ] 创建上下文选择器：`ContextSelector.tsx`
- [ ] 创建模板下载器：`TemplateDownloader.tsx`
- [ ] 集成到交易管理页面
- [ ] 测试完整导入流程

### 6.3 文档部署

- [ ] 更新用户手册
- [ ] 创建视频教程
- [ ] 准备FAQ文档

---

## 七、版本历史

### v2.0 (2024-10-27)
- ✨ 优化导入流程：界面预选投资组合/账户/资产
- ✨ 简化文件结构：移除portfolio、account、asset字段
- ✨ 提供标准模板：Excel和JSON模板文件
- ✨ 减少必填字段：从8个降至5个
- 🔧 优化用户体验：减少错误，提高导入成功率

### v1.0 (2024-10-26)
- 🎉 初始版本：支持Excel和JSON导入
- 📝 完整的验证规则和错误处理
- 🔒 原子性操作保证数据一致性
