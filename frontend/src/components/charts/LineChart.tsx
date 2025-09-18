import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card } from 'antd';

interface LineChartData {
  name: string;
  data: number[];
  color?: string;
  type?: 'line' | 'bar';
  yAxisIndex?: number;
}

interface LineChartProps {
  data: LineChartData[];
  xAxisData: string[];
  title?: string;
  height?: number;
  showGrid?: boolean;
  showDataZoom?: boolean;
  showToolbox?: boolean;
  theme?: 'light' | 'dark';
  yAxisConfig?: {
    left?: {
      name?: string;
      min?: number;
      max?: number;
    };
    right?: {
      name?: string;
      min?: number;
      max?: number;
    };
  };
  onDataPointClick?: (seriesName: string, dataIndex: number, value: number) => void;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxisData,
  title,
  height = 400,
  showGrid = true,
  showDataZoom = true,
  showToolbox = true,
  theme = 'light',
  yAxisConfig,
  onDataPointClick
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
          type: 'cross',
          label: {
            backgroundColor: theme === 'dark' ? '#555' : '#6a7985'
          }
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
          dataZoom: {
            title: {
              zoom: '区域缩放',
              back: '区域缩放还原'
            }
          }
        },
        iconStyle: {
          borderColor: theme === 'dark' ? '#fff' : '#333'
        }
      } : undefined,
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#555' : '#ddd'
          }
        },
        axisLabel: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: yAxisConfig?.left?.name,
          min: yAxisConfig?.left?.min,
          max: yAxisConfig?.left?.max,
          axisLine: {
            lineStyle: {
              color: theme === 'dark' ? '#555' : '#ddd'
            }
          },
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#333'
          },
          splitLine: {
            lineStyle: {
              color: theme === 'dark' ? '#333' : '#f0f0f0'
            }
          }
        },
        ...(yAxisConfig?.right ? [{
          type: 'value' as const,
          name: yAxisConfig.right.name,
          min: yAxisConfig.right.min,
          max: yAxisConfig.right.max,
          position: 'right' as const,
          axisLine: {
            lineStyle: {
              color: theme === 'dark' ? '#555' : '#ddd'
            }
          },
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#333'
          }
        }] : [])
      ],
      dataZoom: showDataZoom ? [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100,
          handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23.1h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
          handleSize: '80%',
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
        type: item.type || 'line',
        yAxisIndex: item.yAxisIndex || 0,
        data: item.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: item.color
        },
        itemStyle: {
          color: item.color,
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: item.type === 'line' ? {
          opacity: 0.1,
          color: item.color
        } : undefined,
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }))
    };

    chartInstance.current.setOption(option);

    // 添加点击事件
    if (onDataPointClick) {
      chartInstance.current.on('click', (params: any) => {
        if (params.componentType === 'series') {
          onDataPointClick(params.seriesName, params.dataIndex, params.value);
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
  }, [data, xAxisData, title, height, showGrid, showDataZoom, showToolbox, theme, yAxisConfig, onDataPointClick]);

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

export default LineChart;