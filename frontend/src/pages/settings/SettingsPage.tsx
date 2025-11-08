import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tabs,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Radio,
  Divider,
  Avatar,
  Upload,
  message,
  Space,
  Typography,
  Alert,
  Modal,
  List,
  Tag,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  BellOutlined,
  GlobalOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 类型定义
interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  avatar: string;
  bio: string;
  timezone: string;
  language: string;
  createdAt: string;
  lastLoginAt: string;
}

interface SystemPreferences {
  theme: 'light' | 'dark' | 'auto';
  currency: string;
  dateFormat: string;
  numberFormat: string;
  autoSave: boolean;
  autoBackup: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
    allowAnalytics: boolean;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  passwordLastChanged: string;
  trustedDevices: Array<{
    id: string;
    name: string;
    lastUsed: string;
    location: string;
  }>;
}

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<SystemPreferences | null>(null);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const [profileForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // 从 API 加载用户数据
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // 从 localStorage 获取 token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('未登录');
        }

        // 获取用户个人资料
        const response = await fetch('http://localhost:8000/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('获取用户信息失败');
        }

        const data = await response.json();
        const user = data.data?.user;

        if (user) {
          const userProfile: UserProfile = {
            id: user.id,
            username: user.username || user.email.split('@')[0],
            email: user.email,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            phone: user.phone || '',
            avatar: user.avatarUrl || '',
            bio: user.bio || '',
            timezone: user.timezone || 'Asia/Shanghai',
            language: user.language || 'zh-CN',
            createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '',
            lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '未登录'
          };

          setUserProfile(userProfile);
          profileForm.setFieldsValue(userProfile);
        }
      } catch (error) {
        console.error('加载用户信息错误:', error);
        message.error('加载用户信息失败，请刷新重试');
      } finally {
        setLoading(false);
      }
    };

    // 加载偏好设置（从 localStorage 或默认值）
    const preferences: SystemPreferences = {
      theme: (localStorage.getItem('theme') as any) || 'light',
      currency: localStorage.getItem('currency') || 'CNY',
      dateFormat: localStorage.getItem('dateFormat') || 'YYYY-MM-DD',
      numberFormat: localStorage.getItem('numberFormat') || 'zh-CN',
      autoSave: localStorage.getItem('autoSave') !== 'false',
      autoBackup: localStorage.getItem('autoBackup') !== 'false',
      notifications: {
        email: localStorage.getItem('notifications.email') !== 'false',
        push: localStorage.getItem('notifications.push') !== 'false',
        sms: localStorage.getItem('notifications.sms') === 'true'
      },
      privacy: {
        showProfile: localStorage.getItem('privacy.showProfile') !== 'false',
        showActivity: localStorage.getItem('privacy.showActivity') === 'true',
        allowAnalytics: localStorage.getItem('privacy.allowAnalytics') !== 'false'
      }
    };
    setPreferences(preferences);
    preferencesForm.setFieldsValue(preferences);

    // 加载安全设置（默认值）
    const security: SecuritySettings = {
      twoFactorEnabled: false,
      loginNotifications: true,
      sessionTimeout: 30,
      passwordLastChanged: new Date().toLocaleDateString('zh-CN'),
      trustedDevices: [
        {
          id: '1',
          name: 'MacBook Pro',
          lastUsed: new Date().toLocaleString('zh-CN'),
          location: '上海, 中国'
        }
      ]
    };
    setSecurity(security);

    fetchUserProfile();
  }, [profileForm, preferencesForm]);

  // 头像上传配置
  const uploadProps: UploadProps = {
    name: 'avatar',
    listType: 'picture-card',
    className: 'avatar-uploader',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片!');
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
      }
      return isJpgOrPng && isLt2M;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success('头像上传成功');
      }
    }
  };

  // 保存个人信息
  const handleSaveProfile = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('未登录');
      }

      const response = await fetch('http://localhost:8000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: values.fullName?.split(' ')[0] || '',
          lastName: values.fullName?.split(' ')[1] || '',
          phone: values.phone,
          timezone: values.timezone,
          language: values.language,
          bio: values.bio
        })
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      const data = await response.json();
      setUserProfile({ ...userProfile!, ...values });
      message.success('个人信息保存成功');
    } catch (error) {
      console.error('保存错误:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 保存系统偏好
  const handleSavePreferences = async (values: any) => {
    setLoading(true);
    try {
      // 将偏好设置保存到 localStorage
      localStorage.setItem('theme', values.theme);
      localStorage.setItem('currency', values.currency);
      localStorage.setItem('dateFormat', values.dateFormat);
      localStorage.setItem('numberFormat', values.numberFormat);
      localStorage.setItem('autoSave', values.autoSave);
      localStorage.setItem('autoBackup', values.autoBackup);
      localStorage.setItem('notifications.email', values.notifications?.email);
      localStorage.setItem('notifications.push', values.notifications?.push);
      localStorage.setItem('notifications.sms', values.notifications?.sms);
      localStorage.setItem('privacy.showProfile', values.privacy?.showProfile);
      localStorage.setItem('privacy.showActivity', values.privacy?.showActivity);
      localStorage.setItem('privacy.allowAnalytics', values.privacy?.allowAnalytics);

      setPreferences({ ...preferences!, ...values });
      message.success('系统偏好保存成功');
    } catch (error) {
      console.error('保存错误:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('未登录');
      }

      const response = await fetch('http://localhost:8000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '密码修改失败');
      }

      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error: any) {
      console.error('密码修改错误:', error);
      message.error(error.message || '密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 启用/禁用双因素认证
  const handleToggle2FA = (enabled: boolean) => {
    Modal.confirm({
      title: enabled ? '启用双因素认证' : '禁用双因素认证',
      icon: <ExclamationCircleOutlined />,
      content: enabled 
        ? '启用双因素认证将提高账户安全性，需要您的手机验证码才能登录。'
        : '禁用双因素认证将降低账户安全性，确定要继续吗？',
      onOk: () => {
        setSecurity({ ...security!, twoFactorEnabled: enabled });
        message.success(enabled ? '双因素认证已启用' : '双因素认证已禁用');
      }
    });
  };

  // 移除信任设备
  const handleRemoveTrustedDevice = (deviceId: string) => {
    const updatedDevices = security!.trustedDevices.filter(d => d.id !== deviceId);
    setSecurity({ ...security!, trustedDevices: updatedDevices });
    message.success('设备已移除');
  };

  if (!userProfile || !preferences || !security) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          设置中心
        </Title>
        <Paragraph type="secondary">
          管理您的个人信息、系统偏好和安全设置
        </Paragraph>
      </div>

      <Tabs defaultActiveKey="profile" size="large">
        {/* 个人信息 */}
        <TabPane 
          tab={
            <span>
              <UserOutlined />
              个人信息
            </span>
          } 
          key="profile"
        >
          <Row gutter={24}>
            <Col span={16}>
              <Card title="基本信息">
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleSaveProfile}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="用户名"
                        name="username"
                        rules={[{ required: true, message: '请输入用户名' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="姓名"
                        name="fullName"
                        rules={[{ required: true, message: '请输入姓名' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="邮箱"
                        name="email"
                        rules={[
                          { required: true, message: '请输入邮箱' },
                          { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="手机号"
                        name="phone"
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="时区"
                        name="timezone"
                      >
                        <Select>
                          <Option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</Option>
                          <Option value="America/New_York">America/New_York (UTC-5)</Option>
                          <Option value="Europe/London">Europe/London (UTC+0)</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="语言"
                        name="language"
                      >
                        <Select>
                          <Option value="zh-CN">简体中文</Option>
                          <Option value="en-US">English</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label="个人简介"
                    name="bio"
                  >
                    <TextArea rows={4} placeholder="介绍一下您自己..." />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存更改
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={8}>
              <Card title="头像设置">
                <div style={{ textAlign: 'center' }}>
                  <Upload {...uploadProps}>
                    <Avatar 
                      size={120} 
                      icon={<UserOutlined />}
                      src={userProfile.avatar}
                      style={{ marginBottom: '16px' }}
                    />
                  </Upload>
                  <div>
                    <Button icon={<UploadOutlined />}>
                      上传头像
                    </Button>
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    支持 JPG、PNG 格式，文件大小不超过 2MB
                  </Text>
                </div>

                <Divider />

                <div>
                  <Text strong>账户信息</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary">注册时间：</Text>
                    <Text>{userProfile.createdAt}</Text>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary">最后登录：</Text>
                    <Text>{userProfile.lastLoginAt}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* 系统偏好 */}
        <TabPane 
          tab={
            <span>
              <GlobalOutlined />
              系统偏好
            </span>
          } 
          key="preferences"
        >
          <Card>
            <Form
              form={preferencesForm}
              layout="vertical"
              onFinish={handleSavePreferences}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Card title="显示设置" size="small">
                    <Form.Item label="主题" name="theme">
                      <Radio.Group>
                        <Radio value="light">浅色</Radio>
                        <Radio value="dark">深色</Radio>
                        <Radio value="auto">跟随系统</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item label="默认货币" name="currency">
                      <Select>
                        <Option value="CNY">人民币 (CNY)</Option>
                        <Option value="USD">美元 (USD)</Option>
                        <Option value="EUR">欧元 (EUR)</Option>
                        <Option value="HKD">港币 (HKD)</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="日期格式" name="dateFormat">
                      <Select>
                        <Option value="YYYY-MM-DD">2024-09-18</Option>
                        <Option value="MM/DD/YYYY">09/18/2024</Option>
                        <Option value="DD/MM/YYYY">18/09/2024</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="数字格式" name="numberFormat">
                      <Select>
                        <Option value="zh-CN">1,234.56 (中文)</Option>
                        <Option value="en-US">1,234.56 (英文)</Option>
                        <Option value="de-DE">1.234,56 (德文)</Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card title="功能设置" size="small">
                    <Form.Item label="自动保存" name="autoSave" valuePropName="checked">
                      <Switch />
                    </Form.Item>

                    <Form.Item label="自动备份" name="autoBackup" valuePropName="checked">
                      <Switch />
                    </Form.Item>

                    <Divider />

                    <Text strong>通知设置</Text>
                    <Form.Item label="邮件通知" name={['notifications', 'email']} valuePropName="checked">
                      <Switch />
                    </Form.Item>

                    <Form.Item label="推送通知" name={['notifications', 'push']} valuePropName="checked">
                      <Switch />
                    </Form.Item>

                    <Form.Item label="短信通知" name={['notifications', 'sms']} valuePropName="checked">
                      <Switch />
                    </Form.Item>

                    <Divider />

                    <Text strong>隐私设置</Text>
                    <Form.Item label="显示个人资料" name={['privacy', 'showProfile']} valuePropName="checked">
                      <Switch />
                    </Form.Item>

                    <Form.Item label="显示活动状态" name={['privacy', 'showActivity']} valuePropName="checked">
                      <Switch />
                    </Form.Item>

                    <Form.Item label="允许数据分析" name={['privacy', 'allowAnalytics']} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Card>
                </Col>
              </Row>

              <div style={{ marginTop: '24px' }}>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存设置
                </Button>
              </div>
            </Form>
          </Card>
        </TabPane>

        {/* 安全设置 */}
        <TabPane 
          tab={
            <span>
              <SecurityScanOutlined />
              安全设置
            </span>
          } 
          key="security"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Card title="密码安全">
                <div style={{ marginBottom: '16px' }}>
                  <Text>密码最后修改时间：{security.passwordLastChanged}</Text>
                </div>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => setPasswordModalVisible(true)}
                >
                  修改密码
                </Button>

                <Divider />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <Text strong>双因素认证</Text>
                    <div>
                      <Text type="secondary">为您的账户添加额外的安全保护</Text>
                    </div>
                  </div>
                  <Switch 
                    checked={security.twoFactorEnabled}
                    onChange={handleToggle2FA}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <Text strong>登录通知</Text>
                    <div>
                      <Text type="secondary">新设备登录时发送通知</Text>
                    </div>
                  </div>
                  <Switch 
                    checked={security.loginNotifications}
                    onChange={(checked) => setSecurity({ ...security, loginNotifications: checked })}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Text strong>会话超时</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Select 
                      value={security.sessionTimeout}
                      onChange={(value) => setSecurity({ ...security, sessionTimeout: value })}
                      style={{ width: '200px' }}
                    >
                      <Option value={15}>15 分钟</Option>
                      <Option value={30}>30 分钟</Option>
                      <Option value={60}>1 小时</Option>
                      <Option value={240}>4 小时</Option>
                    </Select>
                  </div>
                </div>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="信任设备">
                <List
                  dataSource={security.trustedDevices}
                  renderItem={(device) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          title="确定要移除此设备吗？"
                          onConfirm={() => handleRemoveTrustedDevice(device.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button type="link" danger icon={<DeleteOutlined />}>
                            移除
                          </Button>
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        title={device.name}
                        description={
                          <div>
                            <div>最后使用：{device.lastUsed}</div>
                            <div>位置：{device.location}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度至少8位' }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                }
              })
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认修改
              </Button>
              <Button onClick={() => setPasswordModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;