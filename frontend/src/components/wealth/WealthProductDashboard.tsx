import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Progress,
  Badge,
  Tooltip,
  Select,
  Tabs,
  Empty,
  Spin,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  notification
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PercentageOutlined,
  LineChartOutlined,
  PieChartOutlined,
  HistoryOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// ============================================
// 类型定义
// ============================================

interface WealthProduct {
  assetId: string;
  name: string;
  type: string;
  subtype: 'DIVIDEND' | 'NAV';
  issuer: string;
  expectedReturn: number;
  totalInvestment: number;
  dividendsReceived: number;
  currentValue: number;
  transactionCount: number;
  lastTransactionDate: string;
}

interface ComparisonResult {
  productType: 'DIVIDEND' | 'NAV';
  status: 'NORMAL' | 'WARNING' | 'ALERT';
  deviationRatio: number;
  deviationPercentage: string;
  recommendation: string;
  alert: boolean;
  totalDividends?: number;
  expectedReturn?: number;
  actualReturn?: number;
  gainAmount?: number;
  gainPercentage?: number;
  gainRate?: number;
}

interface TrendData {
  date: string;
  nav: string;
  dailyReturn: string;
  cumulativeReturn: string;
}

interface DeviationAnalysis {
  level: 'NORMAL' | 'WARNING' | 'ALERT';
  threshold: string;
  reasons: string[];
  recommendation: string;
  trend: number[];
  trendSummary: string;
}

// ============================================
// 颜色配置
// ============================================

const STATUS_COLORS = {
  NORMAL: '#52c41a',
  WARNING: '#faad14',
  ALERT: '#ff4d4f'
};

const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'];

// ============================================
// 主组件
// ============================================

export const WealthProductDashboard: React.FC<{ userId?: string }> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<WealthProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<WealthProduct | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [analysis, setAnalysis] = useState<DeviationAnalysis | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'DIVIDEND' | 'NAV'>('all');
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [transactionForm] = Form.useForm();

  // 获取产品汇总
  useEffect(() => {
    if (userId) {
      fetchProductSummary();
    }
  }, [userId, productTypeFilter]);

  const fetchProductSummary = async () => {
    try {
      setLoading(true);
      const params = productTypeFilter !== 'all' ? { productSubtype: productTypeFilter } : {};
      const response = await axios.get(`/api/wealth/users/${userId}/summary`, { params });
      
      if (response.data.success) {
        setSummary(response.data.data.summary);
        setProducts(response.data.data.summary.products);
        
        // 如果有产品，默认选择第一个
        if (response.data.data.summary.products.length > 0) {
          setSelectedProduct(response.data.data.summary.products[0]);
        }
      }
    } catch (error: any) {
      message.error('获取财富产品信息失败');
      console.error('Error fetching product summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = async (product: WealthProduct) => {
    setSelectedProduct(product);
    await Promise.all([
      fetchComparison(product),
      fetchTrendData(product.assetId),
      fetchAnalysis(product.assetId)
    ]);
  };

  const fetchComparison = async (product: WealthProduct) => {
    try {
      const endpoint = product.subtype === 'DIVIDEND' 
        ? `/api/wealth/dividend/${product.assetId}/comparison`
        : `/api/wealth/nav/${product.assetId}/comparison`;

      const payload = product.subtype === 'DIVIDEND'
        ? {
            investment: product.totalInvestment,
            expectedReturn: product.expectedReturn,
            startDate: new Date(product.lastTransactionDate).toISOString().split('T')[0]
          }
        : {
            investment: product.totalInvestment,
            purchaseNav: product.totalInvestment / (product.totalInvestment / product.expectedReturn),
            expectedAnnualReturn: product.expectedReturn,
            holdingDays: Math.floor((Date.now() - new Date(product.lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24))
          };

      const response = await axios.post(endpoint, payload);
      if (response.data.success) {
        setComparison(response.data.data.analysis || response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching comparison:', error);
    }
  };

  const fetchTrendData = async (assetId: string) => {
    try {
      const response = await axios.get(`/api/wealth/${assetId}/trend`, {
        params: { days: 30, groupBy: 'daily' }
      });
      
      if (response.data.success) {
        setTrendData(response.data.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching trend data:', error);
    }
  };

  const fetchAnalysis = async (assetId: string) => {
    try {
      const response = await axios.get(`/api/wealth/${assetId}/analysis`);
      
      if (response.data.success) {
        setAnalysis(response.data.data.analysis);
      }
    } catch (error: any) {
      console.error('Error fetching analysis:', error);
    }
  };

  const handleRecordTransaction = async (values: any) => {
    try {
      if (!selectedProduct) {
        message.error('请先选择产品');
        return;
      }

      const response = await axios.post('/api/wealth/transaction', {
        assetId: selectedProduct.assetId,
        type: values.type,
        date: values.date.toISOString(),
        amount: values.amount,
        quantity: values.quantity,
        navPerShare: values.navPerShare,
        dividendRate: values.dividendRate,
        feeAmount: values.feeAmount,
        feeDescription: values.feeDescription,
        notes: values.notes
      });

      if (response.data.success) {
        message.success('交易记录成功');
        transactionForm.resetFields();
        setTransactionModalVisible(false);
        await fetchProductSummary();
      }
    } catch (error: any) {
      message.error('记录交易失败');
      console.error('Error recording transaction:', error);
    }
  };

  // ============================================
  // 渲染函数
  // ============================================

  const renderSummaryCards = () => {
    if (!summary) return null;

    const totalInvestment = summary.products.reduce((sum: number, p: any) => sum + p.totalInvestment, 0);
    const totalCurrentValue = summary.products.reduce((sum: number, p: any) => sum + p.currentValue, 0);
    const totalDividends = summary.products.reduce((sum: number, p: any) => sum + p.dividendsReceived, 0);
    const totalGain = totalCurrentValue - totalInvestment + totalDividends;
    const gainRate = totalInvestment > 0 ? ((totalGain / totalInvestment) * 100).toFixed(2) : '0.00';

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="累计投资"
              value={totalInvestment}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => `¥${(value as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="当前资产"
              value={totalCurrentValue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: totalCurrentValue >= totalInvestment ? '#52c41a' : '#ff4d4f' }}
              formatter={(value) => `¥${(value as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="累计分红"
              value={totalDividends}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `¥${(value as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总收益率"
              value={parseFloat(gainRate)}
              prefix={totalGain >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix="%"
              valueStyle={{ color: totalGain >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderProductsTable = () => {
    const columns: ColumnsType<WealthProduct> = [
      {
        title: '产品名称',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <Button 
            type="link"
            onClick={() => handleProductSelect(record)}
            style={{ padding: 0 }}
          >
            {text}
          </Button>
        )
      },
      {
        title: '类型',
        dataIndex: 'subtype',
        key: 'subtype',
        render: (subtype) => (
          <Tag color={subtype === 'DIVIDEND' ? 'green' : 'blue'}>
            {subtype === 'DIVIDEND' ? '分红型' : '净值型'}
          </Tag>
        )
      },
      {
        title: '发行机构',
        dataIndex: 'issuer',
        key: 'issuer'
      },
      {
        title: '投资金额',
        dataIndex: 'totalInvestment',
        key: 'totalInvestment',
        align: 'right' as const,
        render: (value) => `¥${value.toLocaleString()}`
      },
      {
        title: '当前价值',
        dataIndex: 'currentValue',
        key: 'currentValue',
        align: 'right' as const,
        render: (value, record) => {
          const gain = value - record.totalInvestment;
          return (
            <Space size="small">
              <span>¥{value.toLocaleString()}</span>
              <Tag color={gain >= 0 ? 'green' : 'red'}>
                {gain >= 0 ? '+' : ''}{gain.toLocaleString()}
              </Tag>
            </Space>
          );
        }
      },
      {
        title: '预期收益率',
        dataIndex: 'expectedReturn',
        key: 'expectedReturn',
        align: 'right' as const,
        render: (value) => `${value.toFixed(2)}%`
      }
    ];

    return (
      <Table
        dataSource={products}
        columns={columns}
        rowKey="assetId"
        pagination={{ pageSize: 10 }}
        loading={loading}
      />
    );
  };

  const renderComparisonAnalysis = () => {
    if (!selectedProduct || !comparison) {
      return <Empty description="选择产品后查看对比分析" />;
    }

    const statusConfig = {
      NORMAL: { color: '#52c41a', text: '正常' },
      WARNING: { color: '#faad14', text: '预警' },
      ALERT: { color: '#ff4d4f', text: '告警' }
    };

    const config = statusConfig[comparison.status] || statusConfig.NORMAL;

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="收益对比">
            <Row gutter={[16, 16]}>
              {selectedProduct.subtype === 'DIVIDEND' ? (
                <>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="累计分红"
                      value={comparison.totalDividends || 0}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="预期收益"
                      value={comparison.expectedReturn || 0}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </>
              ) : (
                <>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="实际收益"
                      value={comparison.gainAmount || 0}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="收益率"
                      value={comparison.gainPercentage || 0}
                      suffix="%"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </>
              )}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="偏差分析" 
                extra={<Badge color={config.color} text={config.text} />}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Progress
                  type="circle"
                  percent={Math.min(Math.abs(comparison.deviationRatio), 100)}
                  strokeColor={config.color}
                  format={() => `${comparison.deviationPercentage}%`}
                  width={80}
                />
              </Col>
              <Col xs={24}>
                <Paragraph>{comparison.recommendation}</Paragraph>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderTrendChart = () => {
    if (!trendData || trendData.length === 0) {
      return <Empty description="暂无趋势数据" />;
    }

    const chartData = trendData.map((d: any) => ({
      date: dayjs(d.date).format('MM-DD'),
      nav: parseFloat(d.nav),
      dailyReturn: parseFloat(d.dailyReturn),
      cumulativeReturn: parseFloat(d.cumulativeReturn)
    }));

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="净值走势 (30天)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value) => value.toFixed(4)}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="nav" 
                  stroke="#1890ff" 
                  name="净值"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="日收益率 (30天)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip formatter={(value) => `${(value as number).toFixed(2)}%`} />
                <Legend />
                <Bar 
                  dataKey="dailyReturn" 
                  fill="#52c41a" 
                  name="日收益率"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderDeviationAnalysis = () => {
    if (!analysis) {
      return <Empty description="暂无偏差分析数据" />;
    }

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="偏差分析报告">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="告警级别"
                  value={analysis.level}
                  valueStyle={{ 
                    color: STATUS_COLORS[analysis.level] 
                  }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="告警阈值"
                  value={analysis.threshold}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="趋势"
                  value={analysis.trendSummary}
                />
              </Col>
            </Row>

            {analysis.reasons.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>可能原因</Title>
                {analysis.reasons.map((reason, index) => (
                  <Alert
                    key={index}
                    message={reason}
                    type={analysis.level === 'NORMAL' ? 'success' : analysis.level === 'WARNING' ? 'warning' : 'error'}
                    style={{ marginBottom: 8 }}
                  />
                ))}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Title level={5}>建议</Title>
              <Alert
                message={analysis.recommendation}
                type={analysis.level === 'NORMAL' ? 'success' : analysis.level === 'WARNING' ? 'warning' : 'error'}
              />
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Title level={2}>财富产品管理</Title>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
          <Space>
            <Select
              placeholder="筛选产品类型"
              value={productTypeFilter}
              onChange={setProductTypeFilter}
              options={[
                { label: '全部', value: 'all' },
                { label: '分红型', value: 'DIVIDEND' },
                { label: '净值型', value: 'NAV' }
              ]}
              style={{ width: 150 }}
            />
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={fetchProductSummary}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setTransactionModalVisible(true)}
            >
              记录交易
            </Button>
          </Space>
        </Col>
      </Row>

      <Spin spinning={loading}>
        {renderSummaryCards()}

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginTop: 24 }}
          items={[
            {
              key: 'summary',
              label: '产品概览',
              children: renderProductsTable()
            },
            {
              key: 'comparison',
              label: '收益对比',
              children: renderComparisonAnalysis()
            },
            {
              key: 'trend',
              label: '趋势分析',
              children: renderTrendChart()
            },
            {
              key: 'analysis',
              label: '偏差分析',
              children: renderDeviationAnalysis()
            }
          ]}
        />
      </Spin>

      {/* 记录交易Modal */}
      <Modal
        title="记录交易"
        open={transactionModalVisible}
        onCancel={() => setTransactionModalVisible(false)}
        onOk={() => transactionForm.submit()}
      >
        <Form
          form={transactionForm}
          layout="vertical"
          onFinish={handleRecordTransaction}
        >
          <Form.Item
            name="type"
            label="交易类型"
            rules={[{ required: true, message: '请选择交易类型' }]}
          >
            <Select
              options={[
                { label: '购买', value: 'PURCHASE' },
                { label: '赎回', value: 'REDEMPTION' },
                { label: '分红', value: 'DIVIDEND' },
                { label: '费用', value: 'FEE' },
                { label: '调整', value: 'ADJUSTMENT' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="date"
            label="交易日期"
            rules={[{ required: true, message: '请选择交易日期' }]}
          >
            <DatePicker />
          </Form.Item>

          <Form.Item
            name="amount"
            label="交易金额"
            rules={[{ required: true, message: '请输入交易金额' }]}
          >
            <InputNumber prefix="¥" />
          </Form.Item>

          <Form.Item name="quantity" label="份额数">
            <InputNumber />
          </Form.Item>

          <Form.Item name="navPerShare" label="单位净值">
            <InputNumber />
          </Form.Item>

          <Form.Item name="dividendRate" label="分红率 (%)">
            <InputNumber />
          </Form.Item>

          <Form.Item name="feeAmount" label="费用金额">
            <InputNumber prefix="¥" />
          </Form.Item>

          <Form.Item name="feeDescription" label="费用说明">
            <Input placeholder="如：管理费、托管费等" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WealthProductDashboard;
