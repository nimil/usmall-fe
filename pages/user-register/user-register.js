// pages/user-register/user-register.js
const { registerUser, uploadFile } = require('../../utils/api.js');

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    avatarUrl: defaultAvatarUrl,
    nickname: '',
    loading: false
  },

  onLoad(options) {
    console.log('注册页面加载，参数:', options);
    
    // 检查是否是从401错误跳转过来的
    if (options.from === '401') {
      console.log('检测到from=401参数，显示提示');
      wx.showToast({
        title: '请先完善用户信息',
        icon: 'none',
        duration: 2000
      });
    }
  },

  onShow() {
    console.log('注册页面显示');
  },

  /**
   * 选择头像
   */
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl,
    });
  },

  /**
   * 昵称输入
   */
  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },



  /**
   * 上传头像到云存储
   */
  async uploadAvatar(localPath) {
    try {
      const timestamp = Date.now();
      const cloudPath = `avatars/${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      
      const result = await uploadFile(localPath, cloudPath);
      console.log('头像上传成功:', result);
      
      return result.fileID;
    } catch (error) {
      console.error('头像上传失败:', error);
      throw error;
    }
  },

  /**
   * 提交表单
   */
  async onSubmit(e) {
    if (this.data.loading) return;

    const { avatarUrl, nickname } = this.data;

    // 验证必填字段
    if (!nickname || nickname.trim() === '') {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      // 上传头像到云存储
      let avatarFileID = avatarUrl;
      // 如果不是默认头像且不是云存储路径，则上传到云存储
      if (avatarUrl !== defaultAvatarUrl && !avatarUrl.startsWith('cloud://') && !avatarUrl.startsWith('http')) {
        avatarFileID = await this.uploadAvatar(avatarUrl);
      }

      // 调用用户注册API
      const result = await registerUser({
        nickname: nickname.trim(),
        avatar: avatarFileID,
        bio: '' // 个人简介设为空字符串
      });

      console.log('用户注册成功:', result);

      if (result.code === 0) {
        // 保存用户信息到本地存储
        const userInfo = {
          id: result.data.id,
          nickName: result.data.nickname,
          avatarUrl: result.data.avatar,
          level: result.data.level,
          isVerified: result.data.isVerified
        };

        try {
          wx.setStorageSync('userInfo', userInfo);
        } catch (error) {
          console.error('保存用户信息失败:', error);
        }

        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          try {
            // 检查是否有待执行的API调用
            const app = wx.getApp();
            if (app && app.globalData && app.globalData.lastApiCall) {
              // 重新执行之前的API调用
              this.retryLastApiCall();
            } else {
              // 跳转到首页（社区页面）
              wx.switchTab({
                url: '/pages/community/community'
              });
            }
          } catch (error) {
            console.error('获取应用实例失败:', error);
            // 直接跳转到首页（社区页面）
            wx.switchTab({
              url: '/pages/community/community'
            });
          }
        }, 1500);

      } else {
        wx.showToast({
          title: result.msg || '注册失败',
          icon: 'none'
        });
      }

    } catch (error) {
      console.error('用户注册失败:', error);
      
      let errorMessage = '注册失败，请重试';
      if (error.statusCode === 401) {
        errorMessage = '用户信息验证失败，请重新填写';
      } else if (error.message) {
        errorMessage = error.message;
      }

      wx.showToast({
        title: errorMessage,
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 重试之前的API调用
   */
  async retryLastApiCall() {
    try {
      const app = wx.getApp();
      if (!app || !app.globalData) {
        console.error('应用实例不可用');
        wx.switchTab({
          url: '/pages/community/community'
        });
        return;
      }
      
      const lastApiCall = app.globalData.lastApiCall;
      
      if (!lastApiCall) {
        // 跳转到首页（社区页面）
        wx.switchTab({
          url: '/pages/community/community'
        });
        return;
      }

      // 清除标记
      app.globalData.needUserRegister = false;
      app.globalData.lastApiCall = null;

      // 重新执行API调用
      const { apiService } = require('../../utils/api.js');
      
      try {
        const result = await apiService.call(lastApiCall);
        
        // 跳转到首页（社区页面）
        wx.switchTab({
          url: '/pages/community/community'
        });
      } catch (apiError) {
        // 如果是401错误，说明用户注册可能还没有生效，直接跳转到首页
        if (apiError.statusCode === 401) {
          wx.switchTab({
            url: '/pages/community/community'
          });
        } else {
          // 其他错误，显示提示并跳转到首页
          wx.showToast({
            title: '操作失败，请重试',
            icon: 'none'
          });
          wx.switchTab({
            url: '/pages/community/community'
          });
        }
      }
      
    } catch (error) {
      console.error('重试API调用失败:', error);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
      // 跳转到首页（社区页面）
      wx.switchTab({
        url: '/pages/community/community'
      });
    }
  }
});
