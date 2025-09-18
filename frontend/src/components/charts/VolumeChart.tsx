import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card } from 'antd';

interface VolumeData {
  date: string;
  volume: number;
  amount?: number;
  type?: 'buy' | 'sell' | 'neutral';
}

interface VolumeChartProps {
  data: VolumeData[];
  title?: string;
  height?: number;
  showAmount?: boolean;
  chartType?: 'bar' | 'line' | 'area';
  theme?: 'light' | 'dark';
  onVolumeClick?: (data: VolumeData) => void;
}

const VolumeChart: React.FC<VolumeChartProps> = ({
  data,
  title,
  height = 400,
  showAmount = false,
  chartType = 'bar',
  theme = 'light',
  onVolumeClick
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    chartInstance.current = echarts.init(chartRef.current, theme);

    const dates = data.map(item => item.date);
    const volumes = data.map(item => item.volume);
    const amounts = showAmount ? data.map(item => item.amount || 0) : [];

    const getVolumeColor = (item: VolumeData) => {
      switch (item.type) {
        case 'buy': return '#26a69a';
        case 'sell': return '#ef5350';
        default: return theme === 'dark' ? '#64b5f6' : '#42a5f5';
      }
    };

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
          type: chartType === 'bar' ? 'shadow' : 'line'
        },
        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
        borderColor: theme === 'dark' ? '#555' : '#ddd',
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        },
        formatter: (params: any) => {
          const param = Array.isArray(params) ? params[0] : params;
          const dataIndex = param.dataIndex;
          const item = data[dataIndex];
          
          let result = `${item.date}<br/>`;
          result += `成交量: ${item.volume.toLocaleString()}<br/>`;
          
          if (showAmount && item.amount) {
            result += `成交额: ${item.amount.toLocaleString()}<br/>`;
          }
          
          if (item.type) {
            const typeText = item.type === 'buy' ? '买入' : item.type === 'sell' ? '卖出' : '中性';
            result += `类型: ${typeText}`;
          }
          
          return result;
        }
      },
      legend: {
        data: ['成交量', ...(showAmount ? ['成交额'] : [])],
        top: title ? 40 : 10,
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
        borderColor: theme === 'dark' ? '#555' : '#ddd'
      },
      toolbox: {
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
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: theme === 'dark' ? '#fff' : '#333',
          rotate: 45
        },
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#555' : '#ddd'
          }
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '成交量',
          position: 'left',
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#333',
            formatter: (value: number) => {
              if (value >= 10000) {
                return (value / 10000).toFixed(1) + '万';
              }
              return value.toString();
            }
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
        ...(showAmount ? [{
          type: 'value' as const,
          name: '成交额',
          position: 'right' as const,
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#333',
            formatter: (value: number) => {
              if (value >= 100000000) {
                return (value / 100000000).toFixed(1) + '亿';
              } else if (value >= 10000) {
                return (value / 10000).toFixed(1) + '万';
              }
              return value.toString();
            }
          },
          axisLine: {
            lineStyle: {
              color: theme === 'dark' ? '#555' : '#ddd'
            }
          }
        }] : [])
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100,
          handleStyle: {
            color: theme === 'dark' ? '#555' : '#ddd'
          },
          textStyle: {
            color: theme === 'dark' ? '#fff' : '#333'
          }
        }
      ],
      series: [
        {
          name: '成交量',
          type: chartType === 'area' ? 'line' : chartType,
          data: volumes,
          itemStyle: {
            color: (params: any) => getVolumeColor(data[params.dataIndex])
          },
          ...(chartType === 'area' ? {
            areaStyle: {
              opacity: 0.6
            },
            smooth: true
          } : {}),
          ...(chartType === 'line' ? {
            smooth: true,
            symbol: 'circle',
            symbolSize: 4
          } : {}),
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          }
        },
        ...(showAmount ? [{
          name: '成交额',
          type: 'line' as const,
          yAxisIndex: 1,
          data: amounts,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            width: 2,
            color: '#ff9800'
          },
          itemStyle: {
            color: '#ff9800'
          }
        }] : [])
      ]
    };

    chartInstance.current.setOption(option);

    // 添加点击事件
    if (onVolumeClick) {
      chartInstance.current.on('click', (params: any) => {
        if (params.componentType === 'series') {
          const clickedData = data[params.dataIndex];
          onVolumeClick(clickedData);
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
  }, [data, title, height, showAmount, chartType, theme, onVolumeClick]);

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

export default VolumeChart;