import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  Divider,
  Typography,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DollarOutlined,
  SafetyOutlined,
  CalendarOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { 
  InsuranceService, 
  InsuranceAsset, 
  InsuranceAssetType, 
  CreateInsuranceRequest,
  UpdateCashValueRequest,
  InsuranceSummary
} from '../services/insuranceService';
import { PortfolioService, Portfolio } from '../services/portfolioService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface InsuranceManagementProps {}

const InsuranceManagement: React.FC<InsuranceManagementProps> = () => {
  const [insuranceAssets, setInsuranceAssets] = useState<InsuranceAsset[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceAssetType[]>([]);
  const [summary, setSummary] = useState<InsuranceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [cashValueModalVisible, setCashValueModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InsuranceAsset | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  
  const [createForm] = Form.useForm();
  const [cashValueForm] = Form.useForm();

  // 加载数据
  useEffect(() => {
    loadData();
    loadPortfolios();
    loadInsuranceTypes();
    loadSummary();
  }, [selectedPortfolio]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await InsuranceService.getUserInsuranceAssets(selectedPortfolio || undefined);
      setInsuranceAssets(data);
    } catch (error) {
      message.error('加载保险资产失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolios = async () => {
    try {
      const data = await PortfolioService.getPortfolios();
      setPortfolios(data);
    } catch (error) {
      console.error('加载投资组合失败:', error);
    }
  };

  const loadInsuranceTypes = async () => {
    try {
      const data = await InsuranceService.getInsuranceAssetTypes();
      setInsuranceTypes(data);
    } catch (error) {
      console.error('加载保险类型失败:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await InsuranceService.getInsuranceSummary(selectedPortfolio || undefined);
      setSummary(data);
    } catch (error) {
      console.error('加载保险统计失败:', error);
    }
  };

  // 创建保险产品
  const handleCreate = async (values: any) => {
    try {
      const createData: CreateInsuranceRequest = {
        portfolioId: values.portfolioId,
        symbol: values.symbol,
        name: values.name,
        currency: values.currency,
        policyNumber: values.policyNumber,
        insuranceCompany: values.insuranceCompany,
        insuranceType: values.insuranceType,
        coverageAmount: values.coverageAmount,
        coveragePeriod: values.coveragePeriod,
        coverageStartDate: values.coverageStartDate?.format('YYYY-MM-DD'),
        coverageEndDate: values.coverageEndDate?.format('YYYY-MM-DD'),
        premiumAmount: values.premiumAmount,
        premiumFrequency: values.premiumFrequency,
        premiumPeriod: values.premiumPeriod,
        premiumStartDate: values.premiumStartDate?.format('YYYY-MM-DD'),
        premiumEndDate: values.premiumEndDate?.format('YYYY-MM-DD'),
        currentCashValue: values.currentCashValue || 0,
        guaranteedCashValue: values.guaranteedCashValue || 0,
        dividendCashValue: values.dividendCashValue || 0,
        isParticipating: values.isParticipating || false,
        waitingPeriod: values.waitingPeriod || 90,
        beneficiaryInfo: values.beneficiaryInfo && values.beneficiaryInfo.trim() ? 
          (() => {
            try {
              return JSON.parse(values.beneficiaryInfo);
            } catch {
              return undefined;
            }
          })() : undefined,
        metadata: values.metadata && values.metadata.trim() ? 
          (() => {
            try {
              return JSON.parse(values.metadata);
            } catch {
              return undefined;
            }
          })() : undefined
      };

      await InsuranceService.createInsurance(createData);
      message.success('创建保险产品成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      loadData();
      loadSummary();
    } catch (error: any) {
      console.error('创建保险产品失败:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          '创建保险产品失败';
      message.error(errorMessage);
    }
  };

  // 更新现金价值
  const handleUpdateCashValue = async (values: any) => {
    if (!selectedAsset) return;

    try {
      const updateData: UpdateCashValueRequest = {
        guaranteedCashValue: values.guaranteedCashValue,
        dividendCashValue: values.dividendCashValue,
        valuationDate: values.valuationDate?.format('YYYY-MM-DD'),
        notes: values.notes
      };

      await InsuranceService.updateCashValue(selectedAsset.assetId, updateData);
      message.success('更新现金价值成功');
      setCashValueModalVisible(false);
      cashValueForm.resetFields();
      setSelectedAsset(null);
      loadData();
      loadSummary();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '更新现金价值失败');
    }
  };

  // 打开现金价值更新模态框
  const openCashValueModal = (asset: InsuranceAsset) => {
    setSelectedAsset(asset);
    cashValueForm.setFieldsValue({
      guaranteedCashValue: asset.guaranteedCashValue,
      dividendCashValue: asset.dividendCashValue,
      valuationDate: asset.cashValueUpdateDate ? dayjs(asset.cashValueUpdateDate) : dayjs()
    });
    setCashValueModalVisible(true);
  };

  // 查看详情
  const handleViewDetail = (asset: InsuranceAsset) => {
    // 这里可以跳转到详情页面或打开详情模态框
    message.info('详情功能开发中');
  };

  // 表格列定义
  const columns: ColumnsType<InsuranceAsset> = [
    {
      title: '保险产品',
      key: 'product',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.assetName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.policyNumber && `保单号: ${record.policyNumber}`}
          </div>
        </div>
      ),
    },
    {
      title: '保险公司',
      dataIndex: 'insuranceCompany',
      key: 'insuranceCompany',
    },
    {
      title: '保险类型',
      key: 'insuranceType',
      render: (_, record) => (
        <Tag color={InsuranceService.getInsuranceTypeColor(record.insuranceType)}>
          {InsuranceService.formatInsuranceType(record.insuranceType)}
        </Tag>
      ),
    },
    {
      title: '保额',
      key: 'coverageAmount',
      render: (_, record) => (
        <Statistic
          value={record.coverageAmount}
          precision={2}
          suffix={record.currency}
          valueStyle={{ fontSize: '14px' }}
        />
      ),
    },
    {
      title: '保费',
      key: 'premium',
      render: (_, record) => (
        <div>
          <Statistic
            value={record.premiumAmount}
            precision={2}
            suffix={record.currency}
            valueStyle={{ fontSize: '14px' }}
          />
          <div style={{ fontSize: '12px', color: '#666' }}>
            {InsuranceService.formatPremiumFrequency(record.premiumFrequency)}
          </div>
        </div>
      ),
    },
    {
      title: '现金价值',
      key: 'cashValue',
      render: (_, record) => (
        <div>
          <Statistic
            value={record.currentCashValue}
            precision={2}
            suffix={record.currency}
            valueStyle={{ fontSize: '14px', color: record.currentCashValue > 0 ? '#52c41a' : '#666' }}
          />
          {record.cashValueUpdateDate && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              更新: {dayjs(record.cashValueUpdateDate).format('YYYY-MM-DD')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      key: 'policyStatus',
      render: (_, record) => (
        <Tag color={InsuranceService.getPolicyStatusColor(record.policyStatus)}>
          {InsuranceService.formatPolicyStatus(record.policyStatus)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="更新现金价值">
            <Button
              type="link"
              icon={<DollarOutlined />}
              onClick={() => openCashValueModal(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 计算总统计
  const totalStats = summary.reduce(
    (acc, item) => ({
      totalPolicies: acc.totalPolicies + item.totalPolicies,
      totalCoverageAmount: acc.totalCoverageAmount + item.totalCoverageAmount,
      totalCashValue: acc.totalCashValue + item.totalCashValue,
      annualPremiumAmount: acc.annualPremiumAmount + item.annualPremiumAmount,
    }),
    { totalPolicies: 0, totalCoverageAmount: 0, totalCashValue: 0, annualPremiumAmount: 0 }
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SafetyOutlined /> 保险管理
        </Title>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="保单总数"
              value={totalStats.totalPolicies}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总保额"
              value={totalStats.totalCoverageAmount}
              precision={2}
              suffix="CNY"
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总现金价值"
              value={totalStats.totalCashValue}
              precision={2}
              suffix="CNY"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: totalStats.totalCashValue > 0 ? '#52c41a' : '#666' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="年缴保费"
              value={totalStats.annualPremiumAmount}
              precision={2}
              suffix="CNY"
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Select
              placeholder="选择投资组合"
              style={{ width: 200 }}
              value={selectedPortfolio}
              onChange={setSelectedPortfolio}
              allowClear
            >
              {portfolios.map(portfolio => (
                <Option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </Option>
              ))}
            </Select>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            添加保险产品
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={insuranceAssets}
          rowKey="assetId"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 创建保险产品模态框 */}
      <Modal
        title="添加保险产品"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        width={800}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="portfolioId"
                label="投资组合"
                rules={[{ required: true, message: '请选择投资组合' }]}
              >
                <Select placeholder="选择投资组合">
                  {portfolios.map(portfolio => (
                    <Option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="insuranceType"
                label="保险类型"
                rules={[{ required: true, message: '请选择保险类型' }]}
              >
                <Select placeholder="选择保险类型">
                  {insuranceTypes.map(type => (
                    <Option key={type.code} value={type.code}>
                      {type.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="symbol"
                label="产品代码"
                rules={[{ required: true, message: '请输入产品代码' }]}
              >
                <Input placeholder="输入产品代码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }]}
              >
                <Input placeholder="输入产品名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="insuranceCompany"
                label="保险公司"
                rules={[{ required: true, message: '请输入保险公司' }]}
              >
                <Input placeholder="输入保险公司名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="policyNumber"
                label="保单号"
              >
                <Input placeholder="输入保单号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="coverageAmount"
                label="保额"
                rules={[{ required: true, message: '请输入保额' }]}
              >
                <InputNumber
                  placeholder="输入保额"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="premiumAmount"
                label="保费金额"
                rules={[{ required: true, message: '请输入保费金额' }]}
              >
                <InputNumber
                  placeholder="输入保费金额"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="currency"
                label="币种"
                rules={[{ required: true, message: '请选择币种' }]}
                initialValue="CNY"
              >
                <Select>
                  <Option value="CNY">CNY</Option>
                  <Option value="USD">USD</Option>
                  <Option value="HKD">HKD</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="premiumFrequency"
                label="缴费频率"
                rules={[{ required: true, message: '请选择缴费频率' }]}
              >
                <Select placeholder="选择缴费频率">
                  <Option value="MONTHLY">月缴</Option>
                  <Option value="QUARTERLY">季缴</Option>
                  <Option value="ANNUALLY">年缴</Option>
                  <Option value="LUMP_SUM">趸缴</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="coveragePeriod"
                label="保障期限"
              >
                <Input placeholder="如：终身、30年等" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="currentCashValue"
                label="当前现金价值"
              >
                <InputNumber
                  placeholder="输入当前现金价值"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="guaranteedCashValue"
                label="保证现金价值"
              >
                <InputNumber
                  placeholder="输入保证现金价值"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dividendCashValue"
                label="分红现金价值"
              >
                <InputNumber
                  placeholder="输入分红现金价值"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="coverageStartDate"
                label="保障开始日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isParticipating"
                label="是否分红险"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 更新现金价值模态框 */}
      <Modal
        title="更新现金价值"
        open={cashValueModalVisible}
        onCancel={() => {
          setCashValueModalVisible(false);
          cashValueForm.resetFields();
          setSelectedAsset(null);
        }}
        onOk={() => cashValueForm.submit()}
      >
        <Form
          form={cashValueForm}
          layout="vertical"
          onFinish={handleUpdateCashValue}
        >
          <Form.Item
            name="guaranteedCashValue"
            label="保证现金价值"
            rules={[{ required: true, message: '请输入保证现金价值' }]}
          >
            <InputNumber
              placeholder="输入保证现金价值"
              style={{ width: '100%' }}
              min={0}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="dividendCashValue"
            label="分红现金价值"
            rules={[{ required: true, message: '请输入分红现金价值' }]}
          >
            <InputNumber
              placeholder="输入分红现金价值"
              style={{ width: '100%' }}
              min={0}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="valuationDate"
            label="估值日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InsuranceManagement;