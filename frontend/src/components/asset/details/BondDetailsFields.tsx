/**
 * 债券详情字段组件
 */
import React from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Switch, Row, Col } from 'antd';

const { Option } = Select;

export const BondDetailsFields: React.FC = () => {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'bondType']} 
            label="债券类型"
            rules={[{ required: true, message: '请选择债券类型' }]}
          >
            <Select placeholder="请选择债券类型">
              <Option value="government">政府债</Option>
              <Option value="corporate">企业债</Option>
              <Option value="municipal">地方债</Option>
              <Option value="convertible">可转债</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'creditRating']} 
            label="信用评级"
            tooltip="例如：AAA, AA+, AA, A等"
          >
            <Select placeholder="请选择信用评级">
              <Option value="AAA">AAA</Option>
              <Option value="AA+">AA+</Option>
              <Option value="AA">AA</Option>
              <Option value="AA-">AA-</Option>
              <Option value="A+">A+</Option>
              <Option value="A">A</Option>
              <Option value="A-">A-</Option>
              <Option value="BBB+">BBB+</Option>
              <Option value="BBB">BBB</Option>
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
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="100.00"
              addonAfter="元"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'couponRate']} 
            label="票面利率 (%)"
            rules={[{ required: true, message: '请输入票面利率' }]}
          >
            <InputNumber 
              min={0} 
              max={100} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="3.50"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'couponFrequency']} 
            label="付息频率"
          >
            <Select placeholder="请选择付息频率">
              <Option value="annual">年付</Option>
              <Option value="semi_annual">半年付</Option>
              <Option value="quarterly">季付</Option>
              <Option value="monthly">月付</Option>
            </Select>
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
            name={['details', 'maturityDate']} 
            label="到期日期"
            rules={[{ required: true, message: '请选择到期日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'yearsToMaturity']} 
            label="剩余年限"
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="5.00"
              addonAfter="年"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'yieldToMaturity']} 
            label="到期收益率 (%)"
          >
            <InputNumber 
              min={0} 
              max={100} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="4.00"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'currentYield']} 
            label="当前收益率 (%)"
          >
            <InputNumber 
              min={0} 
              max={100} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="3.80"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'issuePrice']} 
            label="发行价格"
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="100.00"
              addonAfter="元"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'issuer']} 
            label="发行人"
          >
            <Input placeholder="请输入发行人名称" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'issueSize']} 
            label="发行规模（亿）"
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="10.00"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'callable']} 
            label="是否可赎回"
            valuePropName="checked"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'callDate']} 
            label="赎回日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'callPrice']} 
            label="赎回价格"
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="105.00"
              addonAfter="元"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};
