import React, { useState } from 'react';
import { Modal, Select, Button, Space, message, Radio, InputNumber, Checkbox } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';

interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  quality: number;
  width?: number;
  height?: number;
  backgroundColor: string;
  pixelRatio: number;
  excludeComponents?: string[];
}

interface ChartExporterProps {
  chartInstance: echarts.ECharts | null;
  visible: boolean;
  onClose: () => void;
  filename?: string;
}

const ChartExporter: React.FC<ChartExporterProps> = ({
  chartInstance,
  visible,
  onClose,
  filename = 'chart'
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 1,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    excludeComponents: []
  });
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!chartInstance) {
      message.error('图表实例不存在');
      return;
    }

    setLoading(true);
    try {
      const { format, quality, width, height, backgroundColor, pixelRatio } = exportOptions;

      if (format === 'svg') {
        // SVG导出
        const svgStr = chartInstance.renderToSVGString();
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        downloadBlob(blob, `${filename}.svg`);
      } else if (format === 'pdf') {
        // PDF导出需要额外的库支持
        message.warning('PDF导出功能需要额外配置，当前导出为PNG格式');
        exportAsImage('png');
      } else {
        // 图片导出
        exportAsImage(format);
      }

      message.success(`图表已导出为 ${format.toUpperCase()} 格式`);
      onClose();
    } catch (error) {
      message.error('导出失败');
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAsImage = (format: 'png' | 'jpg') => {
    if (!chartInstance) return;

    const canvas = chartInstance.getDom().querySelector('canvas');
    if (!canvas) return;

    const { quality, width, height, backgroundColor, pixelRatio } = exportOptions;

    // 创建新的canvas用于导出
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // 设置导出尺寸
    const exportWidth = width || canvas.width;
    const exportHeight = height || canvas.height;
    
    exportCanvas.width = exportWidth * pixelRatio;
    exportCanvas.height = exportHeight * pixelRatio;
    exportCanvas.style.width = `${exportWidth}px`;
    exportCanvas.style.height = `${exportHeight}px`;

    // 设置高DPI
    ctx.scale(pixelRatio, pixelRatio);

    // 设置背景色
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    // 绘制图表
    ctx.drawImage(canvas, 0, 0, exportWidth, exportHeight);

    // 导出
    exportCanvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${filename}.${format}`);
      }
    }, `image/${format}`, quality);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatOptions = [
    { label: 'PNG', value: 'png' },
    { label: 'JPG', value: 'jpg' },
    { label: 'SVG', value: 'svg' },
    { label: 'PDF', value: 'pdf', disabled: true }
  ];

  const backgroundOptions = [
    { label: '白色', value: '#ffffff' },
    { label: '透明', value: 'transparent' },
    { label: '黑色', value: '#000000' },
    { label: '自定义', value: 'custom' }
  ];

  return (
    <Modal
      title="导出图表"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button 
          key="export" 
          type="primary" 
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleExport}
        >
          导出
        </Button>
      ]}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 格式选择 */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            导出格式:
          </label>
          <Radio.Group
            value={exportOptions.format}
            onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
          >
            {formatOptions.map(option => (
              <Radio key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        </div>

        {/* 尺寸设置 */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            导出尺寸:
          </label>
          <Space>
            <span>宽度:</span>
            <InputNumber
              value={exportOptions.width}
              onChange={(value) => setExportOptions(prev => ({ ...prev, width: value || undefined }))}
              placeholder="默认"
              min={100}
              max={4000}
              style={{ width: 100 }}
            />
            <span>高度:</span>
            <InputNumber
              value={exportOptions.height}
              onChange={(value) => setExportOptions(prev => ({ ...prev, height: value || undefined }))}
              placeholder="默认"
              min={100}
              max={4000}
              style={{ width: 100 }}
            />
          </Space>
        </div>

        {/* 背景色设置 */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            背景色:
          </label>
          <Select
            value={exportOptions.backgroundColor}
            onChange={(value) => setExportOptions(prev => ({ ...prev, backgroundColor: value }))}
            style={{ width: 200 }}
          >
            {backgroundOptions.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* 质量设置 */}
        {(exportOptions.format === 'png' || exportOptions.format === 'jpg') && (
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              图片质量:
            </label>
            <Space>
              <InputNumber
                value={exportOptions.quality}
                onChange={(value) => setExportOptions(prev => ({ ...prev, quality: value || 1 }))}
                min={0.1}
                max={1}
                step={0.1}
                style={{ width: 100 }}
              />
              <span>(0.1 - 1.0)</span>
            </Space>
          </div>
        )}

        {/* 像素比设置 */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            像素比 (DPI):
          </label>
          <Radio.Group
            value={exportOptions.pixelRatio}
            onChange={(e) => setExportOptions(prev => ({ ...prev, pixelRatio: e.target.value }))}
          >
            <Radio value={1}>1x (标准)</Radio>
            <Radio value={2}>2x (高清)</Radio>
            <Radio value={3}>3x (超高清)</Radio>
          </Radio.Group>
        </div>

        {/* 文件名预览 */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            文件名预览:
          </label>
          <code>{filename}.{exportOptions.format}</code>
        </div>
      </Space>
    </Modal>
  );
};

export default ChartExporter;