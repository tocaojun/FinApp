import * as echarts from 'echarts';
import { EChartsOption } from '../components/charts/EChartsWrapper';

// 颜色主题配置
export const CHART_COLORS = {
  primary: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#f5222d', '#fa8c16', '#13c2c2', '#eb2f96'],
  gradient: [
    'rgba(24, 144, 255, 0.8)',
    'rgba(82, 196, 26, 0.8)',
    'rgba(250, 173, 20, 0.8)',
    'rgba(114, 46, 209, 0.8)',
    'rgba(245, 34, 45, 0.8)',
  ],
  risk: {
    low: '#52c41a',
    medium: '#faad14',
    high: '#f5222d',
  },
  performance: {
    positive: '#52c41a',
    negative: '#f5222d',
    neutral: '#d9d9d9',
  },
};

// 通用图表配置
export const DEFAULT_CHART_CONFIG = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 12,
    color: '#666',
  },
  animation: true,
  animationDuration: 1000,
  animationEasing: 'cubicOut' as const,
};

// 网格配置
export const DEFAULT_GRID_CONFIG = {
  left: '3%',
  right: '4%',
  bottom: '3%',
  top: '10%',
  containLabel: true,
};

// 工具提示配置
export const DEFAULT_TOOLTIP_CONFIG = {
  trigger: 'axis' as const,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: '#ccc',
  borderWidth: 1,
  textStyle: {
    color: '#333',
    fontSize: 12,
  },
  extraCssText: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); border-radius: 4px;',
};

// 图例配置
export const DEFAULT_LEGEND_CONFIG = {
  type: 'scroll' as const,
  orient: 'horizontal' as const,
  left: 'center',
  top: 'top',
  textStyle: {
    fontSize: 12,
    color: '#666',
  },
};

// 数据缩放配置
export const DEFAULT_DATAZOOM_CONFIG = [
  {
    type: 'inside' as const,
    start: 0,
    end: 100,
  },
  {
    type: 'slider' as const,
    start: 0,
    end: 100,
    height: 20,
    bottom: 10,
  },
];

// 格式化工具函数
export const formatters = {
  // 格式化百分比
  percentage: (value: number, precision: number = 2): string => {
    return `${(value * 100).toFixed(precision)}%`;
  },

  // 格式化货币
  currency: (value: number, currency: string = '¥', precision: number = 2): string => {
    if (value >= 1e8) {
      return `${currency}${(value / 1e8).toFixed(precision)}亿`;
    } else if (value >= 1e4) {
      return `${currency}${(value / 1e4).toFixed(precision)}万`;
    } else {
      return `${currency}${value.toFixed(precision)}`;
    }
  },

  // 格式化数字
  number: (value: number, precision: number = 2): string => {
    if (value >= 1e8) {
      return `${(value / 1e8).toFixed(precision)}亿`;
    } else if (value >= 1e4) {
      return `${(value / 1e4).toFixed(precision)}万`;
    } else {
      return value.toFixed(precision);
    }
  },

  // 格式化日期
  date: (value: string | Date, format: string = 'MM/DD'): string => {
    const date = new Date(value);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    switch (format) {
      case 'MM/DD':
        return `${month}/${day}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'YYYY/MM':
        return `${year}/${month}`;
      default:
        return `${month}/${day}`;
    }
  },

  // 格式化时间
  time: (value: string | Date): string => {
    const date = new Date(value);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },
};

// 创建渐变色
export const createGradient = (color: string, direction: 'vertical' | 'horizontal' = 'vertical'): any => {
  const isVertical = direction === 'vertical';
  return {
    type: 'linear',
    x: 0,
    y: isVertical ? 0 : 1,
    x2: isVertical ? 0 : 1,
    y2: isVertical ? 1 : 0,
    colorStops: [
      { offset: 0, color: color },
      { offset: 1, color: color.replace(/[\d.]+\)$/, '0.1)') },
    ],
  };
};

// 创建饼图配置
export const createPieChartOption = (
  data: Array<{ name: string; value: number; color?: string }>,
  options: {
    title?: string;
    showLegend?: boolean;
    showLabels?: boolean;
    radius?: string | [string, string];
    center?: [string, string];
  } = {}
): EChartsOption => {
  const {
    title,
    showLegend = true,
    showLabels = true,
    radius = ['40%', '70%'],
    center = ['50%', '50%'],
  } = options;

  return {
    ...DEFAULT_CHART_CONFIG,
    title: title ? {
      text: title,
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
      },
    } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const { name, value, percent } = params;
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${name}</div>
            <div>金额: ${formatters.currency(value)}</div>
            <div>占比: ${percent}%</div>
          </div>
        `;
      },
    },
    legend: showLegend ? {
      ...DEFAULT_LEGEND_CONFIG,
      top: title ? 60 : 20,
    } : undefined,
    series: [
      {
        type: 'pie',
        radius,
        center,
        data: data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: item.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length],
          },
        })),
        label: {
          show: showLabels,
          formatter: '{b}: {d}%',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
};

// 创建折线图配置
export const createLineChartOption = (
  data: Array<{ name: string; data: number[]; color?: string }>,
  xAxisData: string[],
  options: {
    title?: string;
    showLegend?: boolean;
    smooth?: boolean;
    showArea?: boolean;
    yAxisFormatter?: (value: number) => string;
    tooltipFormatter?: (params: any) => string;
  } = {}
): EChartsOption => {
  const {
    title,
    showLegend = true,
    smooth = true,
    showArea = false,
    yAxisFormatter,
    tooltipFormatter,
  } = options;

  return {
    ...DEFAULT_CHART_CONFIG,
    title: title ? {
      text: title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
      },
    } : undefined,
    tooltip: {
      ...DEFAULT_TOOLTIP_CONFIG,
      formatter: tooltipFormatter || ((params: any) => {
        let content = `<div style="padding: 8px;"><div style="font-weight: bold; margin-bottom: 4px;">${params[0].axisValue}</div>`;
        params.forEach((param: any) => {
          content += `<div style="margin: 2px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; margin-right: 8px;"></span>
            ${param.seriesName}: ${yAxisFormatter ? yAxisFormatter(param.value) : param.value}
          </div>`;
        });
        content += '</div>';
        return content;
      }),
    },
    legend: showLegend ? {
      ...DEFAULT_LEGEND_CONFIG,
      top: title ? 40 : 10,
    } : undefined,
    grid: {
      ...DEFAULT_GRID_CONFIG,
      top: title ? (showLegend ? 80 : 50) : (showLegend ? 50 : 20),
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: {
        lineStyle: {
          color: '#e8e8e8',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#666',
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#666',
        fontSize: 12,
        formatter: yAxisFormatter,
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed',
        },
      },
    },
    series: data.map((series, index) => ({
      name: series.name,
      type: 'line',
      data: series.data,
      smooth,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2,
        color: series.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length],
      },
      itemStyle: {
        color: series.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length],
      },
      areaStyle: showArea ? {
        color: createGradient(series.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length]),
      } : undefined,
    })),
  };
};

// 创建柱状图配置
export const createBarChartOption = (
  data: Array<{ name: string; data: number[]; color?: string }>,
  xAxisData: string[],
  options: {
    title?: string;
    showLegend?: boolean;
    horizontal?: boolean;
    yAxisFormatter?: (value: number) => string;
    tooltipFormatter?: (params: any) => string;
  } = {}
): EChartsOption => {
  const {
    title,
    showLegend = true,
    horizontal = false,
    yAxisFormatter,
    tooltipFormatter,
  } = options;

  const xAxis = {
    type: horizontal ? ('value' as const) : ('category' as const),
    data: horizontal ? undefined : xAxisData,
    axisLine: {
      lineStyle: {
        color: '#e8e8e8',
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#666',
      fontSize: 12,
      formatter: horizontal ? yAxisFormatter : undefined,
    },
    splitLine: horizontal ? {
      lineStyle: {
        color: '#f0f0f0',
        type: 'dashed',
      },
    } : undefined,
  };

  const yAxis = {
    type: horizontal ? ('category' as const) : ('value' as const),
    data: horizontal ? xAxisData : undefined,
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#666',
      fontSize: 12,
      formatter: horizontal ? undefined : yAxisFormatter,
    },
    splitLine: horizontal ? undefined : {
      lineStyle: {
        color: '#f0f0f0',
        type: 'dashed',
      },
    },
  };

  return {
    ...DEFAULT_CHART_CONFIG,
    title: title ? {
      text: title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
      },
    } : undefined,
    tooltip: {
      ...DEFAULT_TOOLTIP_CONFIG,
      formatter: tooltipFormatter || ((params: any) => {
        const param = Array.isArray(params) ? params[0] : params;
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${param.name}</div>
            <div>${param.seriesName}: ${yAxisFormatter ? yAxisFormatter(param.value) : param.value}</div>
          </div>
        `;
      }),
    },
    legend: showLegend ? {
      ...DEFAULT_LEGEND_CONFIG,
      top: title ? 40 : 10,
    } : undefined,
    grid: {
      ...DEFAULT_GRID_CONFIG,
      top: title ? (showLegend ? 80 : 50) : (showLegend ? 50 : 20),
    },
    xAxis,
    yAxis,
    series: data.map((series, index) => ({
      name: series.name,
      type: 'bar',
      data: series.data,
      itemStyle: {
        color: series.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length],
        borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    })),
  };
};

// 导出图表为图片
export const exportChart = (
  chartInstance: echarts.ECharts,
  filename: string,
  type: 'png' | 'jpg' | 'svg' = 'png'
): void => {
  const url = chartInstance.getDataURL({
    type: type === 'jpg' ? 'jpeg' : type,
    pixelRatio: 2,
    backgroundColor: '#fff',
  });

  const link = document.createElement('a');
  link.download = `${filename}.${type}`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 响应式图表尺寸计算
export const getResponsiveSize = (containerWidth: number): {
  fontSize: number;
  symbolSize: number;
  lineWidth: number;
} => {
  if (containerWidth < 400) {
    return { fontSize: 10, symbolSize: 4, lineWidth: 1 };
  } else if (containerWidth < 800) {
    return { fontSize: 12, symbolSize: 6, lineWidth: 2 };
  } else {
    return { fontSize: 14, symbolSize: 8, lineWidth: 3 };
  }
};