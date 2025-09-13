import { Router } from 'express';
import { PermissionController } from '../controllers/PermissionController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin, requirePermission } from '../middleware/permissionMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { body, param } from 'express-validator';

const router = Router();

// 验证规则
const validateRoleCreation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Role name can only contain letters, numbers, underscores, and hyphens'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),
  validateRequest,
];

const validatePermissionCreation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Permission name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_:-]+$/)
    .withMessage('Permission name can only contain letters, numbers, underscores, colons, and hyphens'),
  body('resource')
    .isLength({ min: 2, max: 50 })
    .withMessage('Resource must be between 2 and 50 characters'),
  body('action')
    .isLength({ min: 2, max: 50 })
    .withMessage('Action must be between 2 and 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),
  validateRequest,
];

const validateUserRoleAssignment = [
  body('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  body('roleId')
    .isUUID()
    .withMessage('Role ID must be a valid UUID'),
  validateRequest,
];

const validateRolePermissionAssignment = [
  body('roleId')
    .isUUID()
    .withMessage('Role ID must be a valid UUID'),
  body('permissionId')
    .isUUID()
    .withMessage('Permission ID must be a valid UUID'),
  validateRequest,
];

const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
  validateRequest,
];

// 角色管理路由
router.get('/roles', 
  authenticateToken, 
  requirePermission('admin', 'role'), 
  PermissionController.getRoles
);

router.post('/roles', 
  authenticateToken, 
  requireAdmin, 
  validateRoleCreation, 
  PermissionController.createRole
);

router.get('/roles/:id', 
  authenticateToken, 
  requirePermission('admin', 'role'), 
  validateUUID, 
  PermissionController.getRoleById
);

router.put('/roles/:id', 
  authenticateToken, 
  requireAdmin, 
  validateUUID, 
  validateRoleCreation, 
  PermissionController.updateRole
);

router.delete('/roles/:id', 
  authenticateToken, 
  requireAdmin, 
  validateUUID, 
  PermissionController.deleteRole
);

// 权限管理路由
router.get('/permissions', 
  authenticateToken, 
  requirePermission('admin', 'permission'), 
  PermissionController.getPermissions
);

router.post('/permissions', 
  authenticateToken, 
  requireAdmin, 
  validatePermissionCreation, 
  PermissionController.createPermission
);

router.get('/permissions/:id', 
  authenticateToken, 
  requirePermission('admin', 'permission'), 
  validateUUID, 
  PermissionController.getPermissionById
);

router.put('/permissions/:id', 
  authenticateToken, 
  requireAdmin, 
  validateUUID, 
  validatePermissionCreation, 
  PermissionController.updatePermission
);

router.delete('/permissions/:id', 
  authenticateToken, 
  requireAdmin, 
  validateUUID, 
  PermissionController.deletePermission
);

// 用户角色分配路由
router.post('/user-roles', 
  authenticateToken, 
  requireAdmin, 
  validateUserRoleAssignment, 
  PermissionController.assignRoleToUser
);

router.delete('/user-roles', 
  authenticateToken, 
  requireAdmin, 
  validateUserRoleAssignment, 
  PermissionController.removeRoleFromUser
);

router.get('/users/:userId/roles', 
  authenticateToken, 
  requirePermission('admin', 'user'), 
  [
    param('userId').isUUID().withMessage('User ID must be a valid UUID'),
    validateRequest,
  ], 
  PermissionController.getUserRoles
);

router.get('/users/:userId/permissions', 
  authenticateToken, 
  requirePermission('admin', 'user'), 
  [
    param('userId').isUUID().withMessage('User ID must be a valid UUID'),
    validateRequest,
  ], 
  PermissionController.getUserPermissions
);

// 角色权限分配路由
router.post('/role-permissions', 
  authenticateToken, 
  requireAdmin, 
  validateRolePermissionAssignment, 
  PermissionController.assignPermissionToRole
);

router.delete('/role-permissions', 
  authenticateToken, 
  requireAdmin, 
  validateRolePermissionAssignment, 
  PermissionController.removePermissionFromRole
);

router.get('/roles/:roleId/permissions', 
  authenticateToken, 
  requirePermission('admin', 'role'), 
  [
    param('roleId').isUUID().withMessage('Role ID must be a valid UUID'),
    validateRequest,
  ], 
  PermissionController.getRolePermissions
);

// 权限检查路由
router.post('/check-permission', 
  authenticateToken, 
  [
    body('resource')
      .isLength({ min: 1, max: 50 })
      .withMessage('Resource is required and must not exceed 50 characters'),
    body('action')
      .isLength({ min: 1, max: 50 })
      .withMessage('Action is required and must not exceed 50 characters'),
    validateRequest,
  ], 
  PermissionController.checkPermission
);

// 批量权限检查路由
router.post('/check-permissions', 
  authenticateToken, 
  [
    body('permissions')
      .isArray({ min: 1 })
      .withMessage('Permissions must be a non-empty array'),
    body('permissions.*.resource')
      .isLength({ min: 1, max: 50 })
      .withMessage('Each permission resource is required and must not exceed 50 characters'),
    body('permissions.*.action')
      .isLength({ min: 1, max: 50 })
      .withMessage('Each permission action is required and must not exceed 50 characters'),
    validateRequest,
  ], 
  PermissionController.checkPermissions
);

export default router;