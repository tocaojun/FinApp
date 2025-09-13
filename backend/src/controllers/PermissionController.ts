import { Request, Response } from 'express';
import { permissionService } from '../services/PermissionService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth';

export class PermissionController {
  /**
   * 获取所有角色
   */
  static async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await permissionService.getAllRoles();
      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      logger.error('Failed to get roles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get roles',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 创建角色
   */
  static async createRole(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;
      const role = await permissionService.createRole({ name, description });
      
      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role,
      });
      
      logger.info(`Role created: ${name}`);
    } catch (error) {
      logger.error('Failed to create role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create role',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 根据ID获取角色
   */
  static async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const roles = await permissionService.getAllRoles();
      const role = roles.find(r => r.id === id);
      
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      logger.error('Failed to get role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get role',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 更新角色
   */
  static async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Role ID is required',
        });
        return;
      }
      
      const role = await permissionService.updateRole(id, { name, description });
      
      res.json({
        success: true,
        message: 'Role updated successfully',
        data: role,
      });
      
      logger.info(`Role updated: ${id}`);
    } catch (error) {
      logger.error('Failed to update role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update role',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 删除角色
   */
  static async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Role ID is required',
        });
        return;
      }
      
      await permissionService.deleteRole(id);
      
      res.json({
        success: true,
        message: 'Role deleted successfully',
      });
      
      logger.info(`Role deleted: ${id}`);
    } catch (error) {
      logger.error('Failed to delete role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete role',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 获取所有权限
   */
  static async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await permissionService.getAllPermissions();
      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      logger.error('Failed to get permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get permissions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 创建权限 - 暂不支持，返回提示信息
   */
  static async createPermission(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Permission creation is not implemented yet. Permissions are managed through system initialization.',
    });
  }

  /**
   * 根据ID获取权限
   */
  static async getPermissionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const permissions = await permissionService.getAllPermissions();
      const permission = permissions.find(p => p.id === id);
      
      if (!permission) {
        res.status(404).json({
          success: false,
          message: 'Permission not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: permission,
      });
    } catch (error) {
      logger.error('Failed to get permission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get permission',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 更新权限 - 暂不支持
   */
  static async updatePermission(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Permission update is not implemented yet.',
    });
  }

  /**
   * 删除权限 - 暂不支持
   */
  static async deletePermission(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Permission deletion is not implemented yet.',
    });
  }

  /**
   * 为用户分配角色
   */
  static async assignRoleToUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, roleId } = req.body;
      const currentUserId = (req as AuthenticatedRequest).user?.userId || 'system';
      
      await permissionService.assignRolesToUser(userId, [roleId], currentUserId);
      
      res.json({
        success: true,
        message: 'Role assigned to user successfully',
      });
      
      logger.info(`Role ${roleId} assigned to user ${userId}`);
    } catch (error) {
      logger.error('Failed to assign role to user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign role to user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 从用户移除角色 - 暂不支持
   */
  static async removeRoleFromUser(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Role removal is not implemented yet.',
    });
  }

  /**
   * 获取用户的角色 - 暂不支持
   */
  static async getUserRoles(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Get user roles is not implemented yet.',
    });
  }

  /**
   * 获取用户的权限
   */
  static async getUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }
      
      const permissions = await permissionService.getUserPermissions(userId);
      
      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      logger.error('Failed to get user permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user permissions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 为角色分配权限
   */
  static async assignPermissionToRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId, permissionId } = req.body;
      await permissionService.assignPermissionsToRole(roleId, [permissionId]);
      
      res.json({
        success: true,
        message: 'Permission assigned to role successfully',
      });
      
      logger.info(`Permission ${permissionId} assigned to role ${roleId}`);
    } catch (error) {
      logger.error('Failed to assign permission to role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign permission to role',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 从角色移除权限 - 暂不支持
   */
  static async removePermissionFromRole(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Permission removal from role is not implemented yet.',
    });
  }

  /**
   * 获取角色的权限
   */
  static async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      
      if (!roleId) {
        res.status(400).json({
          success: false,
          message: 'Role ID is required',
        });
        return;
      }
      
      const permissions = await permissionService.getRolePermissions(roleId);
      
      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      logger.error('Failed to get role permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get role permissions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 检查权限
   */
  static async checkPermission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { resource, action } = req.body;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      
      const hasPermission = await permissionService.hasPermission(userId, resource, action);
      
      res.json({
        success: true,
        data: {
          hasPermission,
          permission: `${resource}:${action}`,
        },
      });
    } catch (error) {
      logger.error('Failed to check permission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check permission',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 批量检查权限
   */
  static async checkPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { permissions } = req.body;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      
      const results = await Promise.all(
        permissions.map(async (permission: { resource: string; action: string }) => {
          const hasPermission = await permissionService.hasPermission(
            userId,
            permission.resource,
            permission.action
          );
          return {
            permission: `${permission.resource}:${permission.action}`,
            hasPermission,
          };
        })
      );
      
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error('Failed to check permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check permissions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}