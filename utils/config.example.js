// utils/config.example.js
// 这是一个配置文件模板，请复制为 config.js 并填入您的实际配置

module.exports = {
  // 微信云托管环境ID
  // 获取方式：微信云托管控制台 -> 环境管理 -> 环境ID
  CLOUD_ENV_ID: 'your-cloud-env-id',
  
  // 微信云托管服务名称
  // 获取方式：微信云托管控制台 -> 服务管理 -> 服务名称
  CLOUD_SERVICE_NAME: 'your-service-name',
  
  // 小程序AppID（可选，用于开发调试）
  // 获取方式：微信公众平台 -> 开发 -> 开发设置 -> AppID
  APP_ID: 'your-app-id',
  
  // API基础配置
  API_CONFIG: {
    // API请求超时时间（毫秒）
    TIMEOUT: 10000,
    
    // 是否开启调试模式
    DEBUG: false,
    
    // API版本
    VERSION: 'v1'
  }
}; 