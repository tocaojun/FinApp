import React, { useState, useEffect } from 'react';
import {
  Form,
  InputNumber,
  Select,
  Alert,
  Row,
  Col,
  Card,
  Statistic,
} from 'antd';
import { Asset } from '../services/assetService';
import { Holding } from '../types/portfolio';
import { formatCurrency, formatPrice } from '../utils/currencyUtils';

const { Option } = Select;

interface QuantityWealthProductFormProps {
  asset: Asset;
  currentPosition?: Holding;
  portfolioId: string;
  tradingAccountId: string;
  onSubmit: (data: QuantityTransactionData) => void;
  form: any;
}

interface QuantityTransactionData {
  assetId: string;
  portfolioId: string;
  tradingAccountId: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  executedAt: any;
  notes?: string;
  tags: string[];
}

const QuantityWealthProductForm: React.FC<QuantityWealthProductFormProps> = ({
  asset,
  currentPosition,
  portfolioId,
  tradingAccountId,
  onSubmit,
  form
}) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');

  const currentQuantity = currentPosition?.quantity || 0;
  const currentPrice = currentPosition?.currentPrice || 0;
  const totalAmount = (quantity || 0) * (price || 0);

  const projectedQuantity = transactionType === 'BUY' 
    ? currentQuantity + (quantity || 0)
    : Math.max(0, currentQuantity - (quantity || 0));

  const projectedValue = projectedQuantity * (price || currentPrice || 0);

  const handleTransactionTypeChange = (type: 'BUY' | 'SELL') => {
    setTransactionType(type);
    form.setFieldsValue({ transactionType: type });
  };

  const handleQuantityChange = (value: number | null) => {
    setQuantity(value || 0);
  };

  const handlePriceChange = (value: number | null) => {
    setPrice(value || 0);
  };

  // 验证卖出数量
  const validateSellQuantity = () => {
    if (transactionType === 'SELL' && quantity > currentQuantity) {
      return Promise.reject(new Error('卖出数量不能超过当前持有数量'));
    }
    return Promise.resolve();
  };

  useEffect(() => {
    // 设置默认值
    form.setFieldsValue({
      assetId: asset.id,
      portfolioId,
      tradingAccountId,
      transactionType: 'BUY',
      quantity: 0,
      price: currentPrice || 0
    });
    setPrice(currentPrice || 0);
  }, [asset, portfolioId, tradingAccountId, currentPrice, form]);

  return (
    <div>
      {/* 产品信息卡片 */}
      <Alert
        message={`${asset.name} - 净值型理财产品`}
        description={
          <div>
            <p>当前持有：<strong>{currentQuantity.toFixed(4)} 份</strong></p>
            <p>当前净值：<strong>{formatPrice(currentPrice)}</strong></p>
            <p>产品代码：{asset.symbol}</p>
            <p>币种：{asset.currency}</p>
          </div>
        }
        type="info"
        style={{ marginBottom: 16 }}
      />

      {/* 持仓统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="当前份额"
              value={currentQuantity}
              precision={4}
              suffix="份"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="当前净值"
              value={currentPrice}
              precision={4}
              prefix="¥"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预计份额"
              value={projectedQuantity}
              precision={4}
              suffix="份"
              valueStyle={{ 
                color: transactionType === 'BUY' ? '#52c41a' : '#faad14' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="交易金额"
              value={totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ 
                color: transactionType === 'BUY' ? '#52c41a' : '#ff4d4f' 
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
          <Option value="BUY">买入</Option>
          <Option value="SELL">卖出</Option>
        </Select>
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="份额数量"
            name="quantity"
            rules={[
              { required: true, message: '请输入份额数量' },
              { type: 'number', min: 0.0001, message: '数量必须大于0' },
              { validator: validateSellQuantity }
            ]}
          >
            <InputNumber
              value={quantity}
              onChange={handleQuantityChange}
              placeholder="请输入份额数量"
              style={{ width: '100%' }}
              min={0}
              precision={4}
              size="large"
              suffix="份"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="单位净值"
            name="price"
            rules={[
              { required: true, message: '请输入单位净值' },
              { type: 'number', min: 0.0001, message: '净值必须大于0' }
            ]}
          >
            <InputNumber
              value={price}
              onChange={handlePriceChange}
              placeholder="请输入单位净值"
              style={{ width: '100%' }}
              min={0}
              precision={4}
              size="large"
              formatter={value => `¥ ${value}`}
              parser={value => value!.replace(/¥\s?/g, '')}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* 交易金额显示 */}
      {quantity > 0 && price > 0 && (
        <Alert
          message={`${transactionType === 'BUY' ? '买入' : '卖出'}金额：${formatCurrency(totalAmount)}`}
          description={`${quantity.toFixed(4)} 份 × ${formatPrice(price)} = ${formatCurrency(totalAmount)}`}
          type={transactionType === 'BUY' ? 'success' : 'warning'}
          style={{ marginTop: 16 }}
        />
      )}

      {/* 卖出警告 */}
      {transactionType === 'SELL' && quantity > currentQuantity && (
        <Alert
          message="卖出数量超过当前持有数量"
          description={`当前持有：${currentQuantity.toFixed(4)} 份，卖出数量：${quantity.toFixed(4)} 份`}
          type="error"
          style={{ marginTop: 16 }}
        />
      )}

      {/* 预计持仓变化 */}
      {quantity > 0 && (
        <Alert
          message={`预计${transactionType === 'BUY' ? '买入' : '卖出'}后持仓：${projectedQuantity.toFixed(4)} 份，价值：${formatCurrency(projectedValue)}`}
          type="info"
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
};

export default QuantityWealthProductForm;