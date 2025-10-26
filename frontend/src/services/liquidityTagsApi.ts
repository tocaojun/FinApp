import axios from 'axios';

// 使用相对路径，通过Vite代理访问后端（避免CORS问题）
const API_BASE_URL = '/api';

// 流动性标签类型定义
export interface LiquidityTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器 - 自动添加token
apiClient.interceptors.request.use(
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

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API请求失败:', error);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求未收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// 获取所有流动性标签
export const getLiquidityTags = async (): Promise<LiquidityTag[]> => {
  console.log('🌐 调用API: GET /liquidity-tags');
  console.log('🔗 API Base URL:', API_BASE_URL);
  const response = await apiClient.get('/liquidity-tags');
  console.log('📥 API响应:', response);
  console.log('📦 响应数据:', response.data);
  console.log('📊 数据类型:', typeof response.data);
  console.log('📋 是否为数组:', Array.isArray(response.data));
  return response.data;
};

// 获取活跃的流动性标签
export const getActiveLiquidityTags = async (): Promise<LiquidityTag[]> => {
  console.log('🔍 获取活跃流动性标签...');
  const allTags = await getLiquidityTags();
  console.log('📊 所有标签:', allTags);
  const activeTags = allTags.filter(tag => tag.isActive);
  console.log('✅ 活跃标签:', activeTags);
  console.log('📈 活跃标签数量:', activeTags.length);
  return activeTags;
};

// 创建流动性标签
export const createLiquidityTag = async (tag: Omit<LiquidityTag, 'id' | 'createdAt'>): Promise<LiquidityTag> => {
  const response = await apiClient.post('/liquidity-tags', tag);
  return response.data;
};

// 更新流动性标签
export const updateLiquidityTag = async (id: string, tag: Partial<LiquidityTag>): Promise<LiquidityTag> => {
  const response = await apiClient.put(`/liquidity-tags/${id}`, tag);
  return response.data;
};

// 删除流动性标签
export const deleteLiquidityTag = async (id: string): Promise<{ success: boolean }> => {
  try {
    await apiClient.delete(`/liquidity-tags/${id}`);
    return { success: true };
  } catch (error) {
    console.error('删除流动性标签失败:', error);
    return { success: false };
  }
};