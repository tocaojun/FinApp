// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// 权限枚举
export enum Permission {
  // 系统管理员权限
  MANAGE_USERS = 'manage_users',
  MANAGE_PRODUCTS = 'manage_products',
  UPDATE_PRICES = 'update_prices',
  MANAGE_EXCHANGE_RATES = 'manage_exchange_rates',
  MANAGE_PERMISSIONS = 'manage_permissions',
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  SYSTEM_SETTINGS = 'system_settings',
  
  // 普通用户权限
  MANAGE_PORTFOLIOS = 'manage_portfolios',
  CREATE_TRANSACTIONS = 'create_transactions',
  VIEW_TRANSACTIONS = 'view_transactions',
  EDIT_TRANSACTIONS = 'edit_transactions',
  DELETE_TRANSACTIONS = 'delete_transactions',
  MANAGE_TAGS = 'manage_tags',
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data',
  
  // 共同权限
  VIEW_DASHBOARD = 'view_dashboard',
  EDIT_PROFILE = 'edit_profile'
}

// 用户信息接口
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

// 登录请求接口
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// 登录响应接口
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}

// 注册请求接口
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// 权限检查结果
export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // 系统管理员拥有所有权限
    Permission.MANAGE_USERS,
    Permission.MANAGE_PRODUCTS,
    Permission.UPDATE_PRICES,
    Permission.MANAGE_EXCHANGE_RATES,
    Permission.MANAGE_PERMISSIONS,
    Permission.VIEW_SYSTEM_LOGS,
    Permission.SYSTEM_SETTINGS,
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
  [UserRole.USER]: [
    // 普通用户权限
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
  ]
};