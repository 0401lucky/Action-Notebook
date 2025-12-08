<template>
  <div class="timer-display">
    <!-- 圆形进度指示器 -->
    <div class="timer-display__circle">
      <svg 
        class="timer-display__svg" 
        viewBox="0 0 200 200"
        :class="{ 'timer-display__svg--break': isBreakMode }"
      >
        <!-- 背景圆环 -->
        <circle
          class="timer-display__track"
          cx="100"
          cy="100"
          :r="radius"
          fill="none"
          :stroke-width="strokeWidth"
        />
        <!-- 进度圆环 -->
        <circle
          class="timer-display__progress"
          :class="{ 'timer-display__progress--break': isBreakMode }"
          cx="100"
          cy="100"
          :r="radius"
          fill="none"
          :stroke-width="strokeWidth"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="progressOffset"
          stroke-linecap="round"
        />
      </svg>
      
      <!-- 时间显示 -->
      <div class="timer-display__time">
        <span 
          class="timer-display__digits"
          :class="{ 'timer-display__digits--break': isBreakMode }"
        >
          {{ formattedTime }}
        </span>
        <span class="timer-display__mode">
          {{ modeLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TimerMode } from '@/types'

interface Props {
  /** 剩余秒数 */
  remainingSeconds: number
  /** 总秒数 */
  totalSeconds: number
  /** 当前模式 */
  currentMode: TimerMode
}

const props = defineProps<Props>()

// SVG 圆环参数
const radius = 85
const strokeWidth = 10
const circumference = 2 * Math.PI * radius

/**
 * 格式化时间显示 (MM:SS)
 */
const formattedTime = computed(() => {
  const minutes = Math.floor(props.remainingSeconds / 60)
  const seconds = props.remainingSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

/**
 * 进度偏移量（用于 SVG stroke-dashoffset）
 * 从顶部开始，顺时针方向
 */
const progressOffset = computed(() => {
  if (props.totalSeconds === 0) return circumference
  const progress = props.remainingSeconds / props.totalSeconds
  return circumference * progress
})

/**
 * 是否为休息模式
 */
const isBreakMode = computed(() => {
  return props.currentMode === 'shortBreak' || props.currentMode === 'longBreak'
})

/**
 * 模式标签
 */
const modeLabel = computed(() => {
  switch (props.currentMode) {
    case 'focus':
      return '专注中'
    case 'shortBreak':
      return '短休息'
    case 'longBreak':
      return '长休息'
    default:
      return ''
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;

.timer-display {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-lg);

  &__circle {
    position: relative;
    width: 240px;
    height: 240px;

    @include until-sm {
      width: 200px;
      height: 200px;
    }
  }

  &__svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg); // 从顶部开始
    filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.2));

    &--break {
      filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.2));
    }
  }

  &__track {
    stroke: var(--bg-tertiary);
  }

  &__progress {
    stroke: var(--color-primary);
    transition: stroke-dashoffset 0.3s ease;

    &--break {
      stroke: var(--color-success);
    }
  }

  &__time {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
  }

  &__digits {
    font-size: 3rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: 2px;

    &--break {
      color: var(--color-success);
    }

    @include until-sm {
      font-size: 2.5rem;
    }
  }

  &__mode {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
  }
}
</style>
