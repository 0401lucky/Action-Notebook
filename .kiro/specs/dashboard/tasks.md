# 实现计划

- [x] 1. 创建仪表盘服务和工具函数





  - [x] 1.1 创建 `src/services/dashboard.ts` 服务文件


    - 实现 `getGreeting(hour: number): string` 函数
    - 实现 `formatDate(date: Date): string` 函数
    - 实现 `formatGreetingWithNickname(greeting: string, nickname: string | null): string` 函数
    - 实现 `formatJournalPreview(journal: string, maxLength?: number): string` 函数
    - 实现 `getMoodEmoji(mood: MoodType | null): string` 函数
    - 实现 `getWeekDateRange(referenceDate?: Date): { start: Date; end: Date }` 函数
    - 实现 `calculateWeeklyStats(records: DailyRecord[], referenceDate?: Date): WeeklyStats` 函数
    - 实现 `calculateConsecutiveDays(records: DailyRecord[], referenceDate?: Date): number` 函数
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 3.2, 4.1, 4.2, 4.3_

  - [x] 1.2 编写属性测试：时间段到问候语映射

    - **Property 1: 时间段到问候语映射**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [x] 1.3 编写属性测试：问候语与昵称组合
    - **Property 2: 问候语与昵称组合**
    - **Validates: Requirements 1.4**

  - [x] 1.4 编写属性测试：日期格式化
    - **Property 3: 日期格式化**
    - **Validates: Requirements 1.6**
  - [x] 1.5 编写属性测试：日记摘要格式化

    - **Property 7: 日记摘要格式化**
    - **Validates: Requirements 3.2**
  - [x] 1.6 编写属性测试：本周统计计算

    - **Property 8: 本周统计计算**
    - **Validates: Requirements 4.1, 4.2**
  - [x] 1.7 编写属性测试：连续打卡天数计算

    - **Property 9: 连续打卡天数计算**
    - **Validates: Requirements 4.3**

- [x] 2. 创建通用空状态组件





  - [x] 2.1 创建 `src/components/dashboard/EmptyState.vue` 组件


    - 接收 icon、message、actionText、actionRoute props
    - 使用玻璃拟态风格
    - 实现按钮点击跳转功能
    - _Requirements: 2.5, 2.6, 3.5, 3.6, 5.6_
  - [x] 2.2 创建 `src/components/dashboard/index.ts` 导出文件


    - _Requirements: 2.5_

- [x] 3. 创建欢迎区域组件





  - [x] 3.1 创建 `src/components/dashboard/WelcomeHeader.vue` 组件


    - 从 profile store 获取用户昵称
    - 调用 getGreeting 显示问候语
    - 调用 formatDate 显示当前日期
    - 使用玻璃拟态风格
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1_

- [x] 4. 创建今日任务卡片组件





  - [x] 4.1 创建 `src/components/dashboard/TaskCard.vue` 组件


    - 从 daily store 获取今日任务
    - 显示最多 5 个任务项
    - 实现任务勾选功能（调用 store 的 toggleTask）
    - 显示任务完成进度
    - 超过 5 个任务显示"查看全部"链接
    - 无任务时显示 EmptyState
    - 使用玻璃拟态风格和卡片悬浮效果
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3_
  - [x] 4.2 编写属性测试：任务列表截取


    - **Property 4: 任务列表截取**
    - **Validates: Requirements 2.1, 2.2**
  - [x] 4.3 编写属性测试：任务完成进度格式


    - **Property 5: 任务完成进度格式**
    - **Validates: Requirements 2.4**

- [x] 5. 创建最近日记卡片组件








  - [x] 5.1 创建 `src/components/dashboard/JournalCard.vue` 组件


    - 从 archive store 获取已封存日记
    - 显示最近 3 条日记摘要（日期、心情 emoji、内容预览）
    - 点击日记项跳转到详情页
    - 超过 3 条日记显示"查看全部"链接
    - 无日记时显示 EmptyState
    - 使用玻璃拟态风格和卡片悬浮效果
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.1, 5.2, 5.3_
  - [x] 5.2 编写属性测试：日记列表截取和排序


    - **Property 6: 日记列表截取和排序**
    - **Validates: Requirements 3.1, 3.3**

- [x] 6. 创建数据概览卡片组件






  - [x] 6.1 创建 `src/components/dashboard/StatsCard.vue` 组件

    - 接收统计数据 props
    - 显示本周完成任务数、本周日记天数、连续打卡天数
    - 实现数字增长动画
    - 使用玻璃拟态风格和卡片悬浮效果
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_

- [x] 7. 创建仪表盘主视图






  - [x] 7.1 创建 `src/views/DashboardView.vue` 视图

    - 组合所有子组件
    - 实现响应式布局（移动端单列，桌面端双列）
    - 协调数据加载（调用各 store 的加载方法）
    - 计算并传递统计数据给 StatsCard
    - 使用渐变背景
    - _Requirements: 5.1, 5.4, 5.5, 6.3_

- [x] 8. 配置路由






  - [x] 8.1 更新 `src/router/index.ts`

    - 添加 /dashboard 路由
    - 设置 requiresAuth: true
    - 将根路由 / 重定向到 /dashboard
    - _Requirements: 6.1, 6.2_

- [x] 9. 检查点 - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 10. 更新导航和样式





  - [x] 10.1 更新 `src/components/common/AppHeader.vue`


    - 添加仪表盘导航链接
    - _Requirements: 6.1_
  - [x] 10.2 更新组件导出文件


    - 更新 `src/components/dashboard/index.ts` 导出所有组件
    - _Requirements: 6.3_

- [x] 11. 最终检查点 - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。
