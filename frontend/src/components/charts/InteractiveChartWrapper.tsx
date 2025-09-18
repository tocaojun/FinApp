import React, { useState, useCallback, useMemo } from 'react';
import { Card, Space, Typography, Button, Tooltip, Dropdown, Menu, Modal } from 'antd';
import { 
  DownloadOutlined, 
  FullscreenOutlined, 
  SettingOutlined, 
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import EChartsWrapper, { EChartsOption } from './EChartsWrapper';

const { Title } = Typography;

interface InteractiveChartWrapperProps {
  title: string;
  option: EChartsOption;
  height?: number;
  loading?: boolean;
  children?: React.ReactNode;
  onExport?: (format: 'png' | 'jpg' | 'svg' | 'pdf') => void;
  onFullscreen?: () => void;
  onRefresh?: () => void;
  showToolbar?: boolean;
  showExport?: boolean;
  showFullscreen?: boolean;
  showRefresh?: boolean;
  showSettings?: boolean;
  customActions?: React.ReactNode;
  description?: string;
}

const InteractiveChartWrapper: React.FC<InteractiveChartWrapperProps> = ({
  title,
  option,
  height = 400,
  loading = false,
  children,
  onExport,
  onFullscreen,
  onRefresh,
  showToolbar = true,
  showExport = true,
  showFullscreen = true,
  showRefresh = true,
  showSettings = false,
  customActions,
  description,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartInstance, setChartInstance] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // 处理图表实例准备
  const handleChartReady = useCallback((chart: any) => {
    setChartInstance(chart);
  }, []);

  // 导出菜单
  const exportMenu = useMemo(() => (
    <Menu
      items={[
        {
          key: 'png',
          label: 'PNG 图片',
          onClick: () => handleExport('png'),
        },
        {
          key: 'jpg',
          label: 'JPG 图片',
          onClick: () => handleExport('jpg'),
        },
        {
          key: 'svg',
          label: 'SVG 矢量图',
          onClick: () => handleExport('svg'),
        },
        {
          key: 'pdf',
          label: 'PDF 文档',
          onClick: () => handleExport('pdf'),
        },
      ]}
    />
  ), []);

  // 处理导出
  const handleExport = useCallback((format: 'png' | 'jpg' | 'svg' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else if (chartInstance) {
      // 默认导出实现
      const url = chartInstance.getDataURL({
        type: format === 'jpg' ? 'jpeg' : format,
        pixelRatio: 2,
        backgroundColor: '#fff',
      });
      
      const link = document.createElement('a');
      link.download = `${title}_${new Date().toISOString().split('T')[0]}.${format}`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [chartInstance, onExport, title]);

  // 处理全屏
  const handleFullscreen = useCallback(() => {
    if (onFullscreen) {
      onFullscreen();
    } else {
      setIsFullscreen(true);
    }
  }, [onFullscreen]);

  // 处理缩放
  const handleZoom = useCallback((direction: 'in' | 'out' | 'reset') => {
    if (!chartInstance) return;

    let newZoomLevel = zoomLevel;
    switch (direction) {
      case 'in':
        newZoomLevel = Math.min(200, zoomLevel + 25);
        break;
      case 'out':
        newZoomLevel = Math.max(50, zoomLevel - 25);
        break;
      case 'reset':
        newZoomLevel = 100;
        break;
    }

    setZoomLevel(newZoomLevel);
    
    // 应用缩放
    const container = chartInstance.getDom();
    if (container) {
      container.style.transform = `scale(${newZoomLevel / 100})`;
      container.style.transformOrigin = 'center center';
    }
  }, [chartInstance, zoomLevel]);

  // 处理刷新
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    } else if (chartInstance) {
      chartInstance.clear();
      chartInstance.setOption(option, true);
    }
  }, [chartInstance, onRefresh, option]);

  // 工具栏
  const toolbar = useMemo(() => {
    if (!showToolbar) return null;

    return (
      <Space>
        {showRefresh && (
          <Tooltip title="刷新图表">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              size="small"
            />
          </Tooltip>
        )}
        
        <Tooltip title="放大">
          <Button
            type="text"
            icon={<ZoomInOutlined />}
            onClick={() => handleZoom('in')}
            disabled={zoomLevel >= 200}
            size="small"
          />
        </Tooltip>
        
        <Tooltip title="缩小">
          <Button
            type="text"
            icon={<ZoomOutOutlined />}
            onClick={() => handleZoom('out')}
            disabled={zoomLevel <= 50}
            size="small"
          />
        </Tooltip>
        
        <Tooltip title="重置缩放">
          <Button
            type="text"
            onClick={() => handleZoom('reset')}
            disabled={zoomLevel === 100}
            size="small"
          >
            {zoomLevel}%
          </Button>
        </Tooltip>

        {showExport && (
          <Dropdown overlay={exportMenu} trigger={['click']}>
            <Tooltip title="导出图表">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                size="small"
              />
            </Tooltip>
          </Dropdown>
        )}

        {showFullscreen && (
          <Tooltip title="全屏显示">
            <Button
              type="text"
              icon={<FullscreenOutlined />}
              onClick={handleFullscreen}
              size="small"
            />
          </Tooltip>
        )}

        {showSettings && (
          <Tooltip title="图表设置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              size="small"
            />
          </Tooltip>
        )}

        {customActions}
      </Space>
    );
  }, [
    showToolbar,
    showRefresh,
    showExport,
    showFullscreen,
    showSettings,
    zoomLevel,
    handleRefresh,
    handleZoom,
    handleFullscreen,
    exportMenu,
    customActions,
  ]);

  // 图表事件处理
  const chartEvents = useMemo(() => ({
    click: (params: any) => {
      console.log('Chart clicked:', params);
    },
    legendselectchanged: (params: any) => {
      console.log('Legend selection changed:', params);
    },
    datazoom: (params: any) => {
      console.log('Data zoom changed:', params);
    },
  }), []);

  return (
    <>
      <Card
        title={
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>
              {title}
            </Title>
            {description && (
              <Tooltip title={description}>
                <InfoCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            )}
          </Space>
        }
        extra={toolbar}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <EChartsWrapper
            option={option}
            style={{ height: `${height}px`, width: '100%' }}
            loading={loading}
            onChartReady={handleChartReady}
            onEvents={chartEvents}
          />
        </div>
        
        {children && (
          <div style={{ marginTop: 16 }}>
            {children}
          </div>
        )}
      </Card>

      {/* 全屏模态框 */}
      <Modal
        title={title}
        open={isFullscreen}
        onCancel={() => setIsFullscreen(false)}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        bodyStyle={{ height: '80vh', padding: '16px' }}
      >
        <EChartsWrapper
          option={option}
          style={{ height: '100%', width: '100%' }}
          loading={loading}
          onEvents={chartEvents}
        />
      </Modal>
    </>
  );
};

export default InteractiveChartWrapper;