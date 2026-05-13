# ARCHITECTURE.md — liguiyu.com 架构与动画设计

> 写给第一次看这个项目源码的人。

---

## 一、项目概览

**liguiyu.com** 是李桂聿的个人网站，承载博客、作品展示、管理后台。

| 维度 | 选型 |
|------|------|
| 框架 | Next.js 16 App Router + TypeScript |
| 样式 | Tailwind CSS v4 + 全局 CSS |
| 动画 | Framer Motion + Three.js |
| 认证 | next-auth v5 (credentials) |
| 数据库 | SQLite (better-sqlite3) |
| 部署 | Docker 双实例（公开站 + 管理后台） |
| 域名 | liguiyu.com（Cloudflare Tunnel → NAS） |

---

## 二、目录结构

```
app/
├── layout.tsx              # 根布局（字体、Providers）
├── page.tsx                # 首页（Hero + About + Blog + Tools + Footer）
├── globals.css             # 全局样式 + 动画 CSS 变量
├── components/
│   ├── PageGlow.tsx         # 鼠标跟随光晕
│   ├── StarfieldBackground.tsx  # Three.js 粒子星空
│   ├── ClickRipple.tsx      # 点击涟漪
│   ├── InteractiveSection.tsx   # 视差滚动容器
│   ├── Navbar.tsx           # 导航栏
│   ├── Hero.tsx             # 首屏
│   ├── About.tsx            # 关于
│   ├── Blog.tsx             # 首页博客预览
│   ├── Tools.tsx            # 工具箱
│   ├── Footer.tsx           # 页脚
│   ├── TiltCard.tsx         # 3D 倾斜卡片
│   ├── GlobalGrid.tsx       # 背景网格线
│   ├── AmbientBackground.tsx # 环境光背景
│   ├── Providers.tsx        # SessionProvider 等
│   └── ThemeProvider.tsx    # 深色/浅色模式
├── blog/
│   ├── page.tsx             # 文章列表页
│   ├── blog-list-client.tsx # 博客列表客户端组件
│   └── [slug]/
│       ├── page.tsx         # 文章详情页
│       ├── article-content.tsx  # 文章内容渲染（含 admonition/KaTeX/highlight.js/复制按钮）
│       ├── article-toc.tsx  # 侧边栏目录
│       ├── back-to-list.tsx # 返回列表
│       ├── back-to-top.tsx  # 回到顶部
│       ├── comments.tsx     # 评论区
│       └── reading-progress.tsx # 阅读进度条
├── admin/
│   ├── layout.tsx           # 管理后台布局（独立 metadata）
│   └── page.tsx             # 管理后台页面
├── auth/                    # 登录/注册/验证页面
├── api/                     # API 路由
└── lib/                     # 工具库
```

---

## 三、页面布局架构

```
┌──────────────────────────────────────┐
│  StarfieldBackground (Three.js 星空) │ ← z: 0
├──────────────────────────────────────┤
│  GlobalGrid (CSS 网格线)              │ ← z: 0
├──────────────────────────────────────┤
│  ClickRipple (点击涟漪)               │ ← z: 1
├──────────────────────────────────────┤
│  PageGlow (鼠标跟随光晕)              │ ← z: 2 (screen blend)
├──────────────────────────────────────┤
│  InteractiveSection (视差容器)        │
│    ├── Navbar                        │
│    ├── Hero                          │
│    ├── About                         │
│    ├── Blog 预览                      │
│    ├── Tools                         │
│    └── Footer                        │
│  （文章页）                           │
│    ├── ReadingProgress               │
│    ├── ArticleToc (侧边栏目录)         │
│    ├── ArticleContent                │
│    ├── BlogComments                  │
│    └── BackToTop                     │
├──────────────────────────────────────┤
│  ThemeToggle / Providers             │
└──────────────────────────────────────┘
```

---

## 四、动画设计详解

### 4.1 粒子星空 (StarfieldBackground)

**技术栈**：Three.js WebGL，`AdditiveBlending`

**设计理念**：用三层不同颜色不同速度的粒子流营造"穿越星空"的沉浸感。粒子从屏幕深处向观察者流动，模拟空间穿越。

**三层粒子**：

| 层 | 颜色 | 数量(dark/light) | 大小 | 速度 | 鼠标交互 |
|----|------|-----------------|------|------|----------|
| 青蓝 | `#0081c0` | 2800/2000 | 0.025/0.02 | -0.003 | 相机微移 |
| 浅蓝 | `#41a1cf` | 1800/1200 | 0.018/0.015 | -0.004 | 相机微移 |
| 白/灰 | `#ffffff`/`#666666` | 600/400 | 0.012/0.01 | -0.002 | 相机微移 |

**动画逻辑**：
- 每帧更新每个粒子的 Z 坐标（`positions[i] += speed`）
- 粒子飞出视野（Z > 5）后重置到远处随机位置
- 鼠标移动时相机位置平滑跟随（`lerp factor 0.04`，产生惯性感）
- 点击时 `clickBurst` 瞬间加速所有粒子（×0.92 衰减），相机 FOV 瞬时扩大

**关键细节**：使用 `dt * 60` 做帧率无关的时间缩放，确保不同刷新率设备体验一致。

---

### 4.2 鼠标跟随光晕 (PageGlow)

**技术栈**：Framer Motion (`useMotionValue` + `useTransform`) + CSS `mix-blend-mode: screen`

**设计理念**：鼠标周围一个柔和的蓝色径向渐变，通过 `screen` 混合模式让下方的文字和内容微微变亮，模拟"探照灯"效果。

**动画逻辑**：
- `useMotionValue` 存储鼠标归一化坐标 (0~1)
- `useTransform` 将坐标映射为百分比字符串（`${x}%`）
- 径向渐变：`600px circle at X% Y%，蓝色 → 透明`
- `mix-blend-mode: screen` 让光晕与下层内容混合——文字区域变亮

**为什么 `useMotionValue` 而不是 React state**：
- `useMotionValue` 的 `set()` 不会触发 React re-render
- 只有订阅了该 motion value 的 `motion.div`（通过 `useTransform`）会直接在 GPU 层更新
- 性能极高，60fps 无压力

**渐变参数**：
```
中心: rgba(70,140,210,0.24)   ← 圆心在鼠标位置
50%:  rgba(40,110,190,0.08)   ← 平滑过渡
75%:  transparent              ← 边缘完全透明
```

---

### 4.3 点击涟漪 (ClickRipple)

**技术栈**：Framer Motion (`AnimatePresence`)

**设计理念**：每次鼠标点击产生一个扩散的蓝色圆环，2 秒后自动消失。

**动画序列**：
1. 圆环从半径 0 开始，扩散到 `min(window.innerWidth, window.innerHeight) * 0.8`
2. 同时透明度从 0.15 衰减到 0
3. `AnimatePresence` 管理涟漪数组的生命周期（自动清理）

**关键细节**：每次点击记录坐标（`e.clientX, e.clientY`），涟漪在该位置独立渲染。

---

### 4.4 文章目录侧边栏 (ArticleToc)

**技术栈**：Framer Motion (`AnimatePresence` + `motion.aside`)

**设计理念**：左侧滑入/滑出的垂直目录，与内容滚动同步高亮当前章节。

**动画序列**：
- **展开**：`x: -260 → 0, opacity: 0 → 1`，时长 0.5s，缓动 `[0.16, 1, 0.3, 1]`（ease-out expo）
- **收起**：反向 `x: 0 → -260, opacity: 1 → 0`，同样时长和缓动
- **箭头旋转**：`rotate: 0 → 180`，时长 0.3s（跟随按钮状态）
- **按钮位移**：`left: 0 → 220`（跟随侧边栏展开），时长 0.5s，完全同步

**滚动高亮**：`scroll` 事件 + `getBoundingClientRect()` 检测当前可见标题，匹配到后高亮对应目录项（颜色变蓝、左侧边框出现、字体加粗）。

---

### 4.5 文章列表卡片 hover (BlogListClient)

**技术栈**：Framer Motion (`whileHover`)

**设计理念**：鼠标悬停时卡片微微上浮 + 放大 + 蓝色发光，模拟"浮起"的物理感。

**动画参数**：
- `whileHover={{ scale: 1.02, y: -4, zIndex: 10 }}`
- 间距：`space-y-6`（24px），确保放大后不会覆盖相邻卡片
- 光晕：卡片 hover 时 box-shadow 出现 `0 0 40px rgba(0,129,192,0.15)` 蓝色光晕

**列表动画**：`AnimatePresence mode="popLayout"` 实现搜索/筛选时的卡片增删动画（淡入淡出 + Y 轴位移）。

---

### 4.6 文章内容链接 hover (article a / .blog-content a)

**技术栈**：CSS `transition` + `::after` 伪元素

**设计理念**：hover 时从左侧展开一条下划线，同时文字颜色变亮、向上浮 1px。三条动画同时触发，丝滑不突兀。

**动画细节**：
| 动画 | 属性 | 时长 | 缓动 |
|------|------|------|------|
| 下划线展开 | `width: 0 → 100%` | 0.3s | ease |
| 颜色变亮 | `color: #41a1cf → #5eb8e6` | 0.2s | ease |
| 向上浮 | `transform: translateY(0 → -1px)` | 0.2s | ease |

**技术要点**：
- 用 `::after` 伪元素绘制下划线（1px 高度），不增加 DOM 节点
- `pointer-events: none` 确保下划线不阻挡点击
- `position: relative` 在 `<a>` 上创建定位上下文
- `currentColor` 让下划线颜色自动跟随链接颜色

---

### 4.7 代码块复制按钮 (Code Copy)

**技术栈**：原生 DOM 操作 + CSS transition

**设计理念**：每个 `<pre>` 代码块右上角出现 "📋 复制" 按钮，点击后变为 "✅ 已复制" 2 秒后恢复。模仿 VSCode / GitHub 的交互模式。

**动画细节**：
- 按钮默认微妙蓝色（`rgba(0,129,192,0.08)` bg）
- hover 时蓝色加深 + 出现 `box-shadow` 光晕
- 点击后 `.copied` 状态：颜色变为主题蓝 + glow 增强
- 所有过渡 `0.25s ease`

**实现技巧**：
- 用 `wrapper div` 包裹 `<pre>`，按钮绝对定位在 wrapper 右上角
- 使用 `navigator.clipboard.writeText()` API，fallback 为选中文本
- `article-content.tsx` 中独立函数 `attachCopyButtons()` 在三个时机调用：
  1. useEffect 末尾（初始渲染）
  2. highlight.js onload 后（高亮完成后）
  3. KaTeX renderMath 后（数学渲染完成后，因为 `innerHTML` 赋值会重置 DOM）

---

### 4.8 Admonition 块处理

**技术栈**：原生 DOM 操作（非 React 渲染）

**设计理念**：Markdown 的 `[!NOTE]` / `[!TIP]` / `[!WARNING]` / `[!CAUTION]` 等标记通过正则匹配，转换为带颜色边框和背景的提示块。

**处理流程**：
1. `mergeAdjacent()`：合并相邻的非标记 blockquote（去掉 `>` 前缀）
2. `processAdmonitions()`：识别标记 blockquote，收集后续内容，替换为 styled div
3. 每种类型有独立配色（NOTE 蓝、TIP 绿、WARNING 黄、CAUTION 红）

---

### 4.9 阅读进度条 (ReadingProgress)

**技术栈**：Framer Motion (`useScroll`)

**设计理念**：页面顶部一条蓝色细线，随滚动进度从左到右填充。

**动画参数**：
- `useScroll()` 获取页面滚动进度
- `scaleX` 从 0 到 1，`transformOrigin: left`
- 固定 `position: fixed, top: 0, z-index: 50`
- 颜色 `#41a1cf`，高度 2px

---

### 4.10 视差滚动 (InteractiveSection)

**技术栈**：Framer Motion (`useScroll` + `useTransform`)

**设计理念**：内容区块随滚动产生微小的 Y 轴位移和透明度变化，营造纵深感。

**动画参数**：
- 每个 section 的 `y` 和 `opacity` 由 `useTransform(scrollYProgress, [入口, 出口], [偏移量, 偏移量])` 驱动
- 不同 section 有不同的视差强度（theme: "lab" 等）

---

### 4.11 3D 倾斜卡片 (TiltCard)

**技术栈**：原生 JS `mousemove` + CSS `transform`

**设计理念**：鼠标在卡片上移动时，卡片向鼠标方向倾斜（perspective 3D），产生立体感。

**动画参数**：
- `perspective: 1000px`
- `rotateX` 和 `rotateY` 由鼠标相对卡片中心的位置决定
- 最大倾斜角度约 10°
- 离开卡片时平滑回到原位（`transition: transform 0.5s ease`）

---

### 4.12 背景网格线 (GlobalGrid)

**技术栈**：CSS `background-image` + `linear-gradient`

**设计理念**：静态的细网格线背景，只在 Hero 区域显示，增强科技感。

**技术实现**：
- 使用 `repeating-linear-gradient` 创建网格线
- 颜色为极淡的白色（深色模式）或灰色（浅色模式）
- 只在 Hero 区域可见（通过 `opacity` 控制）

---

## 五、性能优化策略

| 策略 | 应用场景 |
|------|----------|
| `useMotionValue` 替代 React state | PageGlow 鼠标跟随（避免 re-render） |
| `requestAnimationFrame` 节流 | StarfieldBackground 粒子更新 |
| `useTransform` GPU 加速 | 光晕位置、视差偏移 |
| `AdditiveBlending` + `depthWrite: false` | Three.js 粒子（避免深度排序开销） |
| `passive: true` 事件监听 | scroll / mousemove |
| `Math.min(devicePixelRatio, 2)` | Three.js 渲染器（4K 屏不超采） |
| `AnimatePresence` | 自动清理已退出动画的 DOM 节点 |
| CDN 加载 KaTeX / highlight.js | 首屏不阻塞，按需加载 |

---

## 六、深色/浅色模式

所有组件通过 `useTheme()` hook 获取当前主题，CSS 通过 `html.dark` class 切换。

**关键变量**：
- `html.dark`：深色模式激活
- `html:not(.dark)`：浅色模式覆盖

所有动画组件（StarfieldBackground、PageGlow、ClickRipple 等）根据 `isDark` 调整参数（粒子数量、颜色、透明度）。

---

*最后更新：2026-05-14 由龙虾 🦞 撰写*
