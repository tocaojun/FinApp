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
import AddDepositProductModal from './AddDepositProductModal';
import EditDepositProductModal from './EditDepositProductModal';
import { PortfolioService } from '../../services/PortfolioService';

const { Search } = Input;
const { Option } = Select;

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

interface TradingAccount {
  id: string;
  name: string;
  accountType: string;
}

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
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [editProductModalVisible, setEditProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DepositProduct | null>(null);
  const [form] = Form.useForm();
  
  // 新增：投资组合和交易账户状态
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [tradingAccounts, setTradingAccounts] = useState<TradingAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

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

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/deposits/products?${queryParams}`);
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
    fetchPortfolios(); // 新增：获取投资组合列表
  }, [filters]);

  // 新增：获取投资组合列表
  const fetchPortfolios = async () => {
    try {
      const data = await PortfolioService.getPortfolios();
      setPortfolios(data);
      
      // 如果有默认投资组合，自动加载其交易账户
      const defaultPortfolio = data.find(p => p.isDefault);
      if (defaultPortfolio) {
        fetchTradingAccounts(defaultPortfolio.id);
      }
    } catch (error) {
      console.error('获取投资组合失败:', error);
    }
  };

  // 新增：获取交易账户列表
  const fetchTradingAccounts = async (portfolioId: string) => {
    setLoadingAccounts(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/trading-accounts?portfolioId=${portfolioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTradingAccounts(data.data || []);
      }
    } catch (error) {
      console.error('获取交易账户失败:', error);
      setTradingAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

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
      width: 180,
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
            onClick={() => handleEdit(record)}
          >
            编辑
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
    
    // 设置默认值
    const defaultPortfolio = portfolios.find(p => p.isDefault);
    
    form.resetFields();
    form.setFieldsValue({
      portfolioId: defaultPortfolio?.id,
      depositAmount: product.minDepositAmount || 1000,
      startDate: dayjs(), // 默认为今天
      termMonths: product.termMonths,
      autoRenewal: product.autoRenewal
    });
    
    // 如果有默认投资组合，加载其交易账户
    if (defaultPortfolio) {
      fetchTradingAccounts(defaultPortfolio.id);
    }
  };

  // 处理编辑产品
  const handleEdit = (product: DepositProduct) => {
    setEditingProduct(product);
    setEditProductModalVisible(true);
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
      
      if (!selectedProduct) {
        message.error('请选择存款产品');
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('auth_token');

      // 准备交易数据
      const transactionData = {
        portfolioId: values.portfolioId,
        tradingAccountId: values.tradingAccountId,
        assetId: selectedProduct.assetId,
        transactionType: 'DEPOSIT',
        side: 'BUY',
        quantity: values.depositAmount,
        price: 1, // 存款价格为1
        fees: 0,
        currency: selectedProduct.currency,
        transactionDate: values.startDate.format('YYYY-MM-DD'),
        executedAt: values.startDate.format('YYYY-MM-DD HH:mm:ss'),
        notes: values.notes || `存入${selectedProduct.productName}`,
        tags: ['存款']
      };

      console.log('创建存款交易:', transactionData);

      // 调用交易API创建交易记录（会自动创建持仓）
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '创建交易失败');
      }

      const result = await response.json();
      console.log('交易创建成功:', result);

      message.success('存款成功！交易记录已创建，持仓已更新');
      setDepositModalVisible(false);
      form.resetFields();
      
      // 提示用户可以在哪里查看
      Modal.success({
        title: '存款成功',
        content: (
          <div>
            <p>✅ 存款金额: ¥{values.depositAmount.toLocaleString()}</p>
            <p>✅ 起存日期: {values.startDate.format('YYYY-MM-DD')}</p>
            {selectedProduct.depositType === 'TIME' && values.termMonths && (
              <p>✅ 到期日期: {values.startDate.add(values.termMonths, 'months').format('YYYY-MM-DD')}</p>
            )}
            <p style={{ marginTop: 16, color: '#666' }}>
              您可以在以下位置查看：
            </p>
            <ul style={{ color: '#666' }}>
              <li>交易记录 - 查看此次存款的交易详情</li>
              <li>投资组合 - 查看存款持仓和资产分布</li>
              <li>我的存款 - 查看所有存款产品的持仓情况</li>
            </ul>
          </div>
        ),
      });
    } catch (error) {
      console.error('Deposit submission error:', error);
      message.error(error instanceof Error ? error.message : '存款申请提交失败');
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
                清空筛选
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setAddProductModalVisible(true)}
              >
                添加产品
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
                name="portfolioId"
                label="投资组合"
                rules={[{ required: true, message: '请选择投资组合' }]}
                tooltip="选择要存入的投资组合"
              >
                <Select
                  placeholder="选择投资组合"
                  onChange={(portfolioId) => {
                    form.setFieldsValue({ tradingAccountId: undefined });
                    fetchTradingAccounts(portfolioId);
                  }}
                >
                  {portfolios.map(portfolio => (
                    <Option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                      {portfolio.isDefault && <Tag color="blue" style={{ marginLeft: 8 }}>默认</Tag>}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="tradingAccountId"
                label="交易账户"
                rules={[{ required: true, message: '请选择交易账户' }]}
                tooltip="选择用于存款的银行账户"
              >
                <Select
                  placeholder="选择交易账户"
                  loading={loadingAccounts}
                  disabled={!form.getFieldValue('portfolioId') || loadingAccounts}
                  notFoundContent={
                    form.getFieldValue('portfolioId') 
                      ? "该投资组合下暂无交易账户，请先创建" 
                      : "请先选择投资组合"
                  }
                >
                  {tradingAccounts.map(account => (
                    <Option key={account.id} value={account.id}>
                      {account.name} ({account.accountType})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

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

              <Form.Item
                name="startDate"
                label="起存日期"
                rules={[{ required: true, message: '请选择起存日期' }]}
                tooltip="存款开始计息的日期"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  placeholder="选择起存日期"
                  disabledDate={(current) => {
                    // 不能选择未来的日期
                    return current && current > dayjs().endOf('day');
                  }}
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

              {selectedProduct.depositType === 'TIME' && selectedProduct.termMonths && (
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => 
                    prevValues.startDate !== currentValues.startDate
                  }
                >
                  {({ getFieldValue }) => {
                    const startDate = getFieldValue('startDate');
                    const maturityDate = startDate 
                      ? dayjs(startDate).add(selectedProduct.termMonths!, 'months')
                      : null;
                    
                    return maturityDate ? (
                      <Form.Item label="到期日期">
                        <Input
                          value={maturityDate.format('YYYY-MM-DD')}
                          disabled
                          style={{ color: '#1890ff', fontWeight: 'bold' }}
                        />
                      </Form.Item>
                    ) : null;
                  }}
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

      {/* 添加产品Modal */}
      <AddDepositProductModal
        visible={addProductModalVisible}
        onCancel={() => setAddProductModalVisible(false)}
        onSuccess={() => {
          setAddProductModalVisible(false);
          fetchProducts(); // 刷新产品列表
        }}
      />

      <EditDepositProductModal
        visible={editProductModalVisible}
        product={editingProduct}
        onCancel={() => {
          setEditProductModalVisible(false);
          setEditingProduct(null);
        }}
        onSuccess={() => {
          setEditProductModalVisible(false);
          setEditingProduct(null);
          fetchProducts(); // 刷新产品列表
        }}
      />
    </div>
  );
};

export default DepositProductList;