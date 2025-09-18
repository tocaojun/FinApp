import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Typography, Card, Row, Col, Button } from 'antd';
import { FolderOutlined, WalletOutlined, BarChartOutlined } from '@ant-design/icons';
import { 
  Dashboard, 
  TransactionManagement, 
  AssetManagement, 
  PortfolioDetail, 
  PortfolioList, 
  Login,
  ReportsPage,
  SettingsPage
} from './pages';
import { AppLayout } from './components/layout';

const { Title, Paragraph } = Typography;

// 主布局包装组件
const AppLayoutWrapper: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard onNavigate={(page) => navigate(`/${page}`)} />} />
        <Route path="/portfolios" element={<PortfolioList />} />
        <Route path="/portfolio/:id" element={<PortfolioDetail />} />
        <Route path="/transactions" element={<TransactionManagement />} />
        <Route path="/assets" element={<AssetManagement />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </AppLayout>
  );
};

// 首页组件
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{ padding: '50px' }}>
      <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>
        <Title level={1} style={{ textAlign: 'center', marginBottom: 40 }}>
          欢迎使用 FinApp
        </Title>
        
        <Paragraph style={{ textAlign: 'center', fontSize: '16px', marginBottom: 40 }}>
          专业的个人资产管理平台，帮助您更好地管理投资组合和财务数据
        </Paragraph>

        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable
              style={{ textAlign: 'center' }}
              cover={<FolderOutlined style={{ fontSize: 48, color: '#1890ff', padding: 20 }} />}
              onClick={() => navigate('/dashboard')}
            >
              <Card.Meta 
                title="投资组合管理" 
                description="管理多个投资组合，跟踪资产配置和收益表现"
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable
              style={{ textAlign: 'center' }}
              cover={<WalletOutlined style={{ fontSize: 48, color: '#52c41a', padding: 20 }} />}
              onClick={() => navigate('/transactions')}
            >
              <Card.Meta 
                title="交易记录" 
                description="记录和管理所有交易活动，支持多种资产类型"
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable
              style={{ textAlign: 'center' }}
              cover={<BarChartOutlined style={{ fontSize: 48, color: '#fa8c16', padding: 20 }} />}
              onClick={() => navigate('/analytics')}
            >
              <Card.Meta 
                title="绩效分析" 
                description="深度分析投资绩效，包括IRR计算和风险评估"
              />
            </Card>
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Button 
            type="primary" 
            size="large" 
            style={{ marginRight: 16 }}
            onClick={() => navigate('/dashboard')}
          >
            开始使用
          </Button>
          <Button size="large">
            了解更多
          </Button>
        </div>
      </div>
    </div>
  );
};

// 绩效分析页面
const AnalyticsPage: React.FC = () => {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <Title level={2}>绩效分析</Title>
      <Paragraph>绩效分析功能开发中...</Paragraph>
    </div>
  );
};

// 主应用组件
function App() {
  return (
    <Router>
      <AppLayoutWrapper />
    </Router>
  );
}

export default App;