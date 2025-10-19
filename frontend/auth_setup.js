// 在浏览器控制台中运行此脚本来设置认证信息
const user = {
  id: '6a8993b4-a12f-43f2-86e7-a47de82e943d',
  email: 'testapi@finapp.com',
  username: 'testapi'
};

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTg5OTNiNC1hMTJmLTQzZjItODZlNy1hNDdkZTgyZTk0M2QiLCJlbWFpbCI6InRlc3RhcGlAZmluYXBwLmNvbSIsImlhdCI6MTc2MDg0OTIyNCwiZXhwIjoxNzYwOTM1NjI0fQ.vKkuO3n1MWXa0ZbOa_wIYyBeIn0Bhv4yumCAuMNuoHw';

localStorage.setItem('auth_token', token);
localStorage.setItem('auth_user', JSON.stringify(user));

console.log('认证信息已设置，请刷新页面');
location.reload();