// app.js
const { CLOUD_ENV_ID, CLOUD_SERVICE_NAME } = require('./utils/config.js');

App({
  async onLaunch() {
    // 初始化
    console.log('济南东社区小程序启动');
    
    // 使用callContainer前一定要init一下，全局执行一次即可
    wx.cloud.init();
    
    try {
      // 下面的请求可以在页面任意一处使用
      const result = await wx.cloud.callContainer({
        config: {
          env: CLOUD_ENV_ID, // 微信云托管的环境ID
        },
        path: '/', // 填入业务自定义路径和参数，根目录，就是 / 
        method: 'GET', // 按照自己的业务开发，选择对应的方法
        header: {
          'X-WX-SERVICE': CLOUD_SERVICE_NAME, // 服务名称（微信云托管 - 服务管理 - 服务列表 - 服务名称）
        }
        // dataType:'text', // 默认不填是以JSON形式解析返回结果，若不想让SDK自己解析，可以填text
      });
      
      console.log('微信云托管初始化成功:', result);
    } catch (error) {
      console.error('微信云托管初始化失败:', error);
    }
  },
  
  globalData: {
    userInfo: null,
    needUserRegister: false,
    lastApiCall: null
  },

  /**
   * 安全地更新全局状态
   */
  updateGlobalData(key, value) {
    try {
      if (this.globalData) {
        this.globalData[key] = value;
        console.log(`全局状态已更新: ${key} =`, value);
        return true;
      }
    } catch (error) {
      console.error('更新全局状态失败:', error);
    }
    return false;
  },

  /**
   * 安全地获取全局状态
   */
  getGlobalData(key) {
    try {
      if (this.globalData) {
        return this.globalData[key];
      }
    } catch (error) {
      console.error('获取全局状态失败:', error);
    }
    return null;
  }
}) 