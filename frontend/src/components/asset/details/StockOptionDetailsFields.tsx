import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  DatePicker, 
  Row, 
  Col, 
  Tooltip, 
  Alert, 
  Space,
  Divider,
  Card,
  Statistic
} from 'antd';
import { 
  QuestionCircleOutlined, 
  StockOutlined,
  DollarOutlined,
  CalculatorOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { AssetService } from '../../../services/assetService';

const { Option } = Select;
const { TextArea } = Input;

interface StockOptionDetailsFieldsProps {
  form?: any; // Ant Design Form instance
}

/**
 * 股票期权详情字段组件
 * 用于股票期权产品的详细信息录入
 * 
 * 特点：
 * - 挂钩股票价格
 * - 成本计算：行权价格 / 3.5
 * - 价值计算：标的价格 - 行权价格（看涨期权）
 */
export const StockOptionDetailsFields: React.FC<StockOptionDetailsFieldsProps> = ({ form }) => {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [underlyingPrice, setUnderlyingPrice] = useState<number | null>(null);

  // 加载股票列表
  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      setLoadingStocks(true);
      console.log('开始加载股票列表...');
      
      // 获取股票类型ID - getAssetTypes() 直接返回数据数组
      const assetTypes = await AssetService.getAssetTypes();
      console.log('资产类型列表:', assetTypes);
      
      const stockType = assetTypes.find((t: any) => t.code === 'STOCK');
      console.log('找到的股票类型:', stockType);
      
      if (stockType) {
        // 查询股票列表 - searchAssets() 返回包含 assets 的对象
        const response = await AssetService.searchAssets({
          assetTypeId: stockType.id,
          isActive: true,
          limit: 100
        });
        console.log('股票列表响应:', response);
        
        const stockList = response.assets || [];
        console.log('解析后的股票列表:', stockList, '数量:', stockList.length);
        setStocks(stockList);
      } else {
        console.warn('未找到股票类型');
      }
    } catch (error) {
      console.error('加载股票列表失败:', error);
    } finally {
      setLoadingStocks(false);
    }
  };

  // 计算成本
  const calculateCost = (strikePrice?: number, costDivisor?: number) => {
    if (strikePrice && costDivisor) {
      const cost = strikePrice / costDivisor;
      setCalculatedCost(cost);
      return cost;
    }
    setCalculatedCost(null);
    return null;
  };

  // 计算价值
  const calculateValue = (optionType?: string, underlyingPrice?: number, strikePrice?: number) => {
    if (underlyingPrice && strikePrice) {
      let value = 0;
      if (optionType === 'CALL') {
        value = Math.max(0, underlyingPrice - strikePrice);
      } else if (optionType === 'PUT') {
        value = Math.max(0, strikePrice - underlyingPrice);
      }
      setCalculatedValue(value);
      return value;
    }
    setCalculatedValue(null);
    return null;
  };

  // 监听字段变化，自动计算
  const handleFieldsChange = () => {
    if (form) {
      const values = form.getFieldsValue();
      const strikePrice = values.details?.strikePrice;
      const costDivisor = values.details?.costDivisor || 3.5;
      const optionType = values.details?.optionType;
      
      calculateCost(strikePrice, costDivisor);
      
      if (underlyingPrice) {
        calculateValue(optionType, underlyingPrice, strikePrice);
      }
    }
  };

  // 选择标的股票时，获取其当前价格
  const handleStockSelect = async (stockId: string) => {
    try {
      const stock = stocks.find(s => s.id === stockId);
      if (stock) {
        // 设置股票代码和名称
        form?.setFieldsValue({
          details: {
            ...form.getFieldValue('details'),
            underlyingStockSymbol: stock.symbol,
            underlyingStockName: stock.name
          }
        });

        // 获取最新价格
        const prices = await AssetService.getAssetPrices(stockId, { limit: 1 });
        if (prices.data && prices.data.length > 0) {
          const latestPrice = prices.data[0].closePrice;
          setUnderlyingPrice(latestPrice);
          
          // 重新计算价值
          const values = form?.getFieldsValue();
          calculateValue(
            values.details?.optionType,
            latestPrice,
            values.details?.strikePrice
          );
        }
      }
    } catch (error) {
      console.error('获取股票价格失败:', error);
    }
  };

  return (
    <>
      <Alert
        message="股票期权说明"
        description={
          <Space direction="vertical" size="small">
            <div>• 挂钩股票价格的期权产品</div>
            <div>• <strong>成本计算</strong>：行权价格 ÷ 3.5</div>
            <div>• <strong>价值计算</strong>：看涨期权 = MAX(0, 标的价格 - 行权价格)；看跌期权 = MAX(0, 行权价格 - 标的价格)</div>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Divider orientation="left">
        <Space>
          <StockOutlined />
          标的股票信息
        </Space>
      </Divider>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name={['details', 'underlyingStockId']}
            label={
              <span>
                标的股票&nbsp;
                <Tooltip title="选择该期权挂钩的股票">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请选择标的股票' }]}
          >
            <Select
              placeholder="请选择标的股票"
              showSearch
              loading={loadingStocks}
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={handleStockSelect}
            >
              {stocks.map(stock => (
                <Option key={stock.id} value={stock.id}>
                  {stock.symbol} - {stock.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['details', 'underlyingStockSymbol']} label="股票代码">
            <Input disabled placeholder="自动填充" />
          </Form.Item>
        </Col>
        <Col span={6}>
          {underlyingPrice && (
            <Statistic
              title="当前价格"
              value={underlyingPrice}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: 16 }}
            />
          )}
        </Col>
      </Row>

      <Divider orientation="left">
        <Space>
          <DollarOutlined />
          期权基本信息
        </Space>
      </Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={['details', 'optionType']}
            label={
              <span>
                期权类型&nbsp;
                <Tooltip title="看涨期权（CALL）：预期标的价格上涨；看跌期权（PUT）：预期标的价格下跌">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请选择期权类型' }]}
          >
            <Select placeholder="请选择期权类型" onChange={handleFieldsChange}>
              <Option value="CALL">看涨期权（CALL）</Option>
              <Option value="PUT">看跌期权（PUT）</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'strikePrice']}
            label={
              <span>
                行权价格&nbsp;
                <Tooltip title="期权持有人可以买入或卖出标的股票的价格">
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
              placeholder="如：15.50"
              onChange={handleFieldsChange}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'expirationDate']}
            label={
              <span>
                到期日&nbsp;
                <Tooltip title="期权的最后交易日和行权日">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请选择到期日' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择到期日" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">
        <Space>
          <CalculatorOutlined />
          成本与价值计算
        </Space>
      </Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={['details', 'costDivisor']}
            label={
              <span>
                成本除数&nbsp;
                <Tooltip title="用于计算成本的除数，默认为3.5。成本 = 行权价格 ÷ 除数">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            initialValue={3.5}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.1}
              step={0.1}
              precision={2}
              placeholder="默认：3.5"
              onChange={handleFieldsChange}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          {calculatedCost !== null && (
            <Card size="small">
              <Statistic
                title="计算成本"
                value={calculatedCost}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#3f8600', fontSize: 18 }}
              />
            </Card>
          )}
        </Col>
        <Col span={8}>
          {calculatedValue !== null && (
            <Card size="small">
              <Statistic
                title="当前价值"
                value={calculatedValue}
                precision={2}
                prefix="¥"
                valueStyle={{ 
                  color: calculatedValue > 0 ? '#cf1322' : '#999',
                  fontSize: 18 
                }}
              />
            </Card>
          )}
        </Col>
      </Row>

      <Divider orientation="left">
        <Space>
          <LineChartOutlined />
          合约信息
        </Space>
      </Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={['details', 'contractSize']}
            label={
              <span>
                合约规模&nbsp;
                <Tooltip title="一份期权合约代表的股票数量">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            initialValue={10000}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              step={100}
              placeholder="如：10000"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'exerciseStyle']}
            label={
              <span>
                行权方式&nbsp;
                <Tooltip title="美式：到期前任何时间可行权；欧式：只能在到期日行权">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            initialValue="AMERICAN"
          >
            <Select placeholder="请选择行权方式">
              <Option value="AMERICAN">美式（American）</Option>
              <Option value="EUROPEAN">欧式（European）</Option>
              <Option value="BERMUDA">百慕大式（Bermuda）</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'settlementType']}
            label={
              <span>
                结算方式&nbsp;
                <Tooltip title="实物交割：交割股票；现金结算：交割现金差价">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            initialValue="PHYSICAL"
          >
            <Select placeholder="请选择结算方式">
              <Option value="PHYSICAL">实物交割</Option>
              <Option value="CASH">现金结算</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={['details', 'multiplier']}
            label={
              <span>
                合约乘数&nbsp;
                <Tooltip title="每点价格变动对应的金额">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            initialValue={1.0}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              step={0.1}
              precision={2}
              placeholder="如：1.0"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'tradingUnit']}
            label="交易单位"
            initialValue="手"
          >
            <Input placeholder="如：手" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'minPriceChange']}
            label={
              <span>
                最小变动价位&nbsp;
                <Tooltip title="价格变动的最小单位">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.0001}
              step={0.0001}
              precision={4}
              placeholder="如：0.0001"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">希腊字母（Greeks）- 风险指标</Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={['details', 'delta']}
            label={
              <span>
                Delta&nbsp;
                <Tooltip title="期权价格对标的价格变化的敏感度，范围-1到1">
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
              placeholder="如：0.65"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'gamma']}
            label={
              <span>
                Gamma&nbsp;
                <Tooltip title="Delta对标的价格变化的敏感度">
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
              placeholder="如：0.05"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'theta']}
            label={
              <span>
                Theta&nbsp;
                <Tooltip title="期权价格对时间流逝的敏感度，通常为负值">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              step={0.01}
              precision={4}
              placeholder="如：-0.02"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={['details', 'vega']}
            label={
              <span>
                Vega&nbsp;
                <Tooltip title="期权价格对波动率变化的敏感度">
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
              placeholder="如：0.15"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'rho']}
            label={
              <span>
                Rho&nbsp;
                <Tooltip title="期权价格对利率变化的敏感度">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              step={0.01}
              precision={4}
              placeholder="如：0.08"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'impliedVolatility']}
            label={
              <span>
                隐含波动率&nbsp;
                <Tooltip title="市场对未来波动率的预期，通常用百分比表示">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={2}
              step={0.01}
              precision={4}
              placeholder="如：0.25（25%）"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">其他信息</Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={['details', 'marginRequirement']}
            label={
              <span>
                保证金要求&nbsp;
                <Tooltip title="交易该期权需要的保证金金额">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              placeholder="如：5000"
              prefix="¥"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'commissionRate']}
            label={
              <span>
                手续费率&nbsp;
                <Tooltip title="交易手续费率，如0.0003表示0.03%">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={1}
              step={0.0001}
              precision={4}
              placeholder="如：0.0003"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['details', 'premiumCurrency']}
            label="权利金币种"
            initialValue="CNY"
          >
            <Select placeholder="请选择币种">
              <Option value="CNY">人民币（CNY）</Option>
              <Option value="USD">美元（USD）</Option>
              <Option value="HKD">港币（HKD）</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name={['details', 'notes']}
            label="备注说明"
          >
            <TextArea
              rows={3}
              placeholder="输入关于该股票期权的其他说明信息..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StockOptionDetailsFields;
