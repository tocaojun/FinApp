import React, { useState } from 'react';
import { Card, Tabs, Typography } from 'antd';
import { BankOutlined, UnorderedListOutlined, BellOutlined } from '@ant-design/icons';
import DepositPositionManagement from '../../components/deposit/DepositPositionManagement';
import DepositProductList from '../../components/deposit/DepositProductList';

const { Title } = Typography;
const { TabPane } = Tabs;

/**
 * 存款管理主页面
 * 集成存款持仓管理和产品列表两个核心组件
 */
const DepositManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('positions');

  return (
    <div style={{ padding: '0 24px' }}>
      <Card bordered={false}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
        >
          <TabPane
            tab={
              <span>
                <BankOutlined />
                我的存款
              </span>
            }
            key="positions"
          >
            <DepositPositionManagement />
          </TabPane>

          <TabPane
            tab={
              <span>
                <UnorderedListOutlined />
                产品列表
              </span>
            }
            key="products"
          >
            <DepositProductList />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default DepositManagement;
