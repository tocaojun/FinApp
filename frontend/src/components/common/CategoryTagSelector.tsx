import React, { useState, useEffect, useMemo } from 'react';
import { Select, Space, Typography, Divider } from 'antd';
import { Tag as TagType } from '../../services/tagService';

const { Option, OptGroup } = Select;
const { Text } = Typography;

interface CategoryTagSelectorProps {
  tags: TagType[];
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

interface TagsByCategory {
  [categoryName: string]: TagType[];
}

const CategoryTagSelector: React.FC<CategoryTagSelectorProps> = ({
  tags,
  value = [],
  onChange,
  placeholder = "选择标签",
  loading = false,
  disabled = false,
  style
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(value);

  // 当外部value变化时，更新内部状态
  useEffect(() => {

      valueIsArray: Array.isArray(value),
      valueLength: value?.length
    });
    setSelectedTags(value);
  }, [value]);

  // 按分类分组标签 - 使用 useMemo 避免无限循环
  const tagsByCategory: TagsByCategory = useMemo(() => {
    return tags.reduce((acc, tag) => {
      const categoryName = tag.category_name || '其他';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(tag);
      return acc;
    }, {} as TagsByCategory);
  }, [tags]);

  // 获取标签的分类 - 使用 useMemo 优化性能
  const getTagCategory = useMemo(() => {
    const tagCategoryMap = new Map<string, string>();
    tags.forEach(tag => {
      tagCategoryMap.set(tag.name, tag.category_name || '其他');
    });
    return (tagName: string): string => {
      return tagCategoryMap.get(tagName) || '其他';
    };
  }, [tags]);

  // 处理标签选择变化
  const handleChange = (newSelectedTags: string[]) => {
    // 如果是新增标签
    if (newSelectedTags.length > selectedTags.length) {
      const newTag = newSelectedTags.find(tag => !selectedTags.includes(tag));
      if (newTag) {
        const newTagCategory = getTagCategory(newTag);
        
        // 移除同分类的其他标签
        const filteredTags = selectedTags.filter(tag => {
          const tagCategory = getTagCategory(tag);
          return tagCategory !== newTagCategory;
        });
        
        // 添加新标签
        const finalTags = [...filteredTags, newTag];
        setSelectedTags(finalTags);
        onChange?.(finalTags);
      }
    } else {
      // 如果是删除标签，直接更新
      setSelectedTags(newSelectedTags);
      onChange?.(newSelectedTags);
    }
  };

  // 自定义标签渲染
  const tagRender = (props: any) => {
    const { label, value, closable, onClose } = props;
    const tagCategory = getTagCategory(value);
    const categoryColor = tags.find(tag => tag.name === value)?.color || '#1890ff';
    
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          margin: '2px',
          backgroundColor: categoryColor + '20',
          border: `1px solid ${categoryColor}`,
          borderRadius: '4px',
          fontSize: '12px',
        }}
      >
        <Text style={{ color: categoryColor, fontSize: '10px', marginRight: '4px' }}>
          {tagCategory}
        </Text>
        <Text style={{ color: categoryColor }}>
          {label}
        </Text>
        {closable && (
          <span
            style={{
              marginLeft: '4px',
              cursor: 'pointer',
              color: categoryColor,
            }}
            onClick={onClose}
          >
            ×
          </span>
        )}
      </span>
    );
  };

  return (
    <Select
      mode="multiple"
      value={selectedTags}
      onChange={handleChange}
      placeholder={placeholder}
      loading={loading}
      disabled={disabled}
      style={style}
      tagRender={tagRender}
      optionFilterProp="children"
      filterOption={(input, option) =>
        option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
      }
    >
      {Object.entries(tagsByCategory).map(([categoryName, categoryTags]) => (
        <OptGroup key={categoryName} label={
          <Space>
            <Text strong style={{ color: categoryTags[0]?.color || '#1890ff' }}>
              {categoryName}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              (单选)
            </Text>
          </Space>
        }>
          {categoryTags.map(tag => (
            <Option key={tag.id} value={tag.name}>
              <Space>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: tag.color || '#1890ff',
                  }}
                />
                {tag.name}
                {tag.description && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    ({tag.description})
                  </Text>
                )}
              </Space>
            </Option>
          ))}
        </OptGroup>
      ))}
    </Select>
  );
};

export default CategoryTagSelector;