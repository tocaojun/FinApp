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
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  TagOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AssetService, AssetType } from '../../services/assetService';

const { Option } = Select;

interface ProductCategoryManagerProps {
  visible: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const ProductCategoryManager: React.FC<ProductCategoryManagerProps> = ({
  visible,
  onClose,
  onRefresh
}) => {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<AssetType | null>(null);
  const [form] = Form.useForm();

  // 分类统计
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});

  const fetchAssetTypes = async () => {
    setLoading(true);
    try {
      const types = await AssetService.getAssetTypes();
      setAssetTypes(types);
      
      // 计算分类统计
      const stats: Record<string, number> = {};
      types.forEach(type => {
        stats[type.category] = (stats[type.category] || 0) + 1;
      });
      setCategoryStats(stats);
    } catch (error) {
      message.error('获取产品分类失败');
      console.error('Error fetching asset types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (type: AssetType) => {
    setEditingType(type);
    form.setFieldsValue(type);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // 先检查分类使用情况
      const usage = await AssetService.getAssetTypeUsage(id);
      
      if (usage.usageCount > 0) {
        // 显示详细的使用情况
        Modal.error({
          title: '无法删除分类',
          content: (
            <div>
              <p>该分类正在被 <strong>{usage.usageCount}</strong> 个资产使用，无法直接删除。</p>
              <p>使用该分类的资产包括：</p>
              <ul style={{ maxHeight: '200px', overflow: 'auto', marginTop: '8px' }}>
                {usage.assets.slice(0, 10).map(asset => (
                  <li key={asset.id}>{asset.symbol} - {asset.name}</li>
                ))}
                {usage.assets.length > 10 && (
                  <li>... 还有 {usage.assets.length - 10} 个资产</li>
                )}
              </ul>
              <p style={{ marginTop: '12px', color: '#666' }}>
                请先将这些资产改为其他分类，或者联系管理员进行处理。
              </p>
            </div>
          ),
        });
        return;
      }

      // 如果没有被使用，执行删除
      await AssetService.deleteAssetType(id);
      message.success('分类删除成功');
      fetchAssetTypes();
      onRefresh?.();
    } catch (error: any) {
      console.error('删除分类失败:', error);
      
      // 根据错误类型显示不同的错误信息
      if (error.response?.data?.code === 'ASSET_TYPE_IN_USE') {
        message.error('删除失败：该分类正在被资产使用，请先将相关资产改为其他分类');
      } else if (error.response?.status === 404) {
        message.error('删除失败：分类不存在');
      } else if (error.response?.status === 403) {
        message.error('删除失败：权限不足');
      } else if (error.response?.status === 409) {
        message.error('删除失败：该分类正在被使用');
      } else {
        const errorMsg = error.response?.data?.message || error.message || '删除分类失败';
        message.error(`删除失败：${errorMsg}`);
      }
    }
  };

  const handleSave = async (values: any) => {
    try {
      if (editingType) {
        await AssetService.updateAssetType(editingType.id, values);
        message.success('分类更新成功');
      } else {
        await AssetService.createAssetType(values);
        message.success('分类创建成功');
      }
      
      setModalVisible(false);
      form.resetFields();
      fetchAssetTypes();
      onRefresh?.();
    } catch (error) {
      message.error(editingType ? '更新分类失败' : '创建分类失败');
      console.error('Error saving asset type:', error);
    }
  };

  const columns: ColumnsType<AssetType> = [
    {
      title: '分类代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '分类类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        const categoryColors: Record<string, string> = {
          'EQUITY': 'green',
          'BOND': 'blue',
          'FUND': 'orange',
          'ETF': 'purple',
          'OPTION': 'red',
          'STOCK_OPTION': 'lime',
          'FUTURE': 'magenta',
          'COMMODITY': 'gold',
          'CURRENCY': 'cyan',
          'CRYPTO': 'volcano'
        };
        return <Tag color={categoryColors[category] || 'default'}>{category}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个分类吗？"
            description="删除后无法恢复，且该分类下的产品将无法正常显示。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    if (visible) {
      fetchAssetTypes();
    }
  }, [visible]);

  return (
    <Modal
      title="产品分类管理"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose={true}
    >
      <div>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="总分类数"
                value={assetTypes.length}
                prefix={<FolderOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="分类类别数"
                value={Object.keys(categoryStats).length}
                prefix={<TagOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="最多的类别"
                value={Object.keys(categoryStats).length > 0 ? 
                  Object.entries(categoryStats).reduce((a, b) => categoryStats[a[0]] > categoryStats[b[0]] ? a : b)[0] : 
                  '-'
                }
                valueStyle={{ fontSize: '16px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增分类
          </Button>
        </div>

        {/* 分类表格 */}
        <Table
          columns={columns}
          dataSource={assetTypes}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          size="small"
        />
      </div>

      {/* 编辑模态框 */}
      <Modal
        title={editingType ? '编辑分类' : '新增分类'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="code"
            label="分类代码"
            rules={[
              { required: true, message: '请输入分类代码' },
              { pattern: /^[A-Z0-9_]+$/, message: '分类代码只能包含大写字母、数字和下划线' }
            ]}
          >
            <Input placeholder="请输入分类代码（如：STOCK）" />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称（如：股票）" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="分类类别"
            rules={[{ required: true, message: '请选择分类类别' }]}
          >
            <Select placeholder="请选择分类类别">
              <Option value="EQUITY">股权类 (EQUITY)</Option>
              <Option value="BOND">债券类 (BOND)</Option>
              <Option value="FUND">基金类 (FUND)</Option>
              <Option value="ETF">ETF类 (ETF)</Option>
              <Option value="OPTION">期权类 (OPTION)</Option>
              <Option value="STOCK_OPTION">股票期权 (STOCK_OPTION)</Option>
              <Option value="FUTURE">期货类 (FUTURE)</Option>
              <Option value="COMMODITY">商品类 (COMMODITY)</Option>
              <Option value="CURRENCY">货币类 (CURRENCY)</Option>
              <Option value="CRYPTO">加密货币 (CRYPTO)</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="description" label="描述">
            <Input.TextArea 
              rows={3} 
              placeholder="请输入分类描述（可选）" 
              maxLength={200}
              showCount
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingType ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default ProductCategoryManager;