import React from 'react';
import { Card, Row, Col, Button } from 'antd';
import { 
  PlusOutlined,
  SwapOutlined,
  DollarOutlined,
  BarChartOutlined,
  ImportOutlined,
  ExportOutlined,
  SettingOutlined,
  FileTextOutlined
} from '@ant-design/icons';
interface QuickActionsProps {
  onNavigate?: (page: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const actions = [
    {
      title: '添加交易',
      description: '记录买入、卖出等交易',
      icon: <PlusOutlined />,
      color: '#1890ff',
      onClick: () => onNavigate?.('transactions')
    },
    {
      title: '创建投资组合',
      description: '新建投资组合管理',
      icon: <DollarOutlined />,
      color: '#52c41a',
      onClick: () => onNavigate?.('dashboard')
    },
    {
      title: '添加资产',
      description: '添加新的投资资产',
      icon: <SwapOutlined />,
      color: '#722ed1',
      onClick: () => onNavigate?.('assets')
    },
    {
      title: '查看报表',
      description: '投资绩效分析报表',
      icon: <BarChartOutlined />,
      color: '#fa8c16',
      onClick: () => onNavigate?.('analytics')
    },
    {
      title: '批量导入',
      description: '导入交易记录数据',
      icon: <ImportOutlined />,
      color: '#13c2c2',
      onClick: () => onNavigate?.('transactions')
    },
    {
      title: '数据导出',
      description: '导出投资数据',
      icon: <ExportOutlined />,
      color: '#eb2f96',
      onClick: () => onNavigate?.('dashboard')
    },
    {
      title: '系统设置',
      description: '个人偏好和配置',
      icon: <SettingOutlined />,
      color: '#666',
      onClick: () => onNavigate?.('dashboard')
    },
    {
      title: '帮助文档',
      description: '使用指南和FAQ',
      icon: <FileTextOutlined />,
      color: '#f5222d',
      onClick: () => onNavigate?.('dashboard')
    }
  ];

  return (
    <Card title="快速操作" style={{ marginBottom: '16px' }}>
      <Row gutter={[16, 16]}>
        {actions.map((action, index) => (
          <Col xs={12} sm={8} md={6} lg={3} key={index}>
            <Button
              type="text"
              style={{
                height: 'auto',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.boxShadow = `0 2px 8px ${action.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={action.onClick}
            >
              <div 
                style={{ 
                  fontSize: '24px', 
                  color: action.color,
                  marginBottom: '8px'
                }}
              >
                {action.icon}
              </div>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '14px',
                marginBottom: '4px',
                textAlign: 'center'
              }}>
                {action.title}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#666',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                {action.description}
              </div>
            </Button>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default QuickActions;