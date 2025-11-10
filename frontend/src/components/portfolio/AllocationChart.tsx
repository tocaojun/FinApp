import React, { useState, useEffect } from 'react';
import { Card, Select, Space, Typography, Row, Col, Spin } from 'antd';
import { PieChartOutlined, BarChartOutlined } from '@ant-design/icons';
import { AssetAllocation } from '../../types/portfolio';

const { Option } = Select;
const { Title, Text } = Typography;

interface AllocationChartProps {
  portfolioId: string;
}

type ChartType = 'pie' | 'bar';
type AllocationBy = 'assetType' | 'region' | 'sector' | 'currency';

const AllocationChart: React.FC<AllocationChartProps> = ({ portfolioId }) => {
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [allocationBy, setAllocationBy] = useState<AllocationBy>('assetType');
  const [allocations, setAllocations] = useState<AssetAllocation[]>([]);

  useEffect(() => {
    if (portfolioId) {
      loadAllocations();
    }
  }, [portfolioId, allocationBy]);

  const loadAllocations = async () => {
    setLoading(true);
    try {
      // 导入HoldingService获取持仓数据
      const { HoldingService } = await import('../../services/holdingService');
      const holdings = await HoldingService.getHoldingsByPortfolio(portfolioId);
      
      // 根据选择的分配方式计算配置
      const calculatedAllocations = calculateAllocations(holdings, allocationBy);
      setAllocations(calculatedAllocations);
    } catch (error) {
      console.error('加载资产配置数据失败:', error);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllocations = (holdings: any[], type: AllocationBy): AssetAllocation[] => {
    if (!holdings || holdings.length === 0) {
      return [];
    }

    // 使用转换后的市值（已按汇率转换为基础币种，通常是人民币）
    // 这样可以正确处理不同币种的资产
    const totalValue = holdings.reduce((sum, holding) => {
      // 优先使用转换后的市值，如果没有则使用原市值
      return sum + (holding.convertedMarketValue || holding.marketValue || 0);
    }, 0);
    
    const groupedData: Record<string, number> = {};

    // 根据类型分组数据
    holdings.forEach(holding => {
      let key: string;
      switch (type) {
        case 'assetType':
          key = holding.assetType || '未知类型';
          break;
        case 'currency':
          key = holding.currency || 'CNY';
          break;
        case 'region':
          // 根据资产符号判断地区（简化逻辑）
          if (holding.assetSymbol?.includes('.SZ') || holding.assetSymbol?.includes('.SS')) {
            key = '中国';
          } else if (holding.assetSymbol?.includes('.HK')) {
            key = '香港';
          } else {
            key = '美国';
          }
          break;
        case 'sector':
          // 这里需要从资产数据中获取行业信息，暂时使用默认值
          key = '其他';
          break;
        default:
          key = '其他';
      }
      
      // 使用转换后的市值（已按汇率转换）以正确处理多币种资产
      const value = holding.convertedMarketValue || holding.marketValue || 0;
      groupedData[key] = (groupedData[key] || 0) + value;
    });

    // 颜色配置
    const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2', '#fa541c'];
    
    // 转换为配置数组
    return Object.entries(groupedData)
      .map(([key, value], index) => ({
        assetType: key,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value); // 按价值降序排列
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 简单的饼图组件（不依赖外部图表库）
  const SimplePieChart: React.FC<{ data: AssetAllocation[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    const createPath = (percentage: number, startAngle: number) => {
      const angle = (percentage / 100) * 360;
      const endAngle = startAngle + angle;
      
      const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
      const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
      const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
      const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      return `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <svg width="200" height="200" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const path = createPath(item.percentage, currentAngle);
            currentAngle += (item.percentage / 100) * 360;
            
            return (
              <path
                key={index}
                d={path}
                fill={item.color}
                stroke="#fff"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
        
        <div style={{ flex: 1 }}>
          {data.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div 
                style={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: item.color, 
                  marginRight: 8,
                  borderRadius: 2
                }} 
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>{item.assetType}</Text>
                  <Text strong>{item.percentage.toFixed(1)}%</Text>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatCurrency(item.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 简单的柱状图组件
  const SimpleBarChart: React.FC<{ data: AssetAllocation[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'end', height: 200, gap: 8, marginBottom: 16 }}>
          {data.map((item, index) => {
            const height = (item.value / maxValue) * 180;
            return (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', marginBottom: 4, textAlign: 'center' }}>
                  {item.percentage.toFixed(1)}%
                </div>
                <div
                  style={{
                    width: '100%',
                    height: `${height}px`,
                    backgroundColor: item.color,
                    borderRadius: '4px 4px 0 0',
                    minHeight: 4
                  }}
                />
                <div style={{ fontSize: '12px', marginTop: 4, textAlign: 'center', wordBreak: 'break-all' }}>
                  {item.assetType}
                </div>
              </div>
            );
          })}
        </div>
        
        <div>
          {data.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div 
                  style={{ 
                    width: 12, 
                    height: 12, 
                    backgroundColor: item.color, 
                    marginRight: 8,
                    borderRadius: 2
                  }} 
                />
                <Text>{item.assetType}</Text>
              </div>
              <Text>{formatCurrency(item.value)}</Text>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getAllocationLabel = (type: AllocationBy) => {
    const labels = {
      assetType: '资产类型',
      region: '地区分布',
      sector: '行业分布',
      currency: '币种分布'
    };
    return labels[type];
  };

  return (
    <Card 
      title="资产配置"
      extra={
        <Space>
          <Select
            value={allocationBy}
            onChange={setAllocationBy}
            style={{ width: 120 }}
          >
            <Option value="assetType">资产类型</Option>
            <Option value="region">地区分布</Option>
            <Option value="sector">行业分布</Option>
            <Option value="currency">币种分布</Option>
          </Select>
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: 100 }}
          >
            <Option value="pie">
              <PieChartOutlined /> 饼图
            </Option>
            <Option value="bar">
              <BarChartOutlined /> 柱图
            </Option>
          </Select>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <div style={{ minHeight: 250 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            {getAllocationLabel(allocationBy)}
          </Title>
          
          {allocations.length > 0 ? (
            chartType === 'pie' ? (
              <SimplePieChart data={allocations} />
            ) : (
              <SimpleBarChart data={allocations} />
            )
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              暂无数据
            </div>
          )}
        </div>
      </Spin>
    </Card>
  );
};

export default AllocationChart;