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
  Badge
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  SaveOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

export interface TransactionFilterParams {
  // 基础筛选
  keyword?: string;
  portfolioIds?: string[];
  assetIds?: string[];
  transactionTypes?: string[];
  sides?: string[];
  statuses?: string[];
  
  // 时间筛选
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  executionTimeRange?: [dayjs.Dayjs, dayjs.Dayjs];
  
  // 金额筛选
  amountRange?: [number, number];
  quantityRange?: [number, number];
  priceRange?: [number, number];
  feeRange?: [number, number];
  
  // 高级筛选
  tags?: string[];
  hasNotes?: boolean;
  riskLevel?: string[];
  profitLossRange?: [number, number];
  
  // 排序
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface AdvancedTransactionFilterProps {
  onFilter: (params: TransactionFilterParams) => void;
  onReset: () => void;
  loading?: boolean;
  savedFilters?: Array<{
    id: string;
    name: string;
    params: TransactionFilterParams;
  }>;
  onSaveFilter?: (name: string, params: TransactionFilterParams) => void;
  onLoadFilter?: (params: TransactionFilterParams) => void;
}

const AdvancedTransactionFilter: React.FC<AdvancedTransactionFilterProps> = ({
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

  // 模拟数据
  const portfolios = [
    { id: 'p1', name: '主投资组合' },
    { id: 'p2', name: '备用组合' },
    { id: 'p3', name: '高风险组合' }
  ];

  const assets = [
    { id: 'a1', symbol: 'AAPL', name: '苹果公司' },
    { id: 'a2', symbol: 'MSFT', name: '微软公司' },
    { id: 'a3', symbol: 'GOOGL', name: '谷歌' },
    { id: 'a4', symbol: 'TSLA', name: '特斯拉' }
  ];

  const transactionTypes = [
    { value: 'BUY', label: '买入', color: 'green' },
    { value: 'SELL', label: '卖出', color: 'red' },
    { value: 'DEPOSIT', label: '存款', color: 'blue' },
    { value: 'WITHDRAWAL', label: '取款', color: 'orange' },
    { value: 'DIVIDEND', label: '分红', color: 'purple' },
    { value: 'INTEREST', label: '利息', color: 'cyan' }
  ];

  const statusTypes = [
    { value: 'PENDING', label: '待执行', color: 'processing' },
    { value: 'EXECUTED', label: '已执行', color: 'success' },
    { value: 'CANCELLED', label: '已取消', color: 'default' },
    { value: 'FAILED', label: '失败', color: 'error' }
  ];

  const commonTags = [
    '科技股', '长期持有', '短期交易', '定期投资', 
    '获利了结', '止损', '分散投资', '价值投资'
  ];

  const handleFilter = () => {
    const values = form.getFieldsValue();
    const params: TransactionFilterParams = {
      ...values,
      dateRange: values.dateRange || undefined,
      executionTimeRange: values.executionTimeRange || undefined,
      amountRange: values.amountRange || undefined,
      quantityRange: values.quantityRange || undefined,
      priceRange: values.priceRange || undefined,
      feeRange: values.feeRange || undefined,
      profitLossRange: values.profitLossRange || undefined
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
    const params: TransactionFilterParams = { ...values };
    
    onSaveFilter?.(filterName, params);
    setSaveFilterVisible(false);
    setFilterName('');
  };

  const handleLoadFilter = (params: TransactionFilterParams) => {
    form.setFieldsValue(params);
    onLoadFilter?.(params);
    handleFilter();
  };

  return (
    <Card 
      title={
        <Space>
          <FilterOutlined />
          高级筛选
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
                    placeholder="搜索资产名称、代码或备注"
                    prefix={<SearchOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="portfolioIds" label="投资组合">
                  <Select
                    mode="multiple"
                    placeholder="选择投资组合"
                    allowClear
                  >
                    {portfolios.map(portfolio => (
                      <Option key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="assetIds" label="资产">
                  <Select
                    mode="multiple"
                    placeholder="选择资产"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {assets.map(asset => (
                      <Option key={asset.id} value={asset.id}>
                        {asset.symbol} - {asset.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="transactionTypes" label="交易类型">
                  <Select
                    mode="multiple"
                    placeholder="选择交易类型"
                    allowClear
                  >
                    {transactionTypes.map(type => (
                      <Option key={type.value} value={type.value}>
                        <Tag color={type.color}>{type.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="sides" label="交易方向">
                  <Select
                    mode="multiple"
                    placeholder="选择交易方向"
                    allowClear
                  >
                    <Option value="LONG">多头</Option>
                    <Option value="SHORT">空头</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="statuses" label="交易状态">
                  <Select
                    mode="multiple"
                    placeholder="选择交易状态"
                    allowClear
                  >
                    {statusTypes.map(status => (
                      <Option key={status.value} value={status.value}>
                        <Badge status={status.color as any} text={status.label} />
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dateRange" label="交易日期范围">
                  <RangePicker
                    style={{ width: '100%' }}
                    placeholder={['开始日期', '结束日期']}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* 金额筛选 */}
          <Panel header="金额筛选" key="amount">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="amountRange" label="交易金额范围">
                  <Slider
                    range
                    min={0}
                    max={1000000}
                    step={1000}
                    marks={{
                      0: '¥0',
                      250000: '¥25万',
                      500000: '¥50万',
                      750000: '¥75万',
                      1000000: '¥100万+'
                    }}
                    tooltip={{
                      formatter: (value) => `¥${value?.toLocaleString()}`
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="quantityRange" label="交易数量范围">
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
                      10000: '10K+'
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="priceRange" label="价格范围">
                  <Space.Compact style={{ width: '100%' }}>
                    <InputNumber
                      placeholder="最低价格"
                      style={{ width: '50%' }}
                      min={0}
                      precision={2}
                    />
                    <InputNumber
                      placeholder="最高价格"
                      style={{ width: '50%' }}
                      min={0}
                      precision={2}
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="feeRange" label="手续费范围">
                  <Space.Compact style={{ width: '100%' }}>
                    <InputNumber
                      placeholder="最低手续费"
                      style={{ width: '50%' }}
                      min={0}
                      precision={2}
                    />
                    <InputNumber
                      placeholder="最高手续费"
                      style={{ width: '50%' }}
                      min={0}
                      precision={2}
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* 高级筛选 */}
          <Panel header="高级筛选" key="advanced">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="tags" label="标签">
                  <Select
                    mode="tags"
                    placeholder="选择或输入标签"
                    allowClear
                  >
                    {commonTags.map(tag => (
                      <Option key={tag} value={tag}>{tag}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="hasNotes" label="包含备注" valuePropName="checked">
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="riskLevel" label="风险等级">
                  <Select
                    mode="multiple"
                    placeholder="选择风险等级"
                    allowClear
                  >
                    <Option value="LOW">低风险</Option>
                    <Option value="MEDIUM">中风险</Option>
                    <Option value="HIGH">高风险</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="profitLossRange" label="盈亏范围">
                  <Slider
                    range
                    min={-100000}
                    max={100000}
                    step={1000}
                    marks={{
                      '-100000': '-¥10万',
                      '-50000': '-¥5万',
                      0: '¥0',
                      50000: '+¥5万',
                      100000: '+¥10万'
                    }}
                    tooltip={{
                      formatter: (value) => {
                        const sign = (value || 0) >= 0 ? '+' : '';
                        return `${sign}¥${value?.toLocaleString()}`;
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="executionTimeRange" label="执行时间范围">
                  <RangePicker
                    showTime
                    style={{ width: '100%' }}
                    placeholder={['开始时间', '结束时间']}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* 排序设置 */}
          <Panel header="排序设置" key="sort">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="sortBy" label="排序字段" initialValue="executedAt">
                  <Select placeholder="选择排序字段">
                    <Option value="executedAt">执行时间</Option>
                    <Option value="amount">交易金额</Option>
                    <Option value="quantity">交易数量</Option>
                    <Option value="price">交易价格</Option>
                    <Option value="fee">手续费</Option>
                    <Option value="createdAt">创建时间</Option>
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

export default AdvancedTransactionFilter;