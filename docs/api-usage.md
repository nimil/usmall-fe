# 微信云托管API调用示例

本文档介绍如何在微信小程序中调用云托管服务中的用户管理API。

## 前置条件

1. 已开通微信云托管服务
2. 已部署用户管理API服务
3. 已配置云环境ID和服务名称

## 配置说明

### 1. 修改API配置

在 `utils/api.js` 文件中，需要修改以下配置：

```javascript
class ApiService {
  constructor() {
    this.env = 'prod-2gbua7ije33985ed'; // 替换为您的云环境ID
    this.service = 'golang-xhpp'; // 替换为您的服务名称
  }
  // ...
}
```

### 2. 获取云环境ID

1. 登录微信云托管控制台
2. 在环境管理页面查看环境ID
3. 将环境ID填入 `this.env` 字段

### 3. 获取服务名称

1. 在云托管控制台的服务管理页面
2. 查看已部署的服务名称
3. 将服务名称填入 `this.service` 字段

## API调用示例

### 创建用户 (POST /api/test/user)

```javascript
// 引入API服务
const { apiService } = require('../../utils/api.js');

// 创建用户
async function createUser() {
  try {
    const userData = {
      username: 'testuser',
      password: '123456'
    };
    
    const result = await apiService.createUser(userData);
    
    if (result.code === 0) {
      console.log('创建成功:', result.data);
      wx.showToast({
        title: '创建成功',
        icon: 'success'
      });
    } else {
      console.error('创建失败:', result.errorMsg);
      wx.showToast({
        title: result.errorMsg,
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('网络错误:', error);
    wx.showToast({
      title: '网络错误',
      icon: 'none'
    });
  }
}
```

### 分页查询用户列表 (GET /api/test/user)

```javascript
// 查询第1页，每页10条
async function getUserList() {
  try {
    const params = {
      page: 1,
      pageSize: 10
    };
    
    const result = await apiService.getUserList(params);
    
    if (result.code === 0) {
      const { users, total, page, pageSize, pages } = result.data;
      console.log('用户列表:', users);
      console.log('总数:', total);
      console.log('当前页:', page);
      console.log('总页数:', pages);
    } else {
      console.error('查询失败:', result.errorMsg);
    }
  } catch (error) {
    console.error('网络错误:', error);
  }
}

// 查询第2页，每页20条
async function getSecondPage() {
  try {
    const result = await apiService.getUserList({
      page: 2,
      pageSize: 20
    });
    
    if (result.code === 0) {
      console.log('第2页用户:', result.data.users);
    }
  } catch (error) {
    console.error('查询失败:', error);
  }
}
```

## 完整页面示例

### 用户管理页面

在 `pages/user/user.js` 中已经实现了完整的用户管理功能：

1. **创建用户表单** - 输入用户名和密码创建新用户
2. **用户列表展示** - 分页显示所有用户
3. **分页控制** - 上一页/下一页按钮
4. **刷新功能** - 下拉刷新用户列表
5. **错误处理** - 完善的错误提示

### 页面功能

- ✅ 表单验证
- ✅ 加载状态显示
- ✅ 错误信息提示
- ✅ 分页导航
- ✅ 下拉刷新
- ✅ 用户详情查看

## 错误处理

### 常见错误码

- `code: 0` - 成功
- `code: -1` - 失败，具体错误信息在 `errorMsg` 字段

### 错误处理示例

```javascript
try {
  const result = await apiService.createUser(userData);
  
  if (result.code === 0) {
    // 成功处理
    wx.showToast({
      title: '操作成功',
      icon: 'success'
    });
  } else {
    // 业务错误
    wx.showToast({
      title: result.errorMsg,
      icon: 'none'
    });
  }
} catch (error) {
  // 网络错误
  console.error('API调用失败:', error);
  wx.showToast({
    title: '网络错误，请重试',
    icon: 'none'
  });
}
```

## 调试技巧

### 1. 开启调试日志

在 `utils/api.js` 中已经添加了详细的日志输出：

```javascript
console.log(`微信云托管调用结果: ${result.errMsg} | callid: ${result.callID}`);
```

### 2. 查看网络请求

在微信开发者工具的网络面板中查看请求详情：
- 请求URL
- 请求方法
- 请求参数
- 响应数据

### 3. 常见问题排查

1. **环境ID错误** - 检查云环境ID是否正确
2. **服务名称错误** - 检查服务名称是否正确
3. **网络超时** - 检查网络连接和超时设置
4. **权限问题** - 检查云托管服务权限配置

## 扩展功能

### 1. 添加更多API

可以在 `ApiService` 类中添加更多方法：

```javascript
// 更新用户
async updateUser(userId, userData) {
  return this.call({
    path: `/api/test/user/${userId}`,
    method: 'PUT',
    data: userData
  });
}

// 删除用户
async deleteUser(userId) {
  return this.call({
    path: `/api/test/user/${userId}`,
    method: 'DELETE'
  });
}
```

### 2. 请求拦截器

可以添加请求拦截器进行统一处理：

```javascript
async call(options) {
  // 添加请求头
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.getToken()}`,
    ...options.header
  };
  
  // 添加请求参数
  const data = {
    timestamp: Date.now(),
    ...options.data
  };
  
  return wx.cloud.callContainer({
    config: {
      env: this.env,
      service: this.service
    },
    path: options.path,
    method: options.method || 'GET',
    data: data,
    header: headers,
    timeout: options.timeout || 10000
  });
}
```

## 注意事项

1. **安全性** - 生产环境中密码应该加密传输
2. **性能** - 合理设置分页大小，避免一次性加载过多数据
3. **用户体验** - 添加加载状态和错误提示
4. **错误处理** - 完善的错误处理机制
5. **日志记录** - 记录关键操作日志便于调试 