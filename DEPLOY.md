# 📚 Reader3 - Cloudflare 完全部署指南

本文档将手把手教您如何将 reader3 项目完全部署到 Cloudflare，实现免费、快速的全球访问。

## 🎯 部署架构

```
Cloudflare Workers (后端逻辑)
    ↓
Cloudflare R2 (书籍文件存储)
    ↓
全球用户访问
```

**优势：**
- ✅ 完全免费（每月100万次请求）
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 零运维成本
- ✅ Web 管理界面 - 方便管理书籍

---

## 📋 前提条件

1. **Cloudflare 账号**
   - 访问 https://dash.cloudflare.com/sign-up
   - 注册免费账号

2. **Node.js 18+**
   - 检查版本：`node --version`
   - 如未安装，访问 https://nodejs.org/

3. **已处理的书籍数据**
   - 至少有一个 `*_data` 文件夹（例如 `dracula_data`）
   - 包含 `book.pkl` 和 `images/` 文件夹

---

## 🚀 部署步骤

### 第一步：安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Wrangler CLI（Cloudflare 的部署工具）
npm install -g wrangler
```

### 第二步：登录 Cloudflare

```bash
# 这会打开浏览器，让您授权
wrangler login
```

### 第三步：创建 R2 Bucket（存储桶）

R2 是 Cloudflare 的对象存储服务，类似于 AWS S3。

```bash
# 创建生产环境 bucket
wrangler r2 bucket create reader3-books

# 创建预览环境 bucket（可选，用于测试）
wrangler r2 bucket create reader3-books-preview
```

### 第四步：转换书籍数据

将 Python pickle 格式转换为 JSON 格式：

```bash
# 转换所有书籍
python3 scripts/convert-to-json.py

# 或转换单本书
python3 scripts/convert-to-json.py dracula_data
```

**输出示例：**
```
📖 Loading book from dracula_data/book.pkl...
🔄 Converting to JSON format...
💾 Saving to dracula_data/book.json...

✅ Conversion successful!
📊 Book: Dracula
👤 Authors: Bram Stoker
📄 Chapters: 27
🖼️  Images: 5
💾 JSON size: 1234.56 KB
```

### 第五步：上传书籍到 R2

将转换后的 JSON 文件和图片上传到 R2：

```bash
# 上传书籍 JSON 文件
wrangler r2 object put reader3-books/dracula_data/book.json --file=dracula_data/book.json

# 上传所有图片（如果有图片的话）
# 注意：需要为每个图片单独上传
wrangler r2 object put reader3-books/dracula_data/images/image1.jpg --file=dracula_data/images/image1.jpg
wrangler r2 object put reader3-books/dracula_data/images/image2.jpg --file=dracula_data/images/image2.jpg
# ... 重复上传所有图片
```

**批量上传图片的脚本（可选）：**

创建 `upload-to-r2.sh` 文件：

```bash
#!/bin/bash
# 批量上传书籍到 R2

BOOK_FOLDER=$1
BUCKET_NAME="reader3-books"

if [ -z "$BOOK_FOLDER" ]; then
  echo "Usage: ./upload-to-r2.sh <book_folder>"
  echo "Example: ./upload-to-r2.sh dracula_data"
  exit 1
fi

# 上传 book.json
echo "📤 Uploading book.json..."
wrangler r2 object put $BUCKET_NAME/$BOOK_FOLDER/book.json --file=$BOOK_FOLDER/book.json

# 上传所有图片
if [ -d "$BOOK_FOLDER/images" ]; then
  echo "📤 Uploading images..."
  for img in $BOOK_FOLDER/images/*; do
    filename=$(basename "$img")
    echo "  Uploading $filename..."
    wrangler r2 object put $BUCKET_NAME/$BOOK_FOLDER/images/$filename --file=$img
  done
fi

echo "✅ Upload complete!"
```

使用方法：
```bash
chmod +x upload-to-r2.sh
./upload-to-r2.sh dracula_data
```

### 第六步：本地测试

在部署到生产环境之前，先在本地测试：

```bash
# 启动本地开发服务器
npm run dev

# 或
wrangler dev
```

访问 http://localhost:8787 查看效果。

**测试清单：**
- ✅ 主页能看到书籍列表
- ✅ 点击书籍能进入阅读页面
- ✅ 章节导航正常
- ✅ 目录（TOC）点击正常
- ✅ 图片能正常显示
- ✅ 主题切换正常
- ✅ 字体大小调整正常
- ✅ 移动端汉堡菜单正常

### 第七步：部署到 Cloudflare

```bash
# 部署到生产环境
npm run deploy

# 或
wrangler deploy
```

**成功输出示例：**
```
Total Upload: 45.23 KiB / gzip: 12.34 KiB
Uploaded reader3 (1.23 sec)
Published reader3 (0.45 sec)
  https://reader3.<your-subdomain>.workers.dev
Current Deployment ID: abc123def456
```

🎉 **恭喜！您的网站已经上线了！**

访问输出的网址（例如 `https://reader3.your-subdomain.workers.dev`）查看您的在线书库。

---

## 🔧 高级配置

### 绑定自定义域名

如果您有自己的域名（例如 `reader.example.com`）：

1. **在 Cloudflare 添加域名**
   - 访问 Cloudflare Dashboard
   - 添加您的域名
   - 按照指引修改 DNS

2. **修改 wrangler.toml**

取消注释并修改：

```toml
routes = [
  { pattern = "reader.example.com/*", zone_name = "example.com" }
]
```

3. **重新部署**

```bash
wrangler deploy
```

### 添加更多书籍

每次添加新书：

1. 处理 EPUB：`python3 reader3.py newbook.epub`
2. 转换为 JSON：`python3 scripts/convert-to-json.py newbook_data`
3. 上传到 R2：`./upload-to-r2.sh newbook_data`

完成！新书会自动出现在主页。

### 查看访问日志

```bash
# 实时查看 Worker 日志
npm run tail

# 或
wrangler tail
```

### 更新代码

修改代码后，重新部署：

```bash
wrangler deploy
```

---

## 💰 费用说明

**完全免费！**

Cloudflare 免费计划包含：
- ✅ 100,000 次请求/天（约300万次/月）
- ✅ 10 GB R2 存储空间
- ✅ 无限带宽（读取）
- ✅ 全球 CDN 加速

除非您的网站非常火爆（日访问超过10万次），否则完全免费。

---

## 🐛 常见问题

### 1. `wrangler: command not found`

**解决方案：**
```bash
npm install -g wrangler
```

### 2. R2 bucket 创建失败

**错误信息：** `You need to enable R2 in your account`

**解决方案：**
1. 访问 https://dash.cloudflare.com
2. 进入 R2 页面
3. 点击"开始使用 R2"
4. 绑定信用卡（不会扣费，只是验证）

### 3. 书籍列表为空

**原因：** R2 中没有书籍数据

**解决方案：**
1. 确认已运行 `python3 scripts/convert-to-json.py`
2. 确认已上传到 R2：`wrangler r2 object list reader3-books`
3. 检查文件结构：每本书应该在 `book_data/book.json`

### 4. 图片无法显示

**原因：** 图片路径不正确或未上传

**解决方案：**
1. 检查 R2 中是否有图片：
   ```bash
   wrangler r2 object list reader3-books --prefix=dracula_data/images/
   ```
2. 确认图片文件名与 book.json 中的一致

### 5. 部署后500错误

**解决方案：**
1. 查看日志：`wrangler tail`
2. 检查 R2 bucket 绑定是否正确
3. 确认 book.json 格式正确

---

## 📊 性能优化

### 启用缓存

Worker 已经配置了缓存（1小时），无需额外配置。

### 压缩书籍内容

如果书籍很大，可以在上传前压缩：

```bash
# 压缩 book.json
gzip book.json
wrangler r2 object put reader3-books/dracula_data/book.json.gz --file=book.json.gz
```

然后在 Worker 中添加解压逻辑。

---

## 🔒 安全性

### 添加访问密码（可选）

如果您想限制访问，可以在 Worker 中添加基本认证：

编辑 `worker/index.js`：

```javascript
// 在所有路由之前添加
app.use('*', async (c, next) => {
  const auth = c.req.header('Authorization');

  if (!auth || auth !== 'Basic ' + btoa('user:password')) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Reader3"'
      }
    });
  }

  await next();
});
```

---

## 📞 获取帮助

- **Cloudflare Workers 文档：** https://developers.cloudflare.com/workers/
- **R2 文档：** https://developers.cloudflare.com/r2/
- **Hono 文档：** https://hono.dev/

---

## 🎊 完成！

您已成功将 reader3 部署到 Cloudflare！现在您可以：

- 📱 在任何设备上访问您的书库
- 🌍 全球快速访问
- 💰 完全免费
- 🚀 无限扩展

---

## 🎛️ Web 管理界面

部署完成后，您可以通过 Web 界面管理书籍，无需使用命令行！

### 访问管理界面

访问 `https://your-worker-url.workers.dev/admin`

### 功能特性

**📚 书籍列表**
- 查看所有已上传的书籍
- 显示书名、作者、章节数
- 支持深色/浅色主题

**🗑️ 删除书籍**
- 点击"删除"按钮即可删除书籍
- 会删除 R2 中的所有相关文件（book.json 和所有图片）
- 删除前会有确认提示

**📖 上传新书（说明）**

目前 Web 界面展示了上传区域，但由于 Cloudflare Workers 无法运行 Python EPUB 处理代码，您仍需要在本地进行以下步骤：

```bash
# 1. 下载 EPUB 文件到本地
# 2. 处理 EPUB
python3 reader3.py your-book.epub

# 3. 转换为 JSON
python3 scripts/convert-to-json.py your-book_data

# 4. 上传到 R2
./scripts/upload-to-r2.sh your-book_data
```

上传完成后，刷新管理界面即可看到新书。

### 未来改进方向

如果您想实现完全的 Web 上传功能，可以考虑：

1. **使用 JavaScript EPUB 解析库**
   - 例如 [epub.js](https://github.com/futurepress/epub.js/)
   - 在 Worker 中直接处理 EPUB 文件

2. **使用 Cloudflare Durable Objects**
   - 实现长时间运行的 EPUB 处理任务
   - 支持进度追踪

3. **使用外部处理服务**
   - 将 EPUB 处理部署为独立的 API
   - Worker 调用该 API 处理文件

### 管理界面快捷键

- **切换主题：** 点击主题按钮（🌙/☀️）

### 安全提示

- 管理界面默认没有密码保护
- 如果您希望保护管理页面，可以：
  1. 在 `worker/index.js` 中添加基本认证
  2. 使用 Cloudflare Access 添加访问控制
  3. 将管理路由限制为特定 IP 地址

---

享受阅读吧！📚
