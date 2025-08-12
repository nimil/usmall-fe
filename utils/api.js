// utils/api.js
// 微信云托管API调用工具类

const { CLOUD_ENV_ID, CLOUD_SERVICE_NAME } = require('./config.js');

class ApiService {
  constructor() {
    this.env = CLOUD_ENV_ID;
    this.service = CLOUD_SERVICE_NAME;
  }

  /**
   * 调用云托管服务
   * @param {Object} options - 请求配置
   * @returns {Promise} 返回Promise对象
   */
  async call(options) {
    try {
      const result = await wx.cloud.callContainer({
        config: {
          env: this.env, // 微信云托管的环境ID
        },
        path: options.path, // 填入业务自定义路径和参数
        method: options.method || 'GET', // 按照自己的业务开发，选择对应的方法
        header: {
          'X-WX-SERVICE': this.service, // 服务名称（微信云托管 - 服务管理 - 服务列表 - 服务名称）
          'Content-Type': 'application/json',
          ...options.header
        },
        data: options.data,
        timeout: options.timeout || 10000
        // dataType:'text', // 默认不填是以JSON形式解析返回结果，若不想让SDK自己解析，可以填text
      });
      
      console.log(`微信云托管调用结果: ${result.errMsg} | callid: ${result.callID}`);
      console.log('API响应状态码:', result.statusCode);
      console.log('API响应数据:', result.data);
      
      // 检查401错误 - 只在需要用户认证的API中检查
      const authRequiredPaths = [
        '/api/auth/check',
        '/api/posts/my',
        '/api/posts',
        '/api/user/profile',
        '/api/auth/register',
        '/api/posts/', // 帖子详情相关
        '/comments' // 评论相关
      ];
      
      if (result.statusCode === 401 && authRequiredPaths.some(path => options.path.includes(path))) {
        console.log('检测到401错误，需要用户注册');
        
        // 抛出401错误，让调用方处理
        const error = new Error('User not found, please register first');
        error.statusCode = 401;
        error.originalError = result;
        throw error;
      }
      
      // 检查data中的code是否为401（某些API可能返回不同的格式）
      if (result.data && result.data.code === 401 && authRequiredPaths.some(path => options.path.includes(path))) {
        console.log('检测到data中的401错误，需要用户注册');
        
        const error = new Error('User not found, please register first');
        error.statusCode = 401;
        error.originalError = result;
        throw error;
      }
      
      return result.data;
    } catch (error) {
      console.error('云托管调用失败:', error);
      
      // 检查是否是401错误 - 只在需要用户认证的API中检查
      const authRequiredPaths = [
        '/api/auth/check',
        '/api/posts/my',
        '/api/posts',
        '/api/user/profile',
        '/api/auth/register',
        '/api/posts/', // 帖子详情相关
        '/comments' // 评论相关
      ];
      
      if ((error.statusCode === 401 || (error.originalError && error.originalError.statusCode === 401)) && 
          authRequiredPaths.some(path => options.path.includes(path))) {
        console.log('在catch块中检测到401错误');
      }
      
      throw error;
    }
  }

  /**
   * 创建用户
   * @param {Object} userData - 用户数据 {username, password}
   * @returns {Promise} 返回创建结果
   */
  async createUser(userData) {
    return this.call({
      path: '/api/test/user',
      method: 'POST',
      data: userData
    });
  }

  /**
   * 分页查询用户列表
   * @param {Object} params - 查询参数 {page, pageSize}
   * @returns {Promise} 返回用户列表
   */
  async getUserList(params = {}) {
    const { page = 1, pageSize = 10 } = params;
    const queryString = `?page=${page}&pageSize=${pageSize}`;
    
    return this.call({
      path: `/api/test/user${queryString}`,
      method: 'GET'
    });
  }
}

/**
 * 获取热门推荐帖子
 * @param {Object} params - 请求参数
 * @param {number} params.page - 页码，默认为1
 * @param {number} params.pageSize - 每页数量，默认为10
 * @param {string} params.category - 分类，默认为'all'
 * @param {string} params.sort - 排序方式，默认为'hot'
 * @returns {Promise} 返回帖子列表数据
 */
const getHotPosts = async (params = {}) => {
  const { page = 1, pageSize = 10, category = 'all', sort = 'hot' } = params;
  
  try {
    const result = await apiService.call({
      path: `/api/posts?page=${page}&pageSize=${pageSize}&category=${category}&sort=${sort}`,
      method: 'GET'
    });
    
    console.log(`获取热门推荐调用结果:`, result);
    return result;
  } catch (error) {
    console.error('获取热门推荐失败:', error);
    throw new Error(`获取热门推荐失败: ${error.message}`);
  }
};

/**
 * 获取社区帖子列表
 * @param {Object} params - 请求参数
 * @param {number} params.page - 页码，默认为1
 * @param {number} params.pageSize - 每页数量，默认为10
 * @param {string} params.category - 分类，默认为'all'
 * @param {string} params.sort - 排序方式，默认为'latest'
 * @returns {Promise} 返回帖子列表数据
 */
const getCommunityPosts = async (params = {}) => {
  const { page = 1, pageSize = 10, category = 'all', sort = 'latest' } = params;
  
  try {
    const result = await apiService.call({
      path: `/api/posts?page=${page}&pageSize=${pageSize}&category=${category}&sort=${sort}`,
      method: 'GET'
    });
    
    console.log(`获取社区帖子调用结果:`, result);
    return result;
  } catch (error) {
    console.error('获取社区帖子失败:', error);
    throw new Error(`获取社区帖子失败: ${error.message}`);
  }
};

/**
 * 获取帖子详情
 * @param {string} postId - 帖子ID
 * @returns {Promise} 返回帖子详情数据
 */
const getPostDetail = async (postId) => {
  try {
    const result = await apiService.call({
      path: `/api/posts/${postId}`,
      method: 'GET'
    });
    
    console.log(`获取帖子详情调用结果:`, result);
    return result;
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    throw new Error(`获取帖子详情失败: ${error.message}`);
  }
};

/**
 * 获取帖子评论列表
 * @param {string} postId - 帖子ID
 * @param {Object} params - 请求参数
 * @returns {Promise} 返回评论列表数据
 */
const getPostComments = async (postId, params = {}) => {
  const { page = 1, pageSize = 20 } = params;
  
  try {
    const result = await apiService.call({
      path: `/api/posts/${postId}/comments?page=${page}&pageSize=${pageSize}`,
      method: 'GET'
    });
    
    console.log(`获取帖子评论调用结果:`, result);
    return result;
  } catch (error) {
    console.error('获取帖子评论失败:', error);
    throw new Error(`获取帖子评论失败: ${error.message}`);
  }
};

/**
 * 发布帖子
 * @param {Object} postData - 帖子数据
 * @returns {Promise} 返回发布结果
 */
const createPost = async (postData) => {
  try {
    const result = await apiService.call({
      path: '/api/posts',
      method: 'POST',
      data: postData
    });
    
    console.log(`发布帖子调用结果:`, result);
    return result;
  } catch (error) {
    console.error('发布帖子失败:', error);
    throw new Error(`发布帖子失败: ${error.message}`);
  }
};

/**
 * 添加评论
 * @param {string} postId - 帖子ID
 * @param {Object} commentData - 评论数据
 * @returns {Promise} 返回添加结果
 */
const addComment = async (postId, commentData) => {
  try {
    const result = await apiService.call({
      path: `/api/posts/${postId}/comments`,
      method: 'POST',
      data: commentData
    });
    
    console.log(`添加评论调用结果:`, result);
    return result;
  } catch (error) {
    console.error('添加评论失败:', error);
    throw new Error(`添加评论失败: ${error.message}`);
  }
};

/**
 * 点赞帖子
 * @param {string} postId - 帖子ID
 * @param {string} action - 操作类型 'like' 或 'unlike'
 * @returns {Promise} 返回点赞结果
 */
const likePost = async (postId, action = 'like') => {
  try {
    const result = await apiService.call({
      path: `/api/posts/${postId}/like`,
      method: 'POST',
      data: {
        action: action
      }
    });
    
    console.log(`点赞帖子调用结果:`, result);
    return result;
  } catch (error) {
    console.error('点赞帖子失败:', error);
    throw new Error(`点赞帖子失败: ${error.message}`);
  }
};

/**
 * 获取热门话题
 * @returns {Promise} 返回热门话题列表
 */
const getHotTopics = async () => {
  try {
    const result = await apiService.call({
      path: '/api/topics/hot',
      method: 'GET'
    });
    
    console.log(`获取热门话题调用结果:`, result);
    return result;
  } catch (error) {
    console.error('获取热门话题失败:', error);
    throw new Error(`获取热门话题失败: ${error.message}`);
  }
};

/**
 * 上传文件到云存储
 * @param {string} filePath - 本地文件路径
 * @param {string} cloudPath - 云存储路径
 * @returns {Promise} 返回上传结果
 */
const uploadFile = async (filePath, cloudPath) => {
  try {
    console.log('开始上传文件:', { filePath, cloudPath });
    
    const result = await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      config: {
        env: CLOUD_ENV_ID
      }
    });
    
    console.log(`文件上传成功:`, result);
    return result;
  } catch (error) {
    console.error('文件上传失败:', {
      error,
      filePath,
      cloudPath,
      env: CLOUD_ENV_ID
    });
    
    // 提供更详细的错误信息
    let errorMessage = '文件上传失败';
    if (error.errMsg) {
      errorMessage += `: ${error.errMsg}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage += `: ${error}`;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * 更新用户信息
 * @param {Object} userInfo - 用户信息 {nickName, avatarUrl, gender, country, province, city, language}
 * @returns {Promise} 返回更新结果
 */
const updateUserProfile = async (userInfo) => {
  try {
    const result = await apiService.call({
      path: '/api/user/profile',
      method: 'PUT',
      data: userInfo
    });
    
    console.log(`更新用户信息调用结果:`, result);
    return result;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw new Error(`更新用户信息失败: ${error.message}`);
  }
};

/**
 * 获取我的帖子列表
 * @param {Object} params - 请求参数
 * @param {number} params.page - 页码，默认为1
 * @param {number} params.pageSize - 每页数量，默认为10，最大50
 * @returns {Promise} 返回我的帖子列表数据
 */
const getMyPosts = async (params = {}) => {
  const { page = 1, pageSize = 10 } = params;
  
  try {
    const result = await apiService.call({
      path: `/api/posts/my?page=${page}&pageSize=${pageSize}`,
      method: 'GET'
    });
    
    console.log(`获取我的帖子调用结果:`, result);
    return result;
  } catch (error) {
    console.error('获取我的帖子失败:', error);
    
    // 如果是401错误，直接重新抛出，让调用方处理
    if (error.statusCode === 401) {
      throw error;
    }
    
    throw new Error(`获取我的帖子失败: ${error.message}`);
  }
};

/**
 * 删除帖子
 * @param {string} postId - 帖子ID
 * @returns {Promise} 返回删除结果
 */
const deletePost = async (postId) => {
  try {
    const result = await apiService.call({
      path: `/api/posts/${postId}`,
      method: 'DELETE'
    });
    
    console.log(`删除帖子调用结果:`, result);
    return result;
  } catch (error) {
    console.error('删除帖子失败:', error);
    throw new Error(`删除帖子失败: ${error.message}`);
  }
};

/**
 * 检查用户是否已注册
 * @returns {Promise} 返回检查结果 {exists, user}
 */
const checkUserRegistration = async () => {
  try {
    const result = await apiService.call({
      path: '/api/auth/check',
      method: 'GET'
    });
    
    console.log(`检查用户注册状态调用结果:`, result);
    return result;
  } catch (error) {
    console.error('检查用户注册状态失败:', error);
    throw error;
  }
};

/**
 * 用户注册
 * @param {Object} userData - 用户数据 {nickname, avatar, bio}
 * @returns {Promise} 返回注册结果
 */
const registerUser = async (userData) => {
  try {
    const result = await apiService.call({
      path: '/api/auth/register',
      method: 'POST',
      data: userData
    });
    
    console.log(`用户注册调用结果:`, result);
    return result;
  } catch (error) {
    console.error('用户注册失败:', error);
    throw new Error(`用户注册失败: ${error.message}`);
  }
};

// 创建全局API实例
const apiService = new ApiService();

module.exports = {
  ApiService,
  apiService,
  getHotPosts,
  getCommunityPosts,
  getPostDetail,
  getPostComments,
  createPost,
  addComment,
  likePost,
  getHotTopics,
  uploadFile,
  updateUserProfile,
  getMyPosts,
  deletePost,
  checkUserRegistration,
  registerUser
}; 