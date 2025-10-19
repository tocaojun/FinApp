import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  categoryId?: string;
  categoryName?: string;
  category_name?: string; // 添加API返回的字段名
  isSystem: boolean;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isSystem?: boolean;
}

export interface TagResponse {
  data: Tag[];
  total: number;
  page: number;
  limit: number;
}

export class TagService {
  // 获取标签列表
  static async getTags(params: TagSearchParams = {}): Promise<TagResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.isSystem !== undefined) queryParams.append('isSystem', params.isSystem.toString());

    const response = await apiGet<TagResponse>(`/tags?${queryParams.toString()}`);
    return response;
  }

  // 获取所有标签（不分页，用于选择器）
  static async getAllTags(): Promise<Tag[]> {
    const response = await apiGet<{data: {tags: Tag[], total: number}}>('/tags?limit=1000&isSystem=false');
    return response.data?.tags || [];
  }

  // 获取标签分类列表
  static async getTagCategories(): Promise<TagCategory[]> {
    const response = await apiGet<{ data: TagCategory[] }>('/tags/categories/list');
    return response.data || [];
  }

  // 创建标签
  static async createTag(tag: Partial<Tag>): Promise<Tag> {
    const response = await apiPost<{ data: Tag }>('/tags', tag);
    return response.data;
  }

  // 更新标签
  static async updateTag(id: string, tag: Partial<Tag>): Promise<Tag> {
    const response = await apiPut<{ data: Tag }>(`/tags/${id}`, tag);
    return response.data;
  }

  // 删除标签
  static async deleteTag(id: string): Promise<void> {
    await apiDelete<void>(`/tags/${id}`);
  }

  // 获取标签统计信息
  static async getTagStats(): Promise<any> {
    const response = await apiGet<{ data: any }>('/tags/stats/overview');
    return response.data;
  }
}

export default TagService;