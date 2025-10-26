import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  message,
  Row,
  Col,
  Statistic,
  Typography,
  Empty,
  Spin,
  Checkbox,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  FolderOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  StarOutlined,
  StarFilled,
  MenuOutlined
} from '@ant-design/icons';
import { Portfolio } from '../../types/portfolio';
import { PortfolioService } from '../../services/portfolioService';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const PortfolioList: React.FC = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [sortMode, setSortMode] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const data = await PortfolioService.getPortfolios();
      setPortfolios(data);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
      message.error('加载投资组合失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (values: any) => {
    try {
      await PortfolioService.createPortfolio(values);
      message.success('投资组合创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadPortfolios();
    } catch (error) {
      console.error('Failed to create portfolio:', error);
      message.error('创建投资组合失败');
    }
  };

  const handleSetDefault = async (portfolioId: string) => {
    try {
      await PortfolioService.updatePortfolio(portfolioId, { isDefault: true });
      message.success('默认投资组合设置成功');
      loadPortfolios();
    } catch (error) {
      console.error('Failed to set default portfolio:', error);
      message.error('设置默认投资组合失败');
    }
  };

  const movePortfolio = (fromIndex: number, toIndex: number) => {
    const newPortfolios = [...portfolios];
    const [movedItem] = newPortfolios.splice(fromIndex, 1);
    newPortfolios.splice(toIndex, 0, movedItem);
    
    // 更新排序顺序
    const updatedPortfolios = newPortfolios.map((portfolio, index) => ({
      ...portfolio,
      sortOrder: index
    }));
    
    setPortfolios(updatedPortfolios);
  };

  const saveSortOrder = async () => {
    try {
      const portfolioOrders = portfolios.map((portfolio, index) => ({
        id: portfolio.id,
        sortOrder: index
      }));
      
      await PortfolioService.updatePortfolioSortOrder(portfolioOrders);
      message.success('投资组合排序已保存');
      setSortMode(false);
      loadPortfolios();
    } catch (error) {
      console.error('Failed to save sort order:', error);
      message.error('保存排序失败');
    }
  };

  const cancelSort = () => {
    setSortMode(false);
    loadPortfolios(); // 重新加载原始顺序
  };

  const formatCurrency = (amount: number, currency: string = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Content style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <Spin size="large" />
        </div>
      </Content>
    );
  }

  return (
    <Content style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <FolderOutlined style={{ marginRight: '8px' }} />
          我的投资组合
        </Title>
        <Space>
          {sortMode ? (
            <>
              <Button onClick={cancelSort}>
                取消
              </Button>
              <Button type="primary" onClick={saveSortOrder}>
                保存排序
              </Button>
            </>
          ) : (
            <>
              <Button 
                icon={<MenuOutlined />}
                onClick={() => setSortMode(true)}
                disabled={portfolios.length <= 1}
              >
                排序
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                创建投资组合
              </Button>
            </>
          )}
        </Space>
      </div>

      {portfolios.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无投资组合"
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建第一个投资组合
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {portfolios.map((portfolio, index) => (
            <Col xs={24} sm={12} lg={8} key={portfolio.id}>
              <Card
                hoverable={!sortMode}
                onClick={sortMode ? undefined : () => navigate(`/portfolio/${portfolio.id}`)}
                style={{ 
                  height: '100%',
                  cursor: sortMode ? 'move' : 'pointer',
                  border: portfolio.isDefault ? '2px solid #1890ff' : undefined
                }}
                bodyStyle={{ padding: '20px' }}
                extra={
                  sortMode ? (
                    <Space>
                      <Button 
                        size="small" 
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => movePortfolio(index, index - 1)}
                      />
                      <Button 
                        size="small" 
                        icon={<ArrowDownOutlined />}
                        disabled={index === portfolios.length - 1}
                        onClick={() => movePortfolio(index, index + 1)}
                      />
                    </Space>
                  ) : (
                    portfolio.isDefault ? (
                      <Tooltip title="默认投资组合">
                        <StarFilled style={{ color: '#1890ff' }} />
                      </Tooltip>
                    ) : (
                      <Tooltip title="设为默认">
                        <Button 
                          type="text" 
                          size="small"
                          icon={<StarOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(portfolio.id);
                          }}
                        />
                      </Tooltip>
                    )
                  )
                }
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <Title level={4} style={{ margin: 0, flex: 1 }}>
                      {portfolio.name || '未命名投资组合'}
                    </Title>
                    {sortMode && (
                      <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                        #{index + 1}
                      </Typography.Text>
                    )}
                  </div>
                  <Typography.Text type="secondary">
                    {portfolio.description || '暂无描述'}
                  </Typography.Text>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="总价值"
                      value={portfolio.totalValue || 0}
                      formatter={(value) => formatCurrency(Number(value), portfolio.baseCurrency)}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="收益率"
                      value={portfolio.totalGainLossPercentage || 0}
                      formatter={(value) => formatPercentage(Number(value))}
                      valueStyle={{ 
                        fontSize: '16px',
                        color: (portfolio.totalGainLossPercentage || 0) >= 0 ? '#3f8600' : '#cf1322'
                      }}
                      prefix={
                        (portfolio.totalGainLossPercentage || 0) >= 0 ? 
                        <RiseOutlined /> : 
                        <FallOutlined />
                      }
                    />
                  </Col>
                </Row>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                  <Space>
                    <Typography.Text type="secondary">
                      基础货币: {portfolio.baseCurrency}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      创建时间: {new Date(portfolio.createdAt).toLocaleDateString()}
                    </Typography.Text>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="创建投资组合"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreatePortfolio}
        >
          <Form.Item
            name="name"
            label="投资组合名称"
            rules={[{ required: true, message: '请输入投资组合名称' }]}
          >
            <Input placeholder="例如：我的股票投资组合" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea 
              rows={3}
              placeholder="简单描述这个投资组合的投资策略或目标"
            />
          </Form.Item>

          <Form.Item
            name="baseCurrency"
            label="基础货币"
            initialValue="CNY"
            rules={[{ required: true, message: '请选择基础货币' }]}
          >
            <Select>
              <Option value="CNY">人民币 (CNY)</Option>
              <Option value="USD">美元 (USD)</Option>
              <Option value="EUR">欧元 (EUR)</Option>
              <Option value="GBP">英镑 (GBP)</Option>
              <Option value="JPY">日元 (JPY)</Option>
              <Option value="HKD">港币 (HKD)</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Content>
  );
};

export default PortfolioList;