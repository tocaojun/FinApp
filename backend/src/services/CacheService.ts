import NodeCache from 'node-cache';
import { logger } from '../utils/logger';

export class CacheService {
  private cache: NodeCache;

  constructor() {
    const ttl = parseInt(process.env.CACHE_TTL || '3600'); // 默认1小时
    const maxKeys = parseInt(process.env.CACHE_MAX_KEYS || '1000'); // 默认最大1000个键
    
    this.cache = new NodeCache({
      stdTTL: ttl,
      maxKeys: maxKeys,
      checkperiod: ttl * 0.2, // 每20%的TTL时间检查一次过期键
      useClones: false, // 提高性能，但需要注意对象引用
      deleteOnExpire: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.cache.on('set', (key: string) => {
      if (process.env.LOG_LEVEL === 'debug') {
        logger.debug(`Cache SET: ${key}`);
      }
    });

    this.cache.on('del', (key: string) => {
      if (process.env.LOG_LEVEL === 'debug') {
        logger.debug(`Cache DEL: ${key}`);
      }
    });

    this.cache.on('expired', (key: string) => {
      if (process.env.LOG_LEVEL === 'debug') {
        logger.debug(`Cache EXPIRED: ${key}`);
      }
    });

    this.cache.on('flush', () => {
      logger.info('Cache flushed');
    });
  }

  public set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      if (ttl !== undefined) {
        return this.cache.set(key, value, ttl);
      } else {
        return this.cache.set(key, value);
      }
    } catch (error) {
      logger.error(`Failed to set cache key ${key}:`, error);
      return false;
    }
  }

  public get<T>(key: string): T | undefined {
    try {
      return this.cache.get<T>(key);
    } catch (error) {
      logger.error(`Failed to get cache key ${key}:`, error);
      return undefined;
    }
  }

  public del(key: string | string[]): number {
    try {
      return this.cache.del(key);
    } catch (error) {
      logger.error(`Failed to delete cache key(s) ${key}:`, error);
      return 0;
    }
  }

  public has(key: string): boolean {
    try {
      return this.cache.has(key);
    } catch (error) {
      logger.error(`Failed to check cache key ${key}:`, error);
      return false;
    }
  }

  public keys(): string[] {
    try {
      return this.cache.keys();
    } catch (error) {
      logger.error('Failed to get cache keys:', error);
      return [];
    }
  }

  public flush(): void {
    try {
      this.cache.flushAll();
      logger.info('Cache flushed successfully');
    } catch (error) {
      logger.error('Failed to flush cache:', error);
    }
  }

  public getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }

  public healthCheck(): {
    status: 'healthy' | 'unhealthy';
    stats: NodeCache.Stats;
    keyCount: number;
  } {
    try {
      const stats = this.getStats();
      const keyCount = this.keys().length;
      
      return {
        status: 'healthy',
        stats,
        keyCount,
      };
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        stats: {
          hits: 0,
          misses: 0,
          keys: 0,
          ksize: 0,
          vsize: 0,
        },
        keyCount: 0,
      };
    }
  }

  public setMultiple<T>(data: Record<string, T>, ttl?: number): boolean {
    try {
      const results = Object.entries(data).map(([key, value]) => {
        if (ttl !== undefined) {
          return this.cache.set(key, value, ttl);
        } else {
          return this.cache.set(key, value);
        }
      }
      );
      return results.every(result => result === true);
    } catch (error) {
      logger.error('Failed to set multiple cache keys:', error);
      return false;
    }
  }

  public getMultiple<T>(keys: string[]): Record<string, T | undefined> {
    try {
      const result: Record<string, T | undefined> = {};
      keys.forEach(key => {
        result[key] = this.cache.get<T>(key);
      });
      return result;
    } catch (error) {
      logger.error('Failed to get multiple cache keys:', error);
      return {};
    }
  }

  public getTTL(key: string): number | undefined {
    try {
      return this.cache.getTtl(key);
    } catch (error) {
      logger.error(`Failed to get TTL for cache key ${key}:`, error);
      return undefined;
    }
  }

  public setTTL(key: string, ttl: number): boolean {
    try {
      return this.cache.ttl(key, ttl);
    } catch (error) {
      logger.error(`Failed to set TTL for cache key ${key}:`, error);
      return false;
    }
  }

  public close(): void {
    try {
      this.cache.close();
      logger.info('Cache service closed');
    } catch (error) {
      logger.error('Failed to close cache service:', error);
    }
  }
}

// 创建单例实例
export const cacheService = new CacheService();