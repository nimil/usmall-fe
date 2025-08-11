// pages/post/post.js
const { createPost, getHotTopics, uploadFile } = require('../../utils/api.js');

Page({
  data: {
    categories: [],
    selectedCategory: '',
    title: '',
    content: '',
    images: [], // 图片列表，包含本地路径和云存储URL
    uploadedImages: [], // 已上传的云存储文件ID
    tagInput: '',
    tags: [],
    canPublish: false,
    publishing: false,
    categoriesLoading: false,
    uploading: false,
    choosingImage: false // 防止重复选择图片
  },

  onLoad() {
    // 页面加载时的初始化
    this.loadHotTopics();
  },

  /**
   * 加载热门话题
   */
  async loadHotTopics() {
    this.setData({ categoriesLoading: true });
    
    try {
      const result = await getHotTopics();
      
      if (result.code === 200) {
        this.setData({
          categories: result.data
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
      this.setData({ categoriesLoading: false });
    }
  },

  // 选择分类
  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category
    });
    this.checkCanPublish();
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    });
    this.checkCanPublish();
  },

  // 内容输入
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
    this.checkCanPublish();
  },

  // 添加图片
  onAddImage() {
    // 检查是否正在上传中
    if (this.data.uploading) {
      wx.showToast({
        title: '正在上传中，请稍候',
        icon: 'none'
      });
      return;
    }

    // 防止重复调用
    if (this.data.choosingImage) {
      return;
    }

    this.setData({ choosingImage: true });

    // 优先使用 wx.chooseMedia，如果失败则使用 wx.chooseImage
    const chooseMedia = () => {
      wx.chooseMedia({
        count: 9 - this.data.images.length,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          // 检查文件类型和大小
          const validImages = res.tempFiles.filter(file => {
            // 检查文件大小（限制为10MB）
            if (file.size > 10 * 1024 * 1024) {
              wx.showToast({
                title: '图片大小不能超过10MB',
                icon: 'none'
              });
              return false;
            }
            return true;
          });
          
          if (validImages.length === 0) {
            this.setData({ choosingImage: false });
            return;
          }
          
          const newImages = validImages.map(file => file.tempFilePath);
          // 去重，避免添加重复的图片
          const uniqueNewImages = newImages.filter(img => !this.data.images.includes(img));
          
          if (uniqueNewImages.length === 0) {
            this.setData({ choosingImage: false });
            return;
          }
          
          this.setData({
            images: [...this.data.images, ...uniqueNewImages],
            choosingImage: false
          });
          
          // 自动上传新添加的图片
          this.uploadImages(uniqueNewImages);
        },
        fail: (error) => {
          console.warn('wx.chooseMedia 失败，尝试使用 wx.chooseImage:', error);
          this.setData({ choosingImage: false });
          chooseImage();
        }
      });
    };

    const chooseImage = () => {
      wx.chooseImage({
        count: 9 - this.data.images.length,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          // 检查文件类型和大小
          const validImages = res.tempFilePaths.map((filePath, index) => {
            const fileInfo = res.tempFiles[index];
            // 检查文件大小（限制为10MB）
            if (fileInfo.size > 10 * 1024 * 1024) {
              wx.showToast({
                title: '图片大小不能超过10MB',
                icon: 'none'
              });
              return null;
            }
            return filePath;
          }).filter(Boolean);
          
          if (validImages.length === 0) {
            this.setData({ choosingImage: false });
            return;
          }
          
          // 去重，避免添加重复的图片
          const uniqueValidImages = validImages.filter(img => !this.data.images.includes(img));
          
          if (uniqueValidImages.length === 0) {
            this.setData({ choosingImage: false });
            return;
          }
          
          this.setData({
            images: [...this.data.images, ...uniqueValidImages],
            choosingImage: false
          });
          
          // 自动上传新添加的图片
          this.uploadImages(uniqueValidImages);
        },
        fail: (error) => {
          console.error('选择图片失败:', error);
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
          this.setData({ choosingImage: false });
        }
      });
    };

    // 尝试使用 wx.chooseMedia
    try {
      chooseMedia();
    } catch (error) {
      console.warn('wx.chooseMedia 异常，使用 wx.chooseImage:', error);
      this.setData({ choosingImage: false });
      chooseImage();
    }
  },

  /**
   * 上传图片到云存储
   */
  async uploadImages(imagePaths) {
    this.setData({ uploading: true });
    
    try {
      const uploadPromises = imagePaths.map(async (filePath, index) => {
        // 生成云存储路径
        const date = new Date();
        const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        const timestamp = Date.now();
        
        // 更安全的文件扩展名获取方法
        let ext = 'jpg'; // 默认扩展名
        try {
          // 尝试从文件路径获取扩展名
          const pathParts = filePath.split('.');
          if (pathParts.length > 1) {
            const possibleExt = pathParts[pathParts.length - 1].toLowerCase();
            // 检查是否是有效的图片扩展名
            const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
            if (validExtensions.includes(possibleExt)) {
              ext = possibleExt;
            }
          }
        } catch (e) {
          console.warn('获取文件扩展名失败，使用默认扩展名:', e);
        }
        
        const cloudPath = `posts/${dateStr}/${timestamp}_${index}.${ext}`;
        
        const result = await uploadFile(filePath, cloudPath);
        return { fileID: result.fileID, localPath: filePath };
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      
      // 更新图片列表，将本地路径替换为云存储URL
      const newImages = [...this.data.images];
      const newUploadedImages = [...this.data.uploadedImages];
      
      uploadResults.forEach(result => {
        // 找到对应的本地路径在images数组中的索引
        const localIndex = newImages.findIndex(img => img === result.localPath);
        if (localIndex !== -1) {
          newImages[localIndex] = result.fileID;
          newUploadedImages[localIndex] = result.fileID;
        }
      });
      
      this.setData({
        uploadedImages: newUploadedImages,
        images: newImages
      });
      
      wx.showToast({
        title: '图片上传成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('图片上传失败:', error);
      wx.showToast({
        title: '图片上传失败',
        icon: 'none'
      });
    } finally {
      this.setData({ uploading: false });
    }
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    const uploadedImages = [...this.data.uploadedImages];
    
    images.splice(index, 1);
    uploadedImages.splice(index, 1);
    
    this.setData({ 
      images,
      uploadedImages
    });
  },

  // 标签输入
  onTagInput(e) {
    const value = e.detail.value;
    this.setData({ tagInput: value });
    
    // 当输入逗号时，自动添加标签
    if (value.endsWith(',')) {
      const tag = value.slice(0, -1).trim();
      if (tag && !this.data.tags.includes(tag)) {
        this.setData({
          tags: [...this.data.tags, tag],
          tagInput: ''
        });
      }
    }
  },

  // 删除标签
  onDeleteTag(e) {
    const index = e.currentTarget.dataset.index;
    const tags = [...this.data.tags];
    tags.splice(index, 1);
    this.setData({ tags });
  },

  // 检查是否可以发布
  checkCanPublish() {
    const { selectedCategory, title, content } = this.data;
    const canPublish = selectedCategory && title.trim() && content.trim();
    this.setData({ canPublish });
  },

  // 取消发布
  onCancel() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消发布吗？已输入的内容将会丢失。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 发布帖子
  async onPublish() {
    if (!this.data.canPublish) {
      wx.showToast({
        title: '请完善帖子内容',
        icon: 'none'
      });
      return;
    }

    this.setData({ publishing: true });

    try {
      const { selectedCategory, title, content, images, tags } = this.data;
      
      // 找到选中的分类值
      const category = this.data.categories.find(cat => cat.name === selectedCategory)?.code || 'other';
      
      const postData = {
        title: title.trim(),
        content: content.trim(),
        category: category,
        tags: tags,
        images: this.data.uploadedImages // 使用已上传的云存储文件ID
      };

      const result = await createPost(postData);

      if (result.code === 200) {
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        });
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: result.message || '发布失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('发布失败:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ publishing: false });
    }
  }
}); 