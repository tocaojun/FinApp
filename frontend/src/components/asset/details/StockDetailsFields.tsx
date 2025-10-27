/**
 * 股票详情字段组件
 */
import React from 'react';
import { Form, Input, InputNumber, Row, Col } from 'antd';

export const StockDetailsFields: React.FC = () => {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'sector']} 
            label="行业板块"
            tooltip="例如：科技、金融、医疗等"
          >
            <Input placeholder="例如：科技" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'industry']} 
            label="细分行业"
            tooltip="例如：半导体、互联网、生物制药等"
          >
            <Input placeholder="例如：半导体" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'marketCap']} 
            label="市值（亿）"
            tooltip="公司总市值"
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="0.00"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'peRatio']} 
            label="市盈率 (P/E)"
            tooltip="股价/每股收益"
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="0.00"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'pbRatio']} 
            label="市净率 (P/B)"
            tooltip="股价/每股净资产"
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="0.00"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'dividendYield']} 
            label="股息率 (%)"
            tooltip="年度股息/股价"
          >
            <InputNumber 
              min={0} 
              max={100} 
              precision={2} 
              style={{ width: '100%' }}
              placeholder="0.00"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'sharesOutstanding']} 
            label="流通股数（万股）"
          >
            <InputNumber 
              min={0} 
              style={{ width: '100%' }}
              placeholder="0"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'foundedYear']} 
            label="成立年份"
          >
            <InputNumber 
              min={1800} 
              max={new Date().getFullYear()} 
              style={{ width: '100%' }}
              placeholder="2000"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'companyWebsite']} 
            label="公司网站"
          >
            <Input placeholder="https://www.example.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'headquarters']} 
            label="总部地址"
          >
            <Input placeholder="例如：美国加州库比蒂诺" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};
