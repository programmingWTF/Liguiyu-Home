# 文章更新指南

## 方式一：直接更新 NAS 上的文件（最快）

所有文章存储在 NAS 的这个目录：
```
/vol1/1000/Docker/liguiyu-home/data/posts/
```

每篇文章由两个文件组成：
- `{slug}.json` — 元数据（标题、日期、描述、标签）
- `{slug}.html` — 文章正文 HTML

### 修改已有文章
1. SSH 到 NAS：`ssh Server`
2. 编辑 HTML：`vi /vol1/1000/Docker/liguiyu-home/data/posts/{slug}.html`
3. 如果需要改标题/日期/标签，同步编辑 `.json` 文件
4. **不需要重启 Docker**，刷新网页即生效

### 删除文章
```bash
ssh Server
rm /vol1/1000/Docker/liguiyu-home/data/posts/{slug}.json
rm /vol1/1000/Docker/liguiyu-home/data/posts/{slug}.html
# 无需重启，动态路由自动 404
```

### 添加新文章
1. 在 `D:\Code\VSCode\HomePage\content\posts\` 写 `.md` 文件
2. 告诉我"导入新文章"，我帮你生成 slug + HTML + JSON
3. 或者手动：
   - 把 Markdown 转成 HTML
   - 创建 `{slug}.json` 和 `{slug}.html`
   - 放到 NAS 的 `data/posts/` 目录
   - 无需重启

## 当前文章 slug 对照

| slug | 标题 |
|------|------|
| programming-practice-1 | 2026.04.01 程序设计实训课程 题目解析 |
| programming-practice-2 | 2026.04.09 程序设计实训课程 题目解析 |
| programming-practice-3 | 2026.04.15 程序设计实训课程 题目解析 |
| point-cloud-pipeline | C++程序设计课程设计：点云流水线架构设计 |
| cpp-pointer-memory | C/C++ 之指针与内存管理 |
| agent-sudo-nas | 打破次元壁：当我的龙虾拿到 sudo 权限并接管了我的 NAS |

## JSON 格式参考
```json
{
  "slug": "my-new-post",
  "title": "我的新文章标题",
  "date": "2026-05-12",
  "description": "文章简介，200字以内",
  "keywords": "标签1, 标签2, 标签3",
  "author": "liguiyu"
}
```
