import React from 'react';
import { Card, Row, Col, Statistic, Button, Space } from 'antd';
import { 
  DollarOutlined, 
  SwapOutlined, 
  PlusOutlined,
  BarChartOutlined,
  PieChartOutlined 
} from '@ant-design/icons';
interface AssetSummaryCardProps {
  assetCount: number;
  transactionCount: number;
  onNavigate?: (page: string) => void;
}

const AssetSummaryCard: React.FC<AssetSummaryCardProps> = ({
  assetCount,
  transactionCount,
  onNavigate
}) => {
  return (
    <Card 
      title="资产概览" 
      extra={
        <Button 
          type="link" 
          icon={<BarChartOutlined />}
          onClick={() => onNavigate?.('assets')}
        >
          查看全部
        </Button>
      }
    >
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Statistic
            title="管理资产数量"
            value={assetCount}
            prefix={<DollarOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="交易记录数量"
            value={transactionCount}
            prefix={<SwapOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center', paddingTop: '16px' }}>
            <Space direction="vertical" size="small">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => onNavigate?.('transactions')}
                block
              >
                添加交易
              </Button>
              <Button 
                icon={<PieChartOutlined />}
                onClick={() => onNavigate?.('dashboard')}
                block
              >
                查看分布
              </Button>
            </Space>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default AssetSummaryCard;