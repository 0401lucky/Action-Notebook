# 需求文档

## 简介

仪表盘首页（Dashboard）是"行动手帐"应用的核心入口页面，用户登录后首先看到的页面。该页面整合了用户的今日任务、最近日记和数据统计，提供一个全局视角的概览，帮助用户快速了解当前状态并开始一天的计划。

## 术语表

- **Dashboard（仪表盘）**: 应用的首页，展示用户数据概览的聚合页面
- **WelcomeHeader（欢迎区域）**: 显示问候语、用户昵称和当前日期的头部组件
- **TaskCard（任务卡片）**: 展示今日任务列表和完成进度的卡片组件
- **JournalCard（日记卡片）**: 展示最近日记摘要的卡片组件
- **StatsCard（统计卡片）**: 展示本周数据概览的卡片组件
- **EmptyState（空状态）**: 当没有数据时显示的引导界面
- **玻璃拟态（Glassmorphism）**: 一种 UI 设计风格，使用半透明背景、模糊效果和柔和边框

## 需求

### 需求 1

**用户故事：** 作为用户，我希望看到个性化的问候语和当前日期，以便感受到应用的温暖和实用性。

#### 验收标准

1. WHEN 用户在 00:00-11:59 访问仪表盘 THEN Dashboard 系统 SHALL 显示"早上好"问候语
2. WHEN 用户在 12:00-17:59 访问仪表盘 THEN Dashboard 系统 SHALL 显示"下午好"问候语
3. WHEN 用户在 18:00-23:59 访问仪表盘 THEN Dashboard 系统 SHALL 显示"晚上好"问候语
4. WHEN 用户已设置昵称 THEN Dashboard 系统 SHALL 在问候语后显示用户昵称（如"早上好，小明"）
5. WHEN 用户未设置昵称 THEN Dashboard 系统 SHALL 仅显示问候语（如"早上好"）
6. WHEN 仪表盘加载完成 THEN Dashboard 系统 SHALL 显示当前日期，格式为"YYYY年M月D日 星期X"（如"2025年12月2日 星期二"）

### 需求 2

**用户故事：** 作为用户，我希望在仪表盘快速查看和管理今日任务，以便高效地完成每日计划。

#### 验收标准

1. WHEN 今日有任务 THEN Dashboard 系统 SHALL 显示最多 5 个任务项
2. WHEN 今日任务超过 5 个 THEN Dashboard 系统 SHALL 显示"查看全部"链接，点击后跳转到今日页面
3. WHEN 用户点击任务项的勾选框 THEN Dashboard 系统 SHALL 切换该任务的完成状态
4. WHEN 任务列表存在 THEN Dashboard 系统 SHALL 显示任务完成进度（格式为"X/Y 已完成"）
5. WHEN 今日没有任务 THEN Dashboard 系统 SHALL 显示空状态界面，包含引导文案"还没有任务哦，添加一个开始今天的计划吧 ✨"
6. WHEN 用户点击空状态的添加按钮 THEN Dashboard 系统 SHALL 跳转到今日页面

### 需求 3

**用户故事：** 作为用户，我希望在仪表盘查看最近的日记记录，以便回顾过去的心情和想法。

#### 验收标准

1. WHEN 存在已封存的日记记录 THEN Dashboard 系统 SHALL 显示最近 3 条日记摘要
2. WHEN 显示日记摘要 THEN Dashboard 系统 SHALL 包含日期、心情 emoji 和内容预览（截取前 50 个字符）
3. WHEN 日记记录超过 3 条 THEN Dashboard 系统 SHALL 显示"查看全部"链接，点击后跳转到归档页面
4. WHEN 用户点击日记摘要项 THEN Dashboard 系统 SHALL 跳转到该日记的详情页面
5. WHEN 没有已封存的日记记录 THEN Dashboard 系统 SHALL 显示空状态界面，包含引导文案"今天发生了什么？记录下来吧 📝"
6. WHEN 用户点击空状态的记录按钮 THEN Dashboard 系统 SHALL 跳转到今日页面

### 需求 4

**用户故事：** 作为用户，我希望看到本周的数据统计，以便了解自己的完成情况和坚持程度。

#### 验收标准

1. WHEN 仪表盘加载完成 THEN Dashboard 系统 SHALL 显示本周完成的任务数量
2. WHEN 仪表盘加载完成 THEN Dashboard 系统 SHALL 显示本周写日记的天数
3. WHEN 仪表盘加载完成 THEN Dashboard 系统 SHALL 显示连续打卡天数
4. WHEN 统计数字从 0 变化到目标值 THEN Dashboard 系统 SHALL 播放数字增长动画

### 需求 5

**用户故事：** 作为用户，我希望仪表盘具有美观的视觉效果和流畅的交互体验，以便获得愉悦的使用感受。

#### 验收标准

1. WHEN 仪表盘渲染 THEN Dashboard 系统 SHALL 使用玻璃拟态风格，与登录页保持一致
2. WHEN 卡片渲染 THEN Dashboard 系统 SHALL 应用柔和阴影和圆角样式
3. WHEN 用户将鼠标悬停在卡片上 THEN Dashboard 系统 SHALL 显示微妙的悬浮效果（轻微上移和阴影增强）
4. WHEN 在移动设备上查看 THEN Dashboard 系统 SHALL 以单列布局显示所有卡片
5. WHEN 在桌面设备上查看 THEN Dashboard 系统 SHALL 以双列布局显示卡片（欢迎区域占满宽度）
6. WHEN 空状态显示 THEN Dashboard 系统 SHALL 包含精美的 emoji 图标作为视觉元素

### 需求 6

**用户故事：** 作为用户，我希望仪表盘作为登录后的默认页面，以便快速获取全局概览。

#### 验收标准

1. WHEN 用户成功登录 THEN Dashboard 系统 SHALL 将用户重定向到 /dashboard 路由
2. WHEN 未认证用户访问 /dashboard THEN Dashboard 系统 SHALL 将用户重定向到登录页面
3. WHEN 仪表盘组件挂载 THEN Dashboard 系统 SHALL 从 daily store 和 archive store 加载数据
