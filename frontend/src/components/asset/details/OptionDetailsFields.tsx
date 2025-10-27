import React from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Row, Col, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * 期权详情字段组件
 * 用于期权产品的详细信息录入
 */
export const OptionDetailsFields: React.FC = () => {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'optionType']} 
            label={
              <span>
                期权类型&nbsp;
                <Tooltip title="看涨期权（Call）或看跌期权（Put）">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请选择期权类型' }]}
          >
            <Select placeholder="请选择期权类型">
              <Option value="call">看涨期权（Call）</Option>
              <Option value="put">看跌期权（Put）</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'exerciseStyle']} 
            label={
              <span>
                行权方式&nbsp;
                <Tooltip title="欧式期权只能在到期日行权，美式期权可在到期日前任何时间行权">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请选择行权方式' }]}
          >
            <Select placeholder="请选择行权方式">
              <Option value="european">欧式（European）</Option>
              <Option value="american">美式（American）</Option>
              <Option value="bermuda">百慕大式（Bermuda）</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'strikePrice']} 
            label={
              <span>
                行权价格&nbsp;
                <Tooltip title="期权持有人可以买入或卖出标的资产的价格">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请输入行权价格' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              placeholder="如：100.00"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'contractSize']} 
            label={
              <span>
                合约规模&nbsp;
                <Tooltip title="一份期权合约代表的标的资产数量">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              step={1}
              placeholder="如：100"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'premium']} 
            label={
              <span>
                期权费&nbsp;
                <Tooltip title="购买期权需要支付的费用">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              placeholder="如：5.50"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'expirationDate']} 
            label={
              <span>
                到期日期&nbsp;
                <Tooltip title="期权合约的最后有效日期">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请选择到期日期' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              placeholder="选择到期日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'settlementMethod']} 
            label={
              <span>
                结算方式&nbsp;
                <Tooltip title="实物交割或现金结算">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <Select placeholder="请选择结算方式">
              <Option value="physical">实物交割</Option>
              <Option value="cash">现金结算</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'underlyingAsset']} 
            label={
              <span>
                标的资产&nbsp;
                <Tooltip title="期权对应的基础资产，如股票代码、指数等">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <Input placeholder="如：AAPL、上证50ETF" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'underlyingPrice']} 
            label={
              <span>
                标的价格&nbsp;
                <Tooltip title="标的资产的当前市场价格">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              placeholder="如：105.50"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'impliedVolatility']} 
            label={
              <span>
                隐含波动率&nbsp;
                <Tooltip title="市场对标的资产未来波动性的预期，以百分比表示">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={0.01}
              precision={2}
              placeholder="如：25.50"
              addonAfter="%"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'delta']} 
            label={
              <span>
                Delta值&nbsp;
                <Tooltip title="期权价格相对于标的资产价格变动的敏感度">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={-1}
              max={1}
              step={0.01}
              precision={4}
              placeholder="如：0.5000"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'gamma']} 
            label={
              <span>
                Gamma值&nbsp;
                <Tooltip title="Delta值相对于标的资产价格变动的敏感度">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.0001}
              precision={4}
              placeholder="如：0.0250"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            name={['details', 'theta']} 
            label={
              <span>
                Theta值&nbsp;
                <Tooltip title="期权价格随时间流逝的衰减速度">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              step={0.01}
              precision={4}
              placeholder="如：-0.0500"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'vega']} 
            label={
              <span>
                Vega值&nbsp;
                <Tooltip title="期权价格相对于隐含波动率变动的敏感度">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={4}
              placeholder="如：0.1500"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item 
            name={['details', 'rho']} 
            label={
              <span>
                Rho值&nbsp;
                <Tooltip title="期权价格相对于无风险利率变动的敏感度">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              step={0.01}
              precision={4}
              placeholder="如：0.0800"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name={['details', 'openInterest']} 
            label={
              <span>
                持仓量&nbsp;
                <Tooltip title="市场上未平仓的期权合约总数">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1}
              placeholder="如：10000"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name={['details', 'tradingVolume']} 
            label={
              <span>
                交易量&nbsp;
                <Tooltip title="当日的期权合约交易数量">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1}
              placeholder="如：5000"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item 
            name={['details', 'notes']} 
            label="备注"
          >
            <Input.TextArea
              rows={3}
              placeholder="其他需要说明的信息"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default OptionDetailsFields;
