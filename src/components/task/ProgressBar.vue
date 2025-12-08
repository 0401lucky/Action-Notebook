<template>
  <div class="progress-bar">
    <div class="progress-bar__header">
      <div class="progress-info">
        <span class="progress-bar__label">今日进度</span>
        <span class="progress-bar__percentage">{{ percentage }}%</span>
      </div>
      <div class="progress-bar__stats" v-if="showStats">
        <span class="progress-bar__stat">
          {{ completedCount }} / {{ totalCount }}
        </span>
      </div>
    </div>
    <div class="progress-bar__track">
      <div
        class="progress-bar__fill"
        :class="{ 'progress-animated': animated }"
        :style="{ width: `${percentage}%` }"
      >
        <div class="progress-glow"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  percentage: number
  animated?: boolean
  completedCount?: number
  totalCount?: number
  showStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  animated: true,
  completedCount: 0,
  totalCount: 0,
  showStats: true
})

// Clamp percentage between 0 and 100
const percentage = computed(() => {
  return Math.min(100, Math.max(0, Math.round(props.percentage)))
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;

.progress-bar {
  padding: var(--spacing-md);
  background: var(--glass-bg);
  backdrop-filter: var(--backdrop-blur);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-sm);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--spacing-sm);
  }
  
  .progress-info {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-sm);
  }

  &__label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
  }

  &__percentage {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    line-height: 1;

    @include until-sm {
      font-size: var(--font-size-xl);
    }
  }

  &__track {
    height: 12px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);

    @include until-sm {
      height: 10px;
    }
  }

  &__fill {
    position: relative;
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--color-primary) 0%,
      var(--color-accent) 100%
    );
    border-radius: var(--radius-full);
    transition: width var(--transition-slow);

    &.progress-animated {
      animation: progress-fill var(--transition-slow) ease-out;
    }
  }
  
  .progress-glow {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 20px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    filter: blur(2px);
    animation: shimmer 2s infinite;
  }

  &__stat {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    font-weight: var(--font-weight-medium);
    background: var(--bg-secondary);
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }
}

@keyframes progress-fill {
  from { width: 0; }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(500%); }
}
</style>
