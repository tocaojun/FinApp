import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Typography, Menu, Avatar, Dropdown, Button, ConfigProvider, theme } from 'antd';
import { 
  DashboardOutlined, 
  WalletOutlined, 
  BarChartOutlined, 
  DatabaseOutlined, 
  UserOutlined, 
  LoginOutlined, 
  LogoutOutlined, 
  FolderOutlined,
  SettingOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';

import Breadcrumb from './Breadcrumb';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import ResponsiveLayout from './ResponsiveLayout';
import LoginModal from '../common/LoginModal';
import { AuthService, User } from '../../services/authService';
import { useTheme } from '../../hooks/useTheme';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme: currentTheme, themeConfig, toggleTheme, isDark } = useTheme();
  
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
    navigate('/');
  };

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: '帮助中心',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  // 导航菜单项
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '首页'
    },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板'
    },
    {
      key: '/portfolios',
      icon: <FolderOutlined />,
      label: '投资组合'
    },
    {
      key: '/transactions',
      icon: <WalletOutlined />,
      label: '交易记录'
    },
    {
      key: '/assets',
      icon: <DatabaseOutlined />,
      label: '资产管理'
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '报表中心'
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '图表分析'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置'
    }
  ];

  // 获取当前页面标题
  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => {
      if (item.key === '/') return location.pathname === '/';
      return location.pathname.startsWith(item.key);
    });
    return currentItem?.label || '首页';
  };

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    if (location.pathname === '/') return ['/'];
    if (location.pathname.startsWith('/portfolios')) return ['/portfolios'];
    if (location.pathname.startsWith('/portfolio')) return ['/portfolios'];
    if (location.pathname.startsWith('/dashboard')) return ['/dashboard'];
    if (location.pathname.startsWith('/transactions')) return ['/transactions'];
    if (location.pathname.startsWith('/assets')) return ['/assets'];
    if (location.pathname.startsWith('/reports')) return ['/reports'];
    if (location.pathname.startsWith('/analytics')) return ['/analytics'];
    if (location.pathname.startsWith('/settings')) return ['/settings'];
    return ['/'];
  };

  // 侧边栏内容
  const siderContent = (
    <>
      <div style={{ 
        height: 64, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `1px solid ${themeConfig.colors.border}`,
        background: themeConfig.colors.surface,
      }}>
        <div style={{ 
          background: themeConfig.colors.primary,
          borderRadius: 6,
          padding: '8px 16px',
          color: 'white',
          fontWeight: 'bold',
          fontSize: collapsed ? 14 : 16,
        }}>
          {collapsed ? 'FA' : 'FinApp'}
        </div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{
          background: themeConfig.colors.surface,
          border: 'none',
          height: 'calc(100vh - 64px)',
        }}
        theme={isDark ? 'dark' : 'light'}
      />
    </>
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: themeConfig.colors.primary,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: themeConfig.colors.background }}>
        <ResponsiveLayout
          siderContent={siderContent}
          collapsed={collapsed}
          onCollapse={setCollapsed}
        >
          <Layout style={{ background: themeConfig.colors.background }}>
            <Header style={{ 
              background: themeConfig.colors.surface, 
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${themeConfig.colors.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              <Title level={3} style={{ 
                margin: 0,
                color: themeConfig.colors.text,
              }}>
                {getCurrentPageTitle()}
              </Title>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* 主题切换按钮 */}
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                
                {/* 通知中心 */}
                <NotificationCenter />
                
                {/* 用户信息 */}
                {isAuthenticated && user ? (
                  <Dropdown 
                    menu={{ items: userMenuItems }} 
                    placement="bottomRight"
                    trigger={['click']}
                  >
                    <div style={{ 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '4px 8px',
                      borderRadius: 6,
                      transition: 'background-color 0.3s',
                    }}>
                      <Avatar 
                        icon={<UserOutlined />} 
                        style={{ marginRight: 8 }}
                        size="small"
                      />
                      <span style={{ color: themeConfig.colors.text }}>
                        {user.username}
                      </span>
                    </div>
                  </Dropdown>
                ) : (
                  <Button 
                    type="primary" 
                    icon={<LoginOutlined />} 
                    onClick={handleLogin}
                  >
                    登录
                  </Button>
                )}
              </div>
            </Header>
            
            {/* 面包屑导航 */}
            <Breadcrumb />
            
            <Content style={{ 
              background: themeConfig.colors.background,
              minHeight: 'calc(100vh - 64px - 70px - 48px)', // 减去 header、footer 和 breadcrumb 高度
            }}>
              {children}
            </Content>
            
            <Footer style={{ 
              textAlign: 'center', 
              background: themeConfig.colors.surface,
              borderTop: `1px solid ${themeConfig.colors.border}`,
              color: themeConfig.colors.textSecondary,
            }}>
              FinApp ©2025 Created by CodeBuddy
            </Footer>
          </Layout>
        </ResponsiveLayout>
        
        <LoginModal
          visible={loginModalVisible}
          onClose={() => setLoginModalVisible(false)}
          onSuccess={handleLoginSuccess}
        />
      </Layout>
    </ConfigProvider>
  );
};

export default AppLayout;