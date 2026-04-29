# API Inspector

一个用于拦截、查看、编辑和重放 API 请求的 Chrome 扩展。

## 功能特性

- 监控网页 API 请求（Fetch/XHR）
- 手动 API 测试模式
- 多语言支持（中文、English、한국어）
- Monaco 编辑器编辑 JSON
- 请求重放功能
- 请求过滤和搜索

## 安装

### 从源码安装

1. 下载最新版本的压缩包或克隆此仓库
2. 运行构建命令：
   ```bash
   npm install
   npm run build
   ```
3. 打开 Chrome，访问 `chrome://extensions/`
4. 开启右上角「开发者模式」
5. 点击「加载已解压的扩展程序」，选择 `dist` 目录

### 从 Release 安装

1. 前往 [Releases](https://github.com/GrayWitch/chrome-extension-TestApi/releases) 页面
2. 下载最新版本的 `.zip` 文件
3. 解压到任意目录
4. 按上述步骤加载扩展

## 开发

### 环境要求

- Node.js 16+
- npm

### 构建

```bash
npm install
npm run build
```

构建产物位于 `dist/` 目录，每次构建会自动升级版本号。

### 发布

```bash
node release.js
```

此命令会：
1. 构建扩展
2. 创建压缩包
3. 提交代码到 Git
4. 推送到 GitHub
5. 创建 Git 标签和 GitHub Release

## 项目结构

```
├── background.js      # Service Worker 后台脚本
├── content.js        # 内容脚本
├── app.js            # 主应用逻辑
├── app.html          # 弹出页面
├── app.css           # 样式文件
├── i18n.js           # 国际化支持
├── monaco-config.js  # Monaco 编辑器配置
├── manifest.json     # 扩展清单
├── icons/            # 扩展图标
├── monaco/           # Monaco 编辑器
├── build.js          # 构建脚本
└── release.js        # 发布脚本
```

## 许可证

MIT License