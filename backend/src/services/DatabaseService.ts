import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

class DatabaseService {
  public prisma: PrismaClient;
  private isConnected: boolean = false;

  constructor() {
    this.prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 查询日志
    (this.prisma as any).$on('query', (e: any) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Params: ${e.params}`);
        logger.debug(`Duration: ${e.duration}ms`);
      }
    });

    // 错误日志
    (this.prisma as any).$on('error', (e: any) => {
      logger.error('Database error:', e);
    });

    // 信息日志
    (this.prisma as any).$on('info', (e: any) => {
      logger.info('Database info:', e.message);
    });

    // 警告日志
    (this.prisma as any).$on('warn', (e: any) => {
      logger.warn('Database warning:', e.message);
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getConnectionInfo(): Promise<{
    isConnected: boolean;
    database?: string;
    schema?: string;
    version?: string;
  }> {
    try {
      const result = await this.prisma.$queryRaw<Array<{
        current_database: string;
        current_schema: string;
        version: string;
      }>>`
        SELECT 
          current_database(),
          current_schema(),
          version()
      `;

      return {
        isConnected: this.isConnected,
        database: result[0]?.current_database,
        schema: result[0]?.current_schema,
        version: result[0]?.version,
      };
    } catch (error) {
      logger.error('Failed to get connection info:', error);
      return {
        isConnected: false,
      };
    }
  }

  async executeTransaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        return await fn(prisma as PrismaClient);
      });
    } catch (error) {
      logger.error('Transaction failed:', error);
      throw error;
    }
  }

  async executeRawQuery<T = any>(query: string, params?: any[]): Promise<T> {
    try {
      if (params && params.length > 0) {
        return await this.prisma.$queryRawUnsafe(query, ...params);
      } else {
        return await this.prisma.$queryRawUnsafe(query);
      }
    } catch (error) {
      logger.error('Raw query failed:', error);
      throw error;
    }
  }

  async executeRawCommand(command: string, params?: any[]): Promise<number> {
    try {
      if (params && params.length > 0) {
        return await this.prisma.$executeRawUnsafe(command, ...params);
      } else {
        return await this.prisma.$executeRawUnsafe(command);
      }
    } catch (error) {
      logger.error('Raw command failed:', error);
      throw error;
    }
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

// 创建单例实例
export const databaseService = new DatabaseService();