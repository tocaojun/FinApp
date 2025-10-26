import React, { useState, useEffect } from 'react';
import {
  Select,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  ColorPicker,
  message,
  Tooltip,
  Divider,
  Empty
} from 'antd';
import {
  PlusOutlined,
  TagOutlined,
  SearchOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Color } from 'antd/es/color-picker';

const { Option, OptGroup } = Select;

interface TagItem {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  categoryId?: string;
  categoryName?: string;
  usageCount: number;
}

interface TagCategory {
  id: string;
  name: string;
  color: string;
  tags?: TagItem[];
}

interface TagSelectorProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  maxTagCount?: number;
  allowCreate?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  entityType?: 'portfolio' | 'transaction' | 'asset';
  entityId?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  value = [],
  onChange,
  placeholder = '选择或创建标签',
  maxTagCount = 10,
  allowCreate = true,
  disabled = false,
  style,
  entityType,
  entityId
}) => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();

  // 加载标签列表
  const loadTags = async (keyword?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        isActive: 'true',
        ...(keyword && { keyword })
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
      setTags(result.data);

    } catch (error) {
      console.error('Failed to load tags:', error);
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
      console.error('Failed to load categories:', error);
    }
  };

  // 搜索标签
  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
    if (keyword.trim()) {
      await loadTags(keyword);
    } else {
      await loadTags();
    }
  };

  // 创建新标签
  const handleCreateTag = async (values: any) => {
    try {
      const response = await fetch('/api/tags', {
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
        throw new Error('创建标签失败');
      }

      const result = await response.json();
      message.success('标签创建成功');
      
      // 添加新标签到列表
      const newTag = result.data;
      setTags(prev => [newTag, ...prev]);
      
      // 自动选中新创建的标签
      const newValue = [...value, newTag.id];
      onChange?.(newValue);
      
      setCreateModalVisible(false);
      createForm.resetFields();

    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建标签失败');
    }
  };

  // 应用标签到实体
  const applyTagToEntity = async (tagId: string) => {
    if (!entityType || !entityId) return;

    try {
      const response = await fetch(`/api/tags/apply/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          tagId,
          [`${entityType}Id`]: entityId
        })
      });

      if (!response.ok) {
        throw new Error('应用标签失败');
      }

    } catch (error) {
      console.error('Failed to apply tag:', error);
    }
  };

  // 从实体移除标签
  const removeTagFromEntity = async (tagId: string) => {
    if (!entityType || !entityId) return;

    try {
      const response = await fetch(`/api/tags/remove/${entityType}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          tagId,
          [`${entityType}Id`]: entityId
        })
      });

      if (!response.ok) {
        throw new Error('移除标签失败');
      }

    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  // 处理标签选择变化
  const handleChange = async (newValue: string[]) => {
    const addedTags = newValue.filter(id => !value.includes(id));
    const removedTags = value.filter(id => !newValue.includes(id));

    // 应用新增的标签
    for (const tagId of addedTags) {
      await applyTagToEntity(tagId);
    }

    // 移除取消选择的标签
    for (const tagId of removedTags) {
      await removeTagFromEntity(tagId);
    }

    onChange?.(newValue);
  };

  // 自定义标签渲染
  const tagRender = (props: any) => {
    const { label, value: tagId, closable, onClose } = props;
    const tag = tags.find(t => t.id === tagId);
    
    if (!tag) return null;

    return (
      <Tag
        color={tag.color}
        closable={closable && !disabled}
        onClose={onClose}
        style={{ marginRight: 3, marginBottom: 3 }}
      >
        {tag.icon && <span style={{ marginRight: 4 }}>{tag.icon}</span>}
        {tag.name}
      </Tag>
    );
  };

  // 按分类分组标签
  const groupedTags = React.useMemo(() => {
    const grouped: { [key: string]: TagItem[] } = {};
    const uncategorized: TagItem[] = [];

    tags.forEach(tag => {
      if (tag.categoryId && tag.categoryName) {
        if (!grouped[tag.categoryId]) {
          grouped[tag.categoryId] = [];
        }
        grouped[tag.categoryId].push(tag);
      } else {
        uncategorized.push(tag);
      }
    });

    return { grouped, uncategorized };
  }, [tags]);

  useEffect(() => {
    loadTags();
    loadCategories();
  }, []);

  return (
    <>
      <Select
        mode="multiple"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={style}
        disabled={disabled}
        loading={loading}
        showSearch
        filterOption={false}
        onSearch={handleSearch}
        tagRender={tagRender}
        maxTagCount={maxTagCount}
        dropdownRender={(menu) => (
          <div>
            {menu}
            {allowCreate && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <Space style={{ padding: '0 8px 4px' }}>
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                    size="small"
                  >
                    创建新标签
                  </Button>
                </Space>
              </>
            )}
          </div>
        )}
        notFoundContent={
          searchKeyword ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  未找到匹配的标签
                  {allowCreate && (
                    <>
                      <br />
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setCreateModalVisible(true)}
                      >
                        创建新标签 "{searchKeyword}"
                      </Button>
                    </>
                  )}
                </span>
              }
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无标签"
            />
          )
        }
      >
        {/* 按分类显示标签 */}
        {Object.entries(groupedTags.grouped).map(([categoryId, categoryTags]) => {
          const category = categories.find(c => c.id === categoryId);
          if (!category) return null;

          return (
            <OptGroup key={categoryId} label={
              <Space>
                <Tag color={category.color} size="small">
                  {category.name}
                </Tag>
              </Space>
            }>
              {categoryTags.map(tag => (
                <Option key={tag.id} value={tag.id}>
                  <Space>
                    <Tag color={tag.color} size="small">
                      {tag.icon && <span style={{ marginRight: 2 }}>{tag.icon}</span>}
                      {tag.name}
                    </Tag>
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      {tag.usageCount}次
                    </span>
                  </Space>
                </Option>
              ))}
            </OptGroup>
          );
        })}

        {/* 未分类标签 */}
        {groupedTags.uncategorized.length > 0 && (
          <OptGroup label="未分类">
            {groupedTags.uncategorized.map(tag => (
              <Option key={tag.id} value={tag.id}>
                <Space>
                  <Tag color={tag.color} size="small">
                    {tag.icon && <span style={{ marginRight: 2 }}>{tag.icon}</span>}
                    {tag.name}
                  </Tag>
                  <span style={{ color: '#999', fontSize: '12px' }}>
                    {tag.usageCount}次
                  </span>
                </Space>
              </Option>
            ))}
          </OptGroup>
        )}
      </Select>

      {/* 创建标签模态框 */}
      <Modal
        title="创建新标签"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTag}
          initialValues={{ 
            color: '#1890ff',
            name: searchKeyword 
          }}
        >
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

          <Form.Item
            name="description"
            label="标签描述"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入标签描述（可选）"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="所属分类"
          >
            <Select placeholder="选择分类（可选）" allowClear>
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  <Tag color={category.color} style={{ marginRight: 4 }}>
                    {category.name}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="color"
            label="标签颜色"
            rules={[{ required: true, message: '请选择标签颜色' }]}
          >
            <ColorPicker showText />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
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
    </>
  );
};

export default TagSelector;