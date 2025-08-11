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
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
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
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ commentsLoading: false });
    }
  },

  // 点赞
  async onLike() {
    const { post } = this.data;
    
    try {
      const result = await likePost(post.id);
      
      if (result.code === 200) {
        const isLiked = !post.isLiked;
        const likes = isLiked ? post.stats.likes + 1 : post.stats.likes - 1;
        
        this.setData({
          post: {
            ...post,
            isLiked,
            stats: {
              ...post.stats,
              likes
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
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
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
    const { commentText, comments, postId } = this.data;
    
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
        // 格式化时间
        const newComment = {
          ...result.data,
          createdAt: this.formatTime(result.data.createdAt)
        };

        this.setData({
          comments: [newComment, ...comments],
          commentText: '',
          commentFocus: false
        });

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
    return {
      title: this.data.post.title,
      path: `/pages/detail/detail?id=${this.data.postId}`,
      imageUrl: this.data.post.images?.[0] || '/assets/share-default.jpg'
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