// pages/detail/detail.js
const { getPostDetail, getPostComments, addComment, likePost } = require('../../utils/api.js');

Page({
  data: {
    postId: null,
    post: {},
    comments: [],
    commentText: '',
    commentFocus: false,
    loading: false,
    commentsLoading: false
  },

  onLoad(options) {
    const postId = options.id;
    this.setData({ postId });
    this.loadPostDetail(postId);
    this.loadComments(postId);
  },

  // 下拉刷新
  async onPullDownRefresh() {
    const { postId } = this.data;
    await Promise.all([
      this.loadPostDetail(postId),
      this.loadComments(postId)
    ]);
    wx.stopPullDownRefresh();
  },

  // 加载帖子详情
  async loadPostDetail(postId) {
    this.setData({ loading: true });
    
    try {
      const result = await getPostDetail(postId);
      
      if (result.code === 200) {
        // 格式化时间
        const post = {
          ...result.data,
          createdAt: this.formatTime(result.data.createdAt)
        };
        
        this.setData({ post });
      } else {
        wx.showToast({
          title: result.message || '获取帖子详情失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载帖子详情失败:', error);
      
      // 检查是否是401错误（包括错误消息中的401信息）
      if (error.statusCode === 401 || 
          error.message.includes('User not found') || 
          error.message.includes('401') ||
          (error.originalError && error.originalError.statusCode === 401)) {
        console.log('检测到401错误，跳转到注册页面');
        console.log('错误详情:', {
          statusCode: error.statusCode,
          message: error.message,
          originalError: error.originalError
        });
        
        // 延迟跳转，确保当前页面状态稳定
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/user-register/user-register?from=401',
            success: () => {
              console.log('成功跳转到注册页面');
            },
            fail: (err) => {
              console.error('跳转到注册页面失败:', err);
              // 如果redirectTo失败，尝试navigateTo
              wx.navigateTo({
                url: '/pages/user-register/user-register?from=401',
                success: () => {
                  console.log('通过navigateTo成功跳转到注册页面');
                },
                fail: (err2) => {
                  console.error('navigateTo也失败了:', err2);
                  wx.showToast({
                    title: '跳转失败，请手动前往注册',
                    icon: 'none'
                  });
                }
              });
            }
          });
        }, 100);
      } else {
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载评论
  async loadComments(postId) {
    this.setData({ commentsLoading: true });
    
    try {
      const result = await getPostComments(postId);
      
      if (result.code === 200) {
        // 格式化时间
        const comments = result.data.list.map(comment => ({
          ...comment,
          createdAt: this.formatTime(comment.createdAt)
        }));
        
        this.setData({ comments });
      } else {
        wx.showToast({
          title: result.message || '获取评论失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      
      // 检查是否是401错误（包括错误消息中的401信息）
      if (error.statusCode === 401 || 
          error.message.includes('User not found') || 
          error.message.includes('401') ||
          (error.originalError && error.originalError.statusCode === 401)) {
        console.log('检测到401错误，跳转到注册页面');
        console.log('错误详情:', {
          statusCode: error.statusCode,
          message: error.message,
          originalError: error.originalError
        });
        
        // 延迟跳转，确保当前页面状态稳定
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/user-register/user-register?from=401',
            success: () => {
              console.log('成功跳转到注册页面');
            },
            fail: (err) => {
              console.error('跳转到注册页面失败:', err);
              wx.showToast({
                title: '跳转失败，请手动前往注册',
                icon: 'none'
              });
            }
          });
        }, 100);
      } else {
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    } finally {
      this.setData({ commentsLoading: false });
    }
  },

  // 点赞
  async onLike() {
    const { post } = this.data;
    
    try {
      // 根据当前状态决定是点赞还是取消点赞
      const action = post.isLiked ? 'unlike' : 'like';
      const result = await likePost(post.id, action);
      
      if (result.code === 200) {
        // 使用服务器返回的数据更新UI
        // 注意：API可能返回不同的数据结构，需要适配
        const isLiked = result.data && result.data.isLiked !== undefined ? result.data.isLiked : !post.isLiked;
        const likesCount = result.data && result.data.likesCount !== undefined ? result.data.likesCount : (isLiked ? post.stats.likes + 1 : post.stats.likes - 1);
        
        this.setData({
          post: {
            ...post,
            isLiked: isLiked,
            stats: {
              ...post.stats,
              likes: likesCount
            }
          }
        });

        wx.showToast({
          title: isLiked ? '点赞成功' : '取消点赞',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: result.message || '操作失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('点赞失败:', error);
      
      // 检查是否是401错误（包括错误消息中的401信息）
      if (error.statusCode === 401 || 
          error.message.includes('User not found') || 
          error.message.includes('401') ||
          (error.originalError && error.originalError.statusCode === 401)) {
        console.log('检测到401错误，跳转到注册页面');
        console.log('错误详情:', {
          statusCode: error.statusCode,
          message: error.message,
          originalError: error.originalError
        });
        
        // 延迟跳转，确保当前页面状态稳定
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/user-register/user-register?from=401',
            success: () => {
              console.log('成功跳转到注册页面');
            },
            fail: (err) => {
              console.error('跳转到注册页面失败:', err);
              wx.showToast({
                title: '跳转失败，请手动前往注册',
                icon: 'none'
              });
            }
          });
        }, 100);
      } else {
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    }
  },

  // 评论
  onComment() {
    this.setData({ commentFocus: true });
  },

  // 分享
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 更多操作
  onMoreActions() {
    wx.showActionSheet({
      itemList: ['举报', '不感兴趣'],
      success: (res) => {
        console.log('选择了操作:', res.tapIndex);
      }
    });
  },

  // 图片预览
  onImagePreview(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.post.images
    });
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({
      commentText: e.detail.value
    });
  },

  // 发送评论
  async onSendComment() {
    const { commentText, postId } = this.data;
    
    if (!commentText.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    try {
      const result = await addComment(postId, {
        content: commentText
      });

      if (result.code === 200) {
        // 清空输入框并隐藏键盘
        this.setData({
          commentText: '',
          commentFocus: false
        });

        // 刷新评论列表
        await this.loadComments(postId);

        wx.showToast({
          title: '评论成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: result.message || '评论失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('评论失败:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    }
  },

  // 点赞评论
  onLikeComment(e) {
    const commentId = e.currentTarget.dataset.id;
    const { comments } = this.data;
    const commentIndex = comments.findIndex(c => c.id === commentId);
    
    if (commentIndex > -1) {
      const comment = comments[commentIndex];
      comment.likes += 1;
      
      this.setData({
        comments: [...comments]
      });
    }
  },

  // 回复评论
  onReplyComment(e) {
    const commentId = e.currentTarget.dataset.id;
    this.setData({ commentFocus: true });
    // 这里可以添加回复逻辑
  },

  // 分享到微信
  onShareAppMessage() {
    const { post, postId } = this.data;
    
    const promise = new Promise(resolve => {
      setTimeout(() => {
        resolve({
          title: post.title || post.content?.substring(0, 50) || '精彩内容分享',
          path: `/pages/detail/detail?id=${postId}`,
          imageUrl: post.images?.[0] || '/assets/share-default.jpg'
        });
      }, 1000);
    });
    
    return {
      title: post.title || post.content?.substring(0, 50) || '精彩内容分享',
      path: `/pages/detail/detail?id=${postId}`,
      imageUrl: post.images?.[0] || '/assets/share-default.jpg',
      promise
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { post, postId } = this.data;
    
    return {
      title: post.title || post.content?.substring(0, 50) || '精彩内容分享',
      path: `/pages/detail/detail?id=${postId}`,
      imageUrl: post.images?.[0] || '/assets/share-default.jpg'
    };
  },

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString();
    }
  }
}); 