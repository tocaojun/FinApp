import React, { useMemo } from 'react';
import { Card, Space, Typography, Tooltip, Tag, Progress } from 'antd';
import { InfoCircleOutlined, DropboxOutlined } from '@ant-design/icons';
import EChartsWrapper, { EChartsOption } from './EChartsWrapper';

const { Title, Text } = Typography;

export interface LiquidityData {
  category: string;
  value: number;
  percentage: number;
  liquidityLevel: 'high' | 'medium' | 'low';
  avgLiquidationDays: number;
  assets: Array<{
    name: string;
    value: number;
    liquidityScore: number;
  }>;
}

interface LiquidityDistributionChartProps {
  data: LiquidityData[];
  title?: string;
  height?: number;
  loading?: boolean;
  showDetails?: boolean;
  onCategoryClick?: (category: LiquidityData) => void;
}

const LiquidityDistributionChart: React.FC<LiquidityDistributionChartProps> = ({
  data,
  title = '流动性分布分析',
  height = 400,
  loading = false,
  showDetails = true,
  onCategoryClick,
}) => {
  // 流动性级别配置
  const liquidityConfig = {
    high: { color: '#52c41a', label: '高流动性', description: '1-3天可变现' },
    medium: { color: '#faad14', label: '中等流动性', description: '3-30天可变现' },
    low: { color: '#ff4d4f', label: '低流动性', description: '30天以上可变现' },
  };

  // 计算总值和流动性指标
  const statistics = useMemo(() => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const highLiquidityValue = data
      .filter(item => item.liquidityLevel === 'high')
      .reduce((sum, item) => sum + item.value, 0);
    const mediumLiquidityValue = data
      .filter(item => item.liquidityLevel === 'medium')
      .reduce((sum, item) => sum + item.value, 0);
    const lowLiquidityValue = data
      .filter(item => item.liquidityLevel === 'low')
      .reduce((sum, item) => sum + item.value, 0);

    const highLiquidityRatio = (highLiquidityValue / totalValue) * 100;
    const mediumLiquidityRatio = (mediumLiquidityValue / totalValue) * 100;
    const lowLiquidityRatio = (lowLiquidityValue / totalValue) * 100;

    // 计算加权平均流动性天数
    const weightedAvgDays = data.reduce((sum, item) => {
      return sum + (item.avgLiquidationDays * item.value);
    }, 0) / totalValue;

    return {
      totalValue,
      highLiquidityValue,
      mediumLiquidityValue,
      lowLiquidityValue,
      highLiquidityRatio,
      mediumLiquidityRatio,
      lowLiquidityRatio,
      weightedAvgDays,
    };
  }, [data]);

  // ECharts 配置 - 使用堆叠柱状图
  const option: EChartsOption = useMemo(() => {
    const categories = data.map(item => item.category);
    const highData = data.map(item => item.liquidityLevel === 'high' ? item.value : 0);
    const mediumData = data.map(item => item.liquidityLevel === 'medium' ? item.value : 0);
    const lowData = data.map(item => item.liquidityLevel === 'low' ? item.value : 0);

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
          type: 'shadow',
        },
        formatter: (params: any) => {
          const categoryIndex = params[0].dataIndex;
          const categoryData = data[categoryIndex];
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${categoryData.category}</div>
              <div style="margin-bottom: 4px;">总价值: ¥${categoryData.value.toLocaleString()}</div>
              <div style="margin-bottom: 4px;">占比: ${categoryData.percentage.toFixed(2)}%</div>
              <div style="margin-bottom: 4px;">
                流动性等级: 
                <span style="color: ${liquidityConfig[categoryData.liquidityLevel].color};">
                  ${liquidityConfig[categoryData.liquidityLevel].label}
                </span>
              </div>
              <div style="margin-bottom: 4px;">平均变现天数: ${categoryData.avgLiquidationDays}天</div>
              <div style="margin-bottom: 4px;">资产数量: ${categoryData.assets.length}个</div>
            </div>
          `;
        },
      },
      legend: {
        data: ['高流动性', '中等流动性', '低流动性'],
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
        data: categories,
        axisLabel: {
          rotate: 45,
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 10000) {
              return `${(value / 10000).toFixed(1)}万`;
            }
            return value.toLocaleString();
          },
        },
      },
      series: [
        {
          name: '高流动性',
          type: 'bar',
          stack: 'liquidity',
          data: highData,
          itemStyle: {
            color: liquidityConfig.high.color,
          },
          emphasis: {
            focus: 'series',
          },
        },
        {
          name: '中等流动性',
          type: 'bar',
          stack: 'liquidity',
          data: mediumData,
          itemStyle: {
            color: liquidityConfig.medium.color,
          },
          emphasis: {
            focus: 'series',
          },
        },
        {
          name: '低流动性',
          type: 'bar',
          stack: 'liquidity',
          data: lowData,
          itemStyle: {
            color: liquidityConfig.low.color,
          },
          emphasis: {
            focus: 'series',
          },
        },
      ],
    };
  }, [data, title]);

  // 图表事件处理
  const handleEvents = useMemo(() => ({
    click: (params: any) => {
      if (onCategoryClick && params.dataIndex !== undefined) {
        const categoryData = data[params.dataIndex];
        onCategoryClick(categoryData);
      }
    },
  }), [onCategoryClick, data]);

  return (
    <Card
      title={
        <Space align="center">
          <DropboxOutlined />
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          <Tooltip title="显示投资组合中各类资产的流动性分布情况">
            <InfoCircleOutlined style={{ color: '#999' }} />
          </Tooltip>
        </Space>
      }
      bodyStyle={{ padding: '16px' }}
    >
      <EChartsWrapper
        option={option}
        style={{ height: `${height}px`, width: '100%' }}
        loading={loading}
        onEvents={handleEvents}
      />
      
      {/* 流动性概览 */}
      <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
        <Title level={5} style={{ marginBottom: 12 }}>流动性概览</Title>
        
        <div style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Tag color={liquidityConfig.high.color}>高流动性</Tag>
                <Text type="secondary">{liquidityConfig.high.description}</Text>
              </Space>
              <Text strong>¥{statistics.highLiquidityValue.toLocaleString()}</Text>
            </div>
            <Progress
              percent={statistics.highLiquidityRatio}
              strokeColor={liquidityConfig.high.color}
              showInfo={false}
              size="small"
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Tag color={liquidityConfig.medium.color}>中等流动性</Tag>
                <Text type="secondary">{liquidityConfig.medium.description}</Text>
              </Space>
              <Text strong>¥{statistics.mediumLiquidityValue.toLocaleString()}</Text>
            </div>
            <Progress
              percent={statistics.mediumLiquidityRatio}
              strokeColor={liquidityConfig.medium.color}
              showInfo={false}
              size="small"
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Tag color={liquidityConfig.low.color}>低流动性</Tag>
                <Text type="secondary">{liquidityConfig.low.description}</Text>
              </Space>
              <Text strong>¥{statistics.lowLiquidityValue.toLocaleString()}</Text>
            </div>
            <Progress
              percent={statistics.lowLiquidityRatio}
              strokeColor={liquidityConfig.low.color}
              showInfo={false}
              size="small"
            />
          </Space>
        </div>

        {/* 关键指标 */}
        <Space size="large" wrap>
          <div>
            <Text type="secondary">总资产价值</Text>
            <br />
            <Text strong>¥{statistics.totalValue.toLocaleString()}</Text>
          </div>
          <div>
            <Text type="secondary">高流动性占比</Text>
            <br />
            <Text strong style={{ color: liquidityConfig.high.color }}>
              {statistics.highLiquidityRatio.toFixed(1)}%
            </Text>
          </div>
          <div>
            <Text type="secondary">加权平均变现天数</Text>
            <br />
            <Text strong>{statistics.weightedAvgDays.toFixed(0)}天</Text>
          </div>
          <div>
            <Text type="secondary">资产类别数量</Text>
            <br />
            <Text strong>{data.length}个</Text>
          </div>
        </Space>
      </div>

      {/* 详细信息 */}
      {showDetails && (
        <div style={{ marginTop: 16 }}>
          <Title level={5} style={{ marginBottom: 12 }}>流动性风险提示</Title>
          <Space direction="vertical" size="small">
            {statistics.lowLiquidityRatio > 30 && (
              <Text type="warning">
                ⚠️ 低流动性资产占比较高({statistics.lowLiquidityRatio.toFixed(1)}%)，建议关注流动性风险
              </Text>
            )}
            {statistics.weightedAvgDays > 30 && (
              <Text type="warning">
                ⚠️ 平均变现天数较长({statistics.weightedAvgDays.toFixed(0)}天)，紧急情况下可能面临流动性压力
              </Text>
            )}
            {statistics.highLiquidityRatio > 70 && (
              <Text type="success">
                ✅ 高流动性资产占比较高({statistics.highLiquidityRatio.toFixed(1)}%)，流动性状况良好
              </Text>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default LiquidityDistributionChart;