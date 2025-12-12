<script setup lang="ts">
/**
 * StatsBadgeRow 组件 - 统计徽章行容器
 * 
 * 功能：
 * - 水平排列多个 StatsBadge
 * - 响应式布局适配
 * 
 * @module components/profile/StatsBadgeRow
 * Requirements: 4.3
 */
import StatsBadge from './StatsBadge.vue'

// Props
interface StatItem {
  value: number
  label: string
  icon: string
  color?: string
}

interface Props {
  stats: StatItem[]
  animate?: boolean  // 是否启用数字动画，默认 true
}

withDefaults(defineProps<Props>(), {
  animate: true
})

// 默认颜色配置
const defaultColors = [
  'var(--color-success)',   // 绿色 - 完成任务
  'var(--color-warning)',   // 橙色 - 连续天数
  'var(--color-primary)'    // 主色 - 封存记录
]

// 获取徽章颜色
function getBadgeColor(stat: StatItem, index: number): string {
  return stat.color || defaultColors[index % defaultColors.length]
}
</script>

<template>
  <div class="stats-badge-row" role="group" aria-label="使用统计">
    <TransitionGroup 
      name="badge-stagger" 
      tag="div" 
      class="badges-container"
      appear
    >
      <StatsBadge
        v-for="(stat, index) in stats"
        :key="stat.label"
        :value="stat.value"
        :label="stat.label"
        :icon="stat.icon"
        :color="getBadgeColor(stat, index)"
        :animate="animate"
        :style="{ '--i': index }"
        class="badge-item"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.stats-badge-row {
  width: 100%;
}

.badges-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.badge-item {
  // 交错动画延迟
  --i: 0;
}

// 徽章交错进入动画
.badge-stagger-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: calc(var(--i) * 0.15s);
}

.badge-stagger-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8) rotate(-5deg);
}

.badge-stagger-leave-active {
  transition: all 0.3s ease-out;
}

.badge-stagger-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

// 减少动画偏好支持
@media (prefers-reduced-motion: reduce) {
  .badge-stagger-enter-active,
  .badge-stagger-leave-active {
    transition: none;
  }
  
  .badge-stagger-enter-from {
    opacity: 1;
    transform: none;
  }
}

// 响应式布局
@include until-md {
  .badges-container {
    gap: var(--spacing-md);
  }
}

@include until-sm {
  .badges-container {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .badge-item {
    width: 100%;
  }
}
</style>
