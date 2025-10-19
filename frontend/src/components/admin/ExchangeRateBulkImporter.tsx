import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Steps,
  Table,
  Alert,
  Progress,
  Typography,
  Space,
  Tag,
  Divider,
  Card,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as XLSX from 'xlsx';
import { ExchangeRateService } from '../../services/exchangeRateService';

const { Dragger } = Upload;
const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;

interface ImportData {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateDate: string;
  dataSource?: string;
}

interface ImportResult {
  success: number;
  errors: string[];
}

interface ExchangeRateBulkImporterProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ExchangeRateBulkImporter: React.FC<ExchangeRateBulkImporterProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileData, setFileData] = useState<ImportData[]>([]);
  const [validData, setValidData] = useState<ImportData[]>([]);
  const [invalidData, setInvalidData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 重置状态
  const resetState = () => {
    setCurrentStep(0);
    setFileData([]);
    setValidData([]);
    setInvalidData([]);
    setImporting(false);
    setImportResult(null);
    setUploadProgress(0);
  };

  // 处理文件上传
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        processFileData(jsonData);
      } catch (error) {
        console.error('文件解析失败:', error);
        Modal.error({
          title: '文件解析失败',
          content: '请确保文件格式正确，支持 Excel (.xlsx, .xls) 和 CSV 文件。'
        });
      }
    };
    
    reader.readAsArrayBuffer(file);
    return false; // 阻止默认上传行为
  };

  // 处理文件数据
  const processFileData = (data: any[]) => {
    const processed: ImportData[] = [];
    const invalid: any[] = [];
    
    data.forEach((row, index) => {
      const errors: string[] = [];
      
      // 验证必要字段
      if (!row.fromCurrency && !row['基础货币'] && !row['From Currency']) {
        errors.push('缺少基础货币');
      }
      if (!row.toCurrency && !row['目标货币'] && !row['To Currency']) {
        errors.push('缺少目标货币');
      }
      if (!row.rate && !row['汇率'] && !row['Rate']) {
        errors.push('缺少汇率');
      }
      if (!row.rateDate && !row['日期'] && !row['Date']) {
        errors.push('缺少日期');
      }
      
      // 标准化字段名
      const fromCurrency = row.fromCurrency || row['基础货币'] || row['From Currency'];
      const toCurrency = row.toCurrency || row['目标货币'] || row['To Currency'];
      const rate = row.rate || row['汇率'] || row['Rate'];
      const rateDate = row.rateDate || row['日期'] || row['Date'];
      
      // 验证数据格式
      if (fromCurrency && !/^[A-Z]{3}$/.test(fromCurrency.toString().toUpperCase())) {
        errors.push('基础货币格式无效（应为3位字母代码）');
      }
      if (toCurrency && !/^[A-Z]{3}$/.test(toCurrency.toString().toUpperCase())) {
        errors.push('目标货币格式无效（应为3位字母代码）');
      }
      if (rate && (isNaN(parseFloat(rate)) || parseFloat(rate) <= 0)) {
        errors.push('汇率格式无效（应为正数）');
      }
      if (rateDate && isNaN(Date.parse(rateDate))) {
        errors.push('日期格式无效');
      }
      
      if (errors.length > 0) {
        invalid.push({
          rowIndex: index + 1,
          data: row,
          errors
        });
      } else {
        processed.push({
          fromCurrency: fromCurrency.toString().toUpperCase(),
          toCurrency: toCurrency.toString().toUpperCase(),
          rate: parseFloat(rate),
          rateDate: new Date(rateDate).toISOString().split('T')[0],
          dataSource: 'import'
        });
      }
    });
    
    setFileData(data);
    setValidData(processed);
    setInvalidData(invalid);
    setCurrentStep(1);
  };

  // 执行导入
  const handleImport = async () => {
    setImporting(true);
    setCurrentStep(2);
    
    try {
      // 模拟进度更新
      const total = validData.length;
      let completed = 0;
      
      const updateProgress = () => {
        completed++;
        setUploadProgress(Math.round((completed / total) * 100));
      };
      
      // 分批处理数据
      const batchSize = 10;
      const results = { success: 0, errors: [] as string[] };
      
      for (let i = 0; i < validData.length; i += batchSize) {
        const batch = validData.slice(i, i + batchSize);
        
        try {
          const batchResult = await ExchangeRateService.bulkImportRates(batch);
          results.success += batchResult.success;
          results.errors.push(...batchResult.errors);
          
          // 更新进度
          for (let j = 0; j < batch.length; j++) {
            updateProgress();
            await new Promise(resolve => setTimeout(resolve, 50)); // 模拟处理时间
          }
        } catch (error) {
          results.errors.push(`批次 ${Math.floor(i / batchSize) + 1} 处理失败: ${error.message}`);
          for (let j = 0; j < batch.length; j++) {
            updateProgress();
          }
        }
      }
      
      setImportResult(results);
      setCurrentStep(3);
      
      if (onSuccess && results.success > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('导入失败:', error);
      Modal.error({
        title: '导入失败',
        content: error.message || '导入过程中发生未知错误'
      });
    } finally {
      setImporting(false);
    }
  };

  // 下载模板
  const downloadTemplate = () => {
    const templateData = [
      {
        '基础货币': 'USD',
        '目标货币': 'CNY',
        '汇率': 7.2345,
        '日期': '2024-01-15'
      },
      {
        '基础货币': 'EUR',
        '目标货币': 'USD',
        '汇率': 1.0876,
        '日期': '2024-01-15'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '汇率模板');
    XLSX.writeFile(wb, '汇率导入模板.xlsx');
  };

  // 表格列定义
  const validDataColumns: ColumnsType<ImportData> = [
    {
      title: '基础货币',
      dataIndex: 'fromCurrency',
      key: 'fromCurrency',
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '目标货币',
      dataIndex: 'toCurrency',
      key: 'toCurrency',
      width: 100,
      render: (text) => <Tag color="green">{text}</Tag>
    },
    {
      title: '汇率',
      dataIndex: 'rate',
      key: 'rate',
      width: 120,
      render: (rate) => <Text strong>{rate.toFixed(6)}</Text>
    },
    {
      title: '日期',
      dataIndex: 'rateDate',
      key: 'rateDate',
      width: 120
    }
  ];

  const invalidDataColumns: ColumnsType<any> = [
    {
      title: '行号',
      dataIndex: 'rowIndex',
      key: 'rowIndex',
      width: 60
    },
    {
      title: '原始数据',
      dataIndex: 'data',
      key: 'data',
      render: (data) => (
        <Text code style={{ fontSize: '12px' }}>
          {JSON.stringify(data).substring(0, 100)}...
        </Text>
      )
    },
    {
      title: '错误信息',
      dataIndex: 'errors',
      key: 'errors',
      render: (errors: string[]) => (
        <div>
          {errors.map((error, index) => (
            <Tag color="red" key={index} style={{ marginBottom: 2 }}>
              {error}
            </Tag>
          ))}
        </div>
      )
    }
  ];

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal
      title="批量导入汇率数据"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnClose={true}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="上传文件" description="选择Excel或CSV文件" />
        <Step title="数据验证" description="检查数据格式" />
        <Step title="执行导入" description="导入到数据库" />
        <Step title="完成" description="查看导入结果" />
      </Steps>

      {/* 步骤1: 文件上传 */}
      {currentStep === 0 && (
        <div>
          <Alert
            message="导入说明"
            description={
              <div>
                <Paragraph>
                  请上传包含汇率数据的Excel或CSV文件。文件应包含以下列：
                </Paragraph>
                <ul>
                  <li><strong>基础货币</strong>（或 fromCurrency）: 3位货币代码，如 USD</li>
                  <li><strong>目标货币</strong>（或 toCurrency）: 3位货币代码，如 CNY</li>
                  <li><strong>汇率</strong>（或 rate）: 数值，如 7.2345</li>
                  <li><strong>日期</strong>（或 rateDate）: 日期格式，如 2024-01-15</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={downloadTemplate}
              type="dashed"
            >
              下载导入模板
            </Button>
          </div>
          
          <Dragger
            accept=".xlsx,.xls,.csv"
            beforeUpload={handleFileUpload}
            showUploadList={false}
            style={{ marginBottom: 16 }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 Excel (.xlsx, .xls) 和 CSV 文件
            </p>
          </Dragger>
        </div>
      )}

      {/* 步骤2: 数据验证 */}
      {currentStep === 1 && (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="总记录数"
                  value={fileData.length}
                  prefix={<UploadOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="有效记录"
                  value={validData.length}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="无效记录"
                  value={invalidData.length}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {validData.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>有效数据预览</Title>
              <Table
                columns={validDataColumns}
                dataSource={validData.slice(0, 10)}
                rowKey={(record, index) => index!}
                pagination={false}
                size="small"
                scroll={{ y: 200 }}
              />
              {validData.length > 10 && (
                <Text type="secondary">
                  显示前10条记录，共{validData.length}条有效记录
                </Text>
              )}
            </div>
          )}

          {invalidData.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>无效数据</Title>
              <Table
                columns={invalidDataColumns}
                dataSource={invalidData}
                rowKey="rowIndex"
                pagination={false}
                size="small"
                scroll={{ y: 200 }}
              />
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCurrentStep(0)}>
                重新上传
              </Button>
              <Button 
                type="primary" 
                onClick={handleImport}
                disabled={validData.length === 0}
              >
                开始导入 ({validData.length} 条记录)
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* 步骤3: 执行导入 */}
      {currentStep === 2 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={4}>正在导入数据...</Title>
          <Progress 
            type="circle" 
            percent={uploadProgress} 
            status={importing ? 'active' : 'success'}
            style={{ marginBottom: 16 }}
          />
          <div>
            <Text type="secondary">
              请稍候，正在处理 {validData.length} 条汇率记录
            </Text>
          </div>
        </div>
      )}

      {/* 步骤4: 完成 */}
      {currentStep === 3 && importResult && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircleOutlined 
              style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} 
            />
            <Title level={3}>导入完成</Title>
          </div>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card>
                <Statistic
                  title="成功导入"
                  value={importResult.success}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="失败记录"
                  value={importResult.errors.length}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {importResult.errors.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>错误详情</Title>
              <Alert
                message="部分记录导入失败"
                description={
                  <ul style={{ marginBottom: 0 }}>
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>... 还有 {importResult.errors.length - 10} 个错误</li>
                    )}
                  </ul>
                }
                type="warning"
                showIcon
              />
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCurrentStep(0)}>
                继续导入
              </Button>
              <Button type="primary" onClick={handleClose}>
                完成
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ExchangeRateBulkImporter;