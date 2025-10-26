import { Request, Response } from 'express';
import { LiquidityTagService } from '../services/LiquidityTagService';

export class LiquidityTagController {
  private liquidityTagService: LiquidityTagService;

  constructor() {
    this.liquidityTagService = new LiquidityTagService();
  }

  // 获取所有流动性标签
  async getAllTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await this.liquidityTagService.getAllTags();
      console.log('获取到的流动性标签数量:', tags.length);
      console.log('流动性标签数据:', JSON.stringify(tags, null, 2));
      res.json(tags);
    } catch (error) {
      console.error('获取流动性标签失败:', error);
      res.status(500).json({ 
        error: '获取流动性标签失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 获取活跃的流动性标签
  async getActiveTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await this.liquidityTagService.getActiveTags();
      res.json(tags);
    } catch (error) {
      console.error('获取活跃流动性标签失败:', error);
      res.status(500).json({ 
        error: '获取活跃流动性标签失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 根据ID获取流动性标签
  async getTagById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'ID参数不能为空' });
        return;
      }
      
      const tag = await this.liquidityTagService.getTagById(id);
      
      if (!tag) {
        res.status(404).json({ error: '流动性标签不存在' });
        return;
      }
      
      res.json(tag);
    } catch (error) {
      console.error('获取流动性标签详情失败:', error);
      res.status(500).json({ 
        error: '获取流动性标签详情失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 创建流动性标签
  async createTag(req: Request, res: Response): Promise<void> {
    try {
      const tagData = req.body;
      const newTag = await this.liquidityTagService.createTag(tagData);
      res.status(201).json(newTag);
    } catch (error) {
      console.error('创建流动性标签失败:', error);
      if (error instanceof Error && error.message.includes('duplicate key')) {
        res.status(400).json({ error: '标签名称已存在' });
      } else {
        res.status(500).json({ 
          error: '创建流动性标签失败',
          details: error instanceof Error ? error.message : '未知错误'
        });
      }
    }
  }

  // 更新流动性标签
  async updateTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        res.status(400).json({ error: 'ID参数不能为空' });
        return;
      }
      
      const updatedTag = await this.liquidityTagService.updateTag(id, updateData);
      
      if (!updatedTag) {
        res.status(404).json({ error: '流动性标签不存在' });
        return;
      }
      
      res.json(updatedTag);
    } catch (error) {
      console.error('更新流动性标签失败:', error);
      if (error instanceof Error && error.message.includes('duplicate key')) {
        res.status(400).json({ error: '标签名称已存在' });
      } else {
        res.status(500).json({ 
          error: '更新流动性标签失败',
          details: error instanceof Error ? error.message : '未知错误'
        });
      }
    }
  }

  // 删除流动性标签
  async deleteTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'ID参数不能为空' });
        return;
      }
      
      // 检查是否有关联的交易记录
      const hasReferences = await this.liquidityTagService.checkReferences(id);
      if (hasReferences) {
        res.status(400).json({ 
          error: '无法删除该流动性标签，因为有交易记录正在使用它' 
        });
        return;
      }
      
      const success = await this.liquidityTagService.deleteTag(id);
      
      if (!success) {
        res.status(404).json({ error: '流动性标签不存在' });
        return;
      }
      
      res.json({ message: '流动性标签删除成功' });
    } catch (error) {
      console.error('删除流动性标签失败:', error);
      res.status(500).json({ 
        error: '删除流动性标签失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}