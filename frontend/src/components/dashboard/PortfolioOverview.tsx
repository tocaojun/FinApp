import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Space, message, Tooltip } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  PlusOutlined,
  RiseOutlined,
  FallOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
// 临时类型定义，避免导入错误
interface Portfolio {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface PortfolioSummary {
  totalValue: number;
  totalReturn: number;
  totalAssets: number;
}

interface PortfolioWithSummary extends Portfolio {
  summary?: PortfolioSummary;
}

interface PortfolioOverviewProps {
  onNavigate?: (page: string) => void;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<PortfolioWithSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // 处理导航到投资组合详情页面
  const handleViewPortfolio = (portfolioId: string) => {
    navigate(`/portfolio/${portfolioId}`);
  };

  // 处理创建投资组合
  const handleCreatePortfolio = () => {
    // 导航到第一个投资组合的详情页面，在那里可以创建新的投资组合
    if (portfolios.length > 0) {
      navigate(`/portfolio/${portfolios[0].id}`);
    } else {
      // 如果没有投资组合，创建一个默认的
      navigate('/portfolio/1');
    }
  };

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      // 导入PortfolioService
      const { PortfolioService } = await import('../../services/portfolioService');
      const data = await PortfolioService.getPortfolios();
      
      // 转换数据格式以匹配组件需要的类型
      const portfoliosWithSummary: PortfolioWithSummary[] = data.map(portfolio => ({
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        isActive: true, // 假设所有投资组合都是活跃的
        summary: {
          totalValue: portfolio.totalValue || 0,
          totalReturn: portfolio.totalGainLoss || 0,
          totalAssets: 0 // 暂时设为0，后续可以通过API获取
        }
      }));

      setPortfolios(portfoliosWithSummary);
    } catch (error) {
      console.error('获取投资组合失败:', error);
      message.error('获取投资组合失败');
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const formatCurrency = (value: number, currency = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const columns: ColumnsType<PortfolioWithSummary> = [
    {
      title: '投资组合名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '总价值',
      key: 'totalValue',
      render: (_, record) => {
        const value = record.summary?.totalValue || 0;
        return (
          <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {formatCurrency(value, 'CNY')}
          </span>
        );
      },
    },
    {
      title: '收益/损失',
      key: 'gainLoss',
      render: (_, record) => {
        const totalValue = record.summary?.totalValue || 0;
        const totalCost = record.summary?.totalReturn || 0;
        const gainLoss = totalValue - totalCost;
        const percentage = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
        
        return (
          <div>
            <div style={{ 
              color: gainLoss >= 0 ? '#3f8600' : '#cf1322',
              fontWeight: 'bold'
            }}>
              {gainLoss >= 0 ? <RiseOutlined /> : <FallOutlined />}
              {' '}
              {formatCurrency(gainLoss, 'CNY')}
            </div>
            <div style={{ 
              fontSize: '12px',
              color: percentage >= 0 ? '#3f8600' : '#cf1322'
            }}>
              {formatPercentage(percentage)}
            </div>
          </div>
        );
      },
    },
    {
      title: '资产数量',
      key: 'assetCount',
      render: (_, record) => (
        <span>{record.summary?.totalAssets || 0}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '活跃' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => handleViewPortfolio(record.id)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleViewPortfolio(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="投资组合概览" 
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreatePortfolio}
        >
          创建投资组合
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={portfolios}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
      />
    </Card>
  );
};

export default PortfolioOverview;