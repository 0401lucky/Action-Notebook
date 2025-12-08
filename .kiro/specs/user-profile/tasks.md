# 实现计划

- [x] 1. 创建数据库表和类型定义





  - [x] 1.1 在 Supabase 中创建 user_profiles 表和 RLS 策略


    - 执行 SQL 创建表结构
    - 配置行级安全策略
    - 创建 avatars 存储桶
    - _需求: 5.1_
  - [x] 1.2 扩展 TypeScript 类型定义


    - 在 `src/types/index.ts` 添加 UserProfile 接口
    - 添加 ProfileError 和 ProfileResult 类型
    - _需求: 5.1, 5.4_

- [x] 2. 实现用户资料服务层





  - [x] 2.1 创建 ProfileService 服务


    - 创建 `src/services/profile.ts`
    - 实现 getProfile、updateProfile、updateNickname 方法
    - 实现昵称验证函数 validateNickname
    - _需求: 2.2, 2.3, 2.4, 5.1, 5.2_
  - [x] 2.2 编写属性测试：有效昵称保存


    - **Property 3: 有效昵称保存**
    - **验证: 需求 2.2**

  - [x] 2.3 编写属性测试：空白昵称拒绝

    - **Property 4: 空白昵称拒绝**
    - **验证: 需求 2.3**
  - [x] 2.4 编写属性测试：超长昵称拒绝


    - **Property 5: 超长昵称拒绝**
    - **验证: 需求 2.4**
  - [x] 2.5 创建 AvatarService 服务


    - 创建 `src/services/avatar.ts`
    - 实现 uploadAvatar、deleteAvatar 方法
    - 实现文件验证函数 validateFile
    - _需求: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 2.6 编写属性测试：无效文件格式拒绝


    - **Property 6: 无效文件格式拒绝**
    - **验证: 需求 3.3**
  - [x] 2.7 编写属性测试：用户资料往返一致性


    - **Property 7: 用户资料往返一致性**
    - **验证: 需求 5.1, 5.4**

- [x] 3. 检查点 - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。

- [x] 4. 实现状态管理





  - [x] 4.1 创建 ProfileStore


    - 创建 `src/stores/profile.ts`
    - 实现用户资料状态管理
    - 实现加载、更新昵称、更新头像 actions
    - _需求: 1.1, 1.2, 1.3, 1.4, 2.2, 3.2_
  - [x] 4.2 编写 ProfileStore 单元测试


    - 创建 `src/stores/profile.test.ts`
    - 测试状态更新和错误处理
    - _需求: 5.3_

- [x] 5. 实现 UI 组件





  - [x] 5.1 创建 ProfileHeader 组件


    - 创建 `src/components/profile/ProfileHeader.vue`
    - 实现头像显示和上传功能
    - 实现昵称显示和编辑功能
    - _需求: 1.2, 1.3, 2.1, 2.5, 3.1_
  - [x] 5.2 编写属性测试：昵称显示逻辑


    - **Property 1: 昵称显示逻辑**
    - **验证: 需求 1.2**
  - [x] 5.3 编写属性测试：头像显示逻辑


    - **Property 2: 头像显示逻辑**
    - **验证: 需求 1.3**
  - [x] 5.4 创建 ProfileStats 组件


    - 创建 `src/components/profile/ProfileStats.vue`
    - 显示任务完成数、连续打卡天数、封存记录数
    - _需求: 6.1, 6.2, 6.3_
  - [x] 5.5 创建 ProfileActions 组件


    - 创建 `src/components/profile/ProfileActions.vue`
    - 实现退出登录按钮和确认对话框
    - _需求: 4.1, 4.2, 4.3_

- [x] 6. 创建个人中心页面





  - [x] 6.1 创建 ProfileView 页面


    - 创建 `src/views/ProfileView.vue`
    - 整合 ProfileHeader、ProfileStats、ProfileActions 组件
    - 实现页面布局和样式
    - _需求: 1.1, 1.4_
  - [x] 6.2 配置路由


    - 在 `src/router/index.ts` 添加 /profile 路由
    - 设置 requiresAuth: true
    - _需求: 1.1_
  - [x] 6.3 在 AppHeader 用头像替换邮箱显示


    - 修改 `src/components/common/AppHeader.vue`
    - 将原来显示邮箱的位置替换为用户头像
    - 点击头像跳转到个人中心页面
    - 无头像时显示默认头像图标
    - _需求: 1.1, 1.3_

- [x] 7. 最终检查点 - 确保所有测试通过





  - 确保所有测试通过，如有问题请询问用户。
