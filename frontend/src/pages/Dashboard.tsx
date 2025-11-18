import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Statistic, Typography, Spin, message, Grid, List, Button, Space, Tag } from 'antd';
import {
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  BankOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import AssetSummaryCard from '../components/dashboard/AssetSummaryCard';
import PortfolioOverview from '../components/dashboard/PortfolioOverview';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import QuickActions from '../components/dashboard/QuickActions';
import { PortfolioService } from '../services/portfolioService';
import { TransactionService } from '../services/transactionService';
import { HoldingService } from '../services/holdingService';
import { depositService, DepositStatistics, UpcomingMaturityDeposit } from '../services/depositService';

const { Title } = Typography;
const { useBreakpoint } = Grid;

interface DashboardData {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  historicalReturn: number;
  historicalReturnPercent: number;
  portfolioCount: number;
  assetCount: number;
  transactionCount: number;
}

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    gainLossPercentage: 0,
    historicalReturn: 0,
    historicalReturnPercent: 0,
    portfolioCount: 0,
    assetCount: 0,
    transactionCount: 0
  });
  const [depositStats, setDepositStats] = useState<DepositStatistics | null>(null);
  const [upcomingDeposits, setUpcomingDeposits] = useState<UpcomingMaturityDeposit[]>([]);

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
      
      // 检查用户是否已登录
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // 未登录时显示空数据
        setDashboardData({
          totalValue: 0,
          totalCost: 0,
          totalGainLoss: 0,
          gainLossPercentage: 0,
          historicalReturn: 0,
          historicalReturnPercent: 0,
          portfolioCount: 0,
          assetCount: 0,
          transactionCount: 0
        });
        return;
      }

      // 并行获取所有数据
      const [portfolioSummary, portfolios, holdingAssetCount, transactionSummary, depositStatistics, upcomingMaturity] = await Promise.all([
        PortfolioService.getPortfolioSummary().catch((error) => {
          console.warn('获取投资组合汇总失败:', error);
          return null;
        }),
        PortfolioService.getPortfolios().catch((error) => {
          console.warn('获取投资组合列表失败:', error);
          return [];
        }),
        HoldingService.getUserTotalHoldingAssets().catch((error) => {
          console.warn('获取持仓资产数量失败:', error);
          return 0;
        }),
        TransactionService.getTransactionSummary().catch((error) => {
          console.warn('获取交易统计失败:', error);
          return null;
        }),
        depositService.getStatistics().catch((error) => {
          console.warn('获取存款统计失败:', error);
          return null;
        }),
        depositService.getUpcomingMaturityDeposits(30).catch((error) => {
          console.warn('获取即将到期存款失败:', error);
          return [];
        })
      ]);

      // 计算汇总数据
      let totalValue = 0;
      let totalCost = 0;
      let totalGainLoss = 0;
      let gainLossPercentage = 0;
      let historicalReturn = 0;
      let historicalReturnPercent = 0;
      let transactionCount = 0;

      if (portfolioSummary) {
        totalValue = portfolioSummary.totalValue || 0;
        totalGainLoss = portfolioSummary.totalReturn || 0;
        gainLossPercentage = portfolioSummary.totalReturnPercent || 0;
        historicalReturn = totalGainLoss; // 历史收益就是总盈亏
        historicalReturnPercent = gainLossPercentage; // 历史收益率就是总收益率
        totalCost = totalValue - totalGainLoss;
      } else if (portfolios.length > 0) {
        // 如果没有汇总数据，从投资组合列表计算
        totalValue = portfolios.reduce((sum, portfolio) => sum + (portfolio.totalValue || 0), 0);
        totalCost = portfolios.reduce((sum, portfolio) => sum + (portfolio.totalCost || 0), 0);
        totalGainLoss = totalValue - totalCost;
        gainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
        historicalReturn = totalGainLoss; // 历史收益就是总盈亏
        historicalReturnPercent = gainLossPercentage; // 历史收益率就是总收益率
      }

      if (transactionSummary) {
        transactionCount = transactionSummary.totalTransactions || 0;
        console.log('[Dashboard] transactionSummary:', transactionSummary);
        console.log('[Dashboard] transactionCount:', transactionCount);
      } else {
        console.warn('[Dashboard] transactionSummary is null or undefined');
      }

      // 设置存款数据
      if (depositStatistics) {
        setDepositStats(depositStatistics);
      }
      if (upcomingMaturity) {
        setUpcomingDeposits(upcomingMaturity.slice(0, 5)); // 只显示前5条
      }

      // 使用真实数据，即使为0也显示真实值
      setDashboardData({
        totalValue,
        totalCost,
        totalGainLoss,
        gainLossPercentage,
        historicalReturn,
        historicalReturnPercent,
        portfolioCount: portfolios.length,
        assetCount: holdingAssetCount,
        transactionCount
      });

    } catch (error) {
      console.error('加载仪表板数据失败:', error);
      message.error('加载数据失败，请稍后重试');
      
      // 出错时显示空数据
      setDashboardData({
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        gainLossPercentage: 0,
        historicalReturn: 0,
        historicalReturnPercent: 0,
        portfolioCount: 0,
        assetCount: 0,
        transactionCount: 0
      });
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
            title="历史收益"
            value={dashboardData.historicalReturn}
            precision={2}
            prefix={dashboardData.historicalReturn >= 0 ? <RiseOutlined /> : <FallOutlined />}
            valueStyle={{ 
              color: dashboardData.historicalReturn >= 0 ? '#3f8600' : '#cf1322',
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
            title="投资组合总收益"
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
            title="投资组合数量"
            value={dashboardData.portfolioCount}
            prefix={<TrophyOutlined />}
            valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
          />
        </Card>

        {/* 新增：存款摘要卡片 */}
        <Card 
          size={isMobile ? 'small' : 'default'}
          bodyStyle={{ padding: isMobile ? '16px 12px' : '24px' }}
          hoverable
          onClick={() => handleNavigate('deposits')}
          style={{ cursor: 'pointer' }}
        >
          <Statistic
            title="存款总额"
            value={depositStats?.totalBalance || 0}
            precision={2}
            prefix={<BankOutlined />}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{ fontSize: isMobile ? '20px' : '24px', color: '#1890ff' }}
          />
          {depositStats && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              平均利率: {depositStats.averageInterestRate.toFixed(2)}% | 即将到期: {depositStats.maturingSoon}笔
            </div>
          )}
        </Card>
      </div>

      {/* 主要组件区域 */}
      <div style={{ 
        display: 'grid',
        gap: isMobile ? '12px' : '16px',
        gridTemplateColumns: '1fr'
      }}>
        {/* 新增：即将到期的存款提醒 */}
        {upcomingDeposits.length > 0 && (
          <Card 
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#faad14' }} />
                <span>即将到期提醒</span>
                <Tag color="warning">{upcomingDeposits.length}笔</Tag>
              </Space>
            }
            extra={
              <Button 
                type="link" 
                onClick={() => handleNavigate('deposits')}
              >
                查看全部
              </Button>
            }
            size={isMobile ? 'small' : 'default'}
          >
            <List
              dataSource={upcomingDeposits}
              renderItem={deposit => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary"
                      size="small"
                      onClick={() => handleNavigate(`deposits?highlight=${deposit.positionId}`)}
                    >
                      处理
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<BankOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={
                      <Space>
                        <span>{deposit.bankName} - {deposit.productName}</span>
                        <Tag color={deposit.daysToMaturity <= 7 ? 'error' : 'warning'}>
                          {deposit.daysToMaturity}天后到期
                        </Tag>
                        {deposit.autoRenewal && <Tag color="blue">自动续存</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <span>本金: {formatCurrency(deposit.principalAmount)}</span>
                        <span>预计利息: {formatCurrency(deposit.estimatedInterest)}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

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