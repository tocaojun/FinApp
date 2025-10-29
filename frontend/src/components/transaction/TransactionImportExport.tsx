import React, { useState } from 'react';
import {
  Card,
  Button,
  Upload,
  Modal,
  Steps,
  Table,
  Alert,
  Progress,
  Space,
  Select,
  Form,
  Input,
  Checkbox,
  Typography,
  Divider,
  Tag,
  message,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import type { ColumnsType } from 'antd/es/table';
import { 
  parseImportFile as parseFile, 
  importTransactions, 
  exportTransactions, 
  getImportTemplate,
  validateImportData,
  Transaction,
  ImportRecord,
  ExportOptions,
  ImportResult
} from '../../services/importExportApi';

const { Option } = Select;
const { Step } = Steps;
const { Text, Title } = Typography;
const { Dragger } = Upload;

interface Transaction {
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

interface ImportRecord {
  rowIndex: number;
  data: Partial<Transaction>;
  errors: string[];
  warnings: string[];
  status: 'valid' | 'warning' | 'error';
}

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dateRange?: [string, string];
  portfolioIds?: string[];
  transactionTypes?: string[];
  includeFields: string[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface TransactionImportExportProps {
  transactions: Transaction[];
  onImport: (transactions: Partial<Transaction>[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  onExport: (options: ExportOptions) => Promise<void>;
}

const TransactionImportExport: React.FC<TransactionImportExportProps> = ({
  transactions,
  onImport,
  onExport
}) => {
  // 导入相关状态
  const [importVisible, setImportVisible] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);
  const [importRecords, setImportRecords] = useState<ImportRecord[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // 导出相关状态
  const [exportVisible, setExportVisible] = useState(false);
  const [exportForm] = Form.useForm();
  const [exportProgress, setExportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  // 字段映射配置
  const fieldMappings = {
    portfolioName: '投资组合',
    assetSymbol: '资产代码',
    assetName: '资产名称',
    transactionType: '交易类型',
    side: '交易方向',
    quantity: '数量',
    price: '价格',
    amount: '金额',
    fee: '手续费',
    executedAt: '执行日期',
    status: '状态',
    notes: '备注',
    tags: '标签'
  };

  const requiredFields = ['portfolioName', 'assetSymbol', 'transactionType', 'quantity', 'price', 'executedAt'];

  // 导入处理
  const handleFileUpload: UploadProps['customRequest'] = async (options) => {
    const { file } = options;
    setUploadedFile(file as UploadFile);
    
    try {
      await parseImportFile(file as File);
      options.onSuccess?.({});
    } catch (error) {
      options.onError?.(error as Error);
    }
  };

  const parseImportFile = async (file: File) => {
    try {
      const records = await parseFile(file);
      setImportRecords(records);
      setImportStep(1);
    } catch (error) {
      console.error('解析文件失败:', error);
      message.error('解析文件失败，请检查文件格式');
    }
  };

  const validateImportData = () => {
    const validRecords = importRecords.filter(record => record.status === 'valid' || record.status === 'warning');
    return validRecords.map(record => record.data);
  };

  const handleImport = async () => {
    const validData = validateImportData();
    setImportStep(2);
    setImportProgress(0);

    try {
      // 使用真实的导入 API
      const result = await importTransactions(validData);
      setImportResult(result);
      setImportStep(3);

      if (result.success > 0) {
        message.success(`成功导入 ${result.success} 条记录`);
      }
      if (result.failed > 0) {
        message.error(`${result.failed} 条记录导入失败`);
      }
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败');
      setImportStep(1);
    }
  };

  const resetImport = () => {
    setImportStep(0);
    setUploadedFile(null);
    setImportRecords([]);
    setImportProgress(0);
    setImportResult(null);
  };

  // 导出处理
  const handleExport = async (values: any) => {
    setExporting(true);
    setExportProgress(0);

    try {
      const options: ExportOptions = {
        format: values.format,
        dateRange: values.dateRange ? [
          values.dateRange[0].format('YYYY-MM-DD'),
          values.dateRange[1].format('YYYY-MM-DD')
        ] : undefined,
        portfolioIds: values.portfolioIds,
        transactionTypes: values.transactionTypes,
        includeFields: values.includeFields || Object.keys(fieldMappings),
        groupBy: values.groupBy,
        sortBy: values.sortBy || 'executedAt',
        sortOrder: values.sortOrder || 'DESC'
      };

      // 模拟导出进度
      for (let i = 0; i <= 100; i += 20) {
        setExportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await onExport(options);
      message.success('导出成功');
      setExportVisible(false);
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  // 导入记录表格列
  const importColumns: ColumnsType<ImportRecord> = [
    {
      title: '行号',
      dataIndex: 'rowIndex',
      width: 60,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => {
        const statusConfig = {
          valid: { color: 'success', icon: <CheckCircleOutlined />, text: '有效' },
          warning: { color: 'warning', icon: <ExclamationCircleOutlined />, text: '警告' },
          error: { color: 'error', icon: <ExclamationCircleOutlined />, text: '错误' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '资产',
      render: (_, record) => (
        <div>
          <div>{record.data.assetSymbol}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.data.assetName}</div>
        </div>
      ),
      width: 120,
    },
    {
      title: '交易类型',
      dataIndex: ['data', 'transactionType'],
      width: 100,
    },
    {
      title: '数量',
      dataIndex: ['data', 'quantity'],
      width: 80,
      render: (value: number) => value?.toLocaleString(),
    },
    {
      title: '价格',
      dataIndex: ['data', 'price'],
      width: 100,
      render: (value: number) => value ? `¥${value.toFixed(2)}` : '-',
    },
    {
      title: '金额',
      dataIndex: ['data', 'amount'],
      width: 120,
      render: (value: number) => value ? `¥${value.toLocaleString()}` : '-',
    },
    {
      title: '问题',
      width: 200,
      render: (_, record) => (
        <div>
          {record.errors.map((error, index) => (
            <div key={index} style={{ color: '#ff4d4f', fontSize: '12px' }}>
              • {error}
            </div>
          ))}
          {record.warnings.map((warning, index) => (
            <div key={index} style={{ color: '#fa8c16', fontSize: '12px' }}>
              • {warning}
            </div>
          ))}
        </div>
      ),
    },
  ];

  const getImportSummary = () => {
    const valid = importRecords.filter(r => r.status === 'valid').length;
    const warning = importRecords.filter(r => r.status === 'warning').length;
    const error = importRecords.filter(r => r.status === 'error').length;
    return { valid, warning, error, total: importRecords.length };
  };

  const summary = getImportSummary();

  return (
    <div>
      <Space>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setImportVisible(true)}
        >
          批量导入
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => setExportVisible(true)}
        >
          批量导出
        </Button>
      </Space>

      {/* 导入模态框 */}
      <Modal
        title="批量导入交易记录"
        open={importVisible}
        onCancel={() => {
          setImportVisible(false);
          resetImport();
        }}
        width={1000}
        footer={null}
        destroyOnHidden={true}
      >
        <Steps current={importStep} style={{ marginBottom: 24 }}>
          <Step title="上传文件" icon={<UploadOutlined />} />
          <Step title="数据预览" icon={<InfoCircleOutlined />} />
          <Step title="导入处理" icon={<CheckCircleOutlined />} />
          <Step title="完成" icon={<CheckCircleOutlined />} />
        </Steps>

        {/* 步骤1: 文件上传 */}
        {importStep === 0 && (
          <div>
            <Alert
              message="支持的文件格式"
              description="支持 CSV、Excel (.xlsx) 文件格式。请确保文件包含必要的字段：投资组合、资产代码、交易类型、数量、价格、执行时间。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Dragger
              name="file"
              multiple={false}
              accept=".csv,.xlsx"
              customRequest={handleFileUpload}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <FileExcelOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 CSV 和 Excel 格式文件
              </p>
            </Dragger>

            {uploadedFile && (
              <div style={{ marginTop: 16 }}>
                <Text>已上传文件: {uploadedFile.name}</Text>
              </div>
            )}
          </div>
        )}

        {/* 步骤2: 数据预览 */}
        {importStep === 1 && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总记录数"
                    value={summary.total}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="有效记录"
                    value={summary.valid}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="警告记录"
                    value={summary.warning}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="错误记录"
                    value={summary.error}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            <Table
              columns={importColumns}
              dataSource={importRecords}
              rowKey="rowIndex"
              size="small"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setImportStep(0)}>
                  重新上传
                </Button>
                <Button
                  type="primary"
                  onClick={handleImport}
                  disabled={summary.valid + summary.warning === 0}
                >
                  开始导入 ({summary.valid + summary.warning} 条记录)
                </Button>
              </Space>
            </div>
          </div>
        )}

        {/* 步骤3: 导入处理 */}
        {importStep === 2 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={4}>正在导入数据...</Title>
            <Progress
              type="circle"
              percent={importProgress}
              style={{ marginBottom: 16 }}
            />
            <div>
              <Text>请稍候，正在处理您的数据</Text>
            </div>
          </div>
        )}

        {/* 步骤4: 完成 */}
        {importStep === 3 && importResult && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>导入完成</Title>
            
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="成功导入"
                    value={importResult.success}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="导入失败"
                    value={importResult.failed}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            {importResult.errors.length > 0 && (
              <Alert
                message="部分记录导入失败"
                description={
                  <ul style={{ textAlign: 'left', margin: 0 }}>
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                }
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            <div style={{ marginTop: 24 }}>
              <Button
                type="primary"
                onClick={() => {
                  setImportVisible(false);
                  resetImport();
                }}
              >
                完成
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 导出模态框 */}
      <Modal
        title="批量导出交易记录"
        open={exportVisible}
        onCancel={() => setExportVisible(false)}
        onOk={() => exportForm.submit()}
        confirmLoading={exporting}
        width={600}
      >
        {exporting && (
          <div style={{ marginBottom: 16 }}>
            <Progress percent={exportProgress} status="active" />
          </div>
        )}

        <Form
          form={exportForm}
          layout="vertical"
          onFinish={handleExport}
          initialValues={{
            format: 'excel',
            includeFields: Object.keys(fieldMappings),
            sortBy: 'executedAt',
            sortOrder: 'DESC'
          }}
        >
          <Form.Item
            name="format"
            label="导出格式"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Select>
              <Option value="csv">
                <FileTextOutlined /> CSV 文件
              </Option>
              <Option value="excel">
                <FileExcelOutlined /> Excel 文件
              </Option>
              <Option value="pdf">
                <FilePdfOutlined /> PDF 文件
              </Option>
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="日期范围">
            <Input.Group compact>
              <Input style={{ width: '50%' }} placeholder="开始日期" />
              <Input style={{ width: '50%' }} placeholder="结束日期" />
            </Input.Group>
          </Form.Item>

          <Form.Item name="portfolioIds" label="投资组合">
            <Select mode="multiple" placeholder="选择投资组合（留空表示全部）">
              <Option value="p1">主投资组合</Option>
              <Option value="p2">备用组合</Option>
              <Option value="p3">高风险组合</Option>
            </Select>
          </Form.Item>

          <Form.Item name="transactionTypes" label="交易类型">
            <Select mode="multiple" placeholder="选择交易类型（留空表示全部）">
              <Option value="BUY">买入</Option>
              <Option value="SELL">卖出</Option>
              <Option value="DEPOSIT">存款</Option>
              <Option value="WITHDRAWAL">取款</Option>
              <Option value="DIVIDEND">分红</Option>
              <Option value="INTEREST">利息</Option>
            </Select>
          </Form.Item>

          <Form.Item name="includeFields" label="包含字段">
            <Checkbox.Group>
              <Row>
                {Object.entries(fieldMappings).map(([key, label]) => (
                  <Col span={8} key={key}>
                    <Checkbox value={key}>{label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sortBy" label="排序字段">
                <Select>
                  <Option value="executedAt">执行时间</Option>
                  <Option value="amount">交易金额</Option>
                  <Option value="createdAt">创建时间</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sortOrder" label="排序方向">
                <Select>
                  <Option value="DESC">降序</Option>
                  <Option value="ASC">升序</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default TransactionImportExport;