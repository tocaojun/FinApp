import React, { createContext, useContext, useState, useEffect } from 'react';
import * as echarts from 'echarts';

// 定义主题配置
const lightTheme = {
  backgroundColor: '#ffffff',
  textStyle: {
    color: '#333333'
  },
  title: {
    textStyle: {
      color: '#333333'
    }
  },
  legend: {
    textStyle: {
      color: '#333333'
    }
  },
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: '#dddddd',
    textStyle: {
      color: '#333333'
    }
  },
  grid: {
    borderColor: '#dddddd'
  },
  categoryAxis: {
    axisLine: {
      lineStyle: {
        color: '#dddddd'
      }
    },
    axisLabel: {
      color: '#333333'
    },
    splitLine: {
      lineStyle: {
        color: '#f0f0f0'
      }
    }
  },
  valueAxis: {
    axisLine: {
      lineStyle: {
        color: '#dddddd'
      }
    },
    axisLabel: {
      color: '#333333'
    },
    splitLine: {
      lineStyle: {
        color: '#f0f0f0'
      }
    }
  },
  color: [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#fa8c16', '#13c2c2', '#eb2f96', '#a0d911', '#2f54eb'
  ]
};

const darkTheme = {
  backgroundColor: '#1a1a1a',
  textStyle: {
    color: '#ffffff'
  },
  title: {
    textStyle: {
      color: '#ffffff'
    }
  },
  legend: {
    textStyle: {
      color: '#ffffff'
    }
  },
  tooltip: {
    backgroundColor: '#2a2a2a',
    borderColor: '#555555',
    textStyle: {
      color: '#ffffff'
    }
  },
  grid: {
    borderColor: '#555555'
  },
  categoryAxis: {
    axisLine: {
      lineStyle: {
        color: '#555555'
      }
    },
    axisLabel: {
      color: '#ffffff'
    },
    splitLine: {
      lineStyle: {
        color: '#333333'
      }
    }
  },
  valueAxis: {
    axisLine: {
      lineStyle: {
        color: '#555555'
      }
    },
    axisLabel: {
      color: '#ffffff'
    },
    splitLine: {
      lineStyle: {
        color: '#333333'
      }
    }
  },
  color: [
    '#64b5f6', '#81c784', '#ffb74d', '#e57373', '#ba68c8',
    '#ff8a65', '#4dd0e1', '#f06292', '#aed581', '#5c6bc0'
  ]
};

interface ChartThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  getThemeConfig: () => any;
}

const ChartThemeContext = createContext<ChartThemeContextType | undefined>(undefined);

export const useChartTheme = () => {
  const context = useContext(ChartThemeContext);
  if (!context) {
    throw new Error('useChartTheme must be used within a ChartThemeProvider');
  }
  return context;
};

interface ChartThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export const ChartThemeProvider: React.FC<ChartThemeProviderProps> = ({
  children,
  defaultTheme = 'light'
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);

  // 注册ECharts主题
  useEffect(() => {
    echarts.registerTheme('light', lightTheme);
    echarts.registerTheme('dark', darkTheme);
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('chart-theme') === null) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    
    // 初始化时检查系统主题
    const savedTheme = localStorage.getItem('chart-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (mediaQuery.matches) {
      setTheme('dark');
    }

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('chart-theme', newTheme);
  };

  const getThemeConfig = () => {
    return theme === 'dark' ? darkTheme : lightTheme;
  };

  const value: ChartThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    getThemeConfig
  };

  return (
    <ChartThemeContext.Provider value={value}>
      {children}
    </ChartThemeContext.Provider>
  );
};

export default ChartThemeProvider;