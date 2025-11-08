// API 基础配置
const API_BASE_URL = '/api';

// Token 刷新队列，防止多个请求同时刷新 token
let tokenRefreshPromise: Promise<string | null> | null = null;

// 获取认证令牌
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// 设置认证令牌
const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// 创建带认证的请求头
const createAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// 刷新 token
const refreshToken = async (): Promise<string | null> => {
  // 如果已经有一个刷新请求在进行中，直接返回该 promise
  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      const refreshTokenStr = localStorage.getItem('refresh_token');
      if (!refreshTokenStr) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refreshTokenStr,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.data?.tokens?.accessToken || data.tokens?.accessToken;
        if (newToken) {
          setAuthToken(newToken);
          return newToken;
        }
      }

      // Token 刷新失败
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Token 刷新失败，清除认证信息
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return null;
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
};

// 扩展 RequestInit 以支持 timeout 参数
interface RequestInitWithTimeout extends RequestInit {
  timeout?: number;
  retry?: number; // 重试次数
}

// 通用 API 请求函数（带超时控制和自动 token 刷新）
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInitWithTimeout = {},
  retryCount: number = 0
): Promise<T> => {
  const timeout = options.timeout || 30000; // 默认 30 秒超时
  const maxRetries = options.retry ?? 1; // 默认重试 1 次（共 2 次请求）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const url = `${API_BASE_URL}${endpoint}`;
  const { timeout: _, retry: __, ...restOptions } = options;
  
  const config: RequestInit = {
    ...restOptions,
    signal: controller.signal,
    headers: {
      ...createAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    // 检查响应是否为HTML（表示后端服务未运行）
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('Backend service not available - received HTML instead of JSON');
    }
    
    if (!response.ok) {
      // 尝试获取错误详情
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData: any = null;
      try {
        errorData = await response.json();
        console.error('API 错误响应:', errorData);
        errorMessage = errorData.message || errorData.error?.message || errorMessage;
      } catch (e) {
        // 无法解析错误响应
      }
      
      // Token 过期，尝试刷新
      if (response.status === 401 && retryCount < maxRetries) {
        console.log('Token expired, attempting to refresh...');
        const newToken = await refreshToken();
        
        if (newToken) {
          // Token 刷新成功，重试请求
          console.log('Token refreshed, retrying request...');
          return apiRequest<T>(endpoint, options, retryCount + 1);
        }
      }
      
      // 如果是认证失败且无法刷新，跳转到登录页
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        throw new Error('Authentication failed - please login again');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`API request timeout after ${timeout}ms: ${endpoint}`);
        throw new Error(`Request timeout after ${timeout}ms - server may be unresponsive`);
      }
    }
    
    console.error('API request failed:', error);
    throw error;
  }
};

// GET 请求
export const apiGet = <T = any>(endpoint: string): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'GET' });
};

// POST 请求
export const apiPost = <T = any>(endpoint: string, data?: any): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

// PUT 请求
export const apiPut = <T = any>(endpoint: string, data?: any): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

// DELETE 请求
export const apiDelete = <T = any>(endpoint: string): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
};

// 文件上传请求
export const apiUpload = <T = any>(endpoint: string, formData: FormData): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest<T>(endpoint, {
    method: 'POST',
    headers,
    body: formData,
  });
};