const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/AssetManagement.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. 更新表格的市场/国家列定义
content = content.replace(
  `    {
      title: '市场/国家',
      dataIndex: 'marketName',
      key: 'marketName',
      width: 120,
      render: (text: string, record: Asset) => record.marketName || record.countryName || '-',
    },`,
  `    {
      title: '市场/国家',
      dataIndex: 'marketName',
      key: 'marketName',
      width: 120,
      render: (text: string, record: Asset) => record.marketName || record.countryName || '-',
    },`
);

// 2. 添加国家选择器到搜索筛选器
content = content.replace(
  `            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="货币"`,
  `            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="国家"
              allowClear
              value={selectedCountry}
              onChange={setSelectedCountry}
              style={{ width: '100%' }}
            >
              {countries.map(country => (
                <Option key={country.id} value={country.id}>{country.name || country.code}</Option>
              ))}
            </Select>
          </Col>
          <Col span={2}>
            <Select
              placeholder="货币"`
);

// 3. 更新资产表单中的市场和国家字段
content = content.replace(
  `            <Col span={12}>
              <Form.Item
                name="marketId"
                label="交易市场"
                rules={[{ required: true, message: '请选择交易市场' }]}
              >
                <Select placeholder="请选择交易市场">
                  {markets.map(market => (
                    <Option key={market.id} value={market.id}>{market.name || market.code}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>`,
  `            <Col span={6}>
              <Form.Item
                name="marketId"
                label="交易市场"
              >
                <Select placeholder="请选择交易市场" allowClear>
                  {markets.map(market => (
                    <Option key={market.id} value={market.id}>{market.name || market.code}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="countryId"
                label="国家"
              >
                <Select placeholder="请选择国家" allowClear>
                  {countries.map(country => (
                    <Option key={country.id} value={country.id}>{country.name || country.code}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ AssetManagement.tsx 已更新');
