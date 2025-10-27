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
  Tag,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  ClearOutlined 
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
  key: string;
  asset: Asset | null;
  closePrice: number | null;
  openPrice?: number | null;
  highPrice?: number | null;
  lowPrice?: number | null;
}

const MultiAssetSingleDate: React.FC = () => {
  const [form] = Form.useForm();
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [data, setData] = useState<PriceRecord[]>([{
    key: '1',
    asset: null,
    closePrice: null,
    openPrice: null,
    highPrice: null,
    lowPrice: null
  }]);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

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
      
      if (response.data.success) {
        const assetList = response.data.data || [];
        setAssets(assetList);
        if (assetList.length === 0) {
          message.info('该类型下暂无资产');
        }
      }
    } catch (error) {
      console.error('加载资产失败:', error);
      message.error('加载资产失败');
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  // 处理资产类型选择
  const handleAssetTypeChange = (assetTypeId: string) => {
    setSelectedAssetType(assetTypeId);
    setAssets([]);
    loadAssetsByType(assetTypeId);
  };

  // 添加新行
  const handleAddRow = () => {
    const newRecord: PriceRecord = {
      key: Date.now().toString(),
      asset: null,
      closePrice: null,
      openPrice: null,
      highPrice: null,
      lowPrice: null
    };
    setData([...data, newRecord]);
  };

  // 删除行
  const handleDeleteRow = (key: string) => {
    if (data.length === 1) {
      message.warning('至少保留一行数据');
      return;
    }
    setData(data.filter(item => item.key !== key));
  };

  // 更新单元格数据
  const updateRecord = (key: string, field: keyof PriceRecord, value: any) => {
    setData(data.map(item => 
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  // 处理资产选择
  const handleAssetSelect = (key: string, assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      // 检查是否已经选择了该资产
      const isDuplicate = data.some(item => 
        item.key !== key && item.asset?.id === assetId
      );
      
      if (isDuplicate) {
        message.warning(`产品 ${asset.symbol} 已经在列表中`);
        return;
      }
      
      updateRecord(key, 'asset', asset);
    }
  };

  // 清空所有数据
  const handleClear = () => {
    setData([{
      key: Date.now().toString(),
      asset: null,
      closePrice: null,
      openPrice: null,
      highPrice: null,
      lowPrice: null
    }]);
    setSelectedDate(null);
    setSelectedAssetType(null);
    setAssets([]);
    form.resetFields();
  };

  // 验证数据
  const validateData = (): boolean => {
    if (!selectedDate) {
      message.error('请选择日期');
      return false;
    }

    const validRecords = data.filter(item => item.asset && item.closePrice !== null);
    
    if (validRecords.length === 0) {
      message.error('请至少填写一条完整的价格记录（产品和收盘价）');
      return false;
    }

    // 验证价格逻辑
    for (const record of validRecords) {
      if (record.highPrice !== null && record.lowPrice !== null) {
        if (record.highPrice < record.lowPrice) {
          message.error(`产品 ${record.asset!.symbol} 的最高价不能低于最低价`);
          return false;
        }
        
        if (record.closePrice! < record.lowPrice || record.closePrice! > record.highPrice) {
          message.error(`产品 ${record.asset!.symbol} 的收盘价应在最高价和最低价之间`);
          return false;
        }

        if (record.openPrice !== null && 
            (record.openPrice < record.lowPrice || record.openPrice > record.highPrice)) {
          message.error(`产品 ${record.asset!.symbol} 的开盘价应在最高价和最低价之间`);
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
      const validRecords = data.filter(item => item.asset && item.closePrice !== null);
      
      const updates = validRecords.map(record => ({
        assetId: record.asset!.id,
        priceDate: selectedDate!.format('YYYY-MM-DD'),
        closePrice: record.closePrice!,
        openPrice: record.openPrice || undefined,
        highPrice: record.highPrice || undefined,
        lowPrice: record.lowPrice || undefined,
        currency: record.asset!.currency,
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
        handleClear();
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
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: <span style={{ color: 'red' }}>* 产品</span>,
      dataIndex: 'asset',
      width: 250,
      render: (_: any, record: PriceRecord) => (
        <Select
          showSearch
          placeholder="选择产品"
          loading={loadingAssets}
          onChange={(value) => handleAssetSelect(record.key, value)}
          value={record.asset?.id}
          filterOption={(input, option) =>
            (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
          disabled={!selectedAssetType || loadingAssets}
          notFoundContent={loadingAssets ? <Spin size="small" /> : '暂无数据'}
        >
          {assets.map(asset => (
            <Option key={asset.id} value={asset.id}>
              {asset.symbol} - {asset.name}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: '币种',
      dataIndex: 'currency',
      width: 80,
      render: (_: any, record: PriceRecord) => (
        record.asset ? <Tag color="blue">{record.asset.currency}</Tag> : '-'
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
          disabled={!record.asset}
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
          disabled={!record.asset}
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
          disabled={!record.asset}
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
          disabled={!record.asset}
        />
      )
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: PriceRecord) => (
        <Popconfirm
          title="确定删除这条记录吗？"
          onConfirm={() => handleDeleteRow(record.key)}
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
      )
    }
  ];

  // 统计有效记录数
  const validRecordsCount = data.filter(item => item.asset && item.closePrice !== null).length;

  return (
    <div>
      <Card 
        title="多产品单日价格录入" 
        extra={
          <Space>
            <Statistic 
              title="有效记录" 
              value={validRecordsCount} 
              suffix={`/ ${data.length}`}
              valueStyle={{ fontSize: 16 }}
            />
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                label={<span style={{ fontWeight: 'bold' }}>选择日期</span>}
                required
              >
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                  placeholder="选择价格日期"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label={<span style={{ fontWeight: 'bold' }}>选择产品类型</span>}
                required
              >
                <Select
                  placeholder="选择产品类型"
                  loading={loadingTypes}
                  onChange={handleAssetTypeChange}
                  value={selectedAssetType}
                  style={{ width: '100%' }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {assetTypes.map(type => (
                    <Option key={type.id} value={type.id}>
                      {type.name || type.code}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={{ fontWeight: 'bold' }}>产品池</span>}>
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#f0f2f5', 
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  {loadingAssets ? (
                    <Spin size="small" />
                  ) : (
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                      {assets.length} 个产品
                    </span>
                  )}
                </div>
              </Form.Item>
            </Col>
          </Row>

          {selectedDate && (
            <Card 
              size="small" 
              style={{ marginBottom: 16, backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}
            >
              <Space size="large">
                <Statistic 
                  title="价格日期" 
                  value={selectedDate.format('YYYY年MM月DD日')} 
                  valueStyle={{ color: '#1890ff' }}
                />
                {selectedAssetType && (
                  <Statistic 
                    title="产品类型" 
                    value={assetTypes.find(t => t.id === selectedAssetType)?.name || '-'} 
                    valueStyle={{ color: '#52c41a' }}
                  />
                )}
              </Space>
            </Card>
          )}

          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button 
                type="dashed" 
                onClick={handleAddRow} 
                icon={<PlusOutlined />}
              >
                添加产品
              </Button>
              <Popconfirm
                title="确定清空所有数据吗？"
                onConfirm={handleClear}
                okText="确定"
                cancelText="取消"
              >
                <Button icon={<ClearOutlined />}>
                  清空
                </Button>
              </Popconfirm>
            </Space>
          </div>

          <Table 
            columns={columns} 
            dataSource={data} 
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 1000 }}
          />

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleClear}>
                取消
              </Button>
              <Button 
                type="primary" 
                onClick={handleSave}
                loading={loading}
                icon={<SaveOutlined />}
                disabled={!selectedDate || validRecordsCount === 0}
              >
                保存 ({validRecordsCount} 条记录)
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Card 
        size="small" 
        style={{ marginTop: 16 }}
        title="使用说明"
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>先选择日期，然后为多个产品录入该日期的价格</li>
          <li>收盘价为必填项，其他价格字段（开盘价、最高价、最低价）为可选</li>
          <li>如果填写了最高价和最低价，系统会自动验证价格逻辑</li>
          <li>同一产品不能重复添加</li>
          <li>点击【添加产品】可以添加更多产品</li>
          <li>数据会自动保存到数据库，如有重复日期会自动更新</li>
        </ul>
      </Card>
    </div>
  );
};

export default MultiAssetSingleDate;
