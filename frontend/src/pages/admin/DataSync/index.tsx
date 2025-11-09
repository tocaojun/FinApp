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
import priceSyncApiClient from '../../../services/priceSyncApi';
import ExchangeRateSync from './ExchangeRateSync';

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
  country_id?: string;
}

interface SyncTask {
  id: string;
  name: string;
  description?: string;
  data_source_id: string;
  data_source_name?: string;
  provider?: string;
  asset_type_id?: string;
  country_id?: string;
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
        try {
          console.log('[DataSync] 开始加载数据...');
          setLoadError(null);
          
          // 第一阶段：加载关键数据（数据源和任务）- 必须成功
          await Promise.all([
            loadDataSources(),
            loadSyncTasks(),
          ]);
          
          console.log('[DataSync] 关键数据加载成功');
          
          // 第二阶段：加载次要数据（支持数据）- 超时不阻塞
          if (isMounted) {
            Promise.race([
              loadAssetTypes(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]).catch(error => {
              console.warn('加载资产类型超时，使用默认值:', error);
              // 使用默认值
              setAssetTypes([
                { id: '1', code: 'STOCK', name: '股票' },
                { id: '2', code: 'BOND', name: '债券' },
                { id: '3', code: 'FUND', name: '基金' },
                { id: '4', code: 'ETF', name: 'ETF' },
              ]);
            });
          }
          
          // 第三阶段：加载日志和资产（通常最耗时）- 异步非阻塞
          if (isMounted) {
            // 这些调用不会阻塞页面显示
            Promise.race([
              loadSyncLogs(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]).catch(error => {
              console.warn('加载同步日志超时:', error);
              setSyncLogs([]);
            });
            
            Promise.race([
              loadAssets(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]).catch(error => {
              console.warn('加载资产列表超时:', error);
              setAssets([]);
            });
          }
        } catch (error: any) {
          const errorMsg = error?.message || '未知错误';
          console.error('[DataSync] 数据加载过程中出错:', error);
          setLoadError(`数据加载失败: ${errorMsg}`);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadDataSources = async () => {
    try {
      // 设置5秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await priceSyncApiClient.get('/data-sources', {
        signal: controller.signal as any
      });
      clearTimeout(timeoutId);
      
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
      // 设置5秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await priceSyncApiClient.get('/tasks', {
        signal: controller.signal as any
      });
      clearTimeout(timeoutId);
      
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
      // 设置5秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await priceSyncApiClient.get('/logs?limit=20', {
        signal: controller.signal as any
      });
      clearTimeout(timeoutId);
      
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



  const loadAssets = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      // 只加载前500个资产，避免加载过多数据导致卡顿
      const response = await axios.get('/api/assets?limit=500&page=1', {
        timeout: 8000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.data) {
        const assetData = Array.isArray(response.data.data) ? response.data.data : [];
        setAssets(assetData.slice(0, 500));
      } else if (response.data && response.data.data === undefined) {
        const assetData = Array.isArray(response.data) ? response.data : [];
        setAssets(assetData.slice(0, 500));
      }
    } catch (error) {
      console.error('加载资产数据失败:', error);
      // 加载失败时设置空数组而不是中断加载流程
      setAssets([]);
    }
  };

  /**
   * 加载数据源的覆盖范围（支持的产品类型和国家）
   */
  const loadDataSourceCoverage = async (dataSourceId: string) => {
    try {
      console.log(`[Coverage] Loading coverage for data source: ${dataSourceId}`);
      const response = await priceSyncApiClient.get(`/data-sources/${dataSourceId}/coverage`);

      console.log(`[Coverage] Raw response:`, response.data);
      
      // 处理两种可能的响应格式
      const coverage = response.data?.data || response.data;
      
      if (coverage && coverage.productTypes) {
        const supportedProductTypes = coverage.productTypes || [];
        const countriesByProduct = coverage.countriesByProduct || {};

        console.log(`[Coverage] Received data:`, { supportedProductTypes, countriesByProduct });

        // 直接使用后端返回的 productTypes（已经是该数据源支持的类型）
        console.log(`[Coverage] Asset types from backend:`, supportedProductTypes.map((t: any) => `${t.code}(${t.id})`));
        setFilteredAssetTypes(supportedProductTypes);

        // 收集所有支持的国家（从 countriesByProduct 中提取）
        const allCountries = new Map<string, any>();
        Object.entries(countriesByProduct).forEach(([productCode, countries]: [string, any]) => {
          console.log(`[Coverage] Product ${productCode} has ${Array.isArray(countries) ? countries.length : 0} countries`);
          if (Array.isArray(countries)) {
            countries.forEach((country: any) => {
              if (country.id && !allCountries.has(country.id)) {
                allCountries.set(country.id, country);
              }
            });
          }
        });
        
        const countriesList = Array.from(allCountries.values());
        console.log(`[Coverage] Countries list:`, countriesList.map((c: any) => `${c.code}(${c.id})`));
        setFilteredMarkets(countriesList);
      } else {
        // 如果获取失败，清空国家列表
        console.warn('[Coverage] Coverage data format invalid, coverage:', coverage);
        setFilteredAssetTypes([]);
        setFilteredMarkets([]);
      }
    } catch (error: any) {
      console.error('[Coverage] Failed to load data source coverage:', error);
      if (error.code === 'ECONNABORTED') {
        console.error('[Coverage] Request timeout - backend may be unresponsive');
        message.warning('获取数据源配置超时，请检查后端服务是否运行正常');
      } else if (error.response?.status === 401) {
        console.error('[Coverage] Authentication failed');
        message.error('认证失败，请重新登录');
      }
      // 失败时清空选项
      setFilteredAssetTypes([]);
      setFilteredMarkets([]);
    }
  };



  const handleCreateTask = () => {
    console.log('[CreateTask] Creating new task');
    setEditingTask(null);
    form.resetFields();
    // 新建任务时，初始化为显示所有可选项（未选择数据源时）
    setFilteredAssetTypes([]);
    setFilteredMarkets([]); // 国家字段应该为空，需要先选择数据源
    setTaskModalVisible(true);
    console.log('[CreateTask] Task modal opened');
  };

  const handleEditTask = async (task: SyncTask) => {
    console.log(`[EditTask] Editing task: ${task.id}`);
    setEditingTask(task);
    form.setFieldsValue({
      name: task.name,
      description: task.description,
      data_source_id: task.data_source_id,
      asset_type_id: task.asset_type_id,
      country_id: task.country_id,
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
      console.log(`[EditTask] Loading coverage for: ${task.data_source_id}`);
      await loadDataSourceCoverage(task.data_source_id);
    } else {
      console.log('[EditTask] No data source selected');
      setFilteredAssetTypes([]);
      setFilteredMarkets([]);
    }
    setTaskModalVisible(true);
    console.log('[EditTask] Task modal opened');
  };

  const handleSaveTask = async (values: any) => {
    setLoading(true);
    try {
      const url = editingTask
        ? `/tasks/${editingTask.id}`
        : '/tasks';
      const method = editingTask ? 'put' : 'post';

      // 编辑时不发送 asset_ids，因为表单中没有此字段的编辑器
      const dataToSend = { ...values };
      if (editingTask) {
        delete dataToSend.asset_ids;
      }

      console.log('[SaveTask] Sending data:', dataToSend);

      await priceSyncApiClient({
        method,
        url,
        data: dataToSend,
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
          await priceSyncApiClient.delete(`/tasks/${taskId}`);
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
      await priceSyncApiClient.post(`/tasks/${taskId}/execute`, {});
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
        ? `/data-sources/${editingDataSource.id}`
        : '/data-sources';
      const method = editingDataSource ? 'put' : 'post';

      await priceSyncApiClient({
        method,
        url,
        data,
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
          await priceSyncApiClient.delete(`/data-sources/${dataSourceId}`);
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
            dataSource={(syncTasks || []).map(task => ({ ...task, key: task.id }))}
            loading={loading}
            pagination={{
              pageSize: 10,
              total: syncTasks?.length || 0,
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
            dataSource={(dataSources || []).map(ds => ({ ...ds, key: ds.id }))}
            loading={loading}
            pagination={{
              pageSize: 10,
              total: dataSources?.length || 0,
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
          dataSource={(syncLogs || []).map(log => ({ ...log, key: log.id }))}
          loading={loading}
          pagination={{
            pageSize: 10,
            total: syncLogs?.length || 0,
          }}
          scroll={{ x: 1200 }}
        />
      )
    },
    {
      key: 'exchangeRates',
      label: '汇率同步',
      children: <ExchangeRateSync />
    },
  ];

  return (
    <Card title="数据同步" style={{ margin: 0 }}>
      {loadError && (
        <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
          <p style={{ color: '#d4380d', margin: 0 }}>
            <strong>错误:</strong> {loadError}
          </p>
          <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: 12 }}>
            请检查后端服务是否正常运行，或打开浏览器开发者工具查看详细错误信息
          </p>
        </div>
      )}
      <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />

      <Modal
        title={editingDataSource ? '编辑数据源' : '新增数据源'}
        open={dataSourceModalVisible}
        onOk={() => dataSourceForm.submit()}
        onCancel={() => setDataSourceModalVisible(false)}
        width={700}
        destroyOnHidden
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
            tooltip="包含数据源特定配置的 JSON 对象，例如支持的产品类型、国家等"
          >
            <Input.TextArea
              rows={6}
              placeholder={`例如：{
  "supports_batch": false,
  "max_days_per_request": 365,
  "supports_products": ["STOCK", "ETF"],
  "supports_countries": ["CN", "US", "HK"]
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
                form.setFieldValue('country_id', undefined);
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
                      : '可选：选择一个资产类型'
                      : '请先选择数据源'
                  }
                  allowClear
                  disabled={filteredAssetTypes.length === 0 && form.getFieldValue('data_source_id')}
                  optionLabelProp="label"
                  onChange={(value) => {
                    // 清空国家选择
                    form.setFieldValue('country_id', undefined);
                  }}
                >
                  {filteredAssetTypes.map(type => (
                    <Option 
                      key={type.id} 
                      value={type.id}
                      label={type.name || type.code || type.id}
                    >
                      {type.name} {type.code && `(${type.code})`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="国家"
                name="country_id"
                tooltip="根据选定的数据源自动过滤可用的国家"
              >
                <Select
                  placeholder={
                    form.getFieldValue('data_source_id')
                      ? filteredMarkets.length === 0
                      ? '该数据源不支持国家选择'
                      : '可选：选择一个国家'
                      : '请先选择数据源'
                  }
                  allowClear
                  disabled={
                    filteredMarkets.length === 0 &&
                    form.getFieldValue('data_source_id')
                  }
                  optionLabelProp="label"
                >
                  {filteredMarkets.map(market => (
                    <Option 
                      key={market.id} 
                      value={market.id}
                      label={market.name || market.code || market.id}
                    >
                      {market.name} {market.code && `(${market.code})`}
                    </Option>
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
                <InputNumber min={0} max={3650} />
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
