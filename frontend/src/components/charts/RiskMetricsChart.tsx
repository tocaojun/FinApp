import React, { useMemo } from 'react';
import { Card, Space, Typography, Tooltip, Progress, Alert, Row, Col, Statistic } from 'antd';
import { InfoCircleOutlined, ExclamationCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import EChartsWrapper, { EChartsOption } from './EChartsWrapper';

const { Title, Text } = Typography;

export interface RiskMetrics {
  volatility: number; // 波动率
  sharpeRatio: number; // 夏普比率
  maxDrawdown: number; // 最大回撤
  var95: number; // 95% VaR
  var99: number; // 99% VaR
  beta: number; // 贝塔系数
  alpha: number; // 阿尔法系数
  informationRatio: number; // 信息比率
  calmarRatio: number; // 卡尔玛比率
  sortinoRatio: number; // 索提诺比率
}

export interface RiskTimeSeriesData {
  date: string;
  volatility: number;
  drawdown: number;
  var95: number;
  portfolioValue: number;
}

interface RiskMetricsChartProps {
  currentMetrics: RiskMetrics;
  timeSeriesData: RiskTimeSeriesData[];
  benchmarkMetrics?: RiskMetrics;
  title?: string;
  height?: number;
  loading?: boolean;
  showComparison?: boolean;
}

const RiskMetricsChart: React.FC<RiskMetricsChartProps> = ({
  currentMetrics,
  timeSeriesData,
  benchmarkMetrics,
  title = '风险指标分析',
  height = 400,
  loading = false,
  showComparison = true,
}) => {
  // 风险等级评估
  const riskAssessment = useMemo(() => {
    const { volatility, maxDrawdown, sharpeRatio, var95 } = currentMetrics;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    let riskScore = 0;
    
    // 波动率评分 (0-30分)
    if (volatility < 0.1) riskScore += 30;
    else if (volatility < 0.2) riskScore += 20;
    else if (volatility < 0.3) riskScore += 10;
    else riskScore += 0;
    
    // 最大回撤评分 (0-25分)
    if (maxDrawdown < 0.05) riskScore += 25;
    else if (maxDrawdown < 0.1) riskScore += 20;
    else if (maxDrawdown < 0.2) riskScore += 10;
    else riskScore += 0;
    
    // 夏普比率评分 (0-25分)
    if (sharpeRatio > 2) riskScore += 25;
    else if (sharpeRatio > 1) riskScore += 20;
    else if (sharpeRatio > 0.5) riskScore += 10;
    else riskScore += 0;
    
    // VaR评分 (0-20分)
    if (Math.abs(var95) < 0.02) riskScore += 20;
    else if (Math.abs(var95) < 0.05) riskScore += 15;
    else if (Math.abs(var95) < 0.1) riskScore += 10;
    else riskScore += 0;
    
    if (riskScore >= 70) riskLevel = 'low';
    else if (riskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'high';
    
    return { riskLevel, riskScore };
  }, [currentMetrics]);

  // 风险配置
  const riskConfig = {
    low: { color: '#52c41a', label: '低风险', description: '风险控制良好' },
    medium: { color: '#faad14', label: '中等风险', description: '风险适中' },
    high: { color: '#ff4d4f', label: '高风险', description: '需要关注风险' },
  };

  // ECharts 配置 - 雷达图显示风险指标
  const radarOption: EChartsOption = useMemo(() => {
    const indicators = [
      { name: '夏普比率', max: 3, min: -1 },
      { name: '信息比率', max: 2, min: -1 },
      { name: '卡尔玛比率', max: 2, min: -1 },
      { name: '索提诺比率', max: 3, min: -1 },
      { name: '阿尔法', max: 0.2, min: -0.2 },
      { name: '贝塔', max: 2, min: 0 },
    ];

    const portfolioData = [
      Math.max(-1, Math.min(3, currentMetrics.sharpeRatio)),
      Math.max(-1, Math.min(2, currentMetrics.informationRatio)),
      Math.max(-1, Math.min(2, currentMetrics.calmarRatio)),
      Math.max(-1, Math.min(3, currentMetrics.sortinoRatio)),
      Math.max(-0.2, Math.min(0.2, currentMetrics.alpha)),
      Math.max(0, Math.min(2, currentMetrics.beta)),
    ];

    const series: any[] = [
      {
        name: '投资组合',
        type: 'radar',
        data: [
          {
            value: portfolioData,
            name: '投资组合',
            itemStyle: {
              color: '#1890ff',
            },
            areaStyle: {
              color: 'rgba(24, 144, 255, 0.3)',
            },
          },
        ],
      },
    ];

    if (showComparison && benchmarkMetrics) {
      const benchmarkData = [
        Math.max(-1, Math.min(3, benchmarkMetrics.sharpeRatio)),
        Math.max(-1, Math.min(2, benchmarkMetrics.informationRatio)),
        Math.max(-1, Math.min(2, benchmarkMetrics.calmarRatio)),
        Math.max(-1, Math.min(3, benchmarkMetrics.sortinoRatio)),
        Math.max(-0.2, Math.min(0.2, benchmarkMetrics.alpha)),
        Math.max(0, Math.min(2, benchmarkMetrics.beta)),
      ];

      series[0].data.push({
        value: benchmarkData,
        name: '基准',
        itemStyle: {
          color: '#52c41a',
        },
        areaStyle: {
          color: 'rgba(82, 196, 26, 0.2)',
        },
      });
    }

    return {
      title: {
        text: '风险指标雷达图',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const indicators = ['夏普比率', '信息比率', '卡尔玛比率', '索提诺比率', '阿尔法', '贝塔'];
          let content = `<div style="padding: 8px;"><div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>`;
          params.value.forEach((value: number, index: number) => {
            content += `<div>${indicators[index]}: ${value.toFixed(3)}</div>`;
          });
          content += '</div>';
          return content;
        },
      },
      legend: {
        data: showComparison && benchmarkMetrics ? ['投资组合', '基准'] : ['投资组合'],
        top: 30,
        left: 'center',
      },
      radar: {
        indicator: indicators,
        center: ['50%', '60%'],
        radius: '60%',
        splitNumber: 4,
        axisName: {
          fontSize: 12,
        },
      },
      series,
    };
  }, [currentMetrics, benchmarkMetrics, showComparison]);

  // 时间序列图表配置
  const timeSeriesOption: EChartsOption = useMemo(() => {
    const dates = timeSeriesData.map(d => d.date);
    const volatilities = timeSeriesData.map(d => d.volatility * 100);
    const drawdowns = timeSeriesData.map(d => Math.abs(d.drawdown) * 100);
    const vars = timeSeriesData.map(d => Math.abs(d.var95) * 100);

    return {
      title: {
        text: '风险指标时间序列',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          let content = `<div style="padding: 8px;"><div style="font-weight: bold; margin-bottom: 4px;">${params[0].axisValue}</div>`;
          params.forEach((param: any) => {
            content += `<div style="margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; margin-right: 8px;"></span>
              ${param.seriesName}: ${param.value.toFixed(2)}%
            </div>`;
          });
          content += '</div>';
          return content;
        },
      },
      legend: {
        data: ['波动率', '回撤', 'VaR(95%)'],
        top: 30,
        left: 'center',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '60px',
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
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `${value.toFixed(1)}%`,
        },
      },
      series: [
        {
          name: '波动率',
          type: 'line',
          data: volatilities,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2,
            color: '#1890ff',
          },
        },
        {
          name: '回撤',
          type: 'line',
          data: drawdowns,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2,
            color: '#ff4d4f',
          },
        },
        {
          name: 'VaR(95%)',
          type: 'line',
          data: vars,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2,
            color: '#faad14',
          },
        },
      ],
    };
  }, [timeSeriesData]);

  return (
    <Card
      title={
        <Space align="center">
          <SafetyCertificateOutlined />
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          <Tooltip title="显示投资组合的各项风险指标和风险水平评估">
            <InfoCircleOutlined style={{ color: '#999' }} />
          </Tooltip>
        </Space>
      }
      bodyStyle={{ padding: '16px' }}
    >
      {/* 风险等级评估 */}
      <Alert
        message={
          <Space>
            <ExclamationCircleOutlined />
            <Text strong>
              风险等级: {riskConfig[riskAssessment.riskLevel].label}
            </Text>
            <Text type="secondary">
              ({riskConfig[riskAssessment.riskLevel].description})
            </Text>
          </Space>
        }
        type={riskAssessment.riskLevel === 'low' ? 'success' : riskAssessment.riskLevel === 'medium' ? 'warning' : 'error'}
        showIcon
        style={{ marginBottom: 16 }}
        action={
          <Text strong style={{ color: riskConfig[riskAssessment.riskLevel].color }}>
            风险评分: {riskAssessment.riskScore}/100
          </Text>
        }
      />

      {/* 关键风险指标 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="波动率"
            value={currentMetrics.volatility * 100}
            precision={2}
            suffix="%"
            valueStyle={{ color: currentMetrics.volatility > 0.2 ? '#ff4d4f' : '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="最大回撤"
            value={currentMetrics.maxDrawdown * 100}
            precision={2}
            suffix="%"
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="夏普比率"
            value={currentMetrics.sharpeRatio}
            precision={3}
            valueStyle={{ color: currentMetrics.sharpeRatio > 1 ? '#52c41a' : '#faad14' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="VaR(95%)"
            value={Math.abs(currentMetrics.var95) * 100}
            precision={2}
            suffix="%"
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16}>
        <Col span={12}>
          <EChartsWrapper
            option={radarOption}
            style={{ height: `${height}px`, width: '100%' }}
            loading={loading}
          />
        </Col>
        <Col span={12}>
          <EChartsWrapper
            option={timeSeriesOption}
            style={{ height: `${height}px`, width: '100%' }}
            loading={loading}
          />
        </Col>
      </Row>

      {/* 详细风险指标 */}
      <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
        <Title level={5} style={{ marginBottom: 12 }}>详细风险指标</Title>
        
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">贝塔系数</Text>
                <Text strong>{currentMetrics.beta.toFixed(3)}</Text>
              </div>
              <Progress
                percent={Math.min(100, (currentMetrics.beta / 2) * 100)}
                strokeColor={currentMetrics.beta > 1.2 ? '#ff4d4f' : '#52c41a'}
                showInfo={false}
                size="small"
              />
            </Space>
          </Col>
          
          <Col span={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">阿尔法系数</Text>
                <Text strong style={{ color: currentMetrics.alpha >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  {currentMetrics.alpha >= 0 ? '+' : ''}{(currentMetrics.alpha * 100).toFixed(2)}%
                </Text>
              </div>
            </Space>
          </Col>
          
          <Col span={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">信息比率</Text>
                <Text strong>{currentMetrics.informationRatio.toFixed(3)}</Text>
              </div>
            </Space>
          </Col>
          
          <Col span={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">卡尔玛比率</Text>
                <Text strong>{currentMetrics.calmarRatio.toFixed(3)}</Text>
              </div>
            </Space>
          </Col>
          
          <Col span={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">索提诺比率</Text>
                <Text strong>{currentMetrics.sortinoRatio.toFixed(3)}</Text>
              </div>
            </Space>
          </Col>
          
          <Col span={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">VaR(99%)</Text>
                <Text strong style={{ color: '#ff4d4f' }}>
                  {(Math.abs(currentMetrics.var99) * 100).toFixed(2)}%
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 风险指标说明 */}
      <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
        <Title level={5} style={{ marginBottom: 8, color: '#389e0d' }}>风险指标说明</Title>
        <Space direction="vertical" size="small">
          <Text><strong>夏普比率</strong>: 衡量每单位风险的超额收益，越高越好</Text>
          <Text><strong>最大回撤</strong>: 投资组合从峰值到谷值的最大跌幅</Text>
          <Text><strong>VaR</strong>: 在给定置信水平下的最大可能损失</Text>
          <Text><strong>贝塔系数</strong>: 衡量相对于市场的系统性风险</Text>
          <Text><strong>阿尔法系数</strong>: 衡量相对于基准的超额收益能力</Text>
        </Space>
      </div>
    </Card>
  );
};

export default RiskMetricsChart;