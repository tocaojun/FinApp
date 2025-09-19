import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Dropdown, Grid, Space } from 'antd';
import { 
  FullscreenOutlined, 
  DownloadOutlined, 
  CompressOutlined
} from '@ant-design/icons';
import EChartsWrapper from './EChartsWrapper';
import type { EChartsOption } from 'echarts';

const { useBreakpoint } = Grid;

interface ResponsiveChartProps {
  title?: string;
  option: EChartsOption;
  height?: number | string;
  loading?: boolean;
  className?: string;
  showControls?: boolean;
  onExport?: (format: 'png' | 'jpg' | 'svg' | 'pdf') => void;
  onFullscreen?: () => void;
  extra?: React.ReactNode;
}

const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  title,
  option,
  height = 400,
  loading = false,
  className,
  showControls = true,
  onExport,
  onFullscreen,
  extra
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartHeight, setChartHeight] = useState<number | string>(height);
  const chartRef = useRef<any>(null);
  const screens = useBreakpoint();

  // 响应式高度调整
  useEffect(() => {
    if (screens.xs) {
      setChartHeight(250); // 手机端
    } else if (screens.sm) {
      setChartHeight(300); // 小平板
    } else if (screens.md) {
      setChartHeight(350); // 平板
    } else {
      setChartHeight(height); // 桌面端
    }
  }, [screens, height]);

  // 导出功能
  const handleExport = (format: 'png' | 'jpg' | 'svg' | 'pdf') => {
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      if (chartInstance) {
        const dataURL = chartInstance.getDataURL({
          type: format === 'jpg' ? 'jpeg' : format,
          pixelRatio: 2,
          backgroundColor: '#fff'
        });
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `chart-${Date.now()}.${format}`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
    
    if (onExport) {
      onExport(format);
    }
  };

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (onFullscreen) {
      onFullscreen();
    }
  };

  // 导出菜单项
  const exportMenuItems = [
    {
      key: 'png',
      label: 'PNG 图片',
      onClick: () => handleExport('png')
    },
    {
      key: 'jpg',
      label: 'JPG 图片',
      onClick: () => handleExport('jpg')
    },
    {
      key: 'svg',
      label: 'SVG 矢量图',
      onClick: () => handleExport('svg')
    }
  ];

  // 响应式选项调整
  const getResponsiveOption = (): EChartsOption => {
    const baseOption = { ...option };
    
    if (screens.xs) {
      // 手机端优化
      return {
        ...baseOption,
        grid: {
          ...baseOption.grid,
          left: '10%',
          right: '10%',
          top: '15%',
          bottom: '15%',
          containLabel: true
        },
        legend: {
          ...baseOption.legend,
          orient: 'horizontal',
          bottom: 0,
          left: 'center',
          itemWidth: 12,
          itemHeight: 8,
          textStyle: {
            fontSize: 10
          }
        },
        xAxis: Array.isArray(baseOption.xAxis) 
          ? baseOption.xAxis.map(axis => ({
              ...axis,
              axisLabel: {
                ...axis.axisLabel,
                fontSize: 10,
                rotate: screens.xs ? 45 : 0
              }
            }))
          : {
              ...baseOption.xAxis,
              axisLabel: {
                ...baseOption.xAxis?.axisLabel,
                fontSize: 10,
                rotate: 45
              }
            },
        yAxis: Array.isArray(baseOption.yAxis)
          ? baseOption.yAxis.map(axis => ({
              ...axis,
              axisLabel: {
                ...axis.axisLabel,
                fontSize: 10
              }
            }))
          : {
              ...baseOption.yAxis,
              axisLabel: {
                ...baseOption.yAxis?.axisLabel,
                fontSize: 10
              }
            },
        tooltip: {
          ...baseOption.tooltip,
          trigger: 'axis',
          confine: true,
          textStyle: {
            fontSize: 12
          }
        }
      };
    } else if (screens.sm || screens.md) {
      // 平板端优化
      return {
        ...baseOption,
        grid: {
          ...baseOption.grid,
          left: '8%',
          right: '8%',
          top: '12%',
          bottom: '12%',
          containLabel: true
        },
        legend: {
          ...baseOption.legend,
          textStyle: {
            fontSize: 12
          }
        },
        tooltip: {
          ...baseOption.tooltip,
          textStyle: {
            fontSize: 13
          }
        }
      };
    }
    
    return baseOption;
  };

  const cardExtra = (
    <Space size="small">
      {extra}
      {showControls && (
        <>
          <Dropdown 
            menu={{ items: exportMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              size={screens.xs ? 'small' : 'middle'}
            />
          </Dropdown>
          
          <Button 
            type="text" 
            icon={isFullscreen ? <CompressOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            size={screens.xs ? 'small' : 'middle'}
          />
        </>
      )}
    </Space>
  );

  return (
    <Card
      title={title}
      extra={cardExtra}
      loading={loading}
      className={`responsive-chart ${className || ''}`}
      bodyStyle={{ 
        padding: screens.xs ? '12px' : '16px',
        height: chartHeight
      }}
      headStyle={{
        padding: screens.xs ? '0 12px' : '0 16px',
        minHeight: screens.xs ? '40px' : '48px'
      }}
    >
      <EChartsWrapper
        option={getResponsiveOption()}
        height="100%"
        style={{ 
          width: '100%',
          height: '100%'
        }}
        onChartReady={(chart) => {
          chartRef.current = { getEchartsInstance: () => chart };
        }}
      />
    </Card>
  );
};

export default ResponsiveChart;