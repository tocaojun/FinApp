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
  Badge,
  Upload,
  Progress,
  Alert,
  Divider
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
  UploadOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
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
} from '../../services/assetService';
import { 
  getActiveLiquidityTags,
  type LiquidityTag 
} from '../../services/liquidityTagsApi';
import ProductCategoryManager from '../../components/admin/ProductCategoryManager';
import BulkPriceImporter from '../../components/admin/BulkPriceImporter';
import {
  StockDetailsFields,
  FundDetailsFields,
  BondDetailsFields,
  FuturesDetailsFields,
  WealthProductDetailsFields,
  TreasuryDetailsFields,
} from '../../components/asset/details';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface BulkPriceUpdateData {
  assetId: string;
  priceDate: string;
  closePrice: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  volume?: number;
}

const ProductManagement: React.FC = () => {
  // 状态管理
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [statistics, setStatistics] = useState<AssetStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [bulkPriceModalVisible, setBulkPriceModalVisible] = useState(false);
  const [bulkImportVisible, setBulkImportVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetPrices, setAssetPrices] = useState<AssetPrice[]>([]);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [priceForm] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [bulkPriceForm] = Form.useForm();

  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [selectedLiquidityTag, setSelectedLiquidityTag] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [liquidityTags, setLiquidityTags] = useState<LiquidityTag[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  // 批量更新状态
  const [bulkUpdateProgress, setBulkUpdateProgress] = useState(0);
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [bulkUpdateResults, setBulkUpdateResults] = useState<any>(null);

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 表单中选中的资产类型（用于动态显示详情字段）
  const [formAssetTypeCode, setFormAssetTypeCode] = useState<string>('');

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
      message.error('获取产品列表失败');
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

  // 产品操作函数
  const handleCreateProduct = () => {
    setEditingAsset(null);
    form.resetFields();
    setFormAssetTypeCode('');
    setModalVisible(true);
  };

  const handleEditProduct = (asset: Asset) => {
    setEditingAsset(asset);
    // 设置资产类型代码
    const assetType = assetTypes.find(t => t.id === asset.assetTypeId);
    setFormAssetTypeCode(assetType?.code || '');
    
    form.setFieldsValue({
      ...asset,
      listingDate: asset.listingDate ? dayjs(asset.listingDate) : undefined,
      delistingDate: asset.delistingDate ? dayjs(asset.delistingDate) : undefined,
    });
    setModalVisible(true);
  };

  const handleDeleteProduct = async (assetId: string) => {
    try {
      await AssetService.deleteAsset(assetId);
      message.success('产品删除成功');
      fetchAssets();
      fetchStatistics();
    } catch (error) {
      message.error('删除产品失败');
      console.error('Error deleting asset:', error);
    }
  };

  const handleViewProduct = (asset: Asset) => {
    setSelectedAsset(asset);
    fetchAssetPrices(asset.id);
    setDrawerVisible(true);
  };

  const handleSaveProduct = async (values: any) => {
    try {
      const productData: AssetCreateRequest | AssetUpdateRequest = {
        ...values,
        listingDate: values.listingDate ? values.listingDate.format('YYYY-MM-DD') : undefined,
        delistingDate: values.delistingDate ? values.delistingDate.format('YYYY-MM-DD') : undefined,
      };

      if (editingAsset) {
        await AssetService.updateAsset(editingAsset.id, productData);
        message.success('产品更新成功');
      } else {
        await AssetService.createAsset(productData as AssetCreateRequest);
        message.success('产品创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      fetchAssets();
      fetchStatistics();
    } catch (error) {
      message.error(editingAsset ? '更新产品失败' : '创建产品失败');
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

  // 批量价格更新
  const handleBulkPriceUpdate = () => {
    setBulkPriceModalVisible(true);
    bulkPriceForm.resetFields();
    setBulkUpdateStatus('idle');
    setBulkUpdateProgress(0);
    setBulkUpdateResults(null);
  };

  const handleBulkPriceSubmit = async (values: any) => {
    setBulkUpdateStatus('processing');
    setBulkUpdateProgress(0);

    try {
      // 模拟批量更新过程
      const updateData: BulkPriceUpdateData[] = values.priceUpdates || [];
      
      for (let i = 0; i < updateData.length; i++) {
        const item = updateData[i];
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          await AssetService.addPrice({
            assetId: item.assetId,
            priceDate: item.priceDate,
            closePrice: item.closePrice,
            openPrice: item.openPrice,
            highPrice: item.highPrice,
            lowPrice: item.lowPrice,
            volume: item.volume,
            source: 'bulk_import'
          });
        } catch (error) {
          console.error(`Failed to update price for asset ${item.assetId}:`, error);
        }
        
        setBulkUpdateProgress(Math.round(((i + 1) / updateData.length) * 100));
      }

      setBulkUpdateStatus('completed');
      setBulkUpdateResults({
        total: updateData.length,
        success: updateData.length,
        failed: 0
      });
      
      message.success('批量价格更新完成');
      fetchAssets();
    } catch (error) {
      setBulkUpdateStatus('error');
      message.error('批量价格更新失败');
      console.error('Error in bulk price update:', error);
    }
  };

  // 分类管理
  const handleCategoryManagement = () => {
    setCategoryModalVisible(true);
  };

  const handleCategoryRefresh = () => {
    fetchAssetTypes();
    fetchStatistics();
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

  // 导出功能
  const handleExport = async () => {
    try {
      const params = {
        keyword: searchKeyword || undefined,
        assetTypeId: selectedAssetType || undefined,
        marketId: selectedMarket || undefined,
        currency: selectedCurrency || undefined,
        riskLevel: selectedRiskLevel || undefined,
        liquidityTag: selectedLiquidityTag || undefined,
        isActive: activeFilter !== undefined ? activeFilter : undefined,
      };

      const blob = await AssetService.exportAssets(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${dayjs().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
      console.error('Export error:', error);
    }
  };

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/assets/import',
    headers: {
      authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    onChange(info) {
      if (info.file.status === 'uploading') {
        setBulkUpdateStatus('uploading');
      } else if (info.file.status === 'done') {
        setBulkUpdateStatus('completed');
        message.success(`${info.file.name} 文件上传成功`);
        fetchAssets();
        fetchStatistics();
      } else if (info.file.status === 'error') {
        setBulkUpdateStatus('error');
        message.error(`${info.file.name} 文件上传失败`);
      }
    },
  };

  // 表格列定义
  const columns: ColumnsType<Asset> = [
    {
      title: '产品代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
      fixed: 'left',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '产品类型',
      dataIndex: 'assetTypeName',
      key: 'assetTypeName',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '交易市场',
      dataIndex: 'marketName',
      key: 'marketName',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '货币',
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
      render: (currency: string) => <Tag color="blue">{currency}</Tag>,
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
      render: (tagId: string) => {
        const tag = liquidityTags.find(t => t.id === tagId);
        if (!tag) return '-';
        return <Tag color={tag.color}>{tag.name}</Tag>;
      },
    },
    {
      title: '当前价格',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 120,
      render: (price: number) => price ? `¥${price.toFixed(2)}` : '-',
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
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewProduct(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEditProduct(record)} />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个产品吗？"
            onConfirm={() => handleDeleteProduct(record.id)}
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
      render: (source: string) => {
        const colors = { manual: 'blue', api: 'green', bulk_import: 'orange' };
        const labels = { manual: '手动', api: 'API', bulk_import: '批量导入' };
        return <Tag color={colors[source as keyof typeof colors]}>{labels[source as keyof typeof labels] || source}</Tag>;
      },
    },
  ];

  // 组件挂载时获取数据
  useEffect(() => {
    fetchAssetTypes();
    fetchMarkets();
    fetchStatistics();
    fetchAssets();
    fetchLiquidityTags();
  }, []);

  // 加载流动性标签
  const fetchLiquidityTags = async () => {
    try {
      console.log('🔍 开始加载流动性标签...');
      const tags = await getActiveLiquidityTags();
      console.log('✅ 成功获取流动性标签:', tags);
      console.log('📊 标签数量:', tags.length);
      console.log('📋 标签详情:', JSON.stringify(tags, null, 2));
      setLiquidityTags(tags);
      console.log('✅ 已更新状态，当前liquidityTags:', tags);
    } catch (error) {
      console.error('❌ 加载流动性标签失败:', error);
      if (error instanceof Error) {
        console.error('错误消息:', error.message);
        console.error('错误堆栈:', error.stack);
      }
      message.error('加载流动性标签失败');
    }
  };

  // 监听搜索和筛选条件变化
  useEffect(() => {
    fetchAssets();
  }, [pagination.current, pagination.pageSize]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h1>产品管理系统</h1>
        <p style={{ color: '#666' }}>管理投资产品信息、分类、价格历史和状态</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总产品数"
              value={statistics?.totalAssets || 0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃产品"
              value={statistics?.activeAssets || 0}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="产品类型"
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
              placeholder="搜索产品代码或名称"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="产品类型"
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
              {liquidityTags.map(tag => (
                <Option key={tag.id} value={tag.id}>
                  <span style={{ color: tag.color }}>{tag.name}</span>
                </Option>
              ))}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProduct}>
            新增产品
          </Button>
          <Button icon={<SettingOutlined />} onClick={handleCategoryManagement}>
            分类管理
          </Button>
          <Button icon={<DollarOutlined />} onClick={handleBulkPriceUpdate}>
            批量价格更新
          </Button>
          <Upload {...uploadProps} showUploadList={false}>
            <Button 
              icon={<ImportOutlined />}
              onClick={() => setBulkImportVisible(true)}
            >
              批量导入
            </Button>
          </Upload>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出数据
          </Button>
        </Space>
      </div>

      {/* 产品表格 */}
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
        scroll={{ x: 1400 }}
      />

      {/* 产品编辑模态框 */}
      <Modal
        title={editingAsset ? '编辑产品' : '新增产品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProduct}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="symbol"
                label="产品代码"
                rules={[{ required: true, message: '请输入产品代码' }]}
              >
                <Input placeholder="请输入产品代码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }]}
              >
                <Input placeholder="请输入产品名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assetTypeId"
                label="产品类型"
                rules={[{ required: true, message: '请选择产品类型' }]}
              >
                <Select 
                  placeholder="请选择产品类型"
                  onChange={(value) => {
                    const selectedType = assetTypes.find(t => t.id === value);
                    setFormAssetTypeCode(selectedType?.code || '');
                  }}
                >
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
                  {liquidityTags.map(tag => (
                    <Option key={tag.id} value={tag.id}>
                      <span style={{ color: tag.color }}>{tag.name}</span>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          {/* 类型特定的详情字段 */}
          {formAssetTypeCode && (
            <>
              <Divider orientation="left">产品详情</Divider>
              {formAssetTypeCode === 'STOCK' && <StockDetailsFields />}
              {formAssetTypeCode === 'FUND' && <FundDetailsFields />}
              {formAssetTypeCode === 'BOND' && <BondDetailsFields />}
              {formAssetTypeCode === 'FUTURES' && <FuturesDetailsFields />}
              {formAssetTypeCode === 'WEALTH' && <WealthProductDetailsFields />}
              {formAssetTypeCode === 'TREASURY' && <TreasuryDetailsFields />}
              {formAssetTypeCode === 'OPTION' && (
                <Alert 
                  message="期权详情" 
                  description="期权详情字段请在期权管理模块中配置" 
                  type="info" 
                  showIcon 
                />
              )}
            </>
          )}
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
            <Input.TextArea rows={3} placeholder="请输入产品描述" />
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

      {/* 产品详情抽屉 */}
      <Drawer
        title={`产品详情 - ${selectedAsset?.symbol}`}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={800}
      >
        {selectedAsset && (
          <Tabs defaultActiveKey="info">
            <TabPane tab="基本信息" key="info">
              <div style={{ padding: '16px 0' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <p><strong>产品代码:</strong> {selectedAsset.symbol}</p>
                    <p><strong>产品名称:</strong> {selectedAsset.name}</p>
                    <p><strong>产品类型:</strong> {selectedAsset.assetTypeName || '-'}</p>
                    <p><strong>交易市场:</strong> {selectedAsset.marketName || '-'}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong>货币:</strong> {selectedAsset.currency}</p>
                    <p><strong>风险等级:</strong> {selectedAsset.riskLevel}</p>
                    <p><strong>流动性:</strong> {liquidityTags.find(t => t.id === selectedAsset.liquidityTag)?.name || selectedAsset.liquidityTag}</p>
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
            </TabPane>
            <TabPane tab="价格历史" key="prices">
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
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* 添加价格模态框 */}
      <Modal
        title="添加价格记录"
        open={priceModalVisible}
        onCancel={() => setPriceModalVisible(false)}
        footer={null}
        destroyOnClose={true}
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

      {/* 分类管理模态框 */}
      <ProductCategoryManager
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        onRefresh={handleCategoryRefresh}
      />

      {/* 批量价格更新模态框 */}
      <Modal
        title="批量价格更新"
        open={bulkPriceModalVisible}
        onCancel={() => setBulkPriceModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose={true}
      >
        <div>
          <Alert
            message="批量价格更新说明"
            description="您可以通过上传CSV文件或手动输入的方式批量更新产品价格。CSV文件格式：产品代码,日期,收盘价,开盘价,最高价,最低价,成交量"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Tabs defaultActiveKey="upload">
            <TabPane tab="文件上传" key="upload">
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Upload
                  name="file"
                  action="/api/assets/prices/import"
                  headers={{
                    authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                  }}
                  accept=".csv,.xlsx,.xls"
                  onChange={(info) => {
                    if (info.file.status === 'uploading') {
                      setBulkUpdateStatus('uploading');
                    } else if (info.file.status === 'done') {
                      setBulkUpdateStatus('completed');
                      message.success('价格数据导入成功');
                      fetchAssets();
                    } else if (info.file.status === 'error') {
                      setBulkUpdateStatus('error');
                      message.error('价格数据导入失败');
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />} size="large">
                    选择文件上传
                  </Button>
                </Upload>
                <p style={{ marginTop: 16, color: '#666' }}>
                  支持 CSV、Excel 格式文件
                </p>
              </div>
            </TabPane>
            <TabPane tab="手动输入" key="manual">
              <Form
                form={bulkPriceForm}
                onFinish={handleBulkPriceSubmit}
                layout="vertical"
              >
                <Form.List name="priceUpdates">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Card key={key} size="small" style={{ marginBottom: 8 }}>
                          <Row gutter={16}>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                name={[name, 'assetId']}
                                label="产品"
                                rules={[{ required: true, message: '请选择产品' }]}
                              >
                                <Select placeholder="选择产品">
                                  {assets.map(asset => (
                                    <Option key={asset.id} value={asset.id}>
                                      {asset.symbol} - {asset.name}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'priceDate']}
                                label="日期"
                                rules={[{ required: true, message: '请选择日期' }]}
                              >
                                <DatePicker style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'closePrice']}
                                label="收盘价"
                                rules={[{ required: true, message: '请输入收盘价' }]}
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  precision={4}
                                  min={0}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={3}>
                              <Form.Item
                                {...restField}
                                name={[name, 'openPrice']}
                                label="开盘价"
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  precision={4}
                                  min={0}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={3}>
                              <Form.Item
                                {...restField}
                                name={[name, 'highPrice']}
                                label="最高价"
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  precision={4}
                                  min={0}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={3}>
                              <Form.Item
                                {...restField}
                                name={[name, 'lowPrice']}
                                label="最低价"
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  precision={4}
                                  min={0}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={1}>
                              <Form.Item label=" ">
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => remove(name)}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        添加价格记录
                      </Button>
                    </>
                  )}
                </Form.List>
                
                {bulkUpdateStatus === 'processing' && (
                  <div style={{ marginTop: 16 }}>
                    <Progress percent={bulkUpdateProgress} />
                    <p style={{ textAlign: 'center', marginTop: 8 }}>
                      正在更新价格数据...
                    </p>
                  </div>
                )}
                
                {bulkUpdateResults && (
                  <Alert
                    message="更新完成"
                    description={`总计 ${bulkUpdateResults.total} 条记录，成功 ${bulkUpdateResults.success} 条，失败 ${bulkUpdateResults.failed} 条`}
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
                
                <Form.Item style={{ marginTop: 16 }}>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      loading={bulkUpdateStatus === 'processing'}
                    >
                      开始更新
                    </Button>
                    <Button onClick={() => setBulkPriceModalVisible(false)}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </div>
      </Modal>

      {/* 批量价格导入模态框 */}
      <BulkPriceImporter
        visible={bulkImportVisible}
        onClose={() => setBulkImportVisible(false)}
        onSuccess={() => {
          fetchAssets();
          fetchStatistics();
        }}
      />
    </div>
  );
};

export default ProductManagement;