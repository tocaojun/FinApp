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
import { PortfolioService } from '../../services/portfolioService';

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
      // 导入PortfolioService
      const { PortfolioService } = await import('../../services/portfolioService');
      const data = await PortfolioService.getTradingAccounts(portfolioId);

      
      // 转换数据格式以匹配组件需要的类型
      const convertedAccounts: Account[] = data.map(account => ({
        id: account.id,
        portfolioId: account.portfolioId,
        name: account.name,
        type: account.accountType,
        broker: account.broker,
        accountNumber: account.accountNumber,
        balance: account.balance,
        currency: account.currency,
        isActive: true, // 假设所有账户都是活跃的
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      }));
      

      setAccounts(convertedAccounts);
    } catch (error) {
      console.error('加载账户数据失败:', error);
      message.error('加载账户数据失败');
      setAccounts([]);
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
      content: `确定要删除账户 "${account.name}" 吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          console.log('=== 前端：开始删除账户 ===');
          console.log('portfolioId:', portfolioId);
          console.log('accountId:', account.id);
          console.log('accountName:', account.name);
          
          await PortfolioService.deleteTradingAccount(portfolioId, account.id);
          
          console.log('删除成功，重新加载账户列表...');
          await loadAccounts();
          
          console.log('=== 前端：删除账户完成 ===');
          message.success('账户删除成功');
        } catch (error: any) {
          console.error('=== 前端：删除账户失败 ===');
          console.error('错误对象:', error);
          console.error('错误消息:', error.message);
          
          const errorMsg = error.message || '删除账户失败，请重试';
          message.error(errorMsg);
        }
      }
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingAccount) {
        // 更新账户
        try {
          // 转换字段名以匹配后端期望
          const updateData = {
            name: values.name?.trim(),
            accountType: values.type,
            broker: values.broker?.trim(),
            accountNumber: values.accountNumber?.trim(),
            balance: parseFloat(values.balance) || 0,
            currency: values.currency,
            isActive: values.isActive !== undefined ? values.isActive : true
          };
          
          const updatedAccount = await PortfolioService.updateTradingAccount(
            portfolioId, 
            editingAccount.id, 
            updateData
          );
          // 将后端返回的数据转换为前端 Account 格式
          const convertedAccount: Account = {
            ...updatedAccount,
            type: updatedAccount.accountType || editingAccount.type,
            broker: updatedAccount.broker || updatedAccount.brokerName,
            createdAt: updatedAccount.createdAt?.toString() || editingAccount.createdAt
          };
          setAccounts(prev => prev.map(a => a.id === editingAccount.id ? convertedAccount : a));
          setModalVisible(false);
          setEditingAccount(null);
          form.resetFields();
          message.success('账户更新成功');
        } catch (error) {
          console.error('更新账户失败:', error);
          message.error('更新账户失败，请重试');
          return;
        }
      } else {
        // 创建新账户
        try {
          console.log('=== 前端：开始创建账户 ===');
          console.log('表单原始值:', values);
          console.log('portfolioId:', portfolioId);
          
          // 确保数据类型正确
          const accountData = {
            portfolioId: portfolioId,
            name: String(values.name).trim(),
            accountType: values.type,
            broker: values.broker ? String(values.broker).trim() : '',
            accountNumber: values.accountNumber ? String(values.accountNumber).trim() : '',
            currency: values.currency || 'CNY',
            balance: parseFloat(values.balance) || 0,
            availableBalance: parseFloat(values.balance) || 0
          };
          
          console.log('发送到后端的数据:', JSON.stringify(accountData, null, 2));
          console.log('数据类型检查:');
          console.log('- portfolioId:', typeof accountData.portfolioId, accountData.portfolioId);
          console.log('- name:', typeof accountData.name, accountData.name);
          console.log('- accountType:', typeof accountData.accountType, accountData.accountType);
          console.log('- balance:', typeof accountData.balance, accountData.balance);
          
          const createdAccount = await PortfolioService.createTradingAccount(accountData);
          console.log('后端返回:', createdAccount);
          console.log('账户创建成功，准备重新加载列表...');
          
          // 重新加载账户列表以获取最新数据
          await loadAccounts();
          console.log('列表重新加载完成');
          console.log('=== 前端：创建账户完成 ===');
          message.success('账户创建成功');
        } catch (error: any) {
          console.error('=== 前端：创建账户失败 ===');
          console.error('错误对象:', error);
          console.error('错误消息:', error.message);
          console.error('错误响应:', error.response?.data);
          
          const errorMsg = error.message || '创建账户失败，请重试';
          message.error(errorMsg);
          return;
        }
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('保存账户失败:', error);
      message.error('保存账户失败，请重试');
    }
  };

  const getActionMenu = (account: Account) => ({
    items: [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: () => handleEditAccount(account),
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDeleteAccount(account),
      },
    ],
  });

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
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
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