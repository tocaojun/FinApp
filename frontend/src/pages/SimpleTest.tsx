import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const SimpleTest: React.FC = () => {
  const { state, login, logout } = useAuth();

  const handleLogin = async (role: 'admin' | 'user') => {
    try {
      if (role === 'admin') {
        await login({ username: 'admin', password: 'admin123' });
      } else {
        await login({ username: 'user', password: 'user123' });
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔐 权限控制系统测试</h1>
      
      {state.user ? (
        <div>
          <h2>✅ 登录成功！</h2>
          <p><strong>用户名:</strong> {state.user.username}</p>
          <p><strong>角色:</strong> {state.user.role}</p>
          <p><strong>权限数量:</strong> {state.user.permissions?.length || 0}</p>
          
          <h3>权限列表:</h3>
          <ul>
            {state.user.permissions?.map(permission => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
          
          <button 
            onClick={logout}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#ff4d4f', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        </div>
      ) : (
        <div>
          <h2>请选择测试账户登录:</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>管理员账户</h3>
            <p>用户名: admin | 密码: admin123</p>
            <button 
              onClick={() => handleLogin('admin')}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#1890ff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              登录为管理员
            </button>
          </div>
          
          <div>
            <h3>普通用户账户</h3>
            <p>用户名: user | 密码: user123</p>
            <button 
              onClick={() => handleLogin('user')}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#52c41a', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              登录为普通用户
            </button>
          </div>
        </div>
      )}
      
      <hr style={{ margin: '30px 0' }} />
      
      <h2>🎯 8.2 权限控制系统功能</h2>
      <ul>
        <li>✅ RBAC 基于角色的访问控制</li>
        <li>✅ JWT 令牌认证机制</li>
        <li>✅ 18种细粒度权限类型</li>
        <li>✅ 用户管理界面 (/admin/users)</li>
        <li>✅ 角色管理界面 (/admin/roles)</li>
        <li>✅ 权限矩阵界面 (/admin/permissions)</li>
        <li>✅ 系统日志界面 (/admin/logs)</li>
        <li>✅ 权限守卫组件保护</li>
        <li>✅ 动态菜单显示</li>
      </ul>
    </div>
  );
};

export default SimpleTest;