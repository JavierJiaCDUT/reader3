export function adminTemplate({ books = [], uploadEnabled = true }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>书籍管理 - Reader3</title>
    <style>
        :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --bg-hover: #e9ecef;
            --text-primary: #212529;
            --text-secondary: #6c757d;
            --border-color: #dee2e6;
            --accent-color: #007bff;
            --accent-hover: #0056b3;
            --success-color: #28a745;
            --danger-color: #dc3545;
            --danger-hover: #c82333;
            --shadow-sm: 0 0.125rem 0.25rem rgba(0,0,0,0.075);
            --shadow-md: 0 0.5rem 1rem rgba(0,0,0,0.15);
        }

        [data-theme="dark"] {
            --bg-primary: #1a1a1a;
            --bg-secondary: #2d2d2d;
            --bg-hover: #3a3a3a;
            --text-primary: #e9ecef;
            --text-secondary: #adb5bd;
            --border-color: #495057;
            --accent-color: #4dabf7;
            --accent-hover: #339af0;
            --success-color: #51cf66;
            --danger-color: #ff6b6b;
            --danger-hover: #fa5252;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-secondary);
            color: var(--text-primary);
            line-height: 1.6;
            padding: 2rem 1rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        h1 {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
        }

        .header-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .btn {
            padding: 0.5rem 1.5rem;
            border: none;
            border-radius: 0.375rem;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
            font-weight: 500;
        }

        .btn-primary {
            background-color: var(--accent-color);
            color: white;
        }

        .btn-primary:hover {
            background-color: var(--accent-hover);
        }

        .btn-secondary {
            background-color: var(--bg-hover);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }

        .btn-secondary:hover {
            background-color: var(--border-color);
        }

        .btn-danger {
            background-color: var(--danger-color);
            color: white;
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
        }

        .btn-danger:hover {
            background-color: var(--danger-hover);
        }

        .theme-toggle {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            padding: 0.5rem;
            cursor: pointer;
            border-radius: 0.375rem;
            font-size: 1.25rem;
            transition: all 0.2s;
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .theme-toggle:hover {
            background-color: var(--bg-hover);
        }

        .upload-section {
            background: var(--bg-primary);
            border-radius: 0.5rem;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: var(--shadow-sm);
        }

        .upload-area {
            border: 2px dashed var(--border-color);
            border-radius: 0.5rem;
            padding: 3rem 2rem;
            text-align: center;
            transition: all 0.3s;
            cursor: pointer;
        }

        .upload-area:hover, .upload-area.dragover {
            border-color: var(--accent-color);
            background-color: var(--bg-secondary);
        }

        .upload-area.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .upload-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .upload-text {
            font-size: 1.125rem;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
        }

        .upload-hint {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        #fileInput {
            display: none;
        }

        .progress-container {
            display: none;
            margin-top: 1.5rem;
        }

        .progress-bar {
            width: 100%;
            height: 0.5rem;
            background-color: var(--bg-secondary);
            border-radius: 0.25rem;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background-color: var(--accent-color);
            width: 0%;
            transition: width 0.3s;
        }

        .progress-text {
            margin-top: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
            text-align: center;
        }

        .books-section {
            background: var(--bg-primary);
            border-radius: 0.5rem;
            padding: 2rem;
            box-shadow: var(--shadow-sm);
        }

        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: var(--text-primary);
        }

        .books-table {
            width: 100%;
            border-collapse: collapse;
        }

        .books-table thead {
            background-color: var(--bg-secondary);
        }

        .books-table th {
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: var(--text-primary);
            border-bottom: 2px solid var(--border-color);
        }

        .books-table td {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-primary);
        }

        .books-table tbody tr:hover {
            background-color: var(--bg-hover);
        }

        .book-title {
            font-weight: 500;
            color: var(--accent-color);
        }

        .book-meta {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        .empty-state {
            text-align: center;
            padding: 3rem 2rem;
            color: var(--text-secondary);
        }

        .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }

        .message {
            padding: 1rem;
            border-radius: 0.375rem;
            margin-bottom: 1rem;
            display: none;
        }

        .message.success {
            background-color: rgba(40, 167, 69, 0.1);
            color: var(--success-color);
            border: 1px solid var(--success-color);
        }

        .message.error {
            background-color: rgba(220, 53, 69, 0.1);
            color: var(--danger-color);
            border: 1px solid var(--danger-color);
        }

        .message.show {
            display: block;
        }

        @media (max-width: 768px) {
            .books-table {
                font-size: 0.875rem;
            }

            .books-table th, .books-table td {
                padding: 0.75rem 0.5rem;
            }

            .header {
                flex-direction: column;
                align-items: flex-start;
            }

            h1 {
                font-size: 1.5rem;
            }

            .upload-area {
                padding: 2rem 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 书籍管理</h1>
            <div class="header-actions">
                <button id="theme-toggle" class="theme-toggle" title="切换主题">🌙</button>
                <a href="/" class="btn btn-secondary">返回书库</a>
            </div>
        </div>

        <div id="message" class="message"></div>

        ${uploadEnabled ? `
        <div class="upload-section">
            <div id="uploadArea" class="upload-area">
                <div class="upload-icon">📖</div>
                <div class="upload-text">拖拽 EPUB 文件到此处，或点击选择文件</div>
                <div class="upload-hint">支持 .epub 格式</div>
                <input type="file" id="fileInput" accept=".epub" />
            </div>
            <div id="progressContainer" class="progress-container">
                <div class="progress-bar">
                    <div id="progressFill" class="progress-fill"></div>
                </div>
                <div id="progressText" class="progress-text">上传中...</div>
            </div>
        </div>
        ` : ''}

        <div class="books-section">
            <h2 class="section-title">书籍列表 (${books.length})</h2>
            ${books.length > 0 ? `
            <table class="books-table">
                <thead>
                    <tr>
                        <th>书名</th>
                        <th>作者</th>
                        <th>章节数</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${books.map(book => `
                    <tr>
                        <td>
                            <div class="book-title">${book.metadata.title}</div>
                            <div class="book-meta">${book.id}</div>
                        </td>
                        <td>${book.metadata.authors?.join(', ') || '未知'}</td>
                        <td>${book.spine?.length || 0}</td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteBook('${book.id}')">删除</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <p>暂无书籍</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">上传 EPUB 文件开始使用</p>
            </div>
            `}
        </div>
    </div>

    <script>
        // Theme management
        const themes = ['light', 'dark'];
        const themeToggle = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';

        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            themeToggle.textContent = next === 'light' ? '🌙' : '☀️';
        });

        // Message display
        function showMessage(text, type = 'success') {
            const message = document.getElementById('message');
            message.textContent = text;
            message.className = 'message ' + type + ' show';
            setTimeout(() => {
                message.classList.remove('show');
            }, 5000);
        }

        ${uploadEnabled ? `
        // Upload functionality
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        uploadArea.addEventListener('click', () => {
            if (!uploadArea.classList.contains('disabled')) {
                fileInput.click();
            }
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!uploadArea.classList.contains('disabled')) {
                uploadArea.classList.add('dragover');
            }
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (!uploadArea.classList.contains('disabled')) {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileUpload(files[0]);
                }
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });

        async function handleFileUpload(file) {
            if (!file.name.endsWith('.epub')) {
                showMessage('请上传 .epub 格式的文件', 'error');
                return;
            }

            uploadArea.classList.add('disabled');
            progressContainer.style.display = 'block';
            progressFill.style.width = '0%';
            progressText.textContent = '上传中...';

            const formData = new FormData();
            formData.append('file', file);

            try {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        progressFill.style.width = percent + '%';
                        progressText.textContent = '上传中... ' + Math.round(percent) + '%';
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        progressFill.style.width = '100%';
                        progressText.textContent = '上传成功！';
                        showMessage('书籍上传成功，正在刷新...', 'success');
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        showMessage('上传失败: ' + xhr.responseText, 'error');
                        resetUpload();
                    }
                });

                xhr.addEventListener('error', () => {
                    showMessage('上传失败，请重试', 'error');
                    resetUpload();
                });

                xhr.open('POST', '/admin/upload');
                xhr.send(formData);
            } catch (error) {
                showMessage('上传失败: ' + error.message, 'error');
                resetUpload();
            }
        }

        function resetUpload() {
            uploadArea.classList.remove('disabled');
            progressContainer.style.display = 'none';
            fileInput.value = '';
        }
        ` : ''}

        // Delete functionality
        async function deleteBook(bookId) {
            if (!confirm('确定要删除《' + bookId + '》吗？此操作不可恢复。')) {
                return;
            }

            try {
                const response = await fetch('/admin/delete/' + bookId, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showMessage('删除成功', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    const error = await response.text();
                    showMessage('删除失败: ' + error, 'error');
                }
            } catch (error) {
                showMessage('删除失败: ' + error.message, 'error');
            }
        }
    </script>
</body>
</html>`;
}
