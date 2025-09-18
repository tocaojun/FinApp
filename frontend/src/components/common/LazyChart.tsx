import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { Spin, Card, Alert } from 'antd';

// 懒加载图表组件
const PieChart = lazy(() => import('../charts/PieChart'));
const LineChart = lazy(() => import('../charts/LineChart'));
const BarChart = lazy(() => import('../charts/BarChart'));
const KLineChart = lazy(() => import('../charts/KLineChart'));
const VolumeChart = lazy(() => import('../charts/VolumeChart'));
const InteractiveChart = lazy(() => import('../charts/InteractiveChart'));

interface LazyChartProps {
  type: 'pie' | 'line' | 'bar' | 'kline' | 'volume' | 'interactive';
  data: any[];
  title?: string;
  height?: number;
  theme?: 'light' | 'dark';
  loadingText?: string;
  errorText?: string;
  retryText?: string;
  enableIntersectionObserver?: boolean;
  [key: string]: any;
}

const LazyChart: React.FC<LazyChartProps> = ({
  type,
  data,
  title,
  height = 400,
  theme = 'light',
  loadingText = '图表加载中...',
  errorText = '图表加载失败',
  retryText = '重试',
  enableIntersectionObserver = true,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(!enableIntersectionObserver);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用 Intersection Observer 实现可视区域加载
  useEffect(() => {
    if (!enableIntersectionObserver || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [enableIntersectionObserver, isVisible]);

  // 错误重试
  const handleRetry = () => {
    setHasError(false);
    setRetryCount(prev => prev + 1);
  };

  // 错误边界处理
  const handleError = (error: Error) => {
    console.error('Chart loading error:', error);
    setHasError(true);
  };

  // 渲染对应的图表组件
  const renderChart = () => {
    const commonProps = {
      data,
      title,
      height,
      theme,
      ...props
    };

    switch (type) {
      case 'pie':
        return <PieChart {...commonProps} />;
      case 'line':
        return <LineChart {...commonProps} xAxisData={props.xAxisData || []} />;
      case 'bar':
        return <BarChart {...commonProps} xAxisData={props.xAxisData || []} />;
      case 'kline':
        return <KLineChart {...commonProps} />;
      case 'volume':
        return <VolumeChart {...commonProps} />;
      case 'interactive':
        return <InteractiveChart {...commonProps} chartType={props.chartType || 'line'} />;
      default:
        return <Alert message="不支持的图表类型" type="error" />;
    }
  };

  // 加载状态组件
  const LoadingComponent = () => (
    <Card style={{ height: `${height}px` }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          flexDirection: 'column'
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>
          {loadingText}
        </div>
      </div>
    </Card>
  );

  // 错误状态组件
  const ErrorComponent = () => (
    <Card style={{ height: `${height}px` }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          flexDirection: 'column'
        }}
      >
        <Alert
          message={errorText}
          description={`重试次数: ${retryCount}`}
          type="error"
          action={
            <button 
              onClick={handleRetry}
              style={{
                background: '#ff4d4f',
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {retryText}
            </button>
          }
        />
      </div>
    </Card>
  );

  return (
    <div ref={containerRef} style={{ minHeight: `${height}px` }}>
      {!isVisible ? (
        <LoadingComponent />
      ) : hasError ? (
        <ErrorComponent />
      ) : (
        <Suspense fallback={<LoadingComponent />}>
          <ErrorBoundary onError={handleError} key={retryCount}>
            {renderChart()}
          </ErrorBoundary>
        </Suspense>
      )}
    </div>
  );
};

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error Boundary:', error, errorInfo);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // 让父组件处理错误显示
    }

    return this.props.children;
  }
}

export default LazyChart;