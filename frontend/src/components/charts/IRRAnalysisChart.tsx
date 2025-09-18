import React, { useMemo } from 'react';
import { Card, Space, Typography, Tooltip, Table, Tag, Statistic, Row, Col } from 'antd';
import { InfoCircleOutlined, FundOutlined, TrendingUpOutlined, TrendingDownOutlined } from '@ant-design/icons';
import EChartsWrapper, { EChartsOption } from './EChartsWrapper';

const { Title, Text } = Typography;

export interface IRRDataPoint {
  date: string;
  cashFlow: number;
  cumulativeCashFlow: number;
  portfolioValue: number;
  irr: number;
  xirr?: number;
}

export interface IRRAnalysisData {
  portfolioName: string;
  totalInvestment: number;
  currentValue: number;
  totalReturn: number;
  irr: number;
  xirr: number;
  holdingPeriod: number; // 持有天数
  dataPoints: IRRDataPoint[];
  benchmarkIRR?: number;
}

interface IRRAnalysisChartProps {
  data: IRRAnalysisData;
  title?: string;
  height?: number;
  loading?: boolean;
  showCashFlow?: boolean;
  showComparison?: boolean;
}

const IRRAnalysisChart: React.FC<IRRAnalysisChartProps> = ({
  data,
  title = 'IRR分析',
  height = 400,
  loading = false,
  showCashFlow = true,
  showComparison = true,
}) => {
  // 计算分析指标
  const analysis = useMemo(() => {
    const { totalInvestment, currentValue, totalReturn, irr, xirr, holdingPeriod, benchmarkIRR } = data;
    
    // 年化收益率
    const annualizedReturn = Math.pow(currentValue / totalInvestment, 365 / holdingPeriod) - 1;
    
    // 与基准比较
    const outperformance = benchmarkIRR ? irr - benchmarkIRR : 0;
    
    // 风险调整后收益（简化版夏普比率）
    const volatility = calculateVolatility(data.dataPoints);
    const sharpeRatio = volatility > 0 ? (irr - 0.03) / volatility : 0; // 假设无风险利率3%
    
    // 投资效率
    const investmentEfficiency = totalReturn / totalInvestment;
    
    return {
      annualizedReturn,
      outperformance,
      sharpeRatio,
      investmentEfficiency,
      volatility,
    };
  }, [data]);

  // 计算波动率
  function calculateVolatility(dataPoints: IRRDataPoint[]): number {
    if (dataPoints.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < dataPoints.length; i++) {
      const prevValue = dataPoints[i - 1].portfolioValue;
      const currentValue = dataPoints[i].portfolioValue;
      if (prevValue > 0) {
        returns.push((currentValue - prevValue) / prevValue);
      }
    }
    
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(365); // 年化波动率
  }

  // ECharts 配置
  const option: EChartsOption = useMemo(() => {
    const dates = data.dataPoints.map(d => d.date);
    const portfolioValues = data.dataPoints.map(d => d.portfolioValue);
    const cumulativeCashFlows = data.dataPoints.map(d => d.cumulativeCashFlow);
    const irrValues = data.dataPoints.map(d => d.irr * 100);

    return {
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          const dataIndex = params[0].dataIndex;
          const dataPoint = data.dataPoints[dataIndex];
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${dataPoint.date}</div>
              <div style="margin-bottom: 4px;">组合价值: ¥${dataPoint.portfolioValue.toLocaleString()}</div>
              <div style="margin-bottom: 4px;">累计现金流: ¥${dataPoint.cumulativeCashFlow.toLocaleString()}</div>
              <div style="margin-bottom: 4px;">IRR: ${(dataPoint.irr * 100).toFixed(2)}%</div>
              ${dataPoint.xirr ? `<div style="margin-bottom: 4px;">XIRR: ${(dataPoint.xirr * 100).toFixed(2)}%</div>` : ''}
            </div>
          `;
        },
      },
      legend: {
        data: ['组合价值', '累计现金流', 'IRR'],
        top: 40,
        left: 'center',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '80px',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '金额',
          position: 'left',
          axisLabel: {
            formatter: (value: number) => {
              if (value >= 10000) {
                return `${(value / 10000).toFixed(1)}万`;
              }
              return value.toLocaleString();
            },
          },
        },
        {
          type: 'value',
          name: 'IRR (%)',
          position: 'right',
          axisLabel: {
            formatter: (value: number) => `${value.toFixed(1)}%`,
          },
        },
      ],
      series: [
        {
          name: '组合价值',
          type: 'line' as const,
          yAxisIndex: 0,
          data: portfolioValues,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: '#1890ff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ],
            },
          },
        },
        ...(showCashFlow ? [{
          name: '累计现金流',
          type: 'line' as const,
          yAxisIndex: 0,
          data: cumulativeCashFlows,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: '#52c41a',
            type: 'dashed' as const,
          },
        }] : []),
        {
          name: 'IRR',
          type: 'line' as const,
          yAxisIndex: 1,
          data: irrValues,
          smooth: true,
          symbol: 'triangle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: '#faad14',
          },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
      ],
    };
  }, [data, title, showCashFlow]);

  // 现金流表格数据
  const cashFlowTableData = useMemo(() => {
    return data.dataPoints
      .filter(point => point.cashFlow !== 0)
      .map((point, index) => ({
        key: index,
        date: point.date,
        cashFlow: point.cashFlow,
        type: point.cashFlow > 0 ? '流入' : '流出',
        cumulativeCashFlow: point.cumulativeCashFlow,
      }));
  }, [data.dataPoints]);

  const cashFlowColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '现金流',
      dataIndex: 'cashFlow',
      key: 'cashFlow',
      render: (value: number) => (
        <Text style={{ color: value > 0 ? '#52c41a' : '#ff4d4f' }}>
          {value > 0 ? '+' : ''}¥{value.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === '流入' ? 'green' : 'red'}>{type}</Tag>
      ),
    },
    {
      title: '累计现金流',
      dataIndex: 'cumulativeCashFlow',
      key: 'cumulativeCashFlow',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
  ];

  return (
    <Card
      title={
        <Space align="center">
          <FundOutlined />
          <Title level={4} style={{ margin: 0 }}>
            {title} - {data.portfolioName}
          </Title>
          <Tooltip title="内部收益率(IRR)是衡量投资项目盈利能力的重要指标">
            <InfoCircleOutlined style={{ color: '#999' }} />
          </Tooltip>
        </Space>
      }
      bodyStyle={{ padding: '16px' }}
    >
      {/* 关键指标概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="总投资"
            value={data.totalInvestment}
            formatter={(value) => `¥${Number(value).toLocaleString()}`}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="当前价值"
            value={data.currentValue}
            formatter={(value) => `¥${Number(value).toLocaleString()}`}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="IRR"
            value={data.irr * 100}
            precision={2}
            suffix="%"
            valueStyle={{ color: data.irr >= 0 ? '#3f8600' : '#cf1322' }}
            prefix={data.irr >= 0 ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="XIRR"
            value={data.xirr * 100}
            precision={2}
            suffix="%"
            valueStyle={{ color: data.xirr >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Col>
      </Row>

      {/* 图表 */}
      <EChartsWrapper
        option={option}
        style={{ height: `${height}px`, width: '100%' }}
        loading={loading}
      />
      
      {/* 分析指标 */}
      <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
        <Title level={5} style={{ marginBottom: 12 }}>分析指标</Title>
        
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Space direction="vertical" size="small">
              <Text type="secondary">年化收益率</Text>
              <Text strong style={{ color: analysis.annualizedReturn >= 0 ? '#52c41a' : '#ff4d4f' }}>
                {(analysis.annualizedReturn * 100).toFixed(2)}%
              </Text>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" size="small">
              <Text type="secondary">投资效率</Text>
              <Text strong>{analysis.investmentEfficiency.toFixed(2)}</Text>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" size="small">
              <Text type="secondary">持有天数</Text>
              <Text strong>{data.holdingPeriod}天</Text>
            </Space>
          </Col>
          
          {showComparison && data.benchmarkIRR && (
            <>
              <Col span={8}>
                <Space direction="vertical" size="small">
                  <Text type="secondary">基准IRR</Text>
                  <Text strong>{(data.benchmarkIRR * 100).toFixed(2)}%</Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical" size="small">
                  <Text type="secondary">超额收益</Text>
                  <Text strong style={{ color: analysis.outperformance >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {analysis.outperformance >= 0 ? '+' : ''}{(analysis.outperformance * 100).toFixed(2)}%
                  </Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical" size="small">
                  <Text type="secondary">夏普比率</Text>
                  <Text strong>{analysis.sharpeRatio.toFixed(2)}</Text>
                </Space>
              </Col>
            </>
          )}
          
          <Col span={8}>
            <Space direction="vertical" size="small">
              <Text type="secondary">年化波动率</Text>
              <Text strong>{(analysis.volatility * 100).toFixed(2)}%</Text>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 现金流明细 */}
      {showCashFlow && cashFlowTableData.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Title level={5} style={{ marginBottom: 12 }}>现金流明细</Title>
          <Table
            dataSource={cashFlowTableData}
            columns={cashFlowColumns}
            size="small"
            pagination={{ pageSize: 5, showSizeChanger: false }}
            scroll={{ y: 200 }}
          />
        </div>
      )}

      {/* IRR解释 */}
      <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
        <Title level={5} style={{ marginBottom: 8, color: '#389e0d' }}>IRR指标说明</Title>
        <Space direction="vertical" size="small">
          <Text>
            <strong>IRR (内部收益率)</strong>: 使净现值为零的折现率，反映投资项目的实际收益水平
          </Text>
          <Text>
            <strong>XIRR (不规则现金流IRR)</strong>: 考虑现金流发生的具体日期，更准确反映实际收益率
          </Text>
          <Text type="secondary">
            • IRR &gt; 10%: 优秀投资表现
            • IRR 5%-10%: 良好投资表现  
            • IRR 0%-5%: 一般投资表现
            • IRR &lt; 0%: 投资亏损
          </Text>
        </Space>
      </div>
    </Card>
  );
};

export default IRRAnalysisChart;