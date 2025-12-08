<template>
  <BaseCard class="stats-card" :hoverable="true">
    <template #header>
      <h3 class="stats-card__title">📊 本周概览</h3>
    </template>

    <!-- 统计数据 -->
    <div class="stats-card__content">
      <div class="stats-card__item">
        <span class="stats-card__icon">✅</span>
        <div class="stats-card__info">
          <span class="stats-card__value">{{ animatedTasks }}</span>
          <span class="stats-card__label">完成任务</span>
        </div>
      </div>

      <div class="stats-card__item">
        <span class="stats-card__icon">📝</span>
        <div class="stats-card__info">
          <span class="stats-card__value">{{ animatedJournals }}</span>
          <span class="stats-card__label">日记天数</span>
        </div>
      </div>

      <div class="stats-card__item">
        <span class="stats-card__icon">🔥</span>
        <div class="stats-card__info">
          <span class="stats-card__value">{{ animatedStreak }}</span>
          <span class="stats-card__label">连续打卡</span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
/**
 * 数据概览卡片组件
 * 显示本周完成任务数、日记天数、连续打卡天数
 * 使用玻璃拟态风格和数字增长动画
 */
import { ref, watch, onMounted } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'

// Props 定义
const props = defineProps<{
  weeklyCompletedTasks: number
  weeklyJournalDays: number
  consecutiveDays: number
}>()

// 动画数值
const animatedTasks = ref(0)
const animatedJournals = ref(0)
const animatedStreak = ref(0)

// 动画持续时间（毫秒）
const ANIMATION_DURATION = 800

/**
 * 数字增长动画函数
 * @param start 起始值
 * @param end 目标值
 * @param duration 动画持续时间
 * @param callback 每帧回调，接收当前值
 */
function animateNumber(
  start: number,
  end: number,
  duration: number,
  callback: (value: number) => void
): void {
  if (start === end) {
    callback(end)
    return
  }

  const startTime = performance.now()
  const diff = end - start

  function step(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用 easeOutQuart 缓动函数
    const easeProgress = 1 - Math.pow(1 - progress, 4)
    const currentValue = Math.round(start + diff * easeProgress)
    
    callback(currentValue)

    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }

  requestAnimationFrame(step)
}

/**
 * 启动所有数字动画
 */
function startAnimations() {
  animateNumber(0, props.weeklyCompletedTasks, ANIMATION_DURATION, (v) => {
    animatedTasks.value = v
  })
  animateNumber(0, props.weeklyJournalDays, ANIMATION_DURATION, (v) => {
    animatedJournals.value = v
  })
  animateNumber(0, props.consecutiveDays, ANIMATION_DURATION, (v) => {
    animatedStreak.value = v
  })
}

// 组件挂载时启动动画
onMounted(() => {
  startAnimations()
})

// 监听 props 变化，重新启动动画
watch(
  () => [props.weeklyCompletedTasks, props.weeklyJournalDays, props.consecutiveDays],
  () => {
    startAnimations()
  }
)
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
@use '@/assets/styles/responsive.scss' as *;

.stats-card {
  height: 100%;

  &__title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  &__content {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-md);
    
    @include until-sm {
      flex-direction: column;
    }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
    padding: var(--spacing-md);
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);

    &:hover {
      background: var(--bg-hover);
      transform: scale(1.02);
    }
    
    @include until-sm {
      justify-content: flex-start;
    }
  }

  &__icon {
    font-size: var(--font-size-2xl);
    line-height: 1;
  }

  &__info {
    @include flex-column;
    gap: var(--spacing-xs);
  }

  &__value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    line-height: 1;
  }

  &__label {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    white-space: nowrap;
  }
}
</style>
