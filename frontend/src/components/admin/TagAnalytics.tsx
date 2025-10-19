import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Select,
  DatePicker,
  Button,
  Tooltip,
  Typography,
  List,
  Avatar,
  Empty,
  Spin
} from 'antd';
import {
  TagOutlined,
  RiseOutlined,
  PieChartOutlined,
  BarChartOutlined,
  FolderOutlined,
  FireOutlined,
  ClockCircleOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { Column, Pie, Line } from '@ant-design/plots';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

interface TagUsageData {
  tagId: string;
  tagName: string;
  tagColor: string;
  categoryName?: string;
  totalUsage: number;
  portfolioCount: number;
  transactionCount: number;
  assetCount: number;
  recentUsage: number;
  growthRate: number;
}

interface CategoryUsageData {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  tagCount: number;
  totalUsage: number;
  usageRate: number;
}

interface UsageTrendData {
  date: string;
  count: number;
  type: string;
}

interface TagAnalyticsProps {
  dateRange?: [string, string];
  onDateRangeChange?: (range: [string, string] | null) => void;
}

const TagAnalytics: React.FC<TagAnalyticsProps> = ({
  dateRange,
  onDateRangeChange
}) => {
  const [loading, setLoading] = useState(false);
  const [tagUsageData, setTagUsageData] = useState<TagUsageData[]>([]);
  const [categoryUsageData, setCategoryUsageData] = useState<CategoryUsageData[]>([]);
  const [usageTrendData, setUsageTrendData] = useState<UsageTrendData[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalTags: 0,
    totalCategories: 0,
    totalUsage: 0,
    activeUsers: 0,
    averageTagsPerEntity: 0,
    mostUsedTag: null as TagUsageData | null
  });

  const [selectedMetric, setSelectedMetric] = useState<'usage' | 'growth' | 'distribution'>('usage');
  const [selectedEntityType, setSelectedEntityType] = useState<'all' | 'portfolio' | 'transaction' | 'asset'>('all');

  // 加载标签使用统计
  const loadTagUsageStats = async () => {
    try {
      setLoading(true);
      
      // 模拟API调用 - 实际应该调用后端API
      const mockTagUsageData: TagUsageData[] = [
        {
          tagId: '1',
          tagName: '高风险',
          tagColor: '#ff4d4f',
          categoryName: '风险等级',
          totalUsage: 156,
          portfolioCount: 45,
          transactionCount: 89,
          assetCount: 22,
          recentUsage: 23,
          growthRate: 15.2
        },
        {
          tagId: '2',
          tagName: '长期投资',
          tagColor: '#52c41a',
          categoryName: '投资策略',
          totalUsage: 134,
          portfolioCount: 67,
          transactionCount: 45,
          assetCount: 22,
          recentUsage: 18,
          growthRate: 8.7
        },
        {
          tagId: '3',
          tagName: '科技股',
          tagColor: '#1890ff',
          categoryName: '行业分类',
          totalUsage: 98,
          portfolioCount: 34,
          transactionCount: 56,
          assetCount: 8,
          recentUsage: 12,
          growthRate: -3.2
        },
        {
          tagId: '4',
          tagName: '定投',
          tagColor: '#722ed1',
          categoryName: '投资方式',
          totalUsage: 87,
          portfolioCount: 23,
          transactionCount: 64,
          assetCount: 0,
          recentUsage: 15,
          growthRate: 22.1
        },
        {
          tagId: '5',
          tagName: '美股',
          tagColor: '#fa8c16',
          categoryName: '市场分类',
          totalUsage: 76,
          portfolioCount: 28,
          transactionCount: 38,
          assetCount: 10,
          recentUsage: 9,
          growthRate: 5.3
        }
      ];

      const mockCategoryUsageData: CategoryUsageData[] = [
        {
          categoryId: '1',
          categoryName: '风险等级',
          categoryColor: '#ff4d4f',
          tagCount: 5,
          totalUsage: 234,
          usageRate: 28.5
        },
        {
          categoryId: '2',
          categoryName: '投资策略',
          categoryColor: '#52c41a',
          tagCount: 8,
          totalUsage: 198,
          usageRate: 24.1
        },
        {
          categoryId: '3',
          categoryName: '行业分类',
          categoryColor: '#1890ff',
          tagCount: 12,
          totalUsage: 156,
          usageRate: 19.0
        },
        {
          categoryId: '4',
          categoryName: '投资方式',
          categoryColor: '#722ed1',
          tagCount: 6,
          totalUsage: 123,
          usageRate: 15.0
        },
        {
          categoryId: '5',
          categoryName: '市场分类',
          categoryColor: '#fa8c16',
          tagCount: 9,
          totalUsage: 110,
          usageRate: 13.4
        }
      ];

      const mockUsageTrendData: UsageTrendData[] = [];
      const startDate = dayjs().subtract(30, 'day');
      for (let i = 0; i < 30; i++) {
        const date = startDate.add(i, 'day').format('YYYY-MM-DD');
        mockUsageTrendData.push(
          { date, count: Math.floor(Math.random() * 20) + 5, type: '投资组合' },
          { date, count: Math.floor(Math.random() * 30) + 10, type: '交易记录' },
          { date, count: Math.floor(Math.random() * 10) + 2, type: '资产' }
        );
      }

      setTagUsageData(mockTagUsageData);
      setCategoryUsageData(mockCategoryUsageData);
      setUsageTrendData(mockUsageTrendData);
      
      setOverallStats({
        totalTags: 45,
        totalCategories: 8,
        totalUsage: 821,
        activeUsers: 156,
        averageTagsPerEntity: 2.3,
        mostUsedTag: mockTagUsageData[0]
      });

    } catch (error) {
      console.error('Failed to load tag usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 导出数据
  const handleExportData = () => {
    const data = {
      tagUsage: tagUsageData,
      categoryUsage: categoryUsageData,
      usageTrend: usageTrendData,
      overallStats,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tag-analytics-${dayjs().format('YYYY-MM-DD')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 标签使用排行表格列
  const tagUsageColumns: ColumnsType<TagUsageData> = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_, __, index) => (
        <span style={{ fontWeight: 'bold' }}>#{index + 1}</span>
      )
    },
    {
      title: '标签',
      key: 'tag',
      render: (_, record) => (
        <Space>
          <Tag color={record.tagColor}>
            {record.tagName}
          </Tag>
          {record.categoryName && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.categoryName}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '总使用次数',
      dataIndex: 'totalUsage',
      key: 'totalUsage',
      sorter: (a, b) => a.totalUsage - b.totalUsage,
      render: (count) => (
        <Statistic
          value={count}
          valueStyle={{ fontSize: '14px' }}
        />
      )
    },
    {
      title: '分布情况',
      key: 'distribution',
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <Text style={{ fontSize: '12px' }}>投资组合: </Text>
            <Text strong>{record.portfolioCount}</Text>
          </div>
          <div>
            <Text style={{ fontSize: '12px' }}>交易记录: </Text>
            <Text strong>{record.transactionCount}</Text>
          </div>
          <div>
            <Text style={{ fontSize: '12px' }}>资产: </Text>
            <Text strong>{record.assetCount}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '增长率',
      dataIndex: 'growthRate',
      key: 'growthRate',
      sorter: (a, b) => a.growthRate - b.growthRate,
      render: (rate) => (
        <Space>
          <RiseOutlined
            style={{
              color: rate > 0 ? '#52c41a' : rate < 0 ? '#ff4d4f' : '#999'
            }}
          />
          <Text
            style={{
              color: rate > 0 ? '#52c41a' : rate < 0 ? '#ff4d4f' : '#999'
            }}
          >
            {rate > 0 ? '+' : ''}{rate.toFixed(1)}%
          </Text>
        </Space>
      )
    }
  ];

  // 柱状图配置
  const columnConfig = {
    data: tagUsageData.slice(0, 10),
    xField: 'tagName',
    yField: selectedMetric === 'usage' ? 'totalUsage' : 
           selectedMetric === 'growth' ? 'growthRate' : 'recentUsage',
    colorField: 'tagColor',
    color: (datum: TagUsageData) => datum.tagColor,
    label: {
      position: 'middle' as const,
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      tagName: {
        alias: '标签名称',
      },
      totalUsage: {
        alias: '使用次数',
      },
      growthRate: {
        alias: '增长率(%)',
      },
      recentUsage: {
        alias: '近期使用',
      },
    },
  };

  // 饼图配置
  const pieConfig = {
    data: categoryUsageData,
    angleField: 'totalUsage',
    colorField: 'categoryName',
    color: (datum: CategoryUsageData) => datum.categoryColor,
    radius: 0.8,
    label: {
      type: 'outer' as const,
      content: '{name} {percentage}',
    },
    interactions: [
      {
        type: 'element-active' as const,
      },
    ],
  };

  // 趋势图配置
  const lineConfig = {
    data: usageTrendData,
    xField: 'date',
    yField: 'count',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in' as const,
        duration: 1000,
      },
    },
  };

  useEffect(() => {
    loadTagUsageStats();
  }, [dateRange, selectedEntityType]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* 控制面板 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space wrap>
              <RangePicker
                value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    onDateRangeChange?.([
                      dates[0].format('YYYY-MM-DD'),
                      dates[1].format('YYYY-MM-DD')
                    ]);
                  } else {
                    onDateRangeChange?.(null);
                  }
                }}
                placeholder={['开始日期', '结束日期']}
              />
              <Select
                value={selectedEntityType}
                onChange={setSelectedEntityType}
                style={{ width: 120 }}
              >
                <Option value="all">全部</Option>
                <Option value="portfolio">投资组合</Option>
                <Option value="transaction">交易记录</Option>
                <Option value="asset">资产</Option>
              </Select>
              <Select
                value={selectedMetric}
                onChange={setSelectedMetric}
                style={{ width: 120 }}
              >
                <Option value="usage">使用次数</Option>
                <Option value="growth">增长率</Option>
                <Option value="distribution">分布情况</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExportData}
            >
              导出数据
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 概览统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总标签数"
              value={overallStats.totalTags}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="标签分类"
              value={overallStats.totalCategories}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总使用次数"
              value={overallStats.totalUsage}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均标签数"
              value={overallStats.averageTagsPerEntity}
              precision={1}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title="标签使用趋势" extra={<ClockCircleOutlined />}>
            <Line {...lineConfig} height={300} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="分类使用分布" extra={<PieChartOutlined />}>
            <Pie {...pieConfig} height={300} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="标签使用排行" extra={<BarChartOutlined />}>
            <Column {...columnConfig} height={400} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="热门标签详情">
            <Table
              columns={tagUsageColumns}
              dataSource={tagUsageData.slice(0, 10)}
              rowKey="tagId"
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 分类使用情况 */}
      <Card title="分类使用详情" style={{ marginTop: 16 }}>
        <List
          grid={{ gutter: 16, column: 4 }}
          dataSource={categoryUsageData}
          renderItem={(category) => (
            <List.Item>
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar
                      style={{ backgroundColor: category.categoryColor }}
                      icon={<FolderOutlined />}
                    />
                    <Title level={5} style={{ margin: '8px 0 4px' }}>
                      {category.categoryName}
                    </Title>
                  </div>
                  <Statistic
                    title="标签数量"
                    value={category.tagCount}
                    valueStyle={{ fontSize: '16px' }}
                  />
                  <Statistic
                    title="使用次数"
                    value={category.totalUsage}
                    valueStyle={{ fontSize: '16px' }}
                  />
                  <Progress
                    percent={category.usageRate}
                    size="small"
                    strokeColor={category.categoryColor}
                  />
                </Space>
              </Card>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default TagAnalytics;