/**
 * 资产详情字段组件索引
 */
export { StockDetailsFields } from './StockDetailsFields';
export { FundDetailsFields } from './FundDetailsFields';
export { BondDetailsFields } from './BondDetailsFields';
export { OptionDetailsFields } from './OptionDetailsFields';
export { StockOptionDetailsFields } from './StockOptionDetailsFields';

// 简化版本的其他类型组件
import React from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Switch, Row, Col, Alert } from 'antd';

const { Option } = Select;

// 期货详情字段
export const FuturesDetailsFields: React.FC = () => {
  return (
    <>
      <Alert 
        message="期货详情" 
        description="请填写期货合约的详细信息" 
        type="info" 
        showIcon 
        style={{ marginBottom: 16 }}
      />
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'futuresType']} 
            label="期货类型"
            rules={[{ required: true, message: '请选择期货类型' }]}
          >
            <Select placeholder="请选择期货类型">
              <Option value="commodity">商品期货</Option>
              <Option value="financial">金融期货</Option>
              <Option value="index">指数期货</Option>
              <Option value="currency">外汇期货</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'contractMonth']} 
            label="合约月份"
            rules={[{ required: true, message: '请输入合约月份' }]}
            tooltip="格式：YYYYMM，例如：202512"
          >
            <Input placeholder="202512" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['details', 'underlyingAsset']} label="标的资产">
            <Input placeholder="例如：沪深300指数" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['details', 'contractSize']} label="合约规模">
            <InputNumber min={0} precision={4} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['details', 'initialMargin']} label="初始保证金">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="元" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['details', 'maintenanceMargin']} label="维持保证金">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="元" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['details', 'marginRate']} label="保证金比例 (%)">
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

// 理财产品详情字段
export const WealthProductDetailsFields: React.FC = () => {
  return (
    <>
      <Alert 
        message="理财产品详情" 
        description="请填写理财产品的详细信息" 
        type="info" 
        showIcon 
        style={{ marginBottom: 16 }}
      />
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'productType']} 
            label="产品类型"
            rules={[{ required: true, message: '请选择产品类型' }]}
          >
            <Select placeholder="请选择产品类型">
              <Option value="fixed_income">固定收益型</Option>
              <Option value="floating">浮动收益型</Option>
              <Option value="structured">结构化产品</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'riskLevel']} 
            label="风险等级"
            rules={[{ required: true, message: '请选择风险等级' }]}
          >
            <Select placeholder="请选择风险等级">
              <Option value="R1">R1（低风险）</Option>
              <Option value="R2">R2（中低风险）</Option>
              <Option value="R3">R3（中风险）</Option>
              <Option value="R4">R4（中高风险）</Option>
              <Option value="R5">R5（高风险）</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['details', 'expectedReturn']} label="预期收益率 (%)">
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['details', 'minReturn']} label="最低收益率 (%)">
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['details', 'maxReturn']} label="最高收益率 (%)">
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'issueDate']} 
            label="发行日期"
            rules={[{ required: true, message: '请选择发行日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'startDate']} 
            label="起息日期"
            rules={[{ required: true, message: '请选择起息日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'maturityDate']} 
            label="到期日期"
            rules={[{ required: true, message: '请选择到期日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['details', 'minInvestment']} label="起购金额">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="元" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['details', 'issuer']} label="发行机构">
            <Input placeholder="请输入发行机构名称" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

// 国债详情字段
export const TreasuryDetailsFields: React.FC = () => {
  return (
    <>
      <Alert 
        message="国债详情" 
        description="请填写国债的详细信息" 
        type="info" 
        showIcon 
        style={{ marginBottom: 16 }}
      />
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'treasuryType']} 
            label="国债类型"
            rules={[{ required: true, message: '请选择国债类型' }]}
          >
            <Select placeholder="请选择国债类型">
              <Option value="savings">储蓄国债</Option>
              <Option value="book_entry">记账式国债</Option>
              <Option value="certificate">凭证式国债</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['details', 'termType']} label="期限类型">
            <Select placeholder="请选择期限类型">
              <Option value="short_term">短期（1年以内）</Option>
              <Option value="medium_term">中期（1-10年）</Option>
              <Option value="long_term">长期（10年以上）</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'faceValue']} 
            label="面值"
            rules={[{ required: true, message: '请输入面值' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="元" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'couponRate']} 
            label="票面利率 (%)"
            rules={[{ required: true, message: '请输入票面利率' }]}
          >
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['details', 'termYears']} label="期限（年）">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'issueDate']} 
            label="发行日期"
            rules={[{ required: true, message: '请选择发行日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'maturityDate']} 
            label="到期日期"
            rules={[{ required: true, message: '请选择到期日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['details', 'issueNumber']} label="发行批次号">
            <Input placeholder="例如：2024年第1期" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['details', 'yieldToMaturity']} label="到期收益率 (%)">
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};
