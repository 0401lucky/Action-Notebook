# Implementation Plan

- [x] 1. 安装依赖和项目配置








  - [x] 1.1 安装 Tiptap 相关依赖包


    - 安装 @tiptap/vue-3、@tiptap/starter-kit、@tiptap/extension-placeholder
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

  - [x] 1.2 配置 TypeScript 类型声明

    - 确保 Tiptap 类型正确识别
    - _Requirements: 1.1_

- [x] 2. 实现富文本工具函数






  - [x] 2.1 创建 richText.ts 服务文件

    - 实现 validateRichContent 函数（验证 HTML 内容非空白）
    - 实现 normalizeContent 函数（纯文本转 HTML 兼容）
    - 实现 stripHtmlTags 函数（提取纯文本用于预览）
    - _Requirements: 6.1, 6.2_
  - [x] 2.2 编写属性测试：HTML 序列化往返一致性


    - **Property 6: HTML 序列化往返一致性**
    - **Validates: Requirements 6.4**

  - [x] 2.3 编写属性测试：内容验证正确性

    - **Property 8: 空内容显示占位符**
    - **Validates: Requirements 7.4**

- [x] 3. 实现 useRichTextEditor Composable





  - [x] 3.1 创建 useRichTextEditor.ts


    - 封装 Tiptap Editor 实例创建和销毁
    - 实现 getHTML、setContent、focus、clear 方法
    - 配置扩展：StarterKit、Placeholder
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1_
  - [x] 3.2 编写属性测试：格式化应用正确性


    - **Property 1: 文本格式化应用正确性**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [x] 3.3 编写属性测试：列表格式化正确性

    - **Property 2: 列表格式化正确性**
    - **Validates: Requirements 2.1, 2.2**

- [x] 4. Checkpoint - 确保所有测试通过






  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 实现 EditorToolbar 组件






  - [x] 5.1 创建 EditorToolbar.vue 组件

    - 实现工具栏按钮：加粗(B)、斜体(I)、删除线(S)、无序列表(•)、有序列表(1.)、引用块(")、代码块(</>)
    - 按钮分组布局：文本格式 | 列表 | 区块，使用分隔线区分
    - 按钮尺寸 32x32px，圆角 var(--radius-md)
    - 默认状态：透明背景，var(--text-secondary) 颜色
    - 悬停状态：var(--bg-tertiary) 背景
    - 激活状态：var(--color-primary-fade) 背景，var(--color-primary) 颜色
    - 实现快捷键提示 tooltip（Ctrl+B、Ctrl+I 等）
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.2 编写属性测试：工具栏状态一致性

    - **Property 5: 工具栏状态与光标位置一致性**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 6. 实现 RichTextEditor 组件




  - [x] 6.1 创建 RichTextEditor.vue 组件

    - 集成 useRichTextEditor composable
    - 集成 EditorToolbar 组件
    - 实现 v-model 双向绑定
    - 实现 readonly 模式（隐藏工具栏，禁用编辑）
    - 实现 Ctrl+Enter 提交快捷键
    - _Requirements: 1.4, 1.5, 7.1, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 6.2 编写属性测试：只读模式

    - **Property 7: 只读模式不可编辑**
    - **Validates: Requirements 7.1**

  - [x] 6.3 编写属性测试：引用块切换幂等性

    - **Property 3: 引用块切换幂等性**
    - **Validates: Requirements 3.1, 3.2**

- [x] 7. Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. 集成到 JournalEditor





  - [x] 8.1 修改 JournalEditor.vue


    - 将 textarea 替换为 RichTextEditor 组件
    - 更新 handleAdd 函数使用 HTML 内容
    - 保持现有的 MoodPicker 和提交逻辑
    - _Requirements: 6.1, 8.5_

  - [x] 8.2 修改 JournalEntryItem.vue

    - 使用 v-html 渲染富文本内容
    - 编辑模式使用 RichTextEditor 替换 textarea
    - _Requirements: 6.2, 6.3_

  - [x] 8.3 更新 journal.ts 服务

    - 修改 validateEntryContent 支持 HTML 内容验证
    - _Requirements: 6.1_

- [x] 9. 添加富文本样式






  - [x] 9.1 创建编辑器样式文件

    - 添加 editor.scss 定义富文本渲染样式
    - 引用块样式：3px 左边框(var(--color-primary))、var(--color-primary-fade) 背景、斜体、圆角
    - 代码块样式：var(--bg-tertiary) 背景、'Fira Code' 等宽字体、var(--font-size-sm)、圆角、横向滚动
    - 列表样式：var(--spacing-xl) 左内边距
    - 编辑区域最小高度 120px
    - _Requirements: 3.3, 4.2_

  - [x] 9.2 添加响应式样式

    - 移动端工具栏：flex-wrap 换行、按钮尺寸增大到 36x36px、隐藏分隔线
    - 移动端编辑区域：最小高度 100px
    - 断点：max-width 480px
    - _Requirements: 7.2_

- [x] 10. Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. 更新相关展示组件

  - [x] 11.1 更新 JournalCard.vue（仪表盘日记卡片）
    - 使用 stripHtmlTags 显示纯文本摘要
    - _Requirements: 6.2_

  - [x] 11.2 更新 JournalBookCard.vue（日记本书架卡片）
    - 使用 stripHtmlTags 显示纯文本预览
    - _Requirements: 6.2_

  - [x] 11.3 编写属性测试：代码块空白保留

    - **Property 4: 代码块空白保留**
    - **Validates: Requirements 4.3**

- [x] 12. Final Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.

