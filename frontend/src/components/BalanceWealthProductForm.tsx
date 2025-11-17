import React, { useState, useEffect } from 'react';
import {
  Form,
  InputNumber,
  Select,
  Button,
  Alert,
  Space,
  Row,
  Col,
  Card,
  Statistic,
} from 'antd';
import { Asset } from '../services/assetService';
import { Holding } from '../types/portfolio';
import { formatCurrency } from '../utils/currencyUtils';

const { Option } = Select;

interface BalanceWealthProductFormProps {
  asset: Asset;
  currentPosition?: Holding;
  portfolioId: string;
  tradingAccountId: string;
  onSubmit: (data: BalanceTransactionData) => void;
  form: any;
}

interface BalanceTransactionData {
  assetId: string;
  portfolioId: string;
  tradingAccountId: string;
  transactionType: 'APPLY' | 'REDEEM';
  amount: number;
  executedAt: any;
  notes?: string;
  tags: string[];
}

const BalanceWealthProductForm: React.FC<BalanceWealthProductFormProps> = ({
  asset,
  currentPosition,
  portfolioId,
  tradingAccountId,
  onSubmit,
  form
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [transactionType, setTransactionType] = useState<'APPLY' | 'REDEEM'>('APPLY');

  const currentBalance = currentPosition?.balance || 0;
  const projectedBalance = transactionType === 'APPLY' 
    ? currentBalance + (amount || 0)
    : Math.max(0, currentBalance - (amount || 0));

  // 快捷金额选项
  const quickAmounts = [1000, 5000, 10000, 50000];

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount);
    form.setFieldsValue({ amount: quickAmount });
  };

  const handleTransactionTypeChange = (type: 'APPLY' | 'REDEEM') => {
    setTransactionType(type);
    form.setFieldsValue({ transactionType: type });
  };

  const handleAmountChange = (value: number | null) => {
    setAmount(value || 0);
  };

  // 验证赎回金额
  const validateRedeemAmount = () => {
    if (transactionType === 'REDEEM' && amount > currentBalance) {
      return Promise.reject(new Error('赎回金额不能超过当前余额'));
    }
    return Promise.resolve();
  };

  useEffect(() => {
    // 设置默认值
    form.setFieldsValue({
      assetId: asset.id,
      portfolioId,
      tradingAccountId,
      transactionType: 'APPLY',
      amount: 0
    });
  }, [asset, portfolioId, tradingAccountId, form]);

  return (
    <div>
      {/* 产品信息卡片 */}
      <Alert
        message={`${asset.name} - 余额型理财产品`}
        description={
          <div>
            <p>当前余额：<strong>{formatCurrency(currentBalance)}</strong></p>
            <p>产品代码：{asset.symbol}</p>
            <p>币种：{asset.currency}</p>
          </div>
        }
        type="info"
        style={{ marginBottom: 16 }}
      />

      {/* 余额统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="当前余额"
              value={currentBalance}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="预计余额"
              value={projectedBalance}
              precision={2}
              prefix="¥"
              valueStyle={{ 
                color: transactionType === 'APPLY' ? '#52c41a' : '#faad14' 
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="变化金额"
              value={transactionType === 'APPLY' ? amount : -amount}
              precision={2}
              prefix={transactionType === 'APPLY' ? '+¥' : '-¥'}
              valueStyle={{ 
                color: transactionType === 'APPLY' ? '#52c41a' : '#ff4d4f' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 表单字段 */}
      <Form.Item
        label="交易类型"
        name="transactionType"
        rules={[{ required: true, message: '请选择交易类型' }]}
      >
        <Select 
          value={transactionType}
          onChange={handleTransactionTypeChange}
          size="large"
        >
          <Option value="APPLY">申购</Option>
          <Option value="REDEEM">赎回</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="交易金额"
        name="amount"
        rules={[
          { required: true, message: '请输入交易金额' },
          { type: 'number', min: 0.01, message: '金额必须大于0' },
          { validator: validateRedeemAmount }
        ]}
      >
        <InputNumber
          value={amount}
          onChange={handleAmountChange}
          placeholder="请输入金额"
          style={{ width: '100%' }}
          min={0}
          precision={2}
          size="large"
          formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value!.replace(/¥\s?|(,*)/g, '')}
        />
      </Form.Item>

      {/* 快捷金额按钮 */}
      <Form.Item label="快捷金额">
        <Space wrap>
          {quickAmounts.map(quickAmount => (
            <Button 
              key={quickAmount}
              onClick={() => handleQuickAmount(quickAmount)}
              size="small"
              type={amount === quickAmount ? 'primary' : 'default'}
            >
              {formatCurrency(quickAmount)}
            </Button>
          ))}
          {transactionType === 'REDEEM' && currentBalance > 0 && (
            <Button 
              onClick={() => handleQuickAmount(currentBalance)}
              size="small"
              type={amount === currentBalance ? 'primary' : 'default'}
              danger
            >
              全部赎回
            </Button>
          )}
        </Space>
      </Form.Item>

      {/* 预计结果提示 */}
      {amount > 0 && (
        <Alert
          message={`预计${transactionType === 'APPLY' ? '申购' : '赎回'}后余额：${formatCurrency(projectedBalance)}`}
          type={transactionType === 'APPLY' ? 'success' : 'warning'}
          style={{ marginTop: 16 }}
        />
      )}

      {/* 赎回警告 */}
      {transactionType === 'REDEEM' && amount > currentBalance && (
        <Alert
          message="赎回金额超过当前余额"
          description={`当前余额：${formatCurrency(currentBalance)}，赎回金额：${formatCurrency(amount)}`}
          type="error"
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
};

export default BalanceWealthProductForm;