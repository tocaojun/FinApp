import { Router } from 'express';
import tagController from '../controllers/TagController';

const router = Router();

// 标签管理路由
router.get('/', tagController.getUserTags.bind(tagController));
router.post('/', tagController.createTag.bind(tagController));
router.put('/:id', tagController.updateTag.bind(tagController));
router.delete('/:id', tagController.deleteTag.bind(tagController));

// 标签分类路由
router.get('/categories/list', tagController.getTagCategories.bind(tagController));
router.post('/categories', tagController.createTagCategory.bind(tagController));

// 标签统计路由
router.get('/stats/overview', tagController.getTagStats.bind(tagController));
router.get('/popular', tagController.getPopularTags.bind(tagController));

export default router;