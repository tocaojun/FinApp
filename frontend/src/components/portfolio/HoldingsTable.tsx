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
  ReloadOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Holding } from '../../types/portfolio';
import { BalanceManagementModal } from './BalanceManagementModal';
import { UpdateNavModal } from './UpdateNavModal';
import { HoldingService } from '../../services/holdingService';

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
  const [balanceManagementModalOpen, setBalanceManagementModalOpen] = useState(false);
  const [updateNavModalOpen, setUpdateNavModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

  useEffect(() => {
    if (portfolioId) {
      loadHoldings();
    }
  }, [portfolioId]);

  const loadHoldings = async () => {
    setLoading(true);
    try {
      // 使用新的API获取包含现金的持仓数据
      const data = await HoldingService.getHoldingsWithCashByPortfolio(portfolioId);
      
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
        portfolioCurrency: holding.portfolioCurrency,
        exchangeRate: holding.exchangeRate,
        convertedMarketValue: holding.convertedMarketValue,
        convertedTotalCost: holding.convertedTotalCost,
        convertedUnrealizedPnL: holding.convertedUnrealizedPnL,
        lastUpdated: holding.updatedAt,
        // 理财产品相关字段
        productMode: holding.productMode,
        netAssetValue: holding.netAssetValue,
        balance: holding.balance,
        lastNavUpdate: holding.lastNavUpdate
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

  // 处理更新净值/余额
  const handleUpdateValue = async (holdingId: string, newValue: number) => {
    try {
      const holding = selectedHolding;
      
      if (!holding) return;
      
      if (holding.productMode === 'BALANCE') {
        // 更新余额
        await HoldingService.updateWealthProductBalance(holdingId, newValue);
        message.success('余额更新成功');
      } else {
        // 更新净值
        await HoldingService.updateWealthProductNav(holdingId, newValue);
        message.success('净值更新成功');
      }
      
      // 重新加载数据
      await loadHoldings();
      
      // 关闭模态框
      setUpdateNavModalOpen(false);
      setSelectedHolding(null);
    } catch (error) {
      console.error('更新失败:', error);
      message.error('更新失败');
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
      'OPTION': { color: 'red', text: '期权' },
      '现金': { color: 'gold', text: '现金' }
    };
    const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortedInfo(sorter);
  };

  const getActionMenu = (holding: Holding) => {
    const menuItems = [
      {
        key: 'buy',
        icon: <ShoppingCartOutlined />,
        label: '买入',
        onClick: () => onBuy?.(holding),
      },
      {
        key: 'sell',
        icon: <DollarOutlined />,
        label: '卖出',
        onClick: () => onSell?.(holding),
      }
    ];

    // 为余额型理财产品添加特殊选项
    if (holding.productMode === 'BALANCE') {
      menuItems.push(
        {
          key: 'balanceManagement',
          icon: <HistoryOutlined />,
          label: '历史余额管理',
          onClick: () => {
            setSelectedHolding(holding);
            setBalanceManagementModalOpen(true);
          },
        }
      );
    }

    menuItems.push(
      {
        type: 'divider' as const,
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: () => onEdit?.(holding),
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: '确认删除',
            content: `确定要删除 ${holding.assetName} 的持仓记录吗？`,
            onOk: () => onDelete?.(holding)
          });
        },
      }
    );

    return { items: menuItems };
  };

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
        { text: '期权', value: 'OPTION' },
        { text: '现金', value: '现金' }
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
      width: 150,
      align: 'right',
      sorter: (a, b) => a.marketValue - b.marketValue,
      sortOrder: sortedInfo.columnKey === 'marketValue' ? sortedInfo.order : null,
      render: (value, record) => (
        <div>
          <Text strong>{formatCurrency(value, record.currency)}</Text>
          {record.currency !== record.portfolioCurrency && record.convertedMarketValue && (
            <div style={{ fontSize: '12px', color: '#999', marginTop: 2 }}>
              ≈ {formatCurrency(record.convertedMarketValue, record.portfolioCurrency || 'CNY')}
            </div>
          )}
        </div>
      )
    },
    {
      title: '盈亏',
      key: 'pnl',
      width: 150,
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
          {record.currency !== record.portfolioCurrency && record.convertedUnrealizedPnL !== undefined && (
            <div style={{ 
              fontSize: '12px', 
              color: record.unrealizedPnL >= 0 ? '#52c41a' : '#ff4d4f'
            }}>
              ≈ {formatCurrency(record.convertedUnrealizedPnL, record.portfolioCurrency || 'CNY')}
            </div>
          )}
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
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
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
            <Option value="现金">现金</Option>
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
      
      {/* 汇总行 */}
      {filteredHoldings.length > 0 && (
        <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>总成本</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {formatCurrency(
                  filteredHoldings.reduce((sum, h) => sum + (h.convertedTotalCost || h.totalCost || 0), 0),
                  'CNY'
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>总市值</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {formatCurrency(
                  filteredHoldings.reduce((sum, h) => sum + (h.convertedMarketValue || h.marketValue || 0), 0),
                  'CNY'
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>总盈亏</div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: filteredHoldings.reduce((sum, h) => sum + (h.convertedUnrealizedPnL || h.unrealizedPnL || 0), 0) >= 0 ? '#52c41a' : '#ff4d4f'
              }}>
                {formatCurrency(
                  filteredHoldings.reduce((sum, h) => sum + (h.convertedUnrealizedPnL || h.unrealizedPnL || 0), 0),
                  'CNY'
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>平均收益率</div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: filteredHoldings.reduce((sum, h) => sum + (h.convertedUnrealizedPnL || h.unrealizedPnL || 0), 0) >= 0 ? '#52c41a' : '#ff4d4f'
              }}>
                {(() => {
                  const totalCost = filteredHoldings.reduce((sum, h) => sum + (h.convertedTotalCost || h.totalCost || 0), 0);
                  const totalPnL = filteredHoldings.reduce((sum, h) => sum + (h.convertedUnrealizedPnL || h.unrealizedPnL || 0), 0);
                  const percent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
                  return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 历史余额管理模态框 */}
      <BalanceManagementModal
        open={balanceManagementModalOpen}
        onClose={() => {
          setBalanceManagementModalOpen(false);
          setSelectedHolding(null);
        }}
        holding={selectedHolding ? {
          id: selectedHolding.id,
          assetName: selectedHolding.assetName,
          currentBalance: selectedHolding.balance || 0,
          productMode: selectedHolding.productMode || ''
        } : null}
        onBalanceUpdated={loadHoldings}
      />

      {/* 更新净值/余额模态框 */}
      <UpdateNavModal
        open={updateNavModalOpen}
        onClose={() => {
          setUpdateNavModalOpen(false);
          setSelectedHolding(null);
        }}
        holding={selectedHolding ? {
          id: selectedHolding.id,
          assetName: selectedHolding.assetName,
          currentNav: selectedHolding.netAssetValue || 0,
          currentBalance: selectedHolding.balance || 0,
          quantity: selectedHolding.quantity || 0,
          productMode: selectedHolding.productMode || ''
        } : null}
        onUpdate={handleUpdateValue}
      />
    </Card>
  );
};

export default HoldingsTable;