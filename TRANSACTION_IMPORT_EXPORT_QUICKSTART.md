# 交易批量导入导出 - 快速实施指南

## 🚀 快速开始

### 最小可行产品 (MVP) - 2周实现

#### Week 1: 基础导入功能

**Day 1-2: 后端文件解析**
```bash
# 安装依赖
cd backend
npm install papaparse xlsx multer

# 创建服务
touch src/services/FileParserService.ts
touch src/services/TransactionImportService.ts
```

**Day 3-4: 数据验证**
```bash
# 创建验证服务
touch src/services/TransactionValidatorService.ts
touch src/types/import.ts
```

**Day 5: API 路由**
```bash
# 添加路由
# 在 src/routes/transactions.ts 中添加:
# - POST /api/transactions/import/parse
# - POST /api/transactions/import/validate
# - POST /api/transactions/import/execute
```

#### Week 2: 前端导入界面

**Day 1-2: 上传组件**
```bash
cd frontend
npm install antd @ant-design/icons

# 创建组件
mkdir -p src/components/transaction/import
touch src/components/transaction/import/FileUploadStep.tsx
```

**Day 3-4: 预览和验证**
```bash
touch src/components/transaction/import/DataPreviewStep.tsx
touch src/components/transaction/import/ImportWizard.tsx
```

**Day 5: 集成测试**
```bash
# 测试完整流程
# 准备测试数据
# 修复 bug
```

---

## 📝 核心代码示例

### 1. 后端文件解析服务

```typescript
// backend/src/services/FileParserService.ts
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

export class FileParserService {
  async parse(file: Express.Multer.File): Promise<any[]> {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'csv':
        return this.parseCSV(file.buffer);
      case 'xlsx':
      case 'xls':
        return this.parseExcel(file.buffer);
      default:
        throw new Error(`不支持的文件类型: ${ext}`);
    }
  }
  
  private async parseCSV(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(buffer.toString('utf-8'), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  }
  
  private async parseExcel(buffer: Buffer): Promise<any[]> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }
}
```

### 2. 数据验证服务

```typescript
// backend/src/services/TransactionValidatorService.ts
export class TransactionValidatorService {
  async validate(records: any[]): Promise<ValidationResult> {
    const results: ValidationResult = {
      valid: [],
      errors: [],
      warnings: []
    };
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowErrors: string[] = [];
      const rowWarnings: string[] = [];
      
      // 必填字段验证
      if (!record.transaction_date) {
        rowErrors.push('交易日期不能为空');
      }
      if (!record.asset_symbol) {
        rowErrors.push('资产代码不能为空');
      }
      if (!record.quantity || record.quantity <= 0) {
        rowErrors.push('数量必须大于0');
      }
      if (!record.price || record.price <= 0) {
        rowErrors.push('价格必须大于0');
      }
      
      // 日期格式验证
      if (record.transaction_date) {
        const date = new Date(record.transaction_date);
        if (isNaN(date.getTime())) {
          rowErrors.push('日期格式不正确');
        }
      }
      
      // 资产存在性验证
      if (record.asset_symbol) {
        const asset = await this.checkAssetExists(record.asset_symbol);
        if (!asset) {
          rowErrors.push(`资产 ${record.asset_symbol} 不存在`);
        }
      }
      
      // 金额验证
      const calculatedAmount = record.quantity * record.price + (record.fees || 0);
      if (record.total_amount && Math.abs(record.total_amount - calculatedAmount) > 0.01) {
        rowWarnings.push(`总金额可能不正确: 期望 ${calculatedAmount}, 实际 ${record.total_amount}`);
      }
      
      if (rowErrors.length > 0) {
        results.errors.push({
          rowIndex: i + 1,
          errors: rowErrors
        });
      } else if (rowWarnings.length > 0) {
        results.warnings.push({
          rowIndex: i + 1,
          warnings: rowWarnings
        });
      } else {
        results.valid.push({
          rowIndex: i + 1,
          data: record
        });
      }
    }
    
    return results;
  }
  
  private async checkAssetExists(symbol: string): Promise<boolean> {
    const asset = await databaseService.prisma.asset.findFirst({
      where: { symbol }
    });
    return !!asset;
  }
}
```

### 3. 批量导入服务

```typescript
// backend/src/services/TransactionImportService.ts
export class TransactionImportService {
  async importBatch(
    userId: string,
    records: any[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: records.length,
      success: 0,
      failed: 0,
      errors: []
    };
    
    // 分批处理
    const batchSize = 100;
    const batches = chunk(records, batchSize);
    
    for (const batch of batches) {
      try {
        await databaseService.prisma.$transaction(async (tx) => {
          for (const record of batch) {
            try {
              // 查找资产
              const asset = await tx.asset.findFirst({
                where: { symbol: record.asset_symbol }
              });
              
              if (!asset) {
                throw new Error(`资产不存在: ${record.asset_symbol}`);
              }
              
              // 查找投资组合
              const portfolio = await tx.portfolio.findFirst({
                where: {
                  user_id: userId,
                  name: record.portfolio_name || '默认组合'
                }
              });
              
              if (!portfolio) {
                throw new Error('投资组合不存在');
              }
              
              // 查找交易账户
              const account = await tx.tradingAccount.findFirst({
                where: {
                  portfolio_id: portfolio.id
                }
              });
              
              if (!account) {
                throw new Error('交易账户不存在');
              }
              
              // 创建交易
              await tx.transaction.create({
                data: {
                  portfolio_id: portfolio.id,
                  trading_account_id: account.id,
                  asset_id: asset.id,
                  transaction_type: record.transaction_type,
                  side: record.side || 'LONG',
                  quantity: parseFloat(record.quantity),
                  price: parseFloat(record.price),
                  total_amount: parseFloat(record.total_amount || (record.quantity * record.price)),
                  fees: parseFloat(record.fees || 0),
                  taxes: parseFloat(record.taxes || 0),
                  currency: record.currency || 'CNY',
                  transaction_date: new Date(record.transaction_date),
                  notes: record.notes,
                  external_id: record.external_id
                }
              });
              
              result.success++;
            } catch (error) {
              result.failed++;
              result.errors.push({
                row: record,
                message: error.message
              });
            }
          }
        });
      } catch (error) {
        console.error('批次导入失败:', error);
      }
    }
    
    return result;
  }
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### 4. API 路由

```typescript
// backend/src/routes/transactions.ts
import multer from 'multer';
import { FileParserService } from '../services/FileParserService';
import { TransactionValidatorService } from '../services/TransactionValidatorService';
import { TransactionImportService } from '../services/TransactionImportService';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 解析文件
router.post('/import/parse',
  authenticate,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请上传文件'
        });
      }
      
      const parser = new FileParserService();
      const records = await parser.parse(req.file);
      
      res.json({
        success: true,
        data: {
          records,
          total: records.length,
          headers: Object.keys(records[0] || {})
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

// 验证数据
router.post('/import/validate',
  authenticate,
  async (req, res) => {
    try {
      const { records } = req.body;
      
      if (!records || !Array.isArray(records)) {
        return res.status(400).json({
          success: false,
          message: '无效的数据格式'
        });
      }
      
      const validator = new TransactionValidatorService();
      const result = await validator.validate(records);
      
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

// 执行导入
router.post('/import/execute',
  authenticate,
  async (req, res) => {
    try {
      const { records, options } = req.body;
      
      const importService = new TransactionImportService();
      const result = await importService.importBatch(
        req.user.id,
        records,
        options || {}
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

// 下载模板
router.get('/import/template',
  authenticate,
  (req, res) => {
    const template = [
      ['交易日期', '资产代码', '资产名称', '交易类型', '方向', '数量', '价格', '手续费', '备注'],
      ['2024-01-15', 'AAPL', '苹果公司', 'BUY', 'LONG', '100', '150.50', '5.00', '定投'],
      ['2024-01-16', '00700', '腾讯控股', 'SELL', 'LONG', '200', '350.00', '10.00', '止盈']
    ];
    
    const csv = template.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transaction_template.csv"');
    res.send('\uFEFF' + csv); // BOM for Excel
  }
);
```

### 5. 前端导入向导

```tsx
// frontend/src/components/transaction/import/ImportWizard.tsx
import React, { useState } from 'react';
import { Modal, Steps, Button, message } from 'antd';
import FileUploadStep from './FileUploadStep';
import DataPreviewStep from './DataPreviewStep';
import ImportConfirmStep from './ImportConfirmStep';

const ImportWizard: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose
}) => {
  const [current, setCurrent] = useState(0);
  const [records, setRecords] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  
  const steps = [
    {
      title: '上传文件',
      content: (
        <FileUploadStep
          onFileUploaded={(data) => {
            setRecords(data.records);
            setCurrent(1);
          }}
        />
      )
    },
    {
      title: '数据预览',
      content: (
        <DataPreviewStep
          records={records}
          onValidated={(result) => {
            setValidationResult(result);
            setCurrent(2);
          }}
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
  
  const handleImport = async () => {
    setImporting(true);
    
    try {
      const response = await fetch('/api/transactions/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: validationResult.valid.map(v => v.data)
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success(`成功导入 ${result.data.success} 条记录`);
        onClose();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('导入失败');
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <Modal
      title="批量导入交易"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      <Steps current={current} items={steps} style={{ marginBottom: 24 }} />
      
      <div style={{ minHeight: 400 }}>
        {steps[current].content}
      </div>
      
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        {current > 0 && (
          <Button onClick={() => setCurrent(current - 1)} style={{ marginRight: 8 }}>
            上一步
          </Button>
        )}
        
        {current === steps.length - 1 && (
          <Button type="primary" loading={importing} onClick={handleImport}>
            开始导入
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default ImportWizard;
```

### 6. 文件上传步骤

```tsx
// frontend/src/components/transaction/import/FileUploadStep.tsx
import React from 'react';
import { Upload, Button, Alert, Space } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const FileUploadStep: React.FC<{ onFileUploaded: (data: any) => void }> = ({
  onFileUploaded
}) => {
  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.csv,.xlsx,.xls',
    maxCount: 1,
    beforeUpload: (file) => {
      const isValidType = file.name.endsWith('.csv') || 
                         file.name.endsWith('.xlsx') || 
                         file.name.endsWith('.xls');
      
      if (!isValidType) {
        message.error('只支持 CSV 和 Excel 格式！');
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
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/transactions/import/parse', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          onSuccess(result.data);
          onFileUploaded(result.data);
        } else {
          onError(new Error(result.message));
        }
      } catch (error) {
        onError(error);
      }
    }
  };
  
  const downloadTemplate = () => {
    window.open('/api/transactions/import/template', '_blank');
  };
  
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message="导入说明"
        description={
          <ul>
            <li>支持 CSV 和 Excel 格式</li>
            <li>文件大小不超过 10MB</li>
            <li>单次最多导入 10,000 条记录</li>
            <li>必填字段：交易日期、资产代码、交易类型、数量、价格</li>
          </ul>
        }
        type="info"
        showIcon
      />
      
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持 CSV、Excel 格式，单个文件不超过 10MB
          </p>
        </Upload.Dragger>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <Button
          icon={<DownloadOutlined />}
          onClick={downloadTemplate}
        >
          下载导入模板
        </Button>
      </div>
    </Space>
  );
};

export default FileUploadStep;
```

---

## 🧪 测试数据

### CSV 测试文件
```csv
交易日期,资产代码,资产名称,交易类型,方向,数量,价格,手续费,备注
2024-01-15,AAPL,苹果公司,BUY,LONG,100,150.50,5.00,定投
2024-01-16,00700,腾讯控股,SELL,LONG,200,350.00,10.00,止盈
2024-01-17,MSFT,微软,BUY,LONG,50,380.00,3.00,
2024-01-18,GOOGL,谷歌,BUY,LONG,30,140.50,2.00,长期持有
```

---

## ✅ 检查清单

### 后端
- [ ] 安装依赖 (papaparse, xlsx, multer)
- [ ] 创建 FileParserService
- [ ] 创建 TransactionValidatorService
- [ ] 创建 TransactionImportService
- [ ] 添加 API 路由
- [ ] 测试文件解析
- [ ] 测试数据验证
- [ ] 测试批量导入

### 前端
- [ ] 创建 ImportWizard 组件
- [ ] 创建 FileUploadStep 组件
- [ ] 创建 DataPreviewStep 组件
- [ ] 创建 ImportConfirmStep 组件
- [ ] 集成到交易管理页面
- [ ] 测试完整流程

### 测试
- [ ] 准备测试数据
- [ ] 测试 CSV 导入
- [ ] 测试 Excel 导入
- [ ] 测试错误处理
- [ ] 测试大文件导入
- [ ] 性能测试

---

## 🚨 常见问题

### 1. 文件解析失败
**原因**: 文件编码问题  
**解决**: 确保文件使用 UTF-8 编码

### 2. 资产不存在
**原因**: 数据库中没有对应的资产  
**解决**: 先导入资产数据，或在导入时自动创建

### 3. 导入速度慢
**原因**: 单条插入效率低  
**解决**: 使用批量插入，每批 100-500 条

### 4. 内存溢出
**原因**: 一次性加载大文件  
**解决**: 使用流式处理或分批上传

---

## 📚 参考资源

- [PapaParse 文档](https://www.papaparse.com/)
- [SheetJS 文档](https://docs.sheetjs.com/)
- [Ant Design Upload](https://ant.design/components/upload-cn/)
- [Multer 文档](https://github.com/expressjs/multer)

---

**创建日期**: 2025-10-27  
**预计工期**: 2 周  
**难度**: ⭐⭐⭐ (中等)
