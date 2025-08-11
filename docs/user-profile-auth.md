# 用户信息授权功能实现

## 功能概述

根据[微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html)，实现了用户头像和昵称的授权获取功能。

## 实现特性

### 1. 兼容性处理
- ✅ 支持 `wx.getUserProfile` (推荐，基础库 2.10.4+)
- ✅ 兼容 `wx.getUserInfo` (旧版本)
- ✅ 自动检测API可用性

### 2. 用户体验
- ✅ 优雅的授权界面设计
- ✅ 加载状态提示
- ✅ 授权成功/失败反馈
- ✅ 本地存储用户信息

### 3. 数据管理
- ✅ 本地存储用户信息
- ✅ 服务器同步用户信息
- ✅ 清除用户信息功能

## 技术实现

### 核心API

#### wx.getUserProfile (推荐)
```javascript
wx.getUserProfile({
  desc: '用于完善会员资料', // 授权说明
  lang: 'zh_CN', // 语言设置
  success: (res) => {
    // res.userInfo 包含用户信息
    // res.rawData 原始数据
    // res.signature 签名
    // res.encryptedData 加密数据
    // res.iv 初始向量
    // res.cloudID 云ID
  }
});
```

#### wx.getUserInfo (兼容)
```javascript
// 通过 button 组件的 open-type="getUserInfo"
<button open-type="getUserInfo" bindgetuserinfo="getUserInfo">
  获取头像昵称
</button>
```

### 用户信息结构
```javascript
{
  nickName: "用户昵称",
  avatarUrl: "头像URL",
  gender: 1, // 性别 0：未知、1：男、2：女
  country: "国家",
  province: "省份", 
  city: "城市",
  language: "语言"
}
```

## 文件修改

### 1. pages/profile/index.js
- 实现用户信息获取逻辑
- 添加本地存储管理
- 集成服务器同步功能

### 2. pages/profile/index.wxml
- 添加授权按钮
- 实现用户信息显示
- 添加状态提示

### 3. pages/profile/index.wxss
- 美化授权界面
- 添加加载状态样式
- 优化用户体验

### 4. utils/api.js
- 添加 `updateUserProfile` 接口
- 支持用户信息同步到服务器

## 使用流程

### 1. 首次使用
1. 用户进入个人资料页面
2. 显示默认头像和"未登录用户"
3. 点击"获取头像昵称"按钮
4. 弹出微信授权弹窗
5. 用户确认授权
6. 获取并显示用户信息

### 2. 已授权用户
1. 自动加载本地存储的用户信息
2. 显示用户头像和昵称
3. 显示"已授权"状态
4. 可选择清除用户信息

### 3. 服务器同步
1. 授权成功后自动调用服务器API
2. 将用户信息同步到后端
3. 处理同步成功/失败状态

## 注意事项

### 1. 授权限制
- 每次调用 `wx.getUserProfile` 都会弹出授权弹窗
- 用户可能拒绝授权
- 需要处理授权失败的情况

### 2. 数据安全
- 用户信息仅包含公开信息
- 不包含 openId 和 unionId
- 建议在服务器端验证数据完整性

### 3. 兼容性
- 基础库 2.10.4 以下版本使用 `wx.getUserInfo`
- 开发者工具中可能返回真实数据
- 真机上按照新规则返回数据

### 4. 存储管理
- 用户信息存储在本地 Storage
- 支持手动清除用户信息
- 服务器同步失败不影响本地使用

## 错误处理

### 常见错误
1. **授权被拒绝**: 显示友好提示，允许重新授权
2. **网络错误**: 本地存储成功，服务器同步失败
3. **API不可用**: 自动降级到兼容方案

### 调试建议
1. 在开发者工具中测试授权流程
2. 检查网络连接和服务器状态
3. 验证API接口返回格式
4. 测试不同基础库版本的兼容性

## 扩展功能

### 1. 用户信息编辑
- 允许用户修改昵称
- 支持自定义头像上传
- 添加更多个人信息字段

### 2. 权限管理
- 区分不同功能的使用权限
- 实现分级授权机制
- 添加权限状态检查

### 3. 数据同步
- 实现多端数据同步
- 添加数据冲突处理
- 支持离线数据缓存

## 相关链接

- [微信小程序用户头像昵称获取规则调整公告](https://developers.weixin.qq.com/community/develop/doc/00022c683e8a80b29bed2142b56c01)
- [用户信息接口调整说明](https://developers.weixin.qq.com/community/develop/doc/000cacfa20ce88df04cb468bc52801)
- [用户数据的签名验证和加解密](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html) 