# 行动手帐项目上下文

## 语言要求
- **所有 AI 回复必须使用中文**
- 代码注释使用中文
- 错误信息和用户提示使用中文
- 变量名和函数名保持英文（编程规范）

## 项目概述
这是一个 Vue 3 + TypeScript 的每日任务管理和日记应用。

## 技术栈
- 前端：Vue 3 + Vite + TypeScript + Pinia
- 样式：SCSS + CSS Variables
- 数据库：Supabase (PostgreSQL)
- 本地缓存：localStorage（作为后备存储）

## 数据库配置

### Supabase 信息
- Project URL: `https://hqqosectpxavzpkkgzqx.supabase.co`
- 环境变量配置在 `.env.local` 文件中

### 数据库表结构

```sql
-- 每日记录表
CREATE TABLE daily_records (
  id TEXT PRIMARY KEY,           -- 日期 YYYY-MM-DD
  date DATE NOT NULL,
  journal TEXT DEFAULT '',
  mood TEXT,                     -- 'happy' | 'neutral' | 'sad' | 'excited' | 'tired'
  is_sealed BOOLEAN DEFAULT FALSE,
  completion_rate INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sealed_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id)  -- 用户关联
);

-- 任务表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id TEXT REFERENCES daily_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',  -- 'high' | 'medium' | 'low'
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id)  -- 用户关联
);

-- 用户资料表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nickname TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS 策略（行级安全）
- 所有表启用 RLS，用户只能访问自己的数据
- 策略通过 `user_id = auth.uid()` 过滤
- 仅认证用户（`TO authenticated`）可操作

## 数据层架构

```
src/services/
├── supabase.ts      # Supabase 客户端初始化
├── database.ts      # 数据库 CRUD 操作
└── storage.ts       # 统一存储接口（优先数据库，回退 localStorage）
```

### 存储策略
1. 写入时：同步写 localStorage（快速响应），异步写 Supabase
2. 读取时：先从 localStorage 快速加载，再异步从数据库同步最新数据
3. 数据库不可用时：自动回退到 localStorage

## 用户认证

### 认证方式
- 使用 Supabase Auth 的 Magic Link（邮箱登录链接）
- 无需密码，用户输入邮箱后收到登录链接
- 支持新用户自动注册

### 认证相关文件
- `src/services/auth.ts` - 认证服务（发送 Magic Link、登出、会话管理）
- `src/stores/auth.ts` - 认证状态管理（Pinia store）
- `src/views/LoginView.vue` - 登录页面
- `src/components/auth/` - 认证相关组件

### 路由守卫
- `requiresAuth: true` - 需要登录才能访问的页面
- `guestOnly: true` - 仅未登录用户可访问（如登录页）
- 未登录用户访问受保护页面会重定向到 `/login`

### 认证流程
1. 用户输入邮箱，点击"发送登录链接"
2. Supabase 发送 Magic Link 到用户邮箱
3. 用户点击邮件中的链接，自动登录并跳转回应用
4. 登录状态通过 `useAuthStore` 管理

## 个人中心

### 功能
- 显示用户头像和昵称
- 修改昵称
- 上传/更换头像（存储在 Supabase Storage）
- 显示使用统计（总任务数、完成率、连续天数等）
- 登出功能

### 相关文件
- `src/views/ProfileView.vue` - 个人中心页面
- `src/stores/profile.ts` - 用户资料状态管理
- `src/services/profile.ts` - 用户资料服务
- `src/services/avatar.ts` - 头像上传服务
- `src/components/profile/` - 个人中心组件

## 番茄钟

### 功能
- 标准番茄工作法：25分钟专注 + 5分钟短休息 + 15分钟长休息
- 可自定义时长设置
- 关联任务：选择当前专注的任务
- 专注记录：保存每次专注的时长和关联任务
- 统计数据：今日专注时长、完成番茄数、专注趋势

### 数据库表
```sql
-- 专注记录表
CREATE TABLE focus_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  task_id UUID REFERENCES tasks(id),
  duration INTEGER NOT NULL,        -- 专注时长（秒）
  completed BOOLEAN DEFAULT TRUE,   -- 是否完成
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 相关文件
- `src/views/PomodoroView.vue` - 番茄钟页面
- `src/stores/pomodoro.ts` - 番茄钟状态管理
- `src/services/pomodoro.ts` - 番茄钟服务（记录保存）
- `src/components/pomodoro/` - 番茄钟组件
  - `TimerDisplay.vue` - 计时器显示
  - `TimerControls.vue` - 控制按钮
  - `TaskSelector.vue` - 任务选择器
  - `PomodoroSettings.vue` - 设置面板
  - `PomodoroStats.vue` - 统计数据

## 仪表盘（Dashboard）

### 功能
- 登录后的默认首页，展示全局概览
- 个性化问候语（早上好/下午好/晚上好 + 昵称）
- 今日任务卡片：显示最多 5 个任务，支持勾选完成
- 日记卡片：显示最近 3 条日记摘要
- 统计卡片：本周完成任务数、写日记天数、连续打卡天数
- 玻璃拟态风格，响应式布局

### 相关文件
- `src/views/DashboardView.vue` - 仪表盘页面
- `src/services/dashboard.ts` - 仪表盘数据服务
- `src/components/dashboard/` - 仪表盘组件
  - `WelcomeHeader.vue` - 欢迎区域
  - `TaskCard.vue` - 任务卡片
  - `JournalCard.vue` - 日记卡片
  - `StatsCard.vue` - 统计卡片

## 封存优化（解封 + 日记本）

### 解封功能
- 已封存记录可以解封，继续编辑后再次封存
- 解封操作需要确认对话框防止误操作
- 今日页面和归档详情页都支持解封
- 再次封存时更新 sealedAt 时间

### 日记本功能
- 单一日记文本框改为多条目日记本模式
- 每条日记带时间戳，按时间倒序显示
- 支持添加、编辑、删除日记条目
- 每条日记可关联心情，整体心情取最后一条带心情的条目

### 日记本书架
- 书架式展示所有日记本，按月份分组
- 书本样式卡片设计，显示日期、条目数、主要心情
- 仪表盘首页显示最近 3 本日记预览
- 独立页面：`/journal-bookshelf`

### 数据库表
```sql
-- 日记条目表
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id TEXT REFERENCES daily_records(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

### 相关文件
- `src/views/JournalBookshelfView.vue` - 日记本书架页面
- `src/services/seal.ts` - 解封服务
- `src/services/journal.ts` - 日记条目服务
- `src/services/bookshelf.ts` - 日记本书架服务
- `src/components/journal/JournalEntryList.vue` - 日记条目列表
- `src/components/journal/JournalEntryItem.vue` - 日记条目项
- `src/components/journal/JournalBookshelf.vue` - 日记本书架
- `src/components/journal/JournalBookCard.vue` - 日记本卡片
- `src/components/common/ConfirmDialog.vue` - 确认对话框

## 用户体验与性能优化

### 骨架屏加载
- 数据加载时显示骨架屏占位符
- 脉冲动画效果表示加载中
- 加载完成平滑过渡到实际内容

### 空状态
- 任务/日记/归档列表为空时显示友好提示
- 包含引导文案和操作按钮
- 精美 emoji 图标作为视觉元素

### 微交互动画
- 任务勾选完成动画
- 任务添加/删除滑入滑出动画
- 页面切换过渡动画
- 卡片悬停上浮效果
- 按钮按压反馈

### 虚拟滚动
- 归档列表超过 50 条时启用
- 仅渲染可视区域项目，保持 60fps
- 预加载上下各 5 条作为缓冲区

### 相关文件
- `src/components/skeleton/SkeletonLoader.vue` - 骨架屏加载器
- `src/components/skeleton/SkeletonCard.vue` - 骨架屏卡片
- `src/components/common/EmptyState.vue` - 空状态组件
- `src/components/common/LoadingSpinner.vue` - 加载动画
- `src/components/common/VirtualList.vue` - 虚拟滚动列表
- `src/composables/useVirtualScroll.ts` - 虚拟滚动 composable
- `src/composables/useAnimation.ts` - 动画 composable

## 个人中心手帐风格

### 设计特点
- 纸张纹理背景，网格/点阵图案
- 胶带装饰元素
- 头像以贴纸形式展示（白边、阴影、微旋转）
- 统计数据以手绘风格徽章展示
- 印章按压动画效果

### 相关文件
- `src/views/ProfileView.vue` - 个人中心页面（手帐风格）
- `src/components/profile/ProfileHeader.vue` - 头像贴纸区域
- `src/components/profile/ProfileStats.vue` - 统计徽章
- `src/components/profile/ProfileActions.vue` - 操作按钮

## 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/login` | LoginView | 登录页（guestOnly） |
| `/dashboard` | DashboardView | 仪表盘首页（登录后默认） |
| `/home` | HomeView | 今日任务和日记 |
| `/archive` | ArchiveView | 历史归档列表 |
| `/detail/:id` | DetailView | 归档详情 |
| `/stats` | StatsView | 数据统计 |
| `/pomodoro` | PomodoroView | 番茄钟 |
| `/profile` | ProfileView | 个人中心 |
| `/journal-bookshelf` | JournalBookshelfView | 日记本书架 |

## 关键文件

### Stores（状态管理）
- `src/stores/daily.ts` - 今日数据
- `src/stores/archive.ts` - 历史归档
- `src/stores/auth.ts` - 用户认证
- `src/stores/profile.ts` - 用户资料
- `src/stores/pomodoro.ts` - 番茄钟
- `src/stores/settings.ts` - 应用设置

### Services（服务层）
- `src/services/database.ts` - 数据库操作
- `src/services/auth.ts` - 认证服务
- `src/services/profile.ts` - 用户资料
- `src/services/pomodoro.ts` - 番茄钟
- `src/services/seal.ts` - 解封服务
- `src/services/journal.ts` - 日记条目
- `src/services/bookshelf.ts` - 日记本书架
- `src/services/dashboard.ts` - 仪表盘数据
- `src/services/stats.ts` - 统计数据
- `src/services/export.ts` - 数据导出

### Composables（组合式函数）
- `src/composables/useAutoSave.ts` - 自动保存
- `src/composables/useTheme.ts` - 主题切换
- `src/composables/useVirtualScroll.ts` - 虚拟滚动
- `src/composables/useAnimation.ts` - 动画效果

### 其他
- `src/types/index.ts` - 类型定义
- `src/router/index.ts` - 路由配置
