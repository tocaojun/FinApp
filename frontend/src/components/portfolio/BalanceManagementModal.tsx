import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Typography,
  Space,
  Tag,
  Button,
  message,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  Row,
  Col,
  Card,
  Divider,
  DatePicker
} from 'antd';
import { 
  ReloadOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { HoldingService } from '../../services/holdingService';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface BalanceHistoryRecord {
  id: string;
  balance: number;
  previous_balance: number;
  change_amount: number;
  change_type: string;
  update_time: string; // 系统记录时间
  update_date?: string; // 余额对应的业务日期
  notes: string;
  return_percentage: number;
}

interface BalanceManagementModalProps {
  open: boolean;
  onClose: () => void;
  holding: {
    id: string;
    assetName: string;
    currentBalance: number;
    productMode: string;
  } | null;
  onBalanceUpdated?: () => void;
}

export const BalanceManagementModal: React.FC<BalanceManagementModalProps> = ({
  open,
  onClose,
  holding,
  onBalanceUpdated
}) => {
  const [records, setRecords] = useState<BalanceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BalanceHistoryRecord | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [form] = Form.useForm();

  const fetchBalanceHistory = async () => {
    if (!holding?.id) return;

    setLoading(true);
    try {
      const response = await HoldingService.getBalanceHistory(holding.id);
      setRecords(response || []);
    } catch (error) {
      console.error('获取余额历史失败:', error);
      message.error('获取余额历史失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && holding?.id) {
      fetchBalanceHistory();
    }
  }, [open, holding?.id]);

  // 添加新记录
  const handleAddRecord = async (values: any) => {
    try {
      const recordData: any = {
        balance: values.balance,
        change_type: values.change_type,
        notes: values.notes || ''
      };
      
      // 如果选择了日期，添加日期字段
      if (values.update_date) {
        recordData.update_date = values.update_date.format('YYYY-MM-DD');
      }
      
      await HoldingService.addBalanceHistoryRecord(holding!.id, recordData);
      message.success('余额记录添加成功');
      setIsAddingNew(false);
      form.resetFields();
      fetchBalanceHistory();
      onBalanceUpdated?.();
    } catch (error) {
      console.error('添加余额记录失败:', error);
      message.error('添加余额记录失败');
    }
  };

  // 编辑记录
  const handleEditRecord = (record: BalanceHistoryRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      balance: record.balance,
      change_type: record.change_type,
      notes: record.notes,
      update_date: record.update_date ? dayjs(record.update_date) : undefined
    });
  };

  // 保存编辑
  const handleSaveEdit = async (values: any) => {
    try {
      if (!editingRecord) return;
      
      const updateData: any = {
        balance: values.balance,
        change_type: values.change_type,
        notes: values.notes || ''
      };
      
      // 如果选择了日期，添加日期字段
      if (values.update_date) {
        updateData.update_date = values.update_date.format('YYYY-MM-DD');
      }
      
      await HoldingService.updateBalanceHistoryRecord(editingRecord.id, updateData);
      message.success('余额记录更新成功');
      setEditingRecord(null);
      form.resetFields();
      fetchBalanceHistory();
      onBalanceUpdated?.();
    } catch (error) {
      console.error('更新余额记录失败:', error);
      message.error('更新余额记录失败');
    }
  };

  // 删除记录
  const handleDeleteRecord = async (recordId: string) => {
    try {
      await HoldingService.deleteBalanceHistoryRecord(recordId);
      message.success('余额记录删除成功');
      fetchBalanceHistory();
      onBalanceUpdated?.();
    } catch (error) {
      console.error('删除余额记录失败:', error);
      message.error('删除余额记录失败');
    }
  };

  // 快速更新当前余额
  const handleQuickUpdateBalance = async (newBalance: number) => {
    try {
      await HoldingService.updateWealthProductBalance(holding!.id, newBalance);
      message.success('余额更新成功');
      fetchBalanceHistory();
      onBalanceUpdated?.();
    } catch (error) {
      console.error('更新余额失败:', error);
      message.error('更新余额失败');
    }
  };

  const columns = [
    {
      title: '余额日期',
      dataIndex: 'update_date',
      key: 'update_date',
      width: 120,
      render: (text: string, record: BalanceHistoryRecord) => {
        // 优先显示 update_date，如果没有则显示 update_time 的日期部分
        const dateToShow = text || record.update_time?.split('T')[0] || record.update_time;
        return dateToShow ? new Date(dateToShow).toLocaleDateString('zh-CN') : '-';
      }
    },
    {
      title: '时间',
      dataIndex: 'update_time',
      key: 'update_time',
      width: 100,
      render: (text: string) => {
        if (!text) return '-';
        const time = new Date(text).toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        return time;
      }
    },
    {
      title: '变更前余额',
      dataIndex: 'previous_balance',
      key: 'previous_balance',
      width: 120,
      render: (value: number) => `¥${parseFloat(value?.toString() || '0').toFixed(2)}`
    },
    {
      title: '变更后余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (value: number) => `¥${parseFloat(value?.toString() || '0').toFixed(2)}`
    },
    {
      title: '变更金额',
      dataIndex: 'change_amount',
      key: 'change_amount',
      width: 120,
      render: (value: number) => {
        const amount = parseFloat(value?.toString() || '0');
        return (
          <Text style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {amount >= 0 ? '+' : ''}¥{amount.toFixed(2)}
          </Text>
        );
      }
    },
    {
      title: '变更类型',
      dataIndex: 'change_type',
      key: 'change_type',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          'MANUAL_UPDATE': 'blue',
          'SYSTEM_SYNC': 'green',
          'TRANSACTION': 'orange'
        };
        const labelMap: Record<string, string> = {
          'MANUAL_UPDATE': '手动更新',
          'SYSTEM_SYNC': '系统同步',
          'TRANSACTION': '交易变更'
        };
        return <Tag color={colorMap[type] || 'default'}>{labelMap[type] || type}</Tag>;
      }
    },
    {
      title: '收益率',
      dataIndex: 'return_percentage',
      key: 'return_percentage',
      width: 100,
      render: (value: number) => {
        const percentage = parseFloat(value?.toString() || '0');
        return (
          <Text style={{ color: percentage >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {percentage >= 0 ? '+' : ''}{percentage.toFixed(4)}%
          </Text>
        );
      }
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: BalanceHistoryRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRecord(record)}
            title="编辑"
          />
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDeleteRecord(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="删除"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Modal
      title={`历史余额管理 - ${holding?.assetName || ''}`}
      open={open}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchBalanceHistory} loading={loading}>
          刷新
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 当前余额和快速操作区域 */}
        <Card size="small">
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Space direction="vertical" size="small">
                <Text type="secondary">当前余额</Text>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  ¥{holding?.currentBalance?.toFixed(2) || '0.00'}
                </Title>
              </Space>
            </Col>
            <Col span={16}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddingNew(true)}
                >
                  添加余额记录
                </Button>
                <Form
                  layout="inline"
                  onFinish={(values) => handleQuickUpdateBalance(values.newBalance)}
                >
                  <Form.Item
                    name="newBalance"
                    rules={[{ required: true, message: '请输入新余额' }]}
                  >
                    <InputNumber
                      placeholder="输入新余额"
                      precision={2}
                      min={0}
                      style={{ width: 120 }}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      快速更新
                    </Button>
                  </Form.Item>
                </Form>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 添加新记录表单 */}
        {isAddingNew && (
          <Card title="添加新的余额记录" size="small">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddRecord}
            >
              <Row gutter={16}>
                <Col span={5}>
                  <Form.Item
                    name="balance"
                    label="新余额"
                    rules={[{ required: true, message: '请输入余额' }]}
                  >
                    <InputNumber
                      placeholder="输入余额"
                      precision={2}
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    name="change_type"
                    label="变更类型"
                    rules={[{ required: true, message: '请选择变更类型' }]}
                  >
                    <Select placeholder="选择变更类型">
                      <Select.Option value="MANUAL_UPDATE">手动更新</Select.Option>
                      <Select.Option value="SYSTEM_SYNC">系统同步</Select.Option>
                      <Select.Option value="TRANSACTION">交易变更</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    name="update_date"
                    label="余额日期"
                    tooltip="余额对应的业务日期，不选择则使用当前日期"
                  >
                    <DatePicker
                      placeholder="选择日期"
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </Col>
                <Col span={9}>
                  <Form.Item name="notes" label="备注">
                    <TextArea placeholder="输入备注信息" rows={1} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    保存
                  </Button>
                  <Button onClick={() => {
                    setIsAddingNew(false);
                    form.resetFields();
                  }} icon={<CloseOutlined />}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* 编辑记录表单 */}
        {editingRecord && (
          <Card title="编辑余额记录" size="small">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveEdit}
            >
              <Row gutter={16}>
                <Col span={5}>
                  <Form.Item
                    name="balance"
                    label="余额"
                    rules={[{ required: true, message: '请输入余额' }]}
                  >
                    <InputNumber
                      placeholder="输入余额"
                      precision={2}
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    name="change_type"
                    label="变更类型"
                    rules={[{ required: true, message: '请选择变更类型' }]}
                  >
                    <Select placeholder="选择变更类型">
                      <Select.Option value="MANUAL_UPDATE">手动更新</Select.Option>
                      <Select.Option value="SYSTEM_SYNC">系统同步</Select.Option>
                      <Select.Option value="TRANSACTION">交易变更</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    name="update_date"
                    label="余额日期"
                    tooltip="余额对应的业务日期，不选择则保持原日期"
                  >
                    <DatePicker
                      placeholder="选择日期"
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </Col>
                <Col span={9}>
                  <Form.Item name="notes" label="备注">
                    <TextArea placeholder="输入备注信息" rows={1} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    保存修改
                  </Button>
                  <Button onClick={() => {
                    setEditingRecord(null);
                    form.resetFields();
                  }} icon={<CloseOutlined />}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        <Divider />

        {/* 历史记录表格 */}
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ y: 400 }}
          size="small"
        />
      </Space>
    </Modal>
  );
};