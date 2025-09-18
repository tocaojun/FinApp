import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Slider,
  Rate,
  Upload,
  Button,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Alert,
  Progress,
  Tooltip,
  Tag,
  Divider,
  Steps,
  message,
  AutoComplete
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { FormInstance, Rule } from 'antd/es/form';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { debounce } from 'lodash';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Step } = Steps;

interface FormField {
  name: string;
  label: string;
  type: 'input' | 'number' | 'select' | 'date' | 'dateRange' | 'switch' | 'slider' | 'rate' | 'textarea' | 'upload' | 'autocomplete' | 'cascader' | 'dynamic';
  required?: boolean;
  rules?: Rule[];
  options?: { label: string; value: any; disabled?: boolean }[];
  placeholder?: string;
  tooltip?: string;
  dependencies?: string[];
  conditional?: (values: any) => boolean;
  validator?: (value: any, values: any) => Promise<void>;
  formatter?: (value: any) => any;
  parser?: (value: any) => any;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  multiple?: boolean;
  allowClear?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  span?: number;
  extra?: React.ReactNode;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

interface SmartFormProps {
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: any) => Promise<void>;
  onValuesChange?: (changedValues: any, allValues: any) => void;
  loading?: boolean;
  layout?: 'horizontal' | 'vertical' | 'inline';
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  showSteps?: boolean;
  stepFields?: string[][];
  autoSave?: boolean;
  autoSaveInterval?: number;
  showPreview?: boolean;
  showHistory?: boolean;
  validateOnChange?: boolean;
  submitText?: string;
  resetText?: string;
  previewText?: string;
  form?: FormInstance;
  className?: string;
  style?: React.CSSProperties;
}

interface FormHistory {
  id: string;
  values: Record<string, any>;
  timestamp: string;
  description?: string;
}

const SmartForm: React.FC<SmartFormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  onValuesChange,
  loading = false,
  layout = 'vertical',
  size = 'middle',
  disabled = false,
  showSteps = false,
  stepFields = [],
  autoSave = false,
  autoSaveInterval = 30000,
  showPreview = false,
  showHistory = false,
  validateOnChange = true,
  submitText = '提交',
  resetText = '重置',
  previewText = '预览',
  form: externalForm,
  className,
  style
}) => {
  const [internalForm] = Form.useForm();
  const form = externalForm || internalForm;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [validationStatus, setValidationStatus] = useState<Record<string, 'success' | 'warning' | 'error' | 'validating'>>({});
  const [formHistory, setFormHistory] = useState<FormHistory[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dynamicFields, setDynamicFields] = useState<Record<string, FormField[]>>({});

  // 自动保存
  const autoSaveValues = useCallback(
    debounce(async (values: any) => {
      if (!autoSave) return;
      
      setAutoSaveStatus('saving');
      try {
        // 模拟自动保存
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 保存到历史记录
        const historyItem: FormHistory = {
          id: `auto_${Date.now()}`,
          values: { ...values },
          timestamp: dayjs().toISOString(),
          description: '自动保存'
        };
        
        setFormHistory(prev => [historyItem, ...prev.slice(0, 9)]);
        setAutoSaveStatus('saved');
        
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    }, autoSaveInterval),
    [autoSave, autoSaveInterval]
  );

  // 表单值变化处理
  const handleValuesChange = (changedValues: any, allValues: any) => {
    onValuesChange?.(changedValues, allValues);
    
    // 自动保存
    if (autoSave) {
      autoSaveValues(allValues);
    }
    
    // 实时验证
    if (validateOnChange) {
      Object.keys(changedValues).forEach(fieldName => {
        validateField(fieldName, allValues);
      });
    }
    
    // 处理依赖字段
    handleFieldDependencies(changedValues, allValues);
  };

  // 字段验证
  const validateField = async (fieldName: string, allValues: any) => {
    const field = fields.find(f => f.name === fieldName);
    if (!field || !field.validator) return;
    
    setValidationStatus(prev => ({ ...prev, [fieldName]: 'validating' }));
    
    try {
      await field.validator(allValues[fieldName], allValues);
      setValidationStatus(prev => ({ ...prev, [fieldName]: 'success' }));
      setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
    } catch (error) {
      setValidationStatus(prev => ({ ...prev, [fieldName]: 'error' }));
      setFieldErrors(prev => ({ ...prev, [fieldName]: error.message }));
    }
  };

  // 处理字段依赖
  const handleFieldDependencies = (changedValues: any, allValues: any) => {
    Object.keys(changedValues).forEach(changedField => {
      // 找到依赖于当前字段的其他字段
      const dependentFields = fields.filter(field => 
        field.dependencies?.includes(changedField)
      );
      
      dependentFields.forEach(field => {
        // 重新验证依赖字段
        if (field.validator) {
          validateField(field.name, allValues);
        }
        
        // 处理动态字段
        if (field.type === 'dynamic') {
          updateDynamicField(field.name, allValues);
        }
      });
    });
  };

  // 更新动态字段
  const updateDynamicField = (fieldName: string, allValues: any) => {
    const field = fields.find(f => f.name === fieldName);
    if (!field) return;
    
    // 根据依赖字段的值生成动态字段
    const dependencyValues = field.dependencies?.reduce((acc, dep) => {
      acc[dep] = allValues[dep];
      return acc;
    }, {} as Record<string, any>) || {};
    
    // 这里可以根据业务逻辑生成动态字段
    const newFields = generateDynamicFields(fieldName, dependencyValues);
    setDynamicFields(prev => ({ ...prev, [fieldName]: newFields }));
  };

  // 生成动态字段（示例）
  const generateDynamicFields = (fieldName: string, dependencies: Record<string, any>): FormField[] => {
    // 示例：根据资产类型生成不同的字段
    if (fieldName === 'assetSpecificFields' && dependencies.assetType) {
      switch (dependencies.assetType) {
        case 'stock':
          return [
            { name: 'ticker', label: '股票代码', type: 'input', required: true },
            { name: 'exchange', label: '交易所', type: 'select', options: [
              { label: 'NYSE', value: 'NYSE' },
              { label: 'NASDAQ', value: 'NASDAQ' }
            ]},
            { name: 'sector', label: '行业', type: 'input' }
          ];
        case 'bond':
          return [
            { name: 'maturityDate', label: '到期日', type: 'date', required: true },
            { name: 'couponRate', label: '票面利率', type: 'number', suffix: '%' },
            { name: 'creditRating', label: '信用评级', type: 'select', options: [
              { label: 'AAA', value: 'AAA' },
              { label: 'AA', value: 'AA' },
              { label: 'A', value: 'A' }
            ]}
          ];
        case 'crypto':
          return [
            { name: 'blockchain', label: '区块链', type: 'input' },
            { name: 'consensusAlgorithm', label: '共识算法', type: 'input' },
            { name: 'totalSupply', label: '总供应量', type: 'number' }
          ];
        default:
          return [];
      }
    }
    return [];
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 保存到历史记录
      const historyItem: FormHistory = {
        id: `submit_${Date.now()}`,
        values: { ...values },
        timestamp: dayjs().toISOString(),
        description: '表单提交'
      };
      setFormHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      
      await onSubmit(values);
      message.success('表单提交成功');
    } catch (error) {
      console.error('表单提交失败:', error);
      message.error('表单提交失败，请检查输入');
    }
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setValidationStatus({});
    setFieldErrors({});
    setCurrentStep(0);
    message.info('表单已重置');
  };

  // 从历史记录恢复
  const restoreFromHistory = (historyItem: FormHistory) => {
    form.setFieldsValue(historyItem.values);
    setHistoryVisible(false);
    message.success('已恢复历史数据');
  };

  // 渲染字段
  const renderField = (field: FormField, allValues: any = {}) => {
    // 检查条件显示
    if (field.conditional && !field.conditional(allValues)) {
      return null;
    }
    
    if (field.hidden) {
      return null;
    }

    const commonProps = {
      placeholder: field.placeholder,
      disabled: disabled || field.disabled,
      size,
      allowClear: field.allowClear
    };

    const formItemProps = {
      name: field.name,
      label: field.label,
      rules: field.rules,
      tooltip: field.tooltip,
      extra: field.extra,
      validateStatus: validationStatus[field.name],
      help: fieldErrors[field.name]
    };

    let fieldComponent: React.ReactNode;

    switch (field.type) {
      case 'input':
        fieldComponent = (
          <Input
            {...commonProps}
            maxLength={field.maxLength}
            showCount={field.showCount}
            addonBefore={field.addonBefore}
            addonAfter={field.addonAfter}
            prefix={field.prefix}
            suffix={field.suffix}
          />
        );
        break;

      case 'number':
        fieldComponent = (
          <InputNumber
            {...commonProps}
            min={field.min}
            max={field.max}
            step={field.step}
            formatter={field.formatter}
            parser={field.parser}
            addonBefore={field.addonBefore}
            addonAfter={field.addonAfter}
            prefix={field.prefix}
            suffix={field.suffix}
            style={{ width: '100%' }}
          />
        );
        break;

      case 'select':
        fieldComponent = (
          <Select
            {...commonProps}
            mode={field.multiple ? 'multiple' : undefined}
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase())
            }
          >
            {field.options?.map(option => (
              <Option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
        break;

      case 'date':
        fieldComponent = (
          <DatePicker
            {...commonProps}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        );
        break;

      case 'dateRange':
        fieldComponent = (
          <RangePicker
            {...commonProps}
            placeholder={field.placeholder ? [field.placeholder, field.placeholder] : undefined}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        );
        break;

      case 'switch':
        fieldComponent = (
          <Switch
            disabled={disabled || field.disabled}
            size={size === 'large' ? 'default' : 'small'}
          />
        );
        break;

      case 'slider':
        fieldComponent = (
          <Slider
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={disabled || field.disabled}
          />
        );
        break;

      case 'rate':
        fieldComponent = (
          <Rate
            disabled={disabled || field.disabled}
            allowHalf
          />
        );
        break;

      case 'textarea':
        fieldComponent = (
          <TextArea
            {...commonProps}
            rows={field.rows || 4}
            maxLength={field.maxLength}
            showCount={field.showCount}
          />
        );
        break;

      case 'upload':
        fieldComponent = (
          <Upload
            disabled={disabled || field.disabled}
            multiple={field.multiple}
            listType="text"
          >
            <Button icon={<PlusOutlined />}>选择文件</Button>
          </Upload>
        );
        break;

      case 'autocomplete':
        fieldComponent = (
          <AutoComplete
            {...commonProps}
            options={field.options?.map(opt => ({ value: opt.value, label: opt.label }))}
            filterOption={(inputValue, option) =>
              option?.label?.toString().toLowerCase().includes(inputValue.toLowerCase())
            }
          />
        );
        break;

      case 'dynamic':
        const dynamicFieldsForThis = dynamicFields[field.name] || [];
        fieldComponent = (
          <div>
            {dynamicFieldsForThis.map(dynamicField => (
              <div key={dynamicField.name} style={{ marginBottom: 16 }}>
                {renderField(dynamicField, allValues)}
              </div>
            ))}
          </div>
        );
        break;

      default:
        fieldComponent = <Input {...commonProps} />;
    }

    return (
      <Form.Item key={field.name} {...formItemProps}>
        {fieldComponent}
      </Form.Item>
    );
  };

  // 渲染步骤表单
  const renderStepForm = () => {
    if (!showSteps || stepFields.length === 0) {
      return (
        <Row gutter={16}>
          {fields.map(field => (
            <Col key={field.name} span={field.span || 24}>
              {renderField(field, form.getFieldsValue())}
            </Col>
          ))}
        </Row>
      );
    }

    const currentStepFields = stepFields[currentStep] || [];
    const currentFields = fields.filter(field => currentStepFields.includes(field.name));

    return (
      <div>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {stepFields.map((_, index) => (
            <Step key={index} title={`步骤 ${index + 1}`} />
          ))}
        </Steps>
        
        <Row gutter={16}>
          {currentFields.map(field => (
            <Col key={field.name} span={field.span || 24}>
              {renderField(field, form.getFieldsValue())}
            </Col>
          ))}
        </Row>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)}>
                上一步
              </Button>
            )}
            {currentStep < stepFields.length - 1 ? (
              <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                {submitText}
              </Button>
            )}
          </Space>
        </div>
      </div>
    );
  };

  // 渲染预览模式
  const renderPreview = () => {
    const values = form.getFieldsValue();
    
    return (
      <Card title="表单预览" extra={
        <Button onClick={() => setPreviewMode(false)}>
          返回编辑
        </Button>
      }>
        <Row gutter={16}>
          {fields.map(field => {
            const value = values[field.name];
            if (value === undefined || value === null || value === '') return null;
            
            return (
              <Col key={field.name} span={field.span || 12} style={{ marginBottom: 16 }}>
                <div>
                  <Text strong>{field.label}:</Text>
                  <div style={{ marginTop: 4 }}>
                    {field.type === 'switch' ? (
                      <Tag color={value ? 'green' : 'red'}>
                        {value ? '是' : '否'}
                      </Tag>
                    ) : field.type === 'rate' ? (
                      <Rate disabled value={value} />
                    ) : field.type === 'select' && field.options ? (
                      <Tag>{field.options.find(opt => opt.value === value)?.label || value}</Tag>
                    ) : (
                      <Text>{Array.isArray(value) ? value.join(', ') : String(value)}</Text>
                    )}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
        
        <Divider />
        
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button onClick={() => setPreviewMode(false)}>
              返回编辑
            </Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              确认{submitText}
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  // 初始化表单值
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  // 初始化动态字段
  useEffect(() => {
    const allValues = form.getFieldsValue();
    fields.forEach(field => {
      if (field.type === 'dynamic') {
        updateDynamicField(field.name, allValues);
      }
    });
  }, [fields]);

  if (previewMode) {
    return renderPreview();
  }

  return (
    <div className={className} style={style}>
      {/* 自动保存状态 */}
      {autoSave && (
        <Alert
          message={
            <Space>
              {autoSaveStatus === 'saving' && <LoadingOutlined />}
              {autoSaveStatus === 'saved' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              {autoSaveStatus === 'error' && <ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              <Text>
                {autoSaveStatus === 'saving' && '正在自动保存...'}
                {autoSaveStatus === 'saved' && '已自动保存'}
                {autoSaveStatus === 'error' && '自动保存失败'}
                {autoSaveStatus === 'idle' && '自动保存已启用'}
              </Text>
            </Space>
          }
          type={autoSaveStatus === 'error' ? 'error' : 'info'}
          showIcon={false}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout={layout}
        size={size}
        disabled={disabled}
        onValuesChange={handleValuesChange}
        initialValues={initialValues}
      >
        {renderStepForm()}
        
        {!showSteps && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space>
              <Button onClick={handleReset} disabled={loading}>
                {resetText}
              </Button>
              {showPreview && (
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewMode(true)}
                  disabled={loading}
                >
                  {previewText}
                </Button>
              )}
              {showHistory && (
                <Button
                  icon={<HistoryOutlined />}
                  onClick={() => setHistoryVisible(true)}
                  disabled={loading}
                >
                  历史记录
                </Button>
              )}
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                icon={<SaveOutlined />}
              >
                {submitText}
              </Button>
            </Space>
          </div>
        )}
      </Form>

      {/* 历史记录模态框 */}
      {showHistory && (
        <Modal
          title="表单历史记录"
          open={historyVisible}
          onCancel={() => setHistoryVisible(false)}
          footer={null}
          width={600}
        >
          <List
            dataSource={formHistory}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    onClick={() => restoreFromHistory(item)}
                  >
                    恢复
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={item.description || '表单数据'}
                  description={dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                />
              </List.Item>
            )}
          />
        </Modal>
      )}
    </div>
  );
};

export default SmartForm;