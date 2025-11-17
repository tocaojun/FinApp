import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Tooltip,
  message,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Switch
} from 'antd';
import {
  BankOutlined,
  CalendarOutlined,
  PercentageOutlined,
  SafetyOutlined,
  InfoCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

interface DepositProduct {
  assetId: string;
  symbol: string;
  productName: string;
  currency: string;
  depositType: 'DEMAND' | 'TIME' | 'NOTICE' | 'STRUCTURED';
  bankName: string;
  interestRate: number;
  interestRatePercent: number;
  rateType: 'FIXED' | 'FLOATING';
  termMonths?: number;
  maturityDate?: string;
  autoRenewal: boolean;
  earlyWithdrawalAllowed: boolean;
  earlyWithdrawalPenaltyRate?: number;
  minDepositAmount?: number;
  maxDepositAmount?: number;
  depositInsuranceCovered: boolean;
  insuranceAmount?: number;
  effectiveAnnualRatePercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DepositFilters {
  bank?: string;
  depositType?: string;
  minRate?: number;
  maxRate?: number;
}

const DepositProductList: React.FC = () => {
  const [products, setProducts] = useState<DepositProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<DepositFilters>({});
  const [selectedProduct, setSelectedProduct] = useState<DepositProduct | null>(null);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 获取存款产品列表
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/deposits/products?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        message.error('获取存款产品失败');
      }
    } catch (error) {
      console.error('Error fetching deposit products:', error);
      message.error('获取存款产品失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  // 存款类型标签颜色
  const getDepositTypeColor = (type: string) => {
    const colors = {
      DEMAND: 'blue',
      TIME: 'green',
      NOTICE: 'orange',
      STRUCTURED: 'purple'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  // 存款类型中文名
  const getDepositTypeName = (type: string) => {
    const names = {
      DEMAND: '活期存款',
      TIME: '定期存款',
      NOTICE: '通知存款',
      STRUCTURED: '结构性存款'
    };
    return names[type as keyof typeof names] || type;
  };

  // 表格列定义
  const columns: ColumnsType<DepositProduct> = [
    {
      title: '产品信息',
      key: 'product',
      width: 280,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {record.productName}
          </div>
          <Space>
            <BankOutlined />
            <span>{record.bankName}</span>
          </Space>
          <Tag color={getDepositTypeColor(record.depositType)}>
            {getDepositTypeName(record.depositType)}
          </Tag>
        </Space>
      ),
    },
    {
      title: '利率信息',
      key: 'rate',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
            {record.interestRatePercent.toFixed(2)}%
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            年利率
          </div>
          {record.effectiveAnnualRatePercent !== record.interestRatePercent && (
            <div style={{ fontSize: '12px', color: '#1890ff' }}>
              实际年化: {record.effectiveAnnualRatePercent.toFixed(2)}%
            </div>
          )}
        </Space>
      ),
    },
    {
      title: '期限',
      dataIndex: 'termMonths',
      key: 'term',
      width: 100,
      render: (termMonths) => (
        <Space>
          <CalendarOutlined />
          {termMonths ? `${termMonths}个月` : '活期'}
        </Space>
      ),
    },
    {
      title: '起存金额',
      dataIndex: 'minDepositAmount',
      key: 'minAmount',
      width: 120,
      render: (amount) => (
        amount ? `¥${amount.toLocaleString()}` : '无限制'
      ),
    },
    {
      title: '特性',
      key: 'features',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <SafetyOutlined style={{ color: record.depositInsuranceCovered ? '#52c41a' : '#ccc' }} />
            <span style={{ color: record.depositInsuranceCovered ? '#52c41a' : '#ccc' }}>
              存款保险
            </span>
          </Space>
          {record.earlyWithdrawalAllowed && (
            <Tag color="blue">可提前支取</Tag>
          )}
          {record.autoRenewal && (
            <Tag color="green">自动续存</Tag>
          )}
          {record.rateType === 'FLOATING' && (
            <Tag color="orange">浮动利率</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handleDeposit(record)}
          >
            存入
          </Button>
          <Button
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  // 处理存款操作
  const handleDeposit = (product: DepositProduct) => {
    setSelectedProduct(product);
    setDepositModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      depositAmount: product.minDepositAmount || 1000,
      termMonths: product.termMonths,
      autoRenewal: product.autoRenewal
    });
  };

  // 查看产品详情
  const handleViewDetails = (product: DepositProduct) => {
    Modal.info({
      title: '存款产品详情',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic title="产品名称" value={product.productName} />
            </Col>
            <Col span={12}>
              <Statistic title="银行" value={product.bankName} />
            </Col>
            <Col span={12}>
              <Statistic 
                title="年利率" 
                value={product.interestRatePercent} 
                suffix="%" 
                precision={2}
              />
            </Col>
            <Col span={12}>
              <Statistic 
                title="实际年化收益率" 
                value={product.effectiveAnnualRatePercent} 
                suffix="%" 
                precision={2}
              />
            </Col>
            {product.termMonths && (
              <Col span={12}>
                <Statistic title="存款期限" value={product.termMonths} suffix="个月" />
              </Col>
            )}
            {product.minDepositAmount && (
              <Col span={12}>
                <Statistic 
                  title="起存金额" 
                  value={product.minDepositAmount} 
                  prefix="¥" 
                />
              </Col>
            )}
            {product.earlyWithdrawalPenaltyRate && (
              <Col span={12}>
                <Statistic 
                  title="提前支取罚息率" 
                  value={product.earlyWithdrawalPenaltyRate * 100} 
                  suffix="%" 
                  precision={2}
                />
              </Col>
            )}
            <Col span={12}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>产品特性</div>
                <Space direction="vertical">
                  <div>存款保险: {product.depositInsuranceCovered ? '✓' : '✗'}</div>
                  <div>提前支取: {product.earlyWithdrawalAllowed ? '✓' : '✗'}</div>
                  <div>自动续存: {product.autoRenewal ? '✓' : '✗'}</div>
                  <div>利率类型: {product.rateType === 'FIXED' ? '固定' : '浮动'}</div>
                </Space>
              </div>
            </Col>
          </Row>
        </div>
      ),
    });
  };

  // 提交存款
  const handleDepositSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 这里应该调用存款API
      console.log('Deposit values:', {
        product: selectedProduct,
        ...values
      });

      message.success('存款申请提交成功');
      setDepositModalVisible(false);
    } catch (error) {
      console.error('Deposit submission error:', error);
      message.error('存款申请提交失败');
    }
  };

  return (
    <div>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Search
              placeholder="搜索银行名称"
              onSearch={(value) => setFilters({ ...filters, bank: value })}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="存款类型"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setFilters({ ...filters, depositType: value })}
            >
              <Option value="DEMAND">活期存款</Option>
              <Option value="TIME">定期存款</Option>
              <Option value="NOTICE">通知存款</Option>
              <Option value="STRUCTURED">结构性存款</Option>
            </Select>
          </Col>
          <Col span={4}>
            <InputNumber
              placeholder="最低利率%"
              style={{ width: '100%' }}
              min={0}
              max={10}
              step={0.1}
              onChange={(value) => setFilters({ ...filters, minRate: value || undefined })}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              placeholder="最高利率%"
              style={{ width: '100%' }}
              min={0}
              max={10}
              step={0.1}
              onChange={(value) => setFilters({ ...filters, maxRate: value || undefined })}
            />
          </Col>
          <Col span={6}>
            <Space>
              <Button onClick={() => setFilters({})}>
                清除筛选
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>
                添加自定义产品
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="assetId"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个产品`,
          }}
        />
      </Card>

      {/* 存款申请模态框 */}
      <Modal
        title={`存入 - ${selectedProduct?.productName}`}
        open={depositModalVisible}
        onOk={handleDepositSubmit}
        onCancel={() => setDepositModalVisible(false)}
        width={600}
      >
        {selectedProduct && (
          <div>
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <strong>银行:</strong> {selectedProduct.bankName}
                </Col>
                <Col span={12}>
                  <strong>年利率:</strong> <span style={{ color: '#52c41a' }}>{selectedProduct.interestRatePercent.toFixed(2)}%</span>
                </Col>
                {selectedProduct.termMonths && (
                  <Col span={12}>
                    <strong>存款期限:</strong> {selectedProduct.termMonths}个月
                  </Col>
                )}
                <Col span={12}>
                  <strong>起存金额:</strong> ¥{selectedProduct.minDepositAmount?.toLocaleString() || '无限制'}
                </Col>
              </Row>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="depositAmount"
                label="存款金额"
                rules={[
                  { required: true, message: '请输入存款金额' },
                  { 
                    type: 'number', 
                    min: selectedProduct.minDepositAmount || 1, 
                    message: `最低存款金额为 ¥${selectedProduct.minDepositAmount?.toLocaleString() || 1}` 
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/¥\s?|(,*)/g, '')}
                  min={selectedProduct.minDepositAmount || 1}
                  max={selectedProduct.maxDepositAmount}
                  step={selectedProduct.minDepositAmount || 100}
                />
              </Form.Item>

              {selectedProduct.depositType === 'TIME' && (
                <Form.Item
                  name="termMonths"
                  label="存款期限"
                >
                  <Select disabled>
                    <Option value={selectedProduct.termMonths}>
                      {selectedProduct.termMonths}个月
                    </Option>
                  </Select>
                </Form.Item>
              )}

              {selectedProduct.depositType === 'TIME' && (
                <Form.Item
                  name="autoRenewal"
                  label="到期处理"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="自动续存" 
                    unCheckedChildren="手动处理"
                  />
                </Form.Item>
              )}

              <Form.Item
                name="notes"
                label="备注"
              >
                <Input.TextArea rows={3} placeholder="可选：添加备注信息" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DepositProductList;