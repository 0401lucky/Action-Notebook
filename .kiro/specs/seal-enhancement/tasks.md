# 实现计划

- [x] 1. 更新数据模型和类型定义






  - [x] 1.1 更新 `src/types/index.ts` 添加 JournalEntry 类型


    - 定义 JournalEntry 接口（id、content、mood、createdAt）
    - 更新 DailyRecord 接口添加 journalEntries 字段
    - _Requirements: 6.1, 6.2_

  - [x] 1.2 创建数据库迁移文件


    - 创建 `supabase/migrations/20241202_create_journal_entries.sql`
    - 创建 journal_entries 表
    - 设置 RLS 策略
    - _Requirements: 6.1_

- [x] 2. 实现日记条目服务








  - [x] 2.1 创建 `src/services/journal.ts` 服务文件
    - 实现 addJournalEntry 函数
    - 实现 editJournalEntry 函数
    - 实现 deleteJournalEntry 函数
    - 实现 getOverallMood 函数（获取整体心情）
    - 实现 sortEntriesByTime 函数（按时间倒序排序）
    - 实现 validateEntryContent 函数（验证非空白）
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 8.3, 9.4_

  - [x] 2.2 编写属性测试：日记条目添加
    - **Property 4: 日记条目添加**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 2.3 编写属性测试：日记条目排序
    - **Property 5: 日记条目排序**
    - **Validates: Requirements 6.3**

  - [x] 2.4 编写属性测试：空白日记拒绝
    - **Property 6: 空白日记拒绝**
    - **Validates: Requirements 8.3**

  - [x] 2.5 编写属性测试：日记条目删除
    - **Property 7: 日记条目删除**
    - **Validates: Requirements 7.3**

  - [x] 2.6 编写属性测试：整体心情取值
    - **Property 9: 整体心情取值**
    - **Validates: Requirements 9.4**

- [x] 3. 实现解封服务







  - [x] 3.1 更新 `src/services/seal.ts` 或在 daily store 中添加解封逻辑


    - 实现 unsealRecord 函数
    - 保留原有 sealedAt 作为历史参考
    - _Requirements: 1.2, 1.5_

  - [x] 3.2 编写属性测试：解封状态切换


    - **Property 1: 解封状态切换**
    - **Validates: Requirements 1.2, 1.5**

  - [x] 3.3 编写属性测试：解封后可编辑


    - **Property 2: 解封后可编辑**
    - **Validates: Requirements 1.3, 1.4**

  - [x] 3.4 编写属性测试：再次封存时间更新


    - **Property 3: 再次封存时间更新**
    - **Validates: Requirements 5.2**

  - [x] 3.5 编写属性测试：封存后不可编辑日记


    - **Property 8: 封存后不可编辑日记**
    - **Validates: Requirements 7.4**

- [x] 4. 更新 Daily Store






  - [x] 4.1 更新 `src/stores/daily.ts`


    - 添加 journalEntries 状态管理
    - 实现 addJournalEntry action
    - 实现 editJournalEntry action
    - 实现 deleteJournalEntry action
    - 实现 unsealDay action
    - 添加 overallMood getter
    - 实现数据迁移逻辑（旧 journal 字段迁移到 journalEntries）
    - _Requirements: 1.2, 6.1, 7.1, 7.3, 9.4_

- [x] 5. 检查点 - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 6. 创建通用确认对话框组件







  - [x] 6.1 创建 `src/components/common/ConfirmDialog.vue`

    - 接收 visible、title、message、confirmText、cancelText props
    - 实现确认和取消事件
    - 使用玻璃拟态风格
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. 更新封存按钮组件







  - [x] 7.1 更新 `src/components/journal/SealButton.vue`

    - 已封存时显示"已封存 · 点击解封"
    - 点击时显示确认对话框
    - 调用 store 的 unsealDay action
    - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [x] 8. 创建日记条目组件






  - [x] 8.1 创建 `src/components/journal/JournalEntryItem.vue`


    - 显示时间标签和内容
    - 显示心情 emoji（如有）
    - 编辑和删除按钮（未封存时显示）
    - _Requirements: 6.4, 7.1, 7.2_

  - [x] 8.2 创建 `src/components/journal/JournalEntryList.vue`


    - 按时间倒序显示所有条目
    - 处理编辑和删除事件
    - _Requirements: 6.3_

  - [x] 8.3 更新 `src/components/journal/JournalEditor.vue`


    - 改为多条目输入模式
    - 添加日记输入框和"添加"按钮
    - 集成 JournalEntryList 组件
    - 集成心情选择器
    - _Requirements: 6.1, 9.1, 9.2, 9.3_

- [x] 9. 实现日记本书架服务






  - [x] 9.1 创建 `src/services/bookshelf.ts`


    - 实现 groupRecordsByMonth 函数
    - 实现 getJournalEntryCount 函数
    - _Requirements: 10.2, 10.3_


  - [x] 9.2 编写属性测试：日记本按月分组

    - **Property 10: 日记本按月分组**
    - **Validates: Requirements 10.2**

- [x] 10. 创建日记本书架组件






  - [x] 10.1 创建 `src/components/journal/JournalBookCard.vue`


    - 书本样式卡片设计
    - 显示日期、心情 emoji、条目数量
    - 悬浮动画效果
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 10.2 创建 `src/components/journal/JournalBookshelf.vue`


    - 按月份分组显示日记本
    - 支持 compact 模式（仪表盘预览）
    - 玻璃拟态风格
    - _Requirements: 10.1, 10.2, 10.4, 11.4_

- [x] 11. 创建日记本书架页面






  - [x] 11.1 创建 `src/views/JournalBookshelfView.vue`


    - 完整的日记本书架页面
    - 页面标题"我的日记本"
    - 集成 JournalBookshelf 组件
    - _Requirements: 10.1, 13.3_


  - [x] 11.2 更新路由配置

    - 添加 /journals 路由
    - 设置 requiresAuth: true
    - _Requirements: 13.2_

  - [x] 11.3 更新导航


    - 在 AppHeader 添加"日记本"导航链接
    - _Requirements: 13.1_

- [x] 12. 更新仪表盘







  - [x] 12.1 更新 `src/components/dashboard/JournalCard.vue`

    - 使用迷你书架预览替换原有列表
    - 显示最近 3 本日记
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 13. 更新详情页







  - [x] 13.1 更新 `src/views/DetailView.vue`

    - 添加"解封编辑"按钮
    - 实现解封后跳转到今日页面
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 14. 更新数据库服务







  - [x] 14.1 更新 `src/services/database.ts`

    - 添加 journal_entries 表的 CRUD 操作
    - 更新 saveDailyRecord 保存日记条目
    - 更新 loadDailyRecord 加载日记条目
    - _Requirements: 6.1_

- [x] 15. 最终检查点 - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。
