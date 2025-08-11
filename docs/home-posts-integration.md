# 首页帖子列表集成说明

## 功能概述

首页已成功集成了后端API的帖子列表功能，支持以下特性：

### 核心功能
- ✅ 帖子列表展示
- ✅ 下拉刷新
- ✅ 上拉加载更多
- ✅ 分页加载
- ✅ 时间格式化显示

### 帖子卡片信息
- 作者头像、昵称、等级、认证状态
- 帖子标题、摘要、图片、标签
- 点赞、评论、浏览、分享统计数据
- 发布时间

### 交互功能
- 点击帖子跳转到详情页
- 点击图片预览大图
- 点赞、评论、分享按钮（待实现具体API）
- 下拉刷新重新加载数据
- 上拉加载更多数据

## API接口

### 获取热门推荐
```
GET /api/posts?page=1&pageSize=10&category=all&sort=hot
```

### 响应数据结构
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "post_001",
        "title": "帖子标题",
        "excerpt": "帖子摘要",
        "author": {
          "id": "user_001",
          "nickname": "作者昵称",
          "avatar": "头像URL",
          "level": 5,
          "isVerified": true
        },
        "tags": ["标签1", "标签2"],
        "images": ["图片URL1", "图片URL2"],
        "stats": {
          "likes": 128,
          "comments": 32,
          "views": 1024,
          "shares": 15
        },
        "isLiked": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pageSize": 10,
      "total": 156,
      "hasMore": true
    }
  }
}
```

## 文件修改说明

### 1. pages/home/index.js
- 更新了数据加载逻辑
- 添加了事件处理函数
- 添加了时间格式化功能

### 2. pages/home/index.wxml
- 重新设计了帖子列表模板
- 添加了完整的帖子卡片结构
- 使用emoji图标替代图片图标

### 3. pages/home/index.wxss
- 设计了现代化的帖子卡片样式
- 添加了响应式布局
- 优化了用户体验

### 4. pages/home/index.json
- 启用了下拉刷新功能
- 设置了上拉加载距离

### 5. utils/api.js
- 更新了API调用配置
- 添加了`getCommunityPosts`方法
- 使用统一的ApiService调用方式

### 6. pages/community/community.js
- 移除了mock数据
- 使用实际API调用
- 添加了分类筛选功能
- 支持下拉刷新和上拉加载

### 7. pages/community/community.wxml
- 更新了帖子卡片结构
- 适配新的数据结构
- 添加了完整的交互功能

### 8. pages/community/community.wxss
- 统一了与首页的样式设计
- 优化了用户体验
- 添加了加载状态样式

## 测试说明

当前已连接到实际的微信云托管API，使用项目中统一的ApiService类进行调用。

### API调用方式
- 使用 `wx.cloud.callContainer` 调用微信云托管服务
- 通过 `ApiService.call()` 方法统一处理请求
- 自动使用配置文件中的环境ID和服务名称

## 后续优化建议

1. **图标资源**：替换emoji为专业图标
2. **API集成**：连接真实的后端API
3. **功能完善**：实现点赞、评论、分享的具体功能
4. **性能优化**：添加图片懒加载、虚拟滚动等
5. **用户体验**：添加加载动画、错误处理等

## 使用说明

1. 确保后端API服务正常运行
2. 在`utils/config.js`中配置正确的云环境ID和服务名称
3. 确保微信云托管服务已部署并正常运行
4. 测试各项功能是否正常工作

### 配置要求
- `CLOUD_ENV_ID`: 微信云托管环境ID
- `CLOUD_SERVICE_NAME`: 云托管服务名称
- 后端API路径: `/api/posts` 