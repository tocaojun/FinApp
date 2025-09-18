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
  Typography
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
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
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

  // 模拟数据
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      portfolioId: 'p1',
      portfolioName: '核心投资组合',
      assetId: 'a1',
      assetName: '苹果公司',
      assetSymbol: 'AAPL',
      transactionType: 'BUY',
      side: 'LONG',
      quantity: 100,
      price: 150.25,
      amount: 15025,
      fee: 5.0,
      executedAt: '2024-09-15 10:30:00',
      status: 'EXECUTED',
      notes: '看好苹果长期发展',
      tags: ['科技股', '长期持有'],
      createdAt: '2024-09-15 10:25:00',
      updatedAt: '2024-09-15 10:30:00'
    },
    {
      id: '2',
      portfolioId: 'p1',
      portfolioName: '核心投资组合',
      assetId: 'a2',
      assetName: '微软公司',
      assetSymbol: 'MSFT',
      transactionType: 'BUY',
      side: 'LONG',
      quantity: 50,
      price: 280.50,
      amount: 14025,
      fee: 4.5,
      executedAt: '2024-09-14 14:20:00',
      status: 'EXECUTED',
      notes: 'AI概念股',
      tags: ['科技股', 'AI'],
      createdAt: '2024-09-14 14:15:00',
      updatedAt: '2024-09-14 14:20:00'
    },
    {
      id: '3',
      portfolioId: 'p2',
      portfolioName: '稳健增长组合',
      assetId: 'a3',
      assetName: '中国平安',
      assetSymbol: '601318',
      transactionType: 'SELL',
      side: 'LONG',
      quantity: 200,
      price: 45.80,
      amount: 9160,
      fee: 3.2,
      executedAt: '2024-09-13 11:45:00',
      status: 'EXECUTED',
      notes: '获利了结',
      tags: ['保险股', '获利了结'],
      createdAt: '2024-09-13 11:40:00',
      updatedAt: '2024-09-13 11:45:00'
    },
    {
      id: '4',
      portfolioId: 'p1',
      portfolioName: '核心投资组合',
      assetId: 'cash',
      assetName: '现金存入',
      assetSymbol: 'CASH',
      transactionType: 'DEPOSIT',
      side: 'LONG',
      quantity: 1,
      price: 50000,
      amount: 50000,
      fee: 0,
      executedAt: '2024-09-12 09:00:00',
      status: 'EXECUTED',
      notes: '资金注入',
      tags: ['资金管理'],
      createdAt: '2024-09-12 09:00:00',
      updatedAt: '2024-09-12 09:00:00'
    },
    {
      id: '5',
      portfolioId: 'p1',
      portfolioName: '核心投资组合',
      assetId: 'a1',
      assetName: '苹果公司',
      assetSymbol: 'AAPL',
      transactionType: 'DIVIDEND',
      side: 'LONG',
      quantity: 100,
      price: 0.24,
      amount: 24,
      fee: 0,
      executedAt: '2024-09-10 16:00:00',
      status: 'EXECUTED',
      notes: '季度分红',
      tags: ['分红收入'],
      createdAt: '2024-09-10 16:00:00',
      updatedAt: '2024-09-10 16:00:00'
    },
    {
      id: '6',
      portfolioId: 'p2',
      portfolioName: '稳健增长组合',
      assetId: 'a4',
      assetName: '腾讯控股',
      assetSymbol: '00700',
      transactionType: 'BUY',
      side: 'LONG',
      quantity: 30,
      price: 320.50,
      amount: 9615,
      fee: 8.5,
      executedAt: '2024-09-18 15:30:00',
      status: 'PENDING',
      notes: '港股投资',
      tags: ['港股', '科技股'],
      createdAt: '2024-09-18 15:25:00',
      updatedAt: '2024-09-18 15:25:00'
    }
  ];

  // 初始化数据
  useEffect(() => {
    setTransactions(mockTransactions);
    calculateStatistics(mockTransactions);
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
      filters: [
        { text: '核心投资组合', value: '核心投资组合' },
        { text: '稳健增长组合', value: '稳健增长组合' },
      ],
      onFilter: (value, record) => record.portfolioName === value,
    },
    {
      title: '资产',
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
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      align: 'right',
      render: (value) => `¥${value.toFixed(2)}`,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (value, record) => (
        <Text type={['SELL', 'WITHDRAWAL'].includes(record.transactionType) ? 'success' : undefined}>
          {['SELL', 'WITHDRAWAL'].includes(record.transactionType) ? '+' : '-'}¥{value.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      width: 80,
      align: 'right',
      render: (value) => `¥${value.toFixed(2)}`,
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
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      const newTransactions = transactions.filter(t => t.id !== id);
      setTransactions(newTransactions);
      calculateStatistics(newTransactions);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: TransactionFormData) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTransaction: Transaction = {
        id: editingTransaction?.id || Date.now().toString(),
        portfolioId: values.portfolioId,
        assetId: values.assetId,
        transactionType: values.transactionType as Transaction['transactionType'],
        side: values.side as Transaction['side'],
        quantity: values.quantity,
        price: values.price,
        fee: values.fee || 0,
        tags: values.tags || [],
        notes: values.notes,
        amount: values.quantity * values.price,
        executedAt: values.executedAt.format('YYYY-MM-DD HH:mm:ss'),
        status: 'EXECUTED',
        portfolioName: '核心投资组合', // 模拟数据
        assetName: 'Apple Inc.', // 模拟数据
        assetSymbol: 'AAPL', // 模拟数据
        createdAt: editingTransaction?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let newTransactions;
      if (editingTransaction) {
        newTransactions = transactions.map(t => 
          t.id === editingTransaction.id ? newTransaction : t
        );
        message.success('交易记录更新成功');
      } else {
        newTransactions = [newTransaction, ...transactions];
        message.success('交易记录添加成功');
      }

      setTransactions(newTransactions);
      calculateStatistics(newTransactions);
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    message.info('批量导入功能开发中...');
  };

  const handleExport = () => {
    message.info('导出功能开发中...');
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
                placeholder="搜索资产名称或代码"
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
            <Col span={12}>
              <Form.Item
                label="投资组合"
                name="portfolioId"
                rules={[{ required: true, message: '请选择投资组合' }]}
              >
                <Select placeholder="选择投资组合">
                  <Option value="p1">核心投资组合</Option>
                  <Option value="p2">稳健增长组合</Option>
                  <Option value="p3">高风险投资组合</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="资产"
                name="assetId"
                rules={[{ required: true, message: '请选择资产' }]}
              >
                <Select placeholder="选择资产" showSearch>
                  <Option value="a1">AAPL - 苹果公司</Option>
                  <Option value="a2">MSFT - 微软公司</Option>
                  <Option value="a3">601318 - 中国平安</Option>
                  <Option value="a4">00700 - 腾讯控股</Option>
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
                  <Option value="BUY">买入</Option>
                  <Option value="SELL">卖出</Option>
                  <Option value="DEPOSIT">存入</Option>
                  <Option value="WITHDRAWAL">取出</Option>
                  <Option value="DIVIDEND">分红</Option>
                  <Option value="INTEREST">利息</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="方向"
                name="side"
                rules={[{ required: true, message: '请选择交易方向' }]}
              >
                <Select placeholder="选择交易方向">
                  <Option value="LONG">做多</Option>
                  <Option value="SHORT">做空</Option>
                </Select>
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
                label="价格"
                name="price"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber
                  placeholder="价格"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
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
            <Select
              mode="tags"
              placeholder="添加标签"
              style={{ width: '100%' }}
            >
              <Option value="科技股">科技股</Option>
              <Option value="长期持有">长期持有</Option>
              <Option value="短期交易">短期交易</Option>
              <Option value="获利了结">获利了结</Option>
              <Option value="止损">止损</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="备注"
            name="notes"
          >
            <Input.TextArea
              placeholder="交易备注"
              rows={3}
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
            <Select mode="multiple" placeholder="选择投资组合">
              <Option value="p1">核心投资组合</Option>
              <Option value="p2">稳健增长组合</Option>
              <Option value="p3">高风险投资组合</Option>
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
            <Select mode="multiple" placeholder="选择标签">
              <Option value="科技股">科技股</Option>
              <Option value="长期持有">长期持有</Option>
              <Option value="短期交易">短期交易</Option>
              <Option value="获利了结">获利了结</Option>
              <Option value="止损">止损</Option>
            </Select>
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
    </div>
  );
};

export default TransactionManagement;