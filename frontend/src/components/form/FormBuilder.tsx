import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Checkbox,
  Radio,
  Divider,
  Modal,
  Alert,
  Tooltip,
  Tag,
  List,
  Collapse,
  Tree,
  message,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  DragOutlined,
  EyeOutlined,
  SaveOutlined,
  ImportOutlined,
  ExportOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  CodeOutlined
} from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SmartForm from './SmartForm';
import type { FormField } from './SmartForm';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
  layout: 'horizontal' | 'vertical' | 'inline';
  size: 'small' | 'middle' | 'large';
  showSteps: boolean;
  stepFields: string[][];
  createdAt: string;
  updatedAt: string;
}

interface FieldTemplate {
  type: FormField['type'];
  label: string;
  icon: React.ReactNode;
  defaultProps: Partial<FormField>;
  category: string;
}

interface FormBuilderProps {
  onSave?: (template: FormTemplate) => void;
  onLoad?: (templateId: string) => void;
  initialTemplate?: FormTemplate;
  templates?: FormTemplate[];
  readOnly?: boolean;
}

const FormBuilder: React.FC<FormBuilderProps> = ({
  onSave,
  onLoad,
  initialTemplate,
  templates = [],
  readOnly = false
}) => {
  const [currentTemplate, setCurrentTemplate] = useState<FormTemplate>(
    initialTemplate || {
      id: '',
      name: '新表单',
      description: '',
      category: '自定义',
      fields: [],
      layout: 'vertical',
      size: 'middle',
      showSteps: false,
      stepFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );

  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fieldForm] = Form.useForm();

  // 字段模板
  const fieldTemplates: FieldTemplate[] = [
    {
      type: 'input',
      label: '文本输入',
      icon: <EditOutlined />,
      category: '基础字段',
      defaultProps: {
        type: 'input',
        label: '文本字段',
        placeholder: '请输入文本',
        required: false
      }
    },
    {
      type: 'textarea',
      label: '多行文本',
      icon: <EditOutlined />,
      category: '基础字段',
      defaultProps: {
        type: 'textarea',
        label: '多行文本',
        placeholder: '请输入多行文本',
        rows: 4
      }
    },
    {
      type: 'number',
      label: '数字输入',
      icon: <EditOutlined />,
      category: '基础字段',
      defaultProps: {
        type: 'number',
        label: '数字字段',
        placeholder: '请输入数字',
        min: 0
      }
    },
    {
      type: 'select',
      label: '下拉选择',
      icon: <EditOutlined />,
      category: '选择字段',
      defaultProps: {
        type: 'select',
        label: '选择字段',
        placeholder: '请选择',
        options: [
          { label: '选项1', value: 'option1' },
          { label: '选项2', value: 'option2' }
        ]
      }
    },
    {
      type: 'date',
      label: '日期选择',
      icon: <EditOutlined />,
      category: '日期时间',
      defaultProps: {
        type: 'date',
        label: '日期字段',
        placeholder: '请选择日期'
      }
    },
    {
      type: 'dateRange',
      label: '日期范围',
      icon: <EditOutlined />,
      category: '日期时间',
      defaultProps: {
        type: 'dateRange',
        label: '日期范围',
        placeholder: '请选择日期范围'
      }
    },
    {
      type: 'switch',
      label: '开关',
      icon: <EditOutlined />,
      category: '选择字段',
      defaultProps: {
        type: 'switch',
        label: '开关字段'
      }
    },
    {
      type: 'slider',
      label: '滑块',
      icon: <EditOutlined />,
      category: '数值字段',
      defaultProps: {
        type: 'slider',
        label: '滑块字段',
        min: 0,
        max: 100
      }
    },
    {
      type: 'rate',
      label: '评分',
      icon: <EditOutlined />,
      category: '数值字段',
      defaultProps: {
        type: 'rate',
        label: '评分字段'
      }
    },
    {
      type: 'upload',
      label: '文件上传',
      icon: <EditOutlined />,
      category: '特殊字段',
      defaultProps: {
        type: 'upload',
        label: '文件上传',
        multiple: false
      }
    },
    {
      type: 'autocomplete',
      label: '自动完成',
      icon: <EditOutlined />,
      category: '特殊字段',
      defaultProps: {
        type: 'autocomplete',
        label: '自动完成',
        placeholder: '请输入',
        options: []
      }
    },
    {
      type: 'dynamic',
      label: '动态字段',
      icon: <EditOutlined />,
      category: '高级字段',
      defaultProps: {
        type: 'dynamic',
        label: '动态字段',
        dependencies: []
      }
    }
  ];

  // 拖拽字段组件
  const DraggableField: React.FC<{ field: FormField; index: number }> = ({ field, index }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'field',
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    });

    const [, drop] = useDrop({
      accept: 'field',
      hover: (draggedItem: { index: number }) => {
        if (draggedItem.index !== index) {
          moveField(draggedItem.index, index);
          draggedItem.index = index;
        }
      }
    });

    return (
      <div
        ref={(node) => drag(drop(node))}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: 'move',
          marginBottom: 8,
          padding: 12,
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          backgroundColor: '#fafafa'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <DragOutlined />
            <Text strong>{field.label}</Text>
            <Tag>{getFieldTypeLabel(field.type)}</Tag>
            {field.required && <Tag color="red">必填</Tag>}
          </Space>
          
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => editField(index)}
            />
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => duplicateField(index)}
            />
            <Popconfirm
              title="确定删除此字段吗？"
              onConfirm={() => deleteField(index)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        </div>
        
        {field.tooltip && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              提示: {field.tooltip}
            </Text>
          </div>
        )}
      </div>
    );
  };

  // 字段模板组件
  const FieldTemplate: React.FC<{ template: FieldTemplate }> = ({ template }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'template',
      item: { template },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    });

    return (
      <div
        ref={drag}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: 'grab',
          padding: 8,
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          marginBottom: 8,
          backgroundColor: 'white'
        }}
        onClick={() => addFieldFromTemplate(template)}
      >
        <Space>
          {template.icon}
          <Text>{template.label}</Text>
        </Space>
      </div>
    );
  };

  // 拖拽区域组件
  const DropZone: React.FC = () => {
    const [{ isOver }, drop] = useDrop({
      accept: ['template', 'field'],
      drop: (item: { template?: FieldTemplate; index?: number }) => {
        if (item.template) {
          addFieldFromTemplate(item.template);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver()
      })
    });

    return (
      <div
        ref={drop}
        style={{
          minHeight: 200,
          border: `2px dashed ${isOver ? '#1890ff' : '#d9d9d9'}`,
          borderRadius: 6,
          padding: 16,
          backgroundColor: isOver ? '#f0f5ff' : '#fafafa'
        }}
      >
        {currentTemplate.fields.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999' }}>
            <BulbOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>拖拽字段到此处开始构建表单</div>
          </div>
        ) : (
          currentTemplate.fields.map((field, index) => (
            <DraggableField key={`${field.name}-${index}`} field={field} index={index} />
          ))
        )}
      </div>
    );
  };

  // 移动字段
  const moveField = useCallback((dragIndex: number, hoverIndex: number) => {
    const draggedField = currentTemplate.fields[dragIndex];
    const newFields = [...currentTemplate.fields];
    newFields.splice(dragIndex, 1);
    newFields.splice(hoverIndex, 0, draggedField);
    
    setCurrentTemplate(prev => ({
      ...prev,
      fields: newFields,
      updatedAt: new Date().toISOString()
    }));
  }, [currentTemplate.fields]);

  // 从模板添加字段
  const addFieldFromTemplate = (template: FieldTemplate) => {
    const newField: FormField = {
      ...template.defaultProps,
      name: `field_${Date.now()}`,
      label: template.defaultProps.label || template.label
    };
    
    setCurrentTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
      updatedAt: new Date().toISOString()
    }));
  };

  // 编辑字段
  const editField = (index: number) => {
    const field = currentTemplate.fields[index];
    setSelectedField({ ...field, index } as any);
    fieldForm.setFieldsValue(field);
    setFieldModalVisible(true);
  };

  // 复制字段
  const duplicateField = (index: number) => {
    const field = currentTemplate.fields[index];
    const newField = {
      ...field,
      name: `${field.name}_copy_${Date.now()}`,
      label: `${field.label} (副本)`
    };
    
    const newFields = [...currentTemplate.fields];
    newFields.splice(index + 1, 0, newField);
    
    setCurrentTemplate(prev => ({
      ...prev,
      fields: newFields,
      updatedAt: new Date().toISOString()
    }));
  };

  // 删除字段
  const deleteField = (index: number) => {
    const newFields = currentTemplate.fields.filter((_, i) => i !== index);
    setCurrentTemplate(prev => ({
      ...prev,
      fields: newFields,
      updatedAt: new Date().toISOString()
    }));
  };

  // 保存字段编辑
  const saveFieldEdit = async () => {
    try {
      const values = await fieldForm.validateFields();
      const fieldIndex = (selectedField as any)?.index;
      
      if (fieldIndex !== undefined) {
        const newFields = [...currentTemplate.fields];
        newFields[fieldIndex] = { ...values };
        
        setCurrentTemplate(prev => ({
          ...prev,
          fields: newFields,
          updatedAt: new Date().toISOString()
        }));
      }
      
      setFieldModalVisible(false);
      setSelectedField(null);
      fieldForm.resetFields();
      message.success('字段已更新');
    } catch (error) {
      message.error('请检查字段配置');
    }
  };

  // 保存模板
  const saveTemplate = async () => {
    try {
      const values = await form.validateFields();
      const template: FormTemplate = {
        ...currentTemplate,
        ...values,
        id: currentTemplate.id || `template_${Date.now()}`,
        updatedAt: new Date().toISOString()
      };
      
      setCurrentTemplate(template);
      onSave?.(template);
      message.success('模板已保存');
    } catch (error) {
      message.error('请检查模板配置');
    }
  };

  // 获取字段类型标签
  const getFieldTypeLabel = (type: string) => {
    const template = fieldTemplates.find(t => t.type === type);
    return template?.label || type;
  };

  // 生成代码
  const generateCode = () => {
    const code = `
import React from 'react';
import SmartForm from './SmartForm';

const ${currentTemplate.name.replace(/\s+/g, '')}Form = () => {
  const fields = ${JSON.stringify(currentTemplate.fields, null, 2)};
  
  const handleSubmit = async (values) => {
    console.log('表单数据:', values);
    // 处理表单提交逻辑
  };
  
  return (
    <SmartForm
      fields={fields}
      onSubmit={handleSubmit}
      layout="${currentTemplate.layout}"
      size="${currentTemplate.size}"
      showSteps={${currentTemplate.showSteps}}
      ${currentTemplate.showSteps ? `stepFields={${JSON.stringify(currentTemplate.stepFields)}}` : ''}
    />
  );
};

export default ${currentTemplate.name.replace(/\s+/g, '')}Form;
    `;
    
    return code.trim();
  };

  // 按类别分组字段模板
  const groupedTemplates = fieldTemplates.reduce((groups, template) => {
    if (!groups[template.category]) {
      groups[template.category] = [];
    }
    groups[template.category].push(template);
    return groups;
  }, {} as Record<string, FieldTemplate[]>);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ height: '100vh', display: 'flex' }}>
        {/* 左侧字段面板 */}
        <div style={{ width: 300, borderRight: '1px solid #f0f0f0', padding: 16 }}>
          <Title level={4}>字段组件</Title>
          
          <Collapse defaultActiveKey={Object.keys(groupedTemplates)}>
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <Panel key={category} header={category}>
                {templates.map(template => (
                  <FieldTemplate key={template.type} template={template} />
                ))}
              </Panel>
            ))}
          </Collapse>
        </div>

        {/* 中间设计区域 */}
        <div style={{ flex: 1, padding: 16 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Title level={4} style={{ margin: 0 }}>表单设计器</Title>
              <Text type="secondary">
                {currentTemplate.fields.length} 个字段
              </Text>
            </Space>
            
            <Space>
              <Button
                icon={<ImportOutlined />}
                onClick={() => setTemplateModalVisible(true)}
              >
                加载模板
              </Button>
              <Button
                icon={<CodeOutlined />}
                onClick={() => setCodeModalVisible(true)}
              >
                生成代码
              </Button>
              <Button
                icon={<EyeOutlined />}
                onClick={() => setPreviewVisible(true)}
              >
                预览
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={saveTemplate}
              >
                保存模板
              </Button>
            </Space>
          </div>
          
          <DropZone />
        </div>

        {/* 右侧属性面板 */}
        <div style={{ width: 350, borderLeft: '1px solid #f0f0f0', padding: 16 }}>
          <Title level={4}>表单属性</Title>
          
          <Form
            form={form}
            layout="vertical"
            initialValues={currentTemplate}
            onValuesChange={(changedValues, allValues) => {
              setCurrentTemplate(prev => ({
                ...prev,
                ...allValues,
                updatedAt: new Date().toISOString()
              }));
            }}
          >
            <Form.Item name="name" label="表单名称" rules={[{ required: true }]}>
              <Input placeholder="请输入表单名称" />
            </Form.Item>
            
            <Form.Item name="description" label="表单描述">
              <TextArea rows={3} placeholder="请输入表单描述" />
            </Form.Item>
            
            <Form.Item name="category" label="表单分类">
              <Select placeholder="请选择分类">
                <Option value="用户管理">用户管理</Option>
                <Option value="资产管理">资产管理</Option>
                <Option value="交易管理">交易管理</Option>
                <Option value="系统设置">系统设置</Option>
                <Option value="自定义">自定义</Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="layout" label="布局方式">
              <Radio.Group>
                <Radio value="vertical">垂直</Radio>
                <Radio value="horizontal">水平</Radio>
                <Radio value="inline">内联</Radio>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item name="size" label="组件尺寸">
              <Select>
                <Option value="small">小</Option>
                <Option value="middle">中</Option>
                <Option value="large">大</Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="showSteps" label="分步表单" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </div>
      </div>

      {/* 字段编辑模态框 */}
      <Modal
        title="编辑字段"
        open={fieldModalVisible}
        onCancel={() => {
          setFieldModalVisible(false);
          setSelectedField(null);
          fieldForm.resetFields();
        }}
        onOk={saveFieldEdit}
        width={600}
      >
        <Form form={fieldForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="字段名称" rules={[{ required: true }]}>
                <Input placeholder="请输入字段名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="label" label="字段标签" rules={[{ required: true }]}>
                <Input placeholder="请输入字段标签" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="字段类型">
                <Select disabled>
                  {fieldTemplates.map(template => (
                    <Option key={template.type} value={template.type}>
                      {template.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="required" label="是否必填" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="placeholder" label="占位符">
            <Input placeholder="请输入占位符文本" />
          </Form.Item>
          
          <Form.Item name="tooltip" label="提示信息">
            <Input placeholder="请输入提示信息" />
          </Form.Item>
          
          {selectedField?.type === 'select' && (
            <Form.Item name="options" label="选项配置">
              <TextArea
                rows={4}
                placeholder="请输入JSON格式的选项配置，例如：[{&quot;label&quot;: &quot;选项1&quot;, &quot;value&quot;: &quot;option1&quot;}]"
              />
            </Form.Item>
          )}
          
          {(selectedField?.type === 'number' || selectedField?.type === 'slider') && (
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="min" label="最小值">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="max" label="最大值">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="step" label="步长">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        title="表单预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <SmartForm
          fields={currentTemplate.fields}
          layout={currentTemplate.layout}
          size={currentTemplate.size}
          showSteps={currentTemplate.showSteps}
          stepFields={currentTemplate.stepFields}
          onSubmit={async (values) => {
            console.log('预览表单提交:', values);
            message.success('表单提交成功（预览模式）');
          }}
        />
      </Modal>

      {/* 模板选择模态框 */}
      <Modal
        title="选择模板"
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={templates}
          renderItem={(template) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  onClick={() => {
                    setCurrentTemplate(template);
                    form.setFieldsValue(template);
                    setTemplateModalVisible(false);
                    message.success('模板已加载');
                  }}
                >
                  使用
                </Button>
              ]}
            >
              <List.Item.Meta
                title={template.name}
                description={
                  <div>
                    <Text type="secondary">{template.description}</Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag>{template.category}</Tag>
                      <Tag>{template.fields.length} 个字段</Tag>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* 代码生成模态框 */}
      <Modal
        title="生成的代码"
        open={codeModalVisible}
        onCancel={() => setCodeModalVisible(false)}
        footer={
          <Button
            type="primary"
            onClick={() => {
              navigator.clipboard.writeText(generateCode());
              message.success('代码已复制到剪贴板');
            }}
          >
            复制代码
          </Button>
        }
        width={800}
      >
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: 16,
          borderRadius: 4,
          overflow: 'auto',
          maxHeight: 500
        }}>
          <code>{generateCode()}</code>
        </pre>
      </Modal>
    </DndProvider>
  );
};

export default FormBuilder;