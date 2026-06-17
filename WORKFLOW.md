# WORKFLOW.md — 龙虾协作工作流

## 标准交互模式

我和桂鱼最近磨出来一套非常高效的协作模式：

```
1. 桂鱼提需求 → 龙虾理解、分析、编码
2. 龙虾本地 `npm run build` 验证 → 编译通过
3. 龙虾 `rsync` 同步源码到 NAS → 只传差异文件
4. 桂鱼在 NAS 上 `sudo docker compose up -d --build` 重建容器
5. 桂鱼刷新浏览器验证效果 → 反馈调整
```

**为什么这样分工**：

- 龙虾负责所有代码层面的工作（分析、编写、本地验证）
- 桂鱼负责 Docker 重建（需要 sudo 密码 + 确认生产环境部署）
- 中间没有冗余的沟通环节，一轮一个反馈闭环

---

## 龙虾的操作流程

### Step 1: 定位 + 修改

```bash
# 项目在 Windows 的 D:\Code\liguiyu-home
# WSL 中通过 /mnt/d/Code/liguiyu-home 访问
cd /mnt/d/Code/liguiyu-home
```

修改相应的源文件（`.tsx`, `.css` 等）。

### Step 2: 本地构建验证

```bash
cd /mnt/d/Code/liguiyu-home && npm run build
```

必须等 build 通过（exit 0）才进入下一步。

### Step 3: 同步到 NAS

> ⚠️ **安全保护**：每次同步前必须先跑 `--dry-run` 确认不会误删，跑完检查输出无误再去掉 `--dry-run` 正式同步。

```bash
# 第一步：预演（只显示会改什么，不真的改）
rsync -avz --dry-run --delete \
  --exclude 'node_modules' --exclude '.next' --exclude '.next-public' \
  --exclude '.git' \
  --exclude '.env.local' --exclude '.env.production' \
  --exclude 'data/*.db' --exclude 'data/*.db-*' \
  --exclude 'data/posts' --exclude 'data/pdfs' \
  --exclude 'data/league-materials' \
  --exclude 'app/fonts' \
  /mnt/d/Code/liguiyu-home/ \
  Server:/vol1/1000/Docker/liguiyu-home/

# 确认预演输出里没有 deleting data/ 之类的东西后，再跑正式的：
rsync -avz --delete \
  --exclude 'node_modules' --exclude '.next' --exclude '.next-public' \
  --exclude '.git' \
  --exclude '.env.local' --exclude '.env.production' \
  --exclude 'data/*.db' --exclude 'data/*.db-*' \
  --exclude 'data/posts' --exclude 'data/pdfs' \
  --exclude 'data/league-materials' \
  --exclude 'app/fonts' \
  /mnt/d/Code/liguiyu-home/ \
  Server:/vol1/1000/Docker/liguiyu-home/
```

**排除说明**（缺一个都会丢生产数据）：
| 排除项 | 后果 |
|--------|------|
| `data/*.db` | 删掉所有用户、评论、团支书名单 |
| `data/posts/` | 删掉所有博客文章 |
| `data/pdfs/` | 删掉所有题库 PDF |
| `data/league-materials/` | 删掉所有团日上传资料 |
| `.env*` | 泄露密钥 |
| `app/fonts/` | 每次重传 20MB+ 字体文件（不会丢数据，但浪费时间和带宽） |

### Step 4: 通知桂鱼重建

同步完成后告诉桂鱼重建命令（桂鱼自己执行）：

```bash
ssh Server
cd /vol1/1000/Docker/liguiyu-home
sudo docker compose up -d --build
```

---

## NAS 环境速查

| 项目      | 值                                                                          |
| --------- | --------------------------------------------------------------------------- |
| SSH 别名  | `Server`                                                                    |
| 项目路径  | `/vol1/1000/Docker/liguiyu-home`                                            |
| 容器名    | `liguiyu-home`（公开站, 3090→3000）, `liguiyu-admin`（管理后台, 3091→3000） |
| sudo 密码 | `1.gary2.gary.lgy.LGY`                                                      |

---

## 重要规则

1. **龙虾不能自己重建 Docker**——速度太慢，浪费Tokens，交给桂鱼操作
2. **每次修改后必须本地 build 验证**——不过不 sync
3. **rsync 先 dry-run 再正式跑**——先 `--dry-run` 看有没有 deleting data/，确认安全再去掉
4. **rsync 必须排除所有 data/ 和 .env**——缺一个 exclude 就丢生产数据
5. **代码同步后明确告知重建命令**——一句 `ssh Server && cd ... && sudo docker compose up -d --build`

---

_最后更新：2025-06-05 由龙虾 🦞 记录_
