import axios from 'axios';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../types/auth';

// 添加缺失的导出
export type { LoginRequest, RegisterRequest, LoginResponse, User };

const API_BASE_URL = '/api';

// 创建 axios 实例
const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证 token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证错误
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // 可以在这里触发重新登录
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class AuthService {
  // 检查用户是否已认证
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    return !!(token && user);
  }

  // 获取存储的用户信息
  static getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('auth_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      return null;
    }
  }

  // 获取存储的 token
  static getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // 用户登录
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await authApi.post<LoginResponse>('/login', credentials);
      
      // 后端返回的数据结构: { success: true, data: { user, tokens } }
      if (response.data.success) {
        return response.data; // 返回整个响应对象，包含 data 字段
      } else {
        throw new Error(response.data.message || '登录失败');
      }
    } catch (error: any) {
      console.error('AuthService login error:', error);
      throw new Error(error.response?.data?.message || error.message || '登录失败');
    }
  }

  // 用户注册
  static async register(userData: RegisterRequest): Promise<User> {
    try {
      const response = await authApi.post<User>('/register', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '注册失败');
    }
  }

  // 验证 token
  static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await authApi.get('/validate', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000 // 10秒超时，给后端更多时间
      });
      return response.status === 200;
    } catch (error: any) {
      console.error('Token validation error:', error.message);
      // 如果是网络错误或超时，假设token有效（避免误判）
      // 这样可以避免因临时网络问题导致用户被强制登出
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
        console.warn('Network/timeout error during token validation, assuming token is valid');
        return true;
      }
      return false;
    }
  }

  // 刷新 token
  static async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const response = await authApi.post<LoginResponse>('/refresh', {
        refreshToken
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Token 刷新失败');
    }
  }

  // 获取当前用户信息（从本地存储）
  static getCurrentUser(): User | null {
    return this.getStoredUser();
  }

  // 从服务器获取当前用户信息
  static async fetchCurrentUser(): Promise<User> {
    try {
      const response = await authApi.get<User>('/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取用户信息失败');
    }
  }

  // 更新用户信息
  static async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await authApi.put<User>('/profile', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '更新用户信息失败');
    }
  }

  // 修改密码
  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await authApi.post('/change-password', {
        oldPassword,
        newPassword
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '修改密码失败');
    }
  }

  // 用户登出
  static async logout(): Promise<void> {
    try {
      await authApi.post('/logout');
    } catch (error) {
      // 即使服务器端登出失败，也要清除本地存储
      console.warn('Server logout failed, but clearing local storage');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('refresh_token');
    }
  }

  // 忘记密码
  static async forgotPassword(email: string): Promise<void> {
    try {
      await authApi.post('/forgot-password', { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '发送重置密码邮件失败');
    }
  }

  // 重置密码
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await authApi.post('/reset-password', {
        token,
        newPassword
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '重置密码失败');
    }
  }
}

// 用户管理服务（仅管理员可用）
export class UserManagementService {
  private static userApi = axios.create({
    baseURL: `${API_BASE_URL}/admin/users`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  static {
    // 添加认证拦截器
    this.userApi.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // 获取所有用户
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await this.userApi.get<User[]>('/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取用户列表失败');
    }
  }

  // 获取用户详情
  static async getUserById(userId: string): Promise<User> {
    try {
      const response = await this.userApi.get<User>(`/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取用户详情失败');
    }
  }

  // 创建用户
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const response = await this.userApi.post<User>('/', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '创建用户失败');
    }
  }

  // 更新用户
  static async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await this.userApi.put<User>(`/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '更新用户失败');
    }
  }

  // 删除用户
  static async deleteUser(userId: string): Promise<void> {
    try {
      await this.userApi.delete(`/${userId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '删除用户失败');
    }
  }

  // 激活/禁用用户
  static async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      const response = await this.userApi.patch<User>(`/${userId}/status`, {
        isActive
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '更新用户状态失败');
    }
  }

  // 重置用户密码
  static async resetUserPassword(userId: string): Promise<{ temporaryPassword: string }> {
    try {
      const response = await this.userApi.post<{ temporaryPassword: string }>(`/${userId}/reset-password`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '重置用户密码失败');
    }
  }
}