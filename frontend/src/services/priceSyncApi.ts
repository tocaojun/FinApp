import axios, { AxiosInstance } from 'axios';

// 使用环境变量配置API基础路径
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api'}/price-sync`;

// 创建axios实例
const priceSyncApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 增加超时时间到 15 秒
});

// 请求拦截器 - 自动添加token
priceSyncApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // 仅在开发环境记录日志，减少性能开销
      if (process.env.NODE_ENV === 'development' && config.url?.includes('logs')) {
        console.log(`[PriceSyncApi] Request: ${config.method?.toUpperCase()} ${config.url}`);
      }
    }
    return config;
  },
  (error) => {
    console.error('[PriceSyncApi] Request error:', error.message);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
priceSyncApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 仅记录错误
    if (error.code === 'ECONNABORTED') {
      console.warn(`[PriceSyncApi] Timeout: ${error.config?.url} (${error.message})`);
    } else {
      console.error('[PriceSyncApi] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default priceSyncApiClient;
