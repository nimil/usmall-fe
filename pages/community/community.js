// pages/community/community.js
const { getCommunityPosts, getHotTopics } = require('../../utils/api.js');

Page({
  data: {
    currentTab: 0,
    categories: [
      { id: 0, name: '全部', value: 'all', icon: '🏠', code: 'all' }
    ],
    posts: [],
    currentPosts: [],
    loading: false,
    topicsLoading: false,
    hasMore: true,
    currentPage: 1
  },

  onLoad() {
    this.loadHotTopics();
    this.loadCommunityPosts();
  },

  /**
   * 加载热门话题
   */
  async loadHotTopics() {
    this.setData({ topicsLoading: true });
    
    try {
      const result = await getHotTopics();
      
      if (result.code === 200) {
        // 添加"全部"选项到话题列表开头
        const allTopic = { id: 0, name: '全部', value: 'all', icon: '🏠', code: 'all' };
        const topics = [allTopic, ...result.data];
        
        this.setData({
          categories: topics
        });
      } else {
        wx.showToast({
          title: result.message || '获取话题失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载热门话题失败:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ topicsLoading: false });
    }
  },

  /**
   * 加载社区帖子
   */
  async loadCommunityPosts(refresh = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const page = refresh ? 1 : this.data.currentPage;
      const category = this.data.categories[this.data.currentTab].value;
      
      const result = await getCommunityPosts({
        page: page,
        pageSize: 10,
        category: category,
        sort: 'latest'
      });
      
      if (result.code === 200) {
        // 格式化时间
        const formattedPosts = result.data.list.map(post => ({
          ...post,
          createdAt: this.formatTime(post.createdAt)
        }));
        
        const newPosts = refresh ? formattedPosts : [...this.data.posts, ...formattedPosts];
        
        this.setData({
          posts: newPosts,
          currentPosts: newPosts,
          currentPage: page + 1,
          hasMore: result.data.pagination.hasMore,
          loading: false
        });
      } else {
        wx.showToast({
          title: result.message || '获取数据失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载社区帖子失败:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 切换分类标签
  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentTab: index,
      posts: [],
      currentPage: 1,
      hasMore: true
    });
    this.loadCommunityPosts(true);
  },

  /**
   * 关注/取消关注话题
   */
  onFollowTopic(e) {
    const index = e.currentTarget.dataset.index;
    const { categories } = this.data;
    const topic = categories[index];
    
    // TODO: 调用关注/取消关注API
    console.log('关注话题:', topic.name, topic.isFollowed ? '取消关注' : '关注');
  },

  // 点击帖子
  onPostTap(e) {
    const post = e.currentTarget.dataset.post;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${post.id}`
    });
  },

  /**
   * 点击点赞
   */
  onLikeTap(e) {
    const post = e.currentTarget.dataset.post;
    // TODO: 调用点赞API
    console.log('点赞帖子:', post.id);
  },

  /**
   * 点击评论
   */
  onCommentTap(e) {
    const post = e.currentTarget.dataset.post;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${post.id}&tab=comments`
    });
  },

  /**
   * 点击分享
   */
  onShareTap(e) {
    const post = e.currentTarget.dataset.post;
    // TODO: 实现分享功能
    console.log('分享帖子:', post.id);
  },

  /**
   * 点击图片
   */
  onImageTap(e) {
    const { images, current } = e.currentTarget.dataset;
    wx.previewImage({
      current: current,
      urls: images
    });
  },

  // 发布新帖子
  onPostCreate() {
    wx.navigateTo({
      url: '/pages/post/post'
    });
  },

  // 加载更多
  onLoadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadCommunityPosts();
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadCommunityPosts(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadCommunityPosts();
    }
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