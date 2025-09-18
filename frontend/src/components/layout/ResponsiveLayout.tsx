import React, { useState, useEffect } from 'react';
import { Layout, Drawer, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const { Sider } = Layout;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  siderContent: React.ReactNode;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  siderContent,
  collapsed,
  onCollapse,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // 在移动端自动收起侧边栏
      if (mobile && !collapsed) {
        onCollapse(true);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [collapsed, onCollapse]);

  // 移动端使用抽屉，桌面端使用侧边栏
  if (isMobile) {
    return (
      <>
        {/* 移动端菜单按钮 */}
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileDrawerVisible(true)}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1001,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #d9d9d9',
          }}
        />
        
        {/* 移动端抽屉菜单 */}
        <Drawer
          title="导航菜单"
          placement="left"
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          bodyStyle={{ padding: 0 }}
          width={280}
        >
          {siderContent}
        </Drawer>
        
        {/* 主内容区域 */}
        <div style={{ marginLeft: 0 }}>
          {children}
        </div>
      </>
    );
  }

  // 桌面端使用标准侧边栏
  return (
    <>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapse}
        style={{ 
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
        breakpoint="lg"
        collapsedWidth={80}
      >
        {siderContent}
      </Sider>
      {children}
    </>
  );
};

export default ResponsiveLayout;