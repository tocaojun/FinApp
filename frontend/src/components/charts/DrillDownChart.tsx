import React, { useState, useCallback } from 'react';
import { Card, Breadcrumb, Button, Space, Spin, message } from 'antd';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import InteractiveChart from './InteractiveChart';

interface DrillDownLevel {
  name: string;
  data: any[];
  level: number;
}

interface DrillDownChartProps {
  initialData: any[];
  chartType: 'line' | 'bar' | 'pie' | 'scatter';
  title?: string;
  height?: number;
  theme?: 'light' | 'dark';
  onDataFetch: (parentData: any, level: number) => Promise<any[]>;
  levelNames?: string[];
  maxLevel?: number;
}

const DrillDownChart: React.FC<DrillDownChartProps> = ({
  initialData,
  chartType,
  title,
  height = 400,
  theme = 'light',
  onDataFetch,
  levelNames = ['总览', '分类', '详情', '明细'],
  maxLevel = 3
}) => {
  const [drillStack, setDrillStack] = useState<DrillDownLevel[]>([
    { name: levelNames[0], data: initialData, level: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  const currentLevel = drillStack[drillStack.length - 1];

  // 处理数据钻取
  const handleDrillDown = useCallback(async (data: any, level: number) => {
    if (level > maxLevel) {
      message.warning('已达到最大钻取层级');
      return [];
    }

    setLoading(true);
    try {
      const newData = await onDataFetch(data, level);
      const levelName = levelNames[level] || `Level ${level}`;
      
      setDrillStack(prev => [
        ...prev,
        { name: levelName, data: newData, level }
      ]);

      return newData;
    } catch (error) {
      message.error('数据加载失败');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onDataFetch, maxLevel, levelNames]);

  // 返回到指定层级
  const handleDrillUp = (targetLevel: number) => {
    if (targetLevel < 0 || targetLevel >= drillStack.length) return;
    
    setDrillStack(prev => prev.slice(0, targetLevel + 1));
  };

  // 返回到根层级
  const handleDrillToRoot = () => {
    setDrillStack(prev => prev.slice(0, 1));
  };

  // 返回上一层级
  const handleDrillBack = () => {
    if (drillStack.length > 1) {
      setDrillStack(prev => prev.slice(0, -1));
    }
  };

  return (
    <Card
      title={
        <Space>
          {title}
          {drillStack.length > 1 && (
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleDrillBack}
              size="small"
            >
              返回
            </Button>
          )}
          {drillStack.length > 2 && (
            <Button 
              icon={<HomeOutlined />} 
              onClick={handleDrillToRoot}
              size="small"
            >
              回到首页
            </Button>
          )}
        </Space>
      }
      extra={
        <Breadcrumb>
          {drillStack.map((level, index) => (
            <Breadcrumb.Item 
              key={index}
              onClick={() => handleDrillUp(index)}
              style={{ 
                cursor: index < drillStack.length - 1 ? 'pointer' : 'default',
                color: index < drillStack.length - 1 ? '#1890ff' : undefined
              }}
            >
              {level.name}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      }
    >
      <Spin spinning={loading}>
        <InteractiveChart
          data={currentLevel.data}
          chartType={chartType}
          height={height}
          theme={theme}
          enableDrillDown={currentLevel.level < maxLevel}
          onDataDrillDown={handleDrillDown}
          enableZoom={true}
          enableExport={true}
          enableFullscreen={true}
        />
      </Spin>
    </Card>
  );
};

export default DrillDownChart;