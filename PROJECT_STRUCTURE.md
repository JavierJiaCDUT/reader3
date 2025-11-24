# 📁 项目结构说明

本文档解释 reader3 项目的文件组织结构。

## 📂 目录结构

```
reader3/
├── 📄 README.md                    # 项目说明
├── 📄 QUICKSTART.md                # 快速开始指南
├── 📄 DEPLOY.md                    # 详细部署文档
├── 📄 CLAUDE.md                    # Claude Code 使用指南
├── 📄 PROJECT_STRUCTURE.md         # 本文件
│
├── 🐍 Python 版本（本地运行）
│   ├── reader3.py                  # EPUB 解析器
│   ├── server.py                   # FastAPI 服务器
│   ├── pyproject.toml              # Python 依赖
│   └── uv.lock                     # uv 锁文件
│
├── ☁️ Cloudflare 版本（云端部署）
│   ├── worker/
│   │   ├── index.js                # Worker 主文件
│   │   └── templates/
│   │       ├── library.js          # 书库页面模板
│   │       └── reader.js           # 阅读器页面模板
│   ├── package.json                # Node.js 依赖
│   └── wrangler.toml               # Cloudflare 配置
│
├── 📜 脚本
│   ├── scripts/
│   │   ├── convert-to-json.py      # Pickle → JSON 转换器
│   │   └── upload-to-r2.sh         # R2 上传脚本
│
├── 🎨 模板（Python 版本使用）
│   └── templates/
│       ├── library.html            # 书库页面
│       └── reader.html             # 阅读器页面
│
└── 📊 数据文件夹（本地，不提交到 git）
    ├── dracula_data/               # 示例书籍
    │   ├── book.pkl                # Pickle 格式（Python 版）
    │   ├── book.json               # JSON 格式（Cloudflare 版）
    │   └── images/                 # 书籍图片
    │       ├── image1.jpg
    │       └── ...
    └── ...
```

---

## 📝 关键文件说明

### Python 版本（本地运行）

#### `reader3.py`
- **作用：** EPUB 文件解析器
- **输入：** EPUB 文件（例如 `dracula.epub`）
- **输出：** `*_data/` 文件夹，包含：
  - `book.pkl` - 书籍数据（pickle 格式）
  - `images/` - 提取的图片

**使用：**
```bash
uv run reader3.py dracula.epub
```

#### `server.py`
- **作用：** 本地 FastAPI Web 服务器
- **功能：**
  - 读取 `*_data/` 文件夹
  - 提供 Web 界面
  - 端口：8123

**使用：**
```bash
uv run server.py
```

#### `templates/`
- **library.html** - 书库列表页面（Jinja2 模板）
- **reader.html** - 阅读器页面（Jinja2 模板）

---

### Cloudflare 版本（云端部署）

#### `worker/index.js`
- **作用：** Cloudflare Worker 主程序
- **框架：** Hono（类似 FastAPI）
- **功能：**
  - 处理所有 HTTP 请求
  - 从 R2 读取书籍数据
  - 渲染 HTML 页面

**路由：**
- `/` - 书库列表
- `/read/:bookId/:chapterIndex` - 阅读器
- `/read/:bookId/images/:imageName` - 图片服务

#### `worker/templates/`
- **library.js** - 书库页面（JavaScript 模板字符串）
- **reader.js** - 阅读器页面（JavaScript 模板字符串）

这些是 Python 模板的 JavaScript 版本，功能完全相同。

#### `wrangler.toml`
- **作用：** Cloudflare Workers 配置文件
- **配置内容：**
  - Worker 名称
  - R2 bucket 绑定
  - 环境变量
  - 自定义域名（可选）

#### `package.json`
- **作用：** Node.js 项目配置
- **依赖：**
  - `hono` - Web 框架
  - `wrangler` - Cloudflare CLI

---

### 工具脚本

#### `scripts/convert-to-json.py`
- **作用：** 将 pickle 格式转换为 JSON
- **为什么需要：** Cloudflare Workers 不支持 Python pickle
- **输入：** `*_data/book.pkl`
- **输出：** `*_data/book.json`

**使用：**
```bash
# 转换所有书籍
python3 scripts/convert-to-json.py

# 转换单本书
python3 scripts/convert-to-json.py dracula_data
```

#### `scripts/upload-to-r2.sh`
- **作用：** 将书籍上传到 Cloudflare R2
- **上传内容：**
  - `book.json`
  - `images/` 文件夹中的所有图片

**使用：**
```bash
./scripts/upload-to-r2.sh dracula_data
```

---

## 🔄 工作流程

### 本地开发流程

```
1. 下载 EPUB 文件
   ↓
2. 运行 reader3.py 解析
   → 生成 *_data/ 文件夹
   ↓
3. 运行 server.py 启动服务
   → 访问 localhost:8123
```

### Cloudflare 部署流程

```
1. 下载 EPUB 文件
   ↓
2. 运行 reader3.py 解析
   → 生成 *_data/ 文件夹
   ↓
3. 运行 convert-to-json.py 转换
   → 生成 book.json
   ↓
4. 运行 upload-to-r2.sh 上传
   → 上传到 Cloudflare R2
   ↓
5. 运行 wrangler deploy 部署
   → 在线访问
```

---

## 📦 数据格式

### Pickle 格式（book.pkl）
```python
Book {
    metadata: BookMetadata,
    spine: List[ChapterContent],
    toc: List[TOCEntry],
    images: Dict[str, str]
}
```

### JSON 格式（book.json）
```json
{
  "metadata": {
    "title": "Dracula",
    "authors": ["Bram Stoker"],
    ...
  },
  "spine": [
    {
      "id": "chapter1",
      "href": "chapter1.html",
      "content": "<html>...</html>",
      ...
    }
  ],
  "toc": [...],
  "images": {...}
}
```

两种格式内容完全相同，只是序列化方式不同。

---

## 🎨 界面特性

两个版本的界面完全相同：

- ✅ 响应式设计（手机/平板/桌面）
- ✅ 三种主题（浅色/深色/复古）
- ✅ 字体大小调整
- ✅ 移动端汉堡菜单
- ✅ 键盘快捷键
- ✅ TOC 目录导航
- ✅ 章节前后翻页

---

## 🚀 选择哪个版本？

### 使用 Python 版本（本地）
- ✅ 只想在自己电脑上使用
- ✅ 不想折腾云服务
- ✅ 数据隐私要求高

### 使用 Cloudflare 版本（云端）
- ✅ 想在任何设备访问
- ✅ 想分享给朋友
- ✅ 想要全球 CDN 加速
- ✅ 完全免费

---

## 🔧 开发指南

### 修改样式
- **Python 版：** 编辑 `templates/*.html`
- **Cloudflare 版：** 编辑 `worker/templates/*.js`

### 修改路由
- **Python 版：** 编辑 `server.py`
- **Cloudflare 版：** 编辑 `worker/index.js`

### 添加新功能
1. 在 Python 版本开发和测试
2. 同步到 Cloudflare 版本
3. 更新文档

---

## 📚 更多资源

- **README.md** - 项目介绍
- **QUICKSTART.md** - 5分钟快速开始
- **DEPLOY.md** - 完整部署文档
- **CLAUDE.md** - 代码架构说明

---

**有问题？** 查看文档或在 GitHub Issues 提问！
