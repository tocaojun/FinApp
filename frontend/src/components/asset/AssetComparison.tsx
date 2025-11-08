import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Progress,
  Rate,
  Tooltip,
  Alert,
  Divider,
  Badge,
  Switch
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SwapOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
  StarOutlined,
  DollarOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { Title, Text } = Typography;

interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetTypeName: string;
  countryName: string;
  currency: string;
  riskLevel: string;
  liquidityTag: string;
  sector?: string;
  industry?: string;
  currentPrice?: number;
  marketCap?: number;
  volume?: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  beta?: number;
  volatility?: number;
  rating?: number;
  analystRating?: string;
  roe?: number;
  debtToEquity?: number;
  priceChange1D?: number;
  priceChange1W?: number;
  priceChange1M?: number;
  priceChange1Y?: number;
  isActive: boolean;
}

interface ComparisonMetric {
  key: string;
  name: string;
  category: string;
  format: 'number' | 'percentage' | 'currency' | 'ratio' | 'rating';
  higherIsBetter: boolean;
  description: string;
}

interface AssetComparisonProps {
  assets: Asset[];
  maxComparisons?: number;
}

const AssetComparison: React.FC<AssetComparisonProps> = ({
  assets,
  maxComparisons = 5
}) => {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'basic' | 'detailed'>('basic');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['基本信息', '估值指标', '财务指标']);
  const [showPercentiles, setShowPercentiles] = useState(false);

  // 比较指标定义
  const comparisonMetrics: ComparisonMetric[] = [
    // 基本信息
    { key: 'currentPrice', name: '当前价格', category: '基本信息', format: 'currency', higherIsBetter: false, description: '资产当前交易价格' },
    { key: 'marketCap', name: '市值', category: '基本信息', format: 'currency', higherIsBetter: true, description: '公司总市值' },
    { key: 'volume', name: '成交量', category: '基本信息', format: 'number', higherIsBetter: true, description: '日均成交量' },
    { key: 'rating', name: '评级', category: '基本信息', format: 'rating', higherIsBetter: true, description: '综合评级' },
    
    // 估值指标
    { key: 'peRatio', name: 'P/E比率', category: '估值指标', format: 'ratio', higherIsBetter: false, description: '市盈率' },
    { key: 'pbRatio', name: 'P/B比率', category: '估值指标', format: 'ratio', higherIsBetter: false, description: '市净率' },
    { key: 'dividendYield', name: '股息率', category: '估值指标', format: 'percentage', higherIsBetter: true, description: '年化股息收益率' },
    
    // 风险指标
    { key: 'beta', name: 'Beta系数', category: '风险指标', format: 'ratio', higherIsBetter: false, description: '相对市场的波动性' },
    { key: 'volatility', name: '波动率', category: '风险指标', format: 'percentage', higherIsBetter: false, description: '价格波动率' },
    
    // 财务指标
    { key: 'roe', name: 'ROE', category: '财务指标', format: 'percentage', higherIsBetter: true, description: '净资产收益率' },
    { key: 'debtToEquity', name: '负债权益比', category: '财务指标', format: 'ratio', higherIsBetter: false, description: '负债权益比率' },
    
    // 价格表现
    { key: 'priceChange1D', name: '1日涨跌', category: '价格表现', format: 'percentage', higherIsBetter: true, description: '1日价格变化' },
    { key: 'priceChange1W', name: '1周涨跌', category: '价格表现', format: 'percentage', higherIsBetter: true, description: '1周价格变化' },
    { key: 'priceChange1M', name: '1月涨跌', category: '价格表现', format: 'percentage', higherIsBetter: true, description: '1月价格变化' },
    { key: 'priceChange1Y', name: '1年涨跌', category: '价格表现', format: 'percentage', higherIsBetter: true, description: '1年价格变化' }
  ];

  const categories = Array.from(new Set(comparisonMetrics.map(m => m.category)));

  // 添加资产到比较列表
  const addAssetToComparison = (assetId: string) => {
    if (selectedAssets.length >= maxComparisons) {
      return;
    }
    if (!selectedAssets.includes(assetId)) {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  // 从比较列表移除资产
  const removeAssetFromComparison = (assetId: string) => {
    setSelectedAssets(selectedAssets.filter(id => id !== assetId));
  };

  // 清空比较列表
  const clearComparison = () => {
    setSelectedAssets([]);
  };

  // 格式化数值显示
  const formatValue = (value: any, format: ComparisonMetric['format']) => {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'currency':
        return `$${Number(value).toLocaleString()}`;
      case 'percentage':
        return `${Number(value).toFixed(2)}%`;
      case 'ratio':
        return Number(value).toFixed(2);
      case 'rating':
        return <Rate disabled defaultValue={value} />;
      case 'number':
        return Number(value).toLocaleString();
      default:
        return value;
    }
  };

  // 获取指标的百分位数
  const getPercentile = (value: number, metric: ComparisonMetric, allAssets: Asset[]) => {
    const values = allAssets
      .map(a => a[metric.key as keyof Asset] as number)
      .filter(v => v !== null && v !== undefined)
      .sort((a, b) => a - b);
    
    if (values.length === 0) return 0;
    
    const index = values.findIndex(v => v >= value);
    return Math.round((index / values.length) * 100);
  };

  // 获取指标的相对表现
  const getRelativePerformance = (value: number, metric: ComparisonMetric, comparedAssets: Asset[]) => {
    const values = comparedAssets
      .map(a => a[metric.key as keyof Asset] as number)
      .filter(v => v !== null && v !== undefined);
    
    if (values.length <= 1) return 'neutral';
    
    const sortedValues = [...values].sort((a, b) => metric.higherIsBetter ? b - a : a - b);
    const rank = sortedValues.indexOf(value) + 1;
    
    if (rank === 1) return 'best';
    if (rank === sortedValues.length) return 'worst';
    return 'neutral';
  };

  // 生成比较表格数据
  const generateComparisonData = () => {
    const filteredMetrics = comparisonMetrics.filter(m => 
      selectedCategories.includes(m.category)
    );
    
    return filteredMetrics.map(metric => {
      const row: any = {
        key: metric.key,
        metric: metric.name,
        category: metric.category,
        description: metric.description
      };
      
      selectedAssets.forEach(assetId => {
        const asset = assets.find(a => a.id === assetId);
        if (asset) {
          const value = asset[metric.key as keyof Asset] as number;
          const comparedAssets = assets.filter(a => selectedAssets.includes(a.id));
          const performance = getRelativePerformance(value, metric, comparedAssets);
          const percentile = showPercentiles ? getPercentile(value, metric, assets) : null;
          
          row[assetId] = {
            value,
            formattedValue: formatValue(value, metric.format),
            performance,
            percentile
          };
        }
      });
      
      return row;
    });
  };

  // 生成表格列
  const generateColumns = (): ColumnsType<any> => {
    const baseColumns: ColumnsType<any> = [
      {
        title: '指标',
        dataIndex: 'metric',
        key: 'metric',
        width: 120,
        fixed: 'left',
        render: (text: string, record: any) => (
          <Tooltip title={record.description}>
            <Space>
              <Text strong>{text}</Text>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
            </Space>
          </Tooltip>
        )
      },
      {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        width: 100,
        render: (category: string) => <Tag>{category}</Tag>
      }
    ];

    const assetColumns: ColumnsType<any> = selectedAssets.map(assetId => {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return null;

      return {
        title: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>{asset.symbol}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{asset.name}</div>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeAssetFromComparison(assetId)}
            />
          </div>
        ),
        dataIndex: assetId,
        key: assetId,
        width: 150,
        align: 'center' as const,
        render: (data: any) => {
          if (!data) return '-';
          
          const { formattedValue, performance, percentile } = data;
          
          const performanceColor = {
            best: '#52c41a',
            worst: '#ff4d4f',
            neutral: '#1890ff'
          };
          
          return (
            <div>
              <div style={{ 
                color: performanceColor[performance as keyof typeof performanceColor],
                fontWeight: performance !== 'neutral' ? 'bold' : 'normal'
              }}>
                {formattedValue}
              </div>
              {showPercentiles && percentile !== null && (
                <div style={{ fontSize: '10px', color: '#666' }}>
                  {percentile}th percentile
                </div>
              )}
              {performance === 'best' && <RiseOutlined style={{ color: '#52c41a' }} />}
              {performance === 'worst' && <FallOutlined style={{ color: '#ff4d4f' }} />}
            </div>
          );
        }
      };
    }).filter(Boolean) as ColumnsType<any>;

    return [...baseColumns, ...assetColumns];
  };

  const comparisonData = generateComparisonData();
  const columns = generateColumns();
  const selectedAssetData = assets.filter(a => selectedAssets.includes(a.id));

  return (
    <div>
      {/* 资产选择器 */}
      <Card title="选择要比较的资产" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Select
              placeholder="选择资产进行比较"
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase())
              }
              onSelect={addAssetToComparison}
              value={undefined}
            >
              {assets
                .filter(asset => !selectedAssets.includes(asset.id))
                .map(asset => (
                  <Option key={asset.id} value={asset.id}>
                    {asset.symbol} - {asset.name}
                  </Option>
                ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              mode="multiple"
              placeholder="选择比较类别"
              value={selectedCategories}
              onChange={setSelectedCategories}
              style={{ width: '100%' }}
            >
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Switch
                checked={showPercentiles}
                onChange={setShowPercentiles}
                checkedChildren="百分位"
                unCheckedChildren="百分位"
              />
              <Button onClick={clearComparison} disabled={selectedAssets.length === 0}>
                清空
              </Button>
            </Space>
          </Col>
        </Row>
        
        {selectedAssets.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text>已选择 {selectedAssets.length}/{maxComparisons} 个资产进行比较</Text>
            <Progress 
              percent={(selectedAssets.length / maxComparisons) * 100} 
              showInfo={false}
              size="small"
              style={{ marginTop: 8 }}
            />
          </div>
        )}
      </Card>

      {/* 快速概览 */}
      {selectedAssets.length > 0 && (
        <Card title="快速概览" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            {selectedAssetData.map((asset, index) => (
              <Col key={asset.id} span={24 / Math.min(selectedAssets.length, 4)}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <Title level={5}>{asset.symbol}</Title>
                    <Text type="secondary">{asset.name}</Text>
                    <Divider />
                    <Row gutter={8}>
                      <Col span={12}>
                        <Statistic
                          title="当前价格"
                          value={asset.currentPrice || 0}
                          precision={2}
                          prefix="$"
                          valueStyle={{ fontSize: '14px' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="市值"
                          value={asset.marketCap || 0}
                          suffix="亿"
                          prefix="$"
                          valueStyle={{ fontSize: '14px' }}
                        />
                      </Col>
                    </Row>
                    <div style={{ marginTop: 8 }}>
                      <Tag color={asset.riskLevel === 'LOW' ? 'green' : asset.riskLevel === 'HIGH' ? 'red' : 'orange'}>
                        {asset.riskLevel === 'LOW' ? '低风险' : asset.riskLevel === 'HIGH' ? '高风险' : '中风险'}
                      </Tag>
                      <Tag>{asset.sector || '其他'}</Tag>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 详细比较表格 */}
      {selectedAssets.length > 0 ? (
        <Card title="详细比较">
          <Table
            columns={columns}
            dataSource={comparisonData}
            pagination={false}
            scroll={{ x: 800 }}
            size="small"
            bordered
          />
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <SwapOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
            <Title level={4} style={{ color: '#d9d9d9' }}>
              请选择资产进行比较
            </Title>
            <Text type="secondary">
              最多可以同时比较 {maxComparisons} 个资产
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AssetComparison;