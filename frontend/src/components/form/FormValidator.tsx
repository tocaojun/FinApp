import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Card,
  Alert,
  Typography,
  Space,
  Tag,
  Progress,
  Tooltip,
  Button,
  List,
  Divider
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import type { Rule } from 'antd/es/form';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;

interface ValidationRule {
  field: string;
  type: 'required' | 'pattern' | 'min' | 'max' | 'length' | 'email' | 'url' | 'number' | 'date' | 'custom';
  message: string;
  value?: any;
  pattern?: RegExp;
  validator?: (value: any, allValues: any) => Promise<void>;
  severity: 'error' | 'warning' | 'info';
  category: string;
}

interface ValidationResult {
  field: string;
  rule: ValidationRule;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  value: any;
}

interface FormValidatorProps {
  formData: Record<string, any>;
  validationRules: ValidationRule[];
  onValidationChange?: (results: ValidationResult[]) => void;
  showDetails?: boolean;
  realTimeValidation?: boolean;
  groupByCategory?: boolean;
  showSummary?: boolean;
  showProgress?: boolean;
}

const FormValidator: React.FC<FormValidatorProps> = ({
  formData,
  validationRules,
  onValidationChange,
  showDetails = true,
  realTimeValidation = true,
  groupByCategory = false,
  showSummary = true,
  showProgress = false
}) => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  // 内置验证规则
  const builtInValidators = {
    required: (value: any) => {
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        throw new Error('此字段为必填项');
      }
    },
    
    email: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error('请输入有效的邮箱地址');
      }
    },
    
    url: (value: string) => {
      if (value && !/^https?:\/\/.+/.test(value)) {
        throw new Error('请输入有效的URL地址');
      }
    },
    
    number: (value: any) => {
      if (value && isNaN(Number(value))) {
        throw new Error('请输入有效的数字');
      }
    },
    
    date: (value: any) => {
      if (value && !dayjs(value).isValid()) {
        throw new Error('请输入有效的日期');
      }
    },
    
    pattern: (value: string, pattern: RegExp) => {
      if (value && !pattern.test(value)) {
        throw new Error('格式不正确');
      }
    },
    
    min: (value: any, minValue: number) => {
      if (typeof value === 'number' && value < minValue) {
        throw new Error(`值不能小于 ${minValue}`);
      }
      if (typeof value === 'string' && value.length < minValue) {
        throw new Error(`长度不能少于 ${minValue} 个字符`);
      }
      if (Array.isArray(value) && value.length < minValue) {
        throw new Error(`至少需要选择 ${minValue} 项`);
      }
    },
    
    max: (value: any, maxValue: number) => {
      if (typeof value === 'number' && value > maxValue) {
        throw new Error(`值不能大于 ${maxValue}`);
      }
      if (typeof value === 'string' && value.length > maxValue) {
        throw new Error(`长度不能超过 ${maxValue} 个字符`);
      }
      if (Array.isArray(value) && value.length > maxValue) {
        throw new Error(`最多只能选择 ${maxValue} 项`);
      }
    },
    
    length: (value: string, length: number) => {
      if (value && value.length !== length) {
        throw new Error(`长度必须为 ${length} 个字符`);
      }
    }
  };

  // 执行验证
  const validateForm = async () => {
    setIsValidating(true);
    const results: ValidationResult[] = [];

    for (const rule of validationRules) {
      const fieldValue = formData[rule.field];
      
      try {
        // 执行内置验证
        switch (rule.type) {
          case 'required':
            builtInValidators.required(fieldValue);
            break;
          case 'email':
            builtInValidators.email(fieldValue);
            break;
          case 'url':
            builtInValidators.url(fieldValue);
            break;
          case 'number':
            builtInValidators.number(fieldValue);
            break;
          case 'date':
            builtInValidators.date(fieldValue);
            break;
          case 'pattern':
            if (rule.pattern) {
              builtInValidators.pattern(fieldValue, rule.pattern);
            }
            break;
          case 'min':
            if (rule.value !== undefined) {
              builtInValidators.min(fieldValue, rule.value);
            }
            break;
          case 'max':
            if (rule.value !== undefined) {
              builtInValidators.max(fieldValue, rule.value);
            }
            break;
          case 'length':
            if (rule.value !== undefined) {
              builtInValidators.length(fieldValue, rule.value);
            }
            break;
          case 'custom':
            if (rule.validator) {
              await rule.validator(fieldValue, formData);
            }
            break;
        }
        
        // 验证通过
        results.push({
          field: rule.field,
          rule,
          status: 'success',
          message: '验证通过',
          value: fieldValue
        });
        
      } catch (error) {
        // 验证失败
        results.push({
          field: rule.field,
          rule,
          status: rule.severity === 'warning' ? 'warning' : 
                  rule.severity === 'info' ? 'info' : 'error',
          message: error.message || rule.message,
          value: fieldValue
        });
      }
    }

    setValidationResults(results);
    onValidationChange?.(results);
    setIsValidating(false);
  };

  // 实时验证
  useEffect(() => {
    if (realTimeValidation) {
      const timer = setTimeout(() => {
        validateForm();
      }, 300); // 防抖

      return () => clearTimeout(timer);
    }
  }, [formData, validationRules, realTimeValidation]);

  // 手动验证
  useEffect(() => {
    if (!realTimeValidation) {
      validateForm();
    }
  }, [validationRules]);

  // 获取验证统计
  const getValidationStats = () => {
    const total = validationResults.length;
    const passed = validationResults.filter(r => r.status === 'success').length;
    const errors = validationResults.filter(r => r.status === 'error').length;
    const warnings = validationResults.filter(r => r.status === 'warning').length;
    const infos = validationResults.filter(r => r.status === 'info').length;
    
    return { total, passed, errors, warnings, infos };
  };

  // 按类别分组
  const getGroupedResults = () => {
    if (!groupByCategory) return { '全部': validationResults };
    
    return validationResults.reduce((groups, result) => {
      const category = result.rule.category || '其他';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
      return groups;
    }, {} as Record<string, ValidationResult[]>);
  };

  // 渲染验证结果项
  const renderValidationItem = (result: ValidationResult) => {
    const statusIcons = {
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      error: <CloseCircleOutlined style={{ color: '#f5222d' }} />,
      warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />
    };

    const statusColors = {
      success: '#f6ffed',
      error: '#fff2f0',
      warning: '#fffbe6',
      info: '#f0f5ff'
    };

    return (
      <List.Item
        key={`${result.field}-${result.rule.type}`}
        style={{
          backgroundColor: statusColors[result.status],
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '8px',
          border: `1px solid ${
            result.status === 'success' ? '#b7eb8f' :
            result.status === 'error' ? '#ffccc7' :
            result.status === 'warning' ? '#ffe58f' : '#91d5ff'
          }`
        }}
      >
        <List.Item.Meta
          avatar={statusIcons[result.status]}
          title={
            <Space>
              <Text strong>{result.field}</Text>
              <Tag color={
                result.status === 'success' ? 'green' :
                result.status === 'error' ? 'red' :
                result.status === 'warning' ? 'orange' : 'blue'
              }>
                {result.rule.type}
              </Tag>
            </Space>
          }
          description={
            <div>
              <Text>{result.message}</Text>
              {showAllDetails && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    当前值: {JSON.stringify(result.value)}
                  </Text>
                  {result.rule.pattern && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        匹配模式: {result.rule.pattern.toString()}
                      </Text>
                    </div>
                  )}
                  {result.rule.value !== undefined && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        期望值: {result.rule.value}
                      </Text>
                    </div>
                  )}
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  const stats = getValidationStats();
  const groupedResults = getGroupedResults();
  const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  return (
    <div>
      {/* 验证摘要 */}
      {showSummary && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>验证结果</Title>
              <Text type="secondary">
                共 {stats.total} 项验证，通过 {stats.passed} 项
              </Text>
            </div>
            
            <Space>
              {stats.errors > 0 && (
                <Tag color="red" icon={<CloseCircleOutlined />}>
                  错误 {stats.errors}
                </Tag>
              )}
              {stats.warnings > 0 && (
                <Tag color="orange" icon={<ExclamationCircleOutlined />}>
                  警告 {stats.warnings}
                </Tag>
              )}
              {stats.infos > 0 && (
                <Tag color="blue" icon={<InfoCircleOutlined />}>
                  信息 {stats.infos}
                </Tag>
              )}
              <Tag color="green" icon={<CheckCircleOutlined />}>
                通过 {stats.passed}
              </Tag>
            </Space>
          </div>
          
          {/* 进度条 */}
          {showProgress && (
            <div style={{ marginTop: 16 }}>
              <Progress
                percent={passRate}
                status={stats.errors > 0 ? 'exception' : stats.warnings > 0 ? 'active' : 'success'}
                format={() => `${passRate}% 通过`}
              />
            </div>
          )}
        </Card>
      )}

      {/* 验证详情 */}
      {showDetails && (
        <Card
          title="验证详情"
          extra={
            <Space>
              <Button
                type="text"
                size="small"
                icon={showAllDetails ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowAllDetails(!showAllDetails)}
              >
                {showAllDetails ? '隐藏详情' : '显示详情'}
              </Button>
              {!realTimeValidation && (
                <Button
                  type="primary"
                  size="small"
                  loading={isValidating}
                  onClick={validateForm}
                >
                  重新验证
                </Button>
              )}
            </Space>
          }
        >
          {Object.entries(groupedResults).map(([category, results]) => (
            <div key={category}>
              {groupByCategory && Object.keys(groupedResults).length > 1 && (
                <>
                  <Title level={5}>{category}</Title>
                  <Divider style={{ margin: '12px 0' }} />
                </>
              )}
              
              <List
                dataSource={results}
                renderItem={renderValidationItem}
                locale={{ emptyText: '暂无验证结果' }}
              />
              
              {groupByCategory && Object.keys(groupedResults).length > 1 && (
                <Divider style={{ margin: '24px 0' }} />
              )}
            </div>
          ))}
        </Card>
      )}

      {/* 验证状态提示 */}
      {isValidating && (
        <Alert
          message="正在验证表单数据..."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
      
      {!isValidating && stats.errors > 0 && (
        <Alert
          message={`发现 ${stats.errors} 个错误，请修正后重试`}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
      
      {!isValidating && stats.errors === 0 && stats.warnings > 0 && (
        <Alert
          message={`有 ${stats.warnings} 个警告，建议检查`}
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
      
      {!isValidating && stats.errors === 0 && stats.warnings === 0 && stats.total > 0 && (
        <Alert
          message="所有验证项都已通过"
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
};

export default FormValidator;