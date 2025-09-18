import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Table, TableProps } from 'antd';

interface VirtualTableProps extends Omit<TableProps<any>, 'pagination'> {
  height?: number;
  itemHeight?: number;
  enableVirtualization?: boolean;
  onScroll?: (scrollTop: number) => void;
}

const VirtualTable: React.FC<VirtualTableProps> = ({
  dataSource = [],
  height = 400,
  itemHeight = 54,
  enableVirtualization = true,
  onScroll,
  ...tableProps
}) => {
  // 如果数据量小或禁用虚拟化，使用普通表格
  if (!enableVirtualization || dataSource.length < 100) {
    return (
      <Table
        {...tableProps}
        dataSource={dataSource}
        pagination={false}
        scroll={{ y: height }}
        onScroll={(e) => {
          const target = e.target as HTMLElement;
          onScroll?.(target.scrollTop);
        }}
      />
    );
  }

  // 对于大数据量，使用Ant Design的虚拟滚动
  return (
    <Table
      {...tableProps}
      dataSource={dataSource}
      pagination={false}
      scroll={{ 
        y: height,
        scrollToFirstRowOnChange: true
      }}
      virtual
      onScroll={(e) => {
        const target = e.target as HTMLElement;
        onScroll?.(target.scrollTop);
      }}
    />
  );
};

export default VirtualTable;