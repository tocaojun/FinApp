// 调试登录流程的脚本
console.log('=== 开始调试登录流程 ===');

// 1. 测试后端登录API
async function testBackendLogin() {
  console.log('\n1. 测试后端登录API...');
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testapi@finapp.com',
        password: 'testapi123'
      })
    });
    
    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('响应数据:', data);
    
    if (response.ok && data.success) {
      console.log('✅ 后端登录API正常');
      return data;
    } else {
      console.log('❌ 后端登录API失败');
      return null;
    }
  } catch (error) {
    console.error('❌ 后端登录API错误:', error);
    return null;
  }
}

// 2. 测试前端AuthService
async function testAuthService() {
  console.log('\n2. 测试前端AuthService...');
  
  try {
    // 动态导入AuthService
    const { AuthService } = await import('./src/services/authService.ts');
    
    const response = await AuthService.login({
      email: 'testapi@finapp.com',
      password: 'testapi123'
    });
    
    console.log('AuthService响应:', response);
    console.log('✅ AuthService正常');
    return response;
  } catch (error) {
    console.error('❌ AuthService错误:', error);
    return null;
  }
}

// 3. 检查localStorage
function checkLocalStorage() {
  console.log('\n3. 检查localStorage...');
  
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('auth_user');
  
  console.log('存储的token:', token);
  console.log('存储的用户:', user);
  
  if (token && user) {
    console.log('✅ localStorage有数据');
    try {
      const userObj = JSON.parse(user);
      console.log('解析的用户对象:', userObj);
    } catch (e) {
      console.error('❌ 用户数据解析失败:', e);
    }
  } else {
    console.log('❌ localStorage无数据');
  }
}

// 4. 测试完整登录流程
async function testFullLoginFlow() {
  console.log('\n4. 测试完整登录流程...');
  
  // 清除现有数据
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  
  try {
    // 模拟前端登录
    const { AuthService } = await import('./src/services/authService.ts');
    
    console.log('开始登录...');
    const response = await AuthService.login({
      email: 'testapi@finapp.com',
      password: 'testapi123'
    });
    
    console.log('登录响应:', response);
    
    // 检查响应结构
    if (response && response.success) {
      console.log('✅ 登录成功');
      
      // 检查token结构
      if (response.tokens && response.tokens.accessToken) {
        console.log('✅ Token结构正确');
        
        // 手动保存到localStorage
        localStorage.setItem('auth_token', response.tokens.accessToken);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        
        console.log('✅ 数据已保存到localStorage');
        checkLocalStorage();
      } else {
        console.log('❌ Token结构错误:', response.tokens);
      }
    } else {
      console.log('❌ 登录失败:', response);
    }
  } catch (error) {
    console.error('❌ 完整流程错误:', error);
  }
}

// 执行所有测试
async function runAllTests() {
  await testBackendLogin();
  await testAuthService();
  checkLocalStorage();
  await testFullLoginFlow();
  
  console.log('\n=== 调试完成 ===');
}

// 在浏览器控制台中运行
if (typeof window !== 'undefined') {
  window.debugLogin = runAllTests;
  console.log('请在浏览器控制台中运行: debugLogin()');
}

export { runAllTests };