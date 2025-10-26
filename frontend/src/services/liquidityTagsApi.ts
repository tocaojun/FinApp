import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

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

// 获取所有流动性标签
export const getLiquidityTags = async (): Promise<LiquidityTag[]> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/liquidity-tags`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取流动性标签失败:', error);
    // 返回默认标签作为后备
    return [
      {
        id: '1',
        name: '高流动性',
        description: '大盘股、主要ETF等高流动性资产',
        color: '#22c55e',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '中等流动性',
        description: '中盘股、部分基金等中等流动性资产',
        color: '#f59e0b',
        sortOrder: 2,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: '低流动性',
        description: '小盘股、私募基金等低流动性资产',
        color: '#ef4444',
        sortOrder: 3,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
  }
};

// 获取活跃的流动性标签
export const getActiveLiquidityTags = async (): Promise<LiquidityTag[]> => {
  try {
    const allTags = await getLiquidityTags();
    return allTags.filter(tag => tag.isActive);
  } catch (error) {
    console.error('获取活跃流动性标签失败:', error);
    return [];
  }
};

// 创建流动性标签
export const createLiquidityTag = async (tag: Omit<LiquidityTag, 'id' | 'createdAt'>): Promise<LiquidityTag> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.post(`${API_BASE_URL}/liquidity-tags`, 
      tag,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('创建流动性标签失败:', error);
    throw error;
  }
};

// 更新流动性标签
export const updateLiquidityTag = async (id: string, tag: Partial<LiquidityTag>): Promise<LiquidityTag> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.put(`${API_BASE_URL}/liquidity-tags/${id}`, 
      tag,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('更新流动性标签失败:', error);
    throw error;
  }
};

// 删除流动性标签
export const deleteLiquidityTag = async (id: string): Promise<{ success: boolean }> => {
  try {
    const token = localStorage.getItem('auth_token');
    await axios.delete(`${API_BASE_URL}/liquidity-tags/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return { success: true };
  } catch (error) {
    console.error('删除流动性标签失败:', error);
    return { success: false };
  }
};