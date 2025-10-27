import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  Descriptions,
  Progress,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  SyncOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  StopOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;

interface DataSource {
  id: string;
  name: string;
  provider: string;
  api_endpoint?: string;
  is_active: boolean;
  last_sync_at?: string;
  last_sync_status?: string;
  config?: any;
}

interface AssetType {
  id: string;
  code: string;
  name: string;
}

interface Market {
  id: string;
  code: string;
  name: string;
}

interface Asset {
  id: string;
  symbol: string;
  name: string;
  asset_type_id: string;
  market_id?: string;
}

interface SyncTask {
  id: string;
  name: string;
  description?: string;
  data_source_id: string;
  data_source_name?: string;
  provider?: string;
  asset_type_id?: string;
  market_id?: string;
  asset_ids?: string[];
  schedule_type: 'manual' | 'cron' | 'interval';
  cron_expression?: string;
  interval_minutes?: number;
  sync_days_back: number;
  overwrite_existing: boolean;
  is_active: boolean;
  last_run_at?: string;
  last_run_status?: string;
  last_run_result?: any;
}

interface SyncLog {
  id: string;
  task_name: string;
  data_source_name: string;
  started_at: string;
  completed_at?: string;
  status: string;
  total_assets: number;
  total_records: number;
  success_count: number;
  failed_count: number;
  duration_seconds?: number;
}

const ApiSync: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [syncTasks, setSyncTasks] = useState<SyncTask[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<SyncTask | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await Promise.all([
          loadDataSources(),
          loadSyncTasks(),
          loadSyncLogs(),
          loadAssetTypes(),
          loadMarkets(),
          loadAssets(),
        ]);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadDataSources = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/price-sync/data-sources', {
        timeout: 3000, // 3秒超时
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setDataSources(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load data sources:', error);
      // 如果是404或超时，不显示错误消息（API可能未启用）
      if (error.response?.status !== 404 && error.code !== 'ECONNABORTED') {
        message.error('加载数据源失败: ' + (error.response?.data?.error?.message || error.message));
      }
    }
  };

  const loadSyncTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/price-sync/tasks', {
        timeout: 3000, // 3秒超时
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setSyncTasks(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load sync tasks:', error);
      // 如果是404或超时，不显示错误消息（API可能未启用）
      if (error.response?.status !== 404 && error.code !== 'ECONNABORTED') {
        message.error('加载同步任务失败: ' + (error.response?.data?.error?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/price-sync/logs?limit=100', {
        timeout: 3000, // 3秒超时
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setSyncLogs(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load sync logs:', error);
      // 如果是404或超时，不显示错误消息（API可能未启用）
      if (error.response?.status !== 404 && error.code !== 'ECONNABORTED') {
        message.error('加载同步日志失败');
      }
    }
  };

  const loadAssetTypes = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/assets/types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setAssetTypes(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load asset types:', error);
      message.error('加载资产类型失败: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const loadMarkets = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/assets/markets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setMarkets(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load markets:', error);
      message.error('加载市场列表失败: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const loadAssets = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/assets?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setAssets(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load assets:', error);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({
      schedule_type: 'manual',
      sync_days_back: 1,
      overwrite_existing: false,
      is_active: true,
    });
    setTaskModalVisible(true);
  };

  const handleEditTask = (task: SyncTask) => {
    setEditingTask(task);
    form.setFieldsValue(task);
    setTaskModalVisible(true);
  };

  const handleSaveTask = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      if (editingTask) {
        // 更新任务
        const response = await axios.put(
          `/api/price-sync/tasks/${editingTask.id}`,
          values,
          { headers }
        );
        if (response.data.success) {
          message.success('任务更新成功');
          setTaskModalVisible(false);
          loadSyncTasks();
        }
      } else {
        // 创建任务
        const response = await axios.post('/api/price-sync/tasks', values, { headers });
        if (response.data.success) {
          message.success('任务创建成功');
          setTaskModalVisible(false);
          loadSyncTasks();
        }
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      message.error('保存任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个同步任务吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const token = localStorage.getItem('auth_token');
          const response = await axios.delete(`/api/price-sync/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.data.success) {
            message.success('任务删除成功');
            loadSyncTasks();
          }
        } catch (error) {
          console.error('Failed to delete task:', error);
          message.error('删除任务失败');
        }
      },
    });
  };

  const handleExecuteTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`/api/price-sync/tasks/${taskId}/execute`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        message.success('同步任务已启动，请稍后查看执行日志');
        // 5秒后刷新任务列表和日志
        setTimeout(() => {
          loadSyncTasks();
          loadSyncLogs();
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to execute task:', error);
      message.error('启动同步任务失败');
    }
  };

  const getStatusTag = (status?: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      success: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
      running: { color: 'processing', icon: <SyncOutlined spin />, text: '运行中' },
      partial: { color: 'warning', icon: <InfoCircleOutlined />, text: '部分成功' },
    };

    const config = status ? statusConfig[status] : { color: 'default', icon: null, text: '未运行' };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getScheduleTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      manual: '手动',
      cron: 'Cron表达式',
      interval: '定时间隔',
    };
    return typeMap[type] || type;
  };

  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '数据源',
      dataIndex: 'data_source_name',
      key: 'data_source_name',
      width: 150,
    },
    {
      title: '调度类型',
      dataIndex: 'schedule_type',
      key: 'schedule_type',
      width: 120,
      render: (type: string) => getScheduleTypeText(type),
    },
    {
      title: '调度配置',
      key: 'schedule_config',
      width: 150,
      render: (_: any, record: SyncTask) => {
        if (record.schedule_type === 'cron') {
          return <code>{record.cron_expression}</code>;
        } else if (record.schedule_type === 'interval') {
          return `每 ${record.interval_minutes} 分钟`;
        }
        return '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后运行',
      dataIndex: 'last_run_at',
      key: 'last_run_at',
      width: 180,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '运行状态',
      dataIndex: 'last_run_status',
      key: 'last_run_status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: SyncTask) => (
        <Space size="small">
          <Tooltip title="立即执行">
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleExecuteTask(record.id)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditTask(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTask(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const logColumns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      width: 200,
    },
    {
      title: '数据源',
      dataIndex: 'data_source_name',
      key: 'data_source_name',
      width: 150,
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 180,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '资产数',
      dataIndex: 'total_assets',
      key: 'total_assets',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '记录数',
      dataIndex: 'total_records',
      key: 'total_records',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '成功',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 100,
      align: 'right' as const,
      render: (count: number) => <span style={{ color: '#52c41a' }}>{count}</span>,
    },
    {
      title: '失败',
      dataIndex: 'failed_count',
      key: 'failed_count',
      width: 100,
      align: 'right' as const,
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#ff4d4f' : undefined }}>{count}</span>
      ),
    },
    {
      title: '耗时(秒)',
      dataIndex: 'duration_seconds',
      key: 'duration_seconds',
      width: 100,
      align: 'right' as const,
      render: (seconds: number) => seconds || '-',
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'tasks',
      label: (
        <span>
          <SyncOutlined />
          同步任务
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总任务数"
                  value={syncTasks.length}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="启用任务"
                  value={syncTasks.filter(t => t.is_active).length}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="运行中"
                  value={syncTasks.filter(t => t.last_run_status === 'running').length}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<SyncOutlined spin />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="数据源"
                  value={dataSources.filter(ds => ds.is_active).length}
                  prefix={<InfoCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card>
            <Space style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateTask}
              >
                创建同步任务
              </Button>
              <Button icon={<SyncOutlined />} onClick={loadSyncTasks}>
                刷新
              </Button>
            </Space>

            <Table
              columns={taskColumns}
              dataSource={syncTasks}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'logs',
      label: (
        <span>
          <HistoryOutlined />
          同步日志
        </span>
      ),
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<SyncOutlined />} onClick={loadSyncLogs}>
              刷新
            </Button>
          </Space>

          <Table
            columns={logColumns}
            dataSource={syncLogs}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Modal
        title={editingTask ? '编辑同步任务' : '创建同步任务'}
        open={taskModalVisible}
        onOk={handleSaveTask}
        onCancel={() => setTaskModalVisible(false)}
        width={700}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="例如：每日股票价格同步" />
          </Form.Item>

          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={2} placeholder="任务的详细说明" />
          </Form.Item>

          <Form.Item
            name="data_source_id"
            label="数据源"
            rules={[{ required: true, message: '请选择数据源' }]}
          >
            <Select placeholder="选择数据源">
              {dataSources.map(ds => (
                <Option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.provider})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={
              <span>
                同步资产范围&nbsp;
                <Tooltip title="至少选择一项：资产类型、市场或具体资产。如果都不选择，将同步所有活跃资产。">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="asset_type_id" noStyle>
                  <Select placeholder="选择资产类型（可选）" allowClear>
                    {assetTypes.map(type => (
                      <Option key={type.id} value={type.id}>
                        {type.name} ({type.code})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="market_id" noStyle>
                  <Select placeholder="选择市场（可选）" allowClear>
                    {markets.map(market => (
                      <Option key={market.id} value={market.id}>
                        {market.name} ({market.code})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="asset_ids" noStyle style={{ marginTop: 8 }}>
              <Select
                mode="multiple"
                placeholder="选择具体资产（可选，支持多选）"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                }
                style={{ marginTop: 8 }}
              >
                {assets.map(asset => (
                  <Option key={asset.id} value={asset.id}>
                    {asset.symbol} - {asset.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="schedule_type"
                label="调度类型"
                rules={[{ required: true, message: '请选择调度类型' }]}
              >
                <Select>
                  <Option value="manual">手动执行</Option>
                  <Option value="cron">Cron表达式</Option>
                  <Option value="interval">定时间隔</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.schedule_type !== currentValues.schedule_type
                }
              >
                {({ getFieldValue }) => {
                  const scheduleType = getFieldValue('schedule_type');
                  if (scheduleType === 'cron') {
                    return (
                      <Form.Item
                        name="cron_expression"
                        label="Cron表达式"
                        rules={[{ required: true, message: '请输入Cron表达式' }]}
                      >
                        <Input placeholder="0 0 16 * * ?" />
                      </Form.Item>
                    );
                  } else if (scheduleType === 'interval') {
                    return (
                      <Form.Item
                        name="interval_minutes"
                        label="间隔(分钟)"
                        rules={[{ required: true, message: '请输入间隔分钟数' }]}
                      >
                        <InputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    );
                  }
                  return null;
                }}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sync_days_back"
                label="回溯天数"
                rules={[{ required: true, message: '请输入回溯天数' }]}
                tooltip="支持回溯最多 10 年（3650 天）的历史数据"
              >
                <InputNumber 
                  min={1} 
                  max={3650} 
                  style={{ width: '100%' }} 
                  placeholder="输入回溯天数（1-3650）"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="overwrite_existing" label="覆盖已有数据" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="is_active" label="启用任务" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApiSync;
