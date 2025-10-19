import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  ColorPicker,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Drawer,
  Tabs,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Divider,
  Transfer,
  List,
  Avatar
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TagOutlined,
  FolderOutlined,
  BarChartOutlined,
  BulbOutlined,
  FilterOutlined,
  ExportOutlined,
  ImportOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Color } from 'antd/es/color-picker';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface TagItem {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  userId: string;
  categoryId?: string;
  categoryName?: string;
  isSystem: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TagCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  userId: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TagStats {
  totalTags: number;
  totalCategories: number;
  taggedPortfolios: number;
  taggedTransactions: number;
  taggedAssets: number;
  totalUsageCount: number;
  popularTags: TagItem[];
}

const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [stats, setStats] = useState<TagStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showSystemTags, setShowSystemTags] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 模态框状态
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [statsDrawerVisible, setStatsDrawerVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null);

  // 表单实例
  const [tagForm] = Form.useForm();
  const [categoryForm] = Form.useForm();

  // 批量操作状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchTargetKeys, setBatchTargetKeys] = useState<string[]>([]);
  const [batchDataSource, setBatchDataSource] = useState<any[]>([]);

  // 加载标签列表
  const loadTags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.pageSize.toString(),
        ...(searchKeyword && { keyword: searchKeyword }),
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(showSystemTags !== undefined && { isSystem: showSystemTags.toString() })
      });

      const response = await fetch(`/api/tags?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取标签列表失败');
      }

      const result = await response.json();
      setTags(result.data.tags || result.data);
      setPagination(prev => ({
        ...prev,
        total: result.data.total || result.total || 0
      }));

    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取标签列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载标签分类
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/tags/categories/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取标签分类失败');
      }

      const result = await response.json();
      setCategories(result.data);

    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取标签分类失败');
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await fetch('/api/tags/stats/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }

      const result = await response.json();
      setStats(result.data);

    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取统计数据失败');
    }
  };

  // 创建或更新标签
  const handleTagSubmit = async (values: any) => {
    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags';
      const method = editingTag ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...values,
          category_id: values.categoryId, // 将 categoryId 映射为 category_id
          color: typeof values.color === 'object' ? values.color.toHexString() : values.color
        })
      });

      if (!response.ok) {
        throw new Error(editingTag ? '更新标签失败' : '创建标签失败');
      }

      message.success(editingTag ? '标签更新成功' : '标签创建成功');
      setTagModalVisible(false);
      setEditingTag(null);
      tagForm.resetFields();
      loadTags();

    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败');
    }
  };

  // 创建标签分类
  const handleCategorySubmit = async (values: any) => {
    try {
      const response = await fetch('/api/tags/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...values,
          color: typeof values.color === 'object' ? values.color.toHexString() : values.color
        })
      });

      if (!response.ok) {
        throw new Error('创建标签分类失败');
      }

      message.success('标签分类创建成功');
      setCategoryModalVisible(false);
      categoryForm.resetFields();
      loadCategories();

    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建标签分类失败');
    }
  };

  // 删除标签
  const handleDeleteTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('删除标签失败');
      }

      message.success('标签删除成功');
      loadTags();

    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除标签失败');
    }
  };

  // 批量删除标签
  const handleBatchDelete = async () => {
    try {
      const promises = selectedRowKeys.map(tagId =>
        fetch(`/api/tags/${tagId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
      );

      await Promise.all(promises);
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      loadTags();

    } catch (error) {
      message.error('批量删除失败');
    }
  };

  // 搜索标签
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 筛选变化
  const handleFilterChange = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 表格列定义
  const columns: ColumnsType<TagItem> = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TagItem) => (
        <Space>
          <Tag color={record.color} style={{ marginRight: 0 }}>
            {record.icon && <span style={{ marginRight: 4 }}>{record.icon}</span>}
            {text}
          </Tag>
          {record.isSystem && <Badge status="processing" text="系统" />}
        </Space>
      )
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (text: string) => text || '-'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-'
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      sorter: true,
      render: (count: number) => (
        <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: TagItem) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingTag(record);
                tagForm.setFieldsValue({
                  ...record,
                  categoryId: record.category_id, // 将 category_id 映射为 categoryId
                  color: record.color
                });
                setTagModalVisible(true);
              }}
              disabled={record.isSystem}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个标签吗？"
              onConfirm={() => handleDeleteTag(record.id)}
              disabled={record.isSystem}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={record.isSystem}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: TagItem) => ({
      disabled: record.isSystem
    })
  };

  useEffect(() => {
    loadTags();
    loadCategories();
    loadStats();
  }, [pagination.current, pagination.pageSize, searchKeyword, selectedCategory, showSystemTags]);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <TagOutlined /> 标签管理
      </Title>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space wrap>
              <Search
                placeholder="搜索标签名称或描述"
                allowClear
                style={{ width: 300 }}
                onSearch={handleSearch}
              />
              <Select
                placeholder="选择分类"
                allowClear
                style={{ width: 150 }}
                value={selectedCategory}
                onChange={(value) => {
                  setSelectedCategory(value);
                  handleFilterChange();
                }}
              >
                {categories.map(category => (
                  <Option key={category.id} value={category.id}>
                    <Tag color={category.color} style={{ marginRight: 4 }}>
                      {category.name}
                    </Tag>
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="标签类型"
                style={{ width: 120 }}
                value={showSystemTags}
                onChange={(value) => {
                  setShowSystemTags(value);
                  handleFilterChange();
                }}
              >
                <Option value={false}>用户标签</Option>
                <Option value={true}>系统标签</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingTag(null);
                  tagForm.resetFields();
                  setTagModalVisible(true);
                }}
              >
                新建标签
              </Button>
              <Button
                icon={<FolderOutlined />}
                onClick={() => setCategoryModalVisible(true)}
              >
                新建分类
              </Button>
              <Button
                icon={<BarChartOutlined />}
                onClick={() => setStatsDrawerVisible(true)}
              >
                统计分析
              </Button>
              {selectedRowKeys.length > 0 && (
                <Popconfirm
                  title={`确定要删除选中的 ${selectedRowKeys.length} 个标签吗？`}
                  onConfirm={handleBatchDelete}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    批量删除
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 标签表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={(paginationConfig, filters, sorter) => {
            setPagination(prev => ({
              ...prev,
              current: paginationConfig.current || 1,
              pageSize: paginationConfig.pageSize || 20
            }));
          }}
        />
      </Card>

      {/* 创建/编辑标签模态框 */}
      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={tagModalVisible}
        onCancel={() => {
          setTagModalVisible(false);
          setEditingTag(null);
          tagForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={tagForm}
          layout="vertical"
          onFinish={handleTagSubmit}
          initialValues={{ color: '#1890ff' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="标签名称"
                rules={[
                  { required: true, message: '请输入标签名称' },
                  { max: 50, message: '标签名称不能超过50个字符' }
                ]}
              >
                <Input placeholder="请输入标签名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="所属分类"
              >
                <Select placeholder="选择分类" allowClear>
                  {categories.map(category => (
                    <Option key={category.id} value={category.id}>
                      <Tag color={category.color} style={{ marginRight: 4 }}>
                        {category.name}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="标签描述"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入标签描述"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="color"
                label="标签颜色"
                rules={[{ required: true, message: '请选择标签颜色' }]}
              >
                <ColorPicker showText />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="icon"
                label="图标"
              >
                <Input placeholder="图标名称（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setTagModalVisible(false);
                setEditingTag(null);
                tagForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTag ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建分类模态框 */}
      <Modal
        title="新建标签分类"
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          categoryForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={handleCategorySubmit}
          initialValues={{ color: '#52c41a', sortOrder: 0 }}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[
              { required: true, message: '请输入分类名称' },
              { max: 50, message: '分类名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="分类描述"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入分类描述"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="color"
                label="分类颜色"
                rules={[{ required: true, message: '请选择分类颜色' }]}
              >
                <ColorPicker showText />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sortOrder"
                label="排序值"
              >
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCategoryModalVisible(false);
                categoryForm.resetFields();
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

      {/* 统计分析抽屉 */}
      <Drawer
        title="标签统计分析"
        placement="right"
        width={600}
        open={statsDrawerVisible}
        onClose={() => setStatsDrawerVisible(false)}
      >
        {stats && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic
                  title="总标签数"
                  value={stats.totalTags}
                  prefix={<TagOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="分类数"
                  value={stats.totalCategories}
                  prefix={<FolderOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="总使用次数"
                  value={stats.totalUsageCount}
                  prefix={<BulbOutlined />}
                />
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic
                  title="已标记投资组合"
                  value={stats.taggedPortfolios}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="已标记交易"
                  value={stats.taggedTransactions}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="已标记资产"
                  value={stats.taggedAssets}
                />
              </Col>
            </Row>

            <Divider>热门标签</Divider>
            <List
              dataSource={stats.popularTags}
              renderItem={(tag) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: tag.color }}
                        icon={<TagOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <Tag color={tag.color}>{tag.name}</Tag>
                        <Text type="secondary">使用 {tag.usageCount} 次</Text>
                      </Space>
                    }
                    description={tag.description}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TagManagement;