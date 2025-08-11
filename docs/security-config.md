# 🔐 安全配置指南

## 概述

本指南说明如何在开源项目中安全地管理敏感信息，确保代码可以安全地发布到GitHub。

## 🚨 敏感信息清单

### 必须隐藏的信息
- **微信云托管环境ID** (`CLOUD_ENV_ID`)
- **微信云托管服务名称** (`CLOUD_SERVICE_NAME`)
- **小程序AppID** (`APP_ID`)
- **API密钥和Token**
- **数据库连接信息**
- **第三方服务密钥**

### 可以公开的信息
- 代码逻辑
- 页面结构
- 样式文件
- 工具函数
- 文档说明

## 📁 文件结构

```
usmll-fe/
├── utils/
│   ├── config.example.js    # 配置文件模板（可公开）
│   └── config.js           # 实际配置文件（已忽略）
├── project.config.example.json  # 项目配置模板（可公开）
├── project.config.json     # 实际项目配置（已忽略）
├── .gitignore             # Git忽略文件（可公开）
└── docs/
    └── security-config.md  # 安全配置文档（可公开）
```

## 🔧 配置步骤

### 1. 复制配置文件模板

```bash
# 复制配置文件模板
cp utils/config.example.js utils/config.js
cp project.config.example.json project.config.json
```

### 2. 修改实际配置

编辑 `utils/config.js`：
```javascript
module.exports = {
  CLOUD_ENV_ID: 'your-actual-env-id',
  CLOUD_SERVICE_NAME: 'your-actual-service-name',
  APP_ID: 'your-actual-app-id',
  // ... 其他配置
};
```

编辑 `project.config.json`：
```json
{
  "appid": "your-actual-app-id",
  // ... 其他配置
}
```

### 3. 验证配置

确保以下文件被正确忽略：
- ✅ `utils/config.js`
- ✅ `project.config.json`
- ✅ `project.private.config.json`

## 🛡️ 安全最佳实践

### 1. 使用环境变量（推荐）

如果可能，考虑使用环境变量：

```javascript
// utils/config.js
module.exports = {
  CLOUD_ENV_ID: process.env.CLOUD_ENV_ID || 'default-env-id',
  CLOUD_SERVICE_NAME: process.env.CLOUD_SERVICE_NAME || 'default-service',
  // ...
};
```

### 2. 配置文件验证

添加配置验证逻辑：

```javascript
// utils/config.js
const config = {
  CLOUD_ENV_ID: 'your-env-id',
  CLOUD_SERVICE_NAME: 'your-service-name',
  // ...
};

// 验证配置
function validateConfig() {
  const required = ['CLOUD_ENV_ID', 'CLOUD_SERVICE_NAME'];
  for (const key of required) {
    if (!config[key] || config[key] === 'your-' + key.toLowerCase().replace(/_/g, '-')) {
      throw new Error(`请配置 ${key}`);
    }
  }
}

validateConfig();

module.exports = config;
```

### 3. 开发环境配置

为不同环境创建配置：

```javascript
// utils/config.dev.js (开发环境)
module.exports = {
  CLOUD_ENV_ID: 'dev-env-id',
  CLOUD_SERVICE_NAME: 'dev-service',
  API_CONFIG: { DEBUG: true }
};

// utils/config.prod.js (生产环境)
module.exports = {
  CLOUD_ENV_ID: 'prod-env-id',
  CLOUD_SERVICE_NAME: 'prod-service',
  API_CONFIG: { DEBUG: false }
};
```

## 📋 部署检查清单

在部署到GitHub之前，请检查：

- [ ] 敏感配置文件已添加到 `.gitignore`
- [ ] 配置文件模板已创建
- [ ] 实际配置文件已正确配置
- [ ] 文档已更新说明配置步骤
- [ ] 代码中无硬编码的敏感信息
- [ ] 已测试配置文件的加载

## 🔍 安全检查工具

### 1. 使用 Git 检查

```bash
# 检查是否有敏感文件被意外提交
git status

# 检查已提交的文件中是否包含敏感信息
git log --all --full-history -- utils/config.js
```

### 2. 使用脚本检查

创建检查脚本 `scripts/security-check.js`：

```javascript
const fs = require('fs');
const path = require('path');

const sensitiveFiles = [
  'utils/config.js',
  'project.config.json',
  'project.private.config.json'
];

const sensitivePatterns = [
  /prod-[a-zA-Z0-9]+/,
  /wx[a-zA-Z0-9]{16}/,
  /sk-[a-zA-Z0-9]+/
];

function checkSecurity() {
  console.log('🔍 开始安全检查...');
  
  // 检查敏感文件
  for (const file of sensitiveFiles) {
    if (fs.existsSync(file)) {
      console.log(`⚠️  发现敏感文件: ${file}`);
    }
  }
  
  // 检查代码中的敏感模式
  const codeFiles = getAllFiles('.');
  for (const file of codeFiles) {
    if (file.endsWith('.js') || file.endsWith('.json')) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of sensitivePatterns) {
        if (pattern.test(content)) {
          console.log(`⚠️  发现敏感信息: ${file}`);
        }
      }
    }
  }
  
  console.log('✅ 安全检查完成');
}

checkSecurity();
```

## 🚀 快速开始

### 新用户配置步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/usmll-fe.git
   cd usmll-fe
   ```

2. **复制配置文件**
   ```bash
   cp utils/config.example.js utils/config.js
   cp project.config.example.json project.config.json
   ```

3. **修改配置**
   - 编辑 `utils/config.js` 填入您的实际配置
   - 编辑 `project.config.json` 填入您的AppID

4. **验证配置**
   ```bash
   # 检查配置是否正确
   node -e "console.log(require('./utils/config.js'))"
   ```

5. **开始开发**
   - 使用微信开发者工具打开项目
   - 编译运行

## 📞 支持

如果遇到配置问题，请：

1. 检查配置文件格式是否正确
2. 确认敏感信息已正确填入
3. 查看控制台错误信息
4. 参考微信小程序官方文档
5. 提交Issue获取帮助

## 🔄 更新配置

当需要更新配置时：

1. 更新 `utils/config.example.js` 模板
2. 更新 `project.config.example.json` 模板
3. 更新本文档
4. 通知其他开发者更新本地配置

---

**⚠️ 重要提醒**：永远不要将包含真实敏感信息的配置文件提交到GitHub！ 