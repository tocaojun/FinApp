import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Space, Tag, DatePicker, Select, Input, Typography,
  Row, Col, Statistic, Modal, Descriptions, Alert, Tooltip, Badge
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, ExportOutlined, EyeOutlined,
  FilterOutlined, ClearOutlined, WarningOutlined, InfoCircleOutlined,
  UserOutlined, SafetyOutlined, BugOutlined, ApiOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import { Permission } from '../../types/auth';
import PermissionGuard from '../../components/auth/PermissionGuard';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 日志级别枚举
enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

// 日志类型枚举
enum LogType {
  USER_ACTION = 'user_action',
  SYSTEM_EVENT = 'system_event',
  SECURITY_EVENT = 'security_event',
  API_REQUEST = 'api_request',
  ERROR_EVENT = 'error_event'
}

// 日志接口定义
interface SystemLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  type: LogType;
  action: string;
  userId?: string;
  username?: string;
  userRole?: string;
  resource?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  requestId?: string;
  duration?: number;
  statusCode?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// 日志级别配置
const LOG_LEVEL_CONFIG = {
  [LogLevel.INFO]: { color: 'blue', icon: <InfoCircleOutlined />, name: '信息' },
  [LogLevel.WARN]: { color: 'orange', icon: <WarningOutlined />, name: '警告' },
  [LogLevel.ERROR]: { color: 'red', icon: <BugOutlined />, name: '错误' },
  [LogLevel.DEBUG]: { color: 'gray', icon: <ApiOutlined />, name: '调试' }
};

// 日志类型配置
const LOG_TYPE_CONFIG = {
  [LogType.USER_ACTION]: { color: 'green', icon: <UserOutlined />, name: '用户操作' },
  [LogType.SYSTEM_EVENT]: { color: 'blue', icon: <SafetyOutlined />, name: '系统事件' },
  [LogType.SECURITY_EVENT]: { color: 'red', icon: <SafetyOutlined />, name: '安全事件' },
  [LogType.API_REQUEST]: { color: 'purple', icon: <ApiOutlined />, name: 'API请求' },
  [LogType.ERROR_EVENT]: { color: 'red', icon: <BugOutlined />, name: '错误事件' }
};

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // 筛选条件
  const [filters, setFilters] = useState({
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    level: 'all',
    type: 'all',
    userId: '',
    action: '',
    resource: ''
  });

  // 统计数据
  const [stats, setStats] = useState({
    totalLogs: 0,
    errorCount: 0,
    warningCount: 0,
    securityEvents: 0
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [logs]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // 模拟数据 - 实际项目中应该调用 API
      const mockLogs: SystemLog[] = [
        {
          id: '1',
          timestamp: '2025-01-19T08:30:15Z',
          level: LogLevel.INFO,
          type: LogType.USER_ACTION,
          action: '用户登录',
          userId: 'user_001',
          username: 'admin',
          userRole: '系统管理员',
          resource: '/auth/login',
          details: '用户成功登录系统',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          requestId: 'req_001',
          duration: 245,
          statusCode: 200
        },
        {
          id: '2',
          timestamp: '2025-01-19T08:32:22Z',
          level: LogLevel.INFO,
          type: LogType.USER_ACTION,
          action: '创建用户',
          userId: 'user_001',
          username: 'admin',
          userRole: '系统管理员',
          resource: '/api/users',
          details: '创建新用户: testuser',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          requestId: 'req_002',
          duration: 156,
          statusCode: 201,
          metadata: { targetUserId: 'user_002', targetUsername: 'testuser' }
        },
        {
          id: '3',
          timestamp: '2025-01-19T08:35:45Z',
          level: LogLevel.WARN,
          type: LogType.SECURITY_EVENT,
          action: '多次登录失败',
          resource: '/auth/login',
          details: '用户连续3次登录失败，账户已临时锁定',
          ipAddress: '192.168.1.200',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          requestId: 'req_003',
          duration: 89,
          statusCode: 429,
          metadata: { attemptCount: 3, lockDuration: 300 }
        },
        {
          id: '4',
          timestamp: '2025-01-19T08:40:12Z',
          level: LogLevel.ERROR,
          type: LogType.ERROR_EVENT,
          action: '数据库连接失败',
          resource: '/api/portfolios',
          details: '数据库连接超时',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          requestId: 'req_004',
          duration: 5000,
          statusCode: 500,
          errorMessage: 'Connection timeout after 5000ms',
          metadata: { dbHost: 'localhost:5432', retryCount: 3 }
        },
        {
          id: '5',
          timestamp: '2025-01-19T08:42:33Z',
          level: LogLevel.INFO,
          type: LogType.USER_ACTION,
          action: '更新权限',
          userId: 'user_001',
          username: 'admin',
          userRole: '系统管理员',
          resource: '/api/roles/permissions',
          details: '更新角色权限配置',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          requestId: 'req_005',
          duration: 234,
          statusCode: 200,
          metadata: { roleId: 'role_003', permissionsAdded: 2, permissionsRemoved: 1 }
        },
        {
          id: '6',
          timestamp: '2025-01-19T08:45:18Z',
          level: LogLevel.DEBUG,
          type: LogType.API_REQUEST,
          action: 'API调用',
          userId: 'user_002',
          username: 'testuser',
          userRole: '普通用户',
          resource: '/api/transactions',
          details: '查询交易记录',
          ipAddress: '192.168.1.150',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)',
          requestId: 'req_006',
          duration: 67,
          statusCode: 200,
          metadata: { pageSize: 20, pageNumber: 1, totalRecords: 156 }
        }
      ];
      
      setLogs(mockLogs);
    } catch (error: any) {
      console.error('获取系统日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalLogs = logs.length;
    const errorCount = logs.filter(log => log.level === LogLevel.ERROR).length;
    const warningCount = logs.filter(log => log.level === LogLevel.WARN).length;
    const securityEvents = logs.filter(log => log.type === LogType.SECURITY_EVENT).length;

    setStats({
      totalLogs,
      errorCount,
      warningCount,
      securityEvents
    });
  };

  const handleViewDetail = (log: SystemLog) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  const handleClearFilters = () => {
    setFilters({
      dateRange: null,
      level: 'all',
      type: 'all',
      userId: '',
      action: '',
      resource: ''
    });
  };

  const handleExport = () => {
    // 实现导出功能
    console.log('导出日志');
  };

  // 过滤日志
  const filteredLogs = logs.filter(log => {
    // 日期范围过滤
    if (filters.dateRange) {
      const logDate = dayjs(log.timestamp);
      if (!logDate.isBetween(filters.dateRange[0], filters.dateRange[1], 'day', '[]')) {
        return false;
      }
    }

    // 级别过滤
    if (filters.level !== 'all' && log.level !== filters.level) {
      return false;
    }

    // 类型过滤
    if (filters.type !== 'all' && log.type !== filters.type) {
      return false;
    }

    // 用户ID过滤
    if (filters.userId && !log.userId?.includes(filters.userId)) {
      return false;
    }

    // 操作过滤
    if (filters.action && !log.action.toLowerCase().includes(filters.action.toLowerCase())) {
      return false;
    }

    // 资源过滤
    if (filters.resource && !log.resource?.toLowerCase().includes(filters.resource.toLowerCase())) {
      return false;
    }

    return true;
  });

  const columns: ColumnsType<SystemLog> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: string) => (
        <div>
          <div>{dayjs(timestamp).format('MM-DD HH:mm:ss')}</div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            {dayjs(timestamp).format('YYYY')}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: LogLevel) => {
        const config = LOG_LEVEL_CONFIG[level];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.name}
          </Tag>
        );
      },
      filters: Object.entries(LOG_LEVEL_CONFIG).map(([key, config]) => ({
        text: config.name,
        value: key
      })),
      onFilter: (value, record) => record.level === value
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: LogType) => {
        const config = LOG_TYPE_CONFIG[type];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.name}
          </Tag>
        );
      },
      filters: Object.entries(LOG_TYPE_CONFIG).map(([key, config]) => ({
        text: config.name,
        value: key
      })),
      onFilter: (value, record) => record.type === value
    },
    {
      title: '用户信息',
      key: 'user',
      width: 120,
      render: (_, record) => (
        <div>
          {record.username ? (
            <>
              <div style={{ fontWeight: 500 }}>{record.username}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {record.userRole}
              </div>
            </>
          ) : (
            <Text type="secondary">系统</Text>
          )}
        </div>
      )
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => (
        <Text strong>{action}</Text>
      )
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      width: 150,
      render: (resource?: string) => (
        <Text code style={{ fontSize: '11px' }}>
          {resource || '-'}
        </Text>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_, record) => {
        if (!record.statusCode) return '-';
        
        let color = 'default';
        if (record.statusCode >= 200 && record.statusCode < 300) color = 'success';
        else if (record.statusCode >= 400 && record.statusCode < 500) color = 'warning';
        else if (record.statusCode >= 500) color = 'error';
        
        return (
          <Badge
            status={color as any}
            text={record.statusCode.toString()}
          />
        );
      }
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration?: number) => (
        duration ? `${duration}ms` : '-'
      )
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details: string) => (
        <Tooltip title={details}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {details}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        />
      )
    }
  ];

  return (
    <PermissionGuard permission={Permission.VIEW_SYSTEM_LOGS}>
      <div style={{ padding: '24px' }}>
        <Title level={2}>系统日志管理</Title>
        
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总日志数"
                value={stats.totalLogs}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="错误日志"
                value={stats.errorCount}
                valueStyle={{ color: '#cf1322' }}
                prefix={<BugOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="警告日志"
                value={stats.warningCount}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="安全事件"
                value={stats.securityEvents}
                valueStyle={{ color: '#722ed1' }}
                prefix={<SafetyOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          {/* 筛选条件 */}
          <div style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <RangePicker
                  placeholder={['开始日期', '结束日期']}
                  value={filters.dateRange}
                  onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="日志级别"
                  value={filters.level}
                  onChange={(value) => setFilters(prev => ({ ...prev, level: value }))}
                  style={{ width: '100%' }}
                >
                  <Option value="all">全部级别</Option>
                  {Object.entries(LOG_LEVEL_CONFIG).map(([key, config]) => (
                    <Option key={key} value={key}>{config.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="日志类型"
                  value={filters.type}
                  onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                  style={{ width: '100%' }}
                >
                  <Option value="all">全部类型</Option>
                  {Object.entries(LOG_TYPE_CONFIG).map(([key, config]) => (
                    <Option key={key} value={key}>{config.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Input
                  placeholder="用户ID"
                  value={filters.userId}
                  onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                />
              </Col>
              <Col span={3}>
                <Input
                  placeholder="操作"
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                />
              </Col>
              <Col span={3}>
                <Input
                  placeholder="资源"
                  value={filters.resource}
                  onChange={(e) => setFilters(prev => ({ ...prev, resource: e.target.value }))}
                />
              </Col>
            </Row>
            
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                >
                  清除筛选
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchLogs}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
              
              <Space>
                <Text type="secondary">
                  显示 {filteredLogs.length} / {logs.length} 条日志
                </Text>
                <Button
                  icon={<ExportOutlined />}
                  onClick={handleExport}
                >
                  导出
                </Button>
              </Space>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredLogs}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 1200 }}
            pagination={{
              total: filteredLogs.length,
              pageSize: 50,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
          />
        </Card>

        {/* 日志详情模态框 */}
        <Modal
          title="日志详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedLog && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="时间" span={2}>
                {dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="级别">
                <Tag color={LOG_LEVEL_CONFIG[selectedLog.level].color} icon={LOG_LEVEL_CONFIG[selectedLog.level].icon}>
                  {LOG_LEVEL_CONFIG[selectedLog.level].name}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color={LOG_TYPE_CONFIG[selectedLog.type].color} icon={LOG_TYPE_CONFIG[selectedLog.type].icon}>
                  {LOG_TYPE_CONFIG[selectedLog.type].name}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作">{selectedLog.action}</Descriptions.Item>
              <Descriptions.Item label="资源">{selectedLog.resource || '-'}</Descriptions.Item>
              <Descriptions.Item label="用户">{selectedLog.username || '系统'}</Descriptions.Item>
              <Descriptions.Item label="角色">{selectedLog.userRole || '-'}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{selectedLog.ipAddress}</Descriptions.Item>
              <Descriptions.Item label="请求ID">{selectedLog.requestId || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态码">{selectedLog.statusCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="耗时">{selectedLog.duration ? `${selectedLog.duration}ms` : '-'}</Descriptions.Item>
              <Descriptions.Item label="详情" span={2}>
                {selectedLog.details}
              </Descriptions.Item>
              {selectedLog.errorMessage && (
                <Descriptions.Item label="错误信息" span={2}>
                  <Text type="danger">{selectedLog.errorMessage}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="User Agent" span={2}>
                <Text code style={{ fontSize: '11px' }}>{selectedLog.userAgent}</Text>
              </Descriptions.Item>
              {selectedLog.metadata && (
                <Descriptions.Item label="元数据" span={2}>
                  <pre style={{ fontSize: '11px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>
      </div>
    </PermissionGuard>
  );
};

export default SystemLogs;