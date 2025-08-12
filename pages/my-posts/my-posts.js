// pages/my-posts/my-posts.js
const { getMyPosts, deletePost } = require('../../utils/api.js');

Page({
  data: {
    posts: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    total: 0,
    hasUserInfo: false
  },

  onLoad() {
    this.checkUserAuth();
  },

  onShow() {
    // 每次显示页面时检查用户认证并刷新数据
    this.checkUserAuth();
  },

  /**
   * 检查用户认证状态
   */
  checkUserAuth() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.nickName) {
        this.setData({
          hasUserInfo: true
        });
        this.loadPosts();
      } else {
        this.setData({
          hasUserInfo: false
        });
        this.showAuthModal();
      }
    } catch (error) {
      console.error('检查用户认证失败:', error);
      this.showAuthModal();
    }
  },

  /**
   * 显示认证弹窗
   */
  showAuthModal() {
    wx.showModal({
      title: '需要登录',
      content: '查看我的帖子需要先登录账号',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/profile/profile'
          });
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.refreshPosts();
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMorePosts();
    }
  },

  /**
   * 刷新帖子列表
   */
  async refreshPosts() {
    this.setData({
      posts: [],
      page: 1,
      hasMore: true
    });
    await this.loadPosts();
    wx.stopPullDownRefresh();
  },

  /**
   * 加载帖子列表
   */
  async loadPosts() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const result = await getMyPosts({
        page: this.data.page,
        pageSize: this.data.pageSize
      });

      console.log('获取我的帖子成功:', result);

      if (result.code === 200) {
        const { data: responseData } = result;
        const { list, pagination } = responseData;
        
        // 格式化时间并映射字段
        const formattedPosts = list.map(post => ({
          id: post.id,
          title: post.title,
          content: post.excerpt || post.content, // 使用excerpt作为内容显示
          images: post.images || [],
          status: 'published', // 默认状态
          viewCount: post.stats?.views || 0,
          likeCount: post.stats?.likes || 0,
          commentCount: post.stats?.comments || 0,
          createdAt: this.formatTime(post.createdAt),
          category: post.category,
          categoryName: post.categoryName,
          author: post.author
        }));

        this.setData({
          posts: this.data.page === 1 ? formattedPosts : [...this.data.posts, ...formattedPosts],
          total: pagination.total,
          hasMore: pagination.hasMore
        });
      } else if (result.code === 401) {
        // 401错误已在API层处理，这里只显示提示
        wx.showToast({
          title: '请先完善用户信息',
          icon: 'none'
        });
      } else {
        wx.showToast({
          title: result.message || '获取失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('获取我的帖子失败:', error);
      console.log('错误详情:', {
        message: error.message,
        statusCode: error.statusCode,
        originalError: error.originalError
      });
      
      // 如果是401错误，不显示错误提示，因为已经在API层处理了跳转
      if (error.statusCode !== 401) {
        wx.showToast({
          title: '获取失败，请重试',
          icon: 'none'
        });
      } else {
        console.log('401错误已在API层处理，跳过页面错误提示');
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载更多帖子
   */
  async loadMorePosts() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({
      page: this.data.page + 1
    });

    await this.loadPosts();
  },

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    
    // 小于1小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    
    // 小于24小时
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    
    // 小于30天
    if (diff < 2592000000) {
      return `${Math.floor(diff / 86400000)}天前`;
    }
    
    // 超过30天显示具体日期
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (year === now.getFullYear()) {
      return `${month}-${day}`;
    } else {
      return `${year}-${month}-${day}`;
    }
  },

  /**
   * 点击帖子
   */
  onPostTap(e) {
    const post = e.currentTarget.dataset.post;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${post.id}`
    });
  },

  /**
   * 编辑帖子
   */
  onEditPost(e) {
    e.stopPropagation();
    const postId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/post/post?id=${postId}&mode=edit`
    });
  },

  /**
   * 删除帖子
   */
  onDeletePost(e) {
    e.stopPropagation();
    const postId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条帖子吗？删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.deletePost(postId);
        }
      }
    });
  },

  /**
   * 执行删除帖子
   */
  async deletePost(postId) {
    try {
      const result = await deletePost(postId);
      
      if (result.code === 200) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        // 刷新列表
        this.refreshPosts();
      } else {
        wx.showToast({
          title: result.message || '删除失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 点击图片
   */
  onImageTap(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: [url],
      current: url
    });
  },

  /**
   * 创建新帖子
   */
  onCreatePost() {
    wx.navigateTo({
      url: '/pages/post/post'
    });
  },

  /**
   * 去登录
   */
  onGoToLogin() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  },

  /**
   * 测试401错误
   */
  onTest401() {
    console.log('测试401错误');
    
    // 直接调用API服务来测试401错误处理
    const { apiService } = require('../../utils/api.js');
    
    apiService.call({
      path: '/api/posts/my?page=1&pageSize=10',
      method: 'GET'
    }).then(result => {
      console.log('API调用成功:', result);
    }).catch(error => {
      console.log('API调用失败:', error);
      console.log('错误状态码:', error.statusCode);
    });
  },

  /**
   * 加载更多
   */
  onLoadMore() {
    this.loadMorePosts();
  }
});
