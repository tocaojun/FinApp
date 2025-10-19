import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Space, Tag, Switch, Typography, Row, Col,
  message, Tooltip, Alert, Divider, Input, Select, Checkbox
} from 'antd';
import {
  SafetyOutlined, SearchOutlined, ReloadOutlined, ExportOutlined,
  SaveOutlined, UndoOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Permission, UserRole } from '../../types/auth';
import PermissionGuard from '../../components/auth/PermissionGuard';
import { getPermissionMatrix, updateRolePermissions, PermissionMatrixData } from '../../services/permissionApi';

const { Title, Text } = Typography;
const { Option } = Select;

// 权限分组和描述
const PERMISSION_CONFIG = {
  [Permission.MANAGE_USERS]: {
    group: '系统管理',
    name: '用户管理',
    description: '创建、编辑、删除用户账户',
    risk: 'high'
  },
  [Permission.MANAGE_PERMISSIONS]: {
    group: '系统管理',
    name: '权限管理',
    description: '管理角色和权限分配',
    risk: 'high'
  },
  [Permission.VIEW_SYSTEM_LOGS]: {
    group: '系统管理',
    name: '系统日志',
    description: '查看系统操作日志',
    risk: 'medium'
  },
  [Permission.SYSTEM_SETTINGS]: {
    group: '系统管理',
    name: '系统设置',
    description: '修改系统配置参数',
    risk: 'high'
  },
  [Permission.MANAGE_PRODUCTS]: {
    group: '产品管理',
    name: '产品管理',
    description: '管理投资产品信息',
    risk: 'medium'
  },
  [Permission.UPDATE_PRICES]: {
    group: '产品管理',
    name: '价格更新',
    description: '更新产品价格数据',
    risk: 'medium'
  },
  [Permission.MANAGE_EXCHANGE_RATES]: {
    group: '产品管理',
    name: '汇率管理',
    description: '管理货币汇率信息',
    risk: 'medium'
  },
  [Permission.MANAGE_PORTFOLIOS]: {
    group: '投资组合',
    name: '组合管理',
    description: '管理投资组合',
    risk: 'low'
  },
  [Permission.CREATE_TRANSACTIONS]: {
    group: '交易管理',
    name: '创建交易',
    description: '录入新的投资交易',
    risk: 'low'
  },
  [Permission.VIEW_TRANSACTIONS]: {
    group: '交易管理',
    name: '查看交易',
    description: '查看交易记录',
    risk: 'low'
  },
  [Permission.EDIT_TRANSACTIONS]: {
    group: '交易管理',
    name: '编辑交易',
    description: '修改交易记录',
    risk: 'medium'
  },
  [Permission.DELETE_TRANSACTIONS]: {
    group: '交易管理',
    name: '删除交易',
    description: '删除交易记录',
    risk: 'high'
  },
  [Permission.MANAGE_TAGS]: {
    group: '标签管理',
    name: '标签管理',
    description: '管理自定义标签',
    risk: 'low'
  },
  [Permission.VIEW_REPORTS]: {
    group: '报表分析',
    name: '查看报表',
    description: '查看各类分析报表',
    risk: 'low'
  },
  [Permission.EXPORT_DATA]: {
    group: '报表分析',
    name: '数据导出',
    description: '导出数据和报表',
    risk: 'medium'
  },
  [Permission.VIEW_DASHBOARD]: {
    group: '基础权限',
    name: '仪表板',
    description: '访问主仪表板',
    risk: 'low'
  },
  [Permission.EDIT_PROFILE]: {
    group: '基础权限',
    name: '个人资料',
    description: '编辑个人资料',
    risk: 'low'
  }
};

const PermissionMatrix: React.FC = () => {
  const [matrixData, setMatrixData] = useState<PermissionMatrixData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<PermissionMatrixData[]>([]);

  useEffect(() => {
    fetchPermissionMatrix();
  }, []);

  const fetchPermissionMatrix = async () => {
    setLoading(true);
    try {
      const data = await getPermissionMatrix();
      setMatrixData(data);
      setOriginalData(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error('获取权限矩阵失败:', error);
      message.error('获取权限矩阵失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存权限变更
  const handleSaveChanges = async () => {
    try {
      const updates = matrixData.map(role => ({
        roleId: role.roleId,
        permissions: role.permissions
      }));
      
      await updateRolePermissions(updates);
      message.success('权限矩阵更新成功');
      setHasChanges(false);
      setOriginalData(JSON.parse(JSON.stringify(matrixData)));
    } catch (error) {
      console.error('保存权限矩阵失败:', error);
      message.error('保存权限矩阵失败');
    }
  };

  // 重置变更
  const handleResetChanges = () => {
    setMatrixData(JSON.parse(JSON.stringify(originalData)));
    setHasChanges(false);
  };



  const handlePermissionChange = (roleId: string, permission: Permission, checked: boolean) => {
    const role = matrixData.find(r => r.roleId === roleId);
    if (role?.isSystem) {
      message.warning('系统角色权限不可修改');
      return;
    }

    setMatrixData(prev => prev.map(role => 
      role.roleId === roleId 
        ? { ...role, permissions: { ...role.permissions, [permission]: checked } }
        : role
    ));
    setHasChanges(true);
  };

  const handleBatchPermissionChange = (permission: Permission, checked: boolean) => {
    setMatrixData(prev => prev.map(role => 
      role.isSystem 
        ? role 
        : { ...role, permissions: { ...role.permissions, [permission]: checked } }
    ));
    setHasChanges(true);
  };

  const handleRolePermissionChange = (roleId: string, checked: boolean) => {
    const role = matrixData.find(r => r.roleId === roleId);
    if (role?.isSystem) {
      message.warning('系统角色权限不可修改');
      return;
    }

    setMatrixData(prev => prev.map(role => 
      role.roleId === roleId 
        ? { 
            ...role, 
            permissions: Object.keys(role.permissions).reduce((acc, key) => {
              acc[key as Permission] = checked;
              return acc;
            }, {} as Record<Permission, boolean>)
          }
        : role
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOriginalData(JSON.parse(JSON.stringify(matrixData)));
      setHasChanges(false);
      message.success('权限配置保存成功');
    } catch (error: any) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMatrixData(JSON.parse(JSON.stringify(originalData)));
    setHasChanges(false);
    message.info('已重置为上次保存的状态');
  };

  // 获取权限分组
  const permissionGroups = Array.from(new Set(
    Object.values(PERMISSION_CONFIG).map(config => config.group)
  ));

  // 过滤权限
  const filteredPermissions = Object.entries(PERMISSION_CONFIG).filter(([permission, config]) => {
    const matchesSearch = config.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || config.group === selectedGroup;
    const matchesRisk = selectedRisk === 'all' || config.risk === selectedRisk;
    
    return matchesSearch && matchesGroup && matchesRisk;
  });

  // 构建表格列
  const columns: ColumnsType<any> = [
    {
      title: '权限信息',
      dataIndex: 'permission',
      key: 'permission',
      width: 300,
      fixed: 'left',
      render: (_, record) => {
        const config = PERMISSION_CONFIG[record.permission as Permission];
        const riskColor = {
          low: 'green',
          medium: 'orange',
          high: 'red'
        }[config.risk];

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text strong>{config.name}</Text>
              <Tag color={riskColor}>
                {config.risk === 'low' ? '低风险' : config.risk === 'medium' ? '中风险' : '高风险'}
              </Tag>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
              {config.group}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {config.description}
            </div>
          </div>
        );
      }
    },
    {
      title: (
        <div style={{ textAlign: 'center' }}>
          <div>批量操作</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            <Checkbox
              indeterminate={
                matrixData.some(role => !role.isSystem) &&
                !matrixData.filter(role => !role.isSystem).every(role => 
                  filteredPermissions.every(([permission]) => role.permissions[permission as Permission])
                )
              }
              checked={
                matrixData.filter(role => !role.isSystem).length > 0 &&
                matrixData.filter(role => !role.isSystem).every(role => 
                  filteredPermissions.every(([permission]) => role.permissions[permission as Permission])
                )
              }
              onChange={(e) => {
                filteredPermissions.forEach(([permission]) => {
                  handleBatchPermissionChange(permission as Permission, e.target.checked);
                });
              }}
            >
              全选
            </Checkbox>
          </div>
        </div>
      ),
      dataIndex: 'batch',
      key: 'batch',
      width: 120,
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Checkbox
            checked={
              matrixData.filter(role => !role.isSystem).every(role => 
                role.permissions[record.permission as Permission]
              )
            }
            indeterminate={
              matrixData.filter(role => !role.isSystem).some(role => 
                role.permissions[record.permission as Permission]
              ) &&
              !matrixData.filter(role => !role.isSystem).every(role => 
                role.permissions[record.permission as Permission]
              )
            }
            onChange={(e) => handleBatchPermissionChange(record.permission, e.target.checked)}
          />
        </div>
      )
    },
    ...matrixData.map(role => ({
      title: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {role.roleName}
            {role.isSystem && <Tag color="blue">系统</Tag>}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            <Checkbox
              checked={
                filteredPermissions.every(([permission]) => 
                  role.permissions[permission as Permission]
                )
              }
              indeterminate={
                filteredPermissions.some(([permission]) => 
                  role.permissions[permission as Permission]
                ) &&
                !filteredPermissions.every(([permission]) => 
                  role.permissions[permission as Permission]
                )
              }
              onChange={(e) => {
                filteredPermissions.forEach(([permission]) => {
                  handlePermissionChange(role.roleId, permission as Permission, e.target.checked);
                });
              }}
              disabled={role.isSystem}
            >
              全选
            </Checkbox>
          </div>
        </div>
      ),
      dataIndex: role.roleId,
      key: role.roleId,
      width: 120,
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Switch
            size="small"
            checked={role.permissions[record.permission as Permission]}
            onChange={(checked) => handlePermissionChange(role.roleId, record.permission, checked)}
            disabled={role.isSystem}
          />
        </div>
      )
    }))
  ];

  // 表格数据源
  const dataSource = filteredPermissions.map(([permission]) => ({
    key: permission,
    permission
  }));

  return (
    <PermissionGuard permission={Permission.MANAGE_PERMISSIONS}>
      <div style={{ padding: '24px' }}>
        <Title level={2}>权限矩阵管理</Title>
        
        <Alert
          message="权限矩阵说明"
          description="通过权限矩阵可以直观地查看和管理各角色的权限分配。系统角色（标有系统标签）的权限不可修改。修改后请及时保存配置。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Card>
          {/* 操作栏 */}
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space>
                  <Input
                    placeholder="搜索权限名称或描述"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 250 }}
                  />
                  
                  <Select
                    placeholder="权限分组"
                    value={selectedGroup}
                    onChange={setSelectedGroup}
                    style={{ width: 120 }}
                  >
                    <Option value="all">全部分组</Option>
                    {permissionGroups.map(group => (
                      <Option key={group} value={group}>{group}</Option>
                    ))}
                  </Select>
                  
                  <Select
                    placeholder="风险等级"
                    value={selectedRisk}
                    onChange={setSelectedRisk}
                    style={{ width: 120 }}
                  >
                    <Option value="all">全部等级</Option>
                    <Option value="low">低风险</Option>
                    <Option value="medium">中风险</Option>
                    <Option value="high">高风险</Option>
                  </Select>
                  
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchPermissionMatrix}
                    loading={loading}
                  >
                    刷新
                  </Button>
                </Space>
              </Col>
              
              <Col>
                <Space>
                  {hasChanges && (
                    <Text type="warning">
                      <InfoCircleOutlined /> 有未保存的更改
                    </Text>
                  )}
                  
                  <Button icon={<ExportOutlined />}>
                    导出
                  </Button>
                  
                  <Button
                    icon={<UndoOutlined />}
                    onClick={handleReset}
                    disabled={!hasChanges}
                  >
                    重置
                  </Button>
                  
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={saving}
                    disabled={!hasChanges}
                  >
                    保存配置
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* 权限矩阵表格 */}
          <Table
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            pagination={false}
            scroll={{ x: 800 + matrixData.length * 120, y: 600 }}
            size="small"
            bordered
          />
          
          <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
            <Space split={<Divider type="vertical" />}>
              <span>共 {filteredPermissions.length} 个权限</span>
              <span>共 {matrixData.length} 个角色</span>
              <span>
                <Tag color="green">低风险</Tag>
                <Tag color="orange">中风险</Tag>
                <Tag color="red">高风险</Tag>
              </span>
            </Space>
          </div>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default PermissionMatrix;