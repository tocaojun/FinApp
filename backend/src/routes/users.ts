import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: User Profile
 *     description: 用户资料管理接口
 */

// 用户资料路由
router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);

export default router;