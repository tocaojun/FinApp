# 交易管理批量导入导出功能设计方案

## 📋 目录

1. [功能概述](#功能概述)
2. [技术架构](#技术架构)
3. [数据格式设计](#数据格式设计)
4. [导入功能设计](#导入功能设计)
5. [导出功能设计](#导出功能设计)
6. [实现建议](#实现建议)
7. [安全性考虑](#安全性考虑)
8. [性能优化](#性能优化)
9. [用户体验](#用户体验)
10. [测试方案](#测试方案)

---

## 功能概述

### 核心目标
- 支持批量导入交易记录（CSV、Excel、JSON）
- 支持批量导出交易记录（CSV、Excel、PDF）
- 数据验证和错误处理
- 导入预览和确认机制
- 支持模板下载
- 支持增量导入和全量导入

### 业务场景
1. **券商对账单导入** - 从券商系统导出的交易记录
2. **历史数据迁移** - 从其他系统迁移历史交易数据
3. **批量录入** - Excel 批量编辑后导入
4. **数据备份** - 定期导出交易数据备份
5. **报表生成** - 导出特定格式的交易报表

---

## 技术架构

### 前端架构

```
TransactionImportExport (主组件)
├── ImportWizard (导入向导)
│   ├── Step1: 文件上传
│   ├── Step2: 字段映射
│   ├── Step3: 数据预览
│   └── Step4: 导入确认
├── ExportDialog (导出对话框)
│   ├── 格式选择
│   ├── 筛选条件
│   └── 字段选择
└── TemplateManager (模板管理)
    ├── 标准模板
    └── 自定义模板
```

### 后端架构

```
TransactionImportExportService
├── ImportService
│   ├── FileParser (文件解析)
│   ├── DataValidator (数据验证)
│   ├── DataTransformer (数据转换)
│   └── BatchImporter (批量导入)
└── ExportService
    ├── DataFetcher (数据获取)
    ├── DataFormatter (数据格式化)
    └── FileGenerator (文件生成)
```

---

## 数据格式设计

### 标准导入格式 (CSV/Excel)

#### 必填字段
```csv
交易日期,资产代码,资产名称,交易类型,方向,数量,价格,手续费,备注
2024-01-15,AAPL,苹果公司,BUY,LONG,100,150.50,5.00,定投
2024-01-16,00700,腾讯控股,SELL,LONG,200,350.00,10.00,止盈
```

#### 完整字段（包含可选）
```csv
交易日期,资产代码,资产名称,交易类型,方向,数量,价格,手续费,税费,货币,汇率,结算日期,外部ID,流动性标签,标签,备注
2024-01-15,AAPL,苹果公司,BUY,LONG,100,150.50,5.00,0,USD,7.2,2024-01-17,EXT001,高流动性,"定投,美股",定期投资
```

### 字段映射表

| 数据库字段 | 中文名称 | 英文名称 | 类型 | 必填 | 说明 |
|-----------|---------|---------|------|------|------|
| transaction_date | 交易日期 | Transaction Date | Date | ✅ | YYYY-MM-DD |
| asset_symbol | 资产代码 | Symbol | String | ✅ | 股票代码 |
| asset_name | 资产名称 | Asset Name | String | ❌ | 用于验证 |
| transaction_type | 交易类型 | Type | Enum | ✅ | BUY/SELL/DIVIDEND等 |
| side | 方向 | Side | Enum | ✅ | LONG/SHORT |
| quantity | 数量 | Quantity | Decimal | ✅ | 正数 |
| price | 价格 | Price | Decimal | ✅ | 单价 |
| fees | 手续费 | Fees | Decimal | ❌ | 默认0 |
| taxes | 税费 | Taxes | Decimal | ❌ | 默认0 |
| currency | 货币 | Currency | String | ❌ | 默认CNY |
| exchange_rate | 汇率 | Exchange Rate | Decimal | ❌ | 默认1 |
| settlement_date | 结算日期 | Settlement Date | Date | ❌ | T+N |
| external_id | 外部ID | External ID | String | ❌ | 券商订单号 |
| liquidity_tag | 流动性标签 | Liquidity Tag | String | ❌ | 高/中/低 |
| tags | 标签 | Tags | Array | ❌ | 逗号分隔 |
| notes | 备注 | Notes | String | ❌ | 说明 |

### 交易类型枚举

```typescript
enum TransactionType {
  BUY = 'BUY',           // 买入
  SELL = 'SELL',         // 卖出
  DEPOSIT = 'DEPOSIT',   // 存入
  WITHDRAWAL = 'WITHDRAWAL', // 取出
  DIVIDEND = 'DIVIDEND', // 分红
  INTEREST = 'INTEREST', // 利息
  SPLIT = 'SPLIT',       // 拆股
  MERGE = 'MERGE',       // 合股
  TRANSFER_IN = 'TRANSFER_IN',   // 转入
  TRANSFER_OUT = 'TRANSFER_OUT'  // 转出
}

enum TransactionSide {
  LONG = 'LONG',   // 做多
  SHORT = 'SHORT'  // 做空
}
```

---

## 导入功能设计

### 1. 文件上传

#### 支持的文件格式
- **CSV** (.csv) - 最常用，兼容性好
- **Excel** (.xlsx, .xls) - 支持多sheet
- **JSON** (.json) - 程序化导入

#### 文件大小限制
- 单文件最大: 10MB
- 最大记录数: 10,000 条
- 超过限制建议分批导入

#### 上传组件实现
```typescript
const uploadProps: UploadProps = {
  name: 'file',
  accept: '.csv,.xlsx,.xls,.json',
  maxCount: 1,
  beforeUpload: (file) => {
    const isValidType = ['text/csv', 'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json'].includes(file.type);
    
    if (!isValidType) {
      message.error('只支持 CSV、Excel 和 JSON 格式！');
      return false;
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('文件大小不能超过 10MB！');
      return false;
    }
    
    return true;
  },
  customRequest: async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await parseImportFile(formData);
      onSuccess(response);
    } catch (error) {
      onError(error);
    }
  }
};
```

### 2. 字段映射

#### 智能映射
```typescript
interface FieldMapping {
  sourceField: string;    // 源文件字段名
  targetField: string;    // 目标数据库字段
  transform?: (value: any) => any;  // 转换函数
  required: boolean;      // 是否必填
  defaultValue?: any;     // 默认值
}

// 自动识别常见字段名
const autoMapFields = (headers: string[]): FieldMapping[] => {
  const mappings: Record<string, string[]> = {
    'transaction_date': ['交易日期', '日期', 'Date', 'Transaction Date', '成交日期'],
    'asset_symbol': ['代码', '股票代码', 'Symbol', 'Code', '证券代码'],
    'quantity': ['数量', 'Quantity', 'Shares', '股数'],
    'price': ['价格', 'Price', '成交价', '单价'],
    'transaction_type': ['类型', 'Type', '交易类型', 'Transaction Type'],
    // ... 更多映射
  };
  
  return headers.map(header => {
    for (const [target, sources] of Object.entries(mappings)) {
      if (sources.some(s => header.includes(s))) {
        return {
          sourceField: header,
          targetField: target,
          required: requiredFields.includes(target)
        };
      }
    }
    return { sourceField: header, targetField: '', required: false };
  });
};
```

#### 手动调整映射
```tsx
<Form.Item label="字段映射">
  {mappings.map((mapping, index) => (
    <Row key={index} gutter={16}>
      <Col span={10}>
        <Input value={mapping.sourceField} disabled />
      </Col>
      <Col span={2} style={{ textAlign: 'center' }}>→</Col>
      <Col span={10}>
        <Select
          value={mapping.targetField}
          onChange={(value) => updateMapping(index, value)}
          placeholder="选择目标字段"
        >
          {targetFields.map(field => (
            <Option key={field.key} value={field.key}>
              {field.label} {field.required && <Tag color="red">必填</Tag>}
            </Option>
          ))}
        </Select>
      </Col>
      <Col span={2}>
        {mapping.required && !mapping.targetField && (
          <ExclamationCircleOutlined style={{ color: 'red' }} />
        )}
      </Col>
    </Row>
  ))}
</Form.Item>
```

### 3. 数据验证

#### 验证规则
```typescript
interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'reference' | 'custom';
  validator: (value: any, record: any) => ValidationResult;
  message: string;
}

const validationRules: ValidationRule[] = [
  // 必填验证
  {
    field: 'transaction_date',
    type: 'required',
    validator: (value) => ({ valid: !!value, message: '交易日期不能为空' }),
    message: '交易日期是必填项'
  },
  
  // 格式验证
  {
    field: 'transaction_date',
    type: 'format',
    validator: (value) => {
      const date = new Date(value);
      return {
        valid: !isNaN(date.getTime()),
        message: '日期格式不正确，应为 YYYY-MM-DD'
      };
    },
    message: '日期格式验证'
  },
  
  // 范围验证
  {
    field: 'quantity',
    type: 'range',
    validator: (value) => ({
      valid: value > 0,
      message: '数量必须大于0'
    }),
    message: '数量范围验证'
  },
  
  // 引用验证（资产是否存在）
  {
    field: 'asset_symbol',
    type: 'reference',
    validator: async (value) => {
      const asset = await checkAssetExists(value);
      return {
        valid: !!asset,
        message: asset ? '' : `资产 ${value} 不存在`
      };
    },
    message: '资产引用验证'
  },
  
  // 自定义验证
  {
    field: 'total_amount',
    type: 'custom',
    validator: (value, record) => {
      const calculated = record.quantity * record.price + (record.fees || 0);
      const diff = Math.abs(value - calculated);
      return {
        valid: diff < 0.01,
        message: `总金额不匹配：期望 ${calculated}，实际 ${value}`
      };
    },
    message: '总金额验证'
  }
];
```

#### 批量验证
```typescript
interface ValidationResult {
  rowIndex: number;
  field: string;
  level: 'error' | 'warning' | 'info';
  message: string;
}

const validateImportData = async (
  records: any[]
): Promise<{
  valid: ValidationResult[];
  errors: ValidationResult[];
  warnings: ValidationResult[];
}> => {
  const results: ValidationResult[] = [];
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    for (const rule of validationRules) {
      const result = await rule.validator(record[rule.field], record);
      
      if (!result.valid) {
        results.push({
          rowIndex: i + 1,
          field: rule.field,
          level: rule.type === 'required' ? 'error' : 'warning',
          message: result.message
        });
      }
    }
  }
  
  return {
    valid: results.filter(r => r.level === 'info'),
    errors: results.filter(r => r.level === 'error'),
    warnings: results.filter(r => r.level === 'warning')
  };
};
```

### 4. 数据预览

#### 预览表格
```tsx
const PreviewTable: React.FC<{ data: ImportRecord[] }> = ({ data }) => {
  const columns: ColumnsType<ImportRecord> = [
    {
      title: '行号',
      dataIndex: 'rowIndex',
      width: 60,
      fixed: 'left'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status, record) => {
        if (record.errors.length > 0) {
          return <Tag color="error">错误</Tag>;
        }
        if (record.warnings.length > 0) {
          return <Tag color="warning">警告</Tag>;
        }
        return <Tag color="success">正常</Tag>;
      }
    },
    {
      title: '交易日期',
      dataIndex: ['data', 'transaction_date'],
      width: 120
    },
    {
      title: '资产',
      dataIndex: ['data', 'asset_symbol'],
      width: 100,
      render: (symbol, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{symbol}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.data.asset_name}
          </Text>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: ['data', 'transaction_type'],
      width: 80,
      render: (type) => {
        const colors = {
          BUY: 'green',
          SELL: 'red',
          DIVIDEND: 'blue'
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      }
    },
    {
      title: '数量',
      dataIndex: ['data', 'quantity'],
      width: 100,
      align: 'right'
    },
    {
      title: '价格',
      dataIndex: ['data', 'price'],
      width: 100,
      align: 'right'
    },
    {
      title: '金额',
      dataIndex: ['data', 'total_amount'],
      width: 120,
      align: 'right',
      render: (amount) => `¥${amount.toFixed(2)}`
    },
    {
      title: '问题',
      dataIndex: 'errors',
      width: 200,
      render: (errors, record) => {
        const allIssues = [...errors, ...record.warnings];
        if (allIssues.length === 0) return '-';
        
        return (
          <Space direction="vertical" size={0}>
            {allIssues.map((issue, i) => (
              <Text key={i} type={errors.includes(issue) ? 'danger' : 'warning'}>
                {issue}
              </Text>
            ))}
          </Space>
        );
      }
    }
  ];
  
  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="rowIndex"
      scroll={{ x: 1200, y: 400 }}
      pagination={{ pageSize: 50 }}
      summary={(pageData) => {
        const totalRecords = pageData.length;
        const validRecords = pageData.filter(r => r.errors.length === 0).length;
        const errorRecords = pageData.filter(r => r.errors.length > 0).length;
        
        return (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <Text strong>统计</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={2}>
                总计: {totalRecords} 条
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} colSpan={2}>
                <Text type="success">有效: {validRecords} 条</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} colSpan={2}>
                <Text type="danger">错误: {errorRecords} 条</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        );
      }}
    />
  );
};
```

### 5. 批量导入

#### 导入策略
```typescript
enum ImportStrategy {
  INSERT_ONLY = 'INSERT_ONLY',       // 仅插入新记录
  UPDATE_ONLY = 'UPDATE_ONLY',       // 仅更新已有记录
  UPSERT = 'UPSERT',                 // 插入或更新
  SKIP_DUPLICATES = 'SKIP_DUPLICATES' // 跳过重复记录
}

interface ImportOptions {
  strategy: ImportStrategy;
  batchSize: number;              // 批次大小
  continueOnError: boolean;       // 遇到错误是否继续
  duplicateKey: string[];         // 重复判断字段
  validateOnly: boolean;          // 仅验证不导入
}
```

#### 批量导入实现
```typescript
const batchImport = async (
  records: ImportRecord[],
  options: ImportOptions
): Promise<ImportResult> => {
  const result: ImportResult = {
    total: records.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  // 过滤掉有错误的记录
  const validRecords = records.filter(r => r.errors.length === 0);
  
  // 分批处理
  const batches = chunk(validRecords, options.batchSize);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      // 使用事务处理每个批次
      const batchResult = await importBatch(batch, options);
      
      result.success += batchResult.success;
      result.failed += batchResult.failed;
      result.skipped += batchResult.skipped;
      result.errors.push(...batchResult.errors);
      
      // 更新进度
      onProgress?.({
        current: (i + 1) * options.batchSize,
        total: validRecords.length,
        percentage: ((i + 1) / batches.length) * 100
      });
      
    } catch (error) {
      if (!options.continueOnError) {
        throw error;
      }
      
      result.failed += batch.length;
      result.errors.push({
        batch: i + 1,
        message: error.message
      });
    }
  }
  
  return result;
};
```

---

## 导出功能设计

### 1. 导出格式

#### CSV 导出
```typescript
const exportToCSV = (transactions: Transaction[]): string => {
  const headers = [
    '交易日期', '资产代码', '资产名称', '交易类型', '方向',
    '数量', '价格', '手续费', '税费', '总金额', '货币', '备注'
  ];
  
  const rows = transactions.map(t => [
    formatDate(t.transaction_date),
    t.asset_symbol,
    t.asset_name,
    t.transaction_type,
    t.side,
    t.quantity,
    t.price,
    t.fees || 0,
    t.taxes || 0,
    t.total_amount,
    t.currency,
    t.notes || ''
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
};
```

#### Excel 导出
```typescript
import * as XLSX from 'xlsx';

const exportToExcel = (transactions: Transaction[]): void => {
  // 创建工作簿
  const wb = XLSX.utils.book_new();
  
  // 交易明细sheet
  const wsData = transactions.map(t => ({
    '交易日期': formatDate(t.transaction_date),
    '资产代码': t.asset_symbol,
    '资产名称': t.asset_name,
    '交易类型': t.transaction_type,
    '方向': t.side,
    '数量': t.quantity,
    '价格': t.price,
    '手续费': t.fees || 0,
    '税费': t.taxes || 0,
    '总金额': t.total_amount,
    '货币': t.currency,
    '备注': t.notes || ''
  }));
  
  const ws = XLSX.utils.json_to_sheet(wsData);
  
  // 设置列宽
  ws['!cols'] = [
    { wch: 12 }, // 交易日期
    { wch: 10 }, // 资产代码
    { wch: 20 }, // 资产名称
    { wch: 10 }, // 交易类型
    { wch: 8 },  // 方向
    { wch: 12 }, // 数量
    { wch: 12 }, // 价格
    { wch: 10 }, // 手续费
    { wch: 10 }, // 税费
    { wch: 15 }, // 总金额
    { wch: 8 },  // 货币
    { wch: 30 }  // 备注
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, '交易明细');
  
  // 汇总sheet
  const summary = generateSummary(transactions);
  const wsSummary = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, '汇总统计');
  
  // 下载文件
  XLSX.writeFile(wb, `交易记录_${formatDate(new Date())}.xlsx`);
};
```

#### PDF 导出
```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const exportToPDF = (transactions: Transaction[]): void => {
  const doc = new jsPDF();
  
  // 添加中文字体支持
  doc.addFont('path/to/chinese-font.ttf', 'chinese', 'normal');
  doc.setFont('chinese');
  
  // 标题
  doc.setFontSize(16);
  doc.text('交易记录报表', 14, 20);
  
  // 日期范围
  doc.setFontSize(10);
  doc.text(`导出时间: ${formatDate(new Date())}`, 14, 30);
  
  // 表格数据
  const tableData = transactions.map(t => [
    formatDate(t.transaction_date),
    t.asset_symbol,
    t.asset_name,
    t.transaction_type,
    t.quantity,
    t.price,
    t.total_amount
  ]);
  
  doc.autoTable({
    head: [['日期', '代码', '名称', '类型', '数量', '价格', '金额']],
    body: tableData,
    startY: 40,
    styles: { font: 'chinese', fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] }
  });
  
  // 保存
  doc.save(`交易记录_${formatDate(new Date())}.pdf`);
};
```

### 2. 导出选项

#### 筛选条件
```tsx
<Form layout="vertical">
  <Form.Item label="日期范围">
    <DatePicker.RangePicker
      value={dateRange}
      onChange={setDateRange}
      format="YYYY-MM-DD"
    />
  </Form.Item>
  
  <Form.Item label="投资组合">
    <Select
      mode="multiple"
      placeholder="选择投资组合"
      value={selectedPortfolios}
      onChange={setSelectedPortfolios}
    >
      {portfolios.map(p => (
        <Option key={p.id} value={p.id}>{p.name}</Option>
      ))}
    </Select>
  </Form.Item>
  
  <Form.Item label="交易类型">
    <Checkbox.Group
      options={transactionTypes}
      value={selectedTypes}
      onChange={setSelectedTypes}
    />
  </Form.Item>
  
  <Form.Item label="资产类型">
    <Select
      mode="multiple"
      placeholder="选择资产类型"
      value={selectedAssetTypes}
      onChange={setSelectedAssetTypes}
    >
      {assetTypes.map(t => (
        <Option key={t.id} value={t.id}>{t.name}</Option>
      ))}
    </Select>
  </Form.Item>
</Form>
```

#### 字段选择
```tsx
<Form.Item label="导出字段">
  <Checkbox.Group
    value={selectedFields}
    onChange={setSelectedFields}
  >
    <Row>
      {availableFields.map(field => (
        <Col span={8} key={field.key}>
          <Checkbox value={field.key}>
            {field.label}
            {field.required && <Tag color="red" size="small">必需</Tag>}
          </Checkbox>
        </Col>
      ))}
    </Row>
  </Checkbox.Group>
</Form.Item>
```

---

## 实现建议

### 后端实现

#### 1. 文件解析服务
```typescript
// backend/src/services/FileParserService.ts
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';

export class FileParserService {
  async parseCSV(file: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file.toString(), {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  }
  
  async parseExcel(file: Buffer): Promise<any[]> {
    const workbook = XLSX.read(file, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }
  
  async parseJSON(file: Buffer): Promise<any[]> {
    return JSON.parse(file.toString());
  }
  
  async parse(file: Express.Multer.File): Promise<any[]> {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'csv':
        return this.parseCSV(file.buffer);
      case 'xlsx':
      case 'xls':
        return this.parseExcel(file.buffer);
      case 'json':
        return this.parseJSON(file.buffer);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }
}
```

#### 2. 批量导入服务
```typescript
// backend/src/services/TransactionImportService.ts
export class TransactionImportService {
  async importBatch(
    userId: string,
    records: ImportRecord[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: records.length,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    // 使用事务
    await databaseService.prisma.$transaction(async (tx) => {
      for (const record of records) {
        try {
          // 检查重复
          if (options.strategy === 'SKIP_DUPLICATES') {
            const exists = await this.checkDuplicate(
              tx,
              record,
              options.duplicateKey
            );
            if (exists) {
              result.skipped++;
              continue;
            }
          }
          
          // 转换数据
          const transaction = await this.transformRecord(record);
          
          // 验证资产
          const asset = await this.validateAsset(tx, transaction.assetId);
          if (!asset) {
            throw new Error(`Asset not found: ${transaction.assetId}`);
          }
          
          // 插入或更新
          if (options.strategy === 'UPSERT') {
            await tx.transaction.upsert({
              where: { external_id: transaction.external_id },
              create: transaction,
              update: transaction
            });
          } else {
            await tx.transaction.create({ data: transaction });
          }
          
          result.success++;
          
        } catch (error) {
          result.failed++;
          result.errors.push({
            rowIndex: record.rowIndex,
            message: error.message
          });
          
          if (!options.continueOnError) {
            throw error;
          }
        }
      }
    });
    
    return result;
  }
  
  private async checkDuplicate(
    tx: any,
    record: ImportRecord,
    keys: string[]
  ): Promise<boolean> {
    const where = keys.reduce((acc, key) => {
      acc[key] = record.data[key];
      return acc;
    }, {});
    
    const existing = await tx.transaction.findFirst({ where });
    return !!existing;
  }
  
  private async transformRecord(record: ImportRecord): Promise<any> {
    // 数据转换逻辑
    return {
      ...record.data,
      transaction_date: new Date(record.data.transaction_date),
      quantity: parseFloat(record.data.quantity),
      price: parseFloat(record.data.price),
      fees: parseFloat(record.data.fees || 0),
      taxes: parseFloat(record.data.taxes || 0),
      total_amount: parseFloat(record.data.total_amount)
    };
  }
}
```

#### 3. 导出服务
```typescript
// backend/src/services/TransactionExportService.ts
export class TransactionExportService {
  async export(
    userId: string,
    options: ExportOptions
  ): Promise<Buffer> {
    // 获取数据
    const transactions = await this.fetchTransactions(userId, options);
    
    // 根据格式生成文件
    switch (options.format) {
      case 'csv':
        return this.generateCSV(transactions, options);
      case 'excel':
        return this.generateExcel(transactions, options);
      case 'pdf':
        return this.generatePDF(transactions, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }
  
  private async fetchTransactions(
    userId: string,
    options: ExportOptions
  ): Promise<Transaction[]> {
    const where: any = {
      portfolio: { user_id: userId }
    };
    
    // 日期范围
    if (options.dateRange) {
      where.transaction_date = {
        gte: new Date(options.dateRange[0]),
        lte: new Date(options.dateRange[1])
      };
    }
    
    // 投资组合
    if (options.portfolioIds?.length) {
      where.portfolio_id = { in: options.portfolioIds };
    }
    
    // 交易类型
    if (options.transactionTypes?.length) {
      where.transaction_type = { in: options.transactionTypes };
    }
    
    return databaseService.prisma.transaction.findMany({
      where,
      include: {
        asset: true,
        portfolio: true,
        tradingAccount: true
      },
      orderBy: {
        [options.sortBy || 'transaction_date']: options.sortOrder || 'DESC'
      }
    });
  }
  
  private generateCSV(
    transactions: Transaction[],
    options: ExportOptions
  ): Buffer {
    const fields = options.includeFields;
    const rows = transactions.map(t => 
      fields.map(field => this.formatField(t, field))
    );
    
    const csv = [
      fields.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return Buffer.from(csv, 'utf-8');
  }
}
```

#### 4. API 路由
```typescript
// backend/src/routes/transactions.ts
router.post('/import/parse', 
  authenticate,
  upload.single('file'),
  async (req, res) => {
    try {
      const fileParser = new FileParserService();
      const records = await fileParser.parse(req.file);
      
      // 返回解析结果
      res.json({
        success: true,
        data: {
          records,
          total: records.length
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.post('/import/validate',
  authenticate,
  async (req, res) => {
    try {
      const { records } = req.body;
      const validator = new TransactionValidatorService();
      const result = await validator.validate(records);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.post('/import/execute',
  authenticate,
  async (req, res) => {
    try {
      const { records, options } = req.body;
      const importService = new TransactionImportService();
      const result = await importService.importBatch(
        req.user.id,
        records,
        options
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.post('/export',
  authenticate,
  async (req, res) => {
    try {
      const options: ExportOptions = req.body;
      const exportService = new TransactionExportService();
      const file = await exportService.export(req.user.id, options);
      
      const filename = `transactions_${Date.now()}.${options.format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', getContentType(options.format));
      res.send(file);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);
```

### 前端实现

#### 1. 导入向导组件
```tsx
// frontend/src/components/transaction/ImportWizard.tsx
const ImportWizard: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  
  const steps = [
    {
      title: '上传文件',
      content: <FileUploadStep onFileSelect={handleFileSelect} />
    },
    {
      title: '字段映射',
      content: (
        <FieldMappingStep
          records={records}
          mappings={mappings}
          onMappingChange={setMappings}
        />
      )
    },
    {
      title: '数据预览',
      content: (
        <DataPreviewStep
          records={records}
          mappings={mappings}
          validationResult={validationResult}
        />
      )
    },
    {
      title: '导入确认',
      content: (
        <ImportConfirmStep
          validationResult={validationResult}
          onImport={handleImport}
        />
      )
    }
  ];
  
  const handleFileSelect = async (file: File) => {
    setFile(file);
    
    // 解析文件
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await parseImportFile(formData);
    setRecords(response.data.records);
    
    // 自动映射字段
    const autoMappings = autoMapFields(Object.keys(response.data.records[0]));
    setMappings(autoMappings);
    
    setCurrent(1);
  };
  
  const handleNext = async () => {
    if (current === 1) {
      // 验证数据
      const result = await validateImportData({
        records,
        mappings
      });
      setValidationResult(result);
    }
    
    setCurrent(current + 1);
  };
  
  const handleImport = async (options: ImportOptions) => {
    setImporting(true);
    
    try {
      const result = await importTransactions({
        records: validationResult.valid,
        options
      });
      
      message.success(`成功导入 ${result.success} 条记录`);
      
      if (result.failed > 0) {
        Modal.warning({
          title: '部分记录导入失败',
          content: (
            <div>
              <p>成功: {result.success} 条</p>
              <p>失败: {result.failed} 条</p>
              <p>跳过: {result.skipped} 条</p>
            </div>
          )
        });
      }
      
      onSuccess?.(result);
    } catch (error) {
      message.error(`导入失败: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <Modal
      title="批量导入交易"
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={null}
    >
      <Steps current={current} items={steps} />
      
      <div style={{ marginTop: 24 }}>
        {steps[current].content}
      </div>
      
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Space>
          {current > 0 && (
            <Button onClick={() => setCurrent(current - 1)}>
              上一步
            </Button>
          )}
          
          {current < steps.length - 1 && (
            <Button type="primary" onClick={handleNext}>
              下一步
            </Button>
          )}
          
          {current === steps.length - 1 && (
            <Button
              type="primary"
              loading={importing}
              onClick={() => handleImport(importOptions)}
            >
              开始导入
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};
```

#### 2. 导出对话框
```tsx
// frontend/src/components/transaction/ExportDialog.tsx
const ExportDialog: React.FC = () => {
  const [form] = Form.useForm();
  const [exporting, setExporting] = useState(false);
  
  const handleExport = async () => {
    const values = await form.validateFields();
    setExporting(true);
    
    try {
      await exportTransactions({
        format: values.format,
        dateRange: values.dateRange,
        portfolioIds: values.portfolios,
        transactionTypes: values.types,
        includeFields: values.fields,
        sortBy: values.sortBy,
        sortOrder: values.sortOrder
      });
      
      message.success('导出成功');
      onCancel();
    } catch (error) {
      message.error(`导出失败: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <Modal
      title="导出交易记录"
      open={visible}
      onCancel={onCancel}
      onOk={handleExport}
      confirmLoading={exporting}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="format"
          label="导出格式"
          rules={[{ required: true }]}
          initialValue="excel"
        >
          <Radio.Group>
            <Radio.Button value="csv">
              <FileTextOutlined /> CSV
            </Radio.Button>
            <Radio.Button value="excel">
              <FileExcelOutlined /> Excel
            </Radio.Button>
            <Radio.Button value="pdf">
              <FilePdfOutlined /> PDF
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
        
        <Form.Item name="dateRange" label="日期范围">
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item name="portfolios" label="投资组合">
          <Select mode="multiple" placeholder="全部">
            {portfolios.map(p => (
              <Option key={p.id} value={p.id}>{p.name}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item name="types" label="交易类型">
          <Checkbox.Group options={transactionTypeOptions} />
        </Form.Item>
        
        <Form.Item
          name="fields"
          label="导出字段"
          initialValue={defaultFields}
        >
          <Checkbox.Group>
            <Row>
              {availableFields.map(field => (
                <Col span={12} key={field.key}>
                  <Checkbox value={field.key}>{field.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

---

## 安全性考虑

### 1. 文件上传安全
- 文件类型白名单验证
- 文件大小限制
- 病毒扫描（可选）
- 临时文件清理

### 2. 数据验证
- 严格的数据类型验证
- SQL 注入防护
- XSS 防护
- 业务规则验证

### 3. 权限控制
- 用户只能导入/导出自己的数据
- 投资组合权限验证
- 操作日志记录

### 4. 错误处理
- 详细的错误信息
- 错误日志记录
- 回滚机制

---

## 性能优化

### 1. 批量处理
- 分批导入（每批 100-500 条）
- 使用事务保证一致性
- 异步处理大文件

### 2. 数据库优化
- 批量插入优化
- 索引优化
- 连接池管理

### 3. 前端优化
- 虚拟滚动（大数据量预览）
- 分页加载
- Web Worker 处理文件解析

### 4. 缓存策略
- 资产信息缓存
- 投资组合缓存
- 验证规则缓存

---

## 用户体验

### 1. 进度提示
```tsx
<Progress
  percent={progress.percentage}
  status={progress.status}
  format={() => `${progress.current} / ${progress.total}`}
/>
```

### 2. 错误提示
```tsx
<Alert
  message="导入警告"
  description={
    <ul>
      {errors.map((error, i) => (
        <li key={i}>
          第 {error.rowIndex} 行: {error.message}
        </li>
      ))}
    </ul>
  }
  type="warning"
  showIcon
/>
```

### 3. 模板下载
```tsx
<Button
  icon={<DownloadOutlined />}
  onClick={downloadTemplate}
>
  下载导入模板
</Button>
```

---

## 测试方案

### 1. 单元测试
- 文件解析测试
- 数据验证测试
- 转换逻辑测试

### 2. 集成测试
- 完整导入流程测试
- 完整导出流程测试
- 错误处理测试

### 3. 性能测试
- 大文件导入测试（10,000+ 条）
- 并发导入测试
- 内存使用测试

### 4. 用户测试
- 易用性测试
- 错误提示清晰度测试
- 边界情况测试

---

## 总结

### 关键要点

1. **数据验证是核心** - 确保数据质量
2. **用户体验优先** - 清晰的步骤和提示
3. **性能优化** - 批量处理和异步操作
4. **安全第一** - 严格的权限和验证
5. **容错机制** - 优雅的错误处理

### 实施建议

1. **分阶段实现**
   - Phase 1: 基础导入导出（CSV）
   - Phase 2: Excel 支持和高级验证
   - Phase 3: PDF 导出和模板管理
   - Phase 4: 自动化和批量操作

2. **优先级排序**
   - P0: CSV 导入导出
   - P1: 数据验证和错误处理
   - P2: Excel 支持
   - P3: PDF 导出和高级功能

3. **技术选型**
   - 文件解析: papaparse (CSV), xlsx (Excel)
   - 导出: xlsx, jspdf
   - 验证: joi 或 yup
   - 进度: react-query 或 swr

---

**文档版本**: v1.0  
**创建日期**: 2025-10-27  
**状态**: ✅ 设计完成
