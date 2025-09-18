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
  Tag
} from 'antd';
import {
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
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
  ComposedChart
} from 'recharts';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface Transaction {
  id: string;
  portfolioId: string;
  portfolioName: string;
  assetId: string;
  assetName: string;
  assetSymbol: string;
  transactionType: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL' | 'DIVIDEND' | 'INTEREST';
  side: 'LONG' | 'SHORT';
  quantity: number;
  price: number;
  amount: number;
  fee: number;
  executedAt: string;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';
  tags: string[];
}

interface TransactionAnalyticsChartsProps {
  transactions: Transaction[];
  loading?: boolean;
}

interface ChartData {
  date: string;
  buyAmount: number;
  sellAmount: number;
  netAmount: number;
  transactionCount: number;
  cumulativeAmount: number;
  fees: number;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

const TransactionAnalyticsCharts: React.FC<TransactionAnalyticsChartsProps> = ({
  transactions,
  loading = false
}) => {
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('all');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pieData, setPieData] = useState<{
    byType: PieData[];
    byAsset: PieData[];
    byPortfolio: PieData[];
  }>({
    byType: [],
    byAsset: [],
    byPortfolio: []
  });

  // 颜色配置
  const colors = {
    buy: '#52c41a',
    sell: '#ff4d4f',
    net: '#1890ff',
    fees: '#fa8c16',
    cumulative: '#722ed1'
  };

  const typeColors = {
    BUY: '#52c41a',
    SELL: '#ff4d4f',
    DEPOSIT: '#1890ff',
    WITHDRAWAL: '#fa8c16',
    DIVIDEND: '#722ed1',
    INTEREST: '#13c2c2'
  };

  // 处理数据
  useEffect(() => {
    processChartData();
  }, [transactions, timeRange, groupBy, selectedPortfolio]);

  const processChartData = () => {
    let filteredTransactions = transactions.filter(t => t.status === 'EXECUTED');

    // 时间范围筛选
    if (timeRange) {
      filteredTransactions = filteredTransactions.filter(t => {
        const date = dayjs(t.executedAt);
        return date.isAfter(timeRange[0]) && date.isBefore(timeRange[1]);
      });
    }

    // 投资组合筛选
    if (selectedPortfolio !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.portfolioId === selectedPortfolio);
    }

    // 生成时间序列数据
    const timeSeriesData = generateTimeSeriesData(filteredTransactions);
    setChartData(timeSeriesData);

    // 生成饼图数据
    const pieChartData = generatePieChartData(filteredTransactions);
    setPieData(pieChartData);
  };

  const generateTimeSeriesData = (data: Transaction[]): ChartData[] => {
    const groupedData = new Map<string, {
      buyAmount: number;
      sellAmount: number;
      transactionCount: number;
      fees: number;
    }>();

    // 按时间分组
    data.forEach(transaction => {
      const date = dayjs(transaction.executedAt);
      let key: string;

      switch (groupBy) {
        case 'day':
          key = date.format('YYYY-MM-DD');
          break;
        case 'week':
          key = date.startOf('week').format('YYYY-MM-DD');
          break;
        case 'month':
          key = date.format('YYYY-MM');
          break;
        default:
          key = date.format('YYYY-MM-DD');
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, {
          buyAmount: 0,
          sellAmount: 0,
          transactionCount: 0,
          fees: 0
        });
      }

      const group = groupedData.get(key)!;
      group.transactionCount++;
      group.fees += transaction.fee;

      if (transaction.transactionType === 'BUY' || transaction.transactionType === 'DEPOSIT') {
        group.buyAmount += transaction.amount;
      } else if (transaction.transactionType === 'SELL' || transaction.transactionType === 'WITHDRAWAL') {
        group.sellAmount += transaction.amount;
      }
    });

    // 转换为图表数据
    const result: ChartData[] = [];
    let cumulativeAmount = 0;

    Array.from(groupedData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, data]) => {
        const netAmount = data.buyAmount - data.sellAmount;
        cumulativeAmount += netAmount;

        result.push({
          date,
          buyAmount: data.buyAmount,
          sellAmount: data.sellAmount,
          netAmount,
          transactionCount: data.transactionCount,
          cumulativeAmount,
          fees: data.fees
        });
      });

    return result;
  };

  const generatePieChartData = (data: Transaction[]) => {
    // 按交易类型分组
    const byType = new Map<string, number>();
    const byAsset = new Map<string, number>();
    const byPortfolio = new Map<string, number>();

    data.forEach(transaction => {
      // 交易类型
      const type = transaction.transactionType;
      byType.set(type, (byType.get(type) || 0) + transaction.amount);

      // 资产
      const asset = transaction.assetSymbol;
      byAsset.set(asset, (byAsset.get(asset) || 0) + transaction.amount);

      // 投资组合
      const portfolio = transaction.portfolioName;
      byPortfolio.set(portfolio, (byPortfolio.get(portfolio) || 0) + transaction.amount);
    });

    const convertToPieData = (map: Map<string, number>, colorMap?: Record<string, string>): PieData[] => {
      return Array.from(map.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8) // 只显示前8个
        .map(([name, value], index) => ({
          name,
          value,
          color: colorMap?.[name] || `hsl(${(index * 45) % 360}, 70%, 50%)`
        }));
    };

    return {
      byType: convertToPieData(byType, typeColors),
      byAsset: convertToPieData(byAsset),
      byPortfolio: convertToPieData(byPortfolio)
    };
  };

  // 计算统计数据
  const getStatistics = () => {
    let filteredTransactions = transactions.filter(t => t.status === 'EXECUTED');

    if (timeRange) {
      filteredTransactions = filteredTransactions.filter(t => {
        const date = dayjs(t.executedAt);
        return date.isAfter(timeRange[0]) && date.isBefore(timeRange[1]);
      });
    }

    if (selectedPortfolio !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.portfolioId === selectedPortfolio);
    }

    const totalTransactions = filteredTransactions.length;
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalFees = filteredTransactions.reduce((sum, t) => sum + t.fee, 0);
    const buyAmount = filteredTransactions
      .filter(t => t.transactionType === 'BUY' || t.transactionType === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0);
    const sellAmount = filteredTransactions
      .filter(t => t.transactionType === 'SELL' || t.transactionType === 'WITHDRAWAL')
      .reduce((sum, t) => sum + t.amount, 0);
    const netAmount = buyAmount - sellAmount;

    return {
      totalTransactions,
      totalAmount,
      totalFees,
      buyAmount,
      sellAmount,
      netAmount
    };
  };

  const statistics = getStatistics();
  const portfolios = Array.from(new Set(transactions.map(t => ({ id: t.portfolioId, name: t.portfolioName }))));

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{`日期: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color }}>
              {`${entry.name}: ¥${entry.value.toLocaleString()}`}
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
              <Text strong>分组:</Text>
              <Select value={groupBy} onChange={setGroupBy} style={{ width: 80 }}>
                <Option value="day">日</Option>
                <Option value="week">周</Option>
                <Option value="month">月</Option>
              </Select>
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>投资组合:</Text>
              <Select value={selectedPortfolio} onChange={setSelectedPortfolio} style={{ width: 150 }}>
                <Option value="all">全部</Option>
                {portfolios.map(p => (
                  <Option key={p.id} value={p.id}>{p.name}</Option>
                ))}
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
              title="交易笔数"
              value={statistics.totalTransactions}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总交易额"
              value={statistics.totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="买入金额"
              value={statistics.buyAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: colors.buy }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="卖出金额"
              value={statistics.sellAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: colors.sell }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="净流入"
              value={statistics.netAmount}
              precision={2}
              prefix={statistics.netAmount >= 0 ? "+" : ""}
              suffix="¥"
              valueStyle={{ 
                color: statistics.netAmount >= 0 ? colors.buy : colors.sell 
              }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总手续费"
              value={statistics.totalFees}
              precision={2}
              prefix="¥"
              valueStyle={{ color: colors.fees }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Tabs
        defaultActiveKey="trend"
        items={[
          {
            key: 'trend',
            label: (
              <span>
                <LineChartOutlined />
                交易趋势
              </span>
            ),
            children: (
              <Card>
                <Title level={4}>交易金额趋势</Title>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="amount" orientation="left" />
                    <YAxis yAxisId="count" orientation="right" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="amount"
                      type="monotone"
                      dataKey="buyAmount"
                      stackId="1"
                      stroke={colors.buy}
                      fill={colors.buy}
                      fillOpacity={0.6}
                      name="买入金额"
                    />
                    <Area
                      yAxisId="amount"
                      type="monotone"
                      dataKey="sellAmount"
                      stackId="2"
                      stroke={colors.sell}
                      fill={colors.sell}
                      fillOpacity={0.6}
                      name="卖出金额"
                    />
                    <Line
                      yAxisId="amount"
                      type="monotone"
                      dataKey="cumulativeAmount"
                      stroke={colors.cumulative}
                      strokeWidth={2}
                      name="累计净额"
                    />
                    <Bar
                      yAxisId="count"
                      dataKey="transactionCount"
                      fill={colors.net}
                      fillOpacity={0.3}
                      name="交易笔数"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            )
          },
          {
            key: 'distribution',
            label: (
              <span>
                <PieChartOutlined />
                分布分析
              </span>
            ),
            children: (
              <Row gutter={16}>
                <Col span={8}>
                  <Card title="按交易类型分布">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData.byType}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        >
                          {pieData.byType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => [`¥${value.toLocaleString()}`, '金额']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="按资产分布">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData.byAsset}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        >
                          {pieData.byAsset.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => [`¥${value.toLocaleString()}`, '金额']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="按投资组合分布">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData.byPortfolio}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        >
                          {pieData.byPortfolio.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => [`¥${value.toLocaleString()}`, '金额']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'fees',
            label: (
              <span>
                <DollarOutlined />
                费用分析
              </span>
            ),
            children: (
              <Card>
                <Title level={4}>手续费趋势</Title>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value: number) => [`¥${value.toFixed(2)}`, '手续费']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="fees"
                      stroke={colors.fees}
                      fill={colors.fees}
                      fillOpacity={0.6}
                      name="手续费"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            )
          }
        ]}
      />
    </div>
  );
};

export default TransactionAnalyticsCharts;