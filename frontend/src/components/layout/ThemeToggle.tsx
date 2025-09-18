import React from 'react';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  return (
    <Tooltip title={isDark ? '切换到浅色主题' : '切换到深色主题'}>
      <Button
        type="text"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={onToggle}
        style={{
          color: isDark ? '#fff' : '#000',
        }}
      />
    </Tooltip>
  );
};

export default ThemeToggle;