<template>
  <BaseCard class="pomodoro-stats" :padded="true">
    <!-- 今日完成的专注时段数量 -->
    <div class="pomodoro-stats__item">
      <div class="pomodoro-stats__icon pomodoro-stats__icon--sessions">
        🍅
      </div>
      <div class="pomodoro-stats__content">
        <span class="pomodoro-stats__value">{{ todayCompletedPomodoros }}</span>
        <span class="pomodoro-stats__label">今日专注</span>
      </div>
    </div>

    <!-- 今日累计专注时长 -->
    <div class="pomodoro-stats__item">
      <div class="pomodoro-stats__icon pomodoro-stats__icon--time">
        ⏱️
      </div>
      <div class="pomodoro-stats__content">
        <span class="pomodoro-stats__value">{{ formattedTotalTime }}</span>
        <span class="pomodoro-stats__label">累计时长</span>
      </div>
    </div>

    <!-- 当前周期进度 -->
    <div class="pomodoro-stats__item">
      <div class="pomodoro-stats__icon pomodoro-stats__icon--cycle">
        🔄
      </div>
      <div class="pomodoro-stats__content">
        <span class="pomodoro-stats__value">
          {{ completedPomodoros }}/{{ pomodorosUntilLongBreak }}
        </span>
        <span class="pomodoro-stats__label">长休息进度</span>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
/**
 * PomodoroStats - 番茄钟统计组件
 * 
 * 显示今日完成的专注时段数量和累计专注时长。
 * 
 * Requirements: 6.1, 6.2
 * - 6.1: 显示今日完成的专注时段数量
 * - 6.2: 显示今日累计专注时长（分钟）
 */
import { computed } from 'vue'
import { usePomodoroStore } from '@/stores/pomodoro'
import BaseCard from '@/components/common/BaseCard.vue'

const pomodoroStore = usePomodoroStore()

/**
 * 今日完成的专注时段数量
 * Requirements: 6.1
 */
const todayCompletedPomodoros = computed(() => {
  return pomodoroStore.todayCompletedPomodoros
})

/**
 * 今日累计专注时长（格式化）
 * Requirements: 6.2
 */
const formattedTotalTime = computed(() => {
  const minutes = pomodoroStore.totalFocusMinutes
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}小时`
  }
  return `${hours}小时${remainingMinutes}分`
})

/**
 * 当前周期内完成的专注次数
 */
const completedPomodoros = computed(() => {
  return pomodoroStore.completedPomodoros
})

/**
 * 长休息前需要的专注次数
 */
const pomodorosUntilLongBreak = computed(() => {
  return pomodoroStore.settings.pomodorosUntilLongBreak
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.pomodoro-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  
  // BaseCard handles container styles

  @include until-sm {
    gap: var(--spacing-md);
    padding: var(--spacing-sm) !important; // Override BaseCard padding for small screens if needed
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);

    @include until-sm {
      flex-direction: column;
      padding: var(--spacing-xs);
      gap: var(--spacing-xs);
    }
  }

  &__icon {
    font-size: 1.5rem;
    line-height: 1;

    @include until-sm {
      font-size: 1.25rem;
    }

    &--sessions {
      filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3));
    }

    &--time {
      filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3));
    }

    &--cycle {
      filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3));
    }
  }

  &__content {
    @include flex-column;
    gap: 2px;

    @include until-sm {
      align-items: center;
    }
  }

  &__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;

    @include until-sm {
      font-size: var(--font-size-base);
    }
  }

  &__label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);

    @include until-sm {
      font-size: 10px;
    }
  }
}
</style>
