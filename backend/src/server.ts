// 优先加载环境变量
import dotenv from 'dotenv';
import path from 'path';

// 根据 NODE_ENV 加载对应的环境文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.join(__dirname, `../${envFile}`);
console.log(`[Server] 加载环境文件: ${envPath} (NODE_ENV=${process.env.NODE_ENV})`);
dotenv.config({ path: envPath });

// 生产环境路径别名支持
if (process.env.NODE_ENV === 'production') {
  require('module-alias/register');
}

import App from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

async function startServer() {
  try {
    const app = new App();
    
    // 初始化应用程序
    await app.initialize();
    
    // 启动服务器
    const server = app.getApp().listen(PORT, HOST, () => {
      logger.info(`🚀 FinApp Backend Server is running on ${HOST}:${PORT}`);
      logger.info(`📚 API Documentation: http://${HOST}:${PORT}/api/docs`);
      logger.info(`🏥 Health Check: http://${HOST}:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await app.shutdown();
          logger.info('Application shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // 强制退出超时
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();