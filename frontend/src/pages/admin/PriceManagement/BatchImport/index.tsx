import React, { useState } from 'react';
import { 
  Card, 
  Upload, 
  Button, 
  Table, 
  message, 
  Space,
  Alert,
  Statistic,
  Row,
  Col,
  Steps,
  Tag,
  Divider,
  Typography,
  Modal
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import * as XLSX from 'xlsx';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface ImportRecord {
  key: string;
  rowNumber: number;
  assetSymbol: string;
  assetName?: string;
  priceDate: string;
  closePrice: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  currency?: string;
  status: 'pending' | 'valid' | 'error';
  errorMessage?: string;
  assetId?: string;
}

interface ValidationResult {
  valid: number;
  invalid: number;
  total: number;
}

const BatchImport: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [importData, setImportData] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    valid: 0,
    invalid: 0,
    total: 0
  });

  // 下载导入模板
  const downloadTemplate = () => {
    const template = [
      {
        '产品代码': '00700',
        '产品名称': '腾讯控股',
        '价格日期': '2025-01-15',
        '收盘价': '350.50',
        '开盘价': '348.00',
        '最高价': '352.00',
        '最低价': '347.50',
        '币种': 'HKD'
      },
      {
        '产品代码': '03690',
        '产品名称': '美团-W',
        '价格日期': '2025-01-15',
        '收盘价': '125.80',
        '开盘价': '124.50',
        '最高价': '126.20',
        '最低价': '124.00',
        '币种': 'HKD'
      },
      {
        '产品代码': 'BILI',
        '产品名称': '哔哩哔哩',
        '价格日期': '2025-01-15',
        '收盘价': '18.50',
        '开盘价': '18.20',
        '最高价': '18.80',
        '最低价': '18.10',
        '币种': 'USD'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '价格数据');

    // 设置列宽
    ws['!cols'] = [
      { wch: 12 }, // 产品代码
      { wch: 20 }, // 产品名称
      { wch: 12 }, // 价格日期
      { wch: 10 }, // 收盘价
      { wch: 10 }, // 开盘价
      { wch: 10 }, // 最高价
      { wch: 10 }, // 最低价
      { wch: 8 }   // 币种
    ];

    XLSX.writeFile(wb, '价格导入模板.xlsx');
    message.success('模板下载成功');
  };

  // 解析 Excel 文件
  const parseExcelFile = (file: File): Promise<ImportRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const records: ImportRecord[] = jsonData.map((row: any, index: number) => {
            const record: ImportRecord = {
              key: `${index}`,
              rowNumber: index + 2, // Excel 行号（从第2行开始，第1行是表头）
              assetSymbol: row['产品代码']?.toString().trim() || '',
              assetName: row['产品名称']?.toString().trim(),
              priceDate: row['价格日期']?.toString().trim() || '',
              closePrice: parseFloat(row['收盘价']) || 0,
              openPrice: row['开盘价'] ? parseFloat(row['开盘价']) : undefined,
              highPrice: row['最高价'] ? parseFloat(row['最高价']) : undefined,
              lowPrice: row['最低价'] ? parseFloat(row['最低价']) : undefined,
              currency: row['币种']?.toString().trim(),
              status: 'pending'
            };

            return record;
          });

          resolve(records);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsBinaryString(file);
    });
  };

  // 验证数据
  const validateData = async (records: ImportRecord[]) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // 批量查询产品信息
      const symbols = [...new Set(records.map(r => r.assetSymbol))];
      const assetMap = new Map<string, any>();

      for (const symbol of symbols) {
        try {
          const response = await axios.get('/api/assets', {
            params: { keyword: symbol, limit: 10 },
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.data.success && response.data.data.length > 0) {
            // 精确匹配产品代码
            const asset = response.data.data.find((a: any) => 
              a.symbol.toUpperCase() === symbol.toUpperCase()
            );
            if (asset) {
              assetMap.set(symbol, asset);
            }
          }
        } catch (error) {
          console.error(`查询产品 ${symbol} 失败:`, error);
        }
      }

      // 验证每条记录
      let validCount = 0;
      let invalidCount = 0;

      const validatedRecords = records.map(record => {
        const errors: string[] = [];

        // 验证产品代码
        if (!record.assetSymbol) {
          errors.push('产品代码不能为空');
        } else {
          const asset = assetMap.get(record.assetSymbol);
          if (!asset) {
            errors.push(`产品代码 ${record.assetSymbol} 不存在`);
          } else {
            record.assetId = asset.id;
            record.assetName = asset.name;
            if (!record.currency) {
              record.currency = asset.currency;
            }
          }
        }

        // 验证日期
        if (!record.priceDate) {
          errors.push('价格日期不能为空');
        } else {
          const date = dayjs(record.priceDate);
          if (!date.isValid()) {
            errors.push('价格日期格式无效');
          }
        }

        // 验证收盘价
        if (!record.closePrice || record.closePrice <= 0) {
          errors.push('收盘价必须大于0');
        }

        // 验证价格逻辑
        if (record.highPrice !== undefined && record.lowPrice !== undefined) {
          if (record.highPrice < record.lowPrice) {
            errors.push('最高价不能低于最低价');
          }

          if (record.closePrice < record.lowPrice || record.closePrice > record.highPrice) {
            errors.push('收盘价应在最高价和最低价之间');
          }

          if (record.openPrice !== undefined && 
              (record.openPrice < record.lowPrice || record.openPrice > record.highPrice)) {
            errors.push('开盘价应在最高价和最低价之间');
          }
        }

        if (errors.length > 0) {
          invalidCount++;
          return {
            ...record,
            status: 'error' as const,
            errorMessage: errors.join('; ')
          };
        } else {
          validCount++;
          return {
            ...record,
            status: 'valid' as const
          };
        }
      });

      setImportData(validatedRecords);
      setValidationResult({
        valid: validCount,
        invalid: invalidCount,
        total: records.length
      });
      setCurrentStep(1);
      
      if (invalidCount > 0) {
        message.warning(`发现 ${invalidCount} 条无效记录，请检查并修正`);
      } else {
        message.success(`所有 ${validCount} 条记录验证通过`);
      }
    } catch (error) {
      console.error('验证数据失败:', error);
      message.error('验证数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 文件上传配置
  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    beforeUpload: async (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      file.type === 'application/vnd.ms-excel';
      
      if (!isExcel) {
        message.error('只能上传 Excel 文件！');
        return false;
      }

      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('文件大小不能超过 5MB！');
        return false;
      }

      try {
        setLoading(true);
        const records = await parseExcelFile(file);
        
        if (records.length === 0) {
          message.error('文件中没有数据');
          setLoading(false);
          return false;
        }

        if (records.length > 1000) {
          message.error('单次导入不能超过 1000 条记录');
          setLoading(false);
          return false;
        }

        await validateData(records);
      } catch (error) {
        console.error('解析文件失败:', error);
        message.error('解析文件失败，请检查文件格式');
        setLoading(false);
      }

      return false; // 阻止自动上传
    },
    showUploadList: false
  };

  // 导入数据
  const handleImport = async () => {
    const validRecords = importData.filter(r => r.status === 'valid');
    
    if (validRecords.length === 0) {
      message.error('没有有效的记录可以导入');
      return;
    }

    Modal.confirm({
      title: '确认导入',
      content: `确定要导入 ${validRecords.length} 条价格记录吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const updates = validRecords.map(record => ({
            assetId: record.assetId!,
            priceDate: dayjs(record.priceDate).format('YYYY-MM-DD'),
            closePrice: record.closePrice,
            openPrice: record.openPrice,
            highPrice: record.highPrice,
            lowPrice: record.lowPrice,
            currency: record.currency!,
            dataSource: 'IMPORT'
          }));

          const token = localStorage.getItem('auth_token');
          const response = await axios.post('/api/assets/prices/bulk', {
            updates
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.data.success) {
            message.success(`成功导入 ${validRecords.length} 条价格记录`);
            setCurrentStep(2);
          } else {
            message.error(response.data.message || '导入失败');
          }
        } catch (error: any) {
          console.error('导入失败:', error);
          message.error(error.response?.data?.message || '导入失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 重新开始
  const handleReset = () => {
    setCurrentStep(0);
    setImportData([]);
    setValidationResult({ valid: 0, invalid: 0, total: 0 });
  };

  // 表格列定义
  const columns = [
    {
      title: '行号',
      dataIndex: 'rowNumber',
      width: 70,
      fixed: 'left' as const
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      fixed: 'left' as const,
      render: (status: string) => {
        if (status === 'valid') {
          return <Tag icon={<CheckCircleOutlined />} color="success">有效</Tag>;
        } else if (status === 'error') {
          return <Tag icon={<CloseCircleOutlined />} color="error">错误</Tag>;
        } else {
          return <Tag icon={<ExclamationCircleOutlined />} color="warning">待验证</Tag>;
        }
      }
    },
    {
      title: '产品代码',
      dataIndex: 'assetSymbol',
      width: 120
    },
    {
      title: '产品名称',
      dataIndex: 'assetName',
      width: 150
    },
    {
      title: '价格日期',
      dataIndex: 'priceDate',
      width: 120
    },
    {
      title: '收盘价',
      dataIndex: 'closePrice',
      width: 100,
      render: (value: number) => value?.toFixed(4)
    },
    {
      title: '开盘价',
      dataIndex: 'openPrice',
      width: 100,
      render: (value: number) => value ? value.toFixed(4) : '-'
    },
    {
      title: '最高价',
      dataIndex: 'highPrice',
      width: 100,
      render: (value: number) => value ? value.toFixed(4) : '-'
    },
    {
      title: '最低价',
      dataIndex: 'lowPrice',
      width: 100,
      render: (value: number) => value ? value.toFixed(4) : '-'
    },
    {
      title: '币种',
      dataIndex: 'currency',
      width: 80
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      width: 300,
      render: (text: string) => text ? <Text type="danger">{text}</Text> : '-'
    }
  ];

  return (
    <div>
      <Card>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="上传文件" description="选择并上传 Excel 文件" />
          <Step title="数据验证" description="检查数据有效性" />
          <Step title="导入完成" description="保存到数据库" />
        </Steps>

        {currentStep === 0 && (
          <div>
            <Alert
              message="批量导入说明"
              description={
                <div>
                  <Paragraph>
                    1. 下载导入模板，按照模板格式填写价格数据<br/>
                    2. 产品代码必须与系统中的产品代码完全一致<br/>
                    3. 价格日期格式：YYYY-MM-DD（如：2025-01-15）<br/>
                    4. 收盘价为必填项，其他价格字段可选<br/>
                    5. 单次最多导入 1000 条记录
                  </Paragraph>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card size="small" style={{ backgroundColor: '#f0f2f5' }}>
                <Space size="large">
                  <Button 
                    icon={<DownloadOutlined />} 
                    onClick={downloadTemplate}
                    type="primary"
                  >
                    下载导入模板
                  </Button>
                  <Text type="secondary">
                    请先下载模板，按照模板格式填写数据后再上传
                  </Text>
                </Space>
              </Card>

              <Divider />

              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Upload {...uploadProps}>
                  <Button 
                    icon={<UploadOutlined />} 
                    size="large"
                    loading={loading}
                  >
                    选择 Excel 文件
                  </Button>
                </Upload>
                <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                  支持 .xlsx 和 .xls 格式，文件大小不超过 5MB
                </Text>
              </div>
            </Space>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="总记录数" 
                    value={validationResult.total}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="有效记录" 
                    value={validationResult.valid}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="无效记录" 
                    value={validationResult.invalid}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="有效率" 
                    value={validationResult.total > 0 
                      ? ((validationResult.valid / validationResult.total) * 100).toFixed(1)
                      : 0
                    }
                    suffix="%"
                    valueStyle={{ 
                      color: validationResult.invalid === 0 ? '#52c41a' : '#faad14' 
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {validationResult.invalid > 0 && (
              <Alert
                message="发现无效记录"
                description="请检查下方标记为错误的记录，修正后重新上传文件"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Table
              columns={columns}
              dataSource={importData}
              scroll={{ x: 1400, y: 400 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              size="small"
            />

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button onClick={handleReset}>
                  重新上传
                </Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={handleImport}
                  loading={loading}
                  disabled={validationResult.valid === 0}
                >
                  导入 {validationResult.valid} 条有效记录
                </Button>
              </Space>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a' }} />
            <Title level={3} style={{ marginTop: 24 }}>导入成功！</Title>
            <Paragraph type="secondary">
              已成功导入 {validationResult.valid} 条价格记录
            </Paragraph>
            <Button type="primary" onClick={handleReset} style={{ marginTop: 24 }}>
              继续导入
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BatchImport;
