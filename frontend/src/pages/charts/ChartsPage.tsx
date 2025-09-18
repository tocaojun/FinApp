import React from 'react';
import { Card, Typography, Space } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import ChartDashboard from '../../components/charts/ChartDashboard';

const { Title, Paragraph } = Typography;

const ChartsPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 24 }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <BarChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Title level={2} style={{ margin: 0 }}>
            图表和可视化分析
          </Title>
        </Space>
        
        <Paragraph>
          全面的投资组合可视化分析工具，提供多维度的图表展示和交互式数据分析功能。
          包括资产配置分析、收益趋势跟踪、流动性评估、IRR计算和风险指标监控等核心功能。
        </Paragraph>

        <Paragraph>
          <strong>主要功能：</strong>
          <ul>
            <li><strong>资产配置分析</strong> - 直观展示投资组合中各类资产的分布情况</li>
            <li><strong>收益趋势分析</strong> - 跟踪投资组合收益率的历史表现和趋势变化</li>
            <li><strong>流动性分布</strong> - 评估资产的流动性水平和变现能力</li>
            <li><strong>IRR分析</strong> - 计算内部收益率和现金流分析</li>
            <li><strong>风险指标</strong> - 全面的风险评估和监控体系</li>
            <li><strong>交互式图表</strong> - 支持缩放、导出、全屏等交互功能</li>
          </ul>
        </Paragraph>
      </Card>

      <ChartDashboard 
        showControls={true}
        defaultTab="overview"
      />
    </div>
  );
};

export default ChartsPage;