import { databaseService } from './DatabaseService';

export interface Tag {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  user_id: string;
  category_id?: number;
  is_system: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface TagCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  user_id: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTagRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  category_id?: number;
}

export interface CreateTagCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: number;
  sort_order?: number;
}

export class TagService {
  private databaseService = databaseService;

  // 获取用户标签列表
  async getUserTags(userId: string, options: {
    category_id?: number;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ tags: Tag[]; total: number }> {
    try {
      const { category_id, is_active, search, limit = 50, offset = 0 } = options;
      
      let whereConditions = ['t.user_id = $1::uuid'];
      let params: any[] = [userId];
      let paramIndex = 2;

      if (category_id !== undefined) {
        whereConditions.push(`t.category_id = $${paramIndex}`);
        params.push(category_id);
        paramIndex++;
      }

      if (is_active !== undefined) {
        whereConditions.push(`t.is_active = $${paramIndex}`);
        params.push(is_active);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`t.name ILIKE $${paramIndex}`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // 获取标签列表
      const tags = await this.databaseService.executeRawQuery(`
        SELECT 
          t.*,
          tc.name as category_name,
          tc.color as category_color
        FROM tags t
        LEFT JOIN tag_categories tc ON t.category_id = tc.id
        ${whereClause}
        ORDER BY t.name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      // 获取总数
      const countResult = await this.databaseService.executeRawQuery(`
        SELECT COUNT(*) as total FROM tags t ${whereClause}
      `, params);

      return {
        tags: tags as Tag[],
        total: parseInt(countResult[0]?.total || '0')
      };
    } catch (error) {
      console.error('Error getting user tags:', error);
      throw new Error('Failed to get user tags');
    }
  }

  // 创建标签
  async createTag(userId: string, tagData: CreateTagRequest): Promise<Tag> {
    try {
      const { name, description, color = '#1890ff', icon, category_id } = tagData;

      const result = await this.databaseService.executeRawQuery(`
        INSERT INTO tags (name, description, color, icon, user_id, category_id)
        VALUES ($1, $2, $3, $4, $5::uuid, $6)
        RETURNING *
      `, [name, description, color, icon, userId, category_id]);

      return result[0] as Tag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw new Error('Failed to create tag');
    }
  }

  // 更新标签
  async updateTag(userId: string, tagId: number, tagData: Partial<CreateTagRequest>): Promise<Tag> {
    try {
      const { name, description, color, icon, category_id } = tagData;

      const result = await this.databaseService.executeRawQuery(`
        UPDATE tags 
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            color = COALESCE($3, color),
            icon = COALESCE($4, icon),
            category_id = COALESCE($5, category_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND user_id = $7::uuid
        RETURNING *
      `, [name, description, color, icon, category_id, tagId, userId]);

      if (result.length === 0) {
        throw new Error('Tag not found or access denied');
      }

      return result[0] as Tag;
    } catch (error) {
      console.error('Error updating tag:', error);
      throw new Error('Failed to update tag');
    }
  }

  // 删除标签
  async deleteTag(userId: string, tagId: number): Promise<boolean> {
    try {
      const result = await this.databaseService.executeRawQuery(`
        DELETE FROM tags 
        WHERE id = $1 AND user_id = $2::uuid AND is_system = FALSE
      `, [tagId, userId]);

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw new Error('Failed to delete tag');
    }
  }

  // 获取标签分类列表
  async getTagCategories(userId: string): Promise<TagCategory[]> {
    try {
      const categories = await this.databaseService.executeRawQuery(`
        SELECT * FROM tag_categories 
        WHERE user_id = $1::uuid AND is_active = TRUE
        ORDER BY sort_order ASC, name ASC
      `, [userId]);

      return categories as TagCategory[];
    } catch (error) {
      console.error('Error getting tag categories:', error);
      throw new Error('Failed to get tag categories');
    }
  }

  // 创建标签分类
  async createTagCategory(userId: string, categoryData: CreateTagCategoryRequest): Promise<TagCategory> {
    try {
      const { name, description, color = '#52c41a', icon, parent_id, sort_order = 0 } = categoryData;

      const result = await this.databaseService.executeRawQuery(`
        INSERT INTO tag_categories (name, description, color, icon, user_id, parent_id, sort_order)
        VALUES ($1, $2, $3, $4, $5::uuid, $6, $7)
        RETURNING *
      `, [name, description, color, icon, userId, parent_id, sort_order]);

      return result[0] as TagCategory;
    } catch (error) {
      console.error('Error creating tag category:', error);
      throw new Error('Failed to create tag category');
    }
  }

  // 获取标签统计
  async getTagStats(userId: string): Promise<any> {
    try {
      const stats = await this.databaseService.executeRawQuery(`
        SELECT 
          COUNT(*) as total_tags,
          COUNT(CASE WHEN is_system = TRUE THEN 1 END) as system_tags,
          COUNT(CASE WHEN is_system = FALSE THEN 1 END) as user_tags,
          COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_tags,
          SUM(usage_count) as total_usage
        FROM tags 
        WHERE user_id = $1::uuid
      `, [userId]);

      const categoryStats = await this.databaseService.executeRawQuery(`
        SELECT COUNT(*) as total_categories
        FROM tag_categories 
        WHERE user_id = $1::uuid AND is_active = TRUE
      `, [userId]);

      // 将 BigInt 转换为 Number 以避免 JSON 序列化问题
      const result = stats[0];
      const categoryResult = categoryStats[0];

      return {
        total_tags: Number(result?.total_tags || 0),
        system_tags: Number(result?.system_tags || 0),
        user_tags: Number(result?.user_tags || 0),
        active_tags: Number(result?.active_tags || 0),
        total_usage: Number(result?.total_usage || 0),
        total_categories: Number(categoryResult?.total_categories || 0)
      };
    } catch (error) {
      console.error('Error getting tag stats:', error);
      throw new Error('Failed to get tag stats');
    }
  }
}