import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Typography, Card, Row, Col, Button, App as AntdApp } from 'antd';
import { FolderOutlined, WalletOutlined, BarChartOutlined } from '@ant-design/icons';
import { 
  Dashboard, 
  TransactionManagement, 
  PortfolioDetail, 
  PortfolioList, 
  Login,
  ReportsPage,
  SettingsPage
} from './pages';
import { DepositManagement } from './pages/deposits';
import InsuranceManagement from './pages/InsuranceManagement';
import CashManagement from './pages/CashManagement';
import MultiCurrencyCashManagement from './pages/MultiCurrencyCashManagement';

import ChartsPage from './pages/charts/ChartsPage';
import LoginPage from './pages/auth/LoginPage';
import PermissionDemo from './pages/PermissionDemo';
import SimpleTest from './pages/SimpleTest';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement';
import PermissionMatrix from './pages/admin/PermissionMatrix';
import SystemLogs from './pages/admin/SystemLogs';
import ProductManagement from './pages/admin/ProductManagement';
import ExchangeRateManagement from './pages/admin/ExchangeRateManagement';
import TagManagement from './pages/admin/TagManagement';
import DataSync from './pages/admin/DataSync';
import PriceManagement from './pages/admin/PriceManagement';

import { AppLayout } from './components/layout';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const { Title, Paragraph } = Typography;

// 主布局包装组件
const AppLayoutWrapper: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppLayout>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/portfolios" element={<PortfolioList />} />
        <Route path="/portfolio/:id" element={<PortfolioDetail />} />
        <Route path="/transactions" element={<TransactionManagement />} />
        <Route path="/deposits" element={<DepositManagement />} />
        <Route path="/insurance" element={<InsuranceManagement />} />
        <Route path="/cash" element={<CashManagement />} />
        <Route path="/multi-currency-cash" element={<MultiCurrencyCashManagement />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/permission-demo" element={<PermissionDemo />} />
        <Route path="/test" element={<SimpleTest />} />
        <Route path="/analytics" element={<ChartsPage />} />
        
        {/* 管理功能路由 */}
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/roles" element={<RoleManagement />} />
        <Route path="/admin/permissions" element={<PermissionMatrix />} />
        <Route path="/admin/logs" element={<SystemLogs />} />
        <Route path="/admin/products" element={<ProductManagement />} />
        <Route path="/admin/exchange-rates" element={<ExchangeRateManagement />} />
        <Route path="/admin/tags" element={<TagManagement />} />
        <Route path="/admin/data-sync" element={<DataSync />} />
        <Route path="/admin/price-management" element={<PriceManagement />} />
      </Routes>
    </AppLayout>
    </ErrorBoundary>
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



// 主应用组件 - 使用Antd的App组件包装以支持静态方法
function App() {
  return (
    <AntdApp>
      <AuthProvider>
        <Router>
          <AppLayoutWrapper />
        </Router>
      </AuthProvider>
    </AntdApp>
  );
}

export default App;