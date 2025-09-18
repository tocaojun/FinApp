import React, { useMemo } from 'react';
import { Card, Select, Space, Typography, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import EChartsWrapper, { EChartsOption } from './EChartsWrapper';

const { Title, Text } = Typography;
const { Option } = Select;

export interface PortfolioAllocation {
  name: string;
  value: number;
  percentage: number;
  color?: string;
  category?: string;
}

interface PortfolioPieChartProps {
  data: PortfolioAllocation[];
  title?: string;
  height?: number;
  loading?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  groupBy?: 'asset_type' | 'region' | 'industry' | 'currency';
  onGroupByChange?: (groupBy: string) => void;
  onSliceClick?: (data: PortfolioAllocation) => void;
}

const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({
  data,
  title = '投资组合分布',
  height = 400,
  loading = false,
  showLegend = true,
  showLabels = true,
  groupBy = 'asset_type',
  onGroupByChange,
  onSliceClick,
}) => {
  // 颜色主题
  const colorPalette = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#ff9f7f',
    '#87ceeb', '#dda0dd', '#98fb98', '#f0e68c', '#ff6347'
  ];

  // 处理数据并添加颜色
  const processedData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      itemStyle: {
        color: item.color || colorPalette[index % colorPalette.length],
      },
    }));
  }, [data]);

  // 计算总值
  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  // ECharts 配置
  const option: EChartsOption = useMemo(() => {
    return {
      title: {
        text: title,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data;
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
              <div>金额: ¥${data.value.toLocaleString()}</div>
              <div>占比: ${data.percentage.toFixed(2)}%</div>
              ${data.category ? `<div>类别: ${data.category}</div>` : ''}
            </div>
          `;
        },
      },
      legend: showLegend ? {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 20,
        bottom: 20,
        data: processedData.map(item => item.name),
        formatter: (name: string) => {
          const item = processedData.find(d => d.name === name);
          return `${name} (${item?.percentage.toFixed(1)}%)`;
        },
      } : undefined,
      series: [
        {
          name: '投资组合分布',
          type: 'pie',
          radius: showLegend ? ['40%', '70%'] : ['30%', '80%'],
          center: showLegend ? ['40%', '50%'] : ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: showLabels ? {
            show: true,
            position: 'outside',
            formatter: (params: any) => {
              return `${params.name}\n${params.percent}%`;
            },
            fontSize: 12,
          } : {
            show: false,
          },
          labelLine: showLabels ? {
            show: true,
            length: 15,
            length2: 10,
          } : {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: processedData,
        },
      ],
      graphic: totalValue > 0 ? [
        {
          type: 'text',
          left: showLegend ? '40%' : '50%',
          top: '50%',
          style: {
            text: `总计\n¥${totalValue.toLocaleString()}`,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 'bold',
            fill: '#666',
          },
        },
      ] : undefined,
    };
  }, [processedData, title, showLegend, showLabels, totalValue]);

  // 图表事件处理
  const handleEvents = useMemo(() => ({
    click: (params: any) => {
      if (onSliceClick && params.data) {
        onSliceClick(params.data);
      }
    },
  }), [onSliceClick]);

  // 分组选项
  const groupOptions = [
    { value: 'asset_type', label: '资产类型' },
    { value: 'region', label: '地区分布' },
    { value: 'industry', label: '行业分布' },
    { value: 'currency', label: '货币分布' },
  ];

  return (
    <Card
      title={
        <Space align="center">
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          <Tooltip title="显示投资组合的资产分布情况">
            <InfoCircleOutlined style={{ color: '#999' }} />
          </Tooltip>
        </Space>
      }
      extra={
        onGroupByChange && (
          <Select
            value={groupBy}
            onChange={onGroupByChange}
            style={{ width: 120 }}
            size="small"
          >
            {groupOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        )
      }
      bodyStyle={{ padding: '16px' }}
    >
      <EChartsWrapper
        option={option}
        style={{ height: `${height}px`, width: '100%' }}
        loading={loading}
        onEvents={handleEvents}
      />
      
      {/* 统计信息 */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Space size="large">
          <div>
            <Text type="secondary">资产数量</Text>
            <br />
            <Text strong>{data.length}</Text>
          </div>
          <div>
            <Text type="secondary">总价值</Text>
            <br />
            <Text strong>¥{totalValue.toLocaleString()}</Text>
          </div>
          <div>
            <Text type="secondary">最大占比</Text>
            <br />
            <Text strong>
              {data.length > 0 ? Math.max(...data.map(d => d.percentage)).toFixed(1) : 0}%
            </Text>
          </div>
        </Space>
      </div>
    </Card>
  );
};

export default PortfolioPieChart;