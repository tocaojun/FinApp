import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as echarts from 'echarts';
import { Card, Button, Space, Select, Tooltip, Modal, message } from 'antd';
import { 
  DownloadOutlined, 
  FullscreenOutlined, 
  SettingOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined
} from '@ant-design/icons';

interface ChartData {
  [key: string]: any;
}

interface InteractiveChartProps {
  data: ChartData[];
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'candlestick';
  title?: string;
  height?: number;
  theme?: 'light' | 'dark';
  enableDrillDown?: boolean;
  enableZoom?: boolean;
  enableExport?: boolean;
  enableFullscreen?: boolean;
  onDataDrillDown?: (data: ChartData, level: number) => Promise<ChartData[]>;
  onDataExport?: (format: 'png' | 'jpg' | 'svg' | 'pdf') => void;
  customOptions?: echarts.EChartsOption;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  chartType,
  title,
  height = 400,
  theme = 'light',
  enableDrillDown = true,
  enableZoom = true,
  enableExport = true,
  enableFullscreen = true,
  onDataDrillDown,
  onDataExport,
  customOptions
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentData, setCurrentData] = useState(data);
  const [drillDownLevel, setDrillDownLevel] = useState(0);
  const [drillDownHistory, setDrillDownHistory] = useState<ChartData[][]>([data]);
  const [loading, setLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [chartSettings, setChartSettings] = useState({
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    showDataZoom: enableZoom,
    animationDuration: 1000
  });

  // 生成基础图表配置
  const generateChartOption = useCallback((): echarts.EChartsOption => {
    const baseOption: echarts.EChartsOption = {
      title: title ? {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: theme === 'dark' ? '#fff' : '#333'
        }
      } : undefined,
      tooltip: chartSettings.showTooltip ? {
        trigger: chartType === 'pie' ? 'item' : 'axis',
        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
        borderColor: theme === 'dark' ? '#555' : '#ddd',
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        },
        formatter: (params: any) => {
          if (enableDrillDown && onDataDrillDown) {
            const suffix = '<br/><span style="color: #1890ff;">点击进行数据钻取</span>';
            if (Array.isArray(params)) {
              return params[0].name + ': ' + params[0].value + suffix;
            }
            return params.name + ': ' + params.value + suffix;
          }
          return undefined; // 使用默认格式
        }
      } : undefined,
      legend: chartSettings.showLegend ? {
        top: title ? 40 : 10,
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      } : undefined,
      grid: chartSettings.showGrid && chartType !== 'pie' ? {
        left: '3%',
        right: '4%',
        bottom: chartSettings.showDataZoom ? '15%' : '3%',
        containLabel: true,
        borderColor: theme === 'dark' ? '#555' : '#ddd'
      } : undefined,
      dataZoom: chartSettings.showDataZoom && chartType !== 'pie' ? [
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
      ] : undefined,
      animation: true,
      animationDuration: chartSettings.animationDuration
    };

    // 根据图表类型生成特定配置
    switch (chartType) {
      case 'pie':
        return {
          ...baseOption,
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: currentData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              color: theme === 'dark' ? '#fff' : '#333'
            }
          }]
        };

      case 'line':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: currentData.map(item => item.name || item.x),
            axisLabel: {
              color: theme === 'dark' ? '#fff' : '#333'
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              color: theme === 'dark' ? '#fff' : '#333'
            },
            splitLine: {
              lineStyle: {
                color: theme === 'dark' ? '#333' : '#f0f0f0'
              }
            }
          },
          series: [{
            type: 'line',
            data: currentData.map(item => item.value || item.y),
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              width: 2
            },
            areaStyle: {
              opacity: 0.1
            }
          }]
        };

      case 'bar':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: currentData.map(item => item.name || item.x),
            axisLabel: {
              color: theme === 'dark' ? '#fff' : '#333'
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              color: theme === 'dark' ? '#fff' : '#333'
            },
            splitLine: {
              lineStyle: {
                color: theme === 'dark' ? '#333' : '#f0f0f0'
              }
            }
          },
          series: [{
            type: 'bar',
            data: currentData.map(item => item.value || item.y),
            itemStyle: {
              borderRadius: [4, 4, 0, 0]
            }
          }]
        };

      default:
        return baseOption;
    }
  }, [currentData, chartType, title, theme, chartSettings, enableDrillDown, onDataDrillDown]);

  // 初始化和更新图表
  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current, theme);
    
    const option = customOptions || generateChartOption();
    chartInstance.current.setOption(option);

    // 添加点击事件处理数据钻取
    if (enableDrillDown && onDataDrillDown) {
      chartInstance.current.on('click', async (params: any) => {
        if (params.componentType === 'series') {
          setLoading(true);
          try {
            const drillDownData = await onDataDrillDown(params.data, drillDownLevel + 1);
            setCurrentData(drillDownData);
            setDrillDownLevel(prev => prev + 1);
            setDrillDownHistory(prev => [...prev, drillDownData]);
            message.success('数据钻取成功');
          } catch (error) {
            message.error('数据钻取失败');
          } finally {
            setLoading(false);
          }
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
    };
  }, [currentData, generateChartOption, customOptions, theme, enableDrillDown, onDataDrillDown, drillDownLevel]);

  // 导出图表
  const handleExport = (format: 'png' | 'jpg' | 'svg' | 'pdf') => {
    if (!chartInstance.current) return;

    if (onDataExport) {
      onDataExport(format);
      return;
    }

    try {
      if (format === 'png' || format === 'jpg') {
        const url = chartInstance.current.getDataURL({
          type: format === 'jpg' ? 'jpeg' : format,
          pixelRatio: 2,
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff'
        });
        
        const link = document.createElement('a');
        link.download = `chart.${format}`;
        link.href = url;
        link.click();
        
        message.success(`图表已导出为 ${format.toUpperCase()} 格式`);
      } else if (format === 'svg') {
        const svgStr = chartInstance.current.renderToSVGString();
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = 'chart.svg';
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        message.success('图表已导出为 SVG 格式');
      }
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 缩放控制
  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    if (!chartInstance.current) return;

    const option = chartInstance.current.getOption();
    let dataZoom = option.dataZoom as any[];

    if (!dataZoom || !dataZoom.length) return;

    const currentZoom = dataZoom[0];
    let start = currentZoom.start || 0;
    let end = currentZoom.end || 100;

    switch (type) {
      case 'in':
        const zoomInRange = (end - start) * 0.1;
        start += zoomInRange;
        end -= zoomInRange;
        break;
      case 'out':
        const zoomOutRange = (end - start) * 0.1;
        start = Math.max(0, start - zoomOutRange);
        end = Math.min(100, end + zoomOutRange);
        break;
      case 'reset':
        start = 0;
        end = 100;
        break;
    }

    chartInstance.current.dispatchAction({
      type: 'dataZoom',
      start,
      end
    });
  };

  // 返回上一级数据
  const handleDrillUp = () => {
    if (drillDownLevel > 0) {
      const newHistory = drillDownHistory.slice(0, -1);
      const previousData = newHistory[newHistory.length - 1];
      
      setCurrentData(previousData);
      setDrillDownLevel(prev => prev - 1);
      setDrillDownHistory(newHistory);
    }
  };

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const chartHeight = isFullscreen ? '80vh' : height;

  return (
    <>
      <Card
        title={
          <Space>
            {title}
            {drillDownLevel > 0 && (
              <Button size="small" onClick={handleDrillUp}>
                返回上级 (Level {drillDownLevel})
              </Button>
            )}
          </Space>
        }
        extra={
          <Space>
            {enableZoom && (
              <>
                <Tooltip title="放大">
                  <Button 
                    icon={<ZoomInOutlined />} 
                    size="small" 
                    onClick={() => handleZoom('in')}
                  />
                </Tooltip>
                <Tooltip title="缩小">
                  <Button 
                    icon={<ZoomOutOutlined />} 
                    size="small" 
                    onClick={() => handleZoom('out')}
                  />
                </Tooltip>
                <Tooltip title="重置缩放">
                  <Button 
                    icon={<ReloadOutlined />} 
                    size="small" 
                    onClick={() => handleZoom('reset')}
                  />
                </Tooltip>
              </>
            )}
            
            <Tooltip title="设置">
              <Button 
                icon={<SettingOutlined />} 
                size="small" 
                onClick={() => setSettingsVisible(true)}
              />
            </Tooltip>

            {enableExport && (
              <Select
                placeholder="导出"
                size="small"
                style={{ width: 80 }}
                onSelect={handleExport}
                suffixIcon={<DownloadOutlined />}
              >
                <Select.Option value="png">PNG</Select.Option>
                <Select.Option value="jpg">JPG</Select.Option>
                <Select.Option value="svg">SVG</Select.Option>
              </Select>
            )}

            {enableFullscreen && (
              <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
                <Button 
                  icon={<FullscreenOutlined />} 
                  size="small" 
                  onClick={toggleFullscreen}
                />
              </Tooltip>
            )}
          </Space>
        }
        loading={loading}
        style={isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          margin: 0
        } : undefined}
      >
        <div
          ref={chartRef}
          style={{ 
            width: '100%', 
            height: `${chartHeight}px`,
            minHeight: '300px'
          }}
        />
      </Card>

      {/* 设置模态框 */}
      <Modal
        title="图表设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onOk={() => setSettingsVisible(false)}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>显示网格: </label>
            <Select
              value={chartSettings.showGrid}
              onChange={(value) => setChartSettings(prev => ({ ...prev, showGrid: value }))}
              style={{ width: 100 }}
            >
              <Select.Option value={true}>是</Select.Option>
              <Select.Option value={false}>否</Select.Option>
            </Select>
          </div>
          
          <div>
            <label>显示图例: </label>
            <Select
              value={chartSettings.showLegend}
              onChange={(value) => setChartSettings(prev => ({ ...prev, showLegend: value }))}
              style={{ width: 100 }}
            >
              <Select.Option value={true}>是</Select.Option>
              <Select.Option value={false}>否</Select.Option>
            </Select>
          </div>
          
          <div>
            <label>显示提示框: </label>
            <Select
              value={chartSettings.showTooltip}
              onChange={(value) => setChartSettings(prev => ({ ...prev, showTooltip: value }))}
              style={{ width: 100 }}
            >
              <Select.Option value={true}>是</Select.Option>
              <Select.Option value={false}>否</Select.Option>
            </Select>
          </div>
          
          <div>
            <label>动画时长: </label>
            <Select
              value={chartSettings.animationDuration}
              onChange={(value) => setChartSettings(prev => ({ ...prev, animationDuration: value }))}
              style={{ width: 100 }}
            >
              <Select.Option value={0}>无动画</Select.Option>
              <Select.Option value={500}>500ms</Select.Option>
              <Select.Option value={1000}>1000ms</Select.Option>
              <Select.Option value={2000}>2000ms</Select.Option>
            </Select>
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default InteractiveChart;