import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { AuthService, LoginRequest, RegisterRequest } from '../../services/authService';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const handleLogin = async (values: LoginRequest) => {
    setLoading(true);
    try {
      await AuthService.login(values);
      message.success('登录成功');
      loginForm.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = '登录失败';
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = '服务器连接失败，请检查后端服务是否启动';
        } else if (error.message.includes('401')) {
          errorMessage = '邮箱或密码错误';
        } else if (error.message.includes('Backend service not available')) {
          errorMessage = '后端服务不可用，请稍后重试';
        } else {
          errorMessage = error.message;
        }
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterRequest) => {
    setLoading(true);
    try {
      await AuthService.register(values);
      message.success('注册成功');
      registerForm.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Register error:', error);
      let errorMessage = '注册失败';
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = '服务器连接失败，请检查后端服务是否启动';
        } else if (error.message.includes('409')) {
          errorMessage = '邮箱已被注册';
        } else if (error.message.includes('Backend service not available')) {
          errorMessage = '后端服务不可用，请稍后重试';
        } else {
          errorMessage = error.message;
        }
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    loginForm.resetFields();
    registerForm.resetFields();
    onClose();
  };

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <div>
          <Form
            form={loginForm}
            name="login"
            onFinish={handleLogin}
            layout="vertical"
          >
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="请输入邮箱"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={{ width: '100%' }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <p>测试账户：</p>
            <p>邮箱: testapi@finapp.com</p>
            <p>密码: testapi123</p>
          </div>
        </div>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          form={registerForm}
          name="register"
          onFinish={handleRegister}
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="firstName"
            label="姓"
            rules={[{ required: true, message: '请输入姓' }]}
          >
            <Input placeholder="请输入姓" size="large" />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="名"
            rules={[{ required: true, message: '请输入名' }]}
          >
            <Input placeholder="请输入名" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{ width: '100%' }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ];

  return (
    <Modal
      title="用户认证"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />
    </Modal>
  );
};

export default LoginModal;