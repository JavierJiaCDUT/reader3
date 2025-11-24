# 🚀 快速开始 - 10分钟部署到 Cloudflare

这是最简化的部署步骤，适合初学者。

## 📦 准备工作

确保您已经：
- ✅ 有一个 Cloudflare 账号（免费）：https://dash.cloudflare.com/sign-up
- ✅ 有一本已处理的书籍（例如 `dracula_data` 文件夹）

---

## ⚡ 5个步骤完成部署

### 1️⃣ 安装工具

```bash
# 安装依赖
npm install

# 安装 Cloudflare 部署工具
npm install -g wrangler
```

### 2️⃣ 登录 Cloudflare

```bash
wrangler login
```

会打开浏览器，点击"允许"即可。

### 3️⃣ 创建存储空间

```bash
# 创建书籍存储桶
wrangler r2 bucket create reader3-books
```

如果提示需要开启 R2：
1. 访问 https://dash.cloudflare.com
2. 点击 R2
3. 点击"开始使用"，绑定信用卡（不会扣费）

### 4️⃣ 上传书籍

```bash
# 转换书籍格式
python3 scripts/convert-to-json.py dracula_data

# 上传到云端
./scripts/upload-to-r2.sh dracula_data
```

### 5️⃣ 部署上线

```bash
wrangler deploy
```

🎉 **完成！** 访问输出的网址即可！

---

## 📱 测试您的网站

部署成功后会显示网址，例如：
```
https://reader3.abc123.workers.dev
```

在浏览器中打开，您应该能看到：
- 📚 主页显示书籍列表
- 📖 点击可以阅读书籍
- 🌙 主题切换按钮
- 📱 移动端适配良好

---

## 🔄 添加更多书籍

```bash
# 1. 处理新书
python3 reader3.py newbook.epub

# 2. 转换格式
python3 scripts/convert-to-json.py newbook_data

# 3. 上传
./scripts/upload-to-r2.sh newbook_data
```

刷新网站，新书立即出现！

---

## 🎛️ 使用 Web 管理界面

您的网站还有一个管理界面，可以方便地查看和删除书籍：

### 访问管理页面

```
https://reader3.abc123.workers.dev/admin
```

（替换为您自己的网址）

### 可以做什么？

- ✅ **查看所有书籍** - 显示书名、作者、章节数
- ✅ **删除书籍** - 点击删除按钮即可删除不需要的书
- ✅ **切换主题** - 支持深色/浅色模式

### 注意事项

⚠️ **上传功能说明：** 管理界面显示了上传区域，但实际上传仍需要使用上面的命令行步骤（处理 EPUB → 转换 → 上传）。这是因为 Cloudflare Workers 无法运行 Python 代码来处理 EPUB 文件。

如果您想要完全的 Web 上传功能，可以查看 [DEPLOY.md](DEPLOY.md) 中的"未来改进方向"部分。

---

## ❓ 遇到问题？

### 问题1：命令not found

**解决：** 确保在项目根目录运行命令

```bash
cd /path/to/reader3
```

### 问题2：没有书籍显示

**检查：** 确认已上传书籍

```bash
# 查看 R2 中的文件
wrangler r2 object list reader3-books
```

应该能看到 `dracula_data/book.json`

### 问题3：图片无法显示

**解决：** 重新上传书籍

```bash
./scripts/upload-to-r2.sh dracula_data
```

---

## 📖 更多信息

- **完整文档：** 查看 [DEPLOY.md](DEPLOY.md)
- **项目说明：** 查看 [README.md](README.md)
- **Cloudflare 文档：** https://developers.cloudflare.com/workers/

---

**享受您的在线书库！** 📚✨
