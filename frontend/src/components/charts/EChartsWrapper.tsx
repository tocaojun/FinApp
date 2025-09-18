import React, { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts';
import { Spin } from 'antd';

export interface EChartsOption extends echarts.EChartsOption {}

interface EChartsWrapperProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
  theme?: string;
  onChartReady?: (chart: echarts.ECharts) => void;
  onEvents?: Record<string, (params: any) => void>;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  showLoading?: boolean;
  loadingOption?: object;
}

const EChartsWrapper: React.FC<EChartsWrapperProps> = ({
  option,
  style = { height: '400px', width: '100%' },
  className,
  loading = false,
  theme,
  onChartReady,
  onEvents,
  notMerge = false,
  lazyUpdate = false,
  showLoading = false,
  loadingOption,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 初始化图表
  useEffect(() => {
    if (chartRef.current) {
      // 销毁已存在的图表实例
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }

      // 创建新的图表实例
      chartInstance.current = echarts.init(chartRef.current, theme);
      
      // 绑定事件
      if (onEvents) {
        Object.entries(onEvents).forEach(([eventName, handler]) => {
          chartInstance.current?.on(eventName, handler);
        });
      }

      // 图表准备完成回调
      if (onChartReady) {
        onChartReady(chartInstance.current);
      }

      setIsReady(true);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [theme, onChartReady]);

  // 更新图表配置
  useEffect(() => {
    if (chartInstance.current && isReady) {
      if (showLoading) {
        chartInstance.current.showLoading(loadingOption);
      } else {
        chartInstance.current.hideLoading();
      }

      chartInstance.current.setOption(option, notMerge, lazyUpdate);
    }
  }, [option, notMerge, lazyUpdate, showLoading, loadingOption, isReady]);

  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, []);

  return (
    <div className={className} style={{ position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1000,
          }}
        >
          <Spin size="large" />
        </div>
      )}
      <div ref={chartRef} style={style} />
    </div>
  );
};

export default EChartsWrapper;