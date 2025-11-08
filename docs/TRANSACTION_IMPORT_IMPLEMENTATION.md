# 交易导入导出实现方案

## 一、技术架构

### 1.1 后端架构

```
backend/src/
├── controllers/
│   └── TransactionImportController.ts    # 导入导出控制器
├── services/
│   ├── TransactionImportService.ts       # 导入业务逻辑
│   ├── TransactionExportService.ts       # 导出业务逻辑
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
│   ├── ImportModal.tsx                   # 导入弹窗
│   ├── ExportModal.tsx                   # 导出弹窗
│   ├── PreviewTable.tsx                  # 预览表格
│   └── FieldMapping.tsx                  # 字段映射
└── templates/
    ├── transaction_template.xlsx         # Excel模板
    └── transaction_schema.json           # JSON Schema
```

## 二、数据格式定义

### 2.1 导入规则说明

**⚠️ 重要约束**:
1. **资产必须预先存在**: 导入的交易所涉及的所有资产必须已在系统中创建，否则整批导入失败
2. **原子性操作**: 一批数据要么全部成功，要么全部失败，不允许部分成功
3. **事务保证**: 使用数据库事务确保数据一致性
4. **预验证机制**: 导入前先验证所有资产是否存在，任何一个不存在则拒绝整批导入

**验证流程**:
```
上传文件 → 解析数据 → 验证所有资产存在 → 验证业务规则 → 事务导入 → 全部成功/全部回滚
```

### 2.2 Excel格式

**Sheet1: 交易数据**

| 投资组合 | 交易账户 | 日期 | 资产代码 | 资产名称 | 交易类型 | 数量 | 价格 | 币种 | 手续费 | 备注 |
|---------|---------|------|---------|---------|---------|------|------|------|--------|------|
| 我的投资组合 | 港股账户 | 2024-01-15 | 00700.HK | 腾讯控股 | STOCK_BUY | 100 | 320.5 | HKD | 10 | 建仓 |
| 我的投资组合 | 美股账户 | 2024-02-20 | AAPL | Apple Inc. | STOCK_SELL | 50 | 185.2 | USD | 5 | 减仓 |

**注意**: 
- **投资组合**必须是用户已创建的组合
- **交易账户**必须属于指定的投资组合
- **资产代码**必须与系统中已存在的资产完全匹配
- **交易类型**必须是系统定义的类型（见下方列表）
- 资产名称仅用于可读性，实际匹配以代码为准

### 2.3 JSON格式

```json
{
  "version": "1.0",
  "metadata": {
    "exportDate": "2024-01-15T10:30:00Z",
    "totalRecords": 2,
    "source": "FinApp"
  },
  "transactions": [
    {
      "portfolio": "我的投资组合",
      "account": "港股账户",
      "date": "2024-01-15",
      "asset": {
        "symbol": "00700.HK",
        "name": "腾讯控股"
      },
      "type": "STOCK_BUY",
      "quantity": 100,
      "price": 320.5,
      "currency": "HKD",
      "fee": 10,
      "notes": "建仓",
      "tags": ["长期持有", "核心资产"]
    },
    {
      "portfolio": "我的投资组合",
      "account": "美股账户",
      "date": "2024-02-20",
      "asset": {
        "symbol": "AAPL",
        "name": "Apple Inc."
      },
      "type": "STOCK_SELL",
      "quantity": 50,
      "price": 185.2,
      "currency": "USD",
      "fee": 5
    }
  ]
}
```

**注意**: 
- `portfolio` 必须是用户已创建的投资组合
- `account` 必须属于指定的投资组合
- `asset.symbol` 必须与系统中已存在的资产匹配
- `type` 必须是系统定义的交易类型
- `currency` 必须是ISO 4217货币代码
- `asset.name` 等其他字段仅用于可读性

### 2.4 CSV格式（导出）

```csv
日期,资产代码,资产名称,交易类型,数量,价格,手续费,总金额,账户,备注
2024-01-15,00700.HK,腾讯控股,买入,100,320.5,10,32060,港股账户,建仓
2024-02-20,AAPL,Apple Inc.,卖出,50,185.2,5,-9255,美股账户,减仓
```

## 三、核心代码实现

### 3.1 类型定义

```typescript
// backend/src/types/import.types.ts

export interface ImportTransaction {
  portfolio: string;           // 投资组合名称（必填）
  account: string;             // 交易账户名称（必填）
  date: string;                // 交易日期（必填）
  asset: {
    symbol: string;            // 资产代码（必填）
    name?: string;             // 资产名称（可选，仅用于可读性）
  };
  type: TransactionType;       // 交易类型（必填，系统定义）
  quantity: number;            // 交易数量（必填）
  price: number;               // 交易价格（必填）
  currency: string;            // 交易币种（必填，ISO 4217）
  fee?: number;                // 手续费（可选）
  notes?: string;              // 备注（可选）
  tags?: string[];             // 标签（可选）
}

// 系统支持的交易类型
export type TransactionType = 
  | 'STOCK_BUY' | 'STOCK_SELL'
  | 'FUND_SUBSCRIBE' | 'FUND_REDEEM'
  | 'BOND_BUY' | 'BOND_SELL'
  | 'OPTION_BUY' | 'OPTION_SELL' | 'OPTION_EXERCISE'
  | 'DEPOSIT' | 'WITHDRAWAL'
  | 'DIVIDEND' | 'INTEREST' | 'FEE'
  | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

export interface ExportOptions {
  format: 'excel' | 'json' | 'csv';
  dateRange?: {
    start: string;
    end: string;
  };
  accounts?: string[];
  assetTypes?: string[];
  includeMetadata?: boolean;
}
```

### 3.2 Excel解析器

```typescript
// backend/src/utils/excelParser.ts

import * as XLSX from 'xlsx';
import { ImportTransaction } from '../types/import.types';

export class ExcelParser {
  /**
   * 解析Excel文件
   */
  static parseFile(buffer: Buffer): ImportTransaction[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON，保留原始数据类型
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });

    return rawData.map((row: any, index: number) => {
      try {
        return this.parseRow(row, index + 2); // +2因为有表头
      } catch (error) {
        throw new Error(`第${index + 2}行解析失败: ${error.message}`);
      }
    });
  }

  /**
   * 解析单行数据
   */
  private static parseRow(row: any, rowNumber: number): ImportTransaction {
    // 处理Excel日期序列号
    const date = this.parseExcelDate(row['日期'] || row['date']);
    
    return {
      portfolio: row['投资组合'] || row['portfolio'],
      account: row['交易账户'] || row['account'],
      date,
      asset: {
        symbol: this.normalizeSymbol(row['资产代码'] || row['symbol']),
        name: row['资产名称'] || row['name']
      },
      type: this.normalizeTransactionType(row['交易类型'] || row['type']),
      quantity: parseFloat(row['数量'] || row['quantity']),
      price: parseFloat(row['价格'] || row['price']),
      currency: this.normalizeCurrency(row['币种'] || row['currency']),
      fee: parseFloat(row['手续费'] || row['fee']) || 0,
      notes: row['备注'] || row['notes'],
      tags: this.parseTags(row['标签'] || row['tags'])
    };
  }

  /**
   * 处理Excel日期
   */
  private static parseExcelDate(value: any): string {
    if (!value) throw new Error('日期不能为空');
    
    // 如果是Excel序列号
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    
    // 如果是字符串
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new Error('日期格式无效');
      return date.toISOString().split('T')[0];
    }
    
    throw new Error('日期格式不支持');
  }

  /**
   * 标准化Symbol
   */
  private static normalizeSymbol(symbol: string): string {
    if (!symbol) throw new Error('资产代码不能为空');
    return symbol.trim().toUpperCase();
  }

  /**
   * 标准化交易类型
   */
  private static normalizeTransactionType(type: string): TransactionType {
    if (!type) throw new Error('交易类型不能为空');
    
    // 系统支持的交易类型（与数据库CHECK约束一致）
    const VALID_TYPES: TransactionType[] = [
      'STOCK_BUY', 'STOCK_SELL',
      'FUND_SUBSCRIBE', 'FUND_REDEEM',
      'BOND_BUY', 'BOND_SELL',
      'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE',
      'DEPOSIT', 'WITHDRAWAL',
      'DIVIDEND', 'INTEREST', 'FEE',
      'TRANSFER_IN', 'TRANSFER_OUT'
    ];
    
    // 便捷别名映射（可选）
    const typeAliases: Record<string, TransactionType> = {
      '买入': 'STOCK_BUY',
      '买': 'STOCK_BUY',
      'buy': 'STOCK_BUY',
      '卖出': 'STOCK_SELL',
      '卖': 'STOCK_SELL',
      'sell': 'STOCK_SELL',
      '申购': 'FUND_SUBSCRIBE',
      'subscribe': 'FUND_SUBSCRIBE',
      '赎回': 'FUND_REDEEM',
      'redeem': 'FUND_REDEEM',
      '分红': 'DIVIDEND',
      'dividend': 'DIVIDEND',
      '存入': 'DEPOSIT',
      'deposit': 'DEPOSIT',
      '取出': 'WITHDRAWAL',
      'withdraw': 'WITHDRAWAL'
    };
    
    // 尝试别名映射
    const mappedType = typeAliases[type.toLowerCase()] || type.toUpperCase();
    
    // 验证是否是有效类型
    if (!VALID_TYPES.includes(mappedType as TransactionType)) {
      throw new Error(
        `不支持的交易类型: ${type}。\n` +
        `支持的类型: ${VALID_TYPES.join(', ')}`
      );
    }
    
    return mappedType as TransactionType;
  }
  
  /**
   * 标准化币种代码
   */
  private static normalizeCurrency(currency: string): string {
    if (!currency) throw new Error('币种不能为空');
    
    const currencyUpper = currency.trim().toUpperCase();
    
    // 验证格式
    if (!/^[A-Z]{3}$/.test(currencyUpper)) {
      throw new Error('币种必须是3位字母代码（如：CNY, USD, HKD）');
    }
    
    return currencyUpper;
  }

  /**
   * 解析标签
   */
  private static parseTags(tags: any): string[] | undefined {
    if (!tags) return undefined;
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      return tags.split(/[,，;；]/).map(t => t.trim()).filter(Boolean);
    }
    return undefined;
  }
}
```

### 3.3 JSON解析器

```typescript
// backend/src/utils/jsonParser.ts

import Joi from 'joi';
import { ImportTransaction } from '../types/import.types';

export class JsonParser {
  /**
   * JSON Schema验证
   */
  private static schema = Joi.object({
    version: Joi.string().optional(),
    metadata: Joi.object().optional(),
    transactions: Joi.array().items(
      Joi.object({
        date: Joi.string().isoDate().required(),
        asset: Joi.object({
          symbol: Joi.string().required(),
          name: Joi.string().optional(),
          type: Joi.string().optional(),
          market: Joi.string().optional()
        }).required(),
        type: Joi.string().valid('buy', 'sell', 'dividend', 'split').required(),
        quantity: Joi.number().positive().required(),
        price: Joi.number().min(0).required(),
        fee: Joi.number().min(0).optional(),
        account: Joi.string().optional(),
        notes: Joi.string().optional(),
        tags: Joi.array().items(Joi.string()).optional()
      })
    ).required(),
    assets: Joi.array().optional()
  });

  /**
   * 解析JSON文件
   */
  static parseFile(buffer: Buffer): ImportTransaction[] {
    try {
      const data = JSON.parse(buffer.toString('utf-8'));
      
      // 验证Schema
      const { error, value } = this.schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        const errors = error.details.map(d => d.message).join('; ');
        throw new Error(`JSON格式验证失败: ${errors}`);
      }
      
      return value.transactions;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('JSON格式错误，请检查文件格式');
      }
      throw error;
    }
  }

  /**
   * 生成JSON模板
   */
  static generateTemplate(): object {
    return {
      version: '1.0',
      metadata: {
        description: 'FinApp交易导入模板',
        fields: {
          date: '交易日期 (YYYY-MM-DD)',
          'asset.symbol': '资产代码（必填）',
          'asset.name': '资产名称（可选）',
          type: '交易类型: buy/sell/dividend/split',
          quantity: '数量（必填）',
          price: '价格（必填）',
          fee: '手续费（可选）',
          account: '账户名称（可选）',
          notes: '备注（可选）',
          tags: '标签数组（可选）'
        }
      },
      transactions: [
        {
          date: '2024-01-15',
          asset: {
            symbol: '00700.HK',
            name: '腾讯控股'
          },
          type: 'buy',
          quantity: 100,
          price: 320.5,
          fee: 10,
          account: '港股账户',
          notes: '建仓',
          tags: ['长期持有']
        }
      ]
    };
  }
}
```

### 3.4 导入服务

```typescript
// backend/src/services/TransactionImportService.ts

import { PrismaClient } from '@prisma/client';
import { ExcelParser } from '../utils/excelParser';
import { JsonParser } from '../utils/jsonParser';
import { ImportTransaction, ImportResult, ImportError } from '../types/import.types';

export class TransactionImportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 导入文件
   * 
   * 重要约束：
   * 1. 所有资产必须预先存在，不会自动创建
   * 2. 采用原子性操作，全部成功或全部失败
   * 3. 任何验证失败都会导致整批导入失败
   */
  async importFile(
    buffer: Buffer,
    format: 'excel' | 'json',
    userId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      total: 0,
      imported: 0,
      failed: 0,
      errors: [],
      warnings: []
    };

    try {
      // 1. 解析文件
      const transactions = format === 'excel' 
        ? ExcelParser.parseFile(buffer)
        : JsonParser.parseFile(buffer);
      
      result.total = transactions.length;

      if (transactions.length === 0) {
        result.errors.push({
          row: 0,
          message: '文件中没有有效的交易数据'
        });
        return result;
      }

      // 2. 预验证：检查投资组合和账户（原子性检查）
      const portfolioErrors = await this.validatePortfoliosAndAccounts(transactions, userId);
      if (portfolioErrors.length > 0) {
        result.errors = portfolioErrors;
        result.failed = transactions.length;
        return result;
      }

      // 3. 预验证：检查所有资产是否存在
      const assetValidationErrors = await this.validateAllAssetsExist(transactions, userId);
      if (assetValidationErrors.length > 0) {
        result.errors = assetValidationErrors;
        result.failed = transactions.length;
        return result;
      }

      // 4. 业务规则验证
      const businessValidationErrors = await this.validateBusinessRules(transactions, userId);
      if (businessValidationErrors.length > 0) {
        result.errors = businessValidationErrors;
        result.failed = transactions.length;
        return result;
      }

      // 5. 原子性导入：使用事务确保全部成功或全部失败
      try {
        await this.importAllTransactions(transactions, userId);
        result.imported = transactions.length;
        result.success = true;
      } catch (error) {
        result.failed = transactions.length;
        result.errors.push({
          row: 0,
          message: `导入失败（已回滚）: ${error.message}`
        });
      }

      return result;

    } catch (error) {
      result.failed = result.total;
      result.errors.push({
        row: 0,
        message: `导入失败: ${error.message}`
      });
      return result;
    }
  }

  /**
   * 验证投资组合和账户层级关系
   * 
   * 第一道验证：确保投资组合和交易账户都存在且关系正确
   */
  private async validatePortfoliosAndAccounts(
    transactions: ImportTransaction[],
    userId: string
  ): Promise<ImportError[]> {
    const errors: ImportError[] = [];

    // 提取所有唯一的投资组合和账户组合
    const portfolioAccountPairs = [...new Set(
      transactions.map(t => `${t.portfolio}|${t.account}`)
    )];

    // 查询用户的所有投资组合
    const portfolios = await this.prisma.portfolio.findMany({
      where: { 
        user_id: userId,
        is_active: true
      },
      include: {
        tradingAccounts: {
          where: { is_active: true },
          select: { name: true, id: true }
        }
      }
    });

    const portfolioMap = new Map(portfolios.map(p => [p.name, p]));

    // 验证每个交易的投资组合和账户
    transactions.forEach((tx, index) => {
      const row = index + 2;

      // 验证投资组合存在
      const portfolio = portfolioMap.get(tx.portfolio);
      if (!portfolio) {
        errors.push({
          row,
          field: 'portfolio',
          message: `投资组合 "${tx.portfolio}" 不存在或已停用。请先在【投资组合管理】中创建该组合。`,
          value: tx.portfolio
        });
        return;
      }

      // 验证交易账户存在且属于该投资组合
      const account = portfolio.tradingAccounts.find(a => a.name === tx.account);
      if (!account) {
        errors.push({
          row,
          field: 'account',
          message: `交易账户 "${tx.account}" 在投资组合 "${tx.portfolio}" 中不存在或已停用。请先在该组合下创建交易账户。`,
          value: tx.account
        });
      }
    });

    // 生成汇总错误信息
    if (errors.length > 0) {
      const missingPortfolios = [...new Set(
        errors.filter(e => e.field === 'portfolio').map(e => e.value)
      )];
      const missingAccounts = [...new Set(
        errors.filter(e => e.field === 'account').map(e => e.value)
      )];

      const summary: string[] = [];
      if (missingPortfolios.length > 0) {
        summary.push(`投资组合不存在: ${missingPortfolios.join(', ')}`);
      }
      if (missingAccounts.length > 0) {
        summary.push(`交易账户不存在或不属于指定组合: ${missingAccounts.join(', ')}`);
      }

      errors.unshift({
        row: 0,
        message: `导入失败：${summary.join('；')}`
      });
    }

    return errors;
  }

  /**
   * 验证所有资产是否存在
   * 
   * 第二道验证：确保所有交易涉及的资产都已在系统中创建
   */
  private async validateAllAssetsExist(
    transactions: ImportTransaction[],
    userId: string
  ): Promise<ImportError[]> {
    const errors: ImportError[] = [];

    // 提取所有唯一的资产代码
    const uniqueSymbols = [...new Set(transactions.map(t => t.asset.symbol))];

    // 查询所有资产（不限用户，资产是全局的）
    const existingAssets = await this.prisma.asset.findMany({
      where: { 
        symbol: { in: uniqueSymbols },
        is_active: true
      },
      select: { symbol: true, id: true, name: true, currency: true }
    });

    const assetMap = new Map(existingAssets.map(a => [a.symbol, a]));

    // 检查每个交易的资产是否存在
    transactions.forEach((tx, index) => {
      const row = index + 2;

      const asset = assetMap.get(tx.asset.symbol);
      if (!asset) {
        errors.push({
          row,
          field: 'asset.symbol',
          message: `资产不存在: ${tx.asset.symbol}。请先在资产管理中创建该资产后再导入交易。`,
          value: tx.asset.symbol
        });
      } else {
        // 可选：验证币种是否匹配
        if (asset.currency !== tx.currency) {
          console.warn(
            `第${row}行: 交易币种 ${tx.currency} 与资产币种 ${asset.currency} 不一致`
          );
        }
      }
    });

    // 生成汇总错误信息
    if (errors.length > 0) {
      const missingSymbols = [...new Set(errors.map(e => e.value))];
      errors.unshift({
        row: 0,
        message: `导入失败：发现 ${missingSymbols.length} 个不存在的资产 [${missingSymbols.join(', ')}]。请先创建这些资产后再导入交易。`
      });
    }

    return errors;
  }

  /**
   * 验证业务规则
   * 
   * 在确认投资组合、账户和资产都存在后，验证其他业务规则
   */
  private async validateBusinessRules(
    transactions: ImportTransaction[],
    userId: string
  ): Promise<ImportError[]> {
    const errors: ImportError[] = [];

    transactions.forEach((tx, index) => {
      const row = index + 2; // Excel行号

      // 验证必填字段
      if (!tx.portfolio) {
        errors.push({
          row,
          field: 'portfolio',
          message: '投资组合不能为空',
          value: tx.portfolio
        });
      }

      if (!tx.account) {
        errors.push({
          row,
          field: 'account',
          message: '交易账户不能为空',
          value: tx.account
        });
      }

      if (!tx.currency) {
        errors.push({
          row,
          field: 'currency',
          message: '币种不能为空',
          value: tx.currency
        });
      }

      // 验证数量
      if (tx.quantity <= 0) {
        errors.push({
          row,
          field: 'quantity',
          message: '数量必须大于0',
          value: tx.quantity
        });
      }

      // 验证价格
      if (tx.price < 0) {
        errors.push({
          row,
          field: 'price',
          message: '价格不能为负数',
          value: tx.price
        });
      }

      // 验证手续费
      if (tx.fee && tx.fee < 0) {
        errors.push({
          row,
          field: 'fee',
          message: '手续费不能为负数',
          value: tx.fee
        });
      }

      // 验证日期
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) {
        errors.push({
          row,
          field: 'date',
          message: '日期格式无效',
          value: tx.date
        });
      }

      // 验证日期不能是未来
      if (txDate > new Date()) {
        errors.push({
          row,
          field: 'date',
          message: '交易日期不能是未来日期',
          value: tx.date
        });
      }

      // 验证币种格式
      if (tx.currency && !/^[A-Z]{3}$/.test(tx.currency)) {
        errors.push({
          row,
          field: 'currency',
          message: '币种必须是3位大写字母代码（如：CNY, USD, HKD）',
          value: tx.currency
        });
      }
    });

    return errors;
  }

  /**
   * 原子性导入所有交易
   * 
   * 使用数据库事务确保：
   * 1. 所有交易要么全部成功，要么全部失败
   * 2. 任何错误都会导致整个事务回滚
   * 3. 保证数据一致性
   */
  private async importAllTransactions(
    transactions: ImportTransaction[],
    userId: string
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 获取所有需要的映射数据
      const portfolioNames = [...new Set(transactions.map(t => t.portfolio))];
      const symbols = [...new Set(transactions.map(t => t.asset.symbol))];

      // 查询投资组合及其交易账户
      const portfolios = await tx.portfolio.findMany({
        where: { 
          user_id: userId,
          name: { in: portfolioNames }
        },
        include: {
          tradingAccounts: {
            select: { name: true, id: true }
          }
        }
      });

      // 查询资产
      const assets = await tx.asset.findMany({
        where: { symbol: { in: symbols } },
        select: { symbol: true, id: true }
      });

      // 构建映射表
      const portfolioMap = new Map(portfolios.map(p => [p.name, p]));
      const assetMap = new Map(assets.map(a => [a.symbol, a.id]));

      // 转换为数据库记录
      const records = transactions.map(t => {
        // 获取投资组合
        const portfolio = portfolioMap.get(t.portfolio);
        if (!portfolio) {
          throw new Error(`投资组合 ${t.portfolio} 不存在`);
        }

        // 获取交易账户
        const account = portfolio.tradingAccounts.find(a => a.name === t.account);
        if (!account) {
          throw new Error(`交易账户 ${t.account} 在投资组合 ${t.portfolio} 中不存在`);
        }

        // 获取资产
        const assetId = assetMap.get(t.asset.symbol);
        if (!assetId) {
          throw new Error(`资产 ${t.asset.symbol} 不存在`);
        }

        // 计算总金额
        const baseAmount = t.quantity * t.price;
        const totalAmount = t.type.includes('BUY') || t.type === 'DEPOSIT'
          ? baseAmount + (t.fee || 0)
          : baseAmount - (t.fee || 0);

        // 确定交易方向
        const side = this.mapTransactionSide(t.type);

        return {
          user_id: userId,
          portfolio_id: portfolio.id,
          trading_account_id: account.id,
          asset_id: assetId,
          transaction_type: t.type,
          side: side,
          quantity: t.quantity,
          price: t.price,
          total_amount: totalAmount,
          fees: t.fee || 0,
          currency: t.currency,
          transaction_date: new Date(t.date),
          executed_at: new Date(t.date),
          notes: t.notes,
          tags: t.tags || [],
          status: 'EXECUTED',
          created_at: new Date(),
          updated_at: new Date()
        };
      });

      // 批量插入（不跳过重复，确保数据完整性）
      await tx.transaction.createMany({
        data: records,
        skipDuplicates: false
      });
    }, {
      maxWait: 10000, // 最大等待时间 10秒
      timeout: 30000, // 事务超时时间 30秒
    });
  }

  /**
   * 映射交易方向
   */
  private mapTransactionSide(type: TransactionType): string {
    if (type.includes('BUY') || type.includes('SUBSCRIBE') || type === 'OPTION_EXERCISE') {
      return 'BUY';
    } else if (type.includes('SELL') || type.includes('REDEEM')) {
      return 'SELL';
    } else if (type === 'DEPOSIT' || type === 'DIVIDEND' || type === 'INTEREST' || type === 'TRANSFER_IN') {
      return 'DEPOSIT';
    } else if (type === 'WITHDRAWAL' || type === 'FEE' || type === 'TRANSFER_OUT') {
      return 'WITHDRAWAL';
    }
    return 'BUY'; // 默认
  }
}
```

### 3.5 导出服务

```typescript
// backend/src/services/TransactionExportService.ts

import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';
import { PrismaClient } from '@prisma/client';
import { ExportOptions } from '../types/import.types';

export class TransactionExportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 导出交易数据
   */
  async exportTransactions(
    userId: string,
    options: ExportOptions
  ): Promise<Buffer> {
    // 查询数据
    const transactions = await this.prisma.transaction.findMany({
      where: {
        user_id: userId,
        ...(options.dateRange && {
          date: {
            gte: new Date(options.dateRange.start),
            lte: new Date(options.dateRange.end)
          }
        }),
        ...(options.accounts && {
          account: { name: { in: options.accounts } }
        })
      },
      include: {
        asset: true,
        account: true
      },
      orderBy: { date: 'desc' }
    });

    // 根据格式导出
    switch (options.format) {
      case 'excel':
        return this.exportToExcel(transactions, options);
      case 'json':
        return this.exportToJson(transactions, options);
      case 'csv':
        return this.exportToCsv(transactions);
      default:
        throw new Error(`不支持的导出格式: ${options.format}`);
    }
  }

  /**
   * 导出为Excel
   */
  private exportToExcel(transactions: any[], options: ExportOptions): Buffer {
    const data = transactions.map(t => ({
      '日期': t.date.toISOString().split('T')[0],
      '资产代码': t.asset.symbol,
      '资产名称': t.asset.name,
      '交易类型': this.formatTransactionType(t.type),
      '数量': t.quantity,
      '价格': t.price,
      '手续费': t.fee,
      '总金额': this.calculateTotal(t),
      '账户': t.account?.name || '',
      '备注': t.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // 设置列宽
    worksheet['!cols'] = [
      { wch: 12 }, // 日期
      { wch: 12 }, // 资产代码
      { wch: 20 }, // 资产名称
      { wch: 10 }, // 交易类型
      { wch: 10 }, // 数量
      { wch: 10 }, // 价格
      { wch: 10 }, // 手续费
      { wch: 12 }, // 总金额
      { wch: 15 }, // 账户
      { wch: 30 }  // 备注
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '交易记录');

    // 如果需要元数据
    if (options.includeMetadata) {
      const metaData = [{
        '导出时间': new Date().toISOString(),
        '记录数': transactions.length,
        '日期范围': options.dateRange 
          ? `${options.dateRange.start} 至 ${options.dateRange.end}`
          : '全部'
      }];
      const metaSheet = XLSX.utils.json_to_sheet(metaData);
      XLSX.utils.book_append_sheet(workbook, metaSheet, '导出信息');
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 导出为JSON
   */
  private exportToJson(transactions: any[], options: ExportOptions): Buffer {
    const data = {
      version: '1.0',
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: transactions.length,
        dateRange: options.dateRange,
        source: 'FinApp'
      },
      transactions: transactions.map(t => ({
        date: t.date.toISOString().split('T')[0],
        asset: {
          symbol: t.asset.symbol,
          name: t.asset.name,
          type: t.asset.type,
          market: t.asset.market
        },
        type: t.type,
        quantity: t.quantity,
        price: t.price,
        fee: t.fee,
        account: t.account?.name,
        notes: t.notes
      }))
    };

    return Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 导出为CSV
   */
  private exportToCsv(transactions: any[]): Buffer {
    const data = transactions.map(t => ({
      日期: t.date.toISOString().split('T')[0],
      资产代码: t.asset.symbol,
      资产名称: t.asset.name,
      交易类型: this.formatTransactionType(t.type),
      数量: t.quantity,
      价格: t.price,
      手续费: t.fee,
      总金额: this.calculateTotal(t),
      账户: t.account?.name || '',
      备注: t.notes || ''
    }));

    const parser = new Parser({
      fields: ['日期', '资产代码', '资产名称', '交易类型', '数量', '价格', '手续费', '总金额', '账户', '备注']
    });

    return Buffer.from(parser.parse(data), 'utf-8');
  }

  /**
   * 格式化交易类型
   */
  private formatTransactionType(type: string): string {
    const typeMap: Record<string, string> = {
      'buy': '买入',
      'sell': '卖出',
      'dividend': '分红',
      'split': '拆股'
    };
    return typeMap[type] || type;
  }

  /**
   * 计算总金额
   */
  private calculateTotal(transaction: any): number {
    const base = transaction.quantity * transaction.price;
    return transaction.type === 'buy' 
      ? base + transaction.fee 
      : base - transaction.fee;
  }
}
```

### 3.6 前端导入组件

```typescript
// frontend/src/pages/admin/TransactionManagement/ImportExport/ImportModal.tsx

import React, { useState } from 'react';
import { Modal, Upload, Button, Steps, Table, message, Radio, Alert } from 'antd';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;
const { Step } = Steps;

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ visible, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [format, setFormat] = useState<'excel' | 'json'>('excel');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  /**
   * 下载模板
   */
  const downloadTemplate = async () => {
    try {
      const response = await fetch(`/api/transactions/import/template?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'excel' 
        ? 'transaction_template.xlsx' 
        : 'transaction_template.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('模板下载失败');
    }
  };

  /**
   * 文件上传配置
   */
  const uploadProps = {
    accept: format === 'excel' ? '.xlsx,.xls' : '.json',
    maxCount: 1,
    fileList,
    beforeUpload: (file: File) => {
      setFileList([file as any]);
      return false; // 阻止自动上传
    },
    onRemove: () => {
      setFileList([]);
      setPreviewData([]);
    }
  };

  /**
   * 解析并预览
   */
  const handlePreview = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0] as any);
    formData.append('format', format);

    try {
      const response = await fetch('/api/transactions/import/preview', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        Modal.error({
          title: '文件验证失败',
          content: (
            <div>
              {result.errors.map((err: any, idx: number) => (
                <div key={idx}>第{err.row}行: {err.message}</div>
              ))}
            </div>
          )
        });
        return;
      }

      setPreviewData(result.data);
      setCurrentStep(1);
    } catch (error) {
      message.error('文件解析失败');
    }
  };

  /**
   * 确认导入
   */
  const handleImport = async () => {
    setImporting(true);

    const formData = new FormData();
    formData.append('file', fileList[0] as any);
    formData.append('format', format);

    try {
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        message.success(`成功导入 ${result.imported} 条交易记录`);
        onSuccess();
        handleClose();
      } else {
        Modal.error({
          title: '导入失败（已回滚）',
          width: 600,
          content: (
            <div>
              <Alert
                message="所有数据已回滚，未导入任何记录"
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <div style={{ marginBottom: 8 }}>
                <strong>总记录数:</strong> {result.total} 条
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>失败原因:</strong>
              </div>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {result.errors.map((err: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: 8, color: '#ff4d4f' }}>
                    {err.row > 0 ? `第${err.row}行: ` : ''}{err.message}
                  </div>
                ))}
              </div>
            </div>
          )
        });
      }
    } catch (error) {
      message.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  /**
   * 关闭弹窗
   */
  const handleClose = () => {
    setCurrentStep(0);
    setFileList([]);
    setPreviewData([]);
    onClose();
  };

  /**
   * 预览表格列
   */
  const previewColumns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '资产代码', dataIndex: ['asset', 'symbol'], key: 'symbol' },
    { title: '资产名称', dataIndex: ['asset', 'name'], key: 'name' },
    { title: '交易类型', dataIndex: 'type', key: 'type' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '价格', dataIndex: 'price', key: 'price' },
    { title: '手续费', dataIndex: 'fee', key: 'fee' },
    { title: '账户', dataIndex: 'account', key: 'account' }
  ];

  return (
    <Modal
      title="批量导入交易"
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={null}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="上传文件" />
        <Step title="预览数据" />
        <Step title="确认导入" />
      </Steps>

      {currentStep === 0 && (
        <div>
          <Alert
            message="导入规则说明"
            description={
              <div>
                <div>• <strong>资产必须预先存在</strong>：导入前请确保所有资产已在系统中创建</div>
                <div>• <strong>原子性操作</strong>：一批数据要么全部成功，要么全部失败</div>
                <div>• Excel格式：适合手动编辑，支持批量录入</div>
                <div>• JSON格式：适合程序生成，支持AI辅助导入</div>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Radio.Group 
            value={format} 
            onChange={e => setFormat(e.target.value)}
            style={{ marginBottom: 16 }}
          >
            <Radio.Button value="excel">Excel格式</Radio.Button>
            <Radio.Button value="json">JSON格式</Radio.Button>
          </Radio.Group>

          <Button 
            icon={<DownloadOutlined />} 
            onClick={downloadTemplate}
            style={{ marginBottom: 16, marginLeft: 16 }}
          >
            下载模板
          </Button>

          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 {format === 'excel' ? '.xlsx, .xls' : '.json'} 格式
            </p>
          </Dragger>

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button onClick={handleClose} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={handlePreview}>
              下一步
            </Button>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <Alert
            message={`共解析到 ${previewData.length} 条记录`}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Table
            columns={previewColumns}
            dataSource={previewData}
            rowKey={(_, index) => index!}
            pagination={{ pageSize: 10 }}
            scroll={{ y: 400 }}
          />

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button onClick={() => setCurrentStep(0)} style={{ marginRight: 8 }}>
              上一步
            </Button>
            <Button type="primary" onClick={handleImport} loading={importing}>
              确认导入
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
```

## 四、AI辅助导入示例

### 4.1 使用ChatGPT生成JSON

**用户提示词**:
```
请帮我生成FinApp交易导入JSON，包含以下交易：
1. 2024年1月15日买入腾讯控股(00700.HK) 100股，价格320.5，手续费10元
2. 2024年2月20日卖出苹果(AAPL) 50股，价格185.2，手续费5美元
```

**GPT输出**:
```json
{
  "version": "1.0",
  "transactions": [
    {
      "date": "2024-01-15",
      "asset": {
        "symbol": "00700.HK",
        "name": "腾讯控股"
      },
      "type": "buy",
      "quantity": 100,
      "price": 320.5,
      "fee": 10,
      "account": "港股账户",
      "notes": "建仓"
    },
    {
      "date": "2024-02-20",
      "asset": {
        "symbol": "AAPL",
        "name": "Apple Inc."
      },
      "type": "sell",
      "quantity": 50,
      "price": 185.2,
      "fee": 5,
      "account": "美股账户"
    }
  ]
}
```

### 4.2 从券商对账单提取

**用户提示词**:
```
这是我的券商对账单，请转换为FinApp JSON格式：

交易日期    证券代码    证券名称    买卖标志    成交数量    成交价格    手续费
2024-01-15  00700      腾讯控股    买入        100        320.50     10.00
2024-01-16  09988      阿里巴巴    买入        200        78.30      15.60
```

## 五、性能优化建议

### 5.1 大文件处理

```typescript
// 使用流式处理大文件
import { Readable } from 'stream';
import * as XLSX from 'xlsx';

async function processLargeExcel(filePath: string) {
  const stream = fs.createReadStream(filePath);
  const workbook = XLSX.read(stream, { type: 'stream' });
  
  // 分批处理
  const batchSize = 1000;
  let batch: any[] = [];
  
  for await (const row of workbook.Sheets['Sheet1']) {
    batch.push(row);
    
    if (batch.length >= batchSize) {
      await processBatch(batch);
      batch = [];
    }
  }
  
  if (batch.length > 0) {
    await processBatch(batch);
  }
}
```

### 5.2 并发控制

```typescript
import pLimit from 'p-limit';

// 限制并发数
const limit = pLimit(5);

const tasks = transactions.map(tx => 
  limit(() => importTransaction(tx))
);

await Promise.all(tasks);
```

## 六、错误处理

### 6.1 常见错误及解决方案

| 错误类型 | 原因 | 解决方案 |
|---------|------|---------|
| 资产不存在 | Symbol错误或未创建 | **先在资产管理中创建资产，再导入交易** |
| 日期格式错误 | Excel序列号或格式不对 | 自动识别并转换 |
| 账户不存在 | 账户名称错误或未创建 | 先创建账户或留空使用默认账户 |
| 部分数据错误 | 某些行数据不合法 | **整批回滚，修正后重新导入** |
| 文件过大 | 超过10MB | 分批上传或压缩 |
| JSON格式错误 | 语法错误 | 提供详细错误位置 |
| 事务超时 | 数据量过大 | 分批导入（每批500-1000条） |

### 6.2 错误提示优化

```typescript
// 友好的错误提示
const errorMessages = {
  'ASSET_NOT_FOUND': (symbols: string[]) => 
    `以下资产不存在: ${symbols.join(', ')}。\n` +
    `请先在【资产管理】中创建这些资产后再导入交易。\n` +
    `提示：系统不会自动创建资产，这是为了确保数据准确性。`,
  
  'INVALID_DATE': (value: any) => 
    `日期格式错误: ${value}，请使用 YYYY-MM-DD 格式（如：2024-01-15）`,
  
  'NEGATIVE_QUANTITY': () => 
    `数量不能为负数，卖出请使用"sell"类型`,
  
  'ACCOUNT_NOT_FOUND': (account: string) => 
    `账户 ${account} 不存在，请先创建该账户或留空使用默认账户`,
  
  'TRANSACTION_ROLLBACK': (total: number) => 
    `导入失败，所有 ${total} 条记录已回滚。\n` +
    `请修正错误后重新导入整批数据。`,
  
  'VALIDATION_FAILED': (errorCount: number) => 
    `发现 ${errorCount} 个错误，整批导入已取消。\n` +
    `请修正所有错误后重新导入。`
};
```

### 6.3 原子性保证机制

```typescript
/**
 * 导入流程的原子性保证
 */
class AtomicImportGuard {
  /**
   * 预检查阶段：在事务外进行所有验证
   */
  async preValidate(transactions: ImportTransaction[], userId: string): Promise<void> {
    // 1. 检查所有资产是否存在
    const missingAssets = await this.checkMissingAssets(transactions, userId);
    if (missingAssets.length > 0) {
      throw new ImportError(
        `以下资产不存在: ${missingAssets.join(', ')}`,
        'ASSET_NOT_FOUND',
        missingAssets
      );
    }

    // 2. 检查所有账户是否存在
    const missingAccounts = await this.checkMissingAccounts(transactions, userId);
    if (missingAccounts.length > 0) {
      throw new ImportError(
        `以下账户不存在: ${missingAccounts.join(', ')}`,
        'ACCOUNT_NOT_FOUND',
        missingAccounts
      );
    }

    // 3. 业务规则验证
    const businessErrors = this.validateBusinessRules(transactions);
    if (businessErrors.length > 0) {
      throw new ImportError(
        `业务规则验证失败`,
        'BUSINESS_VALIDATION_FAILED',
        businessErrors
      );
    }
  }

  /**
   * 事务执行阶段：确保原子性
   */
  async executeTransaction(transactions: ImportTransaction[], userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 在事务内执行所有插入操作
      // 任何失败都会导致整个事务回滚
      await this.insertAllTransactions(tx, transactions, userId);
    }, {
      maxWait: 10000,  // 最大等待时间
      timeout: 30000,  // 事务超时时间
      isolationLevel: 'Serializable' // 最高隔离级别
    });
  }
}
```

## 七、测试用例

### 7.1 单元测试

```typescript
describe('ExcelParser', () => {
  it('should parse valid Excel file', () => {
    const buffer = fs.readFileSync('test/fixtures/valid.xlsx');
    const result = ExcelParser.parseFile(buffer);
    expect(result).toHaveLength(10);
    expect(result[0].asset.symbol).toBe('00700.HK');
  });

  it('should handle Excel date serial number', () => {
    const row = { '日期': 44927 }; // 2023-01-01
    const result = ExcelParser.parseRow(row, 2);
    expect(result.date).toBe('2023-01-01');
  });

  it('should normalize transaction type', () => {
    expect(ExcelParser.normalizeTransactionType('买入')).toBe('buy');
    expect(ExcelParser.normalizeTransactionType('BUY')).toBe('buy');
  });
});
```

### 7.2 集成测试

```typescript
describe('Transaction Import API', () => {
  it('should import Excel file successfully when all assets exist', async () => {
    // 先创建测试资产
    await createTestAssets(['00700.HK', 'AAPL']);

    const formData = new FormData();
    formData.append('file', fs.createReadStream('test/fixtures/transactions.xlsx'));
    formData.append('format', 'excel');

    const response = await request(app)
      .post('/api/transactions/import')
      .send(formData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.imported).toBe(10);
  });

  it('should reject import when asset does not exist', async () => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test/fixtures/transactions_missing_asset.xlsx'));
    formData.append('format', 'excel');

    const response = await request(app)
      .post('/api/transactions/import')
      .send(formData)
      .expect(200);

    expect(response.body.success).toBe(false);
    expect(response.body.imported).toBe(0);
    expect(response.body.failed).toBe(10);
    expect(response.body.errors[0].message).toContain('资产不存在');
  });

  it('should rollback all transactions on partial failure', async () => {
    // 创建部分资产（模拟部分资产不存在的情况）
    await createTestAssets(['00700.HK']);

    const formData = new FormData();
    formData.append('file', fs.createReadStream('test/fixtures/transactions_mixed.xlsx'));
    formData.append('format', 'excel');

    const initialCount = await prisma.transaction.count();

    const response = await request(app)
      .post('/api/transactions/import')
      .send(formData)
      .expect(200);

    const finalCount = await prisma.transaction.count();

    // 验证原子性：没有任何记录被插入
    expect(response.body.success).toBe(false);
    expect(finalCount).toBe(initialCount);
    expect(response.body.imported).toBe(0);
  });
});
```

## 八、部署清单

### 8.1 后端依赖安装

```bash
cd backend
npm install xlsx multer joi papaparse json2csv p-limit
npm install -D @types/multer @types/papaparse
```

### 8.2 前端依赖安装

```bash
cd frontend
npm install xlsx
```

### 8.3 数据库迁移（如需）

```sql
-- 添加导入批次追踪表
CREATE TABLE import_batches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  format VARCHAR(10),
  filename VARCHAR(255),
  total_records INTEGER,
  imported_records INTEGER,
  failed_records INTEGER,
  status VARCHAR(20),
  error_log JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 九、实施时间表

| 阶段 | 任务 | 工作量 | 优先级 |
|-----|------|--------|--------|
| Phase 1 | Excel导入基础功能 | 3天 | P0 |
| Phase 2 | JSON导入 + AI示例 | 2天 | P0 |
| Phase 3 | 三格式导出 | 2天 | P1 |
| Phase 4 | 错误处理优化 | 1天 | P1 |
| Phase 5 | 性能优化 + 测试 | 2天 | P2 |

**总计**: 10个工作日

## 十、关键设计决策说明

### 10.1 为什么不自动创建资产？

**原因**:
1. **数据准确性**: 资产信息（类型、市场、币种）需要准确设置，自动创建可能导致错误
2. **避免垃圾数据**: 防止因Symbol拼写错误而创建大量无效资产
3. **用户意识**: 强制用户先了解和管理资产，再记录交易
4. **数据完整性**: 确保每个资产都有完整的元数据

**用户体验优化**:
- 提供清晰的错误提示，列出所有缺失的资产
- 支持从导入文件中提取资产列表，一键跳转到资产创建页面
- 提供资产批量创建功能（未来扩展）

### 10.2 为什么采用原子性操作？

**原因**:
1. **数据一致性**: 避免部分成功导致的数据不完整
2. **易于回滚**: 失败后无需手动清理已导入的数据
3. **用户信任**: 明确的"全部成功"或"全部失败"，不会产生歧义
4. **审计友好**: 每次导入是一个完整的操作单元

**实现方式**:
- 使用数据库事务（Transaction）
- 预验证所有数据后再执行插入
- 任何错误立即回滚整个事务

### 10.3 错误处理策略

```typescript
/**
 * 三阶段验证策略
 */
class ImportValidationStrategy {
  /**
   * 阶段1: 文件格式验证
   * - 在解析阶段进行
   * - 快速失败，节省资源
   */
  validateFileFormat(buffer: Buffer, format: string): void {
    // Excel/JSON格式验证
  }

  /**
   * 阶段2: 资产存在性验证
   * - 在数据库查询阶段进行
   * - 一次性检查所有资产
   * - 失败则立即返回，不进行后续验证
   */
  async validateAssetsExist(transactions: ImportTransaction[]): Promise<void> {
    // 批量查询资产
    // 生成缺失资产列表
  }

  /**
   * 阶段3: 业务规则验证
   * - 在确认资产存在后进行
   * - 验证数值、日期、账户等
   * - 收集所有错误后一次性返回
   */
  validateBusinessRules(transactions: ImportTransaction[]): ValidationError[] {
    // 数值验证
    // 日期验证
    // 账户验证
  }
}
```

## 十一、后续扩展

### 11.1 短期优化（1-2周）

1. **资产快速创建**: 从导入错误中提取缺失资产，提供快速创建入口
2. **导入预览增强**: 显示哪些资产存在、哪些不存在
3. **批量资产创建**: 支持从导入文件中批量创建资产

### 11.2 中期扩展（1-2月）

4. **智能字段映射**: 自动识别列名变化
5. **导入历史**: 记录每次导入，支持查看和审计
6. **模板管理**: 用户自定义导入模板

### 11.3 长期规划（3-6月）

7. **批量编辑**: 导入前批量修改数据
8. **API导入**: 直接从券商API导入
9. **定时导入**: 自动定期导入邮件附件
10. **AI辅助**: 从对账单图片/PDF提取交易数据

---

**文档版本**: 1.0  
**创建时间**: 2024-01-15  
**最后更新**: 2024-01-15
