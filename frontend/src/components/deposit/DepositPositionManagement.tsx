import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Space,
  Button,
  Tag,
  Progress,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Row,
  Col,
  Statistic,
  Alert,
  Tooltip,
  Badge
} from 'antd';
import {
  BankOutlined,
  CalendarOutlined,
  DollarOutlined,
  WarningOutlined,
  ReloadOutlined,
  ExportOutlined,
  CalculatorOutlined
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;

interface DepositPosition {
  positionId: string;
  assetId: string;
  productName: string;
  bankName: string;
  depositType: string;
  currentBalance: number;
  principalAmount: number;
  accruedInterest: number;
  interestRate: number;
  termMonths?: number;
  startDate?: string;
  maturityDate?: string;
  daysToMaturity?: number;
  autoRenewal: boolean;
  earlyWithdrawalAllowed: boolean;
  effectiveAnnualRate: number;
}

interface DepositStatistics {
  totalDeposits: number;
  totalBalance: number;
  averageInterestRate: number;
  demandDeposits: number;
  timeDeposits: number;
  maturingSoon: number;
}

const DepositPositionManagement: React.FC = () => {
  const [positions, setPositions] = useState<DepositPosition[]>([]);
  const [statistics, setStatistics] = useState<DepositStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [maturityModalVisible, setMaturityModalVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<DepositPosition | null>(null);
  const [form] = Form.useForm();

  // 获取存款持仓
  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/deposits/positions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setPositions(data.data);
      } else {
        message.error('获取存款持仓失败');
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      message.error('获取存款持仓失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/deposits/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchStatistics();
  }, []);

  // 获取存款类型标签颜色
  const getDepositTypeColor = (type: string) => {
    const colors = {
      DEMAND: 'blue',
      TIME: 'green',
      NOTICE: 'orange',
      STRUCTURED: 'purple'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  // 获取存款类型中文名
  const getDepositTypeName = (type: string) => {
    const names = {
      DEMAND: '活期',
      TIME: '定期',
      NOTICE: '通知',
      STRUCTURED: '结构性'
    };
    return names[type as keyof typeof names] || type;
  };

  // 获取到期状态
  const getMaturityStatus = (position: DepositPosition) => {
    if (!position.daysToMaturity) return null;

    if (position.daysToMaturity <= 0) {
      return { status: 'error', text: '已到期', color: '#ff4d4f' };
    } else if (position.daysToMaturity <= 7) {
      return { status: 'warning', text: `${position.daysToMaturity}天后到期`, color: '#faad14' };
    } else if (position.daysToMaturity <= 30) {
      return { status: 'processing', text: `${position.daysToMaturity}天后到期`, color: '#1890ff' };
    }
    return null;
  };

  // 表格列定义
  const columns: ColumnsType<DepositPosition> = [
    {
      title: '产品信息',
      key: 'product',
      width: 250,
      render: (_, record) => {
        const maturityStatus = getMaturityStatus(record);
        return (
          <Space direction="vertical" size="small">
            <div style={{ fontWeight: 'bold' }}>
              {record.productName}
              {maturityStatus && (
                <Badge 
                  count={maturityStatus.text} 
                  style={{ 
                    backgroundColor: maturityStatus.color,
                    marginLeft: 8,
                    fontSize: '10px'
                  }} 
                />
              )}
            </div>
            <Space>
              <BankOutlined />
              <span>{record.bankName}</span>
            </Space>
            <Tag color={getDepositTypeColor(record.depositType)}>
              {getDepositTypeName(record.depositType)}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '余额信息',
      key: 'balance',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              ¥{record.currentBalance.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>当前余额</div>
          </div>
          <div>
            <div style={{ fontSize: '14px' }}>
              ¥{record.principalAmount.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>本金</div>
          </div>
          {record.accruedInterest > 0 && (
            <div>
              <div style={{ fontSize: '14px', color: '#52c41a' }}>
                +¥{record.accruedInterest.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>已计利息</div>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: '利率',
      key: 'rate',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
            {(record.interestRate * 100).toFixed(2)}%
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            年利率
          </div>
          {record.effectiveAnnualRate !== record.interestRate * 100 && (
            <div style={{ fontSize: '12px', color: '#1890ff' }}>
              实际: {record.effectiveAnnualRate.toFixed(2)}%
            </div>
          )}
        </Space>
      ),
    },
    {
      title: '期限信息',
      key: 'term',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.termMonths ? (
            <>
              <div>
                <CalendarOutlined /> {record.termMonths}个月
              </div>
              {record.startDate && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  起息: {dayjs(record.startDate).format('YYYY-MM-DD')}
                </div>
              )}
              {record.maturityDate && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  到期: {dayjs(record.maturityDate).format('YYYY-MM-DD')}
                </div>
              )}
              {record.daysToMaturity !== undefined && record.daysToMaturity > 0 && (
                <Progress
                  percent={Math.max(0, 100 - (record.daysToMaturity / (record.termMonths * 30)) * 100)}
                  size="small"
                  showInfo={false}
                />
              )}
            </>
          ) : (
            <div>
              <CalendarOutlined /> 活期
            </div>
          )}
        </Space>
      ),
    },
    {
      title: '特性',
      key: 'features',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.autoRenewal && (
            <Tag color="green" size="small">自动续存</Tag>
          )}
          {record.earlyWithdrawalAllowed && (
            <Tag color="blue" size="small">可提前支取</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <Button size="small" onClick={() => handleCalculateInterest(record)}>
              计息
            </Button>
            {record.earlyWithdrawalAllowed && (
              <Button size="small" onClick={() => handleWithdraw(record)}>
                支取
              </Button>
            )}
          </Space>
          {record.daysToMaturity !== undefined && record.daysToMaturity <= 30 && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => handleMaturityManagement(record)}
            >
              到期处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 计算利息
  const handleCalculateInterest = async (position: DepositPosition) => {
    try {
      const response = await fetch(`/api/deposits/positions/${position.positionId}/calculate-interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          calculationDate: new Date().toISOString(),
          calculationMethod: 'ACTUAL_365'
        })
      });

      const data = await response.json();
      if (data.success) {
        Modal.info({
          title: '利息计算结果',
          content: (
            <div>
              <p>计息本金: ¥{data.data.principalAmount.toLocaleString()}</p>
              <p>计息天数: {data.data.daysCount}天</p>
              <p>适用利率: {(data.data.interestRate * 100).toFixed(2)}%</p>
              <p>计算利息: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{data.data.interestAmount.toFixed(2)}</span></p>
            </div>
          ),
        });
      } else {
        message.error('利息计算失败');
      }
    } catch (error) {
      console.error('Error calculating interest:', error);
      message.error('利息计算失败');
    }
  };

  // 支取操作
  const handleWithdraw = (position: DepositPosition) => {
    Modal.confirm({
      title: '确认支取',
      content: `确定要支取 ${position.productName} 吗？当前余额 ¥${position.currentBalance.toLocaleString()}`,
      onOk: async () => {
        // 这里实现支取逻辑
        message.success('支取申请已提交');
        fetchPositions();
      },
    });
  };

  // 到期管理
  const handleMaturityManagement = (position: DepositPosition) => {
    setSelectedPosition(position);
    setMaturityModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      action: position.autoRenewal ? 'RENEW' : 'MANUAL',
      newTermMonths: position.termMonths
    });
  };

  // 处理到期
  const handleMaturitySubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const response = await fetch(`/api/deposits/positions/${selectedPosition?.positionId}/process-maturity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();
      if (data.success) {
        message.success('到期处理成功');
        setMaturityModalVisible(false);
        fetchPositions();
      } else {
        message.error('到期处理失败');
      }
    } catch (error) {
      console.error('Error processing maturity:', error);
      message.error('到期处理失败');
    }
  };

  return (
    <div>
      {/* 统计卡片 */}
      {statistics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="存款总额"
                value={statistics.totalBalance}
                prefix="¥"
                formatter={(value) => `${Number(value).toLocaleString()}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="存款笔数"
                value={statistics.totalDeposits}
                suffix="笔"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均利率"
                value={statistics.averageInterestRate}
                suffix="%"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="即将到期"
                value={statistics.maturingSoon}
                suffix="笔"
                valueStyle={{ color: statistics.maturingSoon > 0 ? '#faad14' : undefined }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 到期提醒 */}
      {statistics && statistics.maturingSoon > 0 && (
        <Alert
          message="到期提醒"
          description={`您有 ${statistics.maturingSoon} 笔存款即将在30天内到期，请及时处理。`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => {
              // 筛选即将到期的存款
              const upcomingMaturity = positions.filter(p => 
                p.daysToMaturity !== undefined && p.daysToMaturity <= 30
              );
              console.log('Upcoming maturity deposits:', upcomingMaturity);
            }}>
              查看详情
            </Button>
          }
        />
      )}

      {/* 存款持仓表格 */}
      <Card
        title="存款持仓"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchPositions}>
              刷新
            </Button>
            <Button icon={<ExportOutlined />}>
              导出
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={positions}
          rowKey="positionId"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 笔存款`,
          }}
        />
      </Card>

      {/* 到期处理模态框 */}
      <Modal
        title={`到期处理 - ${selectedPosition?.productName}`}
        open={maturityModalVisible}
        onOk={handleMaturitySubmit}
        onCancel={() => setMaturityModalVisible(false)}
        width={500}
      >
        {selectedPosition && (
          <div>
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <strong>当前余额:</strong> ¥{selectedPosition.currentBalance.toLocaleString()}
                </Col>
                <Col span={12}>
                  <strong>到期日:</strong> {dayjs(selectedPosition.maturityDate).format('YYYY-MM-DD')}
                </Col>
                <Col span={12}>
                  <strong>剩余天数:</strong> {selectedPosition.daysToMaturity}天
                </Col>
                <Col span={12}>
                  <strong>年利率:</strong> {(selectedPosition.interestRate * 100).toFixed(2)}%
                </Col>
              </Row>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="action"
                label="处理方式"
                rules={[{ required: true, message: '请选择处理方式' }]}
              >
                <Select>
                  <Option value="RENEW">续存</Option>
                  <Option value="TRANSFER_TO_DEMAND">转为活期</Option>
                  <Option value="WITHDRAW">取出</Option>
                </Select>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.action !== currentValues.action
                }
              >
                {({ getFieldValue }) => {
                  const action = getFieldValue('action');
                  return action === 'RENEW' ? (
                    <Form.Item
                      name="newTermMonths"
                      label="续存期限"
                      rules={[{ required: true, message: '请选择续存期限' }]}
                    >
                      <Select>
                        <Option value={3}>3个月</Option>
                        <Option value={6}>6个月</Option>
                        <Option value={12}>12个月</Option>
                        <Option value={24}>24个月</Option>
                        <Option value={36}>36个月</Option>
                      </Select>
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DepositPositionManagement;