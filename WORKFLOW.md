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

```bash
rsync -avz --delete \
  --exclude 'node_modules' --exclude '.next' --exclude '.next-public' \
  --exclude '.git' --exclude 'data/*.db' --exclude 'data/*.db-*' \
  /mnt/d/Code/liguiyu-home/ \
  Server:/vol1/1000/Docker/liguiyu-home/
```

⚠️ 必须排除 `data/`（数据库）和 `.env`（密钥）。

### Step 4: 通知桂鱼重建

同步完成后告诉桂鱼重建命令（桂鱼自己执行）：

```bash
ssh Server
cd /vol1/1000/Docker/liguiyu-home
sudo docker compose up -d --build
```

---

## NAS 环境速查

| 项目 | 值 |
|------|-----|
| SSH 别名 | `Server` |
| 项目路径 | `/vol1/1000/Docker/liguiyu-home` |
| 容器名 | `liguiyu-home`（公开站, 3090→3000）, `liguiyu-admin`（管理后台, 3091→3000） |
| sudo 密码 | `1.gary2.gary.lgy.LGY` |

---

## 重要规则

1. **龙虾不能自己重建 Docker**——需要 sudo 密码，交给桂鱼操作
2. **每次修改后必须本地 build 验证**——不过不 sync
3. **rsync 必须排除 data/ 和 .env**——防止覆盖生产数据库和密钥
4. **代码同步后明确告知重建命令**——一句 `ssh Server && cd ... && sudo docker compose up -d --build`

---

*最后更新：2026-05-14 由龙虾 🦞 记录*
