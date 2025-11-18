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
          type: transaction.transactionType || transaction.type || 'buy',
          assetSymbol: transaction.assetSymbol || 'N/A',
          assetName: transaction.assetName || 'Unknown Asset',
          quantity: transaction.quantity,
          price: transaction.price,
          totalAmount: transaction.totalAmount || transaction.amount || 0,
          fee: transaction.fee || transaction.fees || 0,
          currency: transaction.currency || 'CNY',
          executedAt: transaction.transactionDate || transaction.executedAt || new Date().toISOString()
        }));
      
      setTransactions(recentTransactions);
    } catch (error) {
      console.error('获取最近交易失败:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // 判断是否为买入/申购类型（资金流出）
  const isBuyType = (type: string): boolean => {
    const buyTypes = ['buy', 'apply', 'stock_buy', 'etf_buy', 'bond_buy', 'fund_buy'];
    return buyTypes.includes(type.toLowerCase());
  };

  // 判断是否为卖出/赎回类型（资金流入）
  const isSellType = (type: string): boolean => {
    const sellTypes = ['sell', 'redeem', 'stock_sell', 'etf_sell', 'bond_sell', 'fund_sell'];
    return sellTypes.includes(type.toLowerCase());
  };

  const getTransactionIcon = (type: string) => {
    if (isBuyType(type)) {
      return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
    } else if (isSellType(type)) {
      return <ArrowDownOutlined style={{ color: '#f5222d' }} />;
    } else if (type.toLowerCase() === 'dividend') {
      return <DollarOutlined style={{ color: '#1890ff' }} />;
    } else {
      return <DollarOutlined />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    if (isBuyType(type)) {
      return 'green';
    } else if (isSellType(type)) {
      return 'red';
    } else if (type.toLowerCase() === 'dividend') {
      return 'blue';
    } else if (type.toLowerCase() === 'split') {
      return 'orange';
    } else if (type.toLowerCase() === 'transfer') {
      return 'purple';
    } else {
      return 'default';
    }
  };

  const getTransactionTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'buy': '买入',
      'sell': '卖出',
      'apply': '申购',
      'redeem': '赎回',
      'stock_buy': '股票买入',
      'stock_sell': '股票卖出',
      'etf_buy': 'ETF买入',
      'etf_sell': 'ETF卖出',
      'bond_buy': '债券买入',
      'bond_sell': '债券卖出',
      'fund_buy': '基金买入',
      'fund_sell': '基金卖出',
      'dividend': '分红',
      'split': '拆股',
      'transfer': '转账'
    };
    return typeMap[type.toLowerCase()] || type;
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
                      color: isBuyType(transaction.type)
                        ? '#f5222d'  // 买入/申购显示红色（资金流出）
                        : '#52c41a'  // 卖出/赎回显示绿色（资金流入）
                    }}
                  >
                    {isBuyType(transaction.type) ? '-' : '+'}
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