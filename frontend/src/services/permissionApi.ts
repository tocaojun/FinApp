import axios from 'axios';
import { Permission, UserRole } from '../types/auth';

const API_BASE_URL = 'http://localhost:8000/api';

// 权限矩阵数据接口
export interface PermissionMatrixData {
  roleId: string;
  roleName: string;
  roleCode: string;
  isSystem: boolean;
  permissions: Record<Permission, boolean>;
}

export interface RolePermissionUpdate {
  roleId: string;
  permissions: Record<Permission, boolean>;
}

// 获取权限矩阵数据
export const getPermissionMatrix = async (): Promise<PermissionMatrixData[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/permissions/matrix`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch permission matrix:', error);
    // 返回模拟数据作为后备
    return generateMockPermissionMatrix();
  }
};

// 更新角色权限
export const updateRolePermissions = async (updates: RolePermissionUpdate[]): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/admin/permissions/matrix`, {
      updates
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to update role permissions:', error);
    throw error;
  }
};

// 获取所有角色
export const getAllRoles = async (): Promise<{ id: string; name: string; code: string; isSystem: boolean }[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/roles`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return [];
  }
};

// 生成模拟权限矩阵数据（作为后备）
const generateMockPermissionMatrix = (): PermissionMatrixData[] => {
  return [
    {
      roleId: 'admin',
      roleName: '系统管理员',
      roleCode: 'ADMIN',
      isSystem: true,
      permissions: {
        [Permission.MANAGE_USERS]: true,
        [Permission.MANAGE_PERMISSIONS]: true,
        [Permission.VIEW_SYSTEM_LOGS]: true,
        [Permission.SYSTEM_SETTINGS]: true,
        [Permission.MANAGE_PRODUCTS]: true,
        [Permission.UPDATE_PRICES]: true,
        [Permission.MANAGE_EXCHANGE_RATES]: true,
        [Permission.MANAGE_PORTFOLIOS]: true,
        [Permission.CREATE_TRANSACTIONS]: true,
        [Permission.VIEW_TRANSACTIONS]: true,
        [Permission.EDIT_TRANSACTIONS]: true,
        [Permission.DELETE_TRANSACTIONS]: true,
        [Permission.MANAGE_TAGS]: true,
        [Permission.VIEW_REPORTS]: true,
        [Permission.EXPORT_DATA]: true,
        [Permission.IMPORT_DATA]: true,
        [Permission.VIEW_ANALYTICS]: true,
        [Permission.MANAGE_ALERTS]: true,
        [Permission.VIEW_AUDIT_LOGS]: true,
        [Permission.BACKUP_RESTORE]: true
      }
    },
    {
      roleId: 'portfolio_manager',
      roleName: '投资组合经理',
      roleCode: 'PORTFOLIO_MANAGER',
      isSystem: false,
      permissions: {
        [Permission.MANAGE_USERS]: false,
        [Permission.MANAGE_PERMISSIONS]: false,
        [Permission.VIEW_SYSTEM_LOGS]: false,
        [Permission.SYSTEM_SETTINGS]: false,
        [Permission.MANAGE_PRODUCTS]: true,
        [Permission.UPDATE_PRICES]: true,
        [Permission.MANAGE_EXCHANGE_RATES]: false,
        [Permission.MANAGE_PORTFOLIOS]: true,
        [Permission.CREATE_TRANSACTIONS]: true,
        [Permission.VIEW_TRANSACTIONS]: true,
        [Permission.EDIT_TRANSACTIONS]: true,
        [Permission.DELETE_TRANSACTIONS]: false,
        [Permission.MANAGE_TAGS]: true,
        [Permission.VIEW_REPORTS]: true,
        [Permission.EXPORT_DATA]: true,
        [Permission.IMPORT_DATA]: true,
        [Permission.VIEW_ANALYTICS]: true,
        [Permission.MANAGE_ALERTS]: true,
        [Permission.VIEW_AUDIT_LOGS]: false,
        [Permission.BACKUP_RESTORE]: false
      }
    },
    {
      roleId: 'trader',
      roleName: '交易员',
      roleCode: 'TRADER',
      isSystem: false,
      permissions: {
        [Permission.MANAGE_USERS]: false,
        [Permission.MANAGE_PERMISSIONS]: false,
        [Permission.VIEW_SYSTEM_LOGS]: false,
        [Permission.SYSTEM_SETTINGS]: false,
        [Permission.MANAGE_PRODUCTS]: false,
        [Permission.UPDATE_PRICES]: false,
        [Permission.MANAGE_EXCHANGE_RATES]: false,
        [Permission.MANAGE_PORTFOLIOS]: false,
        [Permission.CREATE_TRANSACTIONS]: true,
        [Permission.VIEW_TRANSACTIONS]: true,
        [Permission.EDIT_TRANSACTIONS]: false,
        [Permission.DELETE_TRANSACTIONS]: false,
        [Permission.MANAGE_TAGS]: false,
        [Permission.VIEW_REPORTS]: true,
        [Permission.EXPORT_DATA]: false,
        [Permission.IMPORT_DATA]: false,
        [Permission.VIEW_ANALYTICS]: true,
        [Permission.MANAGE_ALERTS]: false,
        [Permission.VIEW_AUDIT_LOGS]: false,
        [Permission.BACKUP_RESTORE]: false
      }
    },
    {
      roleId: 'analyst',
      roleName: '分析师',
      roleCode: 'ANALYST',
      isSystem: false,
      permissions: {
        [Permission.MANAGE_USERS]: false,
        [Permission.MANAGE_PERMISSIONS]: false,
        [Permission.VIEW_SYSTEM_LOGS]: false,
        [Permission.SYSTEM_SETTINGS]: false,
        [Permission.MANAGE_PRODUCTS]: false,
        [Permission.UPDATE_PRICES]: false,
        [Permission.MANAGE_EXCHANGE_RATES]: false,
        [Permission.MANAGE_PORTFOLIOS]: false,
        [Permission.CREATE_TRANSACTIONS]: false,
        [Permission.VIEW_TRANSACTIONS]: true,
        [Permission.EDIT_TRANSACTIONS]: false,
        [Permission.DELETE_TRANSACTIONS]: false,
        [Permission.MANAGE_TAGS]: false,
        [Permission.VIEW_REPORTS]: true,
        [Permission.EXPORT_DATA]: true,
        [Permission.IMPORT_DATA]: false,
        [Permission.VIEW_ANALYTICS]: true,
        [Permission.MANAGE_ALERTS]: false,
        [Permission.VIEW_AUDIT_LOGS]: false,
        [Permission.BACKUP_RESTORE]: false
      }
    },
    {
      roleId: 'viewer',
      roleName: '只读用户',
      roleCode: 'VIEWER',
      isSystem: false,
      permissions: {
        [Permission.MANAGE_USERS]: false,
        [Permission.MANAGE_PERMISSIONS]: false,
        [Permission.VIEW_SYSTEM_LOGS]: false,
        [Permission.SYSTEM_SETTINGS]: false,
        [Permission.MANAGE_PRODUCTS]: false,
        [Permission.UPDATE_PRICES]: false,
        [Permission.MANAGE_EXCHANGE_RATES]: false,
        [Permission.MANAGE_PORTFOLIOS]: false,
        [Permission.CREATE_TRANSACTIONS]: false,
        [Permission.VIEW_TRANSACTIONS]: true,
        [Permission.EDIT_TRANSACTIONS]: false,
        [Permission.DELETE_TRANSACTIONS]: false,
        [Permission.MANAGE_TAGS]: false,
        [Permission.VIEW_REPORTS]: true,
        [Permission.EXPORT_DATA]: false,
        [Permission.IMPORT_DATA]: false,
        [Permission.VIEW_ANALYTICS]: true,
        [Permission.MANAGE_ALERTS]: false,
        [Permission.VIEW_AUDIT_LOGS]: false,
        [Permission.BACKUP_RESTORE]: false
      }
    }
  ];
};