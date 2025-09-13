import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  Popconfirm,
  DatePicker,

  Drawer,
  Tabs,
  InputNumber,
  Switch,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  EyeOutlined,
  LineChartOutlined,
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,

} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { 
  AssetService, 
  Asset, 
  AssetType, 
  Market, 
  AssetPrice, 
  AssetCreateRequest, 
  AssetUpdateRequest,
  AssetStatistics,
  PriceCreateRequest 
} from '../services/assetService';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;


const AssetManagement: React.FC = () => {
  // 状态管理
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [statistics, setStatistics] = useState<AssetStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetPrices, setAssetPrices] = useState<AssetPrice[]>([]);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [priceForm] = Form.useForm();

  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [selectedLiquidityTag, setSelectedLiquidityTag] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 数据获取函数
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = {
        keyword: searchKeyword || undefined,
        assetTypeId: selectedAssetType || undefined,
        marketId: selectedMarket || undefined,
        currency: selectedCurrency || undefined,
        riskLevel: selectedRiskLevel || undefined,
        liquidityTag: selectedLiquidityTag || undefined,
        isActive: activeFilter !== undefined ? activeFilter : undefined,
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy: 'updatedAt',
        sortOrder: 'DESC' as const,
      };

      const result = await AssetService.searchAssets(params);
      setAssets(result.assets);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
      }));
    } catch (error) {
      message.error('获取资产列表失败');
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetTypes = async () => {
    try {
      const assetTypes = await AssetService.getAssetTypes();
      setAssetTypes(assetTypes);
    } catch (error) {
      console.error('Error fetching asset types:', error);
    }
  };

  const fetchMarkets = async () => {
    try {
      const markets = await AssetService.getMarkets();
      setMarkets(markets);
    } catch (error) {
      console.error('Error fetching markets:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const statistics = await AssetService.getAssetStatistics();
      setStatistics(statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchAssetPrices = async (assetId: string) => {
    try {
      const params = {
        startDate: dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined,
        limit: 100,
        sortOrder: 'DESC' as const,
      };

      const prices = await AssetService.getAssetPrices(assetId, params);
      setAssetPrices(prices);
    } catch (error) {
      console.error('Error fetching asset prices:', error);
    }
  };

  // 资产操作函数
  const handleCreateAsset = () => {
    setEditingAsset(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    form.setFieldsValue({
      ...asset,
      listingDate: asset.listingDate ? dayjs(asset.listingDate) : undefined,
      delistingDate: asset.delistingDate ? dayjs(asset.delistingDate) : undefined,
    });
    setModalVisible(true);
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await AssetService.deleteAsset(assetId);
      message.success('资产删除成功');
      fetchAssets();
      fetchStatistics();
    } catch (error) {
      message.error('删除资产失败');
      console.error('Error deleting asset:', error);
    }
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    fetchAssetPrices(asset.id);
    setDrawerVisible(true);
  };

  const handleSaveAsset = async (values: any) => {
    try {
      const assetData: AssetCreateRequest | AssetUpdateRequest = {
        ...values,
        listingDate: values.listingDate ? values.listingDate.format('YYYY-MM-DD') : undefined,
        delistingDate: values.delistingDate ? values.delistingDate.format('YYYY-MM-DD') : undefined,
      };

      if (editingAsset) {
        await AssetService.updateAsset(editingAsset.id, assetData);
        message.success('资产更新成功');
      } else {
        await AssetService.createAsset(assetData as AssetCreateRequest);
        message.success('资产创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      fetchAssets();
      fetchStatistics();
    } catch (error) {
      message.error(editingAsset ? '更新资产失败' : '创建资产失败');
      console.error('Error saving asset:', error);
    }
  };

  const handleAddPrice = async (values: any) => {
    if (!selectedAsset) return;

    try {
      const priceData: PriceCreateRequest = {
        assetId: selectedAsset.id,
        priceDate: values.priceDate.format('YYYY-MM-DD'),
        openPrice: values.openPrice,
        highPrice: values.highPrice,
        lowPrice: values.lowPrice,
        closePrice: values.closePrice,
        volume: values.volume,
        adjustedPrice: values.adjustedPrice,
        source: values.source || 'manual',
      };

      await AssetService.addPrice(priceData);
      message.success('价格添加成功');
      setPriceModalVisible(false);
      priceForm.resetFields();
      fetchAssetPrices(selectedAsset.id);
    } catch (error) {
      message.error('添加价格失败');
      console.error('Error adding price:', error);
    }
  };

  // 搜索和筛选处理
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchAssets();
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination(paginationConfig);
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSelectedAssetType('');
    setSelectedMarket('');
    setSelectedCurrency('');
    setSelectedRiskLevel('');
    setSelectedLiquidityTag('');
    setActiveFilter(undefined);
    setPagination({ current: 1, pageSize: 20, total: 0 });
  };

  // 表格列定义
  const columns: ColumnsType<Asset> = [
    {
      title: '代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100,
      fixed: 'left',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'assetTypeName',
      key: 'assetTypeName',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '市场',
      dataIndex: 'marketName',
      key: 'marketName',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '货币',
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: string) => {
        const colors = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red' };
        const labels = { LOW: '低风险', MEDIUM: '中风险', HIGH: '高风险' };
        return <Tag color={colors[level as keyof typeof colors]}>{labels[level as keyof typeof labels]}</Tag>;
      },
    },
    {
      title: '流动性',
      dataIndex: 'liquidityTag',
      key: 'liquidityTag',
      width: 100,
      render: (tag: string) => {
        const colors = { HIGH: 'green', MEDIUM: 'orange', LOW: 'red' };
        const labels = { HIGH: '高流动性', MEDIUM: '中流动性', LOW: '低流动性' };
        return <Tag color={colors[tag as keyof typeof colors]}>{labels[tag as keyof typeof labels]}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Badge status={isActive ? 'success' : 'default'} text={isActive ? '活跃' : '停用'} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewAsset(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEditAsset(record)} />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个资产吗？"
            onConfirm={() => handleDeleteAsset(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 价格表格列定义
  const priceColumns: ColumnsType<AssetPrice> = [
    {
      title: '日期',
      dataIndex: 'priceDate',
      key: 'priceDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '开盘价',
      dataIndex: 'openPrice',
      key: 'openPrice',
      render: (price: number) => price ? price.toFixed(4) : '-',
    },
    {
      title: '最高价',
      dataIndex: 'highPrice',
      key: 'highPrice',
      render: (price: number) => price ? price.toFixed(4) : '-',
    },
    {
      title: '最低价',
      dataIndex: 'lowPrice',
      key: 'lowPrice',
      render: (price: number) => price ? price.toFixed(4) : '-',
    },
    {
      title: '收盘价',
      dataIndex: 'closePrice',
      key: 'closePrice',
      render: (price: number) => price.toFixed(4),
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume: number) => volume ? volume.toLocaleString() : '-',
    },
    {
      title: '数据源',
      dataIndex: 'source',
      key: 'source',
    },
  ];

  // 组件挂载时获取数据
  useEffect(() => {
    fetchAssetTypes();
    fetchMarkets();
    fetchStatistics();
    fetchAssets();
  }, []);

  // 监听搜索和筛选条件变化
  useEffect(() => {
    fetchAssets();
  }, [pagination.current, pagination.pageSize]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总资产数"
              value={statistics?.totalAssets || 0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃资产"
              value={statistics?.activeAssets || 0}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="资产类型"
              value={Object.keys(statistics?.assetsByType || {}).length}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="交易市场"
              value={Object.keys(statistics?.assetsByMarket || {}).length}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Search
              placeholder="搜索资产代码或名称"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="资产类型"
              allowClear
              value={selectedAssetType}
              onChange={setSelectedAssetType}
              style={{ width: '100%' }}
            >
              {assetTypes.map(type => (
                <Option key={type.id} value={type.id}>{type.name || type.code}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="交易市场"
              allowClear
              value={selectedMarket}
              onChange={setSelectedMarket}
              style={{ width: '100%' }}
            >
              {markets.map(market => (
                <Option key={market.id} value={market.id}>{market.name || market.code}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="货币"
              allowClear
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              style={{ width: '100%' }}
            >
              <Option value="USD">USD</Option>
              <Option value="CNY">CNY</Option>
              <Option value="HKD">HKD</Option>
              <Option value="EUR">EUR</Option>
              <Option value="GBP">GBP</Option>
              <Option value="JPY">JPY</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="风险等级"
              allowClear
              value={selectedRiskLevel}
              onChange={setSelectedRiskLevel}
              style={{ width: '100%' }}
            >
              <Option value="LOW">低风险</Option>
              <Option value="MEDIUM">中风险</Option>
              <Option value="HIGH">高风险</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="流动性"
              allowClear
              value={selectedLiquidityTag}
              onChange={setSelectedLiquidityTag}
              style={{ width: '100%' }}
            >
              <Option value="HIGH">高流动性</Option>
              <Option value="MEDIUM">中流动性</Option>
              <Option value="LOW">低流动性</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Space>
              <Button type="primary" onClick={handleFilterChange}>
                <SearchOutlined /> 搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
        <Row style={{ marginTop: 16 }}>
          <Col span={6}>
            <Select
              placeholder="状态筛选"
              allowClear
              value={activeFilter}
              onChange={setActiveFilter}
              style={{ width: '100%' }}
            >
              <Option value={true}>活跃</Option>
              <Option value={false}>停用</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAsset}>
            新增资产
          </Button>
          <Button icon={<ImportOutlined />}>
            批量导入
          </Button>
          <Button icon={<ExportOutlined />}>
            导出数据
          </Button>
        </Space>
      </div>

      {/* 资产表格 */}
      <Table
        columns={columns}
        dataSource={assets}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      {/* 资产编辑模态框 */}
      <Modal
        title={editingAsset ? '编辑资产' : '新增资产'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveAsset}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="symbol"
                label="资产代码"
                rules={[{ required: true, message: '请输入资产代码' }]}
              >
                <Input placeholder="请输入资产代码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="资产名称"
                rules={[{ required: true, message: '请输入资产名称' }]}
              >
                <Input placeholder="请输入资产名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assetTypeId"
                label="资产类型"
                rules={[{ required: true, message: '请选择资产类型' }]}
              >
                <Select placeholder="请选择资产类型">
                  {assetTypes.map(type => (
                    <Option key={type.id} value={type.id}>{type.name || type.code}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="marketId"
                label="交易市场"
                rules={[{ required: true, message: '请选择交易市场' }]}
              >
                <Select placeholder="请选择交易市场">
                  {markets.map(market => (
                    <Option key={market.id} value={market.id}>{market.name || market.code}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="currency"
                label="货币"
                rules={[{ required: true, message: '请选择货币' }]}
              >
                <Select placeholder="请选择货币">
                  <Option value="USD">USD</Option>
                  <Option value="CNY">CNY</Option>
                  <Option value="HKD">HKD</Option>
                  <Option value="EUR">EUR</Option>
                  <Option value="GBP">GBP</Option>
                  <Option value="JPY">JPY</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="riskLevel"
                label="风险等级"
                rules={[{ required: true, message: '请选择风险等级' }]}
              >
                <Select placeholder="请选择风险等级">
                  <Option value="LOW">低风险</Option>
                  <Option value="MEDIUM">中风险</Option>
                  <Option value="HIGH">高风险</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="liquidityTag"
                label="流动性标签"
                rules={[{ required: true, message: '请选择流动性标签' }]}
              >
                <Select placeholder="请选择流动性标签">
                  <Option value="HIGH">高流动性</Option>
                  <Option value="MEDIUM">中流动性</Option>
                  <Option value="LOW">低流动性</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sector" label="行业">
                <Input placeholder="请输入行业" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="子行业">
                <Input placeholder="请输入子行业" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="listingDate" label="上市日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="delistingDate" label="退市日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入资产描述" />
          </Form.Item>
          <Form.Item name="isActive" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="活跃" unCheckedChildren="停用" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingAsset ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 资产详情抽屉 */}
      <Drawer
        title={`资产详情 - ${selectedAsset?.symbol}`}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={800}
      >
        {selectedAsset && (
          <Tabs 
            defaultActiveKey="info"
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
              <div style={{ padding: '16px 0' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <p><strong>资产代码:</strong> {selectedAsset.symbol}</p>
                    <p><strong>资产名称:</strong> {selectedAsset.name}</p>
                    <p><strong>资产类型:</strong> {selectedAsset.assetTypeName || '-'}</p>
                    <p><strong>交易市场:</strong> {selectedAsset.marketName || '-'}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong>货币:</strong> {selectedAsset.currency}</p>
                    <p><strong>风险等级:</strong> {selectedAsset.riskLevel}</p>
                    <p><strong>流动性:</strong> {selectedAsset.liquidityTag}</p>
                    <p><strong>状态:</strong> {selectedAsset.isActive ? '活跃' : '停用'}</p>
                  </Col>
                </Row>
                {selectedAsset.description && (
                  <div style={{ marginTop: 16 }}>
                    <p><strong>描述:</strong></p>
                    <p>{selectedAsset.description}</p>
                  </div>
                )}
              </div>
                )
              },
              {
                key: 'prices',
                label: '价格历史',
                children: (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Space>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />} 
                          onClick={() => setPriceModalVisible(true)}
                        >
                          添加价格
                        </Button>
                        <RangePicker
                          value={dateRange}
                          onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                          placeholder={['开始日期', '结束日期']}
                        />
                        <Button onClick={() => selectedAsset && fetchAssetPrices(selectedAsset.id)}>
                          刷新
                        </Button>
                      </Space>
                    </div>
                    <Table
                      columns={priceColumns}
                      dataSource={assetPrices}
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 10 }}
                    />
                  </div>
                )
              }
            ]}
          />
        )}
      </Drawer>

      {/* 添加价格模态框 */}
      <Modal
        title="添加价格记录"
        open={priceModalVisible}
        onCancel={() => setPriceModalVisible(false)}
        footer={null}
        destroyOnHidden={true}
      >
        <Form
          form={priceForm}
          layout="vertical"
          onFinish={handleAddPrice}
        >
          <Form.Item
            name="priceDate"
            label="价格日期"
            rules={[{ required: true, message: '请选择价格日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="openPrice" label="开盘价">
                <InputNumber
                  style={{ width: '100%' }}
                  precision={4}
                  min={0}
                  placeholder="开盘价"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="closePrice"
                label="收盘价"
                rules={[{ required: true, message: '请输入收盘价' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  precision={4}
                  min={0}
                  placeholder="收盘价"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="highPrice" label="最高价">
                <InputNumber
                  style={{ width: '100%' }}
                  precision={4}
                  min={0}
                  placeholder="最高价"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lowPrice" label="最低价">
                <InputNumber
                  style={{ width: '100%' }}
                  precision={4}
                  min={0}
                  placeholder="最低价"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="volume" label="成交量">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="成交量"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="adjustedPrice" label="复权价格">
                <InputNumber
                  style={{ width: '100%' }}
                  precision={4}
                  min={0}
                  placeholder="复权价格"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="source" label="数据源" initialValue="manual">
            <Select>
              <Option value="manual">手动录入</Option>
              <Option value="api">API获取</Option>
              <Option value="import">批量导入</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setPriceModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssetManagement;