# Design Document

## Overview

本设计文档描述个人中心页面的手帐风格（Journal Style）UI 优化方案。通过引入纸张纹理、贴纸效果、胶带装饰等视觉元素，将个人中心打造成一个充满趣味性的"手帐页面"，与"行动手帐"应用的整体主题保持一致。

设计原则：
- **一致性**：与应用整体的 Indigo/Violet 主题色保持协调
- **趣味性**：通过手帐元素增加页面的个性化和趣味感
- **功能性**：装饰元素不影响核心功能的使用
- **性能**：使用纯 CSS 实现视觉效果，避免额外的图片资源

## Architecture

```
ProfileView.vue (页面容器)
├── JournalPageCard.vue (手帐页面卡片 - 新组件)
│   ├── TapeDecoration.vue (胶带装饰 - 新组件)
│   ├── AvatarSticker.vue (头像贴纸 - 重构自 ProfileHeader)
│   ├── UserInfoSection (用户信息区域)
│   │   ├── 昵称显示/编辑
│   │   ├── 邮箱显示
│   │   └── 注册时间
│   ├── StatsBadgeRow.vue (统计徽章行 - 重构自 ProfileStats)
│   │   └── StatsBadge.vue (单个统计徽章 - 新组件)
│   └── SignOutButton (退出按钮)
└── 背景装饰层
```

### 组件职责

| 组件 | 职责 | 状态 |
|------|------|------|
| ProfileView | 页面容器，数据加载，背景装饰 | 修改 |
| JournalPageCard | 手帐页面主卡片，纸张纹理效果 | 新建 |
| TapeDecoration | 可复用的胶带装饰组件 | 新建 |
| AvatarSticker | 贴纸风格的头像组件 | 新建 |
| StatsBadgeRow | 统计徽章容器 | 新建 |
| StatsBadge | 单个统计徽章，带数字动画 | 新建 |

## Components and Interfaces

### JournalPageCard

```typescript
// Props
interface JournalPageCardProps {
  // 无特殊 props，作为布局容器
}

// Slots
// default: 卡片内容
```

### TapeDecoration

```typescript
// Props
interface TapeDecorationProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center'
  color?: 'primary' | 'accent' | 'warning' | 'success'  // 默认 'primary'
  rotation?: number  // 旋转角度，默认随机 -15 到 15 度
}
```

### AvatarSticker

```typescript
// Props
interface AvatarStickerProps {
  src?: string | null      // 头像 URL
  size?: 'sm' | 'md' | 'lg' // 默认 'lg'
  editable?: boolean        // 是否可编辑，默认 true
}

// Emits
interface AvatarStickerEmits {
  (e: 'upload', file: File): void
  (e: 'click'): void
}
```

### StatsBadge

```typescript
// Props
interface StatsBadgeProps {
  value: number
  label: string
  icon: string
  color?: string  // CSS 颜色值
  animate?: boolean  // 是否启用数字动画，默认 true
}
```

### StatsBadgeRow

```typescript
// Props
interface StatsBadgeRowProps {
  stats: Array<{
    value: number
    label: string
    icon: string
    color?: string
  }>
}
```

## Data Models

本功能不涉及新的数据模型，复用现有的：

```typescript
// 现有类型 - 来自 src/types/index.ts
interface UserProfile {
  id: string
  nickname: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

// 统计数据 - 由 ProfileView 计算
interface ProfileStats {
  completedTasks: number
  consecutiveDays: number
  sealedRecords: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Functionality Preservation
*For any* user interaction (avatar upload, nickname edit, sign out), the redesigned Profile_Page should produce the same functional outcome as the original implementation.
**Validates: Requirements 1.3**

### Property 2: Avatar Rotation Range
*For any* rendered AvatarSticker component, the rotation angle should be within the range of -3 to 3 degrees.
**Validates: Requirements 2.2**

### Property 3: Placeholder Display
*For any* user without an avatar (avatarUrl is null or empty), the AvatarSticker should render a placeholder element instead of an image.
**Validates: Requirements 2.4**

### Property 4: Counting Animation Interpolation
*For any* StatsBadge with a target value N, the counting animation should interpolate from 0 to N over the animation duration, with the final displayed value equal to N.
**Validates: Requirements 3.3**

### Property 5: Decorative Non-Interference
*For any* interactive element (buttons, inputs, clickable areas) on the Profile_Page, decorative elements should not overlap or block pointer events.
**Validates: Requirements 5.3**

### Property 6: Reduced Motion Respect
*For any* animation on the Profile_Page, when the user has prefers-reduced-motion enabled, the animation should be disabled or significantly reduced.
**Validates: Requirements 6.4**

## Error Handling

| 场景 | 处理方式 |
|------|----------|
| 头像加载失败 | 显示手绘风格占位符 |
| 头像上传失败 | 显示错误提示，保持当前头像 |
| 昵称保存失败 | 显示错误提示，恢复编辑状态 |
| 统计数据加载失败 | 显示 0 值，不影响页面渲染 |

## Testing Strategy

### 测试框架
- 单元测试：Vitest
- 组件测试：@vue/test-utils
- 属性测试：fast-check

### 单元测试覆盖

1. **AvatarSticker 组件**
   - 有头像时正确渲染图片
   - 无头像时渲染占位符
   - 点击触发上传事件
   - 上传中显示加载状态

2. **StatsBadge 组件**
   - 正确显示数值和标签
   - 数字动画从 0 到目标值
   - 禁用动画时直接显示目标值

3. **TapeDecoration 组件**
   - 根据 position 属性正确定位
   - 应用正确的颜色类

### 属性测试覆盖

1. **Property 2: Avatar Rotation Range**
   - 生成随机的 AvatarSticker 实例
   - 验证 rotation 值在 [-3, 3] 范围内

2. **Property 4: Counting Animation**
   - 生成随机的目标数值 (0-10000)
   - 验证动画结束后显示值等于目标值

3. **Property 6: Reduced Motion**
   - 模拟 prefers-reduced-motion 媒体查询
   - 验证动画类/样式被正确禁用

### 测试文件结构

```
src/components/profile/
├── AvatarSticker.vue
├── AvatarSticker.test.ts
├── StatsBadge.vue
├── StatsBadge.test.ts
├── StatsBadgeRow.vue
├── TapeDecoration.vue
├── TapeDecoration.test.ts
├── JournalPageCard.vue
└── JournalPageCard.test.ts
```
