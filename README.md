# Pokaboo Wiki

![Vue](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)

一个现代化的个人 Wiki 知识库，专为长期学习与知识积累打造。拥有类似 Notion + Obsidian 的沉浸式阅读与编辑体验，以及 GitHub 风格的学习贡献图。

## 🌟 核心特性

- **模块化知识体系**：无限层级树形菜单，支持自定义专属色彩与图标。
- **现代化编辑体验**：集成 ByteMD，支持 Markdown、代码高亮与 LaTeX 公式渲染，双屏实时预览。
- **动态知识统计**：在首页直观查看学习总时长、连续天数，以及 GitHub 风格的全年学习贡献热力图。
- **全局极速搜索**：支持 `Ctrl+K` 全局快捷键呼出毛玻璃搜索弹窗，快速定位笔记。
- **云端持久化存储**：无缝接入 Supabase，开启 Row Level Security (RLS) 行级权限与邮件注册登录，保护个人知识资产。
- **极致设计美学**：全局支持深色模式 (Dark Mode)，大面积使用毛玻璃 (Glassmorphism) 与平滑过渡微动画，图标全量采用等宽极简的 Remix Icon。

## 🛠 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **UI & 样式**: Tailwind CSS v3 + Typography 插件
- **图标库**: Remix Icon
- **Markdown 引擎**: ByteMD
- **数据可视化**: Apache ECharts
- **BaaS 服务**: Supabase

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Pokaboo/Pokaboo-wiki.git
cd Pokaboo-wiki
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库 (Supabase)

1. 登录并创建一个 [Supabase](https://supabase.com) 项目。
2. 将本项目根目录的 `supabase_setup.sql` 中的 SQL 脚本粘贴到 Supabase 的 **SQL Editor** 中执行，这会自动建表并开启 RLS 权限策略。
3. 复制 `.env.example` 并重命名为 `.env.local`。
4. 在 `.env.local` 中填入您的 Supabase 凭证：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 运行项目

```bash
npm run dev
```

默认运行在 `http://localhost:5173`。首次进入会重定向至登录页，随意使用邮箱注册一个账号即可体验！

## 📝 目录结构

```text
src/
├── components/
│   ├── common/        # 搜索弹窗等全局组件
│   └── layout/        # 侧边栏与主布局
├── router/            # 路由与 Auth 拦截守卫
├── store/             # 基于 Pinia 的全局状态与 Supabase 交互
├── types/             # 数据库实体的 TypeScript 定义
├── utils/             # 工具函数 (Supabase Client 实例化等)
├── views/             # 页面组件 (首页、登录、笔记阅读器等)
└── App.vue            # 根组件
```

## 🔒 隐私与安全

本项目数据库全面启用了 RLS，您的笔记和模块等所有信息均绑定了特定的 `user_id`。如果将应用部署到公共环境（例如 Vercel），没有您的账号密码也绝对无法获取任何一条数据。
