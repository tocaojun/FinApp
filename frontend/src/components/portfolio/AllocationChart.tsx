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
      // 这里应该调用实际的API
      // const data = await PortfolioService.getAllocations(portfolioId, allocationBy);
      
      // 使用模拟数据
      const mockAllocations = getMockAllocations(allocationBy);
      setAllocations(mockAllocations);
    } catch (error) {
      console.error('加载资产配置数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockAllocations = (type: AllocationBy): AssetAllocation[] => {
    switch (type) {
      case 'assetType':
        return [
          { assetType: '股票', value: 650000, percentage: 52.4, color: '#1890ff' },
          { assetType: '基金', value: 300000, percentage: 24.2, color: '#52c41a' },
          { assetType: '债券', value: 200000, percentage: 16.1, color: '#faad14' },
          { assetType: '现金', value: 90000, percentage: 7.3, color: '#722ed1' }
        ];
      case 'region':
        return [
          { assetType: '美国', value: 500000, percentage: 40.3, color: '#1890ff' },
          { assetType: '中国', value: 400000, percentage: 32.3, color: '#f5222d' },
          { assetType: '欧洲', value: 200000, percentage: 16.1, color: '#52c41a' },
          { assetType: '其他', value: 140000, percentage: 11.3, color: '#faad14' }
        ];
      case 'sector':
        return [
          { assetType: '科技', value: 400000, percentage: 32.3, color: '#1890ff' },
          { assetType: '金融', value: 300000, percentage: 24.2, color: '#52c41a' },
          { assetType: '医疗', value: 200000, percentage: 16.1, color: '#faad14' },
          { assetType: '消费', value: 180000, percentage: 14.5, color: '#722ed1' },
          { assetType: '其他', value: 160000, percentage: 12.9, color: '#eb2f96' }
        ];
      case 'currency':
        return [
          { assetType: 'USD', value: 700000, percentage: 56.5, color: '#1890ff' },
          { assetType: 'CNY', value: 350000, percentage: 28.2, color: '#f5222d' },
          { assetType: 'HKD', value: 150000, percentage: 12.1, color: '#52c41a' },
          { assetType: 'EUR', value: 40000, percentage: 3.2, color: '#faad14' }
        ];
      default:
        return [];
    }
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