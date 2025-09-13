import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: 用户认证相关接口
 *   - name: User Profile
 *     description: 用户资料管理接口
 */

// 公开路由 - 不需要认证
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// 受保护路由 - 需要认证
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.put('/change-password', authenticateToken, AuthController.changePassword);
router.delete('/account', authenticateToken, AuthController.deleteAccount);

export default router;