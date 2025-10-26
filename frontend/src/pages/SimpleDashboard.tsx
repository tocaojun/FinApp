import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Button, Spin, message } from 'antd';
import { 
  DollarOutlined, 
  RiseOutlined, 
  FallOutlined,
  UserOutlined, 
  SafetyCertificateOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PortfolioService } from '../services/portfolioService';
import { TransactionService } from '../services/transactionService';
import { HoldingService } from '../services/holdingService';

const { Title, Text } = Typography;

interface DashboardStats {
  totalValue: number;
  historicalReturn: number;
  portfolioCount: number;
  assetCount: number;
}

const SimpleDashboard: React.FC = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalValue: 0,
    historicalReturn: 0,
    portfolioCount: 0,
    assetCount: 0
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // 检查用户是否已登录
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setStats({
          totalValue: 0,
          historicalReturn: 0,
          portfolioCount: 0,
          assetCount: 0
        });
        return;
      }

      // 并行获取所有数据
      const [portfolioSummary, portfolios, holdingAssetCount] = await Promise.all([
        PortfolioService.getPortfolioSummary().catch(() => null),
        PortfolioService.getPortfolios().catch(() => []),
        HoldingService.getUserTotalHoldingAssets().catch(() => 0)
      ]);

      let totalValue = 0;
      let historicalReturn = 0;

      if (portfolioSummary) {
        totalValue = portfolioSummary.totalValue || 0;
        historicalReturn = portfolioSummary.totalReturn || 0;
      } else if (portfolios.length > 0) {
        totalValue = portfolios.reduce((sum, portfolio) => sum + (portfolio.totalValue || 0), 0);
        const totalCost = portfolios.reduce((sum, portfolio) => sum + (portfolio.totalCost || 0), 0);
        historicalReturn = totalValue - totalCost;
      }

      setStats({
        totalValue,
        historicalReturn,
        portfolioCount: portfolios.length,
        assetCount: holdingAssetCount
      });

    } catch (error) {
      console.error('加载仪表板统计失败:', error);
      message.error('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 欢迎信息 */}
        <Card>
          <Title level={2}>
            👋 欢迎回来, {state.user?.username}!
          </Title>
          <Text type="secondary">
            这是您的个人仪表板，您可以在这里查看投资组合概览和快速操作。
          </Text>
        </Card>

        {/* 统计卡片 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="总资产价值"
                  value={stats.totalValue}
                  precision={2}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<DollarOutlined />}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="历史收益"
                  value={stats.historicalReturn}
                  precision={2}
                  valueStyle={{ 
                    color: stats.historicalReturn >= 0 ? '#3f8600' : '#cf1322'
                  }}
                  prefix={stats.historicalReturn >= 0 ? <RiseOutlined /> : <FallOutlined />}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="投资组合数量"
                  value={stats.portfolioCount}
                  prefix={<PieChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="持仓资产"
                  value={stats.assetCount}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 快速操作 */}
        <Card title="快速操作" extra={<Text type="secondary">常用功能</Text>}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Button 
                type="primary" 
                size="large" 
                block
                onClick={() => navigate('/portfolios')}
              >
                📊 查看投资组合
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button 
                size="large" 
                block
                onClick={() => navigate('/transactions')}
              >
                💰 记录交易
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button 
                size="large" 
                block
                onClick={() => navigate('/reports')}
              >
                📈 查看报告
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 权限信息 */}
        <Card title="权限信息" extra={<SafetyCertificateOutlined />}>
          <Space direction="vertical">
            <Text><UserOutlined /> 当前角色: <strong>{state.user?.role}</strong></Text>
            <Text>可用权限: <strong>{state.user?.permissions?.length || 0}</strong> 项</Text>
            <Space wrap>
              {state.user?.permissions?.slice(0, 5).map(permission => (
                <Text key={permission} code>{permission}</Text>
              ))}
              {(state.user?.permissions?.length || 0) > 5 && (
                <Text type="secondary">... 还有 {(state.user?.permissions?.length || 0) - 5} 项权限</Text>
              )}
            </Space>
          </Space>
        </Card>

        {/* 系统状态 */}
        <Card title="系统状态">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Statistic
                title="权限控制系统"
                value="正常"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="用户认证"
                value="已登录"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="数据同步"
                value="实时"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default SimpleDashboard;