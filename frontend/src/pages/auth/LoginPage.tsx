import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, Divider, Space, message } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginRequest } from '../../types/auth';
import './LoginPage.css';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, state } = useAuth();

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const success = await login(values);
      if (success) {
        message.success('登录成功');
        // 根据用户角色跳转到不同页面
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-overlay" />
      </div>
      
      <div className="login-content">
        <Card className="login-card" bordered={false}>
          <div className="login-header">
            <div className="login-logo">
              <img src="/logo.svg" alt="FinApp" className="logo-image" />
            </div>
            <Title level={2} className="login-title">
              欢迎回来
            </Title>
            <Text type="secondary" className="login-subtitle">
              登录您的投资管理账户
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
            className="login-form"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名或邮箱' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名或邮箱"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item>
              <div className="login-options">
                <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <Link to="/forgot-password" className="forgot-password-link">
                  忘记密码？
                </Link>
              </div>
            </Form.Item>

            {state.error && (
              <Form.Item>
                <div className="login-error">
                  <Text type="danger">{state.error}</Text>
                </div>
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-button"
              >
                登录
              </Button>
            </Form.Item>

            <Divider plain>
              <Text type="secondary">或</Text>
            </Divider>

            <div className="login-footer">
              <Space>
                <Text type="secondary">还没有账户？</Text>
                <Link to="/register">立即注册</Link>
              </Space>
            </div>
          </Form>
        </Card>

        <div className="login-demo-accounts">
          <Card size="small" title="演示账户" className="demo-card">
            <Space direction="vertical" size="small">
              <div>
                <Text strong>管理员账户：</Text>
                <br />
                <Text code>admin / admin123</Text>
              </div>
              <div>
                <Text strong>普通用户：</Text>
                <br />
                <Text code>user / user123</Text>
              </div>
            </Space>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;