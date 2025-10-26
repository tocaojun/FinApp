import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Collapse,
  Tag,
  Slider,
  Switch,
  Tooltip,
  Badge,
  TreeSelect,
  Rate,
  message
} from 'antd';
import { 
  getActiveLiquidityTags,
  type LiquidityTag 
} from '../../services/liquidityTagsApi';
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  SaveOutlined,
  HistoryOutlined,
  StarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { TreeNode } = TreeSelect;

export interface AssetFilterParams {
  // 基础筛选
  keyword?: string;
  assetTypeIds?: string[];
  marketIds?: string[];
  currencies?: string[];
  sectors?: string[];
  industries?: string[];
  
  // 状态筛选
  isActive?: boolean;
  isListed?: boolean;
  
  // 时间筛选
  listingDateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  lastUpdatedRange?: [dayjs.Dayjs, dayjs.Dayjs];
  
  // 风险和流动性
  riskLevels?: string[];
  liquidityTags?: string[];
  
  // 价格筛选
  priceRange?: [number, number];
  marketCapRange?: [number, number];
  volumeRange?: [number, number];
  
  // 评级筛选
  ratingRange?: [number, number];
  analystRating?: string[];
  
  // 高级筛选
  hasDescription?: boolean;
  hasDividend?: boolean;
  isESG?: boolean;
  
  // 排序
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface AdvancedAssetFilterProps {
  onFilter: (params: AssetFilterParams) => void;
  onReset: () => void;
  loading?: boolean;
  savedFilters?: Array<{
    id: string;
    name: string;
    params: AssetFilterParams;
  }>;
  onSaveFilter?: (name: string, params: AssetFilterParams) => void;
  onLoadFilter?: (params: AssetFilterParams) => void;
}

const AdvancedAssetFilter: React.FC<AdvancedAssetFilterProps> = ({
  onFilter,
  onReset,
  loading = false,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter
}) => {
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterCount, setFilterCount] = useState(0);
  const [saveFilterVisible, setSaveFilterVisible] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [liquidityTags, setLiquidityTags] = useState<LiquidityTag[]>([]);

  // 加载流动性标签
  useEffect(() => {
    const fetchLiquidityTags = async () => {
      try {
        const tags = await getActiveLiquidityTags();
        setLiquidityTags(tags);
      } catch (error) {
        console.error('加载流动性标签失败:', error);
      }
    };
    fetchLiquidityTags();
  }, []);

  // 模拟数据
  const assetTypes = [
    { id: 'stock', name: '股票', children: [
      { id: 'common-stock', name: '普通股' },
      { id: 'preferred-stock', name: '优先股' }
    ]},
    { id: 'bond', name: '债券', children: [
      { id: 'government-bond', name: '政府债券' },
      { id: 'corporate-bond', name: '企业债券' }
    ]},
    { id: 'fund', name: '基金', children: [
      { id: 'etf', name: 'ETF' },
      { id: 'mutual-fund', name: '共同基金' }
    ]},
    { id: 'crypto', name: '加密货币' },
    { id: 'commodity', name: '商品' }
  ];

  const markets = [
    { id: 'nasdaq', name: '纳斯达克', country: '美国' },
    { id: 'nyse', name: '纽约证券交易所', country: '美国' },
    { id: 'sse', name: '上海证券交易所', country: '中国' },
    { id: 'szse', name: '深圳证券交易所', country: '中国' },
    { id: 'hkex', name: '香港交易所', country: '香港' },
    { id: 'lse', name: '伦敦证券交易所', country: '英国' }
  ];

  const sectors = [
    { value: 'technology', label: '科技', color: '#1890ff' },
    { value: 'healthcare', label: '医疗保健', color: '#52c41a' },
    { value: 'finance', label: '金融', color: '#fa8c16' },
    { value: 'energy', label: '能源', color: '#722ed1' },
    { value: 'consumer', label: '消费', color: '#eb2f96' },
    { value: 'industrial', label: '工业', color: '#13c2c2' },
    { value: 'materials', label: '材料', color: '#faad14' },
    { value: 'utilities', label: '公用事业', color: '#a0d911' }
  ];

  const currencies = ['USD', 'CNY', 'HKD', 'EUR', 'GBP', 'JPY', 'KRW', 'SGD'];

  const riskLevels = [
    { value: 'LOW', label: '低风险', color: 'green' },
    { value: 'MEDIUM', label: '中风险', color: 'orange' },
    { value: 'HIGH', label: '高风险', color: 'red' },
    { value: 'VERY_HIGH', label: '极高风险', color: 'volcano' }
  ];

  // liquidityTags 现在从数据库加载，不再使用硬编码

  const analystRatings = [
    { value: 'STRONG_BUY', label: '强烈买入', color: 'green' },
    { value: 'BUY', label: '买入', color: 'lime' },
    { value: 'HOLD', label: '持有', color: 'orange' },
    { value: 'SELL', label: '卖出', color: 'red' },
    { value: 'STRONG_SELL', label: '强烈卖出', color: 'volcano' }
  ];

  const handleFilter = () => {
    const values = form.getFieldsValue();
    const params: AssetFilterParams = {
      ...values,
      listingDateRange: values.listingDateRange || undefined,
      lastUpdatedRange: values.lastUpdatedRange || undefined,
      priceRange: values.priceRange || undefined,
      marketCapRange: values.marketCapRange || undefined,
      volumeRange: values.volumeRange || undefined,
      ratingRange: values.ratingRange || undefined
    };

    // 计算活跃筛选器数量
    const count = Object.values(params).filter(value => 
      value !== undefined && value !== null && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
    
    setFilterCount(count);
    onFilter(params);
  };

  const handleReset = () => {
    form.resetFields();
    setActiveFilters([]);
    setFilterCount(0);
    onReset();
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    
    const values = form.getFieldsValue();
    const params: AssetFilterParams = { ...values };
    
    onSaveFilter?.(filterName, params);
    setSaveFilterVisible(false);
    setFilterName('');
  };

  const handleLoadFilter = (params: AssetFilterParams) => {
    form.setFieldsValue(params);
    onLoadFilter?.(params);
    handleFilter();
  };

  return (
    <Card 
      title={
        <Space>
          <FilterOutlined />
          高级资产筛选
          {filterCount > 0 && (
            <Badge count={filterCount} style={{ backgroundColor: '#52c41a' }} />
          )}
        </Space>
      }
      extra={
        <Space>
          {savedFilters.length > 0 && (
            <Select
              placeholder="加载已保存的筛选器"
              style={{ width: 200 }}
              onChange={(value) => {
                const filter = savedFilters.find(f => f.id === value);
                if (filter) handleLoadFilter(filter.params);
              }}
            >
              {savedFilters.map(filter => (
                <Option key={filter.id} value={filter.id}>
                  <HistoryOutlined /> {filter.name}
                </Option>
              ))}
            </Select>
          )}
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleFilter}
            loading={loading}
          >
            筛选
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Collapse 
          defaultActiveKey={['basic']}
          onChange={setActiveFilters}
        >
          {/* 基础筛选 */}
          <Panel header="基础筛选" key="basic">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="keyword" label="关键词搜索">
                  <Input 
                    placeholder="搜索资产代码、名称或描述"
                    prefix={<SearchOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="assetTypeIds" label="资产类型">
                  <TreeSelect
                    multiple
                    placeholder="选择资产类型"
                    allowClear
                    treeDefaultExpandAll
                  >
                    {assetTypes.map(type => (
                      <TreeNode key={type.id} value={type.id} title={type.name}>
                        {type.children?.map(child => (
                          <TreeNode key={child.id} value={child.id} title={child.name} />
                        ))}
                      </TreeNode>
                    ))}
                  </TreeSelect>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="marketIds" label="交易市场">
                  <Select
                    mode="multiple"
                    placeholder="选择交易市场"
                    allowClear
                    optionFilterProp="children"
                  >
                    {markets.map(market => (
                      <Option key={market.id} value={market.id}>
                        {market.name} ({market.country})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="currencies" label="货币">
                  <Select
                    mode="multiple"
                    placeholder="选择货币"
                    allowClear
                  >
                    {currencies.map(currency => (
                      <Option key={currency} value={currency}>{currency}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="sectors" label="行业板块">
                  <Select
                    mode="multiple"
                    placeholder="选择行业板块"
                    allowClear
                  >
                    {sectors.map(sector => (
                      <Option key={sector.value} value={sector.value}>
                        <Tag color={sector.color}>{sector.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="riskLevels" label="风险等级">
                  <Select
                    mode="multiple"
                    placeholder="选择风险等级"
                    allowClear
                  >
                    {riskLevels.map(level => (
                      <Option key={level.value} value={level.value}>
                        <Tag color={level.color}>{level.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="liquidityTags" label="流动性">
                  <Select
                    mode="multiple"
                    placeholder="选择流动性"
                    allowClear
                  >
                    {liquidityTags.map(tag => (
                      <Option key={tag.id} value={tag.id}>
                        <Tag color={tag.color}>{tag.name}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* 状态筛选 */}
          <Panel header="状态筛选" key="status">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="isActive" label="资产状态" valuePropName="checked">
                  <Switch checkedChildren="活跃" unCheckedChildren="全部" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="isListed" label="上市状态" valuePropName="checked">
                  <Switch checkedChildren="已上市" unCheckedChildren="全部" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="isESG" label="ESG投资" valuePropName="checked">
                  <Switch checkedChildren="ESG" unCheckedChildren="全部" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="listingDateRange" label="上市日期范围">
                  <RangePicker
                    style={{ width: '100%' }}
                    placeholder={['开始日期', '结束日期']}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lastUpdatedRange" label="最后更新时间">
                  <RangePicker
                    showTime
                    style={{ width: '100%' }}
                    placeholder={['开始时间', '结束时间']}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* 价格和市值筛选 */}
          <Panel header="价格和市值筛选" key="price">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="priceRange" label="价格范围">
                  <Slider
                    range
                    min={0}
                    max={1000}
                    step={10}
                    marks={{
                      0: '$0',
                      250: '$250',
                      500: '$500',
                      750: '$750',
                      1000: '$1000+'
                    }}
                    tooltip={{
                      formatter: (value) => `$${value}`
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="marketCapRange" label="市值范围 (亿美元)">
                  <Slider
                    range
                    min={0}
                    max={10000}
                    step={100}
                    marks={{
                      0: '0',
                      2500: '2.5K',
                      5000: '5K',
                      7500: '7.5K',
                      10000: '1万+'
                    }}
                    tooltip={{
                      formatter: (value) => `${value}亿美元`
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="volumeRange" label="成交量范围 (万股)">
                  <Space.Compact style={{ width: '100%' }}>
                    <InputNumber
                      placeholder="最小成交量"
                      style={{ width: '50%' }}
                      min={0}
                      formatter={value => `${value}万`}
                      parser={value => value!.replace('万', '')}
                    />
                    <InputNumber
                      placeholder="最大成交量"
                      style={{ width: '50%' }}
                      min={0}
                      formatter={value => `${value}万`}
                      parser={value => value!.replace('万', '')}
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="ratingRange" label="评级范围">
                  <Slider
                    range
                    min={1}
                    max={5}
                    step={0.5}
                    marks={{
                      1: '1星',
                      2: '2星',
                      3: '3星',
                      4: '4星',
                      5: '5星'
                    }}
                    tooltip={{
                      formatter: (value) => (
                        <div>
                          <Rate disabled defaultValue={value} />
                          <div>{value}星</div>
                        </div>
                      )
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* 分析师评级 */}
          <Panel header="分析师评级" key="rating">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="analystRating" label="分析师建议">
                  <Select
                    mode="multiple"
                    placeholder="选择分析师建议"
                    allowClear
                  >
                    {analystRatings.map(rating => (
                      <Option key={rating.value} value={rating.value}>
                        <Tag color={rating.color}>{rating.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="industries" label="细分行业">
                  <Select
                    mode="tags"
                    placeholder="选择或输入细分行业"
                    allowClear
                  >
                    <Option value="software">软件</Option>
                    <Option value="hardware">硬件</Option>
                    <Option value="biotech">生物技术</Option>
                    <Option value="pharma">制药</Option>
                    <Option value="banking">银行</Option>
                    <Option value="insurance">保险</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* 高级筛选 */}
          <Panel header="高级筛选" key="advanced">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="hasDescription" label="包含描述" valuePropName="checked">
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="hasDividend" label="支付股息" valuePropName="checked">
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="isESG" label="ESG合规" valuePropName="checked">
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* 排序设置 */}
          <Panel header="排序设置" key="sort">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="sortBy" label="排序字段" initialValue="updatedAt">
                  <Select placeholder="选择排序字段">
                    <Option value="symbol">资产代码</Option>
                    <Option value="name">资产名称</Option>
                    <Option value="price">当前价格</Option>
                    <Option value="marketCap">市值</Option>
                    <Option value="volume">成交量</Option>
                    <Option value="listingDate">上市日期</Option>
                    <Option value="updatedAt">更新时间</Option>
                    <Option value="rating">评级</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="sortOrder" label="排序方向" initialValue="DESC">
                  <Select placeholder="选择排序方向">
                    <Option value="ASC">升序</Option>
                    <Option value="DESC">降序</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Panel>
        </Collapse>

        {/* 保存筛选器 */}
        {onSaveFilter && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            {saveFilterVisible ? (
              <Space>
                <Input
                  placeholder="输入筛选器名称"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  style={{ width: 200 }}
                />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveFilter}
                  disabled={!filterName.trim()}
                >
                  保存
                </Button>
                <Button onClick={() => setSaveFilterVisible(false)}>
                  取消
                </Button>
              </Space>
            ) : (
              <Button
                icon={<SaveOutlined />}
                onClick={() => setSaveFilterVisible(true)}
              >
                保存当前筛选器
              </Button>
            )}
          </div>
        )}
      </Form>
    </Card>
  );
};

export default AdvancedAssetFilter;