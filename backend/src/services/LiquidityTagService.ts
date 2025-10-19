import { databaseService } from './DatabaseService';

export interface LiquidityTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateLiquidityTagData {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateLiquidityTagData {
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export class LiquidityTagService {
  private db = databaseService;

  constructor() {
    // 使用单例数据库服务
  }

  // 获取所有流动性标签
  async getAllTags(): Promise<LiquidityTag[]> {
    const query = `
      SELECT 
        id,
        name,
        description,
        color,
        sort_order as "sortOrder",
        is_active as "isActive",
        created_at as "createdAt"
      FROM finapp.liquidity_tags
      ORDER BY sort_order ASC, name ASC
    `;
    
    const result = await this.db.executeRawQuery(query);
    return result.rows;
  }

  // 获取活跃的流动性标签
  async getActiveTags(): Promise<LiquidityTag[]> {
    const query = `
      SELECT 
        id,
        name,
        description,
        color,
        sort_order as "sortOrder",
        is_active as "isActive",
        created_at as "createdAt"
      FROM finapp.liquidity_tags
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
    `;
    
    const result = await this.db.executeRawQuery(query);
    return result.rows;
  }

  // 根据ID获取流动性标签
  async getTagById(id: string): Promise<LiquidityTag | null> {
    const query = `
      SELECT 
        id,
        name,
        description,
        color,
        sort_order as "sortOrder",
        is_active as "isActive",
        created_at as "createdAt"
      FROM finapp.liquidity_tags
      WHERE id = $1
    `;
    
    const result = await this.db.executeRawQuery(query, [id]);
    return result.rows[0] || null;
  }

  // 创建流动性标签
  async createTag(data: CreateLiquidityTagData): Promise<LiquidityTag> {
    const query = `
      INSERT INTO finapp.liquidity_tags (
        name, 
        description, 
        color, 
        sort_order, 
        is_active
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
        name,
        description,
        color,
        sort_order as "sortOrder",
        is_active as "isActive",
        created_at as "createdAt"
    `;
    
    const values = [
      data.name,
      data.description || null,
      data.color || null,
      data.sortOrder || 0,
      data.isActive !== undefined ? data.isActive : true
    ];
    
    const result = await this.db.executeRawQuery(query, values);
    return result.rows[0];
  }

  // 更新流动性标签
  async updateTag(id: string, data: UpdateLiquidityTagData): Promise<LiquidityTag | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.color !== undefined) {
      updateFields.push(`color = $${paramIndex++}`);
      values.push(data.color);
    }
    if (data.sortOrder !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      values.push(data.sortOrder);
    }
    if (data.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    if (updateFields.length === 0) {
      return this.getTagById(id);
    }

    values.push(id);

    const query = `
      UPDATE finapp.liquidity_tags 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        name,
        description,
        color,
        sort_order as "sortOrder",
        is_active as "isActive",
        created_at as "createdAt"
    `;
    
    const result = await this.db.executeRawQuery(query, values);
    return result.rows[0] || null;
  }

  // 删除流动性标签
  async deleteTag(id: string): Promise<boolean> {
    const query = `
      DELETE FROM finapp.liquidity_tags 
      WHERE id = $1
    `;
    
    const result = await this.db.executeRawQuery(query, [id]);
    return result.rowCount > 0;
  }

  // 检查是否有关联的交易记录
  async checkReferences(id: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM finapp.transactions
      WHERE liquidity_tag_id = $1
    `;
    
    const result = await this.db.executeRawQuery(query, [id]);
    return parseInt(result.rows[0].count) > 0;
  }

  // 根据名称获取流动性标签
  async getTagByName(name: string): Promise<LiquidityTag | null> {
    const query = `
      SELECT 
        id,
        name,
        description,
        color,
        sort_order as "sortOrder",
        is_active as "isActive",
        created_at as "createdAt"
      FROM finapp.liquidity_tags
      WHERE name = $1
    `;
    
    const result = await this.db.executeRawQuery(query, [name]);
    return result.rows[0] || null;
  }
}