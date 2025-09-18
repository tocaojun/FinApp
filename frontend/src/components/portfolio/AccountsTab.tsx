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
  Switch,
  Typography,
  Dropdown,
  Menu,
  message,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  MoreOutlined,
  BankOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Account } from '../../types/portfolio';

const { Option } = Select;
const { Text } = Typography;

interface AccountsTabProps {
  portfolioId: string;
}

const AccountsTab: React.FC<AccountsTabProps> = ({ portfolioId }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form] = Form.useForm();
  const [showAccountNumbers, setShowAccountNumbers] = useState(false);

  useEffect(() => {
    if (portfolioId) {
      loadAccounts();
    }
  }, [portfolioId]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      // 这里应该调用实际的API
      // const data = await AccountService.getAccountsByPortfolio(portfolioId);
      
      // 使用模拟数据
      const mockAccounts: Account[] = [
        {
          id: '1',
          portfolioId,
          name: '富途证券账户',
          type: 'BROKERAGE',
          broker: '富途证券',
          accountNumber: '****1234',
          balance: 125000.50,
          currency: 'USD',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-09-14T00:00:00Z'
        },
        {
          id: '2',
          portfolioId,
          name: '招商银行储蓄',
          type: 'SAVINGS',
          broker: '招商银行',
          accountNumber: '****5678',
          balance: 50000.00,
          currency: 'CNY',
          isActive: true,
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: '2024-09-14T00:00:00Z'
        },
        {
          id: '3',
          portfolioId,
          name: '401K退休账户',
          type: 'RETIREMENT',
          broker: 'Fidelity',
          accountNumber: '****9012',
          balance: 75000.00,
          currency: 'USD',
          isActive: true,
          createdAt: '2024-03-01T00:00:00Z',
          updatedAt: '2024-09-14T00:00:00Z'
        }
      ];
      
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('加载账户数据失败:', error);
      message.error('加载账户数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getAccountTypeTag = (type: string) => {
    const typeMap = {
      'BROKERAGE': { color: 'blue', text: '券商账户' },
      'RETIREMENT': { color: 'green', text: '退休账户' },
      'SAVINGS': { color: 'orange', text: '储蓄账户' },
      'CHECKING': { color: 'purple', text: '支票账户' }
    };
    const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    form.setFieldsValue({
      name: account.name,
      type: account.type,
      broker: account.broker,
      accountNumber: account.accountNumber,
      balance: account.balance,
      currency: account.currency,
      isActive: account.isActive
    });
    setModalVisible(true);
  };

  const handleDeleteAccount = (account: Account) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除账户 "${account.name}" 吗？`,
      onOk: async () => {
        try {
          // 这里应该调用实际的API
          // await AccountService.deleteAccount(account.id);
          
          setAccounts(prev => prev.filter(a => a.id !== account.id));
          message.success('账户删除成功');
        } catch (error) {
          console.error('删除账户失败:', error);
          message.error('删除账户失败');
        }
      }
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingAccount) {
        // 更新账户
        const updatedAccount = { ...editingAccount, ...values };
        setAccounts(prev => prev.map(a => a.id === editingAccount.id ? updatedAccount : a));
        message.success('账户更新成功');
      } else {
        // 创建新账户
        const newAccount: Account = {
          id: Date.now().toString(),
          portfolioId,
          ...values,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAccounts(prev => [...prev, newAccount]);
        message.success('账户创建成功');
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('保存账户失败:', error);
    }
  };

  const getActionMenu = (account: Account) => (
    <Menu>
      <Menu.Item 
        key="edit" 
        icon={<EditOutlined />}
        onClick={() => handleEditAccount(account)}
      >
        编辑
      </Menu.Item>
      <Menu.Item 
        key="delete" 
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDeleteAccount(account)}
      >
        删除
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<Account> = [
    {
      title: '账户名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            <BankOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.broker}
          </div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => getAccountTypeTag(type)
    },
    {
      title: '账户号码',
      dataIndex: 'accountNumber',
      key: 'accountNumber',
      width: 150,
      render: (accountNumber) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text code style={{ marginRight: 8 }}>
            {showAccountNumbers ? accountNumber?.replace(/\*/g, '') || '未设置' : accountNumber || '未设置'}
          </Text>
        </div>
      )
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.balance - b.balance,
      render: (balance, record) => (
        <Text strong style={{ fontSize: '16px' }}>
          {formatCurrency(balance, record.currency)}
        </Text>
      )
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
      align: 'center',
      render: (currency) => <Tag>{currency}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      align: 'center',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '活跃' : '停用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  const totalBalance = accounts.reduce((sum, account) => {
    // 简化处理，这里应该根据汇率转换
    return sum + account.balance;
  }, 0);

  return (
    <Card 
      title="交易账户"
      extra={
        <Space>
          <Tooltip title={showAccountNumbers ? '隐藏账户号码' : '显示账户号码'}>
            <Button
              type="text"
              icon={showAccountNumbers ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => setShowAccountNumbers(!showAccountNumbers)}
            />
          </Tooltip>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateAccount}
          >
            添加账户
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text type="secondary">账户总数: </Text>
            <Text strong>{accounts.length}</Text>
          </div>
          <div>
            <Text type="secondary">总余额: </Text>
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              {formatCurrency(totalBalance)}
            </Text>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={accounts}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />

      <Modal
        title={editingAccount ? '编辑账户' : '添加账户'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: 'BROKERAGE',
            currency: 'CNY',
            isActive: true
          }}
        >
          <Form.Item
            name="name"
            label="账户名称"
            rules={[{ required: true, message: '请输入账户名称' }]}
          >
            <Input placeholder="请输入账户名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="账户类型"
            rules={[{ required: true, message: '请选择账户类型' }]}
          >
            <Select placeholder="请选择账户类型">
              <Option value="BROKERAGE">券商账户</Option>
              <Option value="RETIREMENT">退休账户</Option>
              <Option value="SAVINGS">储蓄账户</Option>
              <Option value="CHECKING">支票账户</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="broker"
            label="券商/银行"
          >
            <Input placeholder="请输入券商或银行名称" />
          </Form.Item>

          <Form.Item
            name="accountNumber"
            label="账户号码"
          >
            <Input placeholder="请输入账户号码（可选）" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="balance"
              label="账户余额"
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入账户余额' }]}
            >
              <Input type="number" placeholder="0.00" />
            </Form.Item>

            <Form.Item
              name="currency"
              label="币种"
              style={{ width: 100 }}
              rules={[{ required: true, message: '请选择币种' }]}
            >
              <Select>
                <Option value="CNY">CNY</Option>
                <Option value="USD">USD</Option>
                <Option value="HKD">HKD</Option>
                <Option value="EUR">EUR</Option>
                <Option value="JPY">JPY</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="isActive"
            label="账户状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="活跃" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AccountsTab;