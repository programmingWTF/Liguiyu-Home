# liguiyu-home 项目管理手册

## 文件分布清单

### 本地开发机（Windows + WSL）

| 路径 | 说明 |
|------|------|
| `D:\Code\liguiyu-home\` | 项目源代码（WSL挂载: `/mnt/d/Code/liguiyu-home/`） |
| `D:\Code\liguiyu-home\app\` | Next.js 应用代码 |
| `D:\Code\liguiyu-home\app\components\` | React 组件（Navbar, Hero, About, Blog, Tools, Footer等） |
| `D:\Code\liguiyu-home\app\lib\` | 后端库（auth.ts, db.ts, email.ts, admin.ts） |
| `D:\Code\liguiyu-home\app\api\` | API 路由 |
| `D:\Code\liguiyu-home\app\auth\` | 登录/注册/验证页面 |
| `D:\Code\liguiyu-home\app\admin\` | 管理后台页面 |
| `D:\Code\liguiyu-home\Dockerfile` | Docker 构建配置 |
| `D:\Code\liguiyu-home\docker-compose.yml` | Docker Compose 配置 |
| `D:\Code\liguiyu-home\.env.local` | 本地开发环境变量 |
| `D:\Code\liguiyu-home\.env.production` | 生产环境变量 |
| `D:\Code\liguiyu-home\package.json` | 依赖配置 |

### NAS 服务器（通过 `ssh Server` 访问）

| 路径 | 说明 |
|------|------|
| `/vol1/1000/Docker/liguiyu-home/` | 部署目录（完整源码副本） |
| `/vol1/1000/Docker/liguiyu-home/.env` | 实际生效的环境变量（从 .env.production 复制） |
| `/vol1/1000/Docker/liguiyu-home/data/liguiyu.db` | SQLite 数据库（用户数据持久化） |
| Docker 容器名 | `liguiyu-home` |
| 容器端口 | `3090:3000`（NAS:3090 → 容器:3000） |

### 关键技术栈

- **框架**: Next.js 16.2.6 (App Router) + TypeScript + Tailwind CSS v4
- **认证**: next-auth@5.0.0-beta.25 (credentials 密码登录)
- **数据库**: better-sqlite3 (SQLite, 文件: data/liguiyu.db)
- **发邮件**: Resend (resend.com, API Key 在环境变量)
- **部署**: Docker (Dockerfile 多阶段构建)
- **域名**: test.liguiyu.com（Cloudflare Tunnel → NAS:3090）
- **DNS**: Cloudflare

### 环境变量 (.env)

```
AUTH_SECRET=***
RESEND_API_KEY=re_3Lc...tTKw
ADMIN_EMAILS=3477492305@qq.com
AUTH_URL=（可选，默认留空使用请求域名）
```

## NAS 运维命令

```bash
# SSH 登录
ssh Server

# 进入项目目录
cd /vol1/1000/Docker/liguiyu-home

# 重新构建+启动（代码有改动时）
sudo docker compose up -d --build

# 重启（只改环境变量时）
sudo docker compose up -d --force-recreate

# 查看日志
sudo docker logs liguiyu-home

# 查看容器状态
sudo docker ps | grep liguiyu

# 操作数据库
sudo docker exec liguiyu-home node -e "
  const Database = require('better-sqlite3');
  const db = new Database('./data/liguiyu.db');
  // 你的 SQL 查询
  db.close();
"
```

## 新会话快速启动指南

如果你开了新会话，告诉我这些就能让我快速理解项目：

1. **"这是 liguiyu-home 项目"** — 我会查找 `D:\Code\liguiyu-home\`
2. **"在 NAS 上用 Docker 部署"** — 项目在 `/vol1/1000/Docker/liguiyu-home/`
3. **"NAS SSH 别名是 Server"** — `ssh Server` 直达
4. **"管理员邮箱是 3477492305@qq.com"** — admin 权限

或者直接说：**"帮我继续 liguiyu-home 项目，代码在 D:\Code\liguiyu-home，部署在 NAS 的 /vol1/1000/Docker/liguiyu-home，NAS 密码是 1.gary2.gary.lgy.LGY"**

**⚠️ 重要：NAS Docker 操作需要 sudo 密码**，每次都要 sudo。如果直接 SSH 上去有 Docker 权限问题，用这个方式：
```bash
ssh Server "echo '1.gary2.gary.lgy.LGY' | sudo -S docker compose up -d --build"
```

## 项目技术要点（给后续会话的备忘）

### 认证系统
- 登录: `POST /api/auth/callback/credentials` → 邮箱+密码 → bcrypt 验证
- 注册: `POST /api/auth/register` → 邮箱+密码+验证码 → 创建用户
- 验证码: `POST /api/auth/send-code` → Resend 发邮件 → 存入 verification_codes 表
- 会话: JWT，cookie `__Secure-next-auth.session-token`
- trustHost: true（允许多域名）
- Cookie secure: false（HTTP 可用）
- 登录成功后 `signIn("credentials", { redirect: false })` → `window.location.href = "/"`
- Navbar 用 `useSession()` 检测登录状态，AuthButton 组件

### 数据库
- SQLite 文件: `data/liguiyu.db`
- 表: users, sessions, verification_codes
- users 字段: id, email, name, password_hash, email_verified, role, login_code, login_code_expires
- 管理员: role='admin'，由 ADMIN_EMAILS 环境变量自动分配

### 深色/浅色模式
- ThemeProvider: 默认跟随系统，localStorage 持久化
- CSS: `html.dark` class 控制，text-heading/text-body/text-sub 等工具类
- 导航栏: useLightText / showNavBg 控制颜色

### Docker 构建注意事项
- npm install 需要 `--legacy-peer-deps`（next-auth 与 Next.js 16 兼容问题）
- 通过 Dockerfile 中的 `.npmrc` 设置 `legacy-peer-deps=true`
- better-sqlite3 需要 python3 make g++（在 builder 和 runner 阶段都要装）
- rsync 同步时务必排除 data/ 和 .env/，禁止用 --delete 以免删掉数据库
- .env 文件必须存在于部署目录，通过 docker compose 的 env_file 加载
