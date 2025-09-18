import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tabs,
  Table,
  Button,
  DatePicker,
  Select,
  Statistic,
  Tag,
  Space,
  Typography,
  Empty,
  Alert
} from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';


const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

// 类型定义
interface QuarterlyReport {
  id: string;
  quarter: string;
  year: number;
  totalAssets: number;
  totalReturn: number;
  returnRate: number;
  portfolioCount: number;
  transactionCount: number;
  createdAt: string;
  status: 'completed' | 'generating' | 'failed';
}

interface IRRAnalysis {
  portfolioId: string;
  portfolioName: string;
  irr: number;
  npv: number;
  totalInvestment: number;
  currentValue: number;
  period: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface CustomReport {
  id: string;
  name: string;
  type: 'portfolio' | 'transaction' | 'performance' | 'risk';
  dateRange: [string, string];
  filters: Record<string, any>;
  createdAt: string;
  lastRun: string;
}

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [quarterlyReports, setQuarterlyReports] = useState<QuarterlyReport[]>([]);
  const [irrAnalysis, setIrrAnalysis] = useState<IRRAnalysis[]>([]);
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('2024Q3');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('all');

  // 模拟数据
  useEffect(() => {
    setQuarterlyReports([
      {
        id: '1',
        quarter: 'Q3',
        year: 2024,
        totalAssets: 1234567.89,
        totalReturn: 234567.89,
        returnRate: 23.46,
        portfolioCount: 3,
        transactionCount: 45,
        createdAt: '2024-09-15',
        status: 'completed'
      },
      {
        id: '2',
        quarter: 'Q2',
        year: 2024,
        totalAssets: 1000000.00,
        totalReturn: 150000.00,
        returnRate: 17.65,
        portfolioCount: 2,
        transactionCount: 32,
        createdAt: '2024-06-30',
        status: 'completed'
      },
      {
        id: '3',
        quarter: 'Q1',
        year: 2024,
        totalAssets: 850000.00,
        totalReturn: 85000.00,
        returnRate: 11.11,
        portfolioCount: 2,
        transactionCount: 28,
        createdAt: '2024-03-31',
        status: 'completed'
      }
    ]);

    setIrrAnalysis([
      {
        portfolioId: '1',
        portfolioName: '核心投资组合',
        irr: 18.5,
        npv: 125000.00,
        totalInvestment: 500000.00,
        currentValue: 625000.00,
        period: '2年3个月',
        riskLevel: 'medium'
      },
      {
        portfolioId: '2',
        portfolioName: '稳健增长组合',
        irr: 12.3,
        npv: 85000.00,
        totalInvestment: 400000.00,
        currentValue: 485000.00,
        period: '1年8个月',
        riskLevel: 'low'
      },
      {
        portfolioId: '3',
        portfolioName: '高风险投资组合',
        irr: 25.7,
        npv: 45000.00,
        totalInvestment: 150000.00,
        currentValue: 195000.00,
        period: '10个月',
        riskLevel: 'high'
      }
    ]);

    setCustomReports([
      {
        id: '1',
        name: '月度投资组合表现报告',
        type: 'portfolio',
        dateRange: ['2024-08-01', '2024-08-31'],
        filters: { portfolioIds: ['1', '2'] },
        createdAt: '2024-08-15',
        lastRun: '2024-09-01'
      },
      {
        id: '2',
        name: '交易手续费分析报告',
        type: 'transaction',
        dateRange: ['2024-01-01', '2024-08-31'],
        filters: { transactionTypes: ['buy', 'sell'] },
        createdAt: '2024-07-20',
        lastRun: '2024-08-31'
      }
    ]);
  }, []);

  // 季度报表列定义
  const quarterlyColumns: ColumnsType<QuarterlyReport> = [
    {
      title: '报告期',
      dataIndex: 'quarter',
      key: 'quarter',
      render: (quarter, record) => `${record.year}年${quarter}`
    },
    {
      title: '总资产',
      dataIndex: 'totalAssets',
      key: 'totalAssets',
      render: (value) => `¥${value.toLocaleString()}`
    },
    {
      title: '总收益',
      dataIndex: 'totalReturn',
      key: 'totalReturn',
      render: (value) => (
        <Text type={value >= 0 ? 'success' : 'danger'}>
          {value >= 0 ? '+' : ''}¥{value.toLocaleString()}
        </Text>
      )
    },
    {
      title: '收益率',
      dataIndex: 'returnRate',
      key: 'returnRate',
      render: (value) => (
        <Text type={value >= 0 ? 'success' : 'danger'}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
        </Text>
      )
    },
    {
      title: '投资组合数',
      dataIndex: 'portfolioCount',
      key: 'portfolioCount'
    },
    {
      title: '交易笔数',
      dataIndex: 'transactionCount',
      key: 'transactionCount'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          completed: { color: 'success', text: '已完成' },
          generating: { color: 'processing', text: '生成中' },
          failed: { color: 'error', text: '失败' }
        };
        const { color, text } = statusMap[status as keyof typeof statusMap];
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<FileTextOutlined />}
            onClick={() => handleViewReport(record.id)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadReport(record.id)}
          >
            下载
          </Button>
        </Space>
      )
    }
  ];

  // IRR分析列定义
  const irrColumns: ColumnsType<IRRAnalysis> = [
    {
      title: '投资组合',
      dataIndex: 'portfolioName',
      key: 'portfolioName'
    },
    {
      title: 'IRR',
      dataIndex: 'irr',
      key: 'irr',
      render: (value) => (
        <Text type={value >= 15 ? 'success' : value >= 10 ? 'warning' : 'danger'}>
          {value.toFixed(2)}%
        </Text>
      ),
      sorter: (a, b) => a.irr - b.irr
    },
    {
      title: 'NPV',
      dataIndex: 'npv',
      key: 'npv',
      render: (value) => (
        <Text type={value >= 0 ? 'success' : 'danger'}>
          {value >= 0 ? '+' : ''}¥{value.toLocaleString()}
        </Text>
      )
    },
    {
      title: '投资金额',
      dataIndex: 'totalInvestment',
      key: 'totalInvestment',
      render: (value) => `¥${value.toLocaleString()}`
    },
    {
      title: '当前价值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      render: (value) => `¥${value.toLocaleString()}`
    },
    {
      title: '投资期间',
      dataIndex: 'period',
      key: 'period'
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (level) => {
        const levelMap = {
          low: { color: 'success', text: '低风险' },
          medium: { color: 'warning', text: '中风险' },
          high: { color: 'error', text: '高风险' }
        };
        const { color, text } = levelMap[level as keyof typeof levelMap];
        return <Tag color={color}>{text}</Tag>;
      }
    }
  ];

  // 自定义报表列定义
  const customReportColumns: ColumnsType<CustomReport> = [
    {
      title: '报表名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          portfolio: '投资组合',
          transaction: '交易记录',
          performance: '绩效分析',
          risk: '风险分析'
        };
        return typeMap[type as keyof typeof typeMap];
      }
    },
    {
      title: '日期范围',
      dataIndex: 'dateRange',
      key: 'dateRange',
      render: (range) => `${range[0]} 至 ${range[1]}`
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '最后运行',
      dataIndex: 'lastRun',
      key: 'lastRun'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link"
            onClick={() => handleRunCustomReport(record.id)}
          >
            运行
          </Button>
          <Button 
            type="link"
            onClick={() => handleEditCustomReport(record.id)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger
            onClick={() => handleDeleteCustomReport(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  // 事件处理函数
  const handleViewReport = (reportId: string) => {
    console.log('查看报告:', reportId);
  };

  const handleDownloadReport = (reportId: string) => {
    console.log('下载报告:', reportId);
  };

  const handleGenerateQuarterlyReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('生成季度报告');
    }, 2000);
  };

  const handleRunCustomReport = (reportId: string) => {
    console.log('运行自定义报告:', reportId);
  };

  const handleEditCustomReport = (reportId: string) => {
    console.log('编辑自定义报告:', reportId);
  };

  const handleDeleteCustomReport = (reportId: string) => {
    console.log('删除自定义报告:', reportId);
  };

  const handleCreateCustomReport = () => {
    console.log('创建自定义报告');
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BarChartOutlined style={{ marginRight: '8px' }} />
          报表中心
        </Title>
        <Paragraph type="secondary">
          查看和管理投资组合报表，包括季度报表、IRR分析和自定义报表
        </Paragraph>
      </div>

      <Tabs defaultActiveKey="quarterly" size="large">
        <TabPane 
          tab={
            <span>
              <CalendarOutlined />
              季度报表
            </span>
          } 
          key="quarterly"
        >
          <Card>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Select
                  value={selectedQuarter}
                  onChange={setSelectedQuarter}
                  style={{ width: 120 }}
                >
                  <Option value="2024Q3">2024 Q3</Option>
                  <Option value="2024Q2">2024 Q2</Option>
                  <Option value="2024Q1">2024 Q1</Option>
                </Select>
                <Button 
                  type="primary" 
                  icon={<FileTextOutlined />}
                  loading={loading}
                  onClick={handleGenerateQuarterlyReport}
                >
                  生成报告
                </Button>
              </Space>
            </div>

            {/* 季度概览统计 */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="总资产"
                    value={1234567.89}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="总收益"
                    value={234567.89}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="收益率"
                    value={23.46}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="投资组合"
                    value={3}
                    suffix="个"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <Table
              columns={quarterlyColumns}
              dataSource={quarterlyReports}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <RiseOutlined />
              IRR分析
            </span>
          } 
          key="irr"
        >
          <Card>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Select
                  value={selectedPortfolio}
                  onChange={setSelectedPortfolio}
                  style={{ width: 200 }}
                >
                  <Option value="all">全部投资组合</Option>
                  <Option value="1">核心投资组合</Option>
                  <Option value="2">稳健增长组合</Option>
                  <Option value="3">高风险投资组合</Option>
                </Select>
                <RangePicker />
                <Button type="primary">
                  重新计算
                </Button>
              </Space>
            </div>

            <Alert
              message="IRR计算说明"
              description="内部收益率(IRR)是使净现值(NPV)等于零的折现率，反映投资项目的实际收益水平。"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Table
              columns={irrColumns}
              dataSource={irrAnalysis}
              rowKey="portfolioId"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <PieChartOutlined />
              自定义报表
            </span>
          } 
          key="custom"
        >
          <Card>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>自定义报表</Title>
              <Button 
                type="primary" 
                onClick={handleCreateCustomReport}
              >
                创建报表
              </Button>
            </div>

            {customReports.length > 0 ? (
              <Table
                columns={customReportColumns}
                dataSource={customReports}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Empty 
                description="暂无自定义报表"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={handleCreateCustomReport}>
                  创建第一个报表
                </Button>
              </Empty>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ReportsPage;