import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Space, Tag, Modal, Form, Input, Select, Switch,
  message, Popconfirm, Tooltip, Avatar, Typography, Row, Col, Statistic,
  Drawer, Descriptions, Badge
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  LockOutlined, UnlockOutlined, ReloadOutlined, SearchOutlined,
  ExportOutlined, SettingOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { User, UserRole, Permission } from '../../types/auth';
import { UserManagementService } from '../../services/authService';
import PermissionGuard from '../../components/auth/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const { state } = useAuth();

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    users: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await UserManagementService.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      message.error(error.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = users.length;
    const active = users.filter(user => user.isActive).length;
    const inactive = total - active;
    const admins = users.filter(user => user.role === UserRole.ADMIN).length;
    const regularUsers = users.filter(user => user.role === UserRole.USER).length;

    setStats({
      total,
      active,
      inactive,
      admins,
      users: regularUsers
    });
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    setModalVisible(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setDrawerVisible(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await UserManagementService.deleteUser(userId);
      message.success('删除用户成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || '删除用户失败');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await UserManagementService.toggleUserStatus(user.id, !user.isActive);
      message.success(`${user.isActive ? '禁用' : '启用'}用户成功`);
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || '更新用户状态失败');
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      const result = await UserManagementService.resetUserPassword(user.id);
      Modal.info({
        title: '密码重置成功',
        content: (
          <div>
            <p>用户 <strong>{user.username}</strong> 的密码已重置</p>
            <p>临时密码：<Text code copyable>{result.temporaryPassword}</Text></p>
            <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
              请将此密码安全地传达给用户，用户首次登录时需要修改密码
            </p>
          </div>
        ),
        width: 500
      });
    } catch (error: any) {
      message.error(error.message || '重置密码失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await UserManagementService.updateUser(editingUser.id, values);
        message.success('更新用户成功');
      } else {
        await UserManagementService.createUser({
          ...values,
          permissions: [], // 权限将根据角色自动分配
          avatar: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        message.success('创建用户成功');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <Avatar
            size="small"
            src={record.avatar}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={role === UserRole.ADMIN ? 'red' : 'blue'}>
          {role === UserRole.ADMIN ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Badge
          status={isActive ? 'success' : 'error'}
          text={isActive ? '活跃' : '禁用'}
        />
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => (
        date ? new Date(date).toLocaleString() : '从未登录'
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<UserOutlined />}
              onClick={() => handleViewUser(record)}
            />
          </Tooltip>
          
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.isActive ? '禁用' : '启用'}>
            <Button
              type="text"
              size="small"
              icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          
          <Tooltip title="重置密码">
            <Popconfirm
              title="确定要重置此用户的密码吗？"
              onConfirm={() => handleResetPassword(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
              />
            </Popconfirm>
          </Tooltip>
          
          {record.id !== state.user?.id && (
            <Tooltip title="删除">
              <Popconfirm
                title="确定要删除此用户吗？此操作不可恢复。"
                onConfirm={() => handleDeleteUser(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PermissionGuard permission={Permission.MANAGE_USERS}>
      <div style={{ padding: '24px' }}>
        <Title level={2}>用户管理</Title>
        
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats.total}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={stats.active}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="管理员"
                value={stats.admins}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="普通用户"
                value={stats.users}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Input
                placeholder="搜索用户名或邮箱"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchUsers}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
            
            <Space>
              <Button icon={<ExportOutlined />}>
                导出
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateUser}
              >
                新建用户
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{
              total: filteredUsers.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
          />
        </Card>

        {/* 创建/编辑用户模态框 */}
        <Modal
          title={editingUser ? '编辑用户' : '新建用户'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
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
                  name="username"
                  label="用户名"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, message: '用户名至少3个字符' },
                    { max: 20, message: '用户名最多20个字符' }
                  ]}
                >
                  <Input placeholder="请输入用户名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input placeholder="请输入邮箱" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="role"
                  label="角色"
                  rules={[{ required: true, message: '请选择角色' }]}
                >
                  <Select placeholder="请选择角色">
                    <Option value={UserRole.USER}>普通用户</Option>
                    <Option value={UserRole.ADMIN}>管理员</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="isActive"
                  label="状态"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch
                    checkedChildren="启用"
                    unCheckedChildren="禁用"
                  />
                </Form.Item>
              </Col>
            </Row>

            {!editingUser && (
              <Form.Item
                name="password"
                label="初始密码"
                rules={[
                  { required: true, message: '请输入初始密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password placeholder="请输入初始密码" />
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* 用户详情抽屉 */}
        <Drawer
          title="用户详情"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={500}
        >
          {selectedUser && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="头像">
                <Avatar
                  size={64}
                  src={selectedUser.avatar}
                  icon={<UserOutlined />}
                />
              </Descriptions.Item>
              <Descriptions.Item label="用户名">
                {selectedUser.username}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {selectedUser.email}
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color={selectedUser.role === UserRole.ADMIN ? 'red' : 'blue'}>
                  {selectedUser.role === UserRole.ADMIN ? '管理员' : '普通用户'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge
                  status={selectedUser.isActive ? 'success' : 'error'}
                  text={selectedUser.isActive ? '活跃' : '禁用'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="权限">
                <Space wrap>
                  {selectedUser.permissions.map(permission => (
                    <Tag key={permission}>
                      {permission}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedUser.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(selectedUser.updatedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录">
                {selectedUser.lastLoginAt
                  ? new Date(selectedUser.lastLoginAt).toLocaleString()
                  : '从未登录'
                }
              </Descriptions.Item>
            </Descriptions>
          )}
        </Drawer>
      </div>
    </PermissionGuard>
  );
};

export default UserManagement;