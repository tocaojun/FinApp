import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Table,
  Tag,
  Button,
  Select,
  Space,
  Typography,
  Progress,
  Badge,
  Tooltip,
  Switch,
  InputNumber,
  Form,
  Modal,
  List,
  Avatar,
  Divider,
  Timeline,
  notification,
  message
} from 'antd';
import {
  BellOutlined,
  RiseOutlined,
  FallOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SettingOutlined,
  AlertOutlined,
  LineChartOutlined,
  DollarOutlined,
  PercentageOutlined,
  ThunderboltOutlined,
  FireOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getMonitoringRules,
  createMonitoringRule,
  updateMonitoringRule,
  deleteMonitoringRule,
  getAlerts,
  markAlertAsRead,
  markAlertsAsRead,
  getMonitoringStats,
  checkMonitoringRules as checkRules,
  MonitoringRule,
  Alert as MonitoringAlert,
  MonitoringStats
} from '../../services/assetMonitoringApi';

const { Option } = Select;
const { Title, Text } = Typography;

interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetTypeName: string;
  marketName: string;
  currency: string;
  riskLevel: string;
  liquidityTag: string;
  sector?: string;
  currentPrice?: number;
  marketCap?: number;
  volume?: number;
  peRatio?: number;
  dividendYield?: number;
  beta?: number;
  volatility?: number;
  rating?: number;
  priceChange1D?: number;
  priceChange1W?: number;
  priceChange1M?: number;
  isActive: boolean;
}

interface MonitoringRule {
  id: string;
  assetId: string;
  type: 'price' | 'volume' | 'volatility' | 'pe' | 'marketcap';
  condition: 'above' | 'below' | 'change_above' | 'change_below';
  threshold: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  triggeredCount: number;
}

interface Alert {
  id: string;
  assetId: string;
  ruleId: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  value: number;
  threshold: number;
  createdAt: string;
  isRead: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AssetMonitoringProps {
  assets: Asset[];
  watchedAssets?: string[];
  onWatchedAssetsChange?: (assetIds: string[]) => void;
}

const AssetMonitoring: React.FC<AssetMonitoringProps> = ({
  assets,
  watchedAssets = [],
  onWatchedAssetsChange
}) => {
  const [monitoringRules, setMonitoringRules] = useState<MonitoringRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [alertsVisible, setAlertsVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [form] = Form.useForm();

  // 监控统计
  const [monitoringStats, setMonitoringStats] = useState({
    totalRules: 0,
    activeRules: 0,
    triggeredToday: 0,
    unreadAlerts: 0
  });

  // 初始化数据
  useEffect(() => {
    loadMonitoringData();
    // 实时监控
    const interval = setInterval(() => {
      if (monitoringEnabled) {
        checkMonitoringRules();
      }
    }, 30000); // 每30秒检查一次

    return () => clearInterval(interval);
  }, [monitoringEnabled, assets]);

  // 加载监控数据
  const loadMonitoringData = async () => {
    try {
      const [rules, alertsData, stats] = await Promise.all([
        getMonitoringRules(watchedAssets),
        getAlerts({ limit: 50 }),
        getMonitoringStats()
      ]);

      setMonitoringRules(rules);
      setAlerts(alertsData);
      setMonitoringStats(stats);
    } catch (error) {
      console.error('加载监控数据失败:', error);
      message.error('加载监控数据失败');
    }
  };

  // 检查监控规则
  const checkMonitoringRules = async () => {
    try {
      const result = await checkRules();
      if (result.newAlerts > 0) {
        message.info(`检测到 ${result.newAlerts} 个新告警`);
        // 重新加载告警数据
        const newAlerts = await getAlerts({ limit: 50 });
        setAlerts(newAlerts);
        
        // 更新统计
        const newStats = await getMonitoringStats();
        setMonitoringStats(newStats);
      }
    } catch (error) {
      console.error('检查监控规则失败:', error);
    }
  };

  // 触发告警
  const triggerAlert = (rule: MonitoringRule, asset: Asset, currentValue: number) => {
    const newAlert: Alert = {
      id: `alert_${Date.now()}`,
      assetId: rule.assetId,
      ruleId: rule.id,
      type: rule.condition.includes('above') ? 'danger' : 'warning',
      title: `${asset.symbol} ${getTypeLabel(rule.type)}告警`,
      message: `${asset.symbol} 当前${getTypeLabel(rule.type)} ${formatValue(currentValue, rule.type)} ${getConditionLabel(rule.condition)} 阈值 ${formatValue(rule.threshold, rule.type)}`,
      value: currentValue,
      threshold: rule.threshold,
      createdAt: dayjs().toISOString(),
      isRead: false,
      severity: getSeverity(rule.type, rule.condition)
    };

    setAlerts(prev => [newAlert, ...prev]);
    
    // 更新规则触发次数
    setMonitoringRules(prev => prev.map(r => 
      r.id === rule.id 
        ? { ...r, triggeredCount: r.triggeredCount + 1, triggeredAt: dayjs().toISOString() }
        : r
    ));

    // 显示通知
    notification.open({
      message: newAlert.title,
      description: newAlert.message,
      type: newAlert.type === 'danger' ? 'error' : newAlert.type,
      placement: 'topRight',
      duration: 0
    });

    // 更新统计
    setMonitoringStats(prev => ({
      ...prev,
      triggeredToday: prev.triggeredToday + 1,
      unreadAlerts: prev.unreadAlerts + 1
    }));
  };

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    const labels = {
      price: '价格',
      volume: '成交量',
      volatility: '波动率',
      pe: 'P/E比率',
      marketcap: '市值'
    };
    return labels[type as keyof typeof labels] || type;
  };

  // 获取条件标签
  const getConditionLabel = (condition: string) => {
    const labels = {
      above: '超过',
      below: '低于',
      change_above: '变化超过',
      change_below: '变化低于'
    };
    return labels[condition as keyof typeof labels] || condition;
  };

  // 格式化数值
  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'price':
      case 'marketcap':
        return `$${value.toFixed(2)}`;
      case 'volume':
        return value.toLocaleString();
      case 'volatility':
        return `${(value * 100).toFixed(2)}%`;
      case 'pe':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  // 获取严重程度
  const getSeverity = (type: string, condition: string): Alert['severity'] => {
    if (type === 'price' && condition.includes('above')) return 'high';
    if (type === 'volatility' && condition.includes('above')) return 'critical';
    if (type === 'volume' && condition.includes('below')) return 'medium';
    return 'low';
  };

  // 添加监控规则
  const handleAddRule = async (values: any) => {
    const newRule: MonitoringRule = {
      id: `rule_${Date.now()}`,
      assetId: values.assetId,
      type: values.type,
      condition: values.condition,
      threshold: values.threshold,
      isActive: true,
      createdAt: dayjs().toISOString(),
      triggeredCount: 0
    };

    setMonitoringRules(prev => [...prev, newRule]);
    setMonitoringStats(prev => ({
      ...prev,
      totalRules: prev.totalRules + 1,
      activeRules: prev.activeRules + 1
    }));

    setRuleModalVisible(false);
    form.resetFields();
    notification.success({
      message: '监控规则已添加',
      description: '新的监控规则已成功创建并激活'
    });
  };

  // 切换规则状态
  const toggleRuleStatus = (ruleId: string) => {
    setMonitoringRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive }
        : rule
    ));
  };

  // 删除规则
  const deleteRule = (ruleId: string) => {
    setMonitoringRules(prev => prev.filter(rule => rule.id !== ruleId));
    setMonitoringStats(prev => ({
      ...prev,
      totalRules: prev.totalRules - 1,
      activeRules: prev.activeRules - 1
    }));
  };

  // 标记告警为已读
  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isRead: true }
        : alert
    ));
    setMonitoringStats(prev => ({
      ...prev,
      unreadAlerts: Math.max(0, prev.unreadAlerts - 1)
    }));
  };

  // 监控规则表格列
  const ruleColumns: ColumnsType<MonitoringRule> = [
    {
      title: '资产',
      dataIndex: 'assetId',
      key: 'assetId',
      render: (assetId: string) => {
        const asset = assets.find(a => a.id === assetId);
        return asset ? (
          <Space>
            <Text strong>{asset.symbol}</Text>
            <Text type="secondary">{asset.name}</Text>
          </Space>
        ) : '-';
      }
    },
    {
      title: '监控类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{getTypeLabel(type)}</Tag>
      )
    },
    {
      title: '条件',
      key: 'condition',
      render: (_, record) => (
        <Space>
          <Text>{getConditionLabel(record.condition)}</Text>
          <Text strong>{formatValue(record.threshold, record.type)}</Text>
        </Space>
      )
    },
    {
      title: '触发次数',
      dataIndex: 'triggeredCount',
      key: 'triggeredCount',
      render: (count: number) => (
        <Badge count={count} showZero color={count > 0 ? '#f50' : '#87d068'} />
      )
    },
    {
      title: '最后触发',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={() => toggleRuleStatus(record.id)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          onClick={() => deleteRule(record.id)}
        >
          删除
        </Button>
      )
    }
  ];

  // 获取风险资产
  const getRiskAssets = () => {
    return assets
      .filter(asset => watchedAssets.includes(asset.id))
      .map(asset => {
        const riskScore = calculateRiskScore(asset);
        return { ...asset, riskScore };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
  };

  // 计算风险评分
  const calculateRiskScore = (asset: Asset) => {
    let score = 0;
    
    // 波动率风险
    if (asset.volatility && asset.volatility > 0.3) score += 30;
    else if (asset.volatility && asset.volatility > 0.2) score += 20;
    else if (asset.volatility && asset.volatility > 0.1) score += 10;
    
    // Beta风险
    if (asset.beta && asset.beta > 1.5) score += 25;
    else if (asset.beta && asset.beta > 1.2) score += 15;
    else if (asset.beta && asset.beta > 1.0) score += 5;
    
    // 价格变化风险
    if (asset.priceChange1D && Math.abs(asset.priceChange1D) > 10) score += 20;
    else if (asset.priceChange1D && Math.abs(asset.priceChange1D) > 5) score += 10;
    
    // 流动性风险
    if (asset.liquidityTag === 'LOW') score += 15;
    else if (asset.liquidityTag === 'MEDIUM') score += 5;
    
    return Math.min(score, 100);
  };

  const riskAssets = getRiskAssets();

  return (
    <div>
      {/* 监控概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="监控规则"
              value={monitoringStats.totalRules}
              prefix={<SettingOutlined />}
              suffix={`/ ${monitoringStats.activeRules} 激活`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日触发"
              value={monitoringStats.triggeredToday}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未读告警"
              value={monitoringStats.unreadAlerts}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#f50' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="关注资产"
              value={watchedAssets.length}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 控制面板 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>实时监控:</Text>
              <Switch
                checked={monitoringEnabled}
                onChange={setMonitoringEnabled}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
              <Divider type="vertical" />
              <Text type="secondary">
                {monitoringEnabled ? '监控系统正在运行' : '监控系统已暂停'}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={() => setRuleModalVisible(true)}
              >
                添加规则
              </Button>
              <Button
                icon={<BellOutlined />}
                onClick={() => setAlertsVisible(true)}
              >
                查看告警 {monitoringStats.unreadAlerts > 0 && (
                  <Badge count={monitoringStats.unreadAlerts} size="small" />
                )}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* 监控规则 */}
        <Col span={16}>
          <Card title="监控规则" extra={
            <Text type="secondary">{monitoringStats.activeRules} 个规则正在运行</Text>
          }>
            <Table
              columns={ruleColumns}
              dataSource={monitoringRules}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>

        {/* 风险资产 */}
        <Col span={8}>
          <Card title="高风险资产" extra={
            <Tooltip title="基于波动率、Beta值等指标计算的风险评分">
              <ExclamationCircleOutlined />
            </Tooltip>
          }>
            <List
              dataSource={riskAssets}
              renderItem={(asset) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: asset.riskScore > 70 ? '#f50' : asset.riskScore > 40 ? '#fa8c16' : '#52c41a' 
                        }}
                      >
                        {asset.symbol.charAt(0)}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Text strong>{asset.symbol}</Text>
                        <Tag color={asset.riskScore > 70 ? 'red' : asset.riskScore > 40 ? 'orange' : 'green'}>
                          风险: {asset.riskScore}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">{asset.name}</Text>
                        <br />
                        <Space size="small">
                          <Text>波动率: {((asset.volatility || 0) * 100).toFixed(1)}%</Text>
                          <Text>Beta: {(asset.beta || 0).toFixed(2)}</Text>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* 最新告警 */}
          <Card title="最新告警" style={{ marginTop: 16 }}>
            <Timeline
              items={alerts.slice(0, 5).map(alert => ({
                color: alert.severity === 'critical' ? 'red' : alert.severity === 'high' ? 'orange' : 'blue',
                children: (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong={!alert.isRead}>{alert.title}</Text>
                      {!alert.isRead && <Badge status="processing" />}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(alert.createdAt).format('MM-DD HH:mm')}
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: '12px' }}>{alert.message}</Text>
                    </div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* 添加规则模态框 */}
      <Modal
        title="添加监控规则"
        open={ruleModalVisible}
        onCancel={() => setRuleModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddRule}
        >
          <Form.Item
            name="assetId"
            label="选择资产"
            rules={[{ required: true, message: '请选择要监控的资产' }]}
          >
            <Select
              placeholder="选择资产"
              showSearch
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {assets
                .filter(asset => watchedAssets.includes(asset.id))
                .map(asset => (
                  <Option key={asset.id} value={asset.id}>
                    {asset.symbol} - {asset.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="监控类型"
                rules={[{ required: true, message: '请选择监控类型' }]}
              >
                <Select placeholder="选择监控类型">
                  <Option value="price">价格</Option>
                  <Option value="volume">成交量</Option>
                  <Option value="volatility">波动率</Option>
                  <Option value="pe">P/E比率</Option>
                  <Option value="marketcap">市值</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="condition"
                label="触发条件"
                rules={[{ required: true, message: '请选择触发条件' }]}
              >
                <Select placeholder="选择触发条件">
                  <Option value="above">高于</Option>
                  <Option value="below">低于</Option>
                  <Option value="change_above">变化超过</Option>
                  <Option value="change_below">变化低于</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="threshold"
            label="阈值"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <InputNumber
              placeholder="输入阈值"
              style={{ width: '100%' }}
              min={0}
              precision={2}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 告警列表模态框 */}
      <Modal
        title="告警中心"
        open={alertsVisible}
        onCancel={() => setAlertsVisible(false)}
        footer={null}
        width={800}
      >
        <List
          dataSource={alerts}
          renderItem={(alert) => (
            <List.Item
              actions={[
                !alert.isRead && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => markAlertAsRead(alert.id)}
                  >
                    标记已读
                  </Button>
                )
              ].filter(Boolean)}
              style={{
                backgroundColor: !alert.isRead ? '#f6ffed' : 'transparent',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      backgroundColor: alert.type === 'danger' ? '#f50' : alert.type === 'warning' ? '#fa8c16' : '#1890ff'
                    }}
                    icon={
                      alert.type === 'danger' ? <CloseCircleOutlined /> :
                      alert.type === 'warning' ? <ExclamationCircleOutlined /> :
                      <CheckCircleOutlined />
                    }
                  />
                }
                title={
                  <Space>
                    <Text strong={!alert.isRead}>{alert.title}</Text>
                    <Tag color={
                      alert.severity === 'critical' ? 'red' :
                      alert.severity === 'high' ? 'orange' :
                      alert.severity === 'medium' ? 'blue' : 'green'
                    }>
                      {alert.severity === 'critical' ? '严重' :
                       alert.severity === 'high' ? '高' :
                       alert.severity === 'medium' ? '中' : '低'}
                    </Tag>
                    {!alert.isRead && <Badge status="processing" text="未读" />}
                  </Space>
                }
                description={
                  <div>
                    <div>{alert.message}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(alert.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
          pagination={{
            pageSize: 10,
            showSizeChanger: false
          }}
        />
      </Modal>
    </div>
  );
};

export default AssetMonitoring;