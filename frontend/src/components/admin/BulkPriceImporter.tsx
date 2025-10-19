import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Table,
  Alert,
  Progress,
  Space,
  Typography,
  Divider,
  Card,
  Row,
  Col,
  Statistic,
  Tag
} from 'antd';
import {
  InboxOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { UploadProps, ColumnsType } from 'antd/es/table';
import { AssetService } from '../../services/assetService';
import * as XLSX from 'xlsx';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface BulkPriceImporterProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PriceRecord {
  row: number;
  assetId: string;
  symbol: string;
  priceDate: string;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice: number;
  volume?: number;
  adjustedPrice?: number;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

interface ImportResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    assetId: string;
    priceDate: string;
    message: string;
  }>;
}

const BulkPriceImporter: React.FC<BulkPriceImporterProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [priceData, setPriceData] = useState<PriceRecord[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

  // 下载模板
  const downloadTemplate = () => {
    const templateData = [
      {
        '资产代码': 'AAPL',
        '价格日期': '2024-01-15',
        '开盘价': 175.00,
        '最高价': 177.50,
        '最低价': 174.20,
        '收盘价': 175.43,
        '成交量': 45678900,
        '调整价格': 175.43
      },
      {
        '资产代码': '000001',
        '价格日期': '2024-01-15',
        '开盘价': 12.50,
        '最高价': 12.80,
        '最低价': 12.30,
        '收盘价': 12.45,
        '成交量': 15678900,
        '调整价格': 12.45
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '价格数据模板');
    XLSX.writeFile(wb, '价格导入模板.xlsx');
  };

  // 处理文件上传
  const handleFileUpload: UploadProps['customRequest'] = (options) => {
    const { file } = options;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: PriceRecord[] = jsonData.map((row: any, index: number) => ({
          row: index + 2, // Excel行号从2开始（第1行是标题）
          assetId: '', // 需要通过symbol查找
          symbol: row['资产代码'] || row['symbol'] || '',
          priceDate: formatDate(row['价格日期'] || row['priceDate'] || ''),
          openPrice: parseFloat(row['开盘价'] || row['openPrice'] || 0) || undefined,
          highPrice: parseFloat(row['最高价'] || row['highPrice'] || 0) || undefined,
          lowPrice: parseFloat(row['最低价'] || row['lowPrice'] || 0) || undefined,
          closePrice: parseFloat(row['收盘价'] || row['closePrice'] || 0),
          volume: parseInt(row['成交量'] || row['volume'] || 0) || undefined,
          adjustedPrice: parseFloat(row['调整价格'] || row['adjustedPrice'] || 0) || undefined,
          status: 'pending'
        }));

        setPriceData(parsedData);
        setStep('preview');
        
        if (options.onSuccess) {
          options.onSuccess('ok');
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        if (options.onError) {
          options.onError(new Error('文件解析失败，请检查文件格式'));
        }
      }
    };
    
    reader.readAsArrayBuffer(file as File);
  };

  // 格式化日期
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    // 如果是Excel日期数字
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // 如果是字符串日期
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return dateValue.toString();
  };

  // 执行导入
  const handleImport = async () => {
    setImporting(true);
    
    try {
      // 准备导入数据
      const updates = priceData.map(record => ({
        assetId: record.assetId,
        symbol: record.symbol,
        priceDate: record.priceDate,
        openPrice: record.openPrice,
        highPrice: record.highPrice,
        lowPrice: record.lowPrice,
        closePrice: record.closePrice,
        volume: record.volume,
        adjustedPrice: record.adjustedPrice
      }));

      const result = await AssetService.bulkUpdatePrices({
        updates,
        source: 'bulk_import'
      });

      setImportResult(result);
      setStep('result');
      
      if (result.success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        totalRecords: priceData.length,
        successCount: 0,
        errorCount: priceData.length,
        errors: [{
          row: 0,
          assetId: '',
          priceDate: '',
          message: error instanceof Error ? error.message : '导入失败'
        }]
      });
      setStep('result');
    } finally {
      setImporting(false);
    }
  };

  // 重置状态
  const handleReset = () => {
    setFileList([]);
    setPriceData([]);
    setImportResult(null);
    setStep('upload');
  };

  // 关闭模态框
  const handleClose = () => {
    handleReset();
    onClose();
  };

  const columns: ColumnsType<PriceRecord> = [
    {
      title: '行号',
      dataIndex: 'row',
      key: 'row',
      width: 60,
    },
    {
      title: '资产代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100,
    },
    {
      title: '价格日期',
      dataIndex: 'priceDate',
      key: 'priceDate',
      width: 100,
    },
    {
      title: '收盘价',
      dataIndex: 'closePrice',
      key: 'closePrice',
      width: 80,
      render: (value: number) => value?.toFixed(2) || '-',
    },
    {
      title: '开盘价',
      dataIndex: 'openPrice',
      key: 'openPrice',
      width: 80,
      render: (value: number) => value?.toFixed(2) || '-',
    },
    {
      title: '最高价',
      dataIndex: 'highPrice',
      key: 'highPrice',
      width: 80,
      render: (value: number) => value?.toFixed(2) || '-',
    },
    {
      title: '最低价',
      dataIndex: 'lowPrice',
      key: 'lowPrice',
      width: 80,
      render: (value: number) => value?.toFixed(2) || '-',
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      width: 100,
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string, record: PriceRecord) => {
        if (status === 'success') {
          return <Tag color="success" icon={<CheckCircleOutlined />}>成功</Tag>;
        } else if (status === 'error') {
          return <Tag color="error" icon={<CloseCircleOutlined />}>失败</Tag>;
        }
        return <Tag color="processing">待处理</Tag>;
      },
    },
  ];

  return (
    <Modal
      title="批量价格导入"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={1000}
      destroyOnClose={true}
    >
      {step === 'upload' && (
        <div>
          <Alert
            message="导入说明"
            description={
              <div>
                <p>1. 请下载模板文件，按照模板格式填写价格数据</p>
                <p>2. 支持 Excel (.xlsx, .xls) 格式文件</p>
                <p>3. 必填字段：资产代码、价格日期、收盘价</p>
                <p>4. 可选字段：开盘价、最高价、最低价、成交量、调整价格</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space style={{ marginBottom: 16 }}>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={downloadTemplate}
            >
              下载模板
            </Button>
          </Space>

          <Dragger
            name="file"
            multiple={false}
            accept=".xlsx,.xls"
            fileList={fileList}
            customRequest={handleFileUpload}
            onChange={({ fileList }) => setFileList(fileList)}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个文件上传，仅支持 Excel 格式文件
            </p>
          </Dragger>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <Alert
            message={`共解析到 ${priceData.length} 条价格记录`}
            description="请检查数据是否正确，确认无误后点击开始导入"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Table
            columns={columns}
            dataSource={priceData}
            rowKey="row"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
            scroll={{ y: 400 }}
            size="small"
          />

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleReset}>
                重新上传
              </Button>
              <Button 
                type="primary" 
                onClick={handleImport}
                loading={importing}
              >
                开始导入
              </Button>
            </Space>
          </div>
        </div>
      )}

      {step === 'result' && importResult && (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总记录数"
                  value={importResult.totalRecords}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="成功导入"
                  value={importResult.successCount}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="导入失败"
                  value={importResult.errorCount}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="成功率"
                  value={((importResult.successCount / importResult.totalRecords) * 100).toFixed(1)}
                  suffix="%"
                  valueStyle={{ 
                    color: importResult.successCount === importResult.totalRecords ? '#3f8600' : '#faad14' 
                  }}
                />
              </Card>
            </Col>
          </Row>

          {importResult.errorCount > 0 && (
            <div>
              <Title level={5}>错误详情</Title>
              <Table
                columns={[
                  { title: '行号', dataIndex: 'row', key: 'row', width: 80 },
                  { title: '资产ID', dataIndex: 'assetId', key: 'assetId', width: 120 },
                  { title: '价格日期', dataIndex: 'priceDate', key: 'priceDate', width: 120 },
                  { title: '错误信息', dataIndex: 'message', key: 'message' },
                ]}
                dataSource={importResult.errors}
                rowKey={(record, index) => `${record.row}-${index}`}
                pagination={false}
                size="small"
                scroll={{ y: 200 }}
              />
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleReset}>
                重新导入
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

export default BulkPriceImporter;