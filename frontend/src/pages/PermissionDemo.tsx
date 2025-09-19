import React from 'react';
import { Card, Space, Typography, Button, Alert, Divider } from 'antd';
import { UserOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import PermissionGuard from '../components/auth/PermissionGuard';
import { Permission } from '../types/auth';

const { Title, Text } = Typography;

const PermissionDemo: React.FC = () => {
  const { state, logout } = useAuth();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>
              <SafetyCertificateOutlined /> 权限控制系统演示
            </Title>
            <Text type="secondary">
              这是一个完整的 RBAC (基于角色的访问控制) 系统演示
            </Text>
          </div>

          <Divider />

          {/* 当前用户信息 */}
          <Card title="当前用户信息" size="small">
            <Space direction="vertical">
              <Text><UserOutlined /> 用户名: {state.user?.username}</Text>
              <Text><TeamOutlined /> 角色: {state.user?.role}</Text>
              <Text>权限数量: {state.user?.permissions?.length || 0}</Text>
              <Button onClick={logout} type="primary" danger size="small">
                退出登录
              </Button>
            </Space>
          </Card>

          <Divider />

          {/* 权限演示 */}
          <Title level={3}>权限控制演示</Title>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* 用户管理权限 */}
            <PermissionGuard 
              permission={Permission.MANAGE_USERS}
              fallback={
                <Alert 
                  message="用户管理" 
                  description="您没有用户管理权限，此功能仅对系统管理员开放" 
                  type="warning" 
                  showIcon 
                />
              }
            >
              <Alert 
                message="用户管理" 
                description="✅ 您拥有用户管理权限！可以创建、编辑、删除用户" 
                type="success" 
                showIcon 
                action={
                  <Button size="small" type="primary">
                    进入用户管理
                  </Button>
                }
              />
            </PermissionGuard>

            {/* 角色管理权限 */}
            <PermissionGuard 
              permission={Permission.MANAGE_PERMISSIONS}
              fallback={
                <Alert 
                  message="权限管理" 
                  description="您没有权限管理权限，此功能仅对系统管理员开放" 
                  type="warning" 
                  showIcon 
                />
              }
            >
              <Alert 
                message="权限管理" 
                description="✅ 您拥有权限管理权限！可以配置角色和权限" 
                type="success" 
                showIcon 
                action={
                  <Button size="small" type="primary">
                    进入权限管理
                  </Button>
                }
              />
            </PermissionGuard>

            {/* 系统日志权限 */}
            <PermissionGuard 
              permission={Permission.VIEW_SYSTEM_LOGS}
              fallback={
                <Alert 
                  message="系统日志" 
                  description="您没有查看系统日志的权限" 
                  type="warning" 
                  showIcon 
                />
              }
            >
              <Alert 
                message="系统日志" 
                description="✅ 您可以查看系统日志！" 
                type="success" 
                showIcon 
                action={
                  <Button size="small" type="primary">
                    查看系统日志
                  </Button>
                }
              />
            </PermissionGuard>

            {/* 普通用户权限 */}
            <PermissionGuard 
              permission={Permission.MANAGE_PORTFOLIOS}
              fallback={
                <Alert 
                  message="投资组合管理" 
                  description="您没有投资组合管理权限" 
                  type="error" 
                  showIcon 
                />
              }
            >
              <Alert 
                message="投资组合管理" 
                description="✅ 您可以管理投资组合！" 
                type="success" 
                showIcon 
                action={
                  <Button size="small" type="primary">
                    管理投资组合
                  </Button>
                }
              />
            </PermissionGuard>
          </Space>

          <Divider />

          {/* 测试账户信息 */}
          <Card title="测试账户" size="small">
            <Space direction="vertical">
              <Text strong>管理员账户:</Text>
              <Text>用户名: admin</Text>
              <Text>密码: admin123</Text>
              <Text>权限: 拥有所有权限</Text>
              
              <Divider type="vertical" />
              
              <Text strong>普通用户账户:</Text>
              <Text>用户名: user</Text>
              <Text>密码: user123</Text>
              <Text>权限: 仅有基础权限</Text>
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default PermissionDemo;