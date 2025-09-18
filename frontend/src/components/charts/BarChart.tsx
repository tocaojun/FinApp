import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card } from 'antd';

interface BarChartData {
  name: string;
  data: number[];
  color?: string;
  stack?: string;
  type?: 'bar' | 'line';
}

interface BarChartProps {
  data: BarChartData[];
  xAxisData: string[];
  title?: string;
  height?: number;
  horizontal?: boolean;
  showGrid?: boolean;
  showDataZoom?: boolean;
  showToolbox?: boolean;
  theme?: 'light' | 'dark';
  yAxisConfig?: {
    name?: string;
    min?: number;
    max?: number;
    formatter?: string;
  };
  onBarClick?: (seriesName: string, dataIndex: number, value: number) => void;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisData,
  title,
  height = 400,
  horizontal = false,
  showGrid = true,
  showDataZoom = false,
  showToolbox = true,
  theme = 'light',
  yAxisConfig,
  onBarClick
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current, theme);

    const option: echarts.EChartsOption = {
      title: title ? {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: theme === 'dark' ? '#fff' : '#333'
        }
      } : undefined,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
        borderColor: theme === 'dark' ? '#555' : '#ddd',
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      },
      legend: {
        data: data.map(item => item.name),
        top: title ? 40 : 10,
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      },
      grid: showGrid ? {
        left: '3%',
        right: '4%',
        bottom: showDataZoom ? '15%' : '3%',
        containLabel: true,
        borderColor: theme === 'dark' ? '#555' : '#ddd'
      } : undefined,
      toolbox: showToolbox ? {
        feature: {
          saveAsImage: {
            title: '保存为图片'
          },
          restore: {
            title: '重置'
          },
          magicType: {
            type: ['line', 'bar'],
            title: {
              line: '切换为折线图',
              bar: '切换为柱状图'
            }
          }
        },
        iconStyle: {
          borderColor: theme === 'dark' ? '#fff' : '#333'
        }
      } : undefined,
      xAxis: {
        type: horizontal ? 'value' : 'category',
        data: horizontal ? undefined : xAxisData,
        name: horizontal ? yAxisConfig?.name : undefined,
        min: horizontal ? yAxisConfig?.min : undefined,
        max: horizontal ? yAxisConfig?.max : undefined,
        axisLabel: {
          color: theme === 'dark' ? '#fff' : '#333',
          formatter: horizontal ? yAxisConfig?.formatter : undefined
        },
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#555' : '#ddd'
          }
        }
      },
      yAxis: {
        type: horizontal ? 'category' : 'value',
        data: horizontal ? xAxisData : undefined,
        name: horizontal ? undefined : yAxisConfig?.name,
        min: horizontal ? undefined : yAxisConfig?.min,
        max: horizontal ? undefined : yAxisConfig?.max,
        axisLabel: {
          color: theme === 'dark' ? '#fff' : '#333',
          formatter: horizontal ? undefined : yAxisConfig?.formatter
        },
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#555' : '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: theme === 'dark' ? '#333' : '#f0f0f0'
          }
        }
      },
      dataZoom: showDataZoom ? [
        {
          type: 'inside',
          start: 0,
          end: 100,
          orient: horizontal ? 'vertical' : 'horizontal'
        },
        {
          start: 0,
          end: 100,
          orient: horizontal ? 'vertical' : 'horizontal',
          handleStyle: {
            color: theme === 'dark' ? '#555' : '#ddd'
          },
          textStyle: {
            color: theme === 'dark' ? '#fff' : '#333'
          }
        }
      ] : undefined,
      series: data.map(item => ({
        name: item.name,
        type: item.type || 'bar',
        stack: item.stack,
        data: item.data,
        itemStyle: {
          color: item.color,
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        label: {
          show: false,
          position: horizontal ? 'right' : 'top',
          color: theme === 'dark' ? '#fff' : '#333'
        }
      }))
    };

    chartInstance.current.setOption(option);

    // 添加点击事件
    if (onBarClick) {
      chartInstance.current.on('click', (params: any) => {
        if (params.componentType === 'series') {
          onBarClick(params.seriesName, params.dataIndex, params.value);
        }
      });
    }

    // 响应式处理
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [data, xAxisData, title, height, horizontal, showGrid, showDataZoom, showToolbox, theme, yAxisConfig, onBarClick]);

  return (
    <Card>
      <div
        ref={chartRef}
        style={{ 
          width: '100%', 
          height: `${height}px`,
          minHeight: '300px'
        }}
      />
    </Card>
  );
};

export default BarChart;