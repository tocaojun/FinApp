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

const DataSync: React.FC = () => {
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
  const [dataSourceForm] = Form.useForm();
  const [filteredAssetTypes, setFilteredAssetTypes] = useState<AssetType[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
  const [dataSourceModalVisible, setDataSourceModalVisible] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null);

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
        timeout: 8000, // 8秒超时
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.data) {
        const sourceData = Array.isArray(response.data.data) ? response.data.data : [];
        setDataSources(sourceData);
      } else if (response.data && response.data.data === undefined) {
        setDataSources(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('加载数据源失败:', error);
      // 使用默认数据源作为备选
      setDataSources([
        { id: '1', name: 'Yahoo Finance', provider: 'yahoo_finance', is_active: true },
        { id: '2', name: 'Tushare', provider: 'tushare', is_active: false },
        { id: '3', name: 'EastMoney', provider: 'eastmoney', is_active: false },
      ]);
    }
  };

  const loadSyncTasks = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/price-sync/tasks', {
        timeout: 8000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.data) {
        const taskData = Array.isArray(response.data.data) ? response.data.data : [];
        setSyncTasks(taskData);
      } else if (response.data && response.data.data === undefined) {
        setSyncTasks(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('加载同步任务失败:', error);
      setSyncTasks([]);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/price-sync/logs?limit=20', {
        timeout: 8000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.data) {
        const logData = Array.isArray(response.data.data) ? response.data.data : [];
        setSyncLogs(logData);
      } else if (response.data && response.data.data === undefined) {
        setSyncLogs(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('加载同步日志失败:', error);
      setSyncLogs([]);
    }
  };

  const loadAssetTypes = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/assets/types', {
        timeout: 8000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.data) {
        const typeData = Array.isArray(response.data.data) ? response.data.data : [];
        setAssetTypes(typeData);
      } else if (response.data && response.data.data === undefined) {
        setAssetTypes(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('加载资产类型失败，使用默认值:', error);
      // 使用默认资产类型作为备选
      setAssetTypes([
        { id: '1', code: 'STOCK', name: '股票' },
        { id: '2', code: 'BOND', name: '债券' },
        { id: '3', code: 'FUND', name: '基金' },
        { id: '4', code: 'ETF', name: 'ETF' },
      ]);
    }
  };

  const loadMarkets = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/markets', {
        timeout: 8000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.data) {
        const marketData = Array.isArray(response.data.data) ? response.data.data : [];
        setMarkets(marketData);
      } else if (response.data && response.data.data === undefined) {
        // 处理直接返回数组的情况（某些API设计）
        setMarkets(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('加载市场数据失败，使用默认值:', error);
      // 使用默认市场数据作为备选
      setMarkets([
        { id: 'd1f012ef-ff87-447e-9061-43b77382c43c', code: 'SSE', name: '上海证券交易所' },
        { id: '93b2ea2a-17ee-41c5-9603-e82aee44417f', code: 'SZSE', name: '深圳证券交易所' },
        { id: 'b32e2b9c-e3d4-4e41-b7bb-81e9c35db53c', code: 'HKEX', name: '香港交易所' },
        { id: 'bf6232a9-40e3-4788-98e8-f18ee0ec2fb6', code: 'NYSE', name: '纽约证券交易所' },
        { id: 'b9e633ae-50b0-467d-bf96-351b9eab0a0c', code: 'NASDAQ', name: '纳斯达克' },
        { id: 'b4359415-0cbc-4786-97a9-2ffbf5df7188', code: 'LSE', name: '伦敦证券交易所' },
        { id: '93e69f74-5df6-47ef-9ac2-639072dcf1cf', code: 'TSE', name: '东京证券交易所' },
        { id: '06954cbd-28dd-444c-9137-85bf6a15ecf2', code: 'FWB', name: '法兰克福证券交易所' },
      ]);
    }
  };

  const loadAssets = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/assets', {
        timeout: 8000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.data) {
        const assetData = Array.isArray(response.data.data) ? response.data.data : [];
        setAssets(assetData);
      } else if (response.data && response.data.data === undefined) {
        setAssets(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('加载资产数据失败:', error);
      setAssets([]);
    }
  };

  /**
   * 加载数据源的覆盖范围（支持的产品类型和市场）
   * 返回级联关系：数据源 -> 产品类型 -> 市场
   */
  const loadDataSourceCoverage = async (dataSourceId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`/api/price-sync/data-sources/${dataSourceId}/coverage`, {
        timeout: 8000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.data) {
        const coverage = response.data.data;
        const supportedProductTypes = coverage.productTypes || [];

        // 过滤资产类型：只显示该数据源支持的类型
        const filtered = assetTypes.filter(type =>
          supportedProductTypes.some((pt: any) => pt.code === type.code)
        );
        setFilteredAssetTypes(filtered);

        // 清空市场选择，等待用户选择产品类型后再加载
        setFilteredMarkets([]);
      } else {
        // 如果获取失败，显示所有选项
        setFilteredAssetTypes(assetTypes);
        setFilteredMarkets(markets);
      }
    } catch (error) {
      console.error('加载数据源覆盖范围失败:', error);
      // 失败时显示所有选项
      setFilteredAssetTypes(assetTypes);
      setFilteredMarkets(markets);
    }
  };

  /**
   * 加载指定数据源和资产类型组合支持的市场
   * 用于级联过滤的第三级
   */
  const loadMarketsByAssetType = async (dataSourceId: string, assetTypeCode: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `/api/price-sync/data-sources/${dataSourceId}/markets?asset_type=${assetTypeCode}`,
        {
          timeout: 8000,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setFilteredMarkets(response.data.data);
      } else {
        setFilteredMarkets([]);
      }
    } catch (error) {
      console.error('加载市场列表失败:', error);
      setFilteredMarkets([]);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    form.resetFields();
    // 新建任务时，初始化为显示所有可选项（未选择数据源时）
    setFilteredAssetTypes(assetTypes);
    setFilteredMarkets(markets);
    setTaskModalVisible(true);
  };

  const handleEditTask = async (task: SyncTask) => {
    setEditingTask(task);
    form.setFieldsValue({
      name: task.name,
      description: task.description,
      data_source_id: task.data_source_id,
      asset_type_id: task.asset_type_id,
      market_id: task.market_id,
      asset_ids: task.asset_ids,
      schedule_type: task.schedule_type,
      cron_expression: task.cron_expression,
      interval_minutes: task.interval_minutes,
      sync_days_back: task.sync_days_back,
      overwrite_existing: task.overwrite_existing,
      is_active: task.is_active,
    });
    // 如果有选择的数据源，加载其覆盖范围
    if (task.data_source_id) {
      await loadDataSourceCoverage(task.data_source_id);
      // 如果还有选择的资产类型，加载对应的市场
      if (task.asset_type_id) {
        // 获取资产类型的代码
        const assetType = assetTypes.find(at => at.id === task.asset_type_id);
        if (assetType) {
          await loadMarketsByAssetType(task.data_source_id, assetType.code);
        }
      }
    } else {
      setFilteredAssetTypes([]);
      setFilteredMarkets([]);
    }
    setTaskModalVisible(true);
  };

  const handleSaveTask = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingTask
        ? `/api/price-sync/tasks/${editingTask.id}`
        : '/api/price-sync/tasks';
      const method = editingTask ? 'put' : 'post';

      await axios({
        method,
        url,
        data: values,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      message.success(editingTask ? '任务已更新' : '任务已创建');
      setTaskModalVisible(false);
      await loadSyncTasks();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Modal.confirm({
      title: '删除任务',
      content: '确定要删除这个同步任务吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const token = localStorage.getItem('auth_token');
          await axios.delete(`/api/price-sync/tasks/${taskId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          message.success('任务已删除');
          await loadSyncTasks();
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败');
        }
      }
    });
  };

  const handleRunTask = async (taskId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      await axios.post(`/api/price-sync/tasks/${taskId}/execute`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('同步任务已启动');
      await Promise.all([loadSyncTasks(), loadSyncLogs()]);
    } catch (error: any) {
      message.error(error.response?.data?.message || '任务启动失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDataSource = () => {
    setEditingDataSource(null);
    dataSourceForm.resetFields();
    setDataSourceModalVisible(true);
  };

  const handleEditDataSource = (dataSource: DataSource) => {
    setEditingDataSource(dataSource);
    dataSourceForm.setFieldsValue({
      name: dataSource.name,
      provider: dataSource.provider,
      api_endpoint: dataSource.api_endpoint,
      is_active: dataSource.is_active,
      config: dataSource.config ? JSON.stringify(dataSource.config, null, 2) : '{}',
    });
    setDataSourceModalVisible(true);
  };

  const handleSaveDataSource = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // 解析 config JSON
      let configObj = {};
      try {
        configObj = values.config ? JSON.parse(values.config) : {};
      } catch (e) {
        message.error('Config JSON 格式不正确');
        setLoading(false);
        return;
      }

      const data = {
        name: values.name,
        provider: values.provider,
        api_endpoint: values.api_endpoint,
        is_active: values.is_active,
        config: configObj,
      };

      const url = editingDataSource
        ? `/api/price-sync/data-sources/${editingDataSource.id}`
        : '/api/price-sync/data-sources';
      const method = editingDataSource ? 'put' : 'post';

      await axios({
        method,
        url,
        data,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      message.success(editingDataSource ? '数据源已更新' : '数据源已创建');
      setDataSourceModalVisible(false);
      await loadDataSources();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataSource = (dataSourceId: string) => {
    Modal.confirm({
      title: '删除数据源',
      content: '确定要删除这个数据源吗？删除后使用该数据源的任务将无法运行。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const token = localStorage.getItem('auth_token');
          await axios.delete(`/api/price-sync/data-sources/${dataSourceId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          message.success('数据源已删除');
          await loadDataSources();
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败');
        }
      }
    });
  };

  // 任务表格列配置
  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '数据源',
      dataIndex: 'data_source_name',
      key: 'data_source_name',
      width: 120,
    },
    {
      title: '调度方式',
      dataIndex: 'schedule_type',
      key: 'schedule_type',
      width: 100,
      render: (text: string) => {
        const labels: { [key: string]: string } = {
          manual: '手动',
          cron: '定时',
          interval: '定期',
        };
        return labels[text] || text;
      }
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '最后运行',
      dataIndex: 'last_run_at',
      key: 'last_run_at',
      width: 150,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '未运行'
    },
    {
      title: '最后结果',
      dataIndex: 'last_run_status',
      key: 'last_run_status',
      width: 100,
      render: (status: string) => {
        if (status === 'success') {
          return <Tag icon={<CheckCircleOutlined />} color="green">成功</Tag>;
        } else if (status === 'failed') {
          return <Tag icon={<CloseCircleOutlined />} color="red">失败</Tag>;
        } else if (status === 'running') {
          return <Tag icon={<SyncOutlined spin />} color="processing">运行中</Tag>;
        }
        return <Tag>未知</Tag>;
      }
    },
    {
      title: '操作',
      key: 'operation',
      width: 150,
      fixed: 'right' as const,
      render: (_, record: SyncTask) => (
        <Space size="small">
          <Tooltip title="立即运行">
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              loading={loading}
              onClick={() => handleRunTask(record.id)}
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
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTask(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 日志表格列配置
  const logColumns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      width: 150,
    },
    {
      title: '数据源',
      dataIndex: 'data_source_name',
      key: 'data_source_name',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (status === 'success') {
          return <Tag icon={<CheckCircleOutlined />} color="green">成功</Tag>;
        } else if (status === 'failed') {
          return <Tag icon={<CloseCircleOutlined />} color="red">失败</Tag>;
        } else if (status === 'running') {
          return <Tag icon={<SyncOutlined spin />} color="processing">运行中</Tag>;
        }
        return <Tag icon={<ClockCircleOutlined />}>{status}</Tag>;
      }
    },
    {
      title: '记录数',
      dataIndex: 'total_records',
      key: 'total_records',
      width: 80,
      render: (records: number) => `${records} 条`
    },
    {
      title: '成功',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 80,
      render: (count: number) => <span style={{ color: 'green' }}>{count}</span>
    },
    {
      title: '失败',
      dataIndex: 'failed_count',
      key: 'failed_count',
      width: 80,
      render: (count: number) => <span style={{ color: 'red' }}>{count}</span>
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '耗时',
      dataIndex: 'duration_seconds',
      key: 'duration_seconds',
      width: 80,
      render: (seconds?: number) => seconds ? `${seconds}s` : '-'
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'tasks',
      label: '同步任务',
      children: (
        <>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTask}
            style={{ marginBottom: 16 }}
          >
            新建任务
          </Button>
          <Table
            columns={taskColumns}
            dataSource={syncTasks.map(task => ({ ...task, key: task.id }))}
            loading={loading}
            pagination={{
              pageSize: 10,
              total: syncTasks.length,
            }}
            scroll={{ x: 1200 }}
          />
        </>
      )
    },
    {
      key: 'datasources',
      label: '数据源',
      children: (
        <>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateDataSource}
            style={{ marginBottom: 16 }}
          >
            新增数据源
          </Button>
          <Table
            columns={[
              {
                title: '名称',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: '提供商',
                dataIndex: 'provider',
                key: 'provider',
              },
              {
                title: '状态',
                dataIndex: 'is_active',
                key: 'is_active',
                render: (active: boolean) => (
                  <Tag color={active ? 'green' : 'red'}>
                    {active ? '启用' : '禁用'}
                  </Tag>
                )
              },
              {
                title: '最后同步',
                dataIndex: 'last_sync_at',
                key: 'last_sync_at',
                render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '未同步'
              },
              {
                title: '最后结果',
                dataIndex: 'last_sync_status',
                key: 'last_sync_status',
                render: (status: string) => {
                  if (status === 'success') {
                    return <Tag icon={<CheckCircleOutlined />} color="green">成功</Tag>;
                  } else if (status === 'failed') {
                    return <Tag icon={<CloseCircleOutlined />} color="red">失败</Tag>;
                  } else if (status === 'partial') {
                    return <Tag icon={<InfoCircleOutlined />} color="orange">部分</Tag>;
                  }
                  return <Tag>-</Tag>;
                }
              },
              {
                title: '操作',
                key: 'operation',
                width: 150,
                render: (_, record: DataSource) => (
                  <Space size="small">
                    <Tooltip title="编辑">
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditDataSource(record)}
                      />
                    </Tooltip>
                    <Tooltip title="删除">
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteDataSource(record.id)}
                      />
                    </Tooltip>
                  </Space>
                )
              },
            ]}
            dataSource={dataSources.map(ds => ({ ...ds, key: ds.id }))}
            loading={loading}
            pagination={{
              pageSize: 10,
              total: dataSources.length,
            }}
          />
        </>
      )
    },
    {
      key: 'logs',
      label: '同步日志',
      children: (
        <Table
          columns={logColumns}
          dataSource={syncLogs.map(log => ({ ...log, key: log.id }))}
          loading={loading}
          pagination={{
            pageSize: 10,
            total: syncLogs.length,
          }}
          scroll={{ x: 1200 }}
        />
      )
    },
  ];

  return (
    <Card title="数据同步" style={{ margin: 0 }}>
      <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />

      <Modal
        title={editingDataSource ? '编辑数据源' : '新增数据源'}
        open={dataSourceModalVisible}
        onOk={() => dataSourceForm.submit()}
        onCancel={() => setDataSourceModalVisible(false)}
        width={700}
        destroyOnClose
      >
        <Form
          form={dataSourceForm}
          layout="vertical"
          onFinish={handleSaveDataSource}
        >
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入数据源名称' }]}
          >
            <Input placeholder="例如：Yahoo Finance" />
          </Form.Item>

          <Form.Item
            label="提供商"
            name="provider"
            rules={[{ required: true, message: '请选择或输入提供商' }]}
          >
            <Select placeholder="选择提供商">
              <Option value="yahoo_finance">Yahoo Finance</Option>
              <Option value="eastmoney">EastMoney（东方财富）</Option>
              <Option value="tushare">Tushare</Option>
              <Option value="sina">Sina（新浪）</Option>
              <Option value="alpha_vantage">Alpha Vantage</Option>
              <Option value="polygon">Polygon.io</Option>
              <Option value="iex_cloud">IEX Cloud</Option>
              <Option value="tiingo">Tiingo</Option>
              <Option value="fred">FRED</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="API 端点"
            name="api_endpoint"
            tooltip="数据源的 API 基础 URL"
          >
            <Input placeholder="例如：https://query1.finance.yahoo.com/v8/finance/chart/" />
          </Form.Item>

          <Form.Item
            label="配置（JSON 格式）"
            name="config"
            tooltip="包含数据源特定配置的 JSON 对象，例如支持的产品类型、市场等"
          >
            <Input.TextArea
              rows={6}
              placeholder={`例如：{
  "supports_batch": false,
  "max_days_per_request": 365,
  "supports_products": ["STOCK", "ETF"],
  "supports_markets": ["NYSE", "NASDAQ"]
}`}
            />
          </Form.Item>

          <Form.Item
            label="启用此数据源"
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingTask ? '编辑同步任务' : '新建同步任务'}
        open={taskModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setTaskModalVisible(false)}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTask}
        >
          <Form.Item
            label="任务名称"
            name="name"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="例如：每日基金价格同步" />
          </Form.Item>

          <Form.Item
            label="任务描述"
            name="description"
          >
            <Input.TextArea rows={2} placeholder="可选：描述这个任务的目的" />
          </Form.Item>

          <Form.Item
            label="数据源"
            name="data_source_id"
            rules={[{ required: true, message: '请选择数据源' }]}
          >
            <Select
              placeholder="选择数据源"
              onChange={(value) => {
                // 清空之前的选择
                form.setFieldValue('asset_type_id', undefined);
                form.setFieldValue('market_id', undefined);
                // 加载该数据源的覆盖范围
                loadDataSourceCoverage(value);
              }}
            >
              {dataSources.map(ds => (
                <Option key={ds.id} value={ds.id}>{ds.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="资产类型"
                name="asset_type_id"
                tooltip="根据选定的数据源自动过滤可用的资产类型"
              >
                <Select
                  placeholder={
                    form.getFieldValue('data_source_id')
                      ? filteredAssetTypes.length === 0
                        ? '该数据源不支持资产类型选择'
                        : '可选：选择资产类型'
                      : '请先选择数据源'
                  }
                  allowClear
                  disabled={filteredAssetTypes.length === 0 && form.getFieldValue('data_source_id')}
                  onChange={(value) => {
                    // 清空市场选择
                    form.setFieldValue('market_id', undefined);
                    // 加载该资产类型对应的市场
                    if (value && form.getFieldValue('data_source_id')) {
                      loadMarketsByAssetType(form.getFieldValue('data_source_id'), value);
                    } else {
                      setFilteredMarkets([]);
                    }
                  }}
                >
                  {filteredAssetTypes.map(type => (
                    <Option key={type.id} value={type.code}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="市场"
                name="market_id"
                tooltip="根据选定的数据源和资产类型自动过滤可用的市场"
              >
                <Select
                  placeholder={
                    form.getFieldValue('data_source_id')
                      ? form.getFieldValue('asset_type_id')
                        ? filteredMarkets.length === 0
                          ? '该组合不支持市场选择'
                          : '可选：选择市场'
                        : '请先选择资产类型'
                      : '请先选择数据源'
                  }
                  allowClear
                  disabled={
                    filteredMarkets.length === 0 &&
                    form.getFieldValue('data_source_id') &&
                    form.getFieldValue('asset_type_id')
                  }
                >
                  {filteredMarkets.map(market => (
                    <Option key={market.id} value={market.id}>{market.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="调度方式"
            name="schedule_type"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择调度方式">
              <Option value="manual">手动</Option>
              <Option value="interval">定期（分钟）</Option>
              <Option value="cron">定时（Cron表达式）</Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.schedule_type !== currentValues.schedule_type}>
            {({ getFieldValue }) =>
              getFieldValue('schedule_type') === 'interval' ? (
                <Form.Item
                  label="间隔（分钟）"
                  name="interval_minutes"
                  rules={[{ required: true, message: '请输入间隔分钟数' }]}
                >
                  <InputNumber min={1} max={10080} placeholder="如 60 表示每小时" />
                </Form.Item>
              ) : getFieldValue('schedule_type') === 'cron' ? (
                <Form.Item
                  label="Cron 表达式"
                  name="cron_expression"
                  rules={[{ required: true, message: '请输入Cron表达式' }]}
                >
                  <Input placeholder="例如：0 9 * * * 表示每天 9 点" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="回溯天数"
                name="sync_days_back"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} max={365} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="覆盖已有数据"
                name="overwrite_existing"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="启用此任务"
            name="is_active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DataSync;
