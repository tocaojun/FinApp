import { Router } from 'express';
import { body, param } from 'express-validator';
import { LiquidityTagController } from '../controllers/LiquidityTagController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const liquidityTagController = new LiquidityTagController();

// 验证规则
const createLiquidityTagValidation = [
  body('name').notEmpty().withMessage('标签名称不能为空'),
  body('description').optional().isString().withMessage('描述必须是字符串'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('颜色必须是有效的十六进制颜色代码'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('排序必须是非负整数'),
  body('isActive').optional().isBoolean().withMessage('状态必须是布尔值')
];

const updateLiquidityTagValidation = [
  param('id').isUUID().withMessage('ID必须是有效的UUID'),
  body('name').optional().notEmpty().withMessage('标签名称不能为空'),
  body('description').optional().isString().withMessage('描述必须是字符串'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('颜色必须是有效的十六进制颜色代码'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('排序必须是非负整数'),
  body('isActive').optional().isBoolean().withMessage('状态必须是布尔值')
];

const deleteLiquidityTagValidation = [
  param('id').isUUID().withMessage('ID必须是有效的UUID')
];

// 路由定义
router.get('/', authenticateToken, liquidityTagController.getAllTags.bind(liquidityTagController));
router.get('/active', authenticateToken, liquidityTagController.getActiveTags.bind(liquidityTagController));
router.get('/:id', authenticateToken, param('id').isUUID(), validateRequest, liquidityTagController.getTagById.bind(liquidityTagController));
router.post('/', authenticateToken, createLiquidityTagValidation, validateRequest, liquidityTagController.createTag.bind(liquidityTagController));
router.put('/:id', authenticateToken, updateLiquidityTagValidation, validateRequest, liquidityTagController.updateTag.bind(liquidityTagController));
router.delete('/:id', authenticateToken, deleteLiquidityTagValidation, validateRequest, liquidityTagController.deleteTag.bind(liquidityTagController));

export default router;