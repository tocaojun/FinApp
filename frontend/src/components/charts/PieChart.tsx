import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card } from 'antd';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showLabel?: boolean;
  radius?: [string, string];
  center?: [string, string];
  theme?: 'light' | 'dark';
  onItemClick?: (data: PieChartData) => void;
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  height = 400,
  showLegend = true,
  showLabel = true,
  radius = ['40%', '70%'],
  center = ['50%', '50%'],
  theme = 'light',
  onItemClick
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表
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
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
        borderColor: theme === 'dark' ? '#555' : '#ddd',
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      },
      legend: showLegend ? {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      } : undefined,
      series: [
        {
          name: title || '数据分布',
          type: 'pie',
          radius,
          center,
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: theme === 'dark' ? '#1a1a1a' : '#fff',
            borderWidth: 2
          },
          label: showLabel ? {
            show: true,
            position: 'outside',
            formatter: '{b}: {d}%',
            color: theme === 'dark' ? '#fff' : '#333'
          } : {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: data.map(item => ({
            ...item,
            itemStyle: item.color ? { color: item.color } : undefined
          }))
        }
      ]
    };

    chartInstance.current.setOption(option);

    // 添加点击事件
    if (onItemClick) {
      chartInstance.current.on('click', (params: any) => {
        const clickedData = data.find(item => item.name === params.name);
        if (clickedData) {
          onItemClick(clickedData);
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
  }, [data, title, height, showLegend, showLabel, radius, center, theme, onItemClick]);

  // 主题变化时更新图表
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = echarts.init(chartRef.current!, theme);
      
      const option = chartInstance.current.getOption();
      chartInstance.current.setOption(option);
    }
  }, [theme]);

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

export default PieChart;