/**
 * 基金详情字段组件
 */
import React from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Row, Col } from 'antd';

const { Option } = Select;

export const FundDetailsFields: React.FC = () => {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'fundType']} 
            label="基金类型"
            rules={[{ required: true, message: '请选择基金类型' }]}
            tooltip="基金的投资类型"
          >
            <Select placeholder="请选择基金类型">
              <Option value="equity">股票型</Option>
              <Option value="bond">债券型</Option>
              <Option value="hybrid">混合型</Option>
              <Option value="money_market">货币市场型</Option>
              <Option value="index">指数型</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'fundCategory']} 
            label="基金分类"
            tooltip="例如：大盘、小盘、成长、价值等"
          >
            <Select placeholder="请选择基金分类">
              <Option value="large_cap">大盘</Option>
              <Option value="small_cap">小盘</Option>
              <Option value="growth">成长型</Option>
              <Option value="value">价值型</Option>
              <Option value="balanced">平衡型</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'nav']} 
            label="最新净值"
            tooltip="基金单位净值"
          >
            <InputNumber 
              min={0} 
              precision={4} 
              style={{ width: '100%' }}
              placeholder="1.0000"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'accumulatedNav']} 
            label="累计净值"
          >
            <InputNumber 
              min={0} 
              precision={4} 
              style={{ width: '100%' }}
              placeholder="1.0000"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'navDate']} 
            label="净值日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'managementFee']} 
            label="管理费率 (%)"
            tooltip="年度管理费率"
          >
            <InputNumber 
              min={0} 
              max={10} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="1.50"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'custodianFee']} 
            label="托管费率 (%)"
          >
            <InputNumber 
              min={0} 
              max={5} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="0.25"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'subscriptionFee']} 
            label="申购费率 (%)"
          >
            <InputNumber 
              min={0} 
              max={10} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="1.50"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'redemptionFee']} 
            label="赎回费率 (%)"
          >
            <InputNumber 
              min={0} 
              max={10} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="0.50"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'fundSize']} 
            label="基金规模（亿）"
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="10.00"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'inceptionDate']} 
            label="成立日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'fundManager']} 
            label="基金经理"
          >
            <Input placeholder="请输入基金经理姓名" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'fundCompany']} 
            label="基金公司"
          >
            <Input placeholder="请输入基金公司名称" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'minInvestment']} 
            label="最低投资额"
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="1000.00"
              addonAfter="元"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'minRedemption']} 
            label="最低赎回额"
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
    </>
  );
};
