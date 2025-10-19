// 在浏览器控制台中运行此脚本来更新认证信息

// 新的 JWT token（24小时有效）
const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTg5OTNiNC1hMTJmLTQzZjItODZlNy1hNDdkZTgyZTk0M2QiLCJlbWFpbCI6InRlc3RhcGlAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjA4NTU0NTgsImV4cCI6MTc2MDk0MTg1OH0.-xCkmMT0NR34V11pJF2NLo7BZNneNOlUjWlal6CEKTk';

// 用户信息
const userInfo = {
  id: '6a8993b4-a12f-43f2-86e7-a47de82e943d',
  email: 'testapi@example.com',
  name: 'Test API User',
  role: 'admin'
};

// 更新 localStorage
localStorage.setItem('token', newToken);
localStorage.setItem('user', JSON.stringify(userInfo));

console.log('✅ 认证信息已更新');
console.log('🔑 Token:', newToken);
console.log('👤 User:', userInfo);
console.log('📝 请刷新页面以查看更新后的投资组合列表');

// 可选：自动刷新页面
// window.location.reload();