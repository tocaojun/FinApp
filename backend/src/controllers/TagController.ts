import { Response } from 'express';
import { TagService, CreateTagRequest, CreateTagCategoryRequest } from '../services/TagService';
import { AuthenticatedRequest } from '../types/auth';

export class TagController {
  private tagService: TagService;

  constructor() {
    this.tagService = new TagService();
  }

  // 获取用户标签列表
  async getUserTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('req.user:', req.user);
      
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }
      
      const userId = req.user.userId;
      const { 
        category_id, 
        is_active, 
        search, 
        limit = 50, 
        offset = 0 
      } = req.query;

      const result = await this.tagService.getUserTags(userId, {
        category_id: category_id ? parseInt(category_id as string) : undefined,
        is_active: is_active ? is_active === 'true' : undefined,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting user tags:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user tags'
      });
    }
  }

  // 创建标签
  async createTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const tagData: CreateTagRequest = req.body;

      const tag = await this.tagService.createTag(userId, tagData);

      res.status(201).json({
        success: true,
        data: tag
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create tag'
      });
    }
  }

  // 更新标签
  async updateTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const tagId = parseInt(req.params.id || '0');
      const tagData: Partial<CreateTagRequest> = req.body;

      const tag = await this.tagService.updateTag(userId, tagId, tagData);

      res.json({
        success: true,
        data: tag
      });
    } catch (error) {
      console.error('Error updating tag:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update tag'
      });
    }
  }

  // 删除标签
  async deleteTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const tagId = parseInt(req.params.id || '0');

      const success = await this.tagService.deleteTag(userId, tagId);

      if (success) {
        res.json({
          success: true,
          message: 'Tag deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Tag not found or cannot be deleted'
        });
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete tag'
      });
    }
  }

  // 获取标签分类列表
  async getTagCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const userId = req.user.userId;
      const categories = await this.tagService.getTagCategories(userId);

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error getting tag categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tag categories'
      });
    }
  }

  // 创建标签分类
  async createTagCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const categoryData: CreateTagCategoryRequest = req.body;

      const category = await this.tagService.createTagCategory(userId, categoryData);

      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error creating tag category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create tag category'
      });
    }
  }

  // 获取标签统计
  async getTagStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const stats = await this.tagService.getTagStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting tag stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tag stats'
      });
    }
  }

  // 获取热门标签
  async getPopularTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.tagService.getUserTags(userId, { limit: 1000 });
      const popularTags = result.tags
        .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        .slice(0, limit);

      res.json({
        success: true,
        data: popularTags
      });
    } catch (error) {
      console.error('Error getting popular tags:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get popular tags'
      });
    }
  }
}

export default new TagController();