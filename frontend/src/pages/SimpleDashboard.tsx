import React from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Button } from 'antd';
import { 
  DollarOutlined, 
  RiseOutlined, 
  UserOutlined, 
  SafetyCertificateOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const SimpleDashboard: React.FC = () => {
  const { state } = useAuth();
  const navigate = useNavigate();

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
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总资产价值"
                value={125680.50}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
                suffix="¥"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="今日收益"
                value={2580.30}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
                prefix={<RiseOutlined />}
                suffix="¥"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="投资组合数量"
                value={5}
                prefix={<PieChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="持仓资产"
                value={23}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>

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