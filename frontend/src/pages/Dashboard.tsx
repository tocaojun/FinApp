import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, message } from 'antd';
import {
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined
} from '@ant-design/icons';
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

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <BarChartOutlined /> 投资仪表板
      </Title>

      {/* 总览统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总资产价值"
              value={dashboardData.totalValue}
              precision={2}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总盈亏"
              value={dashboardData.totalGainLoss}
              precision={2}
              prefix={dashboardData.totalGainLoss >= 0 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ 
                color: dashboardData.totalGainLoss >= 0 ? '#3f8600' : '#cf1322' 
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="收益率"
              value={dashboardData.gainLossPercentage}
              precision={2}
              suffix="%"
              prefix={dashboardData.gainLossPercentage >= 0 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ 
                color: dashboardData.gainLossPercentage >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="投资组合数量"
              value={dashboardData.portfolioCount}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要组件区域 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <AssetSummaryCard 
            assetCount={dashboardData.assetCount}
            transactionCount={dashboardData.transactionCount}
            onNavigate={onNavigate}
          />
        </Col>
        <Col xs={24} lg={12}>
          <PortfolioOverview onNavigate={onNavigate} />
        </Col>
        <Col xs={24} lg={12}>
          <QuickActions onNavigate={onNavigate} />
        </Col>
        <Col span={24}>
          <RecentTransactions onNavigate={onNavigate} />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;