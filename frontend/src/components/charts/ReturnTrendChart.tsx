import React, { useMemo } from 'react';
import { Card, Select, Space, Typography, Tooltip, Radio } from 'antd';
import { InfoCircleOutlined, RiseOutlined } from '@ant-design/icons';
import EChartsWrapper, { EChartsOption } from './EChartsWrapper';

const { Title, Text } = Typography;
const { Option } = Select;

export interface ReturnDataPoint {
  date: string;
  portfolioReturn: number;
  benchmarkReturn?: number;
  cumulativeReturn: number;
  cumulativeBenchmark?: number;
}

interface ReturnTrendChartProps {
  data: ReturnDataPoint[];
  title?: string;
  height?: number;
  loading?: boolean;
  showBenchmark?: boolean;
  timeRange?: '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'ALL';
  onTimeRangeChange?: (range: string) => void;
  chartType?: 'line' | 'area';
  onChartTypeChange?: (type: 'line' | 'area') => void;
}

const ReturnTrendChart: React.FC<ReturnTrendChartProps> = ({
  data,
  title = '收益率趋势',
  height = 400,
  loading = false,
  showBenchmark = true,
  timeRange = '1Y',
  onTimeRangeChange,
  chartType = 'line',
  onChartTypeChange,
}) => {
  // 计算统计数据
  const statistics = useMemo(() => {
    if (data.length === 0) return null;

    const latestData = data[data.length - 1];
    const firstData = data[0];
    
    const totalReturn = latestData.cumulativeReturn;
    const totalBenchmarkReturn = latestData.cumulativeBenchmark || 0;
    const outperformance = totalReturn - totalBenchmarkReturn;
    
    // 计算波动率（标准差）
    const returns = data.map(d => d.portfolioReturn);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // 年化波动率

    // 计算最大回撤
    let maxDrawdown = 0;
    let peak = data[0].cumulativeReturn;
    for (const point of data) {
      if (point.cumulativeReturn > peak) {
        peak = point.cumulativeReturn;
      }
      const drawdown = (peak - point.cumulativeReturn) / peak * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return {
      totalReturn,
      totalBenchmarkReturn,
      outperformance,
      volatility,
      maxDrawdown,
      dataPoints: data.length,
    };
  }, [data]);

  // ECharts 配置
  const option: EChartsOption = useMemo(() => {
    const dates = data.map(d => d.date);
    const portfolioReturns = data.map(d => d.cumulativeReturn);
    const benchmarkReturns = data.map(d => d.cumulativeBenchmark || 0);

    const series: any[] = [
      {
        name: '投资组合',
        type: chartType,
        data: portfolioReturns,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 3,
          color: '#1890ff',
        },
        areaStyle: chartType === 'area' ? {
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
        } : undefined,
        emphasis: {
          focus: 'series',
        },
      },
    ];

    if (showBenchmark && data.some(d => d.cumulativeBenchmark !== undefined)) {
      series.push({
        name: '基准指数',
        type: chartType,
        data: benchmarkReturns,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: '#52c41a',
          type: 'dashed',
        },
        areaStyle: chartType === 'area' ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.2)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.02)' },
            ],
          },
        } : undefined,
        emphasis: {
          focus: 'series',
        },
      });
    }

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
          label: {
            backgroundColor: '#6a7985',
          },
        },
        formatter: (params: any) => {
          let content = `<div style="padding: 8px;"><div style="font-weight: bold; margin-bottom: 4px;">${params[0].axisValue}</div>`;
          params.forEach((param: any) => {
            const value = param.value;
            const color = param.color;
            content += `
              <div style="margin: 2px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; margin-right: 8px;"></span>
                ${param.seriesName}: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%
              </div>
            `;
          });
          content += '</div>';
          return content;
        },
      },
      legend: {
        data: series.map(s => s.name),
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
        boundaryGap: false,
        data: dates,
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `${value.toFixed(1)}%`,
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
      },
      series,
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          start: 0,
          end: 100,
          height: 30,
          bottom: 10,
        },
      ],
    };
  }, [data, title, showBenchmark, chartType]);

  // 时间范围选项
  const timeRangeOptions = [
    { value: '1M', label: '1个月' },
    { value: '3M', label: '3个月' },
    { value: '6M', label: '6个月' },
    { value: '1Y', label: '1年' },
    { value: '2Y', label: '2年' },
    { value: '5Y', label: '5年' },
    { value: 'ALL', label: '全部' },
  ];

  return (
    <Card
      title={
        <Space align="center">
          <RiseOutlined />
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          <Tooltip title="显示投资组合的收益率变化趋势">
            <InfoCircleOutlined style={{ color: '#999' }} />
          </Tooltip>
        </Space>
      }
      extra={
        <Space>
          {onChartTypeChange && (
            <Radio.Group
              value={chartType}
              onChange={(e) => onChartTypeChange(e.target.value)}
              size="small"
            >
              <Radio.Button value="line">线图</Radio.Button>
              <Radio.Button value="area">面积图</Radio.Button>
            </Radio.Group>
          )}
          {onTimeRangeChange && (
            <Select
              value={timeRange}
              onChange={onTimeRangeChange}
              style={{ width: 80 }}
              size="small"
            >
              {timeRangeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          )}
        </Space>
      }
      bodyStyle={{ padding: '16px' }}
    >
      <EChartsWrapper
        option={option}
        style={{ height: `${height}px`, width: '100%' }}
        loading={loading}
      />
      
      {/* 统计信息 */}
      {statistics && (
        <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
          <Space size="large" wrap>
            <div>
              <Text type="secondary">总收益率</Text>
              <br />
              <Text strong style={{ color: statistics.totalReturn >= 0 ? '#52c41a' : '#ff4d4f' }}>
                {statistics.totalReturn >= 0 ? '+' : ''}{statistics.totalReturn.toFixed(2)}%
              </Text>
            </div>
            {showBenchmark && (
              <div>
                <Text type="secondary">基准收益率</Text>
                <br />
                <Text strong style={{ color: statistics.totalBenchmarkReturn >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  {statistics.totalBenchmarkReturn >= 0 ? '+' : ''}{statistics.totalBenchmarkReturn.toFixed(2)}%
                </Text>
              </div>
            )}
            <div>
              <Text type="secondary">超额收益</Text>
              <br />
              <Text strong style={{ color: statistics.outperformance >= 0 ? '#52c41a' : '#ff4d4f' }}>
                {statistics.outperformance >= 0 ? '+' : ''}{statistics.outperformance.toFixed(2)}%
              </Text>
            </div>
            <div>
              <Text type="secondary">年化波动率</Text>
              <br />
              <Text strong>{statistics.volatility.toFixed(2)}%</Text>
            </div>
            <div>
              <Text type="secondary">最大回撤</Text>
              <br />
              <Text strong style={{ color: '#ff4d4f' }}>
                -{statistics.maxDrawdown.toFixed(2)}%
              </Text>
            </div>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default ReturnTrendChart;