import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Drawer,
  Typography,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  FilterOutlined,
  BarChartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  WalletOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { TransactionService } from '../services/transactionService';
import { PortfolioService } from '../services/portfolioService';
import { Portfolio } from '../types/portfolio';
import { AssetService, Asset } from '../services/assetService';
import { TagService, Tag as TagType } from '../services/tagService';
import { TradingAccountService, TradingAccount } from '../services/tradingAccountService';
import CategoryTagSelector from '../components/common/CategoryTagSelector';
import { TransactionImportModal } from '../components/transaction/TransactionImportModal';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

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
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface TransactionFormData {
  portfolioId: string;
  tradingAccountId: string;
  assetId: string;
  transactionType: string;
  side: string;
  quantity: number;
  price: number;
  fee: number;
  executedAt: dayjs.Dayjs;
  notes?: string;
  tags: string[];
}

interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  totalFees: number;
  pendingCount: number;
  buyCount: number;
  sellCount: number;
  profitLoss: number;
  avgTransactionSize: number;
}

const TransactionManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [tradingAccounts, setTradingAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tradingAccountsLoading, setTradingAccountsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [form] = Form.useForm<TransactionFormData>();
  const [filterForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [statistics, setStatistics] = useState<TransactionStats>({
    totalTransactions: 0,
    totalAmount: 0,
    totalFees: 0,
    pendingCount: 0,
    buyCount: 0,
    sellCount: 0,
    profitLoss: 0,
    avgTransactionSize: 0
  });

  // 获取交易数据
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // 直接获取投资组合数据（避免依赖状态）
      const portfolioData = await PortfolioService.getPortfolios();
      setPortfolios(portfolioData);
      
      // 创建投资组合ID到名称的映射
      const portfolioMap = new Map<string, string>();
      portfolioData.forEach(p => portfolioMap.set(p.id, p.name));
      
      // 获取交易数据
      const response = await TransactionService.getTransactions();
      const transactionData = response.data?.transactions || [];
      
      const formattedTransactions: Transaction[] = transactionData.map((tx: any) => {
        // 优先使用后端返回的投资组合名称
        const portfolioName = tx.portfolio?.name || portfolioMap.get(tx.portfolioId) || '未知投资组合';
        
        return {
          id: tx.id,
          portfolioId: tx.portfolioId || '',
          portfolioName,
          assetId: tx.assetId,
          assetName: tx.asset?.name || tx.assetName || '未知资产',
          assetSymbol: tx.asset?.symbol || tx.assetSymbol || '',
          transactionType: tx.transactionType?.toUpperCase() || tx.type?.toUpperCase() || 'BUY',
          side: 'LONG',
          quantity: Number(tx.quantity || 0),
          price: Number(tx.price || 0),
          amount: Number(tx.totalAmount || tx.amount || 0),
          fee: Number(tx.fees || tx.fee || 0),
          executedAt: tx.transactionDate || tx.executedAt || tx.createdAt,
          status: 'EXECUTED',
          notes: tx.notes || '',
          tags: [],
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt
        };
      });
      
      setTransactions(formattedTransactions);
      calculateStatistics(formattedTransactions);
    } catch (error) {
      console.error('获取交易数据失败:', error);
      message.error('获取交易数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取投资组合数据
  const fetchPortfolios = async () => {
    try {
      setPortfoliosLoading(true);
      const portfolioData = await PortfolioService.getPortfolios();
      setPortfolios(portfolioData);
    } catch (error) {
      console.error('获取投资组合数据失败:', error);
      message.error('获取投资组合数据失败');
    } finally {
      setPortfoliosLoading(false);
    }
  };

  // 获取资产/产品数据
  const fetchAssets = async () => {
    try {
      setAssetsLoading(true);
      const response = await AssetService.searchAssets({ limit: 1000 });
      setAssets(response.assets);
    } catch (error) {
      console.error('获取产品数据失败:', error);
      message.error('获取产品数据失败');
    } finally {
      setAssetsLoading(false);
    }
  };

  // 获取标签数据
  const fetchTags = async () => {
    try {
      setTagsLoading(true);
      const response = await TagService.getAllTags();
      // 确保 response 是数组
      if (Array.isArray(response)) {
        setTags(response);
      } else {
        console.warn('标签数据格式不正确:', response);
        setTags([]);
      }
    } catch (error) {
      console.error('获取标签数据失败:', error);
      message.error('获取标签数据失败');
      setTags([]); // 设置为空数组避免 map 错误
    } finally {
      setTagsLoading(false);
    }
  };

  // 获取交易账户数据
  const fetchTradingAccounts = async (portfolioId?: string) => {
    try {
      setTradingAccountsLoading(true);
      let accountData: TradingAccount[] = [];
      
      if (portfolioId) {
        // 获取指定投资组合的交易账户
        accountData = await TradingAccountService.getTradingAccounts(portfolioId);
      } else {
        // 获取所有交易账户
        accountData = await TradingAccountService.getAllTradingAccounts();
      }
      
      setTradingAccounts(accountData);
    } catch (error) {
      console.error('获取交易账户数据失败:', error);
      message.error('获取交易账户数据失败');
      setTradingAccounts([]);
    } finally {
      setTradingAccountsLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchTransactions();
    fetchPortfolios();
    fetchAssets();
    fetchTags();
    fetchTradingAccounts(); // 获取所有交易账户
  }, []);

  // 计算统计数据
  const calculateStatistics = (data: Transaction[]) => {
    const stats: TransactionStats = {
      totalTransactions: data.length,
      totalAmount: data.reduce((sum, t) => sum + t.amount, 0),
      totalFees: data.reduce((sum, t) => sum + t.fee, 0),
      pendingCount: data.filter(t => t.status === 'PENDING').length,
      buyCount: data.filter(t => ['BUY', 'DEPOSIT'].includes(t.transactionType)).length,
      sellCount: data.filter(t => ['SELL', 'WITHDRAWAL'].includes(t.transactionType)).length,
      profitLoss: 0, // 需要根据实际业务逻辑计算
      avgTransactionSize: data.length > 0 ? data.reduce((sum, t) => sum + t.amount, 0) / data.length : 0
    };
    
    // 简单的盈亏计算（卖出 - 买入）
    const sellAmount = data.filter(t => t.transactionType === 'SELL').reduce((sum, t) => sum + t.amount, 0);
    const buyAmount = data.filter(t => t.transactionType === 'BUY').reduce((sum, t) => sum + t.amount, 0);
    stats.profitLoss = sellAmount - buyAmount;
    
    setStatistics(stats);
  };

  // 表格列定义
  const columns: ColumnsType<Transaction> = [
    {
      title: '交易时间',
      dataIndex: 'executedAt',
      key: 'executedAt',
      width: 150,
      render: (text) => dayjs(text).format('MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.executedAt).unix() - dayjs(b.executedAt).unix(),
    },
    {
      title: '投资组合',
      dataIndex: 'portfolioName',
      key: 'portfolioName',
      width: 120,
      filters: portfolios.map(portfolio => ({
        text: portfolio.name,
        value: portfolio.name,
      })),
      onFilter: (value, record) => record.portfolioName === value,
    },
    {
      title: '产品',
      key: 'asset',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.assetSymbol}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.assetName}</div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 80,
      render: (type) => {
        const typeMap = {
          BUY: { color: 'green', text: '买入' },
          SELL: { color: 'red', text: '卖出' },
          DEPOSIT: { color: 'blue', text: '存入' },
          WITHDRAWAL: { color: 'orange', text: '取出' },
          DIVIDEND: { color: 'purple', text: '分红' },
          INTEREST: { color: 'cyan', text: '利息' },
        };
        const { color, text } = typeMap[type as keyof typeof typeMap];
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: '买入', value: 'BUY' },
        { text: '卖出', value: 'SELL' },
        { text: '存入', value: 'DEPOSIT' },
        { text: '取出', value: 'WITHDRAWAL' },
        { text: '分红', value: 'DIVIDEND' },
        { text: '利息', value: 'INTEREST' },
      ],
      onFilter: (value, record) => record.transactionType === value,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value) => value.toLocaleString(),
    },
    {
      title: '单价 (每份净值)',
      key: 'price',
      width: 100,
      align: 'right',
      render: (_, record) => `¥${record.price.toFixed(4)}`,
    },
    {
      title: '金额 (数量×单价)',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount) => {
        // 只显示金额绝对值，不体现资金流向
        const displayAmount = Math.abs(amount);
        return `¥${displayAmount.toFixed(2)}`;
      },
      sorter: (a, b) => Math.abs(a.amount) - Math.abs(b.amount),
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      width: 80,
      align: 'right',
      render: (value) => `¥${Math.abs(value).toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const statusMap = {
          PENDING: { color: 'processing', text: '待执行' },
          EXECUTED: { color: 'success', text: '已执行' },
          CANCELLED: { color: 'default', text: '已取消' },
          FAILED: { color: 'error', text: '失败' },
        };
        const { color, text } = statusMap[status as keyof typeof statusMap];
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: '待执行', value: 'PENDING' },
        { text: '已执行', value: 'EXECUTED' },
        { text: '已取消', value: 'CANCELLED' },
        { text: '失败', value: 'FAILED' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 120,
      render: (tags) => (
        <div>
          {tags.slice(0, 2).map((tag: string) => (
            <Tag key={tag} style={{ marginBottom: 2 }}>
              {tag}
            </Tag>
          ))}
          {tags.length > 2 && <Tag>+{tags.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条交易记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 事件处理函数
  const handleAdd = () => {
    setEditingTransaction(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    form.setFieldsValue({
      ...transaction,
      executedAt: dayjs(transaction.executedAt),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      // 调用真正的API删除交易
      await TransactionService.deleteTransaction(id);
      
      // 删除成功后，从本地状态中移除该交易
      const newTransactions = transactions.filter(t => t.id !== id);
      setTransactions(newTransactions);
      calculateStatistics(newTransactions);
      message.success('删除成功');
    } catch (error) {
      console.error('删除交易失败:', error);
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: TransactionFormData) => {
    setLoading(true);
    try {
      // 准备交易数据，匹配后端API格式
      const transactionData = {
        portfolioId: values.portfolioId,
        tradingAccountId: values.tradingAccountId, // 使用表单选择的交易账户ID
        assetId: values.assetId,
        transactionType: values.transactionType, // 已经是正确格式
        type: values.transactionType, // 添加 type 字段
        side: values.transactionType === 'buy' ? 'BUY' : 
              values.transactionType === 'sell' ? 'SELL' :
              values.transactionType === 'deposit' ? 'DEPOSIT' :
              values.transactionType === 'withdrawal' ? 'WITHDRAWAL' : 'BUY',
        quantity: values.quantity,
        price: values.price,
        totalAmount: values.price * values.quantity, // 添加 totalAmount 字段
        fee: values.fee || 0, // 添加 fee 字段
        fees: values.fee || 0,
        currency: 'CNY', // 默认货币
        executedAt: values.executedAt.toISOString(), // 使用ISO格式
        settledAt: values.executedAt.toISOString(), // 使用相同的时间
        notes: values.notes || '',
        tags: values.tags || []
      } as any; // 临时使用 any 类型避免类型错误

      if (editingTransaction) {
        // 更新交易记录
        await TransactionService.updateTransaction(editingTransaction.id, transactionData);
        message.success('交易记录更新成功');
      } else {
        // 创建新交易记录
        await TransactionService.createTransaction(transactionData);
        message.success('交易记录添加成功');
      }

      // 重新获取交易数据以确保数据同步
      await fetchTransactions();
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('交易操作失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    setImportModalVisible(true);
  };

  const handleExport = () => {
    message.info('导出功能开发中...');
  };

  // 加载交易账户
  const handleLoadAccounts = async (portfolioId: string) => {
    try {
      setTradingAccountsLoading(true);
      const accounts = await TradingAccountService.getTradingAccounts(portfolioId);
      setTradingAccounts(accounts);
    } catch (error) {
      console.error('加载交易账户失败:', error);
      message.error('加载交易账户失败');
    } finally {
      setTradingAccountsLoading(false);
    }
  };

  // 搜索资产
  const handleSearchAssets = async (keyword: string) => {
    if (!keyword || keyword.length < 2) return;
    
    try {
      setAssetsLoading(true);
      const response = await AssetService.searchAssets({ 
        keyword, 
        limit: 20 
      });
      setAssets(response.assets);
    } catch (error) {
      console.error('搜索资产失败:', error);
    } finally {
      setAssetsLoading(false);
    }
  };

  // 导入成功回调
  const handleImportSuccess = () => {
    message.success('导入成功');
    fetchTransactions();
  };

  const handleFilter = (values: any) => {
    console.log('筛选条件:', values);
    setFilterDrawerVisible(false);
    message.success('筛选条件已应用');
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setSearchText('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedPortfolio('');
    setDateRange(null);
    message.success('筛选条件已重置');
  };

  // 筛选后的数据
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchText || 
      transaction.assetName.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.assetSymbol.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.portfolioName.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesType = !selectedType || transaction.transactionType === selectedType;
    const matchesStatus = !selectedStatus || transaction.status === selectedStatus;
    const matchesPortfolio = !selectedPortfolio || transaction.portfolioId === selectedPortfolio;
    
    const matchesDateRange = !dateRange || (
      dayjs(transaction.executedAt).isAfter(dateRange[0]) &&
      dayjs(transaction.executedAt).isBefore(dateRange[1])
    );

    return matchesSearch && matchesType && matchesStatus && matchesPortfolio && matchesDateRange;
  });

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <WalletOutlined style={{ marginRight: '8px' }} />
          交易管理
        </Title>
        <Paragraph type="secondary">
          管理所有投资组合的交易记录，支持多种交易类型和批量操作
        </Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="总交易数"
              value={statistics.totalTransactions}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="交易总额"
              value={statistics.totalAmount}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="总手续费"
              value={statistics.totalFees}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="待执行"
              value={statistics.pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Input.Search
                placeholder="搜索产品名称或代码"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                placeholder="交易类型"
                value={selectedType}
                onChange={setSelectedType}
                style={{ width: 120 }}
                allowClear
              >
                <Option value="BUY">买入</Option>
                <Option value="SELL">卖出</Option>
                <Option value="DEPOSIT">存入</Option>
                <Option value="WITHDRAWAL">取出</Option>
                <Option value="DIVIDEND">分红</Option>
                <Option value="INTEREST">利息</Option>
              </Select>
              <Select
                placeholder="状态"
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 100 }}
                allowClear
              >
                <Option value="PENDING">待执行</Option>
                <Option value="EXECUTED">已执行</Option>
                <Option value="CANCELLED">已取消</Option>
                <Option value="FAILED">失败</Option>
              </Select>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                placeholder={['开始日期', '结束日期']}
              />
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
              >
                高级筛选
              </Button>
              <Button onClick={resetFilters}>
                重置
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                添加交易
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={handleImport}
              >
                批量导入
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 交易记录表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredTransactions}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredTransactions.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* 添加/编辑交易模态框 */}
      <Modal
        title={editingTransaction ? '编辑交易' : '添加交易'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="投资组合"
                name="portfolioId"
                rules={[{ required: true, message: '请选择投资组合' }]}
              >
                <Select 
                  placeholder="选择投资组合" 
                  loading={portfoliosLoading}
                  onChange={(portfolioId) => {
                    // 当选择投资组合时，清空交易账户选择并重新加载
                    form.setFieldsValue({ tradingAccountId: undefined });
                    fetchTradingAccounts(portfolioId);
                  }}
                >
                  {portfolios.map(portfolio => (
                    <Option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="交易账户"
                name="tradingAccountId"
                rules={[{ required: true, message: '请选择交易账户' }]}
              >
                <Select 
                  placeholder="选择交易账户" 
                  loading={tradingAccountsLoading}
                  disabled={!form.getFieldValue('portfolioId')}
                >
                  {tradingAccounts.map(account => (
                    <Option key={account.id} value={account.id}>
                      {account.name} ({account.accountType})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="产品"
                name="assetId"
                rules={[{ required: true, message: '请选择产品' }]}
              >
                <Select 
                  placeholder="选择产品" 
                  showSearch
                  loading={assetsLoading}
                  filterOption={(input, option) =>
                    option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
                  }
                >
                  {assets.map(asset => (
                    <Option key={asset.id} value={asset.id}>
                      {asset.symbol} - {asset.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="交易类型"
                name="transactionType"
                rules={[{ required: true, message: '请选择交易类型' }]}
              >
                <Select placeholder="选择交易类型">
                  <Option value="buy">买入</Option>
                  <Option value="sell">卖出</Option>
                  <Option value="deposit">存入</Option>
                  <Option value="withdrawal">取出</Option>
                  <Option value="dividend">分红</Option>
                  <Option value="split">拆股</Option>
                  <Option value="merger">合并</Option>
                  <Option value="spin_off">分拆</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="备注信息"
                name="notes"
              >
                <Input
                  placeholder="交易备注（可选）"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="数量"
                name="quantity"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber
                  placeholder="数量"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="单价"
                name="price"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber
                  placeholder="单价"
                  style={{ width: '100%' }}
                  min={0}
                  precision={5}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="手续费"
                name="fee"
              >
                <InputNumber
                  placeholder="手续费"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="执行时间"
            name="executedAt"
            rules={[{ required: true, message: '请选择执行时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择执行时间"
            />
          </Form.Item>

          <Form.Item
            label="标签"
            name="tags"
          >
            <CategoryTagSelector
              tags={tags}
              placeholder="选择标签（同分类单选，不同分类可多选）"
              loading={tagsLoading}
              style={{ width: '100%' }}
            />
          </Form.Item>



          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingTransaction ? '更新' : '添加'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 高级筛选抽屉 */}
      <Drawer
        title="高级筛选"
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={400}
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={handleFilter}
        >
          <Form.Item label="投资组合" name="portfolioIds">
            <Select mode="multiple" placeholder="选择投资组合" loading={portfoliosLoading}>
              {portfolios.map(portfolio => (
                <Option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="交易类型" name="transactionTypes">
            <Select mode="multiple" placeholder="选择交易类型">
              <Option value="BUY">买入</Option>
              <Option value="SELL">卖出</Option>
              <Option value="DEPOSIT">存入</Option>
              <Option value="WITHDRAWAL">取出</Option>
              <Option value="DIVIDEND">分红</Option>
              <Option value="INTEREST">利息</Option>
            </Select>
          </Form.Item>

          <Form.Item label="金额范围" name="amountRange">
            <Input.Group compact>
              <InputNumber
                style={{ width: '45%' }}
                placeholder="最小金额"
                min={0}
              />
              <Input
                style={{ width: '10%', textAlign: 'center', pointerEvents: 'none' }}
                placeholder="~"
                disabled
              />
              <InputNumber
                style={{ width: '45%' }}
                placeholder="最大金额"
                min={0}
              />
            </Input.Group>
          </Form.Item>

          <Form.Item label="标签" name="tags">
            <CategoryTagSelector
              tags={tags}
              placeholder="选择标签进行筛选（可多选）"
              loading={tagsLoading}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                应用筛选
              </Button>
              <Button onClick={() => filterForm.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 批量导入弹窗 */}
      <TransactionImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
        portfolios={portfolios}
        tradingAccounts={tradingAccounts}
        assets={assets}
        onLoadAccounts={handleLoadAccounts}
        onSearchAssets={handleSearchAssets}
      />
    </div>
  );
};

export default TransactionManagement;