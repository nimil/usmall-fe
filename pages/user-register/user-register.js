// pages/user-register/user-register.js
const { registerUser, uploadFile } = require('../../utils/api.js');

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    avatarUrl: '',
    nickname: '',
    loading: false,
    defaultAvatarUrl: defaultAvatarUrl
  },

  onLoad(options) {
    // 检查是否是从401错误跳转过来的
    if (options.from === '401') {
      wx.showToast({
        title: '请先完善用户信息',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 选择头像
   */
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('选择头像:', avatarUrl);
    
    this.setData({
      avatarUrl: avatarUrl
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
   * 昵称失焦
   */
  onNicknameBlur(e) {
    // 从基础库2.24.4版本起，在onBlur事件触发时，微信将异步对用户输入的内容进行安全监测
    console.log('昵称输入完成:', e.detail.value);
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
    if (!avatarUrl) {
      wx.showToast({
        title: '请选择头像',
        icon: 'none'
      });
      return;
    }

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
      if (!avatarUrl.startsWith('cloud://') && !avatarUrl.startsWith('http')) {
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
          // 检查是否有待执行的API调用
          const app = wx.getApp();
          if (app.globalData.lastApiCall) {
            // 重新执行之前的API调用
            this.retryLastApiCall();
          } else {
            // 返回上一页
            wx.navigateBack();
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
    const app = wx.getApp();
    const lastApiCall = app.globalData.lastApiCall;
    
    if (!lastApiCall) {
      wx.navigateBack();
      return;
    }

    try {
      // 清除标记
      app.globalData.needUserRegister = false;
      app.globalData.lastApiCall = null;

      // 重新执行API调用
      const { apiService } = require('../../utils/api.js');
      const result = await apiService.call(lastApiCall);
      
      console.log('重试API调用成功:', result);
      
      // 返回上一页
      wx.navigateBack();
      
    } catch (error) {
      console.error('重试API调用失败:', error);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
      wx.navigateBack();
    }
  }
});
