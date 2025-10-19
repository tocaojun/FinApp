// 更新localStorage中的JWT token - 使用最新的正确token
const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTg5OTNiNC1hMTJmLTQzZjItODZlNy1hNDdkZTgyZTk0M2QiLCJlbWFpbCI6InRlc3RhcGlAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjA4NTY3OTcsImV4cCI6MTc2MDk0MzE5N30.DvXGQLP9UN9_-LMqSQ847PfBcXy5UXDo0z2Rb-kXR0M';

if (typeof window !== 'undefined' && window.localStorage) {
  localStorage.setItem('token', newToken);
  console.log('Token updated successfully');
  console.log('New token:', newToken);
  
  // 刷新页面以应用新token
  window.location.reload();
} else {
  console.log('LocalStorage not available');
}

// 也可以在浏览器控制台中直接运行这个命令：
// localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTg5OTNiNC1hMTJmLTQzZjItODZlNy1hNDdkZTgyZTk0M2QiLCJlbWFpbCI6InRlc3RhcGlAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjA4NTY3OTcsImV4cCI6MTc2MDk0MzE5N30.DvXGQLP9UN9_-LMqSQ847PfBcXy5UXDo0z2Rb-kXR0M'); window.location.reload();