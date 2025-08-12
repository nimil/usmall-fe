# 401错误处理机制

## 概述

当微信云托管服务返回401错误时，表示用户未注册或需要完善用户信息。系统会自动引导用户到用户注册页面完善头像和昵称信息。

## 错误响应格式

当API返回401错误时，响应格式如下：

```json
{
  "statusCode": 401,
  "header": {
    "Content-Type": "text/plain; charset=utf-8",
    // ... 其他头部信息
  },
  "data": "User not found, please register first\n"
}
```

## 处理流程

### 1. 检测401错误
在 `utils/api.js` 的 `ApiService.call()` 方法中检测401状态码：

```javascript
if (result.statusCode === 401) {
  console.log('检测到401错误，需要用户注册');
  // 设置全局标记
  wx.getApp().globalData.needUserRegister = true;
  wx.getApp().globalData.lastApiCall = options;
  
  // 抛出401错误
  const error = new Error('User not found, please register first');
  error.statusCode = 401;
  throw error;
}
```

### 2. 跳转到用户注册页面
在API调用方法中捕获401错误并跳转：

```javascript
try {
  const result = await getMyPosts(params);
  return result;
} catch (error) {
  if (error.statusCode === 401) {
    wx.navigateTo({
      url: '/pages/user-register/user-register?from=401'
    });
  }
  throw error;
}
```

### 3. 用户完善信息
用户注册页面使用微信官方的头像昵称填写组件：

- **头像选择**：使用 `button` 组件的 `open-type="chooseAvatar"`
- **昵称输入**：使用 `input` 组件的 `type="nickname"`

参考文档：[头像昵称填写](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/userProfile.html)

### 4. 调用用户注册API
用户完善信息后，调用注册API：

```javascript
const result = await registerUser({
  nickname: nickname.trim(),
  avatar: avatarFileID,
  bio: bio.trim() || ''
});
```

### 5. 重试原始API调用
注册成功后，自动重试之前失败的API调用：

```javascript
// 检查是否有待执行的API调用
const app = wx.getApp();
if (app.globalData.lastApiCall) {
  // 重新执行之前的API调用
  this.retryLastApiCall();
}
```

## 用户注册API

### 请求格式
```
POST /api/auth/register
Content-Type: application/json

{
  "nickname": "用户昵称",
  "avatar": "头像URL",
  "bio": ""
}
```

### 响应格式
```json
{
  "code": 0,
  "msg": "User registered successfully",
  "data": {
    "id": 1,
    "username": "user123456",
    "nickname": "用户昵称",
    "avatar": "头像URL",
    "bio": "个人简介",
    "level": 1,
    "isVerified": false,
    "openid": "wx_openid_123",
    "unionid": "wx_unionid_123",
    "appid": "wx_appid_123",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## 全局状态管理

在 `app.js` 中添加全局状态：

```javascript
globalData: {
  userInfo: null,
  needUserRegister: false,  // 是否需要用户注册
  lastApiCall: null         // 最后一次失败的API调用
}
```

## 安全检测

根据微信官方文档，从基础库2.24.4版本起：

1. **头像安全检测**：若用户上传的图片未通过安全监测，不触发 `bindchooseavatar` 事件
2. **昵称安全检测**：在 `onBlur` 事件触发时，微信将异步对用户输入的内容进行安全监测，若未通过安全监测，微信将清空用户输入的内容

## 使用示例

### 在页面中使用
```javascript
// 调用需要认证的API
try {
  const result = await getMyPosts({ page: 1, pageSize: 10 });
  // 处理成功结果
} catch (error) {
  if (error.statusCode === 401) {
    // 401错误已在API方法中处理，这里可以添加额外逻辑
    console.log('用户需要注册');
  } else {
    // 处理其他错误
    wx.showToast({
      title: '获取失败，请重试',
      icon: 'none'
    });
  }
}
```

### 检查用户注册状态
```javascript
const app = wx.getApp();
if (app.globalData.needUserRegister) {
  // 用户需要注册
  wx.navigateTo({
    url: '/pages/user-register/user-register'
  });
}
```

## 注意事项

1. **用户体验**：401错误处理应该是无缝的，用户完成注册后自动继续之前的操作
2. **错误提示**：给用户清晰的提示，说明需要完善用户信息
3. **数据保存**：注册成功后及时保存用户信息到本地存储
4. **安全检测**：遵循微信的安全检测机制，确保用户输入的内容符合规范
5. **重试机制**：注册成功后自动重试之前失败的API调用

## 相关文件

- `utils/api.js` - API调用和401错误检测
- `pages/user-register/` - 用户注册页面
- `app.js` - 全局状态管理
- `docs/401-error-handling.md` - 本文档
