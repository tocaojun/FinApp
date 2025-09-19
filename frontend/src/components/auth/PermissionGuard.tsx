import React, { ReactNode } from 'react';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Permission, UserRole } from '../../types/auth';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole;
  roles?: UserRole[];
  requireAll?: boolean; // 是否需要所有权限，默认为 false（任意一个即可）
  fallback?: ReactNode;
  redirectTo?: string;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback,
  redirectTo
}) => {
  const { state, hasPermission, hasRole, hasAnyPermission, hasAllPermissions } = useAuth();

  // 如果用户未登录，显示登录提示
  if (!state.isAuthenticated) {
    return (
      <Result
        status="403"
        title="需要登录"
        subTitle="请先登录以访问此功能"
        extra={
          <Button type="primary" onClick={() => window.location.href = '/login'}>
            去登录
          </Button>
        }
      />
    );
  }

  // 检查单个权限
  if (permission && !hasPermission(permission)) {
    return renderNoPermission();
  }

  // 检查多个权限
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasRequiredPermissions) {
      return renderNoPermission();
    }
  }

  // 检查单个角色
  if (role && !hasRole(role)) {
    return renderNoPermission();
  }

  // 检查多个角色
  if (roles.length > 0) {
    const hasRequiredRole = roles.some(r => hasRole(r));
    if (!hasRequiredRole) {
      return renderNoPermission();
    }
  }

  // 权限检查通过，渲染子组件
  return <>{children}</>;

  function renderNoPermission() {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (redirectTo) {
      window.location.href = redirectTo;
      return null;
    }

    return (
      <Result
        status="403"
        title="权限不足"
        subTitle="您没有访问此功能的权限，请联系管理员"
        icon={<LockOutlined />}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    );
  }
};

export default PermissionGuard;