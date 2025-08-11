// pages/profile/profile.js
const { updateUserProfile } = require('../../utils/api.js');

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    loading: false,
    stats: {
      posts: 0,
      likes: 0,
      followers: 0,
      following: 0
    }
  },

  onLoad() {
    // 检查是否支持 getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 尝试从本地存储获取用户信息
    this.loadUserInfo();
  },

  onShow() {
    // 每次显示页面时刷新用户信息
    this.loadUserInfo();
  },

  /**
   * 从本地存储加载用户信息
   */
  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.nickName) {
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  /**
   * 获取用户信息 - 推荐使用的新接口
   */
  getUserProfile() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      lang: 'zh_CN', // 显示用户信息的语言
      success: (res) => {
        console.log('获取用户信息成功:', res);
        
        const userInfo = res.userInfo;
        
        // 保存到本地存储
        try {
          wx.setStorageSync('userInfo', userInfo);
        } catch (error) {
          console.error('保存用户信息失败:', error);
        }
        
        // 更新页面数据
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true,
          loading: false
        });
        
        // 可以在这里调用后端API更新用户信息
        this.updateUserInfoToServer(userInfo);
        
        wx.showToast({
          title: '授权成功',
          icon: 'success'
        });
      },
      fail: (error) => {
        console.error('获取用户信息失败:', error);
        this.setData({ loading: false });
        
        wx.showToast({
          title: '授权失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 获取用户信息 - 兼容旧版本（不推荐使用）
   */
  getUserInfo(e) {
    if (e.detail.userInfo) {
      const userInfo = e.detail.userInfo;
      
      // 保存到本地存储
      try {
        wx.setStorageSync('userInfo', userInfo);
      } catch (error) {
        console.error('保存用户信息失败:', error);
      }
      
      // 更新页面数据
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
      
      // 可以在这里调用后端API更新用户信息
      this.updateUserInfoToServer(userInfo);
      
      wx.showToast({
        title: '授权成功',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '授权失败',
        icon: 'none'
      });
    }
  },

  /**
   * 更新用户信息到服务器
   */
  async updateUserInfoToServer(userInfo) {
    try {
      const result = await updateUserProfile(userInfo);
      console.log('用户信息已更新到服务器:', result);
      
      if (result.code === 200) {
        wx.showToast({
          title: '信息已同步',
          icon: 'success'
        });
      } else {
        console.warn('服务器更新失败:', result.message);
      }
    } catch (error) {
      console.error('更新用户信息到服务器失败:', error);
      // 不显示错误提示，因为本地存储已经成功
    }
  },

  /**
   * 清除用户信息
   */
  clearUserInfo() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除用户信息吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('userInfo');
          } catch (error) {
            console.error('清除用户信息失败:', error);
          }
          
          this.setData({
            userInfo: {},
            hasUserInfo: false
          });
          
          wx.showToast({
            title: '已清除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 登录 - 兼容旧接口
  onLogin() {
    this.getUserProfile();
  },

  // 编辑资料
  onEditProfile() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile'
    });
  },

  // 我的帖子
  onMyPosts() {
    wx.navigateTo({
      url: '/pages/my-posts/my-posts'
    });
  },

  // 我的点赞
  onMyLikes() {
    wx.navigateTo({
      url: '/pages/my-likes/my-likes'
    });
  },

  // 我的评论
  onMyComments() {
    wx.navigateTo({
      url: '/pages/my-comments/my-comments'
    });
  },

  // 设置
  onSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 意见反馈
  onFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 关于我们
  onAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  }
}); 