import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  List,
  Badge,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  SyncOutlined,
  SwapOutlined,
  LockOutlined,
  UnlockOutlined,
  HistoryOutlined,
  GlobalOutlined,
  WalletOutlined,
  TransactionOutlined,
  EyeOutlined
} from '@ant-design/icons';

import { MultiCurrencyCashService, MultiCurrencySummary, MultiCurrencyBalance, MultiCurrencyTransaction, CreateMultiCurrencyTransactionRequest, CurrencyExchangeRequest, FreezeUnfreezeRequest } from '../services/multiCurrencyCashService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface MultiCurrencyCashManagementProps {}

const MultiCurrencyCashManagement: React.FC<MultiCurrencyCashManagementProps> = () => {
  const [summaryData, setSummaryData] = useState<MultiCurrencySummary[]>([]);
  const [balanceData, setBalanceData] = useState<MultiCurrencyBalance[]>([]);
  const [transactionData, setTransactionData] = useState<MultiCurrencyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 选择状态
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  
  // 模态框状态
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [transactionHistoryVisible, setTransactionHistoryVisible] = useState(false);
  
  // 分页状态
  const [transactionPagination, setTransactionPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0
  });
  
  // 表单实例
  const [transactionForm] = Form.useForm();
  const [exchangeForm] = Form.useForm();
  const [freezeForm] = Form.useForm();

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSummary(),
        loadBalances(),
        loadTransactions()
      ]);
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await MultiCurrencyCashService.getMultiCurrencySummary();
      setSummaryData(data);
    } catch (error) {
      console.error('加载多币种概览失败:', error);
    }
  };

  const loadBalances = async () => {
    try {
      // 如果没有选择具体账户，获取所有账户的余额
      const data = await MultiCurrencyCashService.getMultiCurrencyBalances(selectedAccount || undefined);
      console.log('🔍 加载的余额数据:', data);
      console.log('🔍 有余额的账户:', data.filter(b => b.cashBalance > 0));
      setBalanceData(data);
    } catch (error) {
      console.error('加载多币种余额失败:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const { transactions, pagination } = await MultiCurrencyCashService.getMultiCurrencyTransactions(
        selectedAccount || undefined,
        selectedCurrency || undefined,
        transactionPagination.pageSize,
        (transactionPagination.current - 1) * transactionPagination.pageSize
      );
      setTransactionData(transactions);
      setTransactionPagination(prev => ({
        ...prev,
        total: pagination.total
      }));
    } catch (error) {
      console.error('加载多币种交易记录失败:', error);
    }
  };

  // 创建交易
  const handleCreateTransaction = async (values: any) => {
    try {
      const transactionData: CreateMultiCurrencyTransactionRequest = {
        tradingAccountId: values.tradingAccountId,
        transactionType: values.transactionType,
        amount: values.amount,
        currency: values.currency,
        description: values.description
      };

      await MultiCurrencyCashService.createMultiCurrencyTransaction(transactionData);
      message.success('交易创建成功');
      setTransactionModalVisible(false);
      transactionForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.message || '创建交易失败');
    }
  };

  // 货币兑换
  const handleExchange = async (values: any) => {
    try {
      const exchangeData: CurrencyExchangeRequest = {
        tradingAccountId: values.tradingAccountId,
        fromCurrency: values.fromCurrency,
        toCurrency: values.toCurrency,
        fromAmount: values.fromAmount,
        exchangeRate: values.exchangeRate,
        description: values.description
      };

      await MultiCurrencyCashService.exchangeCurrency(exchangeData);
      message.success('货币兑换成功');
      setExchangeModalVisible(false);
      exchangeForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.message || '货币兑换失败');
    }
  };

  // 冻结/解冻资金
  const handleFreeze = async (values: any) => {
    try {
      const freezeData: FreezeUnfreezeRequest = {
        tradingAccountId: values.tradingAccountId,
        currency: values.currency,
        amount: values.amount,
        description: values.description
      };

      if (values.type === 'freeze') {
        await MultiCurrencyCashService.freezeFunds(freezeData);
        message.success('资金冻结成功');
      } else {
        await MultiCurrencyCashService.unfreezeFunds(freezeData);
        message.success('资金解冻成功');
      }

      setFreezeModalVisible(false);
      freezeForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 余额表格列定义
  const balanceColumns = [
    {
      title: '账户名称',
      dataIndex: 'accountName',
      key: 'accountName',
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      render: (currency: string) => (
        <Tag color={MultiCurrencyCashService.getCurrencyColor(currency)}>
          {currency}
        </Tag>
      )
    },
    {
      title: '总余额',
      dataIndex: 'cashBalance',
      key: 'cashBalance',
      render: (amount: number, record: MultiCurrencyBalance) => (
        <Text strong>
          {MultiCurrencyCashService.formatAmount(amount, record.currency)}
        </Text>
      )
    },
    {
      title: '可用余额',
      dataIndex: 'availableBalance',
      key: 'availableBalance',
      render: (amount: number, record: MultiCurrencyBalance) => 
        MultiCurrencyCashService.formatAmount(amount, record.currency)
    },
    {
      title: '冻结余额',
      dataIndex: 'frozenBalance',
      key: 'frozenBalance',
      render: (amount: number, record: MultiCurrencyBalance) => (
        <Text type={amount > 0 ? 'warning' : 'secondary'}>
          {MultiCurrencyCashService.formatAmount(amount, record.currency)}
        </Text>
      )
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: MultiCurrencyBalance) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            icon={<LockOutlined />}
            onClick={() => {
              freezeForm.setFieldsValue({
                tradingAccountId: record.tradingAccountId,
                currency: record.currency,
                type: 'freeze'
              });
              setFreezeModalVisible(true);
            }}
          >
            冻结
          </Button>
          {record.frozenBalance > 0 && (
            <Button 
              type="link" 
              size="small" 
              icon={<UnlockOutlined />}
              onClick={() => {
                freezeForm.setFieldsValue({
                  tradingAccountId: record.tradingAccountId,
                  currency: record.currency,
                  type: 'unfreeze'
                });
                setFreezeModalVisible(true);
              }}
            >
              解冻
            </Button>
          )}
        </Space>
      )
    }
  ];

  // 交易记录表格列定义
  const transactionColumns = [
    {
      title: '交易时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '账户',
      dataIndex: 'accountName',
      key: 'accountName',
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      render: (currency: string) => (
        <Tag color={MultiCurrencyCashService.getCurrencyColor(currency)}>
          {currency}
        </Tag>
      )
    },
    {
      title: '交易类型',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (type: string) => MultiCurrencyCashService.getTransactionTypeName(type)
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: MultiCurrencyTransaction) => (
        <Text strong>
          {MultiCurrencyCashService.formatAmount(amount, record.currency)}
        </Text>
      )
    },
    {
      title: '余额',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      render: (amount: number, record: MultiCurrencyTransaction) => 
        MultiCurrencyCashService.formatAmount(amount, record.currency)
    },
    {
      title: '汇率',
      dataIndex: 'exchangeRate',
      key: 'exchangeRate',
      render: (rate: number) => rate ? rate.toFixed(4) : '-'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <GlobalOutlined style={{ marginRight: 8 }} />
        多币种现金管理
      </Title>

      {/* 多币种概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {summaryData.map((summary, index) => (
          <Col xs={24} sm={12} md={8} key={`${summary.tradingAccountId}-${index}`}>
            <Card 
              style={{ 
                height: '280px',
                display: 'flex',
                flexDirection: 'column'
              }}
              bodyStyle={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: '16px' }}>{summary.accountName}</Text>
                <Badge 
                  count={summary.totalCurrencies} 
                  style={{ backgroundColor: '#52c41a', marginLeft: 8 }}
                  title={`${summary.totalCurrencies} 种币种`}
                />
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <List
                  size="small"
                  dataSource={summary.balances}
                  renderItem={(balance) => (
                    <List.Item 
                      style={{ 
                        padding: '8px 0',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Tag 
                          color={MultiCurrencyCashService.getCurrencyColor(balance.currency)}
                          style={{ minWidth: '50px', textAlign: 'center' }}
                        >
                          {balance.currency}
                        </Tag>
                        <div style={{ textAlign: 'right' }}>
                          <div>
                            <Text strong>
                              {MultiCurrencyCashService.formatAmount(balance.cashBalance, balance.currency)}
                            </Text>
                          </div>
                          {balance.frozenBalance > 0 && (
                            <div>
                              <Text type="warning" style={{ fontSize: '12px' }}>
                                冻结: {MultiCurrencyCashService.formatAmount(balance.frozenBalance, balance.currency)}
                              </Text>
                            </div>
                          )}
                        </div>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs defaultActiveKey="balances">
        <TabPane tab={
          <span>
            <WalletOutlined />
            多币种余额
          </span>
        } key="balances">
          <Card
            title="多币种余额"
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setTransactionModalVisible(true)}
                >
                  创建交易
                </Button>
                <Button
                  type="default"
                  icon={<SwapOutlined />}
                  onClick={() => setExchangeModalVisible(true)}
                >
                  货币兑换
                </Button>
                <Button
                  icon={<SyncOutlined />}
                  onClick={loadData}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            }
          >
            <Table
              columns={balanceColumns}
              dataSource={balanceData}
              rowKey={(record) => `${record.tradingAccountId}-${record.currency}`}
              loading={loading}
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab={
          <span>
            <TransactionOutlined />
            交易记录
          </span>
        } key="transactions">
          <Card title="多币种交易记录">
            <Table
              columns={transactionColumns}
              dataSource={transactionData}
              rowKey="id"
              loading={loading}
              pagination={{
                current: transactionPagination.current,
                pageSize: transactionPagination.pageSize,
                total: transactionPagination.total,
                onChange: (page, pageSize) => {
                  setTransactionPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize || 50
                  }));
                  loadTransactions();
                }
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 创建交易模态框 */}
      <Modal
        title="创建多币种交易"
        open={transactionModalVisible}
        onCancel={() => {
          setTransactionModalVisible(false);
          transactionForm.resetFields();
        }}
        onOk={() => transactionForm.submit()}
        width={600}
      >
        <Form
          form={transactionForm}
          layout="vertical"
          onFinish={handleCreateTransaction}
        >
          <Form.Item
            name="tradingAccountId"
            label="交易账户"
            rules={[{ required: true, message: '请选择交易账户' }]}
          >
            <Select placeholder="选择交易账户">
              {summaryData.map(account => (
                <Option key={account.tradingAccountId} value={account.tradingAccountId}>
                  {account.accountName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="币种"
                rules={[{ required: true, message: '请选择币种' }]}
              >
                <Select placeholder="选择币种">
                  {MultiCurrencyCashService.getSupportedCurrencies().map(currency => (
                    <Option key={currency} value={currency}>
                      <Tag color={MultiCurrencyCashService.getCurrencyColor(currency)}>
                        {currency}
                      </Tag>
                      {MultiCurrencyCashService.getCurrencySymbol(currency)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="transactionType"
                label="交易类型"
                rules={[{ required: true, message: '请选择交易类型' }]}
              >
                <Select placeholder="选择交易类型">
                  <Option value="DEPOSIT">存入</Option>
                  <Option value="WITHDRAW">取出</Option>
                  <Option value="INVESTMENT">投资</Option>
                  <Option value="REDEMPTION">赎回</Option>
                  <Option value="TRANSFER">转账</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="amount"
            label="金额"
            rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入金额"
              precision={2}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              placeholder="请输入交易描述（可选）"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 货币兑换模态框 */}
      <Modal
        title="货币兑换"
        open={exchangeModalVisible}
        onCancel={() => {
          setExchangeModalVisible(false);
          exchangeForm.resetFields();
        }}
        onOk={() => exchangeForm.submit()}
        width={600}
      >
        <Form
          form={exchangeForm}
          layout="vertical"
          onFinish={handleExchange}
        >
          <Form.Item
            name="tradingAccountId"
            label="交易账户"
            rules={[{ required: true, message: '请选择交易账户' }]}
          >
            <Select placeholder="选择交易账户">
              {summaryData.map(account => (
                <Option key={account.tradingAccountId} value={account.tradingAccountId}>
                  {account.accountName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fromCurrency"
                label="源币种"
                rules={[{ required: true, message: '请选择源币种' }]}
              >
                <Select placeholder="选择源币种">
                  {MultiCurrencyCashService.getSupportedCurrencies().map(currency => (
                    <Option key={currency} value={currency}>
                      <Tag color={MultiCurrencyCashService.getCurrencyColor(currency)}>
                        {currency}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="toCurrency"
                label="目标币种"
                rules={[{ required: true, message: '请选择目标币种' }]}
              >
                <Select placeholder="选择目标币种">
                  {MultiCurrencyCashService.getSupportedCurrencies().map(currency => (
                    <Option key={currency} value={currency}>
                      <Tag color={MultiCurrencyCashService.getCurrencyColor(currency)}>
                        {currency}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fromAmount"
                label="兑换金额"
                rules={[
                  { required: true, message: '请输入兑换金额' },
                  { type: 'number', min: 0.01, message: '金额必须大于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入兑换金额"
                  precision={2}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="exchangeRate"
                label="汇率"
                rules={[
                  { required: true, message: '请输入汇率' },
                  { type: 'number', min: 0.0001, message: '汇率必须大于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入汇率"
                  precision={4}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              placeholder="请输入兑换描述（可选）"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 冻结/解冻资金模态框 */}
      <Modal
        title="资金冻结/解冻"
        open={freezeModalVisible}
        onCancel={() => {
          setFreezeModalVisible(false);
          freezeForm.resetFields();
        }}
        onOk={() => freezeForm.submit()}
        width={500}
      >
        <Form
          form={freezeForm}
          layout="vertical"
          onFinish={handleFreeze}
        >
          <Form.Item
            name="type"
            label="操作类型"
            rules={[{ required: true, message: '请选择操作类型' }]}
          >
            <Select placeholder="选择操作类型">
              <Option value="freeze">冻结资金</Option>
              <Option value="unfreeze">解冻资金</Option>
            </Select>
          </Form.Item>

          <Form.Item name="tradingAccountId" style={{ display: 'none' }}>
            <Input />
          </Form.Item>

          <Form.Item name="currency" style={{ display: 'none' }}>
            <Input />
          </Form.Item>

          <Form.Item
            name="amount"
            label="金额"
            rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入金额"
              precision={2}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              placeholder="请输入操作描述（可选）"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MultiCurrencyCashManagement;