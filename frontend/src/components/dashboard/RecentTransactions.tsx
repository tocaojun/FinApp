import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Typography, Spin } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  DollarOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Transaction {
  id: string;
  type: string;
  assetSymbol: string;
  assetName: string;
  quantity: number;
  price: number;
  totalAmount: number;
  fee: number;
  currency: string;
  executedAt: string;
}

interface RecentTransactionsProps {
  onNavigate?: (page: string) => void;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ onNavigate }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTransactions();
  }, []);

  const fetchRecentTransactions = async () => {
    try {
      setLoading(true);
      // 导入TransactionService
      const { TransactionService } = await import('../../services/transactionService');
      const response = await TransactionService.getTransactions();
      
      // 转换数据格式以匹配组件需要的类型，只取前5条
      const recentTransactions: Transaction[] = (response.transactions || [])
        .slice(0, 5)
        .map(transaction => ({
          id: transaction.id,
          type: transaction.transaction_type || 'buy',
          assetSymbol: transaction.asset_symbol || 'N/A',
          assetName: transaction.asset_name || 'Unknown Asset',
          quantity: transaction.quantity,
          price: transaction.price,
          totalAmount: transaction.total_amount,
          fee: 0, // 暂时设为0，后续可以从API获取
          currency: 'CNY', // 暂时设为CNY，后续可以从API获取
          executedAt: transaction.transaction_date || new Date().toISOString()
        }));
      
      setTransactions(recentTransactions);
    } catch (error) {
      console.error('获取最近交易失败:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
        return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
      case 'sell':
        return <ArrowDownOutlined style={{ color: '#f5222d' }} />;
      case 'dividend':
        return <DollarOutlined style={{ color: '#1890ff' }} />;
      default:
        return <DollarOutlined />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
        return 'green';
      case 'sell':
        return 'red';
      case 'dividend':
        return 'blue';
      case 'split':
        return 'orange';
      case 'transfer':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getTransactionTypeText = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
        return '买入';
      case 'sell':
        return '卖出';
      case 'dividend':
        return '分红';
      case 'split':
        return '拆股';
      case 'transfer':
        return '转账';
      default:
        return type;
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

  const handleViewAll = () => {
    onNavigate?.('transactions');
  };

  const handleViewTransaction = (transaction: Transaction) => {
    console.log('查看交易详情:', transaction);
  };

  return (
    <Card
      title="最近交易"
      extra={
        <Button type="link" icon={<EyeOutlined />} onClick={handleViewAll}>
          查看全部
        </Button>
      }
    >
      <Spin spinning={loading}>
        <List
          itemLayout="horizontal"
          dataSource={transactions}
          locale={{ emptyText: '暂无交易记录' }}
          renderItem={(transaction) => (
            <List.Item
              actions={[
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => handleViewTransaction(transaction)}
                >
                  详情
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={getTransactionIcon(transaction.type)}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong>{transaction.assetName || transaction.assetSymbol}</Text>
                    <Tag color={getTransactionTypeColor(transaction.type)}>
                      {getTransactionTypeText(transaction.type)}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <div>
                      <Text type="secondary">
                        {dayjs(transaction.executedAt).format('YYYY-MM-DD')}
                      </Text>
                    </div>
                    <div>
                      <Text>数量: {transaction.quantity}</Text>
                      <Text style={{ marginLeft: '16px' }}>
                        价格: {formatCurrency(transaction.price, transaction.currency)}
                      </Text>
                    </div>
                  </div>
                }
              />
              <div style={{ textAlign: 'right' }}>
                <div>
                  <Text 
                    strong 
                    style={{ 
                      color: transaction.type.toLowerCase() === 'buy'
                        ? '#f5222d' 
                        : '#52c41a' 
                    }}
                  >
                    {transaction.type.toLowerCase() === 'buy' ? '-' : '+'}
                    {formatCurrency(Math.abs(transaction.totalAmount), transaction.currency)}
                  </Text>
                </div>
                {transaction.fee > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      手续费: {formatCurrency(transaction.fee, transaction.currency)}
                    </Text>
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
};

export default RecentTransactions;