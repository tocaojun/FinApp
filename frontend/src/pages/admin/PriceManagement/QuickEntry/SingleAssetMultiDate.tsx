import React, { useState, useEffect } from 'react';
import { 
  Table, 
  DatePicker, 
  InputNumber, 
  Button, 
  message, 
  Select,
  Space,
  Card,
  Popconfirm,
  Form,
  Row,
  Col,
  Statistic,
  Spin,
  Empty,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  ReloadOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';

const { Option } = Select;

interface AssetType {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface Asset {
  id: string;
  symbol: string;
  name: string;
  currency: string;
  assetTypeId: string;
}

interface PriceRecord {
  id?: string;
  key: string;
  date: Dayjs | null;
  closePrice: number | null;
  openPrice?: number | null;
  highPrice?: number | null;
  lowPrice?: number | null;
  isNew?: boolean;
  isModified?: boolean;
}

interface HistoricalPrice {
  id: string;
  priceDate: string;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  closePrice: number;
  dataSource: string;
}

const SingleAssetMultiDate: React.FC = () => {
  const [form] = Form.useForm();
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [historicalPrices, setHistoricalPrices] = useState<HistoricalPrice[]>([]);
  const [data, setData] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // 加载资产类型
  useEffect(() => {
    loadAssetTypes();
  }, []);

  const loadAssetTypes = async () => {
    setLoadingTypes(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/assets/types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setAssetTypes(response.data.data);
      }
    } catch (error) {
      console.error('加载资产类型失败:', error);
      message.error('加载资产类型失败');
    } finally {
      setLoadingTypes(false);
    }
  };

  // 加载指定类型的资产
  const loadAssetsByType = async (assetTypeId: string) => {
    setLoadingAssets(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/assets', {
        params: { 
          assetTypeId, 
          isActive: true,
          limit: 1000
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('加载资产响应:', response.data);
      
      if (response.data.success) {
        const assetList = response.data.data || [];
        console.log('资产列表:', assetList);
        setAssets(assetList);
        
        if (assetList.length === 0) {
          message.info('该类型下暂无资产');
        }
      }
    } catch (error) {
      console.error('加载资产失败:', error);
      message.error('加载资产失败');
    } finally {
      setLoadingAssets(false);
    }
  };

  // 加载资产的历史价格
  const loadHistoricalPrices = async (assetId: string) => {
    setLoadingPrices(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`/api/assets/${assetId}/prices`, {
        params: {
          sortOrder: 'DESC',
          limit: 1000
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const prices = response.data.data;
        setHistoricalPrices(prices);
        
        // 转换为表格数据格式
        const tableData: PriceRecord[] = prices.map((price: HistoricalPrice) => ({
          id: price.id,
          key: price.id,
          date: dayjs(price.priceDate),
          closePrice: price.closePrice,
          openPrice: price.openPrice,
          highPrice: price.highPrice,
          lowPrice: price.lowPrice,
          isNew: false,
          isModified: false
        }));
        
        setData(tableData);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('加载历史价格失败:', error);
      message.error('加载历史价格失败');
    } finally {
      setLoadingPrices(false);
    }
  };

  // 处理资产类型选择
  const handleAssetTypeChange = (assetTypeId: string) => {
    setSelectedAssetType(assetTypeId);
    setSelectedAsset(null);
    setAssets([]);
    setData([]);
    setHistoricalPrices([]);
    loadAssetsByType(assetTypeId);
  };

  // 处理资产选择
  const handleAssetSelect = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    setSelectedAsset(asset || null);
    if (asset) {
      loadHistoricalPrices(asset.id);
    }
  };

  // 添加新行
  const handleAddRow = () => {
    const newRecord: PriceRecord = {
      key: `new_${Date.now()}`,
      date: null,
      closePrice: null,
      openPrice: null,
      highPrice: null,
      lowPrice: null,
      isNew: true,
      isModified: false
    };
    setData([newRecord, ...data]);
    setCurrentPage(1);
  };

  // 删除行
  const handleDeleteRow = async (record: PriceRecord) => {
    if (record.isNew) {
      // 新增的行直接删除
      setData(data.filter(item => item.key !== record.key));
      message.success('已删除');
    } else {
      // 已存在的价格记录，调用API删除
      try {
        const response = await axios.delete(`/api/assets/prices/${record.id}`);
        if (response.data.success) {
          setData(data.filter(item => item.key !== record.key));
          message.success('删除成功');
        }
      } catch (error: any) {
        console.error('删除失败:', error);
        message.error(error.response?.data?.message || '删除失败');
      }
    }
  };

  // 更新单元格数据
  const updateRecord = (key: string, field: keyof PriceRecord, value: any) => {
    setData(data.map(item => {
      if (item.key === key) {
        return { 
          ...item, 
          [field]: value,
          isModified: !item.isNew // 只有非新增的记录才标记为已修改
        };
      }
      return item;
    }));
  };

  // 刷新价格数据
  const handleRefresh = () => {
    if (selectedAsset) {
      loadHistoricalPrices(selectedAsset.id);
      message.success('已刷新');
    }
  };

  // 验证数据
  const validateData = (): boolean => {
    if (!selectedAsset) {
      message.error('请选择产品');
      return false;
    }

    // 获取所有修改或新增的记录
    const changedRecords = data.filter(item => 
      (item.isNew || item.isModified) && item.date && item.closePrice !== null
    );
    
    if (changedRecords.length === 0) {
      message.error('没有需要保存的数据');
      return false;
    }

    // 检查是否有重复日期
    const dates = changedRecords.map(item => item.date!.format('YYYY-MM-DD'));
    const uniqueDates = new Set(dates);
    if (dates.length !== uniqueDates.size) {
      message.error('存在重复的日期，请检查');
      return false;
    }

    // 验证价格逻辑
    for (const record of changedRecords) {
      if (record.highPrice !== null && record.lowPrice !== null) {
        if (record.highPrice < record.lowPrice) {
          message.error(`日期 ${record.date!.format('YYYY-MM-DD')} 的最高价不能低于最低价`);
          return false;
        }
        
        if (record.closePrice! < record.lowPrice || record.closePrice! > record.highPrice) {
          message.error(`日期 ${record.date!.format('YYYY-MM-DD')} 的收盘价应在最高价和最低价之间`);
          return false;
        }

        if (record.openPrice !== null && 
            (record.openPrice < record.lowPrice || record.openPrice > record.highPrice)) {
          message.error(`日期 ${record.date!.format('YYYY-MM-DD')} 的开盘价应在最高价和最低价之间`);
          return false;
        }
      }
    }

    return true;
  };

  // 保存数据
  const handleSave = async () => {
    if (!validateData()) {
      return;
    }

    setLoading(true);
    try {
      // 获取所有修改或新增的记录
      const changedRecords = data.filter(item => 
        (item.isNew || item.isModified) && item.date && item.closePrice !== null
      );
      
      const updates = changedRecords.map(record => ({
        assetId: selectedAsset!.id,
        priceDate: record.date!.format('YYYY-MM-DD'),
        closePrice: record.closePrice!,
        openPrice: record.openPrice || undefined,
        highPrice: record.highPrice || undefined,
        lowPrice: record.lowPrice || undefined,
        currency: selectedAsset!.currency,
        dataSource: 'MANUAL'
      }));

      const token = localStorage.getItem('auth_token');
      const response = await axios.post('/api/assets/prices/bulk', {
        updates
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        message.success(`成功保存 ${updates.length} 条价格记录`);
        // 重新加载历史价格
        loadHistoricalPrices(selectedAsset!.id);
      } else {
        message.error(response.data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('保存价格失败:', error);
      message.error(error.response?.data?.message || '保存价格失败');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '序号',
      width: 60,
      render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1
    },
    {
      title: '状态',
      width: 80,
      render: (_: any, record: PriceRecord) => {
        if (record.isNew) {
          return <Tag color="green">新增</Tag>;
        } else if (record.isModified) {
          return <Tag color="orange">已修改</Tag>;
        }
        return <Tag color="blue">已保存</Tag>;
      }
    },
    {
      title: <span style={{ color: 'red' }}>* 日期</span>,
      dataIndex: 'date',
      width: 150,
      render: (_: any, record: PriceRecord) => (
        <DatePicker 
          value={record.date}
          onChange={(date) => updateRecord(record.key, 'date', date)}
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
          placeholder="选择日期"
          disabled={!record.isNew && !record.isModified}
        />
      )
    },
    {
      title: <span style={{ color: 'red' }}>* 收盘价</span>,
      dataIndex: 'closePrice',
      width: 120,
      render: (_: any, record: PriceRecord) => (
        <InputNumber
          value={record.closePrice}
          onChange={(value) => updateRecord(record.key, 'closePrice', value)}
          min={0}
          precision={4}
          style={{ width: '100%' }}
          placeholder="收盘价"
        />
      )
    },
    {
      title: '开盘价',
      dataIndex: 'openPrice',
      width: 120,
      render: (_: any, record: PriceRecord) => (
        <InputNumber
          value={record.openPrice}
          onChange={(value) => updateRecord(record.key, 'openPrice', value)}
          min={0}
          precision={4}
          style={{ width: '100%' }}
          placeholder="可选"
        />
      )
    },
    {
      title: '最高价',
      dataIndex: 'highPrice',
      width: 120,
      render: (_: any, record: PriceRecord) => (
        <InputNumber
          value={record.highPrice}
          onChange={(value) => updateRecord(record.key, 'highPrice', value)}
          min={0}
          precision={4}
          style={{ width: '100%' }}
          placeholder="可选"
        />
      )
    },
    {
      title: '最低价',
      dataIndex: 'lowPrice',
      width: 120,
      render: (_: any, record: PriceRecord) => (
        <InputNumber
          value={record.lowPrice}
          onChange={(value) => updateRecord(record.key, 'lowPrice', value)}
          min={0}
          precision={4}
          style={{ width: '100%' }}
          placeholder="可选"
        />
      )
    },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: PriceRecord) => (
        <Space>
          {!record.isNew && !record.isModified && (
            <Button 
              type="link" 
              icon={<EditOutlined />}
              size="small"
              onClick={() => updateRecord(record.key, 'isModified', true)}
            >
              编辑
            </Button>
          )}
          <Popconfirm
            title="确定删除这条记录吗？"
            onConfirm={() => handleDeleteRow(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 统计信息
  const newRecordsCount = data.filter(item => item.isNew && item.date && item.closePrice !== null).length;
  const modifiedRecordsCount = data.filter(item => item.isModified && item.date && item.closePrice !== null).length;
  const totalChanges = newRecordsCount + modifiedRecordsCount;

  return (
    <div>
      <Card title="单产品多日价格录入">
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label={<span style={{ fontWeight: 'bold' }}>选择产品类型</span>}
                required
              >
                <Select
                  placeholder="请选择产品类型"
                  loading={loadingTypes}
                  onChange={handleAssetTypeChange}
                  value={selectedAssetType}
                  style={{ width: '100%' }}
                >
                  {assetTypes.map(type => (
                    <Option key={type.id} value={type.id}>
                      {type.name} ({type.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label={<span style={{ fontWeight: 'bold' }}>选择产品</span>}
                required
              >
                <Select
                  placeholder="请先选择产品类型"
                  loading={loadingAssets}
                  onChange={handleAssetSelect}
                  value={selectedAsset?.id}
                  disabled={!selectedAssetType}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {assets.map(asset => (
                    <Option key={asset.id} value={asset.id}>
                      {asset.symbol} - {asset.name} ({asset.currency})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {selectedAsset && (
            <Card 
              size="small" 
              style={{ marginBottom: 16, backgroundColor: '#f0f2f5' }}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="产品代码" value={selectedAsset.symbol} />
                </Col>
                <Col span={10}>
                  <Statistic title="产品名称" value={selectedAsset.name} />
                </Col>
                <Col span={4}>
                  <Statistic title="币种" value={selectedAsset.currency} />
                </Col>
                <Col span={4}>
                  <Statistic title="历史记录" value={historicalPrices.length} suffix="条" />
                </Col>
              </Row>
            </Card>
          )}

          {selectedAsset && (
            <>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Button 
                    type="primary" 
                    onClick={handleAddRow} 
                    icon={<PlusOutlined />}
                  >
                    添加新价格
                  </Button>
                  <Button 
                    onClick={handleRefresh} 
                    icon={<ReloadOutlined />}
                  >
                    刷新
                  </Button>
                  {totalChanges > 0 && (
                    <Tag color="orange">
                      待保存: {newRecordsCount} 条新增, {modifiedRecordsCount} 条修改
                    </Tag>
                  )}
                </Space>
              </div>

              <Spin spinning={loadingPrices}>
                {data.length > 0 ? (
                  <Table 
                    columns={columns} 
                    dataSource={data} 
                    pagination={{
                      current: currentPage,
                      pageSize: pageSize,
                      total: data.length,
                      onChange: (page) => setCurrentPage(page),
                      showSizeChanger: false,
                      showTotal: (total) => `共 ${total} 条记录`
                    }}
                    bordered
                    size="small"
                    scroll={{ x: 1000 }}
                  />
                ) : (
                  <Empty description="暂无价格数据，点击【添加新价格】开始录入" />
                )}
              </Spin>

              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Space>
                  <Button 
                    type="primary" 
                    onClick={handleSave}
                    loading={loading}
                    icon={<SaveOutlined />}
                    disabled={totalChanges === 0}
                  >
                    保存更改 ({totalChanges} 条)
                  </Button>
                </Space>
              </div>
            </>
          )}
        </Form>
      </Card>

      <Card 
        size="small" 
        style={{ marginTop: 16 }}
        title="使用说明"
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>先选择产品类型，再选择具体产品</li>
          <li>选择产品后，系统会自动加载该产品的历史价格（由近及远排序）</li>
          <li>点击【添加新价格】可以添加新的价格记录</li>
          <li>点击【编辑】可以修改已有的价格记录</li>
          <li>收盘价为必填项，其他价格字段（开盘价、最高价、最低价）为可选</li>
          <li>如果填写了最高价和最低价，系统会自动验证价格逻辑</li>
          <li>每页显示15条记录，可通过翻页查看更多</li>
          <li>修改后的数据会标记为【已修改】，点击【保存更改】统一提交</li>
        </ul>
      </Card>
    </div>
  );
};

export default SingleAssetMultiDate;
