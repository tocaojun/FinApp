import React, { useState, useEffect, useRef } from 'react';
import { Spin, Alert, Button, Card } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface LoadingBoundaryProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  loadingText?: string;
  errorTitle?: string;
  retryText?: string;
  minLoadingTime?: number;
  skeleton?: React.ReactNode;
  fallback?: React.ReactNode;
}

const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
  children,
  loading = false,
  error = null,
  onRetry,
  loadingText = '加载中...',
  errorTitle = '加载失败',
  retryText = '重试',
  minLoadingTime = 300,
  skeleton,
  fallback
}) => {
  const [showLoading, setShowLoading] = useState(loading);
  const [retryCount, setRetryCount] = useState(0);
  const loadingStartTime = useRef<number>(0);

  // 处理最小加载时间，避免闪烁
  useEffect(() => {
    if (loading) {
      loadingStartTime.current = Date.now();
      setShowLoading(true);
    } else if (showLoading) {
      const elapsed = Date.now() - loadingStartTime.current;
      const remaining = Math.max(0, minLoadingTime - elapsed);
      
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowLoading(false);
        }, remaining);
        
        return () => clearTimeout(timer);
      } else {
        setShowLoading(false);
      }
    }
  }, [loading, showLoading, minLoadingTime]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry?.();
  };

  // 错误状态
  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card>
        <Alert
          message={errorTitle}
          description={
            <div>
              <p>{error.message}</p>
              {retryCount > 0 && (
                <p style={{ color: '#666', fontSize: '12px' }}>
                  重试次数: {retryCount}
                </p>
              )}
            </div>
          }
          type="error"
          action={
            onRetry && (
              <Button 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={handleRetry}
              >
                {retryText}
              </Button>
            )
          }
        />
      </Card>
    );
  }

  // 加载状态
  if (showLoading) {
    if (skeleton) {
      return <>{skeleton}</>;
    }

    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          flexDirection: 'column'
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>
          {loadingText}
        </div>
      </div>
    );
  }

  // 正常内容
  return <>{children}</>;
};

export default LoadingBoundary;