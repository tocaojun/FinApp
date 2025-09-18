import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { useLocation, Link } from 'react-router-dom';
import { HomeOutlined, DashboardOutlined, FolderOutlined, WalletOutlined, DatabaseOutlined, BarChartOutlined } from '@ant-design/icons';

interface BreadcrumbItem {
  path: string;
  title: string;
  icon?: React.ReactNode;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();

  // 路径映射配置
  const pathMap: Record<string, BreadcrumbItem> = {
    '/': { path: '/', title: '首页', icon: <HomeOutlined /> },
    '/dashboard': { path: '/dashboard', title: '仪表板', icon: <DashboardOutlined /> },
    '/portfolio': { path: '/portfolio', title: '投资组合', icon: <FolderOutlined /> },
    '/transactions': { path: '/transactions', title: '交易记录', icon: <WalletOutlined /> },
    '/assets': { path: '/assets', title: '资产管理', icon: <DatabaseOutlined /> },
    '/analytics': { path: '/analytics', title: '绩效分析', icon: <BarChartOutlined /> },
  };

  // 生成面包屑项目
  const generateBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: any[] = [];

    // 添加首页
    if (location.pathname !== '/') {
      items.push({
        title: (
          <Link to="/">
            <HomeOutlined style={{ marginRight: 4 }} />
            首页
          </Link>
        ),
      });
    }

    // 构建路径
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // 特殊处理投资组合详情页
      if (currentPath.startsWith('/portfolio/') && pathSegments.length > 1) {
        if (index === 0) {
          // 投资组合列表页
          items.push({
            title: (
              <Link to="/portfolio">
                <FolderOutlined style={{ marginRight: 4 }} />
                投资组合
              </Link>
            ),
          });
        } else {
          // 投资组合详情页
          items.push({
            title: `投资组合详情`,
          });
        }
        return;
      }

      const breadcrumbItem = pathMap[currentPath];
      if (breadcrumbItem) {
        const isLast = index === pathSegments.length - 1;
        
        if (isLast) {
          // 最后一项不需要链接
          items.push({
            title: (
              <span>
                {breadcrumbItem.icon && <span style={{ marginRight: 4 }}>{breadcrumbItem.icon}</span>}
                {breadcrumbItem.title}
              </span>
            ),
          });
        } else {
          // 中间项需要链接
          items.push({
            title: (
              <Link to={breadcrumbItem.path}>
                {breadcrumbItem.icon && <span style={{ marginRight: 4 }}>{breadcrumbItem.icon}</span>}
                {breadcrumbItem.title}
              </Link>
            ),
          });
        }
      }
    });

    return items;
  };

  const breadcrumbItems = generateBreadcrumbItems();

  // 如果只有一个项目且是首页，不显示面包屑
  if (breadcrumbItems.length <= 1 && location.pathname === '/') {
    return null;
  }

  return (
    <AntBreadcrumb
      style={{ 
        margin: '16px 0',
        padding: '0 24px'
      }}
      items={breadcrumbItems}
    />
  );
};

export default Breadcrumb;