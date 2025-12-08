# Implementation Plan

- [x] 1. 创建基础装饰组件





  - [x] 1.1 创建 TapeDecoration 胶带装饰组件


    - 实现 position、color、rotation 属性
    - 使用 CSS 创建胶带视觉效果（半透明、条纹纹理）
    - 支持 5 种预设位置
    - _Requirements: 1.2, 5.1_
  - [x] 1.2 编写 TapeDecoration 组件单元测试


    - 测试不同 position 属性的渲染
    - 测试颜色变体
    - _Requirements: 1.2, 5.1_

- [x] 2. 创建手帐页面卡片组件






  - [x] 2.1 创建 JournalPageCard 组件

    - 实现纸张纹理背景（CSS 点阵/网格图案）
    - 添加微妙的纸张边缘效果
    - 支持深色模式适配
    - _Requirements: 1.1, 5.4_
  - [x] 2.2 编写 JournalPageCard 组件单元测试


    - 测试插槽内容渲染
    - 测试样式类应用
    - _Requirements: 1.1_

- [x] 3. 创建头像贴纸组件





  - [x] 3.1 创建 AvatarSticker 组件


    - 实现贴纸效果（白边、阴影、旋转）
    - 旋转角度随机生成在 -3° 到 3° 范围内
    - 实现悬停抬起动画
    - 支持点击上传功能
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 3.2 实现无头像占位符


    - 使用 CSS 绘制手绘风格占位图标
    - 保持与贴纸效果一致的样式
    - _Requirements: 2.4_
  - [x] 3.3 编写 AvatarSticker 属性测试


    - **Property 2: Avatar Rotation Range**
    - **Validates: Requirements 2.2**
  - [x] 3.4 编写 AvatarSticker 属性测试

    - **Property 3: Placeholder Display**
    - **Validates: Requirements 2.4**

- [x] 4. 创建统计徽章组件





  - [x] 4.1 创建 StatsBadge 单个徽章组件


    - 实现手绘风格边框（CSS border-radius 变化）
    - 实现数字计数动画（从 0 到目标值）
    - 实现悬停印章按压效果
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.2 创建 StatsBadgeRow 徽章行组件


    - 水平排列多个 StatsBadge
    - 响应式布局适配
    - _Requirements: 4.3_
  - [x] 4.3 编写 StatsBadge 属性测试


    - **Property 4: Counting Animation Interpolation**
    - **Validates: Requirements 3.3**

- [x] 5. Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. 重构 ProfileView 页面






  - [x] 6.1 整合新组件到 ProfileView

    - 使用 JournalPageCard 作为主容器
    - 集成 TapeDecoration 装饰
    - 替换原有头像区域为 AvatarSticker
    - 替换原有统计区域为 StatsBadgeRow
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 实现交错淡入动画

    - 页面加载时元素依次淡入
    - 支持 prefers-reduced-motion
    - _Requirements: 6.1, 6.4_

  - [x] 6.3 优化昵称编辑过渡动画

    - 视图/编辑模式平滑切换
    - _Requirements: 6.2_
  - [x] 6.4 实现头像上传加载状态


    - 手帐风格的加载指示器
    - _Requirements: 6.3_

  - [x] 6.5 编写功能保持属性测试


    - **Property 1: Functionality Preservation**
    - **Validates: Requirements 1.3**

- [x] 7. 可访问性和性能优化





  - [x] 7.1 确保装饰元素不阻挡交互


    - 设置正确的 pointer-events
    - 验证所有按钮和输入可点击
    - _Requirements: 5.3_

  - [x] 7.2 实现减少动画偏好支持

    - 检测 prefers-reduced-motion
    - 禁用或简化动画
    - _Requirements: 6.4_

  - [x] 7.3 编写装饰非干扰属性测试

    - **Property 5: Decorative Non-Interference**
    - **Validates: Requirements 5.3**

  - [x] 7.4 编写减少动画属性测试

    - **Property 6: Reduced Motion Respect**
    - **Validates: Requirements 6.4**

- [x] 8. 清理和收尾






  - [x] 8.1 移除旧的 ProfileHeader、ProfileStats、ProfileActions 组件


    - 删除不再使用的组件文件
    - 更新 components/profile/index.ts 导出
    - _Requirements: 1.3_

  - [x] 8.2 响应式布局调整

    - 移动端布局优化
    - 确保手帐风格在小屏幕上保持美观
    - _Requirements: 4.4_

- [x] 9. Final Checkpoint - 确保所有测试通过




  - Ensure all tests pass, ask the user if questions arise.
