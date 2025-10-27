import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// 最小化测试组件 - 不使用AuthContext
function AppMinimal() {
  console.log('AppMinimal rendering...');
  
  return (
    <Router>
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>FinApp 最小化测试</h1>
        <p>如果你能看到这个页面，说明React基础功能正常</p>
        <p>问题可能在于：</p>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
          <li>AuthContext 的初始化</li>
          <li>某个组件的数据加载</li>
          <li>API请求超时</li>
        </ul>
        <button onClick={() => window.location.href = '/debug.html'}>
          打开诊断页面
        </button>
      </div>
    </Router>
  );
}

export default AppMinimal;
