import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Tabs, Space, Typography, Button, Select, DatePicker, Switch } from 'antd';
import { 
  PieChartOutlined, 
  LineChartOutlined, 
  BarChartOutlined,
  DashboardOutlined,
  RiseOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import PortfolioPieChart from './PortfolioPieChart';
import ReturnTrendChart from './ReturnTrendChart';
import LiquidityDistributionChart from './LiquidityDistributionChart';
import IRRAnalysisChart from './IRRAnalysisChart';
import RiskMetricsChart from './RiskMetricsChart';
import InteractiveChartWrapper from './InteractiveChartWrapper';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// 模拟数据生成函数
const generateMockData = () => {
  // 投资组合数据
  const portfolioData = [
    { name: '股票', value: 450000, percentage: 45, color: '#1890ff' },
    { name: '债券', value: 300000, percentage: 30, color: '#52c41a' },
    { name: '基金', value: 150000, percentage: 15, color: '#faad14' },
    { name: '现金', value: 100000, percentage: 10, color: '#722ed1' },
  ];

  // 收益率趋势数据
  const returnTrendData = Array.from({ length: 30 }, (_, i) => {
    const date = dayjs().subtract(29 - i, 'day').format('YYYY-MM-DD');
    const portfolioReturn = Math.random() * 0.1 - 0.05 + Math.sin(i / 5) * 0.02;
    const benchmarkReturn = Math.random() * 0.08 - 0.04 + Math.sin(i / 5) * 0.015;
    return {
      date,
      portfolioReturn,
      benchmarkReturn,
      cumulativeReturn: portfolioReturn * (i + 1) * 0.1,
    };
  });

  // 流动性分布数据
  const liquidityData = [
    { category: '高流动性', amount: 550000, percentage: 55, description: '可在1天内变现' },
    { category: '中等流动性', amount: 300000, percentage: 30, description: '可在1周内变现' },
    { category: '低流动性', amount: 150000, percentage: 15, description: '需要1个月以上变现' },
  ];

  // IRR分析数据
  const irrData = {
    cashFlows: [
      { date: '2024-01-01', amount: -100000, type: 'investment' },
      { date: '2024-03-01', amount: -50000, type: 'investment' },
      { date: '2024-06-01', amount: 10000, type: 'dividend' },
      { date: '2024-09-01', amount: 15000, type: 'dividend' },
      { date: '2024-12-01', amount: 180000, type: 'redemption' },
    ],
    timeSeriesData: Array.from({ length: 12 }, (_, i) => {
      const date = dayjs().subtract(11 - i, 'month').format('YYYY-MM-DD');
      return {
        date,
        portfolioValue: 100000 + i * 8000 + Math.random() * 10000,
        cumulativeCashFlow: -150000 + i * 5000,
        irr: 0.08 + Math.random() * 0.04,
      };
    }),
    currentIRR: 0.125,
    annualizedReturn: 0.115,
  };

  // 风险指标数据
  const riskMetrics = {
    volatility: 0.18,
    sharpeRatio: 1.25,
    maxDrawdown: 0.08,
    var95: -0.035,
    var99: -0.055,
    beta: 1.15,
    alpha: 0.025,
    informationRatio: 0.85,
    calmarRatio: 1.56,
    sortinoRatio: 1.78,
  };

  const riskTimeSeriesData = Array.from({ length: 30 }, (_, i) => {
    const date = dayjs().subtract(29 - i, 'day').format('YYYY-MM-DD');
    return {
      date,
      volatility: 0.15 + Math.random() * 0.1,
      drawdown: Math.random() * 0.1,
      var95: -0.02 - Math.random() * 0.03,
      portfolioValue: 1000000 + i * 1000 + Math.random() * 10000,
    };
  });

  return {
    portfolioData,
    returnTrendData,
    liquidityData,
    irrData,
    riskMetrics,
    riskTimeSeriesData,
  };
};

interface ChartDashboardProps {
  portfolioId?: string;
  showControls?: boolean;
  defaultTab?: string;
}

const ChartDashboard: React.FC<ChartDashboardProps> = ({
  portfolioId,
  showControls = true,
  defaultTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [timeFrame, setTimeFrame] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [chartHeight, setChartHeight] = useState(400);

  // 生成模拟数据
  const mockData = useMemo(() => generateMockData(), [portfolioId]);

  // 控制面板
  const controlPanel = useMemo(() => {
    if (!showControls) return null;

    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Space>
            <Text strong>时间范围:</Text>
            <Select
              value={timeFrame}
              onChange={setTimeFrame}
              style={{ width: 80 }}
              options={[
                { label: '1月', value: '1M' },
                { label: '3月', value: '3M' },
                { label: '6月', value: '6M' },
                { label: '1年', value: '1Y' },
                { label: '全部', value: 'ALL' },
              ]}
            />
          </Space>

          <Space>
            <Text strong>自定义日期:</Text>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates)}
              format="YYYY-MM-DD"
            />
          </Space>

          <Space>
            <Text strong>显示基准:</Text>
            <Switch
              checked={showBenchmark}
              onChange={setShowBenchmark}
              size="small"
            />
          </Space>

          <Space>
            <Text strong>图表高度:</Text>
            <Select
              value={chartHeight}
              onChange={setChartHeight}
              style={{ width: 80 }}
              options={[
                { label: '300px', value: 300 },
                { label: '400px', value: 400 },
                { label: '500px', value: 500 },
                { label: '600px', value: 600 },
              ]}
            />
          </Space>
        </Space>
      </Card>
    );
  }, [showControls, timeFrame, dateRange, showBenchmark, chartHeight]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>
          <DashboardOutlined style={{ marginRight: 8 }} />
          投资组合可视化分析
        </Title>
        <Text type="secondary">
          全面的投资组合图表分析，包括资产配置、收益趋势、风险指标等多维度可视化
        </Text>
      </div>

      {controlPanel}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="large"
      >
        <TabPane
          tab={
            <Space>
              <PieChartOutlined />
              <span>资产配置</span>
            </Space>
          }
          key="allocation"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <InteractiveChartWrapper
                title="投资组合资产配置"
                option={{}}
                height={chartHeight}
                description="显示投资组合中各类资产的分布情况"
                showExport
                showFullscreen
                showRefresh
              >
                <PortfolioPieChart
                  data={mockData.portfolioData}
                  title="资产配置分布"
                  height={chartHeight}
                  showLegend
                  showLabels
                />
              </InteractiveChartWrapper>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <LineChartOutlined />
              <span>收益趋势</span>
            </Space>
          }
          key="returns"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <InteractiveChartWrapper
                title="收益率趋势分析"
                option={{}}
                height={chartHeight}
                description="显示投资组合收益率的历史趋势和与基准的对比"
                showExport
                showFullscreen
                showRefresh
              >
                <ReturnTrendChart
                  data={mockData.returnTrendData}
                  title="收益率趋势"
                  height={chartHeight}
                  showBenchmark={showBenchmark}
                  showCumulative
                />
              </InteractiveChartWrapper>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <BarChartOutlined />
              <span>流动性分析</span>
            </Space>
          }
          key="liquidity"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <InteractiveChartWrapper
                title="流动性分布分析"
                option={{}}
                height={chartHeight}
                description="显示投资组合中各资产的流动性分布情况"
                showExport
                showFullscreen
                showRefresh
              >
                <LiquidityDistributionChart
                  data={mockData.liquidityData}
                  title="流动性分布"
                  height={chartHeight}
                  showDetails
                />
              </InteractiveChartWrapper>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <RiseOutlined />
              <span>IRR分析</span>
            </Space>
          }
          key="irr"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <InteractiveChartWrapper
                title="内部收益率分析"
                option={{}}
                height={chartHeight}
                description="显示投资组合的IRR分析和现金流情况"
                showExport
                showFullscreen
                showRefresh
              >
                <IRRAnalysisChart
                  cashFlows={mockData.irrData.cashFlows}
                  timeSeriesData={mockData.irrData.timeSeriesData}
                  currentIRR={mockData.irrData.currentIRR}
                  annualizedReturn={mockData.irrData.annualizedReturn}
                  title="IRR分析"
                  height={chartHeight}
                  showCashFlow
                />
              </InteractiveChartWrapper>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <SafetyCertificateOutlined />
              <span>风险分析</span>
            </Space>
          }
          key="risk"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <InteractiveChartWrapper
                title="风险指标分析"
                option={{}}
                height={chartHeight}
                description="显示投资组合的各项风险指标和风险水平评估"
                showExport
                showFullscreen
                showRefresh
              >
                <RiskMetricsChart
                  currentMetrics={mockData.riskMetrics}
                  timeSeriesData={mockData.riskTimeSeriesData}
                  title="风险指标"
                  height={chartHeight}
                  showComparison={showBenchmark}
                />
              </InteractiveChartWrapper>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <DashboardOutlined />
              <span>综合概览</span>
            </Space>
          }
          key="overview"
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <PortfolioPieChart
                data={mockData.portfolioData}
                title="资产配置"
                height={300}
                showLegend
              />
            </Col>
            <Col span={12}>
              <ReturnTrendChart
                data={mockData.returnTrendData}
                title="收益趋势"
                height={300}
                showBenchmark={showBenchmark}
              />
            </Col>
            <Col span={12}>
              <LiquidityDistributionChart
                data={mockData.liquidityData}
                title="流动性分布"
                height={300}
              />
            </Col>
            <Col span={12}>
              <IRRAnalysisChart
                cashFlows={mockData.irrData.cashFlows}
                timeSeriesData={mockData.irrData.timeSeriesData}
                currentIRR={mockData.irrData.currentIRR}
                annualizedReturn={mockData.irrData.annualizedReturn}
                title="IRR分析"
                height={300}
              />
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ChartDashboard;