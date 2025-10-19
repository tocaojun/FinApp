import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, UserRole, Permission, LoginRequest, LoginResponse } from '../types/auth';
import { AuthService } from '../services/authService';
import { message } from 'antd';

// 认证状态接口
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 认证动作类型
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

// 认证上下文接口
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  updateUser: (user: User) => void;
  clearError: () => void;
}

// 初始状态
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Reducer 函数
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...initialState
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    default:
      return state;
  }
}

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化时检查本地存储的认证信息
  useEffect(() => {
    const initAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          
          // 验证 token 是否有效
          const isValid = await AuthService.validateToken(token);
          if (isValid) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, token }
            });
          } else {
            // Token 无效，清除本地存储
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  // 登录函数
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response: LoginResponse = await AuthService.login(credentials);
      
      // 处理后端返回的数据结构（可能包装在data中）
      const userData = (response as any).data?.user || response.user;
      const tokensData = (response as any).data?.tokens || response.tokens;
      
      if (!userData || !tokensData?.accessToken) {
        throw new Error('登录响应格式错误');
      }
      
      // 保存到本地存储
      localStorage.setItem('auth_token', tokensData.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: userData,
          token: tokensData.accessToken
        }
      });
      
      message.success('登录成功');
      return true;
    } catch (error: any) {
      console.error('Login error in AuthContext:', error);
      
      let errorMessage = '登录失败';
      
      // 处理不同类型的错误
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      message.error(errorMessage);
      return false;
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    dispatch({ type: 'LOGOUT' });
    message.success('已退出登录');
  };

  // 权限检查函数
  const hasPermission = (permission: Permission): boolean => {
    if (!state.user) return false;
    return state.user.permissions?.includes(permission) || false;
  };

  // 角色检查函数
  const hasRole = (role: UserRole): boolean => {
    if (!state.user) return false;
    return state.user.role === role;
  };

  // 检查是否拥有任意一个权限
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!state.user) return false;
    return permissions.some(permission => state.user!.permissions.includes(permission));
  };

  // 检查是否拥有所有权限
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!state.user) return false;
    return permissions.every(permission => state.user!.permissions.includes(permission));
  };

  // 更新用户信息
  const updateUser = (user: User) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  // 清除错误
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的 Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 权限检查 Hook
export const usePermission = (permission: Permission) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

// 角色检查 Hook
export const useRole = (role: UserRole) => {
  const { hasRole } = useAuth();
  return hasRole(role);
};