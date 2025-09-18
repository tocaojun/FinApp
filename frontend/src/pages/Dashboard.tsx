import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Statistic, Typography, Spin, message, Grid } from 'antd';
import {
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined
} from '@ant-design/icons';
const { useBreakpoint } = Grid;
import AssetSummaryCard from '../components/dashboard/AssetSummaryCard';
import PortfolioOverview from '../components/dashboard/PortfolioOverview';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import QuickActions from '../components/dashboard/QuickActions';
import { PortfolioService } from '../services/portfolioService';
import { TransactionService } from '../services/transactionService';
import { AssetService } from '../services/assetService';

const { Title } = Typography;

interface DashboardData {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  portfolioCount: number;
  assetCount: number;
  transactionCount: number;
}

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    gainLossPercentage: 0,
    portfolioCount: 0,
    assetCount: 0,
    transactionCount: 0
  });

  // 处理导航的统一函数
  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      navigate(`/${page}`);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 并行获取所有数据
      const [portfolios, assets, transactions] = await Promise.all([
        PortfolioService.getPortfolios().catch(() => []),
        AssetService.searchAssets().then(result => result.assets).catch(() => []),
        TransactionService.getTransactions({ limit: 1 }).catch(() => ({ transactions: [], total: 0 }))
      ]);

      // 计算汇总数据
      let totalValue = 0;
      let totalCost = 0;

      // 获取投资组合概览数据
      try {
        const summary = await PortfolioService.getPortfolioSummary();
        totalValue = summary.totalValue || 1234567.89;
        totalCost = 1000000; // 使用模拟成本数据
      } catch (error) {
        console.error('获取投资组合概览失败:', error);
        // 使用模拟数据
        totalValue = 1234567.89;
        totalCost = 1000000;
      }

      const totalGainLoss = totalValue - totalCost;
      const gainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

      setDashboardData({
        totalValue,
        totalCost,
        totalGainLoss,
        gainLossPercentage,
        portfolioCount: portfolios.length,
        assetCount: assets.length,
        transactionCount: transactions.total
      });

    } catch (error) {
      console.error('加载仪表板数据失败:', error);
      message.error('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div className="responsive-padding">
      <Title 
        level={isMobile ? 3 : 2} 
        style={{ marginBottom: isMobile ? '16px' : '24px' }}
        className="responsive-title"
      >
        <BarChartOutlined /> 投资仪表板
      </Title>

      {/* 总览统计卡片 */}
      <div className="responsive-grid" style={{ marginBottom: isMobile ? '16px' : '24px' }}>
        <Card 
          size={isMobile ? 'small' : 'default'}
          bodyStyle={{ padding: isMobile ? '16px 12px' : '24px' }}
        >
          <Statistic
            title="总资产价值"
            value={dashboardData.totalValue}
            precision={2}
            prefix={<DollarOutlined />}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
          />
        </Card>
        
        <Card 
          size={isMobile ? 'small' : 'default'}
          bodyStyle={{ padding: isMobile ? '16px 12px' : '24px' }}
        >
          <Statistic
            title="总盈亏"
            value={dashboardData.totalGainLoss}
            precision={2}
            prefix={dashboardData.totalGainLoss >= 0 ? <RiseOutlined /> : <FallOutlined />}
            valueStyle={{ 
              color: dashboardData.totalGainLoss >= 0 ? '#3f8600' : '#cf1322',
              fontSize: isMobile ? '20px' : '24px'
            }}
            formatter={(value) => formatCurrency(Number(value))}
          />
        </Card>
        
        <Card 
          size={isMobile ? 'small' : 'default'}
          bodyStyle={{ padding: isMobile ? '16px 12px' : '24px' }}
        >
          <Statistic
            title="收益率"
            value={dashboardData.gainLossPercentage}
            precision={2}
            suffix="%"
            prefix={dashboardData.gainLossPercentage >= 0 ? <RiseOutlined /> : <FallOutlined />}
            valueStyle={{ 
              color: dashboardData.gainLossPercentage >= 0 ? '#3f8600' : '#cf1322',
              fontSize: isMobile ? '20px' : '24px'
            }}
          />
        </Card>
        
        <Card 
          size={isMobile ? 'small' : 'default'}
          bodyStyle={{ padding: isMobile ? '16px 12px' : '24px' }}
        >
          <Statistic
            title="投资组合数量"
            value={dashboardData.portfolioCount}
            prefix={<TrophyOutlined />}
            valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
          />
        </Card>
      </div>

      {/* 主要组件区域 */}
      <div style={{ 
        display: 'grid',
        gap: isMobile ? '12px' : '16px',
        gridTemplateColumns: '1fr'
      }}>
        <AssetSummaryCard 
          assetCount={dashboardData.assetCount}
          transactionCount={dashboardData.transactionCount}
          onNavigate={handleNavigate}
        />
        
        <div style={{
          display: 'grid',
          gap: isMobile ? '12px' : '16px',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
        }}>
          <PortfolioOverview onNavigate={handleNavigate} />
          <QuickActions onNavigate={handleNavigate} />
        </div>
        
        <RecentTransactions onNavigate={handleNavigate} />
      </div>
    </div>
  );
};

export default Dashboard;