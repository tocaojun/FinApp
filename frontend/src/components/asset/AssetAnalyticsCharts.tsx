import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Space,
  Statistic,
  Typography,
  Tabs,
  Button,
  Tooltip,
  Tag,
  Switch,
  Slider
} from 'antd';
import {
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  CalendarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import dayjs from 'dayjs';
import {
  getActiveLiquidityTags,
  type LiquidityTag
} from '../../services/liquidityTagsApi';

const { Option } = Select;
const { RangePicker } = DatePicker;
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
  dividendYield?: number;
  beta?: number;
  volatility?: number;
  rating?: number;
  isActive: boolean;
}

interface PriceData {
  date: string;
  price: number;
  volume: number;
  change: number;
  changePercent: number;
}

interface AssetAnalyticsChartsProps {
  assets: Asset[];
  selectedAssets?: string[];
  loading?: boolean;
}

interface ChartData {
  date: string;
  [key: string]: any;
}

const AssetAnalyticsCharts: React.FC<AssetAnalyticsChartsProps> = ({
  assets,
  selectedAssets = [],
  loading = false
}) => {
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [chartType, setChartType] = useState<'line' | 'area' | 'candlestick'>('line');
  const [compareMode, setCompareMode] = useState(false);
  const [liquidityTags, setLiquidityTags] = useState<LiquidityTag[]>([]);

  // 加载流动性标签
  useEffect(() => {
    const loadLiquidityTags = async () => {
      try {
        const tags = await getActiveLiquidityTags();
        setLiquidityTags(tags);
      } catch (error) {
        console.error('加载流动性标签失败:', error);
      }
    };
    loadLiquidityTags();
  }, []);
  const [selectedMetric, setSelectedMetric] = useState<string>('price');
  const [priceData, setPriceData] = useState<Record<string, PriceData[]>>({});
  const [correlationData, setCorrelationData] = useState<any[]>([]);

  // 颜色配置
  const colors = [
    '#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96',
    '#13c2c2', '#faad14', '#a0d911', '#f5222d', '#2f54eb'
  ];

  const sectorColors = {
    'technology': '#1890ff',
    'healthcare': '#52c41a',
    'finance': '#fa8c16',
    'energy': '#722ed1',
    'consumer': '#eb2f96',
    'industrial': '#13c2c2',
    'materials': '#faad14',
    'utilities': '#a0d911'
  };

  // 生成模拟价格数据
  useEffect(() => {
    generateMockPriceData();
  }, [selectedAssets, timeRange]);

  const generateMockPriceData = () => {
    const data: Record<string, PriceData[]> = {};
    
    selectedAssets.forEach(assetId => {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return;

      const basePrice = asset.currentPrice || 100;
      const volatility = asset.volatility || 0.02;
      const days = timeRange ? timeRange[1].diff(timeRange[0], 'day') : 30;
      
      const prices: PriceData[] = [];
      let currentPrice = basePrice;
      
      for (let i = 0; i < days; i++) {
        const date = dayjs().subtract(days - i, 'day');
        const change = (Math.random() - 0.5) * volatility * currentPrice;
        currentPrice += change;
        const changePercent = (change / (currentPrice - change)) * 100;
        
        prices.push({
          date: date.format('YYYY-MM-DD'),
          price: Number(currentPrice.toFixed(2)),
          volume: Math.floor(Math.random() * 1000000) + 100000,
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2))
        });
      }
      
      data[assetId] = prices;
    });
    
    setPriceData(data);
    generateCorrelationData(data);
  };

  const generateCorrelationData = (data: Record<string, PriceData[]>) => {
    const assetIds = Object.keys(data);
    const correlations: any[] = [];
    
    for (let i = 0; i < assetIds.length; i++) {
      for (let j = i + 1; j < assetIds.length; j++) {
        const asset1 = assets.find(a => a.id === assetIds[i]);
        const asset2 = assets.find(a => a.id === assetIds[j]);
        
        if (asset1 && asset2) {
          // 简化的相关性计算
          const correlation = Math.random() * 2 - 1; // -1 到 1 之间
          
          correlations.push({
            asset1: asset1.symbol,
            asset2: asset2.symbol,
            correlation: Number(correlation.toFixed(3)),
            x: asset1.beta || Math.random() * 2,
            y: asset2.beta || Math.random() * 2
          });
        }
      }
    }
    
    setCorrelationData(correlations);
  };

  // 获取统计数据
  const getStatistics = () => {
    const selectedAssetData = assets.filter(a => selectedAssets.includes(a.id));
    
    const totalMarketCap = selectedAssetData.reduce((sum, a) => sum + (a.marketCap || 0), 0);
    const avgPE = selectedAssetData.reduce((sum, a) => sum + (a.peRatio || 0), 0) / selectedAssetData.length;
    const avgDividendYield = selectedAssetData.reduce((sum, a) => sum + (a.dividendYield || 0), 0) / selectedAssetData.length;
    const avgBeta = selectedAssetData.reduce((sum, a) => sum + (a.beta || 0), 0) / selectedAssetData.length;
    
    return {
      assetCount: selectedAssetData.length,
      totalMarketCap,
      avgPE: Number(avgPE.toFixed(2)),
      avgDividendYield: Number(avgDividendYield.toFixed(2)),
      avgBeta: Number(avgBeta.toFixed(2))
    };
  };

  // 生成组合图表数据
  const generateCombinedChartData = (): ChartData[] => {
    if (selectedAssets.length === 0) return [];
    
    const dates = priceData[selectedAssets[0]]?.map(d => d.date) || [];
    
    return dates.map(date => {
      const dataPoint: ChartData = { date };
      
      selectedAssets.forEach((assetId, index) => {
        const asset = assets.find(a => a.id === assetId);
        const dayData = priceData[assetId]?.find(d => d.date === date);
        
        if (asset && dayData) {
          dataPoint[asset.symbol] = dayData.price;
          dataPoint[`${asset.symbol}_volume`] = dayData.volume;
          dataPoint[`${asset.symbol}_change`] = dayData.changePercent;
        }
      });
      
      return dataPoint;
    });
  };

  // 生成行业分布数据
  const generateSectorDistribution = () => {
    const selectedAssetData = assets.filter(a => selectedAssets.includes(a.id));
    const sectorMap = new Map<string, { count: number; marketCap: number }>();
    
    selectedAssetData.forEach(asset => {
      const sector = asset.sector || 'Other';
      const current = sectorMap.get(sector) || { count: 0, marketCap: 0 };
      sectorMap.set(sector, {
        count: current.count + 1,
        marketCap: current.marketCap + (asset.marketCap || 0)
      });
    });
    
    return Array.from(sectorMap.entries()).map(([sector, data], index) => ({
      name: sector,
      count: data.count,
      marketCap: data.marketCap,
      color: sectorColors[sector as keyof typeof sectorColors] || colors[index % colors.length]
    }));
  };

  // 生成风险收益散点图数据
  const generateRiskReturnData = () => {
    return assets
      .filter(a => selectedAssets.includes(a.id))
      .map(asset => ({
        name: asset.symbol,
        risk: asset.volatility || Math.random() * 0.5,
        return: (Math.random() - 0.5) * 0.4, // 模拟年化收益率
        marketCap: asset.marketCap || 0,
        sector: asset.sector || 'Other'
      }));
  };

  // 生成雷达图数据
  const generateRadarData = () => {
    const selectedAssetData = assets.filter(a => selectedAssets.includes(a.id));
    
    return selectedAssetData.map(asset => {
      // 根据流动性标签名称计算分数
      const liquidityTag = liquidityTags.find(t => t.id === asset.liquidityTag);
      let liquidityScore = 3; // 默认中等
      if (liquidityTag) {
        const tagName = liquidityTag.name.toLowerCase();
        if (tagName.includes('高') || tagName.includes('high')) liquidityScore = 5;
        else if (tagName.includes('低') || tagName.includes('low')) liquidityScore = 1;
      }
      
      return {
        asset: asset.symbol,
        流动性: liquidityScore,
        收益性: asset.rating || Math.floor(Math.random() * 5) + 1,
        稳定性: asset.riskLevel === 'LOW' ? 5 : asset.riskLevel === 'MEDIUM' ? 3 : 1,
        成长性: Math.floor(Math.random() * 5) + 1,
        估值: Math.floor(Math.random() * 5) + 1,
        质量: Math.floor(Math.random() * 5) + 1
      };
    });
  };

  const statistics = getStatistics();
  const combinedData = generateCombinedChartData();
  const sectorData = generateSectorDistribution();
  const riskReturnData = generateRiskReturnData();
  const radarData = generateRadarData();

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{`日期: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color }}>
              {`${entry.name}: $${entry.value?.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* 控制面板 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Space>
              <Text strong>时间范围:</Text>
              <RangePicker
                value={timeRange}
                onChange={(dates) => setTimeRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                style={{ width: 240 }}
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>图表类型:</Text>
              <Select value={chartType} onChange={setChartType} style={{ width: 100 }}>
                <Option value="line">线图</Option>
                <Option value="area">面积图</Option>
                <Option value="candlestick">K线图</Option>
              </Select>
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>对比模式:</Text>
              <Switch
                checked={compareMode}
                onChange={setCompareMode}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>指标:</Text>
              <Select value={selectedMetric} onChange={setSelectedMetric} style={{ width: 100 }}>
                <Option value="price">价格</Option>
                <Option value="volume">成交量</Option>
                <Option value="change">涨跌幅</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="选中资产"
              value={statistics.assetCount}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="总市值"
              value={statistics.totalMarketCap}
              precision={0}
              suffix="亿"
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="平均P/E"
              value={statistics.avgPE}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="平均股息率"
              value={statistics.avgDividendYield}
              precision={2}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="平均Beta"
              value={statistics.avgBeta}
              precision={2}
              valueStyle={{ 
                color: statistics.avgBeta > 1 ? '#ff4d4f' : '#52c41a' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Tabs
        defaultActiveKey="price"
        items={[
          {
            key: 'price',
            label: (
              <span>
                <LineChartOutlined />
                价格走势
              </span>
            ),
            children: (
              <Card>
                <Title level={4}>价格走势对比</Title>
                <ResponsiveContainer width="100%" height={400}>
                  {chartType === 'area' ? (
                    <AreaChart data={combinedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      {selectedAssets.map((assetId, index) => {
                        const asset = assets.find(a => a.id === assetId);
                        return asset ? (
                          <Area
                            key={assetId}
                            type="monotone"
                            dataKey={asset.symbol}
                            stroke={colors[index % colors.length]}
                            fill={colors[index % colors.length]}
                            fillOpacity={0.3}
                            name={asset.symbol}
                          />
                        ) : null;
                      })}
                    </AreaChart>
                  ) : (
                    <LineChart data={combinedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      {selectedAssets.map((assetId, index) => {
                        const asset = assets.find(a => a.id === assetId);
                        return asset ? (
                          <Line
                            key={assetId}
                            type="monotone"
                            dataKey={asset.symbol}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            name={asset.symbol}
                          />
                        ) : null;
                      })}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </Card>
            )
          },
          {
            key: 'distribution',
            label: (
              <span>
                <PieChartOutlined />
                行业分布
              </span>
            ),
            children: (
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="按资产数量分布">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="count"
                          label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(1)}%`}
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="按市值分布">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="marketCap"
                          label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(1)}%`}
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => [`$${value.toFixed(0)}亿`, '市值']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'risk-return',
            label: (
              <span>
                <BarChartOutlined />
                风险收益
              </span>
            ),
            children: (
              <Card>
                <Title level={4}>风险收益散点图</Title>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="risk" 
                      name="风险(波动率)"
                      label={{ value: '风险(波动率)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="return" 
                      name="收益率"
                      label={{ value: '收益率', angle: -90, position: 'insideLeft' }}
                    />
                    <RechartsTooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => [
                        name === 'return' ? `${(value as number * 100).toFixed(2)}%` : `${(value as number * 100).toFixed(2)}%`,
                        name === 'return' ? '年化收益率' : '年化波动率'
                      ]}
                    />
                    <Scatter 
                      name="资产" 
                      data={riskReturnData} 
                      fill="#1890ff"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            )
          },
          {
            key: 'radar',
            label: (
              <span>
                <RiseOutlined />
                综合评价
              </span>
            ),
            children: (
              <Card>
                <Title level={4}>资产综合评价雷达图</Title>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="asset" />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} />
                    <Radar
                      name="流动性"
                      dataKey="流动性"
                      stroke="#1890ff"
                      fill="#1890ff"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="收益性"
                      dataKey="收益性"
                      stroke="#52c41a"
                      fill="#52c41a"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="稳定性"
                      dataKey="稳定性"
                      stroke="#fa8c16"
                      fill="#fa8c16"
                      fillOpacity={0.3}
                    />
                    <Legend />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            )
          }
        ]}
      />
    </div>
  );
};

export default AssetAnalyticsCharts;