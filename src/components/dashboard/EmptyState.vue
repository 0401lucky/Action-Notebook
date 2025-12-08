<template>
  <div class="empty-state">
    <!-- 图标 -->
    <div class="empty-state__icon">{{ icon }}</div>
    
    <!-- 引导文案 -->
    <p class="empty-state__message">{{ message }}</p>
    
    <!-- 操作按钮 -->
    <router-link 
      :to="actionRoute" 
      class="empty-state__action"
    >
      {{ actionText }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
/**
 * 通用空状态组件
 * 当没有数据时显示的引导界面，使用玻璃拟态风格
 */

interface Props {
  /** emoji 图标 */
  icon: string
  /** 引导文案 */
  message: string
  /** 按钮文字 */
  actionText: string
  /** 跳转路由 */
  actionRoute: string
}

defineProps<Props>()
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.empty-state {
  @include flex-column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) var(--spacing-md);
  text-align: center;
  // Removed container styles to fit inside BaseCard
  // background: var(--glass-bg);
  // border: 1px solid var(--glass-border);
  // box-shadow: var(--glass-shadow);

  &__icon {
    font-size: 48px;
    margin-bottom: var(--spacing-md);
    animation: bounce-in 0.6s ease-out;
  }

  &__message {
    margin: 0 0 var(--spacing-lg);
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    max-width: 280px;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm) var(--spacing-lg);
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    color: var(--text-inverse);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.3);
    transition: all var(--transition-normal);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(99, 102, 241, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
