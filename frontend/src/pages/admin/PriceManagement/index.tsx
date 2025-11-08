import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import { 
  EditOutlined, 
  TableOutlined, 
  UploadOutlined
} from '@ant-design/icons';
import SingleAssetMultiDate from './QuickEntry/SingleAssetMultiDate';
import MultiAssetSingleDate from './QuickEntry/MultiAssetSingleDate';
import BatchImport from './BatchImport';

const PriceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('single-multi');

  return (
    <Card title="价格管理中心" style={{ margin: 0 }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane 
          tab={
            <span>
              <EditOutlined />
              单产品多日录入
            </span>
          } 
          key="single-multi"
        >
          <SingleAssetMultiDate />
        </Tabs.TabPane>
        <Tabs.TabPane 
          tab={
            <span>
              <TableOutlined />
              多产品单日录入
            </span>
          } 
          key="multi-single"
        >
          <MultiAssetSingleDate />
        </Tabs.TabPane>
        <Tabs.TabPane 
          tab={
            <span>
              <UploadOutlined />
              批量导入
            </span>
          } 
          key="batch-import"
        >
          <BatchImport />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
};

export default PriceManagement;