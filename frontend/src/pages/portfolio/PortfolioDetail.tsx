import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Tabs, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  message,
  Breadcrumb,
  Spin
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  PlusOutlined,
  HomeOutlined,
  FolderOutlined
} from '@ant-design/icons';
import PortfolioSelector from '../../components/portfolio/PortfolioSelector';
import HoldingsTable from '../../components/portfolio/HoldingsTable';
import AccountsTab from '../../components/portfolio/AccountsTab';
import AllocationChart from '../../components/portfolio/AllocationChart';
import { Portfolio } from '../../types/portfolio';
import { PortfolioService } from '../../services/portfolioService';

const { Content } = Layout;
const { TabPane } = Tabs;

const PortfolioDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [activeTab, setActiveTab] = useState('holdings');
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadPortfolioDetail(id);
    }
  }, [id]);

  const loadPortfolioDetail = async (portfolioId: string) => {
    setLoading(true);
    try {
      const portfolio = await PortfolioService.getPortfolioById(portfolioId);
      setSelectedPortfolio(portfolio);
    } catch (error) {
      console.error('加载投资组合详情失败:', error);
      message.error('加载投资组合详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioChange = (portfolioId: string, portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    // 更新URL
    if (portfolioId !== id) {
      navigate(`/portfolio/${portfolioId}`, { replace: true });
    }
  };

  const handleCreatePortfolio = () => {
    form.resetFields();
    setCreateModalVisible(true);
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    form.setFieldsValue({
      name: portfolio.name,
      description: portfolio.description
    });
    setEditModalVisible(true);
  };

  const handleCreateModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      const newPortfolio = await PortfolioService.createPortfolio({
        name: values.name,
        description: values.description,
        totalValue: 0,
        totalCost: 0,
        totalReturn: 0,
        returnRate: 0
      });
      
      message.success('投资组合创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      
      // 跳转到新创建的投资组合
      navigate(`/portfolio/${newPortfolio.id}`);
    } catch (error) {
      console.error('创建投资组合失败:', error);
      message.error('创建投资组合失败');
    }
  };

  const handleEditModalOk = async () => {
    if (!editingPortfolio) return;
    
    try {
      const values = await form.validateFields();
      
      const updatedPortfolio = await PortfolioService.updatePortfolio(
        editingPortfolio.id,
        {
          name: values.name,
          description: values.description
        }
      );
      
      setSelectedPortfolio(updatedPortfolio);
      message.success('投资组合更新成功');
      setEditModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('更新投资组合失败:', error);
      message.error('更新投资组合失败');
    }
  };

  const handleBuyHolding = (holding: any) => {
    // 这里应该打开买入对话框
    message.info(`买入 ${holding.assetName} 功能开发中...`);
  };

  const handleSellHolding = (holding: any) => {
    // 这里应该打开卖出对话框
    message.info(`卖出 ${holding.assetName} 功能开发中...`);
  };

  const handleEditHolding = (holding: any) => {
    // 这里应该打开编辑持仓对话框
    message.info(`编辑 ${holding.assetName} 持仓功能开发中...`);
  };

  const handleDeleteHolding = (holding: any) => {
    // 这里应该删除持仓
    message.info(`删除 ${holding.assetName} 持仓功能开发中...`);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ marginBottom: 16 }}>
          <Breadcrumb>
            <Breadcrumb.Item>
              <HomeOutlined />
              <span style={{ marginLeft: 4 }}>首页</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <FolderOutlined />
              <span style={{ marginLeft: 4 }}>投资组合</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              {selectedPortfolio?.name || '详情'}
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/dashboard')}
            >
              返回仪表板
            </Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
            <PortfolioSelector
              selectedPortfolioId={selectedPortfolio?.id}
              onPortfolioChange={handlePortfolioChange}
              onCreatePortfolio={handleCreatePortfolio}
              onEditPortfolio={handleEditPortfolio}
            />

            {selectedPortfolio && (
              <div style={{ padding: '0 24px 24px' }}>
                <Tabs 
                  activeKey={activeTab} 
                  onChange={setActiveTab}
                  type="card"
                >
                  <TabPane tab="持仓明细" key="holdings">
                    <HoldingsTable
                      portfolioId={selectedPortfolio.id}
                      onBuy={handleBuyHolding}
                      onSell={handleSellHolding}
                      onEdit={handleEditHolding}
                      onDelete={handleDeleteHolding}
                    />
                  </TabPane>
                  
                  <TabPane tab="资产配置" key="allocation">
                    <AllocationChart portfolioId={selectedPortfolio.id} />
                  </TabPane>
                  
                  <TabPane tab="交易账户" key="accounts">
                    <AccountsTab portfolioId={selectedPortfolio.id} />
                  </TabPane>
                </Tabs>
              </div>
            )}
          </div>
        </Spin>

        {/* 创建投资组合模态框 */}
        <Modal
          title="创建投资组合"
          open={createModalVisible}
          onOk={handleCreateModalOk}
          onCancel={() => {
            setCreateModalVisible(false);
            form.resetFields();
          }}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label="投资组合名称"
              rules={[
                { required: true, message: '请输入投资组合名称' },
                { max: 50, message: '名称不能超过50个字符' }
              ]}
            >
              <Input placeholder="请输入投资组合名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
              rules={[
                { max: 200, message: '描述不能超过200个字符' }
              ]}
            >
              <Input.TextArea 
                rows={3}
                placeholder="请输入投资组合描述（可选）" 
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 编辑投资组合模态框 */}
        <Modal
          title="编辑投资组合"
          open={editModalVisible}
          onOk={handleEditModalOk}
          onCancel={() => {
            setEditModalVisible(false);
            form.resetFields();
          }}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label="投资组合名称"
              rules={[
                { required: true, message: '请输入投资组合名称' },
                { max: 50, message: '名称不能超过50个字符' }
              ]}
            >
              <Input placeholder="请输入投资组合名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
              rules={[
                { max: 200, message: '描述不能超过200个字符' }
              ]}
            >
              <Input.TextArea 
                rows={3}
                placeholder="请输入投资组合描述（可选）" 
              />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default PortfolioDetail;