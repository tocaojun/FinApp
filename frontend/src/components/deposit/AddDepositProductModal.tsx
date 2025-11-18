import React, { useState } from 'react';
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

const { Option } = Select;
const { TextArea } = Input;

interface AddDepositProductModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AddDepositProductModal: React.FC<AddDepositProductModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [depositType, setDepositType] = useState<string>('DEMAND');

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('auth_token');

      // 1. 首先获取DEPOSIT资产类型的ID
      console.log('获取资产类型列表...');
      const assetTypesResponse = await fetch(`${API_BASE_URL}/assets/types`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!assetTypesResponse.ok) {
        throw new Error('获取资产类型失败');
      }

      const assetTypesData = await assetTypesResponse.json();
      const depositType = assetTypesData.data?.find((type: any) => type.code === 'DEPOSIT');

      if (!depositType) {
        throw new Error('找不到存款资产类型');
      }

      console.log('找到DEPOSIT资产类型ID:', depositType.id);

      // 2. 创建资产
      const assetPayload = {
        symbol: values.symbol,
        name: values.productName,
        assetTypeId: depositType.id, // 使用ID而不是code
        currency: values.currency || 'CNY',
        description: values.description || `${values.bankName}${values.productName}`,
        isActive: true
      };

      console.log('创建资产:', assetPayload);

      const assetResponse = await fetch(`${API_BASE_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assetPayload)
      });

      if (!assetResponse.ok) {
        const errorData = await assetResponse.json();
        throw new Error(`创建资产失败: ${errorData.message || assetResponse.statusText}`);
      }

      const assetData = await assetResponse.json();
      const assetId = assetData.data?.id;

      if (!assetId) {
        throw new Error('创建资产成功但未返回ID');
      }

      console.log('资产创建成功, ID:', assetId);

      // 3. 创建存款产品详情
      const depositDetailsPayload = {
        assetId,
        depositType: values.depositType,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        branchName: values.branchName,
        interestRate: values.interestRate / 100, // 转换为小数
        rateType: values.rateType,
        compoundFrequency: values.compoundFrequency,
        termMonths: values.termMonths,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        maturityDate: values.maturityDate?.format('YYYY-MM-DD'),
        autoRenewal: values.autoRenewal || false,
        minDepositAmount: values.minDepositAmount,
        maxDepositAmount: values.maxDepositAmount,
        depositIncrement: values.depositIncrement,
        earlyWithdrawalAllowed: values.earlyWithdrawalAllowed !== false,
        earlyWithdrawalPenaltyRate: values.earlyWithdrawalPenaltyRate ? values.earlyWithdrawalPenaltyRate / 100 : null,
        noticePeriodDays: values.noticePeriodDays,
        depositInsuranceCovered: values.depositInsuranceCovered !== false,
        insuranceAmount: values.insuranceAmount || 500000
      };

      console.log('创建存款详情:', depositDetailsPayload);

      const detailsResponse = await fetch(`${API_BASE_URL}/deposits/products/${assetId}/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(depositDetailsPayload)
      });

      if (!detailsResponse.ok) {
        const errorData = await detailsResponse.json();
        throw new Error(`创建存款详情失败: ${errorData.message || detailsResponse.statusText}`);
      }

      message.success('存款产品创建成功！');
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('创建存款产品失败:', error);
      message.error(error instanceof Error ? error.message : '创建存款产品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDepositTypeChange = (value: string) => {
    setDepositType(value);
    // 根据存款类型设置默认值
    if (value === 'DEMAND') {
      form.setFieldsValue({
        termMonths: undefined,
        compoundFrequency: 'DAILY'
      });
    } else if (value === 'TIME') {
      form.setFieldsValue({
        compoundFrequency: 'MATURITY'
      });
    }
  };

  return (
    <Modal
      title={
        <Space>
          <BankOutlined />
          <span>添加存款产品</span>
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
        initialValues={{
          currency: 'CNY',
          rateType: 'FIXED',
          compoundFrequency: 'DAILY',
          depositType: 'DEMAND',
          earlyWithdrawalAllowed: true,
          depositInsuranceCovered: true,
          autoRenewal: false,
          insuranceAmount: 500000
        }}
      >
        <Divider orientation="left">基本信息</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="symbol"
              label="产品代码"
              rules={[
                { required: true, message: '请输入产品代码' },
                { pattern: /^[A-Z0-9_]+$/, message: '只能包含大写字母、数字和下划线' }
              ]}
              tooltip="唯一标识，如 DEPOSIT_ICBC_12M"
            >
              <Input placeholder="如: DEPOSIT_ICBC_12M" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="productName"
              label="产品名称"
              rules={[{ required: true, message: '请输入产品名称' }]}
            >
              <Input placeholder="如: 工商银行12个月定期存款" />
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
            <Form.Item name="branchName" label="支行名称">
              <Input placeholder="如: 北京分行" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
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
          <Col span={12}>
            <Form.Item name="currency" label="币种">
              <Select>
                <Option value="CNY">人民币 (CNY)</Option>
                <Option value="USD">美元 (USD)</Option>
                <Option value="EUR">欧元 (EUR)</Option>
                <Option value="HKD">港币 (HKD)</Option>
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
              <Col span={8}>
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
              <Col span={8}>
                <Form.Item name="autoRenewal" label="自动续存" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {depositType === 'NOTICE' && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="noticePeriodDays"
                label="通知期（天）"
                rules={[{ required: depositType === 'NOTICE', message: '请输入通知期' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="如: 7"
                  min={1}
                  max={90}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Divider orientation="left">金额限制</Divider>
        <Row gutter={16}>
          <Col span={8}>
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
          <Col span={8}>
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
          <Col span={8}>
            <Form.Item name="depositIncrement" label="递增单位">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="如: 100"
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

        <Form.Item name="description" label="产品描述">
          <TextArea rows={3} placeholder="输入产品的详细说明..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddDepositProductModal;
