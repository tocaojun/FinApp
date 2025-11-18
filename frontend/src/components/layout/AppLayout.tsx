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
  QuestionCircleOutlined,
  SafetyOutlined,
  TeamOutlined,
  KeyOutlined,
  FileTextOutlined,
  ControlOutlined,
  TagOutlined,
  ShopOutlined,
  DollarOutlined,
  SyncOutlined,
  BankOutlined
} from '@ant-design/icons';

import Breadcrumb from './Breadcrumb';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import ResponsiveLayout from './ResponsiveLayout';
import LoginModal from '../common/LoginModal';
import { AuthService } from '../../services/authService';
import { User } from '../../types/auth';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '../../types/auth';

const { Content } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme: currentTheme, themeConfig, toggleTheme, isDark } = useTheme();
  const { state, hasPermission } = useAuth();
  
  const [collapsed, setCollapsed] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 检查用户是否已登录
    const currentUser = AuthService.getCurrentUser();
    const authenticated = AuthService.isAuthenticated();
    
    setUser(currentUser || state.user);
    setIsAuthenticated(authenticated || state.isAuthenticated);
  }, [state.user, state.isAuthenticated]);

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
  const getMenuItems = () => {
    const baseItems = [
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
        key: '/deposits',
        icon: <BankOutlined />,
        label: '存款管理'
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
      }
    ];

    // 管理功能菜单项
    const adminItems: any[] = [];
    
    // 检查是否需要显示系统管理菜单
    const hasAnyAdminPermission = hasPermission(Permission.MANAGE_USERS) || 
        hasPermission(Permission.MANAGE_PERMISSIONS) || 
        hasPermission(Permission.VIEW_SYSTEM_LOGS) ||
        isAuthenticated; // 登录用户都可以访问标签管理等基础功能

    if (hasAnyAdminPermission) {
      adminItems.push({
        key: 'admin',
        icon: <SafetyOutlined />,
        label: '系统管理',
        type: 'group',
        children: []
      });

      const adminChildren: any[] = [];
      
      if (hasPermission(Permission.MANAGE_USERS)) {
        adminChildren.push({
          key: '/admin/users',
          icon: <TeamOutlined />,
          label: '用户管理'
        });
      }

      if (hasPermission(Permission.MANAGE_PERMISSIONS)) {
        adminChildren.push({
          key: '/admin/roles',
          icon: <KeyOutlined />,
          label: '角色管理'
        });
        adminChildren.push({
          key: '/admin/permissions',
          icon: <ControlOutlined />,
          label: '权限矩阵'
        });
      }

      if (hasPermission(Permission.VIEW_SYSTEM_LOGS)) {
        adminChildren.push({
          key: '/admin/logs',
          icon: <FileTextOutlined />,
          label: '系统日志'
        });
      }

      // 所有登录用户都可以访问的管理功能
      if (isAuthenticated) {
        // 添加标签管理
        adminChildren.push({
          key: '/admin/tags',
          icon: <TagOutlined />,
          label: '标签管理'
        });

        // 添加产品管理
        adminChildren.push({
          key: '/admin/products',
          icon: <ShopOutlined />,
          label: '产品管理'
        });

        // 添加汇率管理
        adminChildren.push({
          key: '/admin/exchange-rates',
          icon: <DollarOutlined />,
          label: '汇率管理'
        });

        // 添加数据同步
        adminChildren.push({
          key: '/admin/data-sync',
          icon: <SyncOutlined />,
          label: '数据同步'
        });

        // 添加价格管理中心
        adminChildren.push({
          key: '/admin/price-management',
          icon: <DatabaseOutlined />,
          label: '价格管理中心'
        });
      }

      adminItems[0].children = adminChildren;
    }

    // 设置菜单
    const settingsItems = [
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: '设置'
      }
    ];

    return [...baseItems, ...adminItems, ...settingsItems];
  };

  const menuItems = getMenuItems();

  // 获取当前页面标题
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    
    // 管理功能页面标题
    if (path.startsWith('/admin/users')) return '用户管理';
    if (path.startsWith('/admin/roles')) return '角色管理';
    if (path.startsWith('/admin/permissions')) return '权限矩阵';
    if (path.startsWith('/admin/logs')) return '系统日志';
    if (path.startsWith('/admin/tags')) return '标签管理';
    if (path.startsWith('/admin/products')) return '产品管理';
    if (path.startsWith('/admin/exchange-rates')) return '汇率管理';
    if (path.startsWith('/admin/price-management')) return '价格管理中心';
    if (path.startsWith('/deposits')) return '存款管理';
    if (path.startsWith('/auth/login')) return '用户登录';
    
    // 查找菜单项中的标题
    const findTitle = (items: any[]): string | null => {
      for (const item of items) {
        if (item.key === '/' && path === '/') return item.label;
        if (item.key !== '/' && path.startsWith(item.key)) return item.label;
        if (item.children) {
          const childTitle = findTitle(item.children);
          if (childTitle) return childTitle;
        }
      }
      return null;
    };
    
    return findTitle(menuItems) || '首页';
  };

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    
    if (path === '/') return ['/'];
    if (path.startsWith('/portfolios')) return ['/portfolios'];
    if (path.startsWith('/portfolio')) return ['/portfolios'];
    if (path.startsWith('/dashboard')) return ['/dashboard'];
    if (path.startsWith('/transactions')) return ['/transactions'];
    if (path.startsWith('/deposits')) return ['/deposits'];
    if (path.startsWith('/reports')) return ['/reports'];
    if (path.startsWith('/analytics')) return ['/analytics'];
    if (path.startsWith('/settings')) return ['/settings'];
    
    // 管理功能页面
    if (path.startsWith('/admin/users')) return ['/admin/users'];
    if (path.startsWith('/admin/roles')) return ['/admin/roles'];
    if (path.startsWith('/admin/permissions')) return ['/admin/permissions'];
    if (path.startsWith('/admin/logs')) return ['/admin/logs'];
    if (path.startsWith('/admin/tags')) return ['/admin/tags'];
    if (path.startsWith('/admin/products')) return ['/admin/products'];
    if (path.startsWith('/admin/exchange-rates')) return ['/admin/exchange-rates'];
    if (path.startsWith('/admin/price-management')) return ['/admin/price-management'];
    
    return ['/'];
  };

  // 获取展开的菜单项
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/')) return ['admin'];
    return [];
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
        defaultOpenKeys={getOpenKeys()}
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
          headerContent={
            <Title level={3} style={{ 
              margin: 0,
              color: themeConfig.colors.text,
            }}>
              {getCurrentPageTitle()}
            </Title>
          }
          headerActions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* 主题切换按钮 */}
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
              
              {/* 通知中心 */}
              <NotificationCenter />
              
              {/* 用户信息 */}
              {isAuthenticated && user ? (
                <Dropdown 
                  menu={{ 
                    items: userMenuItems,
                    onClick: ({ key }) => {
                      const item = userMenuItems.find(item => item.key === key);
                      if (item && item.onClick) {
                        item.onClick();
                      }
                    }
                  }} 
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
          }
        >
          <div style={{ background: themeConfig.colors.background }}>
            {/* 面包屑导航 */}
            <Breadcrumb />
            
            <div style={{ 
              background: themeConfig.colors.background,
              minHeight: 'calc(100vh - 120px)', // 调整高度计算
              padding: '16px 0',
            }}>
              {children}
            </div>
            
            <div style={{ 
              textAlign: 'center', 
              background: themeConfig.colors.surface,
              borderTop: `1px solid ${themeConfig.colors.border}`,
              color: themeConfig.colors.textSecondary,
              padding: '16px',
              marginTop: 'auto',
            }}>
              FinApp ©2025 Created by CodeBuddy
            </div>
          </div>
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