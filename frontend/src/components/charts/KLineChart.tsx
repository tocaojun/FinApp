import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card } from 'antd';

interface KLineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
}

interface KLineChartProps {
  data: KLineData[];
  title?: string;
  height?: number;
  showVolume?: boolean;
  showMA?: boolean;
  maLines?: number[];
  theme?: 'light' | 'dark';
  onCandleClick?: (data: KLineData) => void;
}

const KLineChart: React.FC<KLineChartProps> = ({
  data,
  title,
  height = 500,
  showVolume = true,
  showMA = true,
  maLines = [5, 10, 20, 30],
  theme = 'light',
  onCandleClick
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 计算移动平均线
  const calculateMA = (data: number[], period: number): (number | null)[] => {
    const result: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  };

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    chartInstance.current = echarts.init(chartRef.current, theme);

    const dates = data.map(item => item.date);
    const klineData = data.map(item => [item.open, item.close, item.low, item.high]);
    const volumeData = data.map(item => item.volume || 0);
    const closePrices = data.map(item => item.close);

    // 计算移动平均线数据
    const maData = showMA ? maLines.map(period => ({
      name: `MA${period}`,
      data: calculateMA(closePrices, period),
      color: period === 5 ? '#ff6b6b' : period === 10 ? '#4ecdc4' : period === 20 ? '#45b7d1' : '#96ceb4'
    })) : [];

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
          type: 'cross'
        },
        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
        borderColor: theme === 'dark' ? '#555' : '#ddd',
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        },
        formatter: (params: any) => {
          const klineParam = params.find((p: any) => p.seriesName === 'K线');
          if (!klineParam) return '';
          
          const dataIndex = klineParam.dataIndex;
          const klineItem = data[dataIndex];
          
          let result = `${klineItem.date}<br/>`;
          result += `开盘: ${klineItem.open}<br/>`;
          result += `收盘: ${klineItem.close}<br/>`;
          result += `最高: ${klineItem.high}<br/>`;
          result += `最低: ${klineItem.low}<br/>`;
          
          if (showVolume && klineItem.volume) {
            result += `成交量: ${klineItem.volume}<br/>`;
          }
          
          // 添加MA线信息
          params.forEach((param: any) => {
            if (param.seriesName.startsWith('MA') && param.value !== null) {
              result += `${param.seriesName}: ${param.value.toFixed(2)}<br/>`;
            }
          });
          
          return result;
        }
      },
      legend: {
        data: ['K线', ...(showVolume ? ['成交量'] : []), ...maData.map(ma => ma.name)],
        top: title ? 40 : 10,
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      },
      grid: [
        {
          left: '3%',
          right: '4%',
          top: showMA ? '15%' : '10%',
          height: showVolume ? '50%' : '70%',
          borderColor: theme === 'dark' ? '#555' : '#ddd'
        },
        ...(showVolume ? [{
          left: '3%',
          right: '4%',
          top: '70%',
          height: '20%',
          borderColor: theme === 'dark' ? '#555' : '#ddd'
        }] : [])
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          splitNumber: 20,
          min: 'dataMin',
          max: 'dataMax',
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#333'
          }
        },
        ...(showVolume ? [{
          type: 'category' as const,
          gridIndex: 1,
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          splitNumber: 20,
          min: 'dataMin' as const,
          max: 'dataMax' as const
        }] : [])
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true,
            areaStyle: {
              color: theme === 'dark' ? ['#1a1a1a', '#2a2a2a'] : ['#f8f8f8', '#ffffff']
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
        ...(showVolume ? [{
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: {
            show: false
          }
        }] : [])
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: showVolume ? [0, 1] : [0],
          start: 50,
          end: 100
        },
        {
          show: true,
          xAxisIndex: showVolume ? [0, 1] : [0],
          type: 'slider',
          top: '90%',
          start: 50,
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
          name: 'K线',
          type: 'candlestick',
          data: klineData,
          itemStyle: {
            color: '#ef5350',
            color0: '#26a69a',
            borderColor: '#ef5350',
            borderColor0: '#26a69a'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          }
        },
        ...maData.map(ma => ({
          name: ma.name,
          type: 'line' as const,
          data: ma.data,
          smooth: true,
          lineStyle: {
            opacity: 0.8,
            width: 1,
            color: ma.color
          },
          symbol: 'none'
        })),
        ...(showVolume ? [{
          name: '成交量',
          type: 'bar' as const,
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumeData,
          itemStyle: {
            color: (params: any) => {
              const dataIndex = params.dataIndex;
              const klineItem = data[dataIndex];
              return klineItem.close >= klineItem.open ? '#26a69a' : '#ef5350';
            }
          }
        }] : [])
      ]
    };

    chartInstance.current.setOption(option);

    // 添加点击事件
    if (onCandleClick) {
      chartInstance.current.on('click', (params: any) => {
        if (params.componentType === 'series' && params.seriesName === 'K线') {
          const clickedData = data[params.dataIndex];
          onCandleClick(clickedData);
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
  }, [data, title, height, showVolume, showMA, maLines, theme, onCandleClick]);

  return (
    <Card>
      <div
        ref={chartRef}
        style={{ 
          width: '100%', 
          height: `${height}px`,
          minHeight: '400px'
        }}
      />
    </Card>
  );
};

export default KLineChart;