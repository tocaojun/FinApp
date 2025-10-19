import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Tooltip, 
  Input, 
  Select, 
  Card,
  Typography,
  Dropdown,
  Menu,
  Modal,
  message
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  MoreOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Holding } from '../../types/portfolio';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

interface HoldingsTableProps {
  portfolioId: string;
  onBuy?: (holding: Holding) => void;
  onSell?: (holding: Holding) => void;
  onEdit?: (holding: Holding) => void;
  onDelete?: (holding: Holding) => void;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({
  portfolioId,
  onBuy,
  onSell,
  onEdit,
  onDelete
}) => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('');
  const [sortedInfo, setSortedInfo] = useState<any>({});

  useEffect(() => {
    if (portfolioId) {
      loadHoldings();
    }
  }, [portfolioId]);

  const loadHoldings = async () => {
    setLoading(true);
    try {
      // 导入HoldingService
      const { HoldingService } = await import('../../services/holdingService');
      const data = await HoldingService.getHoldingsByPortfolio(portfolioId);
      
      // 转换数据格式以匹配组件需要的类型
      const convertedHoldings: Holding[] = data.map(holding => ({
        id: holding.id,
        portfolioId: holding.portfolioId,
        assetId: holding.assetId,
        assetSymbol: holding.assetSymbol,
        assetName: holding.assetName,
        assetType: holding.assetType,
        quantity: holding.quantity,
        averagePrice: holding.averageCost,
        currentPrice: holding.currentPrice,
        marketValue: holding.marketValue,
        totalCost: holding.totalCost,
        unrealizedPnL: holding.unrealizedPnL,
        unrealizedPnLPercent: holding.unrealizedPnLPercent,
        currency: holding.currency,
        lastUpdated: holding.updatedAt
      }));
      
      setHoldings(convertedHoldings);
    } catch (error) {
      console.error('加载持仓数据失败:', error);
      message.error('加载持仓数据失败');
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    const color = percent >= 0 ? '#52c41a' : '#ff4d4f';
    const prefix = percent >= 0 ? '+' : '';
    return (
      <Text style={{ color, fontWeight: 'bold' }}>
        {prefix}{percent.toFixed(2)}%
      </Text>
    );
  };

  const getAssetTypeTag = (type: string) => {
    const typeMap = {
      'STOCK': { color: 'blue', text: '股票' },
      'FUND': { color: 'green', text: '基金' },
      'BOND': { color: 'orange', text: '债券' },
      'CRYPTO': { color: 'purple', text: '加密货币' },
      'OPTION': { color: 'red', text: '期权' }
    };
    const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortedInfo(sorter);
  };

  const getActionMenu = (holding: Holding) => (
    <Menu>
      <Menu.Item 
        key="buy" 
        icon={<ShoppingCartOutlined />}
        onClick={() => onBuy?.(holding)}
      >
        买入
      </Menu.Item>
      <Menu.Item 
        key="sell" 
        icon={<DollarOutlined />}
        onClick={() => onSell?.(holding)}
      >
        卖出
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item 
        key="edit" 
        icon={<EditOutlined />}
        onClick={() => onEdit?.(holding)}
      >
        编辑
      </Menu.Item>
      <Menu.Item 
        key="delete" 
        icon={<DeleteOutlined />}
        danger
        onClick={() => {
          Modal.confirm({
            title: '确认删除',
            content: `确定要删除 ${holding.assetName} 的持仓记录吗？`,
            onOk: () => onDelete?.(holding)
          });
        }}
      >
        删除
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<Holding> = [
    {
      title: '资产',
      key: 'asset',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {record.assetSymbol}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.assetName}
          </div>
        </div>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => 
        record.assetSymbol.toLowerCase().includes(value.toString().toLowerCase()) ||
        record.assetName.toLowerCase().includes(value.toString().toLowerCase())
    },
    {
      title: '类型',
      dataIndex: 'assetType',
      key: 'assetType',
      width: 80,
      render: (type) => getAssetTypeTag(type),
      filters: [
        { text: '股票', value: 'STOCK' },
        { text: '基金', value: 'FUND' },
        { text: '债券', value: 'BOND' },
        { text: '加密货币', value: 'CRYPTO' },
        { text: '期权', value: 'OPTION' }
      ],
      filteredValue: assetTypeFilter ? [assetTypeFilter] : null,
      onFilter: (value, record) => record.assetType === value
    },
    {
      title: '持仓数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.quantity - b.quantity,
      sortOrder: sortedInfo.columnKey === 'quantity' ? sortedInfo.order : null,
      render: (quantity) => quantity.toLocaleString()
    },
    {
      title: '成本价',
      dataIndex: 'averagePrice',
      key: 'averagePrice',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.averagePrice - b.averagePrice,
      sortOrder: sortedInfo.columnKey === 'averagePrice' ? sortedInfo.order : null,
      render: (price, record) => formatCurrency(price, record.currency)
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.currentPrice - b.currentPrice,
      sortOrder: sortedInfo.columnKey === 'currentPrice' ? sortedInfo.order : null,
      render: (price, record) => formatCurrency(price, record.currency)
    },
    {
      title: '市值',
      dataIndex: 'marketValue',
      key: 'marketValue',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.marketValue - b.marketValue,
      sortOrder: sortedInfo.columnKey === 'marketValue' ? sortedInfo.order : null,
      render: (value, record) => (
        <Text strong>{formatCurrency(value, record.currency)}</Text>
      )
    },
    {
      title: '盈亏',
      key: 'pnl',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.unrealizedPnL - b.unrealizedPnL,
      sortOrder: sortedInfo.columnKey === 'pnl' ? sortedInfo.order : null,
      render: (_, record) => (
        <div>
          <div style={{ 
            color: record.unrealizedPnL >= 0 ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold'
          }}>
            {formatCurrency(record.unrealizedPnL, record.currency)}
          </div>
          <div style={{ fontSize: '12px' }}>
            {formatPercent(record.unrealizedPnLPercent)}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  // 过滤数据
  const filteredHoldings = holdings.filter(holding => {
    const matchesSearch = !searchText || 
      holding.assetSymbol.toLowerCase().includes(searchText.toLowerCase()) ||
      holding.assetName.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesType = !assetTypeFilter || holding.assetType === assetTypeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <Card 
      title="持仓明细"
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadHoldings}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Search
            placeholder="搜索资产代码或名称"
            allowClear
            style={{ width: 250 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="资产类型"
            allowClear
            style={{ width: 120 }}
            value={assetTypeFilter}
            onChange={setAssetTypeFilter}
          >
            <Option value="STOCK">股票</Option>
            <Option value="FUND">基金</Option>
            <Option value="BOND">债券</Option>
            <Option value="CRYPTO">加密货币</Option>
            <Option value="OPTION">期权</Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredHoldings}
        rowKey="id"
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
        }}
        scroll={{ x: 800 }}
        size="small"
      />
    </Card>
  );
};

export default HoldingsTable;