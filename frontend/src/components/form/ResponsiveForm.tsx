import React from 'react';
import { Form, Card, Grid, Space, Button } from 'antd';
import type { FormProps, FormInstance } from 'antd/es/form';

const { useBreakpoint } = Grid;

interface ResponsiveFormProps extends FormProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showCard?: boolean;
  cardProps?: any;
  children: React.ReactNode;
}

const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  title,
  subtitle,
  actions,
  showCard = true,
  cardProps = {},
  children,
  ...formProps
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // 响应式表单布局
  const getFormLayout = () => {
    if (isMobile) {
      return {
        layout: 'vertical' as const,
        labelCol: undefined,
        wrapperCol: undefined,
      };
    }
    
    return {
      layout: formProps.layout || 'horizontal' as const,
      labelCol: formProps.labelCol || { span: 6 },
      wrapperCol: formProps.wrapperCol || { span: 18 },
    };
  };

  // 响应式按钮组
  const renderActions = () => {
    if (!actions) return null;

    if (isMobile) {
      return (
        <div style={{ 
          position: 'sticky',
          bottom: 0,
          background: '#fff',
          padding: '16px',
          borderTop: '1px solid #f0f0f0',
          marginTop: '24px',
          marginLeft: '-16px',
          marginRight: '-16px',
          marginBottom: '-16px',
        }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {React.Children.map(actions as React.ReactElement, (child, index) => {
              if (React.isValidElement(child) && child.type === Button) {
                return React.cloneElement(child, {
                  ...child.props,
                  block: true,
                  size: 'large',
                });
              }
              return child;
            })}
          </Space>
        </div>
      );
    }

    return (
      <div style={{ 
        textAlign: 'right',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Space>
          {actions}
        </Space>
      </div>
    );
  };

  const formContent = (
    <Form
      {...formProps}
      {...getFormLayout()}
      size={isMobile ? 'large' : formProps.size}
      scrollToFirstError
    >
      {children}
      {renderActions()}
    </Form>
  );

  if (!showCard) {
    return formContent;
  }

  return (
    <Card
      title={title}
      {...cardProps}
      bodyStyle={{
        padding: isMobile ? '16px' : '24px',
        ...cardProps.bodyStyle,
      }}
      headStyle={{
        padding: isMobile ? '0 16px' : '0 24px',
        minHeight: isMobile ? '48px' : '56px',
        ...cardProps.headStyle,
      }}
    >
      {subtitle && (
        <div style={{ 
          marginBottom: '24px',
          color: '#666',
          fontSize: isMobile ? '14px' : '16px',
        }}>
          {subtitle}
        </div>
      )}
      {formContent}
    </Card>
  );
};

export default ResponsiveForm;