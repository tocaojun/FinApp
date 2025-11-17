/**
 * 余额型理财产品交易表单示例
 * 这个文件展示了如何在前端实现余额型和净值型产品的差异化UI
 * 
 * 使用场景：
 * 1. 用户选择一个理财产品后，系统根据productMode切换表单
 * 2. 余额型产品显示简化表单（直接输入金额）
 * 3. 净值型产品显示传统表单（输入份额和价格）
 */

import React, { useState, useEffect } from 'react';
import {
  Form,
  InputNumber,
  Select,
  Button,
  Alert,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Tooltip,
  DatePicker,
  Input
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Asset, Holding } from '../types/portfolio';
import { formatCurrency } from '../utils/currencyUtils';

/**
 * 定义余额型交易数据结构
 */
interface BalanceTransactionData {
  transactionType: 'APPLY' | 'REDEEM';  // 申购 / 赎回
  amount: number;                        // 交易金额
  transactionDate: string;
  notes?: string;
}

/**
 * 定义净值型交易数据结构
 */
interface QuantityTransactionData {
  transactionType: 'BUY' | 'SELL';       // 买入 / 卖出
  quantity: number;                      // 份额数量
  unitNav: number;                       // 单位净值
  transactionDate: string;
  notes?: string;
}

interface WealthProductFormProps {
  asset: Asset;                          // 选中的资产
  currentPosition?: Holding;             // 当前持仓（如果存在）
  onSubmit: (data: BalanceTransactionData | QuantityTransactionData) => Promise<void>;
  loading?: boolean;
}

/**
 * ============================================================================
 * 第1部分：余额型理财产品表单（简化版）
 * ============================================================================
 * 
 * 特点：
 * - 直接输入金额，无需转换
 * - 显示当前余额和预计变化
 * - 快捷金额选择按钮
 * - 支持申购和赎回
 */
const BalanceWealthProductForm: React.FC<WealthProductFormProps> = ({
  asset,
  currentPosition,
  onSubmit,
  loading = false
}) => {
  const [form] = Form.useForm<BalanceTransactionData>();
  const [amount, setAmount] = useState<number>(0);
  const [transactionType, setTransactionType] = useState<'APPLY' | 'REDEEM'>('APPLY');
  const [submitting, setSubmitting] = useState(false);

  // 当前余额
  const currentBalance = currentPosition?.balance || 0;

  // 预计余额（交易后）
  const projectedBalance = transactionType === 'APPLY'
    ? currentBalance + amount
    : Math.max(0, currentBalance - amount);

  // 是否可以赎回（赎回金额不能超过余额）
  const canRedeem = transactionType !== 'REDEEM' || amount <= currentBalance;

  // 快捷金额按钮配置
  const quickAmounts = [1000, 5000, 10000, 50000];

  const handleSubmit = async (values: any) => {
    if (!canRedeem) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        transactionType,
        amount,
        transactionDate: values.transactionDate?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        notes: values.notes
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card 
      className="balance-wealth-form"
      style={{ marginTop: '20px' }}
      title={
        <Space>
          <DollarOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <span>余额型产品交易</span>
          <Tag color="blue">BALANCE</Tag>
        </Space>
      }
    >
      {/* 产品信息提示 */}
      <Alert
        message={`${asset.name} - 余额型产品`}
        description="余额型产品是指按照一定的方式计息或分红，投资者可随时申购或赎回的产品。您直接操作金额，无需关心份额。"
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '16px' }}
      />

      {/* 当前余额展示 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Statistic
            title="当前余额"
            value={currentBalance}
            precision={2}
            prefix="¥"
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="本次收益"
            value={Math.max(0, currentBalance - (currentPosition?.totalCost || 0))}
            precision={2}
            prefix="¥"
            valueStyle={{ 
              color: currentBalance - (currentPosition?.totalCost || 0) >= 0 ? '#f5222d' : '#52c41a' 
            }}
          />
        </Col>
      </Row>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {/* 交易类型选择 */}
        <Form.Item
          label={<span>交易类型 <span style={{ color: '#f5222d' }}>*</span></span>}
          name="transactionType"
          rules={[{ required: true, message: '请选择交易类型' }]}
        >
          <Select
            value={transactionType}
            onChange={setTransactionType}
            style={{ width: '100%' }}
          >
            <Select.Option value="APPLY">
              <ShoppingCartOutlined /> 申购（增加余额）
            </Select.Option>
            <Select.Option value="REDEEM">
              申出（减少余额）
            </Select.Option>
          </Select>
        </Form.Item>

        {/* 交易金额输入 */}
        <Form.Item
          label={<span>交易金额 <span style={{ color: '#f5222d' }}>*</span></span>}
          name="amount"
          rules={[
            { required: true, message: '请输入交易金额' },
            {
              validator: (_, value) => {
                if (!canRedeem) {
                  return Promise.reject(new Error(`赎回金额不能超过当前余额 ¥${formatCurrency(currentBalance)}`));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            value={amount}
            onChange={(val) => setAmount(val || 0)}
            min={0.01}
            step={100}
            precision={2}
            style={{ width: '100%' }}
            placeholder="请输入金额"
            addonBefore="¥"
            formatter={(value) => formatCurrency(value || 0)}
          />
        </Form.Item>

        {/* 快捷金额按钮 */}
        <Form.Item label="快捷金额">
          <Space>
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                type="dashed"
                onClick={() => {
                  setAmount(quickAmount);
                  form.setFieldValue('amount', quickAmount);
                }}
              >
                ¥{formatCurrency(quickAmount)}
              </Button>
            ))}
          </Space>
        </Form.Item>

        {/* 交易日期 */}
        <Form.Item
          label="交易日期"
          name="transactionDate"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        {/* 备注 */}
        <Form.Item
          label="备注"
          name="notes"
        >
          <Input.TextArea rows={3} placeholder="输入交易备注" />
        </Form.Item>

        {/* 预计结果展示 */}
        <Card
          size="small"
          style={{
            backgroundColor: '#fafafa',
            marginBottom: '16px',
            borderLeft: '4px solid #1890ff'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="当前余额"
                value={currentBalance}
                precision={2}
                prefix="¥"
              />
            </Col>
            <Col span={4} style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '18px', color: '#8c8c8c' }}>
                {transactionType === 'APPLY' ? '+' : '-'}
              </span>
            </Col>
            <Col span={8}>
              <Statistic
                title="交易金额"
                value={amount}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>
          <Row style={{ marginTop: '12px' }}>
            <Col span={24}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#e6f7ff',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <CheckCircleOutlined style={{ color: '#1890ff' }} />
                <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                  预计新余额：¥{formatCurrency(projectedBalance)}
                </span>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 提交按钮 */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting || loading}
            disabled={amount === 0 || !canRedeem}
            size="large"
            block
          >
            确认{transactionType === 'APPLY' ? '申购' : '赎回'}
          </Button>
        </Form.Item>

        {/* 错误提示 */}
        {!canRedeem && (
          <Alert
            message="赎回金额超限"
            description={`当前余额为 ¥${formatCurrency(currentBalance)}, 无法赎回 ¥${formatCurrency(amount)}`}
            type="error"
            showIcon
          />
        )}
      </Form>
    </Card>
  );
};

/**
 * ============================================================================
 * 第2部分：净值型理财产品表单（传统版）
 * ============================================================================
 * 
 * 特点：
 * - 需要输入份额数量和单位净值
 * - 自动计算交易金额
 * - 支持买入和卖出
 * - 显示份额信息
 */
const QuantityWealthProductForm: React.FC<WealthProductFormProps> = ({
  asset,
  currentPosition,
  onSubmit,
  loading = false
}) => {
  const [form] = Form.useForm<QuantityTransactionData>();
  const [quantity, setQuantity] = useState<number>(0);
  const [unitNav, setUnitNav] = useState<number>(asset.currentPrice || 1);
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
  const [submitting, setSubmitting] = useState(false);

  // 计算交易金额
  const transactionAmount = quantity * unitNav;

  // 当前持仓份额
  const currentQuantity = currentPosition?.quantity || 0;

  // 是否可以卖出
  const canSell = transactionType !== 'SELL' || quantity <= currentQuantity;

  const handleSubmit = async (values: any) => {
    if (!canSell) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        transactionType,
        quantity,
        unitNav,
        transactionDate: values.transactionDate?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        notes: values.notes
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card 
      className="quantity-wealth-form"
      style={{ marginTop: '20px' }}
      title={
        <Space>
          <ShoppingCartOutlined style={{ fontSize: '18px', color: '#52c41a' }} />
          <span>净值型产品交易</span>
          <Tag color="green">QUANTITY</Tag>
        </Space>
      }
    >
      {/* 产品信息提示 */}
      <Alert
        message={`${asset.name} - 净值型产品`}
        description="净值型产品是指基于单位净值进行份额交易的产品。您需要指定买卖的份额数量和单位净值。"
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '16px' }}
      />

      {/* 当前持仓展示 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Statistic
            title="当前持仓（份）"
            value={currentQuantity}
            precision={2}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="单位净值"
            value={unitNav}
            precision={4}
            prefix="¥"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="持仓市值"
            value={currentQuantity * unitNav}
            precision={2}
            prefix="¥"
          />
        </Col>
      </Row>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {/* 交易类型选择 */}
        <Form.Item
          label={<span>交易类型 <span style={{ color: '#f5222d' }}>*</span></span>}
          name="transactionType"
          rules={[{ required: true, message: '请选择交易类型' }]}
        >
          <Select
            value={transactionType}
            onChange={setTransactionType}
            style={{ width: '100%' }}
          >
            <Select.Option value="BUY">买入（增加份额）</Select.Option>
            <Select.Option value="SELL">卖出（减少份额）</Select.Option>
          </Select>
        </Form.Item>

        {/* 份额数量输入 */}
        <Form.Item
          label={<span>份额数量 <span style={{ color: '#f5222d' }}>*</span></span>}
          name="quantity"
          rules={[
            { required: true, message: '请输入份额数量' },
            {
              validator: (_, value) => {
                if (!canSell) {
                  return Promise.reject(new Error(`卖出份额不能超过当前持仓 ${formatCurrency(currentQuantity)}`));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            value={quantity}
            onChange={(val) => setQuantity(val || 0)}
            min={0.01}
            step={1}
            precision={2}
            style={{ width: '100%' }}
            placeholder="请输入份额数量"
          />
        </Form.Item>

        {/* 单位净值输入 */}
        <Form.Item
          label={<span>单位净值 <span style={{ color: '#f5222d' }}>*</span></span>}
          name="unitNav"
          rules={[{ required: true, message: '请输入单位净值' }]}
        >
          <InputNumber
            value={unitNav}
            onChange={(val) => setUnitNav(val || 0)}
            min={0.0001}
            step={0.01}
            precision={4}
            style={{ width: '100%' }}
            addonBefore="¥"
          />
        </Form.Item>

        {/* 交易日期 */}
        <Form.Item
          label="交易日期"
          name="transactionDate"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        {/* 备注 */}
        <Form.Item
          label="备注"
          name="notes"
        >
          <Input.TextArea rows={3} placeholder="输入交易备注" />
        </Form.Item>

        {/* 交易金额总览 */}
        <Card
          size="small"
          style={{
            backgroundColor: '#fafafa',
            marginBottom: '16px',
            borderLeft: '4px solid #52c41a'
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="份额数"
                value={quantity}
                precision={2}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="单位净值"
                value={unitNav}
                precision={4}
                prefix="¥"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="交易金额"
                value={transactionAmount}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 提交按钮 */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting || loading}
            disabled={quantity === 0 || !canSell}
            size="large"
            block
          >
            确认{transactionType === 'BUY' ? '买入' : '卖出'}
          </Button>
        </Form.Item>

        {/* 错误提示 */}
        {!canSell && (
          <Alert
            message="卖出份额超限"
            description={`当前持仓 ${formatCurrency(currentQuantity)} 份，无法卖出 ${formatCurrency(quantity)} 份`}
            type="error"
            showIcon
          />
        )}
      </Form>
    </Card>
  );
};

/**
 * ============================================================================
 * 第3部分：主表单容器（自动切换）
 * ============================================================================
 * 
 * 这个组件根据productMode自动选择要显示的表单
 */
export const WealthProductTransactionForm: React.FC<WealthProductFormProps> = (props) => {
  const { asset } = props;

  // 判断是否为余额型产品
  const isBalanceProduct = asset.productMode === 'BALANCE';

  if (isBalanceProduct) {
    return <BalanceWealthProductForm {...props} />;
  } else {
    return <QuantityWealthProductForm {...props} />;
  }
};

export default WealthProductTransactionForm;

/**
 * ============================================================================
 * 使用示例
 * ============================================================================
 * 
 * 在TransactionManagement.tsx中使用：
 * 
 * ```typescript
 * import { WealthProductTransactionForm } from '../components/WealthProductTransactionForm';
 * 
 * // 在表单部分
 * {selectedAsset && (
 *   <WealthProductTransactionForm
 *     asset={selectedAsset}
 *     currentPosition={holdings.find(h => h.assetId === selectedAsset.id)}
 *     onSubmit={handleSubmit}
 *     loading={isSubmitting}
 *   />
 * )}
 * ```
 */
