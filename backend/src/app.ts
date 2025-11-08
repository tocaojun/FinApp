import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authenticateToken } from './middleware/authMiddleware';
import { healthRouter } from './routes/health';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import permissionsRouter from './routes/permissions';
import { portfoliosRouter } from './routes/portfolios';
import { transactionsRouter } from './routes/transactions';
import { tradingAccountsRouter } from './routes/tradingAccounts';
import assetRoutes from './routes/assets';
import liquidityTagRoutes from './routes/liquidityTags';
import exchangeRatesRouter from './routes/exchangeRates';
import tagRoutes from './routes/tagRoutes';
import holdingsRouter from './routes/holdings';
import priceSyncRouter from './routes/priceSync';
import wealthRouter from './routes/wealth';
import { databaseService } from './services/DatabaseService';
import { CacheService } from './services/CacheService';
import { exchangeRateUpdateService } from './services/ExchangeRateUpdateService';
import { wealthMonitoringService } from './jobs/wealthMonitoring';
import { logger } from './utils/logger';

// 加载环境变量
dotenv.config();

class App {
  public app: express.Application;
  private dbService: typeof databaseService;
  private cacheService: CacheService;

  constructor() {
    this.app = express();
    this.dbService = databaseService;
    this.cacheService = new CacheService();
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 安全中间件
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS 配置
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // 速率限制 - 开发环境临时禁用
    if (process.env.NODE_ENV === 'production') {
      const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000000'), // 限制每个IP 1000000个请求
        message: {
          error: 'Too many requests from this IP, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use('/api/', limiter);
    }

    // 请求解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 日志中间件
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim())
        }
      }));
    }
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    // 超简单的 ping 路由 - 在所有中间件之前
    this.app.get('/ping', (req, res) => {
      res.json({ status: 'pong', timestamp: new Date().toISOString() });
    });

    // 根路由 - 应用主页
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to FinApp API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          api: '/api',
          docs: '/api/docs',
          auth: '/api/auth'
        }
      });
    });

    // 健康检查路由（无需认证）
    this.app.use('/health', healthRouter);
    this.app.use('/api/health', healthRouter);

    // 认证路由（无需认证）
    this.app.use('/api/auth', authRouter);

    // 用户路由（需要认证）
    this.app.use('/api/users', authenticateToken, usersRouter);

    // 权限管理路由（需要认证）
    this.app.use('/api/permissions', permissionsRouter);

    // 投资组合管理路由（需要认证）
    this.app.use('/api/portfolios', authenticateToken, portfoliosRouter);

    // 交易记录管理路由（需要认证）
    this.app.use('/api/transactions', authenticateToken, transactionsRouter);

    // 资产管理路由（需要认证）
    this.app.use('/api/assets', authenticateToken, assetRoutes);

    // 流动性标签管理路由（需要认证）
    this.app.use('/api/liquidity-tags', authenticateToken, liquidityTagRoutes);

    // 汇率管理路由（需要认证）
    this.app.use('/api/exchange-rates', authenticateToken, exchangeRatesRouter);

    // 标签管理路由（需要认证）
    this.app.use('/api/tags', authenticateToken, tagRoutes);

    // 持仓管理路由（需要认证）
    this.app.use('/api/holdings', authenticateToken, holdingsRouter);

    // 交易账户管理路由（需要认证）
    this.app.use('/api/trading-accounts', authenticateToken, tradingAccountsRouter);

    // 价格同步管理路由（需要认证）
    this.app.use('/api/price-sync', authenticateToken, priceSyncRouter);

    // 财富产品管理路由（需要认证）
    this.app.use('/api/wealth', authenticateToken, wealthRouter);

    // TODO: 添加其他路由
    // this.app.use('/api/reports', authenticateToken, reportsRouter);

    // 404 处理
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
      });
    });
  }

  private initializeSwagger(): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'FinApp API',
          version: '1.0.0',
          description: '个人资产管理应用 API 文档',
          contact: {
            name: 'FinApp Team',
            email: 'support@finapp.com',
          },
        },
        servers: [
          {
            url: `http://localhost:${process.env.PORT || 3000}`,
            description: '开发环境',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [] as string[],
          },
        ],
      },
      apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // 扫描路由和控制器文件
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'FinApp API Documentation',
    }));
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      // 初始化数据库连接
      await this.dbService.connect();
      logger.info('Database connected successfully');

      // 初始化缓存服务
      // CacheService 已在构造函数中初始化
      logger.info('Cache service initialized successfully');

      // 启动汇率自动更新服务
      if (process.env.ENABLE_EXCHANGE_RATE_AUTO_UPDATE === 'true') {
        const schedule = process.env.EXCHANGE_RATE_UPDATE_SCHEDULE || '0 */4 * * *';
        exchangeRateUpdateService.startAutoUpdate(schedule);
        logger.info(`Exchange rate auto update service started with schedule: ${schedule}`);
      } else {
        logger.info('Exchange rate auto update service is disabled');
      }

      // 启动财富产品监控服务
      if (process.env.ENABLE_WEALTH_MONITORING === 'true') {
        wealthMonitoringService.start();
        logger.info('Wealth monitoring service started');
      } else {
        logger.info('Wealth monitoring service is disabled');
      }

      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      // 停止汇率自动更新服务
      if (process.env.ENABLE_EXCHANGE_RATE_AUTO_UPDATE === 'true') {
        exchangeRateUpdateService.stopAutoUpdate();
        logger.info('Exchange rate auto update service stopped');
      }

      // 停止财富产品监控服务
      if (process.env.ENABLE_WEALTH_MONITORING === 'true') {
        wealthMonitoringService.stop();
        logger.info('Wealth monitoring service stopped');
      }
      
      await this.dbService.disconnect();
      this.cacheService.close();
      logger.info('Application shutdown completed');
    } catch (error) {
      logger.error('Error during application shutdown:', error);
      throw error;
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default App;