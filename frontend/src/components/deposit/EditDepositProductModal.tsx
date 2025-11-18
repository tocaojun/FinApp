import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  DatePicker,
  Space,
  message,
  Row,
  Col,
  Divider
} from 'antd';
import { BankOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface DepositProduct {
  assetId: string;
  symbol: string;
  productName: string;
  currency: string;
  depositType: string;
  bankName: string;
  interestRate: number;
  rateType: string;
  compoundFrequency: string;
  termMonths?: number;
  autoRenewal: boolean;
  minDepositAmount?: number;
  maxDepositAmount?: number;
  earlyWithdrawalAllowed: boolean;
  earlyWithdrawalPenaltyRate?: number;
  depositInsuranceCovered: boolean;
  insuranceAmount?: number;
}

interface EditDepositProductModalProps {
  visible: boolean;
  product: DepositProduct | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditDepositProductModal: React.FC<EditDepositProductModalProps> = ({
  visible,
  product,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [depositType, setDepositType] = useState<string>('DEMAND');

  useEffect(() => {
    if (product && visible) {
      // 填充表单数据
      form.setFieldsValue({
        bankName: product.bankName,
        depositType: product.depositType,
        interestRate: product.interestRate * 100, // 转换为百分比显示
        rateType: product.rateType,
        compoundFrequency: product.compoundFrequency,
        termMonths: product.termMonths,
        autoRenewal: product.autoRenewal,
        minDepositAmount: product.minDepositAmount,
        maxDepositAmount: product.maxDepositAmount,
        earlyWithdrawalAllowed: product.earlyWithdrawalAllowed,
        earlyWithdrawalPenaltyRate: product.earlyWithdrawalPenaltyRate ? product.earlyWithdrawalPenaltyRate * 100 : undefined,
        depositInsuranceCovered: product.depositInsuranceCovered,
        insuranceAmount: product.insuranceAmount
      });
      setDepositType(product.depositType);
    }
  }, [product, visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('auth_token');

      // 构建更新数据
      const updatePayload = {
        depositType: values.depositType,
        bankName: values.bankName,
        interestRate: values.interestRate / 100, // 转换为小数
        rateType: values.rateType,
        compoundFrequency: values.compoundFrequency,
        termMonths: values.termMonths,
        autoRenewal: values.autoRenewal,
        minDepositAmount: values.minDepositAmount,
        maxDepositAmount: values.maxDepositAmount,
        earlyWithdrawalAllowed: values.earlyWithdrawalAllowed,
        earlyWithdrawalPenaltyRate: values.earlyWithdrawalPenaltyRate ? values.earlyWithdrawalPenaltyRate / 100 : null,
        depositInsuranceCovered: values.depositInsuranceCovered,
        insuranceAmount: values.insuranceAmount
      };

      console.log('更新存款详情:', updatePayload);

      const response = await fetch(`${API_BASE_URL}/deposits/products/${product?.assetId}/details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`更新失败: ${errorData.message || response.statusText}`);
      }

      message.success('存款产品更新成功！');
      onSuccess();
    } catch (error) {
      console.error('更新存款产品失败:', error);
      message.error(error instanceof Error ? error.message : '更新存款产品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDepositTypeChange = (value: string) => {
    setDepositType(value);
  };

  return (
    <Modal
      title={
        <Space>
          <BankOutlined />
          <span>编辑存款产品</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Divider orientation="left">基本信息</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="产品代码">
              <Input value={product?.symbol} disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="产品名称">
              <Input value={product?.productName} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="bankName"
              label="银行名称"
              rules={[{ required: true, message: '请输入银行名称' }]}
            >
              <Input placeholder="如: 工商银行" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="depositType"
              label="存款类型"
              rules={[{ required: true, message: '请选择存款类型' }]}
            >
              <Select onChange={handleDepositTypeChange}>
                <Option value="DEMAND">活期存款</Option>
                <Option value="TIME">定期存款</Option>
                <Option value="NOTICE">通知存款</Option>
                <Option value="STRUCTURED">结构性存款</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">利率信息</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="interestRate"
              label="年利率 (%)"
              rules={[
                { required: true, message: '请输入年利率' },
                { type: 'number', min: 0, max: 100, message: '利率范围 0-100%' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="如: 2.75"
                precision={4}
                step={0.01}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="rateType" label="利率类型">
              <Select>
                <Option value="FIXED">固定利率</Option>
                <Option value="FLOATING">浮动利率</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="compoundFrequency" label="计息频率">
              <Select>
                <Option value="DAILY">按日计息</Option>
                <Option value="MONTHLY">按月计息</Option>
                <Option value="QUARTERLY">按季计息</Option>
                <Option value="ANNUALLY">按年计息</Option>
                <Option value="MATURITY">到期一次性付息</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {depositType === 'TIME' && (
          <>
            <Divider orientation="left">期限设置</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="termMonths"
                  label="存款期限（月）"
                  rules={[
                    { required: depositType === 'TIME', message: '定期存款需要设置期限' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="如: 12"
                    min={1}
                    max={120}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="autoRenewal" label="自动续存" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        <Divider orientation="left">金额限制</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="minDepositAmount" label="起存金额">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="如: 50"
                min={0}
                precision={2}
                prefix="¥"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="maxDepositAmount" label="最大金额">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="不限制则留空"
                min={0}
                precision={2}
                prefix="¥"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">提前支取</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="earlyWithdrawalAllowed" label="允许提前支取" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="earlyWithdrawalPenaltyRate" label="提前支取罚息率 (%)">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="如: 0.3"
                min={0}
                max={100}
                precision={4}
                step={0.01}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">存款保险</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="depositInsuranceCovered" label="存款保险保障" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="insuranceAmount" label="保险金额">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="如: 500000"
                min={0}
                precision={2}
                prefix="¥"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default EditDepositProductModal;
