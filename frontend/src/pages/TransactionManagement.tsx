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
  Upload,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Statistic,

} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

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

const TransactionManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [form] = Form.useForm<TransactionFormData>();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [statistics, setStatistics] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    totalFees: 0,
    pendingCount: 0
  });

  // 模拟数据
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      portfolioId: 'p1',
      portfolioName: '主投资组合',
      assetId: 'a1',
      assetName: '苹果公司',
      assetSymbol: 'AAPL',
      transactionType: 'BUY',
      side: 'LONG',
      quantity: 100,
      price: 150.25,
      amount: 15025,
      fee: 5.0,
      executedAt: '2025-09-13T10:30:00Z',
      status: 'EXECUTED',
      notes: '定期投资',
      tags: ['科技股', '长期持有'],
      createdAt: '2025-09-13T10:25:00Z',
      updatedAt: '2025-09-13T10:30:00Z'
    },
    {
      id: '2',
      portfolioId: 'p1',
      portfolioName: '主投资组合',
      assetId: 'a2',
      assetName: '微软公司',
      assetSymbol: 'MSFT',
      transactionType: 'SELL',
      side: 'LONG',
      quantity: 50,
      price: 280.50,
      amount: 14025,
      fee: 7.5,
      executedAt: '2025-09-12T14:15:00Z',
      status: 'EXECUTED',
      notes: '获利了结',
      tags: ['科技股', '短期交易'],
      createdAt: '2025-09-12T14:10:00Z',
      updatedAt: '2025-09-12T14:15:00Z'
    }
  ];

  const transactionTypes = [
    { value: 'BUY', label: '买入', color: 'green' },
    { value: 'SELL', label: '卖出', color: 'red' },
    { value: 'DEPOSIT', label: '存款', color: 'blue' },
    { value: 'WITHDRAWAL', label: '取款', color: 'orange' },
    { value: 'DIVIDEND', label: '分红', color: 'purple' },
    { value: 'INTEREST', label: '利息', color: 'cyan' }
  ];

  const statusTypes = [
    { value: 'PENDING', label: '待执行', color: 'processing' },
    { value: 'EXECUTED', label: '已执行', color: 'success' },
    { value: 'CANCELLED', label: '已取消', color: 'default' },
    { value: 'FAILED', label: '失败', color: 'error' }
  ];

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      setTimeout(() => {
        setTransactions(mockTransactions);
        calculateStatistics(mockTransactions);
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('加载交易记录失败');
      setLoading(false);
    }
  };

  const calculateStatistics = (data: Transaction[]) => {
    const stats = {
      totalTransactions: data.length,
      totalAmount: data.reduce((sum, t) => sum + t.amount, 0),
      totalFees: data.reduce((sum, t) => sum + t.fee, 0),
      pendingCount: data.filter(t => t.status === 'PENDING').length
    };
    setStatistics(stats);
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Transaction) => {
    setEditingTransaction(record);
    form.setFieldsValue({
      ...record,
      executedAt: dayjs(record.executedAt)
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // 模拟API调用
      setTransactions(prev => prev.filter(t => t.id !== id));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: TransactionFormData) => {
    try {
      const transactionData = {
        ...values,
        executedAt: values.executedAt.toISOString(),
        amount: values.quantity * values.price,
        transactionType: values.transactionType as Transaction['transactionType'],
        side: values.side as Transaction['side']
      };

      if (editingTransaction) {
        // 更新交易
        setTransactions(prev =>
          prev.map(t =>
            t.id === editingTransaction.id
              ? { ...t, ...transactionData, updatedAt: new Date().toISOString() }
              : t
          )
        );
        message.success('更新成功');
      } else {
        // 新增交易
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          portfolioId: transactionData.portfolioId,
          portfolioName: '主投资组合',
          assetId: transactionData.assetId,
          assetName: '资产名称',
          assetSymbol: 'SYMBOL',
          transactionType: transactionData.transactionType,
          side: transactionData.side,
          quantity: transactionData.quantity,
          price: transactionData.price,
          amount: transactionData.amount,
          fee: transactionData.fee,
          executedAt: transactionData.executedAt,
          status: 'EXECUTED',
          notes: transactionData.notes,
          tags: transactionData.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTransactions(prev => [newTransaction, ...prev]);
        message.success('添加成功');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleImport = (_file: File) => {
    // 模拟批量导入
    message.success('批量导入功能开发中');
    return false;
  };

  const handleExport = () => {
    // 模拟导出功能
    message.success('导出功能开发中');
  };

  const getTypeColor = (type: string) => {
    const typeConfig = transactionTypes.find(t => t.value === type);
    return typeConfig?.color || 'default';
  };

  const getStatusColor = (status: string) => {
    const statusConfig = statusTypes.find(s => s.value === status);
    return statusConfig?.color || 'default';
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchText || 
      transaction.assetName.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.assetSymbol.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesType = !selectedType || transaction.transactionType === selectedType;
    
    const matchesDate = !dateRange || (
      dayjs(transaction.executedAt).isAfter(dateRange[0]) &&
      dayjs(transaction.executedAt).isBefore(dateRange[1])
    );

    return matchesSearch && matchesType && matchesDate;
  });

  const columns: ColumnsType<Transaction> = [
    {
      title: '执行时间',
      dataIndex: 'executedAt',
      key: 'executedAt',
      width: 120,
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.executedAt).unix() - dayjs(b.executedAt).unix()
    },
    {
      title: '投资组合',
      dataIndex: 'portfolioName',
      key: 'portfolioName',
      width: 120
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
      )
    },
    {
      title: '交易类型',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 100,
      render: (type: string) => {
        const typeConfig = transactionTypes.find(t => t.value === type);
        return <Tag color={getTypeColor(type)}>{typeConfig?.label || type}</Tag>;
      }
    },
    {
      title: '方向',
      dataIndex: 'side',
      key: 'side',
      width: 80,
      render: (side: string) => (
        <Tag color={side === 'LONG' ? 'green' : 'red'}>
          {side === 'LONG' ? '多头' : '空头'}
        </Tag>
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (quantity: number) => quantity.toLocaleString()
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      align: 'right',
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => `¥${amount.toLocaleString()}`
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      width: 100,
      align: 'right',
      render: (fee: number) => `¥${fee.toFixed(2)}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = statusTypes.find(s => s.value === status);
        return <Tag color={getStatusColor(status)}>{statusConfig?.label || status}</Tag>;
      }
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 120,
      render: (tags: string[]) => (
        <div>
          {tags.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定删除这条交易记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总交易数"
              value={statistics.totalTransactions}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总交易金额"
              value={statistics.totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总手续费"
              value={statistics.totalFees}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待执行"
              value={statistics.pendingCount}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="middle">
              <Input
                placeholder="搜索资产名称、代码或备注"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
              />
              <Select
                placeholder="交易类型"
                value={selectedType}
                onChange={setSelectedType}
                allowClear
                style={{ width: 120 }}
              >
                {transactionTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                placeholder={['开始日期', '结束日期']}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Upload
                accept=".csv,.xlsx"
                beforeUpload={handleImport}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>批量导入</Button>
              </Upload>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                新增交易
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
          scroll={{ x: 1400 }}
          pagination={{
            total: filteredTransactions.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 新增/编辑交易模态框 */}
      <Modal
        title={editingTransaction ? '编辑交易' : '新增交易'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnHidden={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="portfolioId"
                label="投资组合"
                rules={[{ required: true, message: '请选择投资组合' }]}
              >
                <Select placeholder="选择投资组合">
                  <Option value="p1">主投资组合</Option>
                  <Option value="p2">备用组合</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assetId"
                label="资产"
                rules={[{ required: true, message: '请选择资产' }]}
              >
                <Select placeholder="选择资产" showSearch>
                  <Option value="a1">AAPL - 苹果公司</Option>
                  <Option value="a2">MSFT - 微软公司</Option>
                  <Option value="a3">GOOGL - 谷歌</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="transactionType"
                label="交易类型"
                rules={[{ required: true, message: '请选择交易类型' }]}
              >
                <Select placeholder="选择交易类型">
                  {transactionTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="side"
                label="交易方向"
                rules={[{ required: true, message: '请选择交易方向' }]}
              >
                <Select placeholder="选择交易方向">
                  <Option value="LONG">多头</Option>
                  <Option value="SHORT">空头</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber
                  placeholder="数量"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="价格"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber
                  placeholder="价格"
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="fee"
                label="手续费"
                rules={[{ required: true, message: '请输入手续费' }]}
              >
                <InputNumber
                  placeholder="手续费"
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="executedAt"
            label="执行时间"
            rules={[{ required: true, message: '请选择执行时间' }]}
          >
            <DatePicker
              showTime
              placeholder="选择执行时间"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="添加标签"
              style={{ width: '100%' }}
            >
              <Option value="科技股">科技股</Option>
              <Option value="长期持有">长期持有</Option>
              <Option value="短期交易">短期交易</Option>
              <Option value="定期投资">定期投资</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea
              placeholder="交易备注"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TransactionManagement;