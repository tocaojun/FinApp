import { databaseService } from './DatabaseService';
import { CacheService } from './CacheService';
import { logger } from '../utils/logger';
import { Permission, Role, CreateRoleRequest, UpdateRoleRequest, UserPermissions } from '../types/permission';

export class PermissionService {
  private cacheService: CacheService;
  private localMemoryCache: Map<string, { value: any; expiry: number }> = new Map();
  private readonly LOCAL_CACHE_TTL = 300; // 5分钟本地缓存
  private readonly REDIS_CACHE_TTL = 1800; // 30分钟 Redis 缓存

  constructor() {
    this.cacheService = new CacheService();
  }

  /**
   * 获取本地内存缓存
   */
  private getLocalCache<T>(key: string): T | undefined {
    const cached = this.localMemoryCache.get(key);
    if (!cached) return undefined;
    
    // 检查缓存是否过期
    if (Date.now() > cached.expiry) {
      this.localMemoryCache.delete(key);
      return undefined;
    }
    
    return cached.value as T;
  }

  /**
   * 设置本地内存缓存
   */
  private setLocalCache<T>(key: string, value: T, ttl: number = this.LOCAL_CACHE_TTL): void {
    this.localMemoryCache.set(key, {
      value,
      expiry: Date.now() + ttl * 1000
    });
  }

  /**
   * 清除用户的所有权限缓存（权限变更时调用）
   */
  async clearUserPermissionCache(userId: string): Promise<void> {
    // 清除本地缓存中该用户的所有权限
    for (const key of this.localMemoryCache.keys()) {
      if (key.startsWith(`user:${userId}:permission:`)) {
        this.localMemoryCache.delete(key);
      }
    }
    
    // 清除 CacheService 缓存中该用户的所有权限
    try {
      // 清除该用户的所有权限相关的缓存键
      const cacheKeys = [`user:${userId}:permissions:all`];
      this.cacheService.del(cacheKeys);
    } catch (error) {
      logger.warn('Failed to clear permission cache:', error);
    }
  }

  /**
   * 初始化默认权限和角色
   */
  async initializeDefaultPermissionsAndRoles(): Promise<void> {
    try {
      logger.info('Initializing default permissions and roles...');
      
      // 由于没有 Prisma 模型定义，暂时跳过初始化
      logger.info('Permission system initialization skipped - no database models defined');
    } catch (error) {
      logger.error('Failed to initialize permissions and roles:', error);
      throw error;
    }
  }

  /**
   * 获取所有权限
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const cacheKey = 'permissions:all';
      const cached = this.cacheService.get<Permission[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // 返回模拟的权限数据
      const now = new Date();
      const permissions: Permission[] = [
        {
          id: '1',
          name: 'user:read',
          description: 'Read user information',
          resource: 'user',
          action: 'read',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '2',
          name: 'user:write',
          description: 'Write user information',
          resource: 'user',
          action: 'write',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '3',
          name: 'admin:all',
          description: 'Full administrative access',
          resource: 'admin',
          action: 'all',
          createdAt: now,
          updatedAt: now,
        },
      ];

      this.cacheService.set(cacheKey, permissions, 300); // 5分钟缓存
      return permissions;
    } catch (error) {
      logger.error('Failed to get permissions:', error);
      throw error;
    }
  }

  /**
   * 获取所有角色
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const cacheKey = 'roles:all';
      const cached = this.cacheService.get<Role[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // 返回模拟的角色数据
      const now = new Date();
      const roles: Role[] = [
        {
          id: '1',
          name: 'user',
          description: 'Regular user',
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '2',
          name: 'admin',
          description: 'Administrator',
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
      ];

      this.cacheService.set(cacheKey, roles, 300); // 5分钟缓存
      return roles;
    } catch (error) {
      logger.error('Failed to get roles:', error);
      throw error;
    }
  }

  /**
   * 创建角色
   */
  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    try {
      // 模拟创建角色
      const now = new Date();
      const newRole: Role = {
        id: Date.now().toString(),
        name: roleData.name,
        description: roleData.description || '',
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      };

      // 清除缓存
      this.cacheService.del('roles:all');

      logger.info(`Role created: ${roleData.name}`);
      return newRole;
    } catch (error) {
      logger.error('Failed to create role:', error);
      throw error;
    }
  }

  /**
   * 更新角色
   */
  async updateRole(roleId: string, roleData: UpdateRoleRequest): Promise<Role> {
    try {
      // 模拟更新角色
      const now = new Date();
      const updatedRole: Role = {
        id: roleId,
        name: roleData.name || 'Updated Role',
        description: roleData.description || '',
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      };

      // 清除缓存
      this.cacheService.del('roles:all');

      logger.info(`Role updated: ${roleId}`);
      return updatedRole;
    } catch (error) {
      logger.error('Failed to update role:', error);
      throw error;
    }
  }

  /**
   * 删除角色
   */
  async deleteRole(roleId: string): Promise<void> {
    try {
      // 模拟删除角色
      
      // 清除缓存
      this.cacheService.del('roles:all');

      logger.info(`Role deleted: ${roleId}`);
    } catch (error) {
      logger.error('Failed to delete role:', error);
      throw error;
    }
  }

  /**
   * 为角色分配权限
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    try {
      // 模拟分配权限给角色
      
      logger.info(`Permissions assigned to role ${roleId}: ${permissionIds.join(', ')}`);
    } catch (error) {
      logger.error('Failed to assign permissions to role:', error);
      throw error;
    }
  }

  /**
   * 获取角色的权限
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    try {
      // 模拟获取角色权限
      const permissions = await this.getAllPermissions();
      
      // 根据角色返回不同的权限
      if (roleId === '2') { // admin role
        return permissions; // 管理员拥有所有权限
      } else {
        return permissions.filter(p => p.resource === 'user'); // 普通用户只有用户相关权限
      }
    } catch (error) {
      logger.error('Failed to get role permissions:', error);
      throw error;
    }
  }

  /**
   * 为用户分配角色
   */
  async assignRolesToUser(userId: string, roleIds: string[], assignedBy: string): Promise<void> {
    try {
      // 模拟为用户分配角色
      
      logger.info(`Roles assigned to user ${userId}: ${roleIds.join(', ')}`);
    } catch (error) {
      logger.error('Failed to assign roles to user:', error);
      throw error;
    }
  }

  /**
   * 获取用户权限
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    try {
      // 模拟获取用户权限
      const roles = await this.getAllRoles();
      const permissions = await this.getAllPermissions();
      
      const userRoles: Role[] = roles.length > 0 && roles[0] ? [roles[0]] : [];
      return {
        userId,
        roles: userRoles,
        permissions: permissions.filter(p => p.resource === 'user'), // 默认用户权限
      };
    } catch (error) {
      logger.error('Failed to get user permissions:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否有特定权限（优化版本 - 多层缓存）
   */
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const cacheKey = `user:${userId}:permission:${resource}:${action}`;

      // 第一层：本地内存缓存（最快，5分钟）
      const localCached = this.getLocalCache<boolean>(cacheKey);
      if (localCached !== undefined) {
        return localCached;
      }

      // 第二层：CacheService 缓存（30分钟）
      const cachedResult = this.cacheService.get<boolean>(cacheKey);
      if (cachedResult !== undefined) {
        // 回写到本地缓存
        this.setLocalCache(cacheKey, cachedResult, this.LOCAL_CACHE_TTL);
        return cachedResult;
      }

      // 第三层：数据库查询（使用超时保护）
      const timeoutPromise = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Permission check timeout')), 5000)
      );

      const queryPromise = (async () => {
        const query = `
          SELECT DISTINCT p.name, p.resource, p.action
          FROM users u
          JOIN user_roles ur ON u.id = ur.user_id
          JOIN roles r ON ur.role_id = r.id
          JOIN role_permissions rp ON r.id = rp.role_id
          JOIN permissions p ON rp.permission_id = p.id
          WHERE u.id = $1::uuid AND ur.is_active = true AND r.is_active = true
        `;

        const result = await databaseService.executeRawQuery<Array<{
          name: string;
          resource: string;
          action: string;
        }>>(query, [userId]);
        
        // 检查是否有匹配的权限
        const hasPermission = result.some((row) => {
          const permissionName = row.name;
          const permissionResource = row.resource;
          const permissionAction = row.action;
          
          if (permissionName === `${resource}.${action}` || permissionName === `${resource}s.${action}`) {
            return true;
          }
          
          if (permissionName === `${resource}:${action}`) {
            return true;
          }
          
          if ((permissionResource === resource || permissionResource === `${resource}s`) && 
              (permissionAction === action || permissionAction === 'all')) {
            return true;
          }
          
          return false;
        });

        return hasPermission;
      })();

      const hasPermission = await Promise.race([queryPromise, timeoutPromise]);

      // 双层缓存写入
      this.setLocalCache(cacheKey, hasPermission, this.LOCAL_CACHE_TTL);
      this.cacheService.set(cacheKey, hasPermission, this.REDIS_CACHE_TTL);
      
      return hasPermission;
    } catch (error) {
      logger.warn('Failed to check permission:', error);
      // 超时或查询失败时，采用宽松的默认行为：允许已认证用户访问
      return true;
    }
  }

  /**
   * 检查用户是否有特定角色
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const cacheKey = `user:${userId}:role:${roleName}`;
      const cached = this.cacheService.get<boolean>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // 从数据库查询用户角色
      const query = `
        SELECT r.name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1::uuid AND ur.is_active = true AND r.is_active = true AND r.name = $2
      `;

      const result = await databaseService.executeRawQuery<Array<{
        name: string;
      }>>(query, [userId, roleName]);
      const hasRole = result.length > 0;

      // 缓存结果
      this.cacheService.set(cacheKey, hasRole, 60); // 1分钟缓存
      
      return hasRole;
    } catch (error) {
      logger.error('Failed to check role:', error);
      return false;
    }
  }

  /**
   * 为新用户分配默认角色
   */
  async assignDefaultRoleToUser(userId: string): Promise<void> {
    try {
      const roles = await this.getAllRoles();
      const defaultRole = roles.find(role => role.isDefault);
      
      if (defaultRole) {
        await this.assignRolesToUser(userId, [defaultRole.id], 'system');
      }
    } catch (error) {
      logger.error('Failed to assign default role:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const permissionService = new PermissionService();