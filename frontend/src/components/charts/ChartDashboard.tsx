import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, Tabs, Space, Typography, Button, Select, DatePicker, Switch, Spin, message } from 'antd';
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
import { getPortfolioSummary, getAllPortfoliosSummary, getPortfolioHoldings, convertHoldingsToChartData, generateLiquidityData } from '../../services/portfolioApi';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// 定义数据类型
interface ChartDataType {
  portfolioData: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  returnTrendData: Array<{
    date: string;
    portfolioReturn: number;
    benchmarkReturn: number;
    cumulativeReturn: number;
  }>;
  liquidityData: Array<{
    category: string;
    amount: number;
    percentage: number;
    description: string;
  }>;
  irrData: {
    cashFlows: Array<{
      date: string;
      amount: number;
      type: string;
    }>;
    timeSeriesData: Array<{
      date: string;
      portfolioValue: number;
      cumulativeCashFlow: number;
      irr: number;
    }>;
    currentIRR: number;
    annualizedReturn: number;
  };
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    var95: number;
    var99: number;
    beta: number;
    alpha: number;
    informationRatio: number;
    calmarRatio: number;
    sortinoRatio: number;
  };
  riskTimeSeriesData: Array<{
    date: string;
    volatility: number;
    drawdown: number;
    var95: number;
    portfolioValue: number;
  }>;
}

// 生成默认的空数据结构
const getEmptyData = (): ChartDataType => ({
  portfolioData: [],
  returnTrendData: [],
  liquidityData: [],
  irrData: {
    cashFlows: [],
    timeSeriesData: [],
    currentIRR: 0,
    annualizedReturn: 0,
  },
  riskMetrics: {
    volatility: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    var95: 0,
    var99: 0,
    beta: 0,
    alpha: 0,
    informationRatio: 0,
    calmarRatio: 0,
    sortinoRatio: 0,
  },
  riskTimeSeriesData: [],
});

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
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartDataType>(getEmptyData());

  // 加载投资组合数据
  useEffect(() => {
    const loadPortfolioData = async () => {
      if (!portfolioId) {
        // 如果没有指定投资组合ID，加载所有投资组合的汇总数据
        try {
          setLoading(true);
          const summary = await getAllPortfoliosSummary();
          
          setChartData({
            portfolioData: summary.assetAllocation || [],
            returnTrendData: summary.performanceData || [],
            liquidityData: summary.liquidityDistribution || [],
            irrData: {
              cashFlows: [],
              timeSeriesData: [],
              currentIRR: 0,
              annualizedReturn: 0,
            },
            riskMetrics: summary.riskMetrics || getEmptyData().riskMetrics,
            riskTimeSeriesData: [],
          });
        } catch (error) {
          console.error('Failed to load portfolio summary:', error);
          message.error('加载投资组合数据失败');
          setChartData(getEmptyData());
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const [summary, holdings] = await Promise.all([
          getPortfolioSummary(portfolioId),
          getPortfolioHoldings(portfolioId)
        ]);

        // 转换持仓数据为图表数据
        const portfolioData = convertHoldingsToChartData(holdings);
        const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
        
        // 计算百分比
        portfolioData.forEach(item => {
          item.percentage = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
        });

        // 生成流动性分布数据
        const liquidityData = generateLiquidityData(holdings);

        setChartData({
          portfolioData,
          returnTrendData: summary.performanceData || [],
          liquidityData,
          irrData: {
            cashFlows: [],
            timeSeriesData: [],
            currentIRR: 0,
            annualizedReturn: 0,
          },
          riskMetrics: summary.riskMetrics || getEmptyData().riskMetrics,
          riskTimeSeriesData: [],
        });
      } catch (error) {
        console.error('Failed to load portfolio data:', error);
        message.error('加载投资组合数据失败');
        setChartData(getEmptyData());
      } finally {
        setLoading(false);
      }
    };

    loadPortfolioData();
  }, [portfolioId]);



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
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
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

      <Spin spinning={loading} tip="加载数据中...">
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
                  data={chartData.portfolioData}
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
                  data={chartData.returnTrendData}
                  title="收益率趋势"
                  height={chartHeight}
                  showBenchmark={showBenchmark}
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
                  data={chartData.liquidityData}
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
                  data={chartData.irrData}
                  title="IRR分析"
                  height={chartHeight}
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
                  currentMetrics={chartData.riskMetrics}
                  timeSeriesData={chartData.riskTimeSeriesData}
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
                data={chartData.portfolioData}
                title="资产配置"
                height={300}
                showLegend
              />
            </Col>
            <Col span={12}>
              <ReturnTrendChart
                data={chartData.returnTrendData}
                title="收益趋势"
                height={300}
                showBenchmark={showBenchmark}
              />
            </Col>
            <Col span={12}>
              <LiquidityDistributionChart
                data={chartData.liquidityData}
                title="流动性分布"
                height={300}
              />
            </Col>
            <Col span={12}>
              <IRRAnalysisChart
                data={chartData.irrData}
                title="IRR分析"
                height={300}
              />
            </Col>
          </Row>
        </TabPane>
        </Tabs>
      </Spin>
    </div>
  );
};

export default ChartDashboard;