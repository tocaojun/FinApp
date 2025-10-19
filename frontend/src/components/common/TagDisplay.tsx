import React, { useState, useEffect } from 'react';
import {
  Tag,
  Space,
  Button,
  Tooltip,
  Popover,
  Modal,
  message,
  Spin,
  Empty,
  Divider
} from 'antd';
import {
  TagOutlined,
  PlusOutlined,
  EditOutlined,
  CloseOutlined,
  MoreOutlined
} from '@ant-design/icons';
import TagSelector from './TagSelector';

interface TagItem {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  usageCount: number;
}

interface TagDisplayProps {
  entityType: 'portfolio' | 'transaction' | 'asset';
  entityId: string;
  editable?: boolean;
  maxDisplay?: number;
  size?: 'small' | 'default';
  showCount?: boolean;
  onTagsChange?: (tags: TagItem[]) => void;
}

const TagDisplay: React.FC<TagDisplayProps> = ({
  entityType,
  entityId,
  editable = false,
  maxDisplay = 5,
  size = 'default',
  showCount = false,
  onTagsChange
}) => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // 加载实体的标签
  const loadEntityTags = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tags/${entityType}/${entityId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取标签失败');
      }

      const result = await response.json();
      const entityTags = result.data || [];
      setTags(entityTags);
      setSelectedTagIds(entityTags.map((tag: TagItem) => tag.id));
      onTagsChange?.(entityTags);

    } catch (error) {
      console.error('Failed to load entity tags:', error);
    } finally {
      setLoading(false);
    }
  };

  // 应用标签到实体
  const applyTagToEntity = async (tagId: string) => {
    try {
      const response = await fetch(`/api/tags/apply/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tagId,
          [`${entityType}Id`]: entityId
        })
      });

      if (!response.ok) {
        throw new Error('应用标签失败');
      }

      message.success('标签应用成功');
      loadEntityTags();

    } catch (error) {
      message.error(error instanceof Error ? error.message : '应用标签失败');
    }
  };

  // 从实体移除标签
  const removeTagFromEntity = async (tagId: string) => {
    try {
      const response = await fetch(`/api/tags/remove/${entityType}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tagId,
          [`${entityType}Id`]: entityId
        })
      });

      if (!response.ok) {
        throw new Error('移除标签失败');
      }

      message.success('标签移除成功');
      loadEntityTags();

    } catch (error) {
      message.error(error instanceof Error ? error.message : '移除标签失败');
    }
  };

  // 处理标签选择变化
  const handleTagsChange = async (newTagIds: string[]) => {
    const addedTags = newTagIds.filter(id => !selectedTagIds.includes(id));
    const removedTags = selectedTagIds.filter(id => !newTagIds.includes(id));

    // 应用新增的标签
    for (const tagId of addedTags) {
      await applyTagToEntity(tagId);
    }

    // 移除取消选择的标签
    for (const tagId of removedTags) {
      await removeTagFromEntity(tagId);
    }

    setSelectedTagIds(newTagIds);
    setEditMode(false);
  };

  // 渲染标签
  const renderTag = (tag: TagItem, closable: boolean = false) => (
    <Tag
      key={tag.id}
      color={tag.color}
      closable={closable && editable}
      onClose={() => removeTagFromEntity(tag.id)}
      style={{ 
        marginBottom: 4,
        cursor: tag.description ? 'help' : 'default'
      }}
    >
      {tag.icon && <span style={{ marginRight: 4 }}>{tag.icon}</span>}
      {tag.name}
      {showCount && (
        <span style={{ marginLeft: 4, opacity: 0.7 }}>
          ({tag.usageCount})
        </span>
      )}
    </Tag>
  );

  // 渲染带描述的标签
  const renderTagWithTooltip = (tag: TagItem, closable: boolean = false) => {
    if (tag.description) {
      return (
        <Tooltip key={tag.id} title={tag.description}>
          {renderTag(tag, closable)}
        </Tooltip>
      );
    }
    return renderTag(tag, closable);
  };

  // 显示的标签和隐藏的标签
  const displayTags = tags.slice(0, maxDisplay);
  const hiddenTags = tags.slice(maxDisplay);

  useEffect(() => {
    loadEntityTags();
  }, [entityType, entityId]);

  if (loading) {
    return <Spin size="small" />;
  }

  return (
    <div>
      <Space wrap size={[4, 4]}>
        {/* 显示的标签 */}
        {displayTags.map(tag => renderTagWithTooltip(tag, true))}

        {/* 更多标签按钮 */}
        {hiddenTags.length > 0 && (
          <Popover
            title={`更多标签 (${hiddenTags.length})`}
            content={
              <div style={{ maxWidth: 300 }}>
                <Space wrap size={[4, 4]}>
                  {hiddenTags.map(tag => renderTagWithTooltip(tag, true))}
                </Space>
              </div>
            }
            trigger="click"
          >
            <Tag
              style={{ 
                cursor: 'pointer',
                borderStyle: 'dashed'
              }}
            >
              <MoreOutlined /> +{hiddenTags.length}
            </Tag>
          </Popover>
        )}

        {/* 添加标签按钮 */}
        {editable && (
          <Tooltip title="管理标签">
            <Tag
              style={{ 
                cursor: 'pointer',
                borderStyle: 'dashed',
                backgroundColor: 'transparent'
              }}
              onClick={() => setEditMode(true)}
            >
              <PlusOutlined /> 标签
            </Tag>
          </Tooltip>
        )}

        {/* 空状态 */}
        {tags.length === 0 && editable && (
          <Tag
            style={{ 
              cursor: 'pointer',
              borderStyle: 'dashed',
              backgroundColor: 'transparent',
              color: '#999'
            }}
            onClick={() => setEditMode(true)}
          >
            <TagOutlined /> 添加标签
          </Tag>
        )}

        {/* 只读模式下的空状态 */}
        {tags.length === 0 && !editable && (
          <span style={{ color: '#999', fontSize: '12px' }}>
            暂无标签
          </span>
        )}
      </Space>

      {/* 标签编辑模态框 */}
      <Modal
        title="管理标签"
        open={editMode}
        onCancel={() => setEditMode(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <TagSelector
            value={selectedTagIds}
            onChange={handleTagsChange}
            placeholder="选择或创建标签"
            allowCreate={true}
            style={{ width: '100%' }}
            entityType={entityType}
            entityId={entityId}
          />
        </div>

        {tags.length > 0 && (
          <>
            <Divider>当前标签</Divider>
            <Space wrap size={[8, 8]}>
              {tags.map(tag => renderTagWithTooltip(tag, false))}
            </Space>
          </>
        )}
      </Modal>
    </div>
  );
};

export default TagDisplay;