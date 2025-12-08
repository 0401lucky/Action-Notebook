<template>
  <div class="skeleton-card">
    <!-- 头像占位符 -->
    <div v-if="showAvatar" class="skeleton-card__avatar skeleton-pulse"></div>
    
    <div class="skeleton-card__content">
      <!-- 图片占位符 -->
      <div v-if="showImage" class="skeleton-card__image skeleton-pulse"></div>
      
      <!-- 文本行占位符 -->
      <div class="skeleton-card__lines">
        <div 
          v-for="i in lines" 
          :key="i"
          class="skeleton-card__line skeleton-pulse"
          :style="{ width: getLineWidth(i) }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SkeletonCard 卡片骨架屏组件
 * 用于任务卡片、日记卡片等的加载占位
 * Requirements: 1.3
 */

interface Props {
  /** 文本行数，默认 3 */
  lines?: number
  /** 是否显示头像占位，默认 false */
  showAvatar?: boolean
  /** 是否显示图片占位，默认 false */
  showImage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  lines: 3,
  showAvatar: false,
  showImage: false
})

/**
 * 获取每行的宽度，最后一行较短以模拟真实文本
 */
function getLineWidth(index: number): string {
  if (index === props.lines) {
    return '60%'
  }
  return '100%'
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.skeleton-card {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  
  &__avatar {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-full);
    background: var(--bg-tertiary);
  }
  
  &__content {
    flex: 1;
    min-width: 0;
  }
  
  &__image {
    width: 100%;
    height: 120px;
    margin-bottom: var(--spacing-md);
    border-radius: var(--radius-md);
    background: var(--bg-tertiary);
  }
  
  &__lines {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  &__line {
    height: 16px;
    border-radius: var(--radius-sm);
    background: var(--bg-tertiary);
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
</style>
