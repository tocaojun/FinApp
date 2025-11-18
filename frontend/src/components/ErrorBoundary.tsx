import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Button, Typography } from 'antd';

const { Title, Paragraph } = Typography;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', maxWidth: '800px', margin: '0 auto' }}>
          <Card>
            <Title level={2}>⚠️ 页面加载出错</Title>
            <Paragraph>
              抱歉，页面遇到了一些问题。请查看下面的错误信息：
            </Paragraph>
            
            <div style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              <strong>错误信息：</strong>
              <pre style={{ color: 'red', marginTop: '8px' }}>
                {this.state.error?.toString()}
              </pre>
            </div>

            {this.state.errorInfo && (
              <details style={{ marginBottom: '16px' }}>
                <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                  查看详细堆栈信息
                </summary>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '16px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              刷新页面
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
