export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  createdAt: Date;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  createdAt: Date;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface AssignRoleRequest {
  userId: string;
  roleIds: string[];
}

export interface PermissionCheck {
  resource: string;
  action: string;
}

export interface UserPermissions {
  userId: string;
  roles: Role[];
  permissions: Permission[];
}

// 预定义权限常量
export const PERMISSIONS = {
  PORTFOLIO_READ: 'portfolio:read',
  PORTFOLIO_WRITE: 'portfolio:write',
  TRANSACTION_READ: 'transaction:read',
  TRANSACTION_WRITE: 'transaction:write',
  ADMIN_USER: 'admin:user',
  ADMIN_SYSTEM: 'admin:system',
} as const;

// 预定义角色常量
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
} as const;