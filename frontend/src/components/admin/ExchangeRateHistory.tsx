import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Select,
  Space,
  Button,
  Statistic,
  Row,
  Col,
  Tag,
  Typography,
  Tooltip,
  Empty,
  Spin,
  message
} from 'antd';
import {
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  CalendarOutlined,
  SwapOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Line } from '@ant-design/plots';
import { getExchangeRateHistory, getSupportedCurrencies, ExchangeRate } from '../../services/exchangeRateApi';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;

interface ExchangeRateHistoryProps {
  fromCurrency?: string;
  toCurrency?: string;
}

const ExchangeRateHistory: React.FC<ExchangeRateHistoryProps> = ({
  fromCurrency = 'USD',
  toCurrency = 'CNY'
}) => {
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<ExchangeRate[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedPair, setSelectedPair] = useState(`${fromCurrency}/${toCurrency}`);

  // 获取历史数据
  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const [from, to] = selectedPair.split('/');
      const data = await getExchangeRateHistory({
        fromCurrency: from,
        toCurrency: to,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      });
      
      setHistoryData(data);
    } catch (error) {
      console.error('获取历史数据失败:', error);
      message.error('获取汇率历史数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [dateRange, selectedPair]);

  // 计算统计数据
  const statistics = React.useMemo(() => {
    if (historyData.length === 0) return null;
    
    const rates = historyData.map(item => item.rate);
    const latest = rates[rates.length - 1];
    const previous = rates[rates.length - 2];
    const change = latest - previous;
    const changePercent = (change / previous) * 100;
    
    return {
      latest,
      change,
      changePercent,
      highest: Math.max(...rates),
      lowest: Math.min(...rates),
      average: rates.reduce((sum, rate) => sum + rate, 0) / rates.length
    };
  }, [historyData]);

  // 表格列配置
  const columns: ColumnsType<ExchangeRate> = [
    {
      title: '日期',
      dataIndex: 'rateDate',
      key: 'rateDate',
      sorter: (a, b) => dayjs(a.rateDate).unix() - dayjs(b.rateDate).unix(),
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '货币对',
      key: 'pair',
      render: (record) => `${record.fromCurrency}/${record.toCurrency}`
    },
    {
      title: '汇率',
      dataIndex: 'rate',
      key: 'rate',
      sorter: (a, b) => a.rate - b.rate,
      render: (rate: number) => rate.toFixed(4)
    },
    {
      title: '变化',
      key: 'change',
      render: (record, _, index) => {
        if (index === 0) return '-';
        
        const prevRate = historyData[index - 1]?.rate;
        if (!prevRate) return '-';
        
        const change = record.rate - prevRate;
        const changePercent = (change / prevRate) * 100;
        
        let color = '#666';
        let icon = null;
        
        if (change > 0) {
          color = '#52c41a';
          icon = <RiseOutlined />;
        } else if (change < 0) {
          color = '#ff4d4f';
          icon = <FallOutlined />;
        }
        
        return (
          <Space>
            {icon}
            <span style={{ color }}>
              {change > 0 ? '+' : ''}{change.toFixed(4)} ({changePercent.toFixed(2)}%)
            </span>
          </Space>
        );
      }
    },
    {
      title: '数据源',
      dataIndex: 'source',
      key: 'source'
    }
  ];

  // 图表配置
  const chartConfig = {
    data: historyData.map(item => ({
      date: item.rateDate,
      rate: item.rate
    })),
    xField: 'date',
    yField: 'rate',
    smooth: true,
    point: {
      size: 3,
      shape: 'circle'
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: '汇率',
        value: datum.rate?.toFixed(4)
      })
    },
    xAxis: {
      type: 'time',
      tickCount: 5
    },
    yAxis: {
      label: {
        formatter: (value: string) => Number(value).toFixed(4)
      }
    }
  };

  return (
    <div className="exchange-rate-history">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Space>
                <Select
                  value={selectedPair}
                  onChange={setSelectedPair}
                  style={{ width: 120 }}
                >
                  <Option value="USD/CNY">USD/CNY</Option>
                  <Option value="EUR/CNY">EUR/CNY</Option>
                  <Option value="GBP/CNY">GBP/CNY</Option>
                  <Option value="JPY/CNY">JPY/CNY</Option>
                </Select>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                  format="YYYY-MM-DD"
                />
                <Button 
                  type="primary" 
                  icon={<LineChartOutlined />}
                  onClick={fetchHistoryData}
                  loading={loading}
                >
                  查询
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {statistics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Statistic
                title="最新汇率"
                value={statistics.latest}
                precision={4}
                prefix={statistics.change >= 0 ? <RiseOutlined /> : <FallOutlined />}
                valueStyle={{ 
                  color: statistics.change >= 0 ? '#3f8600' : '#cf1322' 
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="变化幅度"
                value={statistics.changePercent}
                precision={2}
                suffix="%"
                valueStyle={{ 
                  color: statistics.change >= 0 ? '#3f8600' : '#cf1322' 
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最高汇率"
                value={statistics.highest}
                precision={4}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最低汇率"
                value={statistics.lowest}
                precision={4}
              />
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Card title="汇率走势图" size="small">
              {historyData.length > 0 ? (
                <Line {...chartConfig} height={300} />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
        </Row>

        <Card title="历史数据" size="small" style={{ marginTop: 16 }}>
          <Table
            columns={columns}
            dataSource={historyData}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default ExchangeRateHistory;