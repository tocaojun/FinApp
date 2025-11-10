/**
 * 币种符号映射
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CNY': '¥',
  'HKD': 'HK$',
  'SGD': 'S$',
  'AUD': 'A$',
  'CAD': 'C$',
  'CHF': 'CHF',
  'NZD': 'NZ$',
  'MXN': '$',
  'INR': '₹',
  'KRW': '₩',
  'THB': '฿',
  'PHP': '₱',
  'IDR': 'Rp',
  'VND': '₫',
  'MYR': 'RM',
  'TWD': 'NT$',
  'ZAR': 'R',
  'BRL': 'R$',
  'RUB': '₽',
};

/**
 * 获取币种符号
 * @param currency - 币种代码（如 USD, CNY 等）
 * @returns 币种符号，如果未找到则返回币种代码
 */
export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency?.toUpperCase()] || currency || '¥';
};

/**
 * 格式化货币值
 * @param value - 数值
 * @param currency - 币种代码
 * @param decimals - 小数位数
 * @returns 格式化后的货币字符串
 */
export const formatCurrency = (
  value: number,
  currency: string = 'CNY',
  decimals: number = 2
): string => {
  const symbol = getCurrencySymbol(currency);
  const formattedValue = Math.abs(value).toFixed(decimals);
  return `${symbol}${formattedValue}`;
};

/**
 * 格式化价格（带多个小数位）
 * @param price - 价格值
 * @param currency - 币种代码
 * @param decimals - 小数位数
 * @returns 格式化后的价格字符串
 */
export const formatPrice = (
  price: number,
  currency: string = 'CNY',
  decimals: number = 4
): string => {
  const symbol = getCurrencySymbol(currency);
  const formattedValue = price.toFixed(decimals);
  return `${symbol}${formattedValue}`;
};
