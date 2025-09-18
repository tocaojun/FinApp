import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheOptions {
  ttl?: number; // 缓存时间（毫秒）
  maxSize?: number; // 最大缓存条目数
  staleWhileRevalidate?: boolean; // 是否在后台更新过期缓存
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

class ApiCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 默认5分钟TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set<T>(key: string, data: T, customTtl?: number): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isStale: false
    });
  }

  get<T>(key: string): CacheItem<T> | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    const isExpired = now - item.timestamp > this.ttl;

    if (isExpired) {
      item.isStale = true;
    }

    return item as CacheItem<T>;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  size(): number {
    return this.cache.size;
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 全局缓存实例
const globalCache = new ApiCache();

// 定期清理过期缓存
setInterval(() => {
  globalCache.cleanup();
}, 60000); // 每分钟清理一次

interface UseApiCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

export function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): UseApiCacheResult<T> {
  const {
    ttl = 5 * 60 * 1000,
    maxSize = 100,
    staleWhileRevalidate = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const fetcherRef = useRef(fetcher);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 更新fetcher引用
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 检查缓存
    if (!forceRefresh) {
      const cachedItem = globalCache.get<T>(key);
      if (cachedItem) {
        setData(cachedItem.data);
        setIsStale(cachedItem.isStale);
        setError(null);

        // 如果数据过期但启用了 staleWhileRevalidate，在后台更新
        if (cachedItem.isStale && staleWhileRevalidate) {
          fetchData(true); // 后台更新，不阻塞UI
          return;
        } else if (!cachedItem.isStale) {
          return; // 数据新鲜，直接返回
        }
      }
    }

    setLoading(true);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const result = await fetcherRef.current();
      
      // 检查请求是否被取消
      if (abortController.signal.aborted) {
        return;
      }

      // 更新缓存
      globalCache.set(key, result, ttl);
      
      setData(result);
      setIsStale(false);
      setError(null);
    } catch (err) {
      if (abortController.signal.aborted) {
        return;
      }

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      // 如果有缓存数据，保持显示
      const cachedItem = globalCache.get<T>(key);
      if (cachedItem) {
        setData(cachedItem.data);
        setIsStale(true);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [key, ttl, staleWhileRevalidate]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const clearCache = useCallback(() => {
    globalCache.delete(key);
    setData(null);
    setIsStale(false);
    setError(null);
  }, [key]);

  // 初始加载
  useEffect(() => {
    fetchData();

    return () => {
      // 清理：取消进行中的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    refetch,
    clearCache
  };
}

// 导出缓存实例用于手动操作
export { globalCache };

// 缓存统计信息
export function getCacheStats() {
  return {
    size: globalCache.size(),
    maxSize: 100 // 可以从配置中获取
  };
}

// 清理所有缓存
export function clearAllCache() {
  globalCache.clear();
}