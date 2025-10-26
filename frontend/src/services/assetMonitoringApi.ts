import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// 监控规则接口
export interface MonitoringRule {
  id: string;
  assetId: string;
  type: 'price' | 'volume' | 'volatility' | 'pe' | 'marketcap';
  condition: 'above' | 'below' | 'change_above' | 'change_below';
  threshold: number;
  isActive: boolean;
  createdAt: string;
  triggeredCount: number;
}

// 告警接口
export interface Alert {
  id: string;
  assetId: string;
  ruleId: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  value: number;
  threshold: number;
  createdAt: string;
  isRead: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 监控统计接口
export interface MonitoringStats {
  totalRules: number;
  activeRules: number;
  triggeredToday: number;
  unreadAlerts: number;
}

// 获取监控规则
export const getMonitoringRules = async (assetIds?: string[]): Promise<MonitoringRule[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/monitoring/rules`, {
      params: assetIds ? { assetIds: assetIds.join(',') } : {},
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch monitoring rules:', error);
    // 返回模拟数据作为后备
    return generateMockRules(assetIds || []);
  }
};

// 创建监控规则
export const createMonitoringRule = async (rule: Omit<MonitoringRule, 'id' | 'createdAt' | 'triggeredCount'>): Promise<MonitoringRule> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/monitoring/rules`, rule, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to create monitoring rule:', error);
    throw error;
  }
};

// 更新监控规则
export const updateMonitoringRule = async (id: string, updates: Partial<MonitoringRule>): Promise<MonitoringRule> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/monitoring/rules/${id}`, updates, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to update monitoring rule:', error);
    throw error;
  }
};

// 删除监控规则
export const deleteMonitoringRule = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/monitoring/rules/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to delete monitoring rule:', error);
    throw error;
  }
};

// 获取告警列表
export const getAlerts = async (params?: { 
  assetIds?: string[]; 
  isRead?: boolean; 
  severity?: string;
  limit?: number;
}): Promise<Alert[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/monitoring/alerts`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    // 返回模拟数据作为后备
    return generateMockAlerts();
  }
};

// 标记告警为已读
export const markAlertAsRead = async (alertId: string): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/monitoring/alerts/${alertId}/read`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to mark alert as read:', error);
    throw error;
  }
};

// 批量标记告警为已读
export const markAlertsAsRead = async (alertIds: string[]): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/monitoring/alerts/batch-read`, {
      alertIds
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to mark alerts as read:', error);
    throw error;
  }
};

// 获取监控统计
export const getMonitoringStats = async (): Promise<MonitoringStats> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/monitoring/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch monitoring stats:', error);
    // 返回模拟数据作为后备
    return {
      totalRules: 15,
      activeRules: 12,
      triggeredToday: 3,
      unreadAlerts: 5
    };
  }
};

// 检查监控规则（手动触发）
export const checkMonitoringRules = async (): Promise<{ triggeredRules: number; newAlerts: number }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/monitoring/check`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to check monitoring rules:', error);
    return { triggeredRules: 0, newAlerts: 0 };
  }
};

// 生成模拟监控规则（作为后备）
const generateMockRules = (assetIds: string[]): MonitoringRule[] => {
  const types: MonitoringRule['type'][] = ['price', 'volume', 'volatility', 'pe', 'marketcap'];
  const conditions: MonitoringRule['condition'][] = ['above', 'below', 'change_above', 'change_below'];
  
  return assetIds.slice(0, 10).map((assetId, index) => ({
    id: `rule_${index + 1}`,
    assetId,
    type: types[index % types.length],
    condition: conditions[index % conditions.length],
    threshold: Math.random() * 100 + 10,
    isActive: Math.random() > 0.2,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    triggeredCount: Math.floor(Math.random() * 10)
  }));
};

// 生成模拟告警（作为后备）
const generateMockAlerts = (): Alert[] => {
  const types: Alert['type'][] = ['warning', 'danger', 'info'];
  const severities: Alert['severity'][] = ['low', 'medium', 'high', 'critical'];
  
  return Array.from({ length: 8 }, (_, index) => ({
    id: `alert_${index + 1}`,
    assetId: `asset_${index + 1}`,
    ruleId: `rule_${index + 1}`,
    type: types[index % types.length],
    title: `资产告警 #${index + 1}`,
    message: `检测到异常价格变动，当前价格 $${(Math.random() * 100 + 50).toFixed(2)}`,
    value: Math.random() * 100 + 50,
    threshold: Math.random() * 100 + 10,
    createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    isRead: Math.random() > 0.4,
    severity: severities[index % severities.length]
  }));
};