import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Empty } from 'antd';
import { BankOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ColumnsType } from 'antd/es/table';
import { depositService } from '../../services/depositService';

interface DepositPosition {
  positionId: string;
  assetId: string;
  productName: string;
  bankName: string;
  depositType: string;
  currentBalance: number;
  principalAmount: number;
  accruedInterest: number;
  interestRate: number;
  daysToMaturity?: number;
  autoRenewal: boolean;
}

interface DepositPositionsTabProps {
  portfolioId: string;
}

/**
 * 投资组合详情页的存款持仓Tab组件
 * 显示该组合下的所有存款资产
 */
const DepositPositionsTab: React.FC<DepositPositionsTabProps> = ({ portfolioId }) => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<DepositPosition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepositPositions();
  }, [portfolioId]);

  const fetchDepositPositions = async () => {
    setLoading(true);
    try {
      console.log('开始获取存款持仓，portfolioId:', portfolioId);
      const data = await depositService.getPositionsByPortfolio(portfolioId);
      console.log('获取存款持仓成功，数据:', data);
      setPositions(data);
    } catch (error) {
      console.error('获取存款持仓失败 - 详细错误:', error);
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      message.error(`获取存款持仓失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getDepositTypeColor = (type: string) => {
    const colors = {
      DEMAND: 'blue',
      TIME: 'green',
      NOTICE: 'orange',
      STRUCTURED: 'purple'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const getDepositTypeName = (type: string) => {
    const names = {
      DEMAND: '活期',
      TIME: '定期',
      NOTICE: '通知',
      STRUCTURED: '结构性'
    };
    return names[type as keyof typeof names] || type;
  };

  const columns: ColumnsType<DepositPosition> = [
    {
      title: '产品信息',
      key: 'product',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div style={{ fontWeight: 'bold' }}>
            <BankOutlined /> {record.productName}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.bankName}
          </div>
          <Tag color={getDepositTypeColor(record.depositType)}>
            {getDepositTypeName(record.depositType)}
          </Tag>
        </Space>
      ),
    },
    {
      title: '当前余额',
      dataIndex: 'currentBalance',
      align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      title: '本金',
      dataIndex: 'principalAmount',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: '已计利息',
      dataIndex: 'accruedInterest',
      align: 'right',
      render: (value) => (
        <span style={{ color: value > 0 ? '#3f8600' : '#8c8c8c' }}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      title: '利率',
      dataIndex: 'interestRate',
      align: 'center',
      render: (value) => (
        <Tag color="cyan">{(value * 100).toFixed(2)}%</Tag>
      ),
    },
    {
      title: '到期状态',
      key: 'maturity',
      align: 'center',
      render: (_, record) => {
        if (!record.daysToMaturity) {
          return <Tag color="blue">活期</Tag>;
        }
        if (record.daysToMaturity <= 0) {
          return <Tag color="error">已到期</Tag>;
        }
        if (record.daysToMaturity <= 7) {
          return <Tag color="warning">{record.daysToMaturity}天后到期</Tag>;
        }
        if (record.daysToMaturity <= 30) {
          return <Tag color="processing">{record.daysToMaturity}天后到期</Tag>;
        }
        return <Tag color="default">{record.daysToMaturity}天后到期</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/deposits?assetId=${record.assetId}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  if (positions.length === 0 && !loading) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="该投资组合暂无存款资产"
      >
        <Button 
          type="primary" 
          icon={<BankOutlined />}
          onClick={() => navigate('/deposits')}
        >
          浏览存款产品
        </Button>
      </Empty>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <span style={{ fontSize: '14px', color: '#8c8c8c' }}>
            共 {positions.length} 笔存款
          </span>
          <span style={{ fontSize: '14px', color: '#8c8c8c' }}>
            总额: {formatCurrency(positions.reduce((sum, p) => sum + p.currentBalance, 0))}
          </span>
        </Space>
        <Button 
          type="primary"
          onClick={() => navigate('/deposits', { state: { portfolioId } })}
        >
          查看全部存款
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={positions}
        loading={loading}
        rowKey="positionId"
        pagination={false}
      />
    </div>
  );
};

export default DepositPositionsTab;
