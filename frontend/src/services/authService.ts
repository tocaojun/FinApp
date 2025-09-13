import { apiPost } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  timezone: string;
  language: string;
  currencyPreference: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export class AuthService {
  // 登录
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiPost<{
      success: boolean;
      data: AuthResponse;
      message: string;
    }>('/auth/login', credentials);
    
    if (response.success) {
      // 保存令牌到本地存储
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } else {
      throw new Error(response.message || 'Login failed');
    }
  }

  // 注册
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiPost<{
      success: boolean;
      data: AuthResponse;
      message: string;
    }>('/auth/register', userData);
    
    if (response.success) {
      // 保存令牌到本地存储
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  }

  // 登出
  static logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // 获取当前用户
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  // 检查是否已登录
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // 获取访问令牌
  static getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // 刷新令牌
  static async refreshToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiPost<{
      success: boolean;
      data: AuthTokens;
      message: string;
    }>('/auth/refresh', { refreshToken });
    
    if (response.success) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data;
    } else {
      // 刷新失败，清除所有认证信息
      this.logout();
      throw new Error(response.message || 'Token refresh failed');
    }
  }
}