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
  InputNumber,
  message,
  Statistic,
  Row,
  Col,
  Divider,
  Typography,
  Tabs,
  Empty,
  List,
  Avatar
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  WalletOutlined,
  TransactionOutlined,
  LockOutlined,
  UnlockOutlined,
  HistoryOutlined,
  AccountBookOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { 
  CashService, 
  CashBalance, 
  CashSummary, 
  CashTransaction,
  CreateCashTransactionRequest 
} from '../services/cashService';
import { PortfolioService } from '../services/portfolioService';
import { Portfolio } from '../types/portfolio';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface CashManagementProps {}

const CashManagement: React.FC<CashManagementProps> = () => {
  const [cashSummary, setCashSummary] = useState<CashSummary[]>([]);
  const [cashBalances, setCashBalances] = useState<CashBalance[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [transactionHistoryVisible, setTransactionHistoryVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [transactionPagination, setTransactionPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0
  });
  
  const [transactionForm] = Form.useForm();

  // 加载数据
  useEffect(() => {
    loadData();
    loadPortfolios();
  }, [selectedPortfolio]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCashSummary(),
        loadCashBalances(),
        loadCashTransactions()
      ]);
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCashSummary = async () => {
    try {
      const data = await CashService.getCashSummary();
      setCashSummary(data);
    } catch (error) {
      console.error('加载现金概览失败:', error);
    }
  };

  const loadCashBalances = async () => {
    try {
      const data = await CashService.getCashBalances(selectedPortfolio);
      setCashBalances(data);
    } catch (error) {
      console.error('加载现金余额失败:', error);
    }
  };

  const loadCashTransactions = async () => {
    try {
      const { transactions, pagination } = await CashService.getCashTransactions(
        selectedAccount,
        transactionPagination.pageSize,
        (transactionPagination.current - 1) * transactionPagination.pageSize
      );
      setCashTransactions(transactions);
      setTransactionPagination(prev => ({
        ...prev,
        total: pagination.total
      }));
    } catch (error) {
      console.error('加载现金交易记录失败:', error);
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

  // 处理现金交易
  const handleCreateTransaction = async (values: any) => {
    try {
      const transactionData: CreateCashTransactionRequest = {
        tradingAccountId: values.tradingAccountId,
        transactionType: values.transactionType,
        amount: values.amount,
        description: values.description
      };

      await CashService.createCashTransaction(transactionData);
      message.success('现金交易创建成功');
      setTransactionModalVisible(false);
      transactionForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.message || '创建现金交易失败');
    }
  };

  // 处理资金冻结
  const handleFreezeFunds = async (accountId: string, amount: number) => {
    try {
      await CashService.freezeFunds(accountId, amount, '手动冻结');
      message.success('资金冻结成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '资金冻结失败');
    }
  };

  // 处理资金解冻
  const handleUnfreezeFunds = async (accountId: string, amount: number) => {
    try {
      await CashService.unfreezeFunds(accountId, amount, '手动解冻');
      message.success('资金解冻成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '资金解冻失败');
    }
  };

  // 现金余额表格列定义
  const balanceColumns: ColumnsType<CashBalance> = [
    {
      title: '账户名称',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (text: string) => (
        <Space>
          <Avatar icon={<WalletOutlined />} size="small" />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '货币',
      dataIndex: 'currency',
      key: 'currency',
      render: (currency: string) => <Tag color="blue">{currency}</Tag>,
    },
    {
      title: '现金余额',
      dataIndex: 'cashBalance',
      key: 'cashBalance',
      render: (amount: number, record: CashBalance) => (
        <Text strong>{CashService.formatAmount(amount, record.currency)}</Text>
      ),
    },
    {
      title: '可用余额',
      dataIndex: 'availableBalance',
      key: 'availableBalance',
      render: (amount: number, record: CashBalance) => (
        <Text type="success">{CashService.formatAmount(amount, record.currency)}</Text>
      ),
    },
    {
      title: '冻结余额',
      dataIndex: 'frozenBalance',
      key: 'frozenBalance',
      render: (amount: number, record: CashBalance) => (
        <Text type="warning">{CashService.formatAmount(amount, record.currency)}</Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: CashBalance) => (
        <Space>
          <Button 
            type="text" 
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedAccount(record.tradingAccountId);
              transactionForm.setFieldsValue({ 
                tradingAccountId: record.tradingAccountId,
                transactionType: 'DEPOSIT'
              });
              setTransactionModalVisible(true);
            }}
          >
            存入
          </Button>
          <Button 
            type="text" 
            icon={<MinusOutlined />}
            onClick={() => {
              setSelectedAccount(record.tradingAccountId);
              transactionForm.setFieldsValue({ 
                tradingAccountId: record.tradingAccountId,
                transactionType: 'WITHDRAW'
              });
              setTransactionModalVisible(true);
            }}
          >
            取出
          </Button>
          <Button 
            type="text" 
            icon={<LockOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '冻结资金',
                content: '请输入要冻结的金额',
                onOk: () => handleFreezeFunds(record.tradingAccountId, 1000)
              });
            }}
          >
            冻结
          </Button>
          <Button 
            type="text" 
            icon={<HistoryOutlined />}
            onClick={() => {
              setSelectedAccount(record.tradingAccountId);
              setTransactionHistoryVisible(true);
              loadCashTransactions();
            }}
          >
            历史
          </Button>
        </Space>
      ),
    },
  ];

  // 交易记录表格列定义
  const transactionColumns: ColumnsType<CashTransaction> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '交易类型',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (type: string) => (
        <Tag color={
          type === 'DEPOSIT' ? 'green' : 
          type === 'WITHDRAW' ? 'red' : 
          type === 'INVESTMENT' ? 'blue' : 
          type === 'REDEMPTION' ? 'orange' : 'default'
        }>
          {CashService.getTransactionTypeName(type as any)}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: CashTransaction) => {
        const isPositive = ['DEPOSIT', 'REDEMPTION'].includes(record.transactionType);
        return (
          <Text type={isPositive ? 'success' : 'danger'}>
            {isPositive ? '+' : '-'}{Math.abs(amount).toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: '余额',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      render: (balance: number) => (
        <Text strong>{balance.toLocaleString()}</Text>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <AccountBookOutlined style={{ marginRight: 8 }} />
        现金管理
      </Title>

      {/* 现金概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {cashSummary.map((summary, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card>
              <Statistic
                title={`总余额 (${summary.currency})`}
                value={summary.totalCashBalance}
                precision={2}
                prefix="¥"
                suffix={`${summary.accountCount} 个账户`}
              />
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Text type="success">
                    可用: ¥{summary.totalAvailableBalance.toLocaleString()}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text type="warning">
                    冻结: ¥{summary.totalFrozenBalance.toLocaleString()}
                  </Text>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs defaultActiveKey="balances">
        <TabPane tab={
          <span>
            <WalletOutlined />
            现金余额
          </span>
        } key="balances">
          <Card
            title="现金余额"
            extra={
              <Space>
                <Select
                  placeholder="选择投资组合"
                  style={{ width: 200 }}
                  allowClear
                  value={selectedPortfolio}
                  onChange={setSelectedPortfolio}
                >
                  {portfolios.map(portfolio => (
                    <Option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </Option>
                  ))}
                </Select>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setTransactionModalVisible(true)}
                >
                  新建交易
                </Button>
              </Space>
            }
          >
            <Table
              columns={balanceColumns}
              dataSource={cashBalances}
              rowKey="tradingAccountId"
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
          <Card title="交易记录">
            <Table
              columns={transactionColumns}
              dataSource={cashTransactions}
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
                },
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 创建交易模态框 */}
      <Modal
        title="创建现金交易"
        visible={transactionModalVisible}
        onCancel={() => {
          setTransactionModalVisible(false);
          transactionForm.resetFields();
        }}
        footer={null}
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
              {cashBalances.map(balance => (
                <Option key={balance.tradingAccountId} value={balance.tradingAccountId}>
                  {balance.accountName} ({balance.currency})
                </Option>
              ))}
            </Select>
          </Form.Item>

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
            </Select>
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
              min={0.01}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea
              placeholder="请输入交易描述（可选）"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建交易
              </Button>
              <Button onClick={() => {
                setTransactionModalVisible(false);
                transactionForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 交易历史模态框 */}
      <Modal
        title="交易历史"
        visible={transactionHistoryVisible}
        onCancel={() => setTransactionHistoryVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          columns={transactionColumns}
          dataSource={cashTransactions.filter(t => !selectedAccount || t.tradingAccountId === selectedAccount)}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
        />
      </Modal>
    </div>
  );
};

export default CashManagement;