import React, { useState, useEffect } from 'react';
import { Select, Button, Space, Typography, Card } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { Portfolio } from '../../types/portfolio';
import { PortfolioService } from '../../services/portfolioService';

const { Option } = Select;
const { Title } = Typography;

interface PortfolioSelectorProps {
  selectedPortfolioId?: string;
  onPortfolioChange: (portfolioId: string, portfolio: Portfolio) => void;
  onCreatePortfolio?: () => void;
  onEditPortfolio?: (portfolio: Portfolio) => void;
}

const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({
  selectedPortfolioId,
  onPortfolioChange,
  onCreatePortfolio,
  onEditPortfolio
}) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolioId && portfolios.length > 0) {
      const portfolio = portfolios.find(p => p.id === selectedPortfolioId);
      if (portfolio) {
        setSelectedPortfolio(portfolio);
      }
    }
  }, [selectedPortfolioId, portfolios]);

  const loadPortfolios = async () => {
    setLoading(true);
    try {
      const data = await PortfolioService.getPortfolios();
      setPortfolios(data);
      
      // 如果没有选中的投资组合且有数据，默认选择第一个
      if (!selectedPortfolioId && data.length > 0) {
        const firstPortfolio = data[0];
        setSelectedPortfolio(firstPortfolio);
        onPortfolioChange(firstPortfolio.id, firstPortfolio);
      }
    } catch (error) {
      console.error('加载投资组合失败:', error);
      // 使用模拟数据
      const mockPortfolios: Portfolio[] = [
        {
          id: '1',
          name: '主要投资组合',
          description: '长期价值投资组合',
          totalValue: 1234567.89,
          totalCost: 1000000.00,
          totalReturn: 234567.89,
          returnRate: 23.46,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-09-14T00:00:00Z'
        },
        {
          id: '2',
          name: '成长型投资',
          description: '专注于成长股的投资组合',
          totalValue: 567890.12,
          totalCost: 500000.00,
          totalReturn: 67890.12,
          returnRate: 13.58,
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: '2024-09-14T00:00:00Z'
        }
      ];
      setPortfolios(mockPortfolios);
      
      if (!selectedPortfolioId && mockPortfolios.length > 0) {
        const firstPortfolio = mockPortfolios[0];
        setSelectedPortfolio(firstPortfolio);
        onPortfolioChange(firstPortfolio.id, firstPortfolio);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioChange = (portfolioId: string) => {
    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (portfolio) {
      setSelectedPortfolio(portfolio);
      onPortfolioChange(portfolioId, portfolio);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <Card className="portfolio-selector-card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0, marginRight: 16 }}>
              投资组合
            </Title>
            <Select
              value={selectedPortfolioId}
              onChange={handlePortfolioChange}
              loading={loading}
              style={{ minWidth: 200, marginRight: 8 }}
              placeholder="选择投资组合"
            >
              {portfolios.map(portfolio => (
                <Option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </Option>
              ))}
            </Select>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreatePortfolio}
                size="small"
              >
                新建
              </Button>
              {selectedPortfolio && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => onEditPortfolio?.(selectedPortfolio)}
                  size="small"
                >
                  编辑
                </Button>
              )}
            </Space>
          </div>

          {selectedPortfolio && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  {selectedPortfolio.description || '暂无描述'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 32 }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>
                    总市值
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {formatCurrency(selectedPortfolio.totalValue)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>
                    总收益
                  </div>
                  <div 
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      color: selectedPortfolio.totalReturn >= 0 ? '#52c41a' : '#ff4d4f'
                    }}
                  >
                    {formatCurrency(selectedPortfolio.totalReturn)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>
                    收益率
                  </div>
                  <div 
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      color: selectedPortfolio.returnRate >= 0 ? '#52c41a' : '#ff4d4f'
                    }}
                  >
                    {formatPercent(selectedPortfolio.returnRate)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PortfolioSelector;