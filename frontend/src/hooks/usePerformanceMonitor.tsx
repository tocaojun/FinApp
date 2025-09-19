import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
  loadTime: number;
  interactionTime: number;
}

interface PerformanceOptions {
  enableFPSMonitoring?: boolean;
  enableMemoryMonitoring?: boolean;
  enableRenderTimeMonitoring?: boolean;
  sampleInterval?: number;
  onMetricsUpdate?: (metrics: Partial<PerformanceMetrics>) => void;
}

export function usePerformanceMonitor(options: PerformanceOptions = {}) {
  const {
    enableFPSMonitoring = true,
    enableMemoryMonitoring = true,
    enableRenderTimeMonitoring = true,
    sampleInterval = 1000,
    onMetricsUpdate
  } = options;

  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const renderStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const fpsHistory = useRef<number[]>([]);

  // 渲染时间监控
  const startRenderMeasure = useCallback(() => {
    if (enableRenderTimeMonitoring) {
      renderStartTime.current = performance.now();
    }
  }, [enableRenderTimeMonitoring]);

  const endRenderMeasure = useCallback(() => {
    if (enableRenderTimeMonitoring && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({ ...prev, renderTime }));
      onMetricsUpdate?.({ renderTime });
    }
  }, [enableRenderTimeMonitoring, onMetricsUpdate]);

  // FPS监控
  useEffect(() => {
    if (!enableFPSMonitoring) return;

    let animationId: number;
    
    const measureFPS = () => {
      const now = performance.now();
      frameCount.current++;

      if (lastFrameTime.current === 0) {
        lastFrameTime.current = now;
      }

      const elapsed = now - lastFrameTime.current;
      
      if (elapsed >= sampleInterval) {
        const fps = Math.round((frameCount.current * 1000) / elapsed);
        fpsHistory.current.push(fps);
        
        // 保持最近10个FPS样本
        if (fpsHistory.current.length > 10) {
          fpsHistory.current.shift();
        }

        const avgFPS = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;
        
        setMetrics(prev => ({ ...prev, fps: Math.round(avgFPS) }));
        onMetricsUpdate?.({ fps: Math.round(avgFPS) });

        frameCount.current = 0;
        lastFrameTime.current = now;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enableFPSMonitoring, sampleInterval, onMetricsUpdate]);

  // 内存使用监控
  useEffect(() => {
    if (!enableMemoryMonitoring) return;

    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
        
        setMetrics(prev => ({ ...prev, memoryUsage }));
        onMetricsUpdate?.({ memoryUsage });
      }
    };

    const interval = setInterval(measureMemory, sampleInterval);
    measureMemory(); // 立即执行一次

    return () => clearInterval(interval);
  }, [enableMemoryMonitoring, sampleInterval, onMetricsUpdate]);

  // 页面加载时间
  useEffect(() => {
    const measureLoadTime = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart;
          setMetrics(prev => ({ ...prev, loadTime }));
          onMetricsUpdate?.({ loadTime });
        }
      }
    };

    // 等待页面完全加载
    if (document.readyState === 'complete') {
      measureLoadTime();
    } else {
      window.addEventListener('load', measureLoadTime);
      return () => window.removeEventListener('load', measureLoadTime);
    }
  }, [onMetricsUpdate]);

  // 交互时间测量
  const measureInteractionTime = useCallback((startTime: number) => {
    const interactionTime = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, interactionTime }));
    onMetricsUpdate?.({ interactionTime });
    return interactionTime;
  }, [onMetricsUpdate]);

  // 获取性能建议
  const getPerformanceAdvice = useCallback(() => {
    const advice: string[] = [];

    if (metrics.fps && metrics.fps < 30) {
      advice.push('FPS过低，考虑优化渲染性能');
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 100) {
      advice.push('内存使用过高，检查是否有内存泄漏');
    }

    if (metrics.renderTime && metrics.renderTime > 16) {
      advice.push('渲染时间过长，考虑使用虚拟化或分页');
    }

    if (metrics.loadTime && metrics.loadTime > 3000) {
      advice.push('页面加载时间过长，考虑代码分割和懒加载');
    }

    if (metrics.interactionTime && metrics.interactionTime > 100) {
      advice.push('交互响应时间过长，优化事件处理逻辑');
    }

    return advice;
  }, [metrics]);

  // 性能评分 (0-100)
  const getPerformanceScore = useCallback(() => {
    let score = 100;

    if (metrics.fps) {
      if (metrics.fps < 30) score -= 20;
      else if (metrics.fps < 45) score -= 10;
    }

    if (metrics.memoryUsage) {
      if (metrics.memoryUsage > 200) score -= 20;
      else if (metrics.memoryUsage > 100) score -= 10;
    }

    if (metrics.renderTime) {
      if (metrics.renderTime > 32) score -= 20;
      else if (metrics.renderTime > 16) score -= 10;
    }

    if (metrics.loadTime) {
      if (metrics.loadTime > 5000) score -= 20;
      else if (metrics.loadTime > 3000) score -= 10;
    }

    if (metrics.interactionTime) {
      if (metrics.interactionTime > 200) score -= 20;
      else if (metrics.interactionTime > 100) score -= 10;
    }

    return Math.max(0, score);
  }, [metrics]);

  return {
    metrics,
    startRenderMeasure,
    endRenderMeasure,
    measureInteractionTime,
    getPerformanceAdvice,
    getPerformanceScore
  };
}

// 性能监控组件
export const PerformanceMonitor: React.FC<{
  children: React.ReactNode;
  showMetrics?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ 
  children, 
  showMetrics = false, 
  position = 'top-right' 
}) => {
  const { metrics, getPerformanceScore } = usePerformanceMonitor({
    onMetricsUpdate: (newMetrics) => {
      if (typeof window !== 'undefined') {
        console.log('Performance Metrics:', newMetrics);
      }
    }
  });

  const positionStyles = {
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 }
  };

  return (
    <>
      {children}
      {showMetrics && (
        <div
          style={{
            position: 'fixed',
            ...positionStyles[position],
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 9999,
            minWidth: '150px'
          }}
        >
          <div>Score: {getPerformanceScore()}/100</div>
          {metrics.fps && <div>FPS: {metrics.fps}</div>}
          {metrics.memoryUsage && <div>Memory: {metrics.memoryUsage}MB</div>}
          {metrics.renderTime && <div>Render: {metrics.renderTime.toFixed(1)}ms</div>}
          {metrics.loadTime && <div>Load: {metrics.loadTime.toFixed(0)}ms</div>}
        </div>
      )}
    </>
  );
};