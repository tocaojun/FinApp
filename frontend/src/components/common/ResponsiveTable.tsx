import React, { useState, useMemo } from 'react';
import { Table, Card, Drawer, Button, Space, Tag, Grid, Typography } from 'antd';
import { EyeOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';

const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

interface ResponsiveTableProps<T = any> extends Omit<TableProps<T>, 'columns'> {
  columns: ColumnsType<T>;
  title?: string;
  mobileCardRender?: (record: T, index: number) => React.ReactNode;
  mobileDetailRender?: (record: T) => React.ReactNode;
  showMobileDetail?: boolean;
}

function ResponsiveTable<T extends Record<string, any>>({
  columns,
  title,
  mobileCardRender,
  mobileDetailRender,
  showMobileDetail = true,
  ...tableProps
}: ResponsiveTableProps<T>) {
  const [selectedRecord, setSelectedRecord] = useState<T | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // 移动端显示的关键列（前3个重要列）
  const mobileColumns = useMemo(() => {
    return columns.slice(0, 3).map(col => ({
      ...col,
      width: undefined, // 移除固定宽度
    }));
  }, [columns]);

  // 默认的移动端卡片渲染
  const defaultMobileCardRender = (record: T, index: number) => {
    const keyColumn = columns[0];
    const valueColumns = columns.slice(1, 4); // 显示前3个值列

    return (
      <Card
        size="small"
        style={{ marginBottom: 8 }}
        bodyStyle={{ padding: '12px 16px' }}
        extra={
          showMobileDetail && mobileDetailRender && (
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedRecord(record);
                setDetailVisible(true);
              }}
            />
          )
        }
      >
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 14 }}>
            {keyColumn.render 
              ? keyColumn.render(record[keyColumn.dataIndex as string], record, index)
              : record[keyColumn.dataIndex as string]
            }
          </Text>
        </div>
        
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {valueColumns.map((col, idx) => {
            const value = record[col.dataIndex as string];
            const renderedValue = col.render 
              ? col.render(value, record, index)
              : value;
            
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {col.title as string}:
                </Text>
                <div style={{ fontSize: 12 }}>
                  {renderedValue}
                </div>
              </div>
            );
          })}
        </Space>
      </Card>
    );
  };

  // 移动端详情抽屉
  const renderMobileDetail = () => {
    if (!selectedRecord || !mobileDetailRender) return null;

    return (
      <Drawer
        title="详细信息"
        placement="bottom"
        onClose={() => setDetailVisible(false)}
        open={detailVisible}
        height="70%"
        bodyStyle={{ padding: '16px' }}
      >
        {mobileDetailRender(selectedRecord)}
      </Drawer>
    );
  };

  // 移动端列表渲染
  const renderMobileList = () => {
    const { dataSource = [] } = tableProps;
    
    return (
      <div className="mobile-table-list">
        {dataSource.map((record, index) => (
          <div key={record.key || index}>
            {mobileCardRender 
              ? mobileCardRender(record, index)
              : defaultMobileCardRender(record, index)
            }
          </div>
        ))}
        {renderMobileDetail()}
      </div>
    );
  };

  // 桌面端表格渲染
  const renderDesktopTable = () => {
    return (
      <Table
        {...tableProps}
        columns={columns}
        scroll={{ x: 'max-content' }}
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
      />
    );
  };

  const content = isMobile ? renderMobileList() : renderDesktopTable();

  if (title) {
    return (
      <Card 
        title={title}
        bodyStyle={{ padding: isMobile ? '12px' : '16px' }}
        headStyle={{ 
          padding: isMobile ? '0 12px' : '0 16px',
          minHeight: isMobile ? '40px' : '48px'
        }}
      >
        {content}
      </Card>
    );
  }

  return content;
}

export default ResponsiveTable;