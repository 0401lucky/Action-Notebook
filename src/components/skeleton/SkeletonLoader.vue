<template>
  <Transition :name="transition" mode="out-in">
    <div v-if="loading" class="skeleton-loader" key="skeleton">
      <!-- 骨架屏插槽 -->
      <slot name="skeleton">
        <div class="skeleton-loader__default">
          <div class="skeleton-loader__placeholder skeleton-pulse"></div>
        </div>
      </slot>
    </div>
    <div v-else key="content" class="skeleton-loader__content">
      <!-- 实际内容插槽 -->
      <slot></slot>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * SkeletonLoader 骨架屏加载器组件
 * 根据 loading 状态切换显示骨架屏或实际内容
 * Requirements: 1.1, 1.2
 */

interface Props {
  /** 是否显示骨架屏 */
  loading: boolean
  /** 过渡动画名称，默认 'skeleton-fade' */
  transition?: string
}

withDefaults(defineProps<Props>(), {
  transition: 'skeleton-fade'
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.skeleton-loader {
  width: 100%;
  
  &__default {
    padding: var(--spacing-md);
  }
  
  &__placeholder {
    height: 100px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
  }
  
  &__content {
    width: 100%;
  }
}

// 脉冲动画效果
.skeleton-pulse {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 骨架屏专用过渡动画 - 更自然的效果
.skeleton-fade-enter-active {
  transition: opacity 0.4s ease-out;
}

.skeleton-fade-leave-active {
  transition: opacity 0.3s ease-in;
}

.skeleton-fade-enter-from,
.skeleton-fade-leave-to {
  opacity: 0;
}

// 内容淡入上浮效果
.skeleton-fade-enter-active .skeleton-loader__content,
.skeleton-fade-leave-active .skeleton-loader__content {
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.skeleton-fade-enter-from .skeleton-loader__content {
  opacity: 0;
  transform: translateY(12px);
}

.skeleton-fade-leave-to .skeleton-loader__content {
  opacity: 0;
}
</style>
