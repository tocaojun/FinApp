import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Row,
  Col,
  Statistic,
  Descriptions,
  Progress,
  Spin,
  List,
  Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SyncOutlined,
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import exchangeRateSyncApiClient from '../../../services/exchangeRateSyncApi';

const { RangePicker } = DatePicker;

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rateDate: string;
  rate: number;
  dataSource?: string;
  createdAt: string;
}

interface ExchangeRateStats {
  totalRates: number;
  currencyPairs: number;
  latestUpdate: string;
  dataSourcesCount: number;
  supportedCurrencies: string[];
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

const ExchangeRateSync: React.FC = () => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [stats, setStats] = useState<ExchangeRateStats | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [importForm] = Form.useForm();
  const [syncing, setSyncing] = useState(false);
  const [selectedCurrencyPair, setSelectedCurrencyPair] = useState<{
    from?: string;
    to?: string;
  }>({});
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    const loadAllData = async () => {
      try {
        console.log('[ExchangeRateSync] 开始加载数据...');
        setLoadError(null);
        setLoading(true);
        
        await Promise.all([
          loadStats(),
          loadCurrencies(),
          loadExchangeRates(),
        ]);
        
        console.log('[ExchangeRateSync] 数据加载成功');
      } catch (error: any) {
        const msg = error?.message || '未知错误';
        console.error('[ExchangeRateSync] 数据加载失败:', error);
        setLoadError(`加载失败: ${msg}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  const loadStats = async () => {
    try {
      console.log('[ExchangeRateSync] 加载统计数据...');
      const response = await exchangeRateSyncApiClient.getExchangeRateStats();
      if (response.data && response.data.data) {
        setStats(response.data.data);
        console.log('[ExchangeRateSync] 统计数据加载成功');
      }
    } catch (error) {
      console.error('[ExchangeRateSync] 加载统计失败:', error);
      // 不中断加载流程，只记录错误
    }
  };

  const loadCurrencies = async () => {
    try {
      console.log('[ExchangeRateSync] 加载货币列表...');
      const response = await exchangeRateSyncApiClient.getSupportedCurrencies();
      if (response.data && response.data.data) {
        setCurrencies(response.data.data);
        console.log('[ExchangeRateSync] 货币列表加载成功，共', response.data.data.length, '种');
      }
    } catch (error) {
      console.error('[ExchangeRateSync] 加载货币列表失败:', error);
      // 提供默认货币列表
      setCurrencies([
        { code: 'USD', name: '美元', symbol: '$', isActive: true },
        { code: 'CNY', name: '人民币', symbol: '¥', isActive: true },
        { code: 'EUR', name: '欧元', symbol: '€', isActive: true },
        { code: 'JPY', name: '日元', symbol: '¥', isActive: true },
        { code: 'GBP', name: '英镑', symbol: '£', isActive: true },
      ]);
    }
  };

  const loadExchangeRates = async (page = 1, fromCurrency?: string, toCurrency?: string) => {
    try {
      console.log('[ExchangeRateSync] 加载汇率数据，page:', page);
      const response = await exchangeRateSyncApiClient.searchExchangeRates({
        page,
        limit: 20,
        fromCurrency,
        toCurrency,
        sortBy: 'rateDate',
        sortOrder: 'desc',
      });

      console.log('[ExchangeRateSync] API 响应完整:', {
        status: response.status,
        data: response.data,
        dataType: typeof response.data?.data,
        isArray: Array.isArray(response.data?.data),
      });

      if (response.data) {
        // 处理响应数据结构
        let ratesData: ExchangeRate[] = [];
        
        // 支持两种响应格式：
        // 1. { data: { rates: [...], total: ... } }
        // 2. { data: [...] }
        if (response.data.data) {
          console.log('[ExchangeRateSync] response.data.data 检查:', {
            type: typeof response.data.data,
            isArray: Array.isArray(response.data.data),
            hasRates: 'rates' in response.data.data,
            keys: Object.keys(response.data.data),
          });
          
          if (Array.isArray(response.data.data)) {
            console.log('[ExchangeRateSync] 数据是数组，长度:', response.data.data.length);
            ratesData = response.data.data;
          } else if (response.data.data.rates && Array.isArray(response.data.data.rates)) {
            console.log('[ExchangeRateSync] 数据在 rates 字段，长度:', response.data.data.rates.length);
            ratesData = response.data.data.rates;
          } else {
            console.warn('[ExchangeRateSync] 数据格式不匹配:', response.data.data);
          }
        } else {
          console.warn('[ExchangeRateSync] response.data.data 为空');
        }

        console.log('[ExchangeRateSync] 最终设置的 ratesData:', {
          length: ratesData.length,
          isArray: Array.isArray(ratesData),
          sample: ratesData[0],
        });

        setExchangeRates(ratesData);
        setPagination({
          current: page,
          pageSize: 20,
          total: response.data.pagination?.total || response.data.data?.total || 0,
        });
        console.log('[ExchangeRateSync] 汇率数据加载成功，共', ratesData.length, '条');
      } else {
        console.warn('[ExchangeRateSync] 响应数据格式异常:', response);
        setExchangeRates([]);
      }
    } catch (error) {
      console.error('[ExchangeRateSync] 加载汇率数据失败:', error);
      message.error('加载汇率数据失败');
      setExchangeRates([]);
    }
  };

  const handleRefreshRates = async () => {
    setSyncing(true);
    try {
      const params: any = {};
      if (selectedCurrencyPair.from) params.fromCurrency = selectedCurrencyPair.from;
      if (selectedCurrencyPair.to) params.toCurrency = selectedCurrencyPair.to;

      const response = await exchangeRateSyncApiClient.refreshExchangeRates(params);
      
      if (response.data && response.data.success) {
        message.success('汇率刷新成功，后台更新中...');
        // 延迟刷新统计数据，给后台时间处理
        setTimeout(() => {
          loadStats();
          loadExchangeRates();
        }, 2000);
      } else {
        message.error(response.data?.message || '汇率刷新失败');
      }
    } catch (error: any) {
      console.error('刷新汇率失败:', error);
      const errorMsg = error?.response?.data?.message || 
                      error?.message || 
                      '刷新汇率失败，请检查后台服务是否正常运行';
      message.error(errorMsg);
    } finally {
      setSyncing(false);
    }
  };

  const handleImportHistorical = async (values: any) => {
    setSyncing(true);
    try {
      const response = await exchangeRateSyncApiClient.importHistoricalRates({
        fromCurrency: values.fromCurrency,
        toCurrency: values.toCurrency,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        daysBack: values.daysBack || 365,
      });

      if (response.data && response.data.success) {
        message.success(`导入成功，共导入 ${response.data.data?.importedCount || 0} 条汇率记录`);
        setImportModalVisible(false);
        importForm.resetFields();
        await loadStats();
        await loadExchangeRates();
      } else {
        message.error(response.data?.message || '导入失败');
      }
    } catch (error) {
      console.error('导入历史汇率失败:', error);
      message.error('导入历史汇率失败，请稍后重试');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddRate = async (values: any) => {
    setSyncing(true);
    try {
      const response = await exchangeRateSyncApiClient.createExchangeRate({
        fromCurrency: values.fromCurrency,
        toCurrency: values.toCurrency,
        rateDate: values.rateDate.format('YYYY-MM-DD'),
        rate: values.rate,
        dataSource: 'manual',
      });

      if (response.data && response.data.data) {
        message.success('汇率记录已添加');
        setModalVisible(false);
        form.resetFields();
        await loadStats();
        await loadExchangeRates();
      } else {
        message.error(response.data?.message || '添加失败');
      }
    } catch (error) {
      console.error('添加汇率失败:', error);
      message.error('添加汇率失败，请稍后重试');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteRate = async (id: string) => {
    Modal.confirm({
      title: '删除汇率记录',
      content: '确定要删除这条汇率记录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await exchangeRateSyncApiClient.deleteExchangeRate(id);
          message.success('删除成功');
          await loadStats();
          await loadExchangeRates();
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败');
        }
      },
    });
  };

  const columns: ColumnsType<ExchangeRate> = [
    {
      title: '货币对',
      key: 'currencyPair',
      width: 120,
      render: (_, record) => (
        <Tag color="blue">{record?.fromCurrency || '-'}/{record?.toCurrency || '-'}</Tag>
      ),
    },
    {
      title: '汇率',
      dataIndex: 'rate',
      key: 'rate',
      width: 100,
      render: (rate: number) => (rate !== null && rate !== undefined) ? rate.toFixed(6) : '-',
    },
    {
      title: '日期',
      dataIndex: 'rateDate',
      key: 'rateDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '数据源',
      dataIndex: 'dataSource',
      key: 'dataSource',
      width: 100,
      render: (source: string) => (
        <Tag color={source === 'manual' ? 'orange' : 'green'}>
          {source || '自动'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRate(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const currencyOptions = (currencies || []).filter(c => c.isActive).map(c => ({
    label: `${c.code} (${c.name})`,
    value: c.code,
  }));

  // 确保 dataSource 始终是数组，防止 Ant Design Table 的 rawData.some 错误
  const safeExchangeRates = useMemo(() => {
    if (Array.isArray(exchangeRates)) {
      return exchangeRates;
    }
    console.warn('[ExchangeRateSync] exchangeRates 不是数组:', typeof exchangeRates, exchangeRates);
    return [];
  }, [exchangeRates]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 错误提示 */}
      {loadError && (
        <div style={{ padding: 16, backgroundColor: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
          <p style={{ color: '#d4380d', margin: 0 }}>
            <strong>错误:</strong> {loadError}
          </p>
          <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: 12 }}>
            请检查后端服务是否正常运行，或打开浏览器开发者工具查看详细错误信息
          </p>
        </div>
      )}
      
      {loading ? (
        <Card style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px', color: '#999' }}>加载中...</p>
        </Card>
      ) : (
        <>
          {/* 统计卡片 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="总汇率记录"
                value={stats?.totalRates || 0}
                prefix={<InfoCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="货币对数"
                value={stats?.currencyPairs || 0}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="数据源数"
                value={stats?.dataSourcesCount || 0}
                prefix={<DownloadOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="最后更新"
                  value={stats?.latestUpdate ? dayjs(stats.latestUpdate).format('HH:mm:ss') : '-'}
                />
              </Card>
            </Col>
          </Row>

          {/* 操作按钮 */}
          <Card>
            <Space wrap>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                loading={syncing}
                onClick={handleRefreshRates}
              >
                刷新当前汇率
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => setImportModalVisible(true)}
              >
                导入历史汇率
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                手动添加汇率
              </Button>
            </Space>
          </Card>

          {/* 汇率列表 */}
          <Card
            title="汇率数据"
            loading={loading}
          >
            <Table
              columns={columns}
              dataSource={safeExchangeRates}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => loadExchangeRates(page, selectedCurrencyPair.from, selectedCurrencyPair.to),
              }}
              scroll={{ x: 800 }}
            />
          </Card>

          {/* 添加汇率模态框 */}
          <Modal
            title="手动添加汇率"
            open={modalVisible}
            onCancel={() => {
              setModalVisible(false);
              form.resetFields();
            }}
            onOk={() => form.submit()}
            confirmLoading={syncing}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddRate}
            >
              <Form.Item
                label="源货币"
                name="fromCurrency"
                rules={[{ required: true, message: '请选择源货币' }]}
              >
                <Select placeholder="选择源货币" options={currencyOptions} />
              </Form.Item>

              <Form.Item
                label="目标货币"
                name="toCurrency"
                rules={[{ required: true, message: '请选择目标货币' }]}
              >
                <Select placeholder="选择目标货币" options={currencyOptions} />
              </Form.Item>

              <Form.Item
                label="日期"
                name="rateDate"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="汇率"
                name="rate"
                rules={[{ required: true, message: '请输入汇率' }]}
              >
                <InputNumber
                  placeholder="0.00"
                  precision={6}
                  step={0.000001}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Form>
          </Modal>

          {/* 导入历史汇率模态框 */}
          <Modal
            title="导入历史汇率"
            open={importModalVisible}
            onCancel={() => {
              setImportModalVisible(false);
              importForm.resetFields();
            }}
            onOk={() => importForm.submit()}
            confirmLoading={syncing}
            width={500}
          >
            <Form
              form={importForm}
              layout="vertical"
              onFinish={handleImportHistorical}
            >
              <Form.Item
                label="源货币"
                name="fromCurrency"
                rules={[{ required: true, message: '请选择源货币' }]}
              >
                <Select placeholder="选择源货币" options={currencyOptions} />
              </Form.Item>

              <Form.Item
                label="目标货币"
                name="toCurrency"
                rules={[{ required: true, message: '请选择目标货币' }]}
              >
                <Select placeholder="选择目标货币" options={currencyOptions} />
              </Form.Item>

              <Form.Item
                label="日期范围"
                name="dateRange"
                rules={[{ required: true, message: '请选择日期范围' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  presets={[
                    { label: '最近30天', value: [dayjs().subtract(30, 'd'), dayjs()] },
                    { label: '最近90天', value: [dayjs().subtract(90, 'd'), dayjs()] },
                    { label: '最近一年', value: [dayjs().subtract(1, 'y'), dayjs()] },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="回溯天数（若使用API）"
                name="daysBack"
                initialValue={365}
              >
                <InputNumber min={1} max={1000} />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ExchangeRateSync ErrorBoundary] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card style={{ padding: 20 }}>
          <div style={{ color: 'red' }}>
            <h3>汇率同步组件加载出错</h3>
            <p>错误信息: {this.state.error?.message}</p>
            <p>请刷新页面重试</p>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

const ExchangeRateSyncWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <ExchangeRateSync />
  </ErrorBoundary>
);

export default ExchangeRateSyncWithErrorBoundary;
