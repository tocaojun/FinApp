import React, { useState, useEffect } from 'react';
import { Layout, Drawer, Button, Grid } from 'antd';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  siderContent: React.ReactNode;
  headerContent?: React.ReactNode;
  headerActions?: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  siderContent,
  headerContent,
  headerActions
}) => {
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const screens = useBreakpoint();
  const location = useLocation();
  const isMobile = !screens.md;

  // 路由变化时关闭移动端菜单
  useEffect(() => {
    setMobileMenuVisible(false);
  }, [location.pathname]);

  // 移动端菜单切换
  const toggleMobileMenu = () => {
    setMobileMenuVisible(!mobileMenuVisible);
  };

  // 移动端布局
  if (isMobile) {
    return (
      <Layout className="responsive-layout mobile-layout">
        <Header className="mobile-header">
          <div className="mobile-header-left">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleMobileMenu}
              className="mobile-menu-trigger"
              size="large"
            />
            {headerContent && (
              <div className="mobile-header-content">
                {headerContent}
              </div>
            )}
          </div>
          {headerActions && (
            <div className="mobile-header-actions">
              {headerActions}
            </div>
          )}
        </Header>

        <Drawer
          title="导航菜单"
          placement="left"
          onClose={() => setMobileMenuVisible(false)}
          open={mobileMenuVisible}
          styles={{ 
            body: { padding: 0 },
            header: { padding: '16px 24px' }
          }}
          closeIcon={<CloseOutlined />}
          width={280}
        >
          {siderContent}
        </Drawer>

        <Content className="mobile-content">
          {children}
        </Content>
      </Layout>
    );
  }

  // 桌面端布局
  return (
    <Layout className="responsive-layout desktop-layout">
      <Sider
        width={256}
        className="desktop-sider"
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {siderContent}
      </Sider>

      <Layout style={{ marginLeft: 256 }}>
        {(headerContent || headerActions) && (
          <Header className="desktop-header">
            <div className="desktop-header-content">
              {headerContent}
            </div>
            {headerActions && (
              <div className="desktop-header-actions">
                {headerActions}
              </div>
            )}
          </Header>
        )}

        <Content className="desktop-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ResponsiveLayout;