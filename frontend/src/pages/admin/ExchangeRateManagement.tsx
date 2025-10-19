import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  Popconfirm,
  DatePicker,
  InputNumber,
  Tooltip,
  Badge,
  Alert,
  Divider,
  Tabs,
  Typography
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined,
  LineChartOutlined,
  DollarOutlined,
  SwapOutlined,
  RiseOutlined,
  FallOutlined,
  BellOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { 
  ExchangeRateService,
  ExchangeRate,
  ExchangeRateCreateRequest,
  ExchangeRateSearchCriteria,
  ExchangeRateStatistics,
  CurrencyInfo
} from '../../services/exchangeRateService';
import ExchangeRateHistory from '../../components/admin/ExchangeRateHistory';
import ExchangeRateBulkImporter from '../../components/admin/ExchangeRateBulkImporter';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

const ExchangeRateManagement: React.FC = () => {
  // 状态管理
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [statistics, setStatistics] = useState<ExchangeRateStatistics | null>(null);
  const [popularPairs, setPopularPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [converterVisible, setConverterVisible] = useState(false);
  const [trendVisible, setTrendVisible] = useState(false);
  const [bulkImportVisible, setBulkImportVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [form] = Form.useForm();
  const [converterForm] = Form.useForm();

  // 搜索和筛选状态
  const [searchCriteria, setSearchCriteria] = useState<ExchangeRateSearchCriteria>({
    page: 1,
    limit: 20,
    sortBy: 'rateDate',
    sortOrder: 'desc'
  });
  const [total, setTotal] = useState(0);

  // 货币转换状态
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [convertLoading, setConvertLoading] = useState(false);

  // 获取汇率列表
  const fetchExchangeRates = async () => {
    setLoading(true);
    try {
      const result = await ExchangeRateService.searchExchangeRates(searchCriteria);
      setExchangeRates(result.rates);
      setTotal(result.total);
    } catch (error) {
      message.error('获取汇率数据失败');
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStatistics = async () => {
    try {
      const stats = await ExchangeRateService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // 获取支持的货币
  const fetchCurrencies = async () => {
    try {
      const currencyList = await ExchangeRateService.getSupportedCurrencies();
      setCurrencies(currencyList);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  // 获取热门货币对
  const fetchPopularPairs = async () => {
    try {
      const pairs = await ExchangeRateService.getPopularCurrencyPairs();
      setPopularPairs(pairs);
    } catch (error) {
      console.error('Error fetching popular pairs:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchExchangeRates();
    fetchStatistics();
    fetchCurrencies();
    fetchPopularPairs();
  }, [searchCriteria]);

  // 处理搜索
  const handleSearch = (criteria: Partial<ExchangeRateSearchCriteria>) => {
    setSearchCriteria(prev => ({
      ...prev,
      ...criteria,
      page: 1
    }));
  };

  // 处理分页
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSearchCriteria(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
      sortBy: sorter.field || 'rateDate',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
    }));
  };

  // 创建汇率
  const handleCreate = () => {
    setEditingRate(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑汇率
  const handleEdit = (rate: ExchangeRate) => {
    setEditingRate(rate);
    form.setFieldsValue({
      ...rate,
      rateDate: dayjs(rate.rateDate)
    });
    setModalVisible(true);
  };

  // 删除汇率
  const handleDelete = async (id: string) => {
    try {
      await ExchangeRateService.deleteExchangeRate(id);
      message.success('汇率删除成功');
      fetchExchangeRates();
      fetchStatistics();
    } catch (error) {
      message.error('删除汇率失败');
      console.error('Error deleting exchange rate:', error);
    }
  };

  // 保存汇率
  const handleSave = async (values: any) => {
    try {
      const data: ExchangeRateCreateRequest = {
        fromCurrency: values.fromCurrency,
        toCurrency: values.toCurrency,
        rateDate: values.rateDate.format('YYYY-MM-DD'),
        rate: values.rate,
        dataSource: values.dataSource || 'manual'
      };

      if (editingRate) {
        await ExchangeRateService.updateExchangeRate(editingRate.id, data);
        message.success('汇率更新成功');
      } else {
        await ExchangeRateService.createExchangeRate(data);
        message.success('汇率创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      fetchExchangeRates();
      fetchStatistics();
      fetchPopularPairs();
    } catch (error) {
      message.error(editingRate ? '更新汇率失败' : '创建汇率失败');
      console.error('Error saving exchange rate:', error);
    }
  };

  // 货币转换
  const handleConvert = async (values: any) => {
    setConvertLoading(true);
    try {
      const result = await ExchangeRateService.convertCurrency(
        values.amount,
        values.fromCurrency,
        values.toCurrency,
        values.rateDate?.format('YYYY-MM-DD')
      );
      setConversionResult(result);
    } catch (error) {
      message.error('货币转换失败');
      console.error('Error converting currency:', error);
    } finally {
      setConvertLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchExchangeRates();
    fetchStatistics();
    fetchPopularPairs();
  };

  // 导出数据
  const handleExport = async () => {
    try {
      const blob = await ExchangeRateService.exportRates({
        ...searchCriteria,
        format: 'xlsx'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `exchange_rates_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success('数据导出成功');
    } catch (error) {
      message.error('导出失败');
      console.error('Export error:', error);
    }
  };

  // 表格列定义
  const columns: ColumnsType<ExchangeRate> = [
    {
      title: '货币对',
      key: 'currencyPair',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tag color="blue">{record.fromCurrency}</Tag>
          <SwapOutlined style={{ color: '#999' }} />
          <Tag color="green">{record.toCurrency}</Tag>
        </Space>
      ),
    },
    {
      title: '汇率',
      dataIndex: 'rate',
      key: 'rate',
      width: 120,
      sorter: true,
      render: (rate: number) => (
        <Text strong style={{ fontSize: '14px' }}>
          {rate.toFixed(6)}
        </Text>
      ),
    },
    {
      title: '日期',
      dataIndex: 'rateDate',
      key: 'rateDate',
      width: 120,
      sorter: true,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '数据源',
      dataIndex: 'dataSource',
      key: 'dataSource',
      width: 100,
      render: (source: string) => {
        const colors = { manual: 'blue', api: 'green', import: 'orange' };
        const labels = { manual: '手动', api: 'API', import: '导入' };
        return (
          <Tag color={colors[source as keyof typeof colors] || 'default'}>
            {labels[source as keyof typeof labels] || source}
          </Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这条汇率记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>汇率管理</Title>
        <Text type="secondary">管理和监控各种货币的汇率数据</Text>
      </div>

      {/* 统计卡片 */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总汇率记录"
                value={statistics.totalRates}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="货币对数量"
                value={statistics.currencyPairs}
                prefix={<SwapOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="支持货币"
                value={statistics.supportedCurrencies.length}
                prefix={<BellOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="数据源"
                value={statistics.dataSourcesCount}
                prefix={<LineChartOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 热门货币对 */}
      {popularPairs.length > 0 && (
        <Card title="热门货币对" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            {popularPairs.slice(0, 4).map((pair, index) => (
              <Col span={6} key={index}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {pair.fromCurrency}/{pair.toCurrency}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {pair.latestRate.toFixed(4)}
                    </div>
                    <div style={{ 
                      color: pair.changePercent24h >= 0 ? '#52c41a' : '#ff4d4f',
                      fontSize: '12px'
                    }}>
                      {pair.changePercent24h >= 0 ? <RiseOutlined /> : <FallOutlined />}
                      {' '}{pair.changePercent24h.toFixed(2)}%
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 搜索和操作区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Select
              placeholder="选择基础货币"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleSearch({ fromCurrency: value })}
            >
              {currencies.map(currency => (
                <Option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择目标货币"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleSearch({ toCurrency: value })}
            >
              {currencies.map(currency => (
                <Option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates) {
                  handleSearch({
                    startDate: dates[0]?.format('YYYY-MM-DD'),
                    endDate: dates[1]?.format('YYYY-MM-DD')
                  });
                } else {
                  handleSearch({ startDate: undefined, endDate: undefined });
                }
              }}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增汇率
          </Button>
          <Button icon={<SwapOutlined />} onClick={() => setConverterVisible(true)}>
            货币转换
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => setBulkImportVisible(true)}>
            批量导入
          </Button>
          <Button icon={<LineChartOutlined />} onClick={() => setHistoryVisible(true)}>
            历史记录
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出数据
          </Button>
        </Space>
      </div>

      {/* 汇率表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={exchangeRates}
          rowKey="id"
          loading={loading}
          pagination={{
            current: searchCriteria.page,
            pageSize: searchCriteria.limit,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={editingRate ? '编辑汇率' : '新增汇率'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fromCurrency"
                label="基础货币"
                rules={[{ required: true, message: '请选择基础货币' }]}
              >
                <Select placeholder="选择基础货币">
                  {currencies.map(currency => (
                    <Option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="toCurrency"
                label="目标货币"
                rules={[{ required: true, message: '请选择目标货币' }]}
              >
                <Select placeholder="选择目标货币">
                  {currencies.map(currency => (
                    <Option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="rate"
                label="汇率"
                rules={[
                  { required: true, message: '请输入汇率' },
                  { type: 'number', min: 0, message: '汇率必须大于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入汇率"
                  precision={6}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="rateDate"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="dataSource"
            label="数据源"
          >
            <Select placeholder="选择数据源" allowClear>
              <Option value="manual">手动输入</Option>
              <Option value="api">API获取</Option>
              <Option value="import">批量导入</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRate ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 货币转换模态框 */}
      <Modal
        title="货币转换"
        open={converterVisible}
        onCancel={() => setConverterVisible(false)}
        footer={null}
        destroyOnClose={true}
        width={600}
      >
        <Form
          form={converterForm}
          layout="vertical"
          onFinish={handleConvert}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="amount"
                label="金额"
                rules={[
                  { required: true, message: '请输入金额' },
                  { type: 'number', min: 0, message: '金额必须大于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入金额"
                  precision={2}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="fromCurrency"
                label="从"
                rules={[{ required: true, message: '请选择货币' }]}
              >
                <Select placeholder="选择货币">
                  {currencies.map(currency => (
                    <Option key={currency.code} value={currency.code}>
                      {currency.code}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="toCurrency"
                label="到"
                rules={[{ required: true, message: '请选择货币' }]}
              >
                <Select placeholder="选择货币">
                  {currencies.map(currency => (
                    <Option key={currency.code} value={currency.code}>
                      {currency.code}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="rateDate" label="指定日期（可选）">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={convertLoading} block>
              转换
            </Button>
          </Form.Item>
        </Form>

        {conversionResult && (
          <Alert
            message="转换结果"
            description={
              <div>
                <p>
                  <strong>{conversionResult.originalAmount.toFixed(2)} {conversionResult.fromCurrency}</strong>
                  {' = '}
                  <strong style={{ color: '#1890ff' }}>
                    {conversionResult.convertedAmount.toFixed(2)} {conversionResult.toCurrency}
                  </strong>
                </p>
                <p>
                  汇率: 1 {conversionResult.fromCurrency} = {conversionResult.rate.toFixed(6)} {conversionResult.toCurrency}
                </p>
                <p>
                  日期: {conversionResult.rateDate}
                </p>
              </div>
            }
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>

      {/* 批量导入模态框 */}
      <ExchangeRateBulkImporter
        visible={bulkImportVisible}
        onClose={() => setBulkImportVisible(false)}
        onSuccess={() => {
          handleRefresh();
          setBulkImportVisible(false);
        }}
      />

      {/* 历史记录模态框 */}
      <Modal
        title="汇率历史记录"
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose={true}
      >
        <ExchangeRateHistory visible={historyVisible} />
      </Modal>
    </div>
  );
};

export default ExchangeRateManagement;