import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeConfig {
  theme: Theme;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

const lightTheme: ThemeConfig = {
  theme: 'light',
  colors: {
    primary: '#1890ff',
    background: '#f0f2f5',
    surface: '#ffffff',
    text: '#000000d9',
    textSecondary: '#00000073',
    border: '#d9d9d9',
  },
};

const darkTheme: ThemeConfig = {
  theme: 'dark',
  colors: {
    primary: '#177ddc',
    background: '#141414',
    surface: '#1f1f1f',
    text: '#ffffffd9',
    textSecondary: '#ffffff73',
    border: '#434343',
  },
};

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // 从 localStorage 读取保存的主题，默认为 light
    const savedTheme = localStorage.getItem('finapp-theme') as Theme;
    return savedTheme || 'light';
  });

  const themeConfig = currentTheme === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
  };

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
  };

  // 保存主题到 localStorage
  useEffect(() => {
    localStorage.setItem('finapp-theme', currentTheme);
  }, [currentTheme]);

  // 应用主题到 document
  useEffect(() => {
    const root = document.documentElement;
    
    if (currentTheme === 'dark') {
      root.classList.add('dark-theme');
      // 设置 CSS 变量
      root.style.setProperty('--primary-color', darkTheme.colors.primary);
      root.style.setProperty('--background-color', darkTheme.colors.background);
      root.style.setProperty('--surface-color', darkTheme.colors.surface);
      root.style.setProperty('--text-color', darkTheme.colors.text);
      root.style.setProperty('--text-secondary-color', darkTheme.colors.textSecondary);
      root.style.setProperty('--border-color', darkTheme.colors.border);
    } else {
      root.classList.remove('dark-theme');
      // 设置 CSS 变量
      root.style.setProperty('--primary-color', lightTheme.colors.primary);
      root.style.setProperty('--background-color', lightTheme.colors.background);
      root.style.setProperty('--surface-color', lightTheme.colors.surface);
      root.style.setProperty('--text-color', lightTheme.colors.text);
      root.style.setProperty('--text-secondary-color', lightTheme.colors.textSecondary);
      root.style.setProperty('--border-color', lightTheme.colors.border);
    }
  }, [currentTheme]);

  return {
    theme: currentTheme,
    themeConfig,
    toggleTheme,
    setTheme,
    isDark: currentTheme === 'dark',
  };
};