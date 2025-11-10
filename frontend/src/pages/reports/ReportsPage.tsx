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
  Alert,
  message,
  Modal,
  Form,
  Input,
  Popconfirm
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
import {
  getQuarterlyReports,
  getQuarterlySummary,
  generateQuarterlyReport,
  getIRRAnalysis,
  recalculateIRR,
  getCustomReports,
  createCustomReport,
  runCustomReport,
  updateCustomReport,
  deleteCustomReport,
  downloadReport,
  getReportDetails,
  type QuarterlyReport,
  type IRRAnalysis,
  type CustomReport,
  type QuarterlySummary
} from '../../services/reportsApi';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const ReportsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [quarterlyReports, setQuarterlyReports] = useState<QuarterlyReport[]>([]);
  const [irrAnalysis, setIrrAnalysis] = useState<IRRAnalysis[]>([]);
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedQuarterNum, setSelectedQuarterNum] = useState<string>('Q1');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('all');
  const [quarterlySummary, setQuarterlySummary] = useState<QuarterlySummary>({
    totalAssets: 0,
    totalReturn: 0,
    returnRate: 0,
    portfolioCount: 0
  });
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null);
  const [reportModalLoading, setReportModalLoading] = useState(false);

  // 加载数据
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [quarterlyData, irrData, customData, summaryData] = await Promise.all([
        getQuarterlyReports(),
        getIRRAnalysis(),
        getCustomReports(),
        getQuarterlySummary(`${selectedYear}${selectedQuarterNum}`)
      ]);
      
      setQuarterlyReports(quarterlyData);
      setIrrAnalysis(irrData);
      setCustomReports(customData);
      setQuarterlySummary(summaryData);
    } catch (error) {
      message.error('加载报表数据失败');
      console.error('加载报表数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 当选择的年份或季度改变时，重新加载概览数据
  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summaryData = await getQuarterlySummary(`${selectedYear}${selectedQuarterNum}`);
        setQuarterlySummary(summaryData);
      } catch (error) {
        console.error('加载季度概览失败:', error);
      }
    };
    loadSummary();
  }, [selectedYear, selectedQuarterNum]);

  // 当选择的投资组合改变时，重新加载IRR数据
  useEffect(() => {
    const loadIRR = async () => {
      try {
        const irrData = await getIRRAnalysis(selectedPortfolio);
        setIrrAnalysis(irrData);
      } catch (error) {
        console.error('加载IRR数据失败:', error);
      }
    };
    loadIRR();
  }, [selectedPortfolio]);

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
  const handleViewReport = async (reportId: string) => {
    try {
      const reportData = await getReportDetails(reportId, 'quarterly');
      console.log('报告详情:', reportData);
      message.success('报告加载成功');
    } catch (error) {
      message.error('查看报告失败');
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const blob = await downloadReport(reportId, 'quarterly');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quarterly-report-${reportId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('报告下载成功');
    } catch (error) {
      message.error('下载报告失败');
    }
  };

  const handleGenerateQuarterlyReport = async () => {
    setLoading(true);
    try {
      const quarter = `${selectedYear}${selectedQuarterNum}`;
      const result = await generateQuarterlyReport(quarter);
      if (result.success) {
        message.success('季度报告生成成功');
        // 重新加载季度报表列表
        const quarterlyData = await getQuarterlyReports();
        setQuarterlyReports(quarterlyData);
      } else {
        message.error('生成季度报告失败');
      }
    } catch (error) {
      message.error('生成季度报告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCustomReport = async (reportId: string) => {
    try {
      const result = await runCustomReport(reportId);
      if (result.success) {
        message.success('报表运行成功');
        // 重新加载自定义报表列表
        const customData = await getCustomReports();
        setCustomReports(customData);
      } else {
        message.error('运行报表失败');
      }
    } catch (error) {
      message.error('运行报表失败');
    }
  };

  const handleEditCustomReport = (reportId: string) => {
    const report = customReports.find(r => r.id === reportId);
    if (report) {
      setEditingReport(report);
      form.setFieldsValue({
        name: report.name,
        type: report.type,
        dateRange: report.dateRange
      });
      setReportModalVisible(true);
    }
  };

  const handleDeleteCustomReport = async (reportId: string) => {
    try {
      const result = await deleteCustomReport(reportId);
      if (result.success) {
        message.success('删除报表成功');
        // 重新加载自定义报表列表
        const customData = await getCustomReports();
        setCustomReports(customData);
      } else {
        message.error('删除报表失败');
      }
    } catch (error) {
      message.error('删除报表失败');
    }
  };

  const handleCreateCustomReport = () => {
    setEditingReport(null);
    form.resetFields();
    setReportModalVisible(true);
  };

  const handleSaveCustomReport = async (values: any) => {
    try {
      setReportModalLoading(true);
      if (editingReport) {
        // 更新报表
        const result = await updateCustomReport(editingReport.id, {
          name: values.name,
          type: values.type,
          dateRange: values.dateRange,
          filters: {}
        });
        message.success('报表更新成功');
      } else {
        // 创建新报表
        const result = await createCustomReport({
          name: values.name,
          type: values.type,
          dateRange: values.dateRange,
          filters: {}
        });
        message.success('报表创建成功');
      }
      setReportModalVisible(false);
      // 重新加载自定义报表列表
      const customData = await getCustomReports();
      setCustomReports(customData);
    } catch (error) {
      message.error(editingReport ? '更新报表失败' : '创建报表失败');
      console.error('Error saving report:', error);
    } finally {
      setReportModalLoading(false);
    }
  };

  const handleRecalculateIRR = async () => {
    try {
      const irrData = await recalculateIRR(selectedPortfolio);
      setIrrAnalysis(irrData);
      message.success('IRR重新计算完成');
    } catch (error) {
      message.error('IRR计算失败');
    }
  };

  return (
    <>
      <Modal
        title={editingReport ? '编辑自定义报表' : '创建自定义报表'}
        visible={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReportModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={reportModalLoading}
            onClick={() => form.submit()}
          >
            {editingReport ? '更新' : '创建'}
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveCustomReport}
        >
          <Form.Item
            label="报表名称"
            name="name"
            rules={[{ required: true, message: '请输入报表名称' }]}
          >
            <Input placeholder="输入报表名称" />
          </Form.Item>

          <Form.Item
            label="报表类型"
            name="type"
            rules={[{ required: true, message: '请选择报表类型' }]}
          >
            <Select placeholder="选择报表类型">
              <Option value="portfolio">投资组合</Option>
              <Option value="transaction">交易记录</Option>
              <Option value="performance">绩效分析</Option>
              <Option value="risk">风险分析</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="日期范围"
            name="dateRange"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
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
                  value={selectedYear}
                  onChange={setSelectedYear}
                  style={{ width: 100 }}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
                <Select
                  value={selectedQuarterNum}
                  onChange={setSelectedQuarterNum}
                  style={{ width: 80 }}
                >
                  <Option value="Q1">Q1</Option>
                  <Option value="Q2">Q2</Option>
                  <Option value="Q3">Q3</Option>
                  <Option value="Q4">Q4</Option>
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
                    value={quarterlySummary.totalAssets}
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
                    value={quarterlySummary.totalReturn}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: quarterlySummary.totalReturn >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="收益率"
                    value={quarterlySummary.returnRate}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: quarterlySummary.returnRate >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="投资组合"
                    value={quarterlySummary.portfolioCount}
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
                <Button type="primary" onClick={handleRecalculateIRR}>
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
    </>
  );
};

export default ReportsPage;