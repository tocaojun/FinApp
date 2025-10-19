import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { databaseService } from '@/services/DatabaseService';
import { cacheService } from '@/services/CacheService';
import { logger } from '@/utils/logger';
import { AppError } from '@/middleware/errorHandler';

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginData {
  username?: string;
  email?: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
  currencyPreference?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly JWT_REFRESH_EXPIRES_IN: string;
  private readonly SALT_ROUNDS: number;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
    this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      logger.warn('JWT secrets not found in environment variables. Using default values.');
    }
  }

  /**
   * 用户注册
   */
  async register(data: RegisterData): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const { email, password, username, firstName, lastName, phone } = data;

    // 检查邮箱是否已存在
    const existingUser = await databaseService.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
    }

    // 检查用户名是否已存在（如果提供了用户名）
    if (username) {
      const existingUsername = await databaseService.prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        throw new AppError('Username already exists', 409, 'USERNAME_EXISTS');
      }
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // 创建用户
    const user = await databaseService.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        username,
        firstName,
        lastName,
        phone,
        isActive: true,
        isVerified: false,
      },
    });

    // 生成令牌
    const tokens = await this.generateTokens(user.id, user.email);

    // 记录用户会话
    await this.recordUserSession(user.id, tokens.accessToken);

    // 返回用户信息（不包含密码）
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      phone: user.phone || undefined,
      avatarUrl: user.avatarUrl || undefined,
      timezone: user.timezone || undefined,
      language: user.language || undefined,
      currencyPreference: user.currencyPreference || undefined,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info(`User registered successfully: ${email}`);
    return { user: userProfile, tokens };
  }

  /**
   * 用户登录
   */
  async login(data: LoginData): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const { username, email, password } = data;

    // 查找用户 - 支持用户名或邮箱登录
    const user = await databaseService.prisma.user.findFirst({
      where: {
        OR: [
          { username: username || '' },
          { email: email || '' }
        ]
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // 检查账户状态
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 423, 'ACCOUNT_LOCKED');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // 记录失败的登录尝试
      await this.recordFailedLoginAttempt(user.id);
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // 检查账户是否被锁定
    const isLocked = await this.isAccountLocked(user.id);
    if (isLocked) {
      throw new AppError('Account is temporarily locked due to multiple failed login attempts', 423, 'ACCOUNT_LOCKED');
    }

    // 清除失败的登录尝试记录
    await this.clearFailedLoginAttempts(user.id);

    // 生成令牌
    const tokens = await this.generateTokens(user.id, user.email);

    // 记录用户会话
    await this.recordUserSession(user.id, tokens.accessToken);

    // 更新最后登录时间
    await databaseService.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 返回用户信息（不包含密码）
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      phone: user.phone || undefined,
      avatarUrl: user.avatarUrl || undefined,
      timezone: user.timezone || undefined,
      language: user.language || undefined,
      currencyPreference: user.currencyPreference || undefined,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info(`User logged in successfully: ${email}`);
    return { user: userProfile, tokens };
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;

      // 检查用户是否存在且活跃
      const user = await databaseService.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
      }

      // 生成新的令牌
      const tokens = await this.generateTokens(user.id, user.email);

      // 记录新的用户会话
      await this.recordUserSession(user.id, tokens.accessToken);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
      }
      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // 解码访问令牌以获取用户信息
      const decoded = jwt.decode(accessToken) as any;
      
      if (decoded && decoded.userId) {
        // 删除用户会话记录 - 由于token已经哈希，我们删除该用户的所有会话
        await databaseService.prisma.userSession.deleteMany({
          where: {
            userId: decoded.userId,
            isActive: true,
          },
        });

        logger.info(`User logged out: ${decoded.email}`);
      }
    } catch (error) {
      logger.error('Error during logout:', error);
      // 即使出错也不抛出异常，因为登出应该总是成功
    }
  }

  /**
   * 获取用户资料
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await databaseService.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      phone: user.phone || undefined,
      avatarUrl: user.avatarUrl || undefined,
      timezone: user.timezone || undefined,
      language: user.language || undefined,
      currencyPreference: user.currencyPreference || undefined,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * 更新用户资料
   */
  async updateUserProfile(userId: string, updateData: Partial<UserProfile>): Promise<UserProfile> {
    // 检查用户名是否已存在（如果要更新用户名）
    if (updateData.username) {
      const existingUser = await databaseService.prisma.user.findFirst({
        where: {
          username: updateData.username,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new AppError('Username already exists', 409, 'USERNAME_EXISTS');
      }
    }

    // 更新用户信息
    const updatedUser = await databaseService.prisma.user.update({
      where: { id: userId },
      data: {
        username: updateData.username,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone,
        timezone: updateData.timezone,
        language: updateData.language,
        currencyPreference: updateData.currencyPreference,
        updatedAt: new Date(),
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username || undefined,
      firstName: updatedUser.firstName || undefined,
      lastName: updatedUser.lastName || undefined,
      phone: updatedUser.phone || undefined,
      avatarUrl: updatedUser.avatarUrl || undefined,
      timezone: updatedUser.timezone || undefined,
      language: updatedUser.language || undefined,
      currencyPreference: updatedUser.currencyPreference || undefined,
      isActive: updatedUser.isActive,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  /**
   * 验证访问令牌
   */
  async verifyAccessToken(token: string): Promise<{ userId: string; email: string }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // 检查用户是否存在且活跃
      const user = await databaseService.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
      }
      throw error;
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload = { userId, email };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    // 计算过期时间（秒）
    const decoded = jwt.decode(accessToken) as any;
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * 记录用户会话
   */
  private async recordUserSession(userId: string, token: string): Promise<void> {
    try {
      // 计算令牌过期时间
      const decoded = jwt.decode(token) as any;
      const expiresAt = new Date(decoded.exp * 1000);

      // 对token进行哈希处理以提高安全性
      const tokenHash = await bcrypt.hash(token, 10);

      await databaseService.prisma.userSession.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
          isActive: true,
        },
      });
    } catch (error) {
      logger.error('Failed to record user session:', error);
      // 不抛出错误，因为会话记录失败不应该影响登录
    }
  }

  /**
   * 记录失败的登录尝试
   */
  private async recordFailedLoginAttempt(userId: string): Promise<void> {
    const cacheKey = `failed_login_${userId}`;
    const attempts = (cacheService.get(cacheKey) as number) || 0;
    cacheService.set(cacheKey, attempts + 1, 900); // 15分钟过期
  }

  /**
   * 清除失败的登录尝试记录
   */
  private async clearFailedLoginAttempts(userId: string): Promise<void> {
    const cacheKey = `failed_login_${userId}`;
    cacheService.del(cacheKey);
  }

  /**
   * 检查账户是否被锁定
   */
  private async isAccountLocked(userId: string): Promise<boolean> {
    const cacheKey = `failed_login_${userId}`;
    const attempts = (cacheService.get(cacheKey) as number) || 0;
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
    
    return attempts >= maxAttempts;
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // 获取用户信息
    const user = await databaseService.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }

    // 验证新密码强度
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new AppError(
        'New password must contain at least 8 characters with uppercase, lowercase, number and special character',
        400,
        'WEAK_PASSWORD'
      );
    }

    // 检查新密码是否与当前密码相同
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new AppError('New password must be different from current password', 400, 'SAME_PASSWORD');
    }

    // 加密新密码
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await databaseService.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    // 清除所有用户会话，强制重新登录
    await databaseService.prisma.userSession.deleteMany({
      where: { userId },
    });

    logger.info(`Password changed successfully for user: ${userId}`);
  }

  /**
   * 删除用户账户
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    // 获取用户信息
    const user = await databaseService.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Password is incorrect', 400, 'INVALID_PASSWORD');
    }

    // 删除用户相关数据（级联删除）
    await databaseService.prisma.$transaction(async (prisma) => {
      // 删除用户会话
      await prisma.userSession.deleteMany({
        where: { userId },
      });

      // 删除用户角色关联
      await prisma.userRole.deleteMany({
        where: { userId },
      });

      // 软删除用户（标记为非活跃）
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: `deleted_${Date.now()}_${user.email}`, // 防止邮箱冲突
          updatedAt: new Date(),
        },
      });
    });

    // 清除缓存中的用户数据
    const cacheKey = `user_profile_${userId}`;
    cacheService.del(cacheKey);

    logger.info(`Account deleted successfully for user: ${userId}`);
  }
}

// 导出单例实例
export const authService = new AuthService();