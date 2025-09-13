import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { databaseService } from '../services/DatabaseService';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { JwtPayload, AuthenticatedRequest } from '../types/auth';

export const authenticateToken = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Access token required', 401, 'MISSING_TOKEN');
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError('JWT secret not configured', 500, 'JWT_CONFIG_ERROR');
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      
      // 验证用户是否存在且活跃
      const user = await databaseService.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          isActive: true,
          isVerified: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 401, 'USER_NOT_FOUND');
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
      }

      if (!user.isVerified) {
        throw new AppError('Account is not verified', 401, 'ACCOUNT_NOT_VERIFIED');
      }

      // 将用户信息添加到请求对象
      req.user = {
        id: user.id,
        userId: user.id,
        email: user.email,
        username: user.username || undefined,
      };

      logger.debug(`User authenticated: ${user.email}`);
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      } else if (error instanceof AppError) {
        throw error;
      } else {
        logger.error('Authentication error:', error);
        throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
      }
    }
  }
);

export const optionalAuth = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // 没有token，继续执行但不设置用户信息
      return next();
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next();
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      
      const user = await databaseService.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          isActive: true,
          isVerified: true,
        },
      });

      if (user && user.isActive && user.isVerified) {
        req.user = {
          id: user.id,
          userId: user.id,
          email: user.email,
          username: user.username || undefined,
        };
      }
    } catch (error) {
      // 可选认证失败时不抛出错误，只记录日志
      logger.debug('Optional authentication failed:', error);
    }

    next();
  }
);

export const requireRole = (roles: string[]) => {
  return asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      // 查询用户角色
      const userRoles = await databaseService.prisma.userRole.findMany({
        where: { userId: req.user.id },
        include: {
          role: true,
        },
      });

      const userRoleNames = userRoles.map((ur: any) => ur.role.name);
      const hasRequiredRole = roles.some(role => userRoleNames.includes(role));

      if (!hasRequiredRole) {
        throw new AppError(
          `Access denied. Required roles: ${roles.join(', ')}`,
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      logger.debug(`User ${req.user.email} authorized with roles: ${userRoleNames.join(', ')}`);
      next();
    }
  );
};

export const requirePermission = (permissions: string[]) => {
  return asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      // 查询用户权限（通过角色）
      const userPermissions = await databaseService.prisma.userRole.findMany({
        where: { userId: req.user.id },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      const allPermissions = userPermissions.flatMap((ur: any) =>
        ur.role.rolePermissions.map((rp: any) => rp.permission.name)
      );

      const hasRequiredPermission = permissions.some(permission =>
        allPermissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        throw new AppError(
          `Access denied. Required permissions: ${permissions.join(', ')}`,
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      logger.debug(`User ${req.user.email} authorized with permissions: ${allPermissions.join(', ')}`);
      next();
    }
  );
};