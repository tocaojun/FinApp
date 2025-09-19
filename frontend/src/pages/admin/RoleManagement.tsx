import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Space, Tag, Modal, Form, Input, Select, Switch,
  message, Popconfirm, Tooltip, Typography, Row, Col, Statistic,
  Drawer, Descriptions, Transfer, Divider, Alert
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined,
  UserOutlined, SafetyOutlined, ReloadOutlined, SearchOutlined,
  ExportOutlined, KeyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Permission, UserRole } from '../../types/auth';
import PermissionGuard from '../../components/auth/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

// 角色接口定义
interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 权限分组定义
const PERMISSION_GROUPS = {
  '系统管理': [
    Permission.MANAGE_USERS,
    Permission.MANAGE_PERMISSIONS,
    Permission.VIEW_SYSTEM_LOGS,
    Permission.SYSTEM_SETTINGS
  ],
  '产品管理': [
    Permission.MANAGE_PRODUCTS,
    Permission.UPDATE_PRICES,
    Permission.MANAGE_EXCHANGE_RATES
  ],
  '投资组合': [
    Permission.MANAGE_PORTFOLIOS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA
  ],
  '交易管理': [
    Permission.CREATE_TRANSACTIONS,
    Permission.VIEW_TRANSACTIONS,
    Permission.EDIT_TRANSACTIONS,
    Permission.DELETE_TRANSACTIONS
  ],
  '标签管理': [
    Permission.MANAGE_TAGS
  ],
  '基础权限': [
    Permission.VIEW_DASHBOARD,
    Permission.EDIT_PROFILE
  ]
};

// 权限中文名称映射
const PERMISSION_NAMES: Record<Permission, string> = {
  [Permission.MANAGE_USERS]: '用户管理',
  [Permission.MANAGE_PRODUCTS]: '产品管理',
  [Permission.UPDATE_PRICES]: '价格更新',
  [Permission.MANAGE_EXCHANGE_RATES]: '汇率管理',
  [Permission.MANAGE_PERMISSIONS]: '权限管理',
  [Permission.VIEW_SYSTEM_LOGS]: '系统日志查看',
  [Permission.SYSTEM_SETTINGS]: '系统设置',
  [Permission.MANAGE_PORTFOLIOS]: '投资组合管理',
  [Permission.CREATE_TRANSACTIONS]: '创建交易',
  [Permission.VIEW_TRANSACTIONS]: '查看交易',
  [Permission.EDIT_TRANSACTIONS]: '编辑交易',
  [Permission.DELETE_TRANSACTIONS]: '删除交易',
  [Permission.MANAGE_TAGS]: '标签管理',
  [Permission.VIEW_REPORTS]: '查看报表',
  [Permission.EXPORT_DATA]: '数据导出',
  [Permission.VIEW_DASHBOARD]: '查看仪表板',
  [Permission.EDIT_PROFILE]: '编辑个人资料'
};

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [permissionForm] = Form.useForm();
  const { state } = useAuth();

  // 统计数据
  const [stats, setStats] = useState({
    totalRoles: 0,
    activeRoles: 0,
    systemRoles: 0,
    customRoles: 0
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [roles]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // 模拟数据 - 实际项目中应该调用 API
      const mockRoles: Role[] = [
        {
          id: '1',
          name: '系统管理员',
          code: 'admin',
          description: '拥有系统所有权限的超级管理员',
          permissions: Object.values(Permission),
          userCount: 2,
          isSystem: true,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: '普通用户',
          code: 'user',
          description: '标准用户权限，可以管理自己的投资组合',
          permissions: [
            Permission.MANAGE_PORTFOLIOS,
            Permission.CREATE_TRANSACTIONS,
            Permission.VIEW_TRANSACTIONS,
            Permission.EDIT_TRANSACTIONS,
            Permission.DELETE_TRANSACTIONS,
            Permission.MANAGE_TAGS,
            Permission.VIEW_REPORTS,
            Permission.EXPORT_DATA,
            Permission.VIEW_DASHBOARD,
            Permission.EDIT_PROFILE
          ],
          userCount: 15,
          isSystem: true,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: '产品经理',
          code: 'product_manager',
          description: '负责产品管理和价格维护',
          permissions: [
            Permission.MANAGE_PRODUCTS,
            Permission.UPDATE_PRICES,
            Permission.MANAGE_EXCHANGE_RATES,
            Permission.VIEW_REPORTS,
            Permission.VIEW_DASHBOARD,
            Permission.EDIT_PROFILE
          ],
          userCount: 3,
          isSystem: false,
          isActive: true,
          createdAt: '2025-02-01T00:00:00Z',
          updatedAt: '2025-02-15T00:00:00Z'
        },
        {
          id: '4',
          name: '只读用户',
          code: 'readonly',
          description: '只能查看数据，无法进行任何修改操作',
          permissions: [
            Permission.VIEW_TRANSACTIONS,
            Permission.VIEW_REPORTS,
            Permission.VIEW_DASHBOARD
          ],
          userCount: 8,
          isSystem: false,
          isActive: true,
          createdAt: '2025-03-01T00:00:00Z',
          updatedAt: '2025-03-01T00:00:00Z'
        }
      ];
      
      setRoles(mockRoles);
    } catch (error: any) {
      message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalRoles = roles.length;
    const activeRoles = roles.filter(role => role.isActive).length;
    const systemRoles = roles.filter(role => role.isSystem).length;
    const customRoles = roles.filter(role => !role.isSystem).length;

    setStats({
      totalRoles,
      activeRoles,
      systemRoles,
      customRoles
    });
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      code: role.code,
      description: role.description,
      isActive: role.isActive
    });
    setModalVisible(true);
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    permissionForm.setFieldsValue({
      permissions: role.permissions
    });
    setPermissionModalVisible(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      // 模拟删除操作
      setRoles(prev => prev.filter(role => role.id !== roleId));
      message.success('删除角色成功');
    } catch (error: any) {
      message.error('删除角色失败');
    }
  };

  const handleToggleStatus = async (role: Role) => {
    try {
      // 模拟状态切换
      setRoles(prev => prev.map(r => 
        r.id === role.id ? { ...r, isActive: !r.isActive } : r
      ));
      message.success(`${role.isActive ? '禁用' : '启用'}角色成功`);
    } catch (error: any) {
      message.error('更新角色状态失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRole) {
        // 更新角色
        setRoles(prev => prev.map(role => 
          role.id === editingRole.id 
            ? { ...role, ...values, updatedAt: new Date().toISOString() }
            : role
        ));
        message.success('更新角色成功');
      } else {
        // 创建角色
        const newRole: Role = {
          id: Date.now().toString(),
          ...values,
          permissions: [],
          userCount: 0,
          isSystem: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setRoles(prev => [...prev, newRole]);
        message.success('创建角色成功');
      }
      setModalVisible(false);
    } catch (error: any) {
      message.error('操作失败');
    }
  };

  const handlePermissionSubmit = async (values: any) => {
    try {
      if (selectedRole) {
        setRoles(prev => prev.map(role => 
          role.id === selectedRole.id 
            ? { ...role, permissions: values.permissions, updatedAt: new Date().toISOString() }
            : role
        ));
        message.success('权限配置更新成功');
        setPermissionModalVisible(false);
      }
    } catch (error: any) {
      message.error('权限配置更新失败');
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchText.toLowerCase()) ||
    role.code.toLowerCase().includes(searchText.toLowerCase()) ||
    role.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<Role> = [
    {
      title: '角色信息',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            {text}
            {record.isSystem && (
              <Tag color="blue" size="small">系统角色</Tag>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            代码: {record.code}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: Permission[]) => (
        <div>
          <Text strong>{permissions.length}</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>
            个权限
          </div>
        </div>
      ),
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => (
        <div>
          <Text strong>{count}</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>
            个用户
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="权限配置">
            <Button
              type="text"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleManagePermissions(record)}
            />
          </Tooltip>
          
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditRole(record)}
              disabled={record.isSystem}
            />
          </Tooltip>
          
          <Tooltip title={record.isActive ? '禁用' : '启用'}>
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => handleToggleStatus(record)}
              disabled={record.isSystem}
            />
          </Tooltip>
          
          {!record.isSystem && (
            <Tooltip title="删除">
              <Popconfirm
                title="确定要删除此角色吗？此操作不可恢复。"
                onConfirm={() => handleDeleteRole(record.id)}
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

  // 权限选择器数据源
  const permissionDataSource = Object.entries(PERMISSION_GROUPS).flatMap(([group, permissions]) =>
    permissions.map(permission => ({
      key: permission,
      title: PERMISSION_NAMES[permission],
      description: group
    }))
  );

  return (
    <PermissionGuard permission={Permission.MANAGE_PERMISSIONS}>
      <div style={{ padding: '24px' }}>
        <Title level={2}>角色权限管理</Title>
        
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总角色数"
                value={stats.totalRoles}
                prefix={<SafetyOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="启用角色"
                value={stats.activeRoles}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="系统角色"
                value={stats.systemRoles}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="自定义角色"
                value={stats.customRoles}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Input
                placeholder="搜索角色名称、代码或描述"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchRoles}
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
                onClick={handleCreateRole}
              >
                新建角色
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredRoles}
            rowKey="id"
            loading={loading}
            pagination={{
              total: filteredRoles.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
          />
        </Card>

        {/* 创建/编辑角色模态框 */}
        <Modal
          title={editingRole ? '编辑角色' : '新建角色'}
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
                  name="name"
                  label="角色名称"
                  rules={[
                    { required: true, message: '请输入角色名称' },
                    { min: 2, message: '角色名称至少2个字符' },
                    { max: 50, message: '角色名称最多50个字符' }
                  ]}
                >
                  <Input placeholder="请输入角色名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="角色代码"
                  rules={[
                    { required: true, message: '请输入角色代码' },
                    { pattern: /^[a-z_]+$/, message: '角色代码只能包含小写字母和下划线' }
                  ]}
                >
                  <Input placeholder="请输入角色代码" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="角色描述"
              rules={[
                { required: true, message: '请输入角色描述' },
                { max: 200, message: '角色描述最多200个字符' }
              ]}
            >
              <Input.TextArea 
                placeholder="请输入角色描述" 
                rows={3}
              />
            </Form.Item>

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
          </Form>
        </Modal>

        {/* 权限配置模态框 */}
        <Modal
          title={`配置角色权限 - ${selectedRole?.name}`}
          open={permissionModalVisible}
          onCancel={() => setPermissionModalVisible(false)}
          onOk={() => permissionForm.submit()}
          width={800}
        >
          {selectedRole && (
            <>
              <Alert
                message="权限配置说明"
                description={`正在为角色"${selectedRole.name}"配置权限。请根据角色职责选择相应的权限。系统角色的权限配置仅供查看。`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Form
                form={permissionForm}
                layout="vertical"
                onFinish={handlePermissionSubmit}
              >
                <Form.Item
                  name="permissions"
                  label="权限选择"
                >
                  <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 16 }}>
                    {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                      <div key={group} style={{ marginBottom: 16 }}>
                        <Title level={5} style={{ marginBottom: 8 }}>
                          {group}
                        </Title>
                        <Space wrap>
                          {permissions.map(permission => (
                            <Tag
                              key={permission}
                              color={selectedRole.permissions.includes(permission) ? 'blue' : 'default'}
                              style={{ 
                                cursor: selectedRole.isSystem ? 'not-allowed' : 'pointer',
                                opacity: selectedRole.isSystem ? 0.6 : 1
                              }}
                              onClick={() => {
                                if (!selectedRole.isSystem) {
                                  const currentPermissions = permissionForm.getFieldValue('permissions') || [];
                                  const newPermissions = currentPermissions.includes(permission)
                                    ? currentPermissions.filter((p: Permission) => p !== permission)
                                    : [...currentPermissions, permission];
                                  permissionForm.setFieldsValue({ permissions: newPermissions });
                                }
                              }}
                            >
                              {PERMISSION_NAMES[permission]}
                            </Tag>
                          ))}
                        </Space>
                        <Divider style={{ margin: '12px 0' }} />
                      </div>
                    ))}
                  </div>
                </Form.Item>
              </Form>
              
              {selectedRole.isSystem && (
                <Alert
                  message="系统角色权限不可修改"
                  description="系统预定义角色的权限配置不允许修改，以确保系统安全性。"
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </>
          )}
        </Modal>
      </div>
    </PermissionGuard>
  );
};

export default RoleManagement;