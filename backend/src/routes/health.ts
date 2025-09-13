import { Router, Request, Response } from 'express';
import { databaseService } from '@/services/DatabaseService';
import { cacheService } from '@/services/CacheService';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     description: 检查应用程序和各个服务的健康状态
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 服务健康
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: 应用运行时间（秒）
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         latency:
 *                           type: number
 *                     cache:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         stats:
 *                           type: object
 *       503:
 *         description: 服务不健康
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // 检查数据库健康状态
  const databaseHealth = await databaseService.healthCheck();
  
  // 检查缓存健康状态
  const cacheHealth = cacheService.healthCheck();
  
  // 计算总体健康状态
  const isHealthy = databaseHealth.status === 'healthy' && cacheHealth.status === 'healthy';
  
  const healthStatus = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: databaseHealth,
      cache: cacheHealth,
    },
    system: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
      pid: process.pid,
    },
  };

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(healthStatus);
}));

/**
 * @swagger
 * /health/database:
 *   get:
 *     summary: 数据库健康检查
 *     description: 检查数据库连接和性能
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 数据库健康
 *       503:
 *         description: 数据库不健康
 */
router.get('/database', asyncHandler(async (req: Request, res: Response) => {
  const databaseHealth = await databaseService.healthCheck();
  const connectionInfo = await databaseService.getConnectionInfo();
  
  const result = {
    ...databaseHealth,
    connection: connectionInfo,
    timestamp: new Date().toISOString(),
  };

  const statusCode = databaseHealth.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(result);
}));

/**
 * @swagger
 * /health/cache:
 *   get:
 *     summary: 缓存健康检查
 *     description: 检查缓存服务状态和统计信息
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 缓存健康
 *       503:
 *         description: 缓存不健康
 */
router.get('/cache', asyncHandler(async (req: Request, res: Response) => {
  const cacheHealth = cacheService.healthCheck();
  
  const result = {
    ...cacheHealth,
    timestamp: new Date().toISOString(),
  };

  const statusCode = cacheHealth.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(result);
}));

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: 就绪检查
 *     description: 检查应用程序是否准备好接收请求
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 应用程序就绪
 *       503:
 *         description: 应用程序未就绪
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  // 检查关键服务是否就绪
  const databaseHealth = await databaseService.healthCheck();
  const cacheHealth = cacheService.healthCheck();
  
  const isReady = databaseHealth.status === 'healthy' && cacheHealth.status === 'healthy';
  
  const readinessStatus = {
    ready: isReady,
    timestamp: new Date().toISOString(),
    checks: {
      database: databaseHealth.status === 'healthy',
      cache: cacheHealth.status === 'healthy',
    },
  };

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json(readinessStatus);
}));

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: 存活检查
 *     description: 检查应用程序是否存活
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 应用程序存活
 */
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  // 简单的存活检查，只要进程在运行就返回成功
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  });
}));

export { router as healthRouter };