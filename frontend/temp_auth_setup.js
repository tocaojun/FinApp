// 临时认证设置 - 仅用于开发测试
// 在浏览器控制台中运行此脚本来设置测试用户认证

// 真实测试用户信息 (testapi)
const testUser = {
  id: '6a8993b4-a12f-43f2-86e7-a47de82e943d',
  email: 'testapi@finapp.com',
  username: 'testapi',
  roles: ['user'],
  permissions: ['portfolios:read', 'portfolios:write', 'transactions:read', 'transactions:write']
};

// 为 testapi 用户生成的有效JWT token (24小时有效期)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTg5OTNiNC1hMTJmLTQzZjItODZlNy1hNDdkZTgyZTk0M2QiLCJlbWFpbCI6InRlc3RhcGlAZmluYXBwLmNvbSIsImlhdCI6MTc2MDg0OTA0NSwiZXhwIjoxNzYwOTM1NDQ1fQ.YTWDjRLJhKZgr8b_iIGYSJC__td5k5Eln7mt-UfbYEg';

// 设置本地存储
localStorage.setItem('auth_token', testToken);
localStorage.setItem('auth_user', JSON.stringify(testUser));

console.log('✅ 测试用户认证已设置！');
console.log('用户信息:', testUser);
console.log('请刷新页面以应用认证状态');

// 验证设置
console.log('当前token:', localStorage.getItem('auth_token'));
console.log('当前用户:', JSON.parse(localStorage.getItem('auth_user') || '{}'));