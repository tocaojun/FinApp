import { Request, Response } from 'express';
import { authService, RegisterData, LoginData } from '../services/AuthService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthController {
  /**
   * 用户注册
   */
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const registerData: RegisterData = req.body;

    const result = await authService.register(registerData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });

    logger.info(`User registration successful: ${registerData.email}`);
  });

  /**
   * 用户登录
   */
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const loginData: LoginData = req.body;

    const result = await authService.login(loginData);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });

    logger.info(`User login successful: ${loginData.email}`);
  });

  /**
   * 刷新访问令牌
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });

    logger.info('Token refresh successful');
  });

  /**
   * 用户登出
   */
  static logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const { refreshToken } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    await authService.logout(userId, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });

    logger.info(`User logout successful: ${userId}`);
  });

  /**
   * 获取用户资料
   */
  static getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const profile = await authService.getUserProfile(userId);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user: profile },
    });
  });

  /**
   * 更新用户资料
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const updateData = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const updatedProfile = await authService.updateUserProfile(userId, updateData);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedProfile },
    });

    logger.info(`User profile updated: ${userId}`);
  });

  /**
   * 修改密码
   */
  static changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });

    logger.info(`Password changed for user: ${userId}`);
  });

  /**
   * 删除用户账户
   */
  static deleteAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const { password } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!password) {
      throw new AppError('Password is required to delete account', 400);
    }

    await authService.deleteAccount(userId, password);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });

    logger.info(`Account deleted for user: ${userId}`);
  });
}