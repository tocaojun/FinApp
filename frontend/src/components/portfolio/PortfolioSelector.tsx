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
    // 检查是否有认证token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('未登录，跳过加载投资组合');
      return;
    }

    setLoading(true);
    try {
      const data = await PortfolioService.getPortfolios();
      setPortfolios(data);
      
      // 如果没有选中的投资组合且有数据，优先选择默认投资组合，否则选择排序第一个
      if (!selectedPortfolioId && data.length > 0) {
        const defaultPortfolio = data.find(p => p.isDefault);
        const firstPortfolio = defaultPortfolio || data[0];
        setSelectedPortfolio(firstPortfolio);
        onPortfolioChange(firstPortfolio.id, firstPortfolio);
      }
    } catch (error) {
      console.error('加载投资组合失败:', error);
      setPortfolios([]);
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
                  {portfolio.isDefault && <span style={{ color: '#1890ff', marginLeft: '4px' }}>★</span>}
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
                      color: selectedPortfolio.totalGainLoss >= 0 ? '#52c41a' : '#ff4d4f'
                    }}
                  >
                    {formatCurrency(selectedPortfolio.totalGainLoss)}
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
                      color: selectedPortfolio.totalGainLossPercentage >= 0 ? '#52c41a' : '#ff4d4f'
                    }}
                  >
                    {formatPercent(selectedPortfolio.totalGainLossPercentage)}
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