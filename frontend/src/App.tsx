import { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Button, Menu, Avatar, Dropdown } from 'antd';
import { DashboardOutlined, WalletOutlined, BarChartOutlined, DatabaseOutlined, UserOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import { TransactionManagement, AssetManagement } from './pages';
import LoginModal from './components/common/LoginModal';
import { AuthService, User } from './services/authService';

const { Header, Content, Footer, Sider } = Layout;
const { Title, Paragraph } = Typography;

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 检查用户是否已登录
    const currentUser = AuthService.getCurrentUser();
    const authenticated = AuthService.isAuthenticated();
    
    setUser(currentUser);
    setIsAuthenticated(authenticated);
  }, []);

  const handleLogin = () => {
    setLoginModalVisible(true);
  };

  const handleLoginSuccess = () => {
    const currentUser = AuthService.getCurrentUser();
    const authenticated = AuthService.isAuthenticated();
    
    setUser(currentUser);
    setIsAuthenticated(authenticated);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板'
    },
    {
      key: 'home',
      icon: <DashboardOutlined />,
      label: '首页'
    },
    {
      key: 'transactions',
      icon: <WalletOutlined />,
      label: '交易记录'
    },
    {
      key: 'assets',
      icon: <DatabaseOutlined />,
      label: '资产管理'
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '绩效分析'
    }
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'transactions':
        return <TransactionManagement />;
      case 'assets':
        return <AssetManagement />;
      case 'analytics':
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Title level={2}>绩效分析</Title>
            <Paragraph>绩效分析功能开发中...</Paragraph>
          </div>
        );
      default:
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
                    cover={<DashboardOutlined style={{ fontSize: 48, color: '#1890ff', padding: 20 }} />}
                    onClick={() => setCurrentPage('home')}
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
                    onClick={() => setCurrentPage('transactions')}
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
                    onClick={() => setCurrentPage('analytics')}
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
                  onClick={() => setCurrentPage('transactions')}
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
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{ background: '#fff' }}
      >
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: '#1890ff',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'FA' : 'FinApp'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={({ key }) => setCurrentPage(key)}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={3} style={{ margin: 0 }}>
            {menuItems.find(item => item.key === currentPage)?.label || '首页'}
          </Title>
          
          <div>
            {isAuthenticated && user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                  <span>{user.username}</span>
                </div>
              </Dropdown>
            ) : (
              <Button type="primary" icon={<LoginOutlined />} onClick={handleLogin}>
                登录
              </Button>
            )}
          </div>
        </Header>
        
        <Content style={{ background: '#f0f2f5' }}>
          {renderContent()}
        </Content>
        
        <Footer style={{ textAlign: 'center', background: '#fff' }}>
          FinApp ©2025 Created by CodeBuddy
        </Footer>
      </Layout>
      
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSuccess={handleLoginSuccess}
      />
    </Layout>
  );
}

export default App;