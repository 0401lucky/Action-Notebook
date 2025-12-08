<script setup lang="ts">
import type { TagStat } from '@/types'

interface Props {
  data: TagStat[]
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: '标签统计'
})

function getCompletionRate(stat: TagStat): number {
  if (stat.total === 0) return 0
  return Math.round((stat.completed / stat.total) * 100)
}
</script>

<template>
  <div class="tag-stats">
    <div v-if="data.length === 0" class="tag-stats__empty">
      暂无标签数据
    </div>
    
    <div v-else class="tag-stats__list">
      <div
        v-for="stat in data"
        :key="stat.tag"
        class="tag-stats__item"
      >
        <div class="tag-stats__header">
          <span class="tag-stats__tag">#{{ stat.tag }}</span>
          <span class="tag-stats__count">{{ stat.completed }}/{{ stat.total }}</span>
        </div>
        <div class="tag-stats__bar-wrapper">
          <div class="tag-stats__bar">
            <div
              class="tag-stats__fill"
              :style="{ width: `${getCompletionRate(stat)}%` }"
              :class="{ 'tag-stats__fill--full': getCompletionRate(stat) === 100 }"
            />
          </div>
          <span class="tag-stats__rate">{{ getCompletionRate(stat) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tag-stats {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__empty {
    text-align: center;
    color: var(--text-tertiary);
    padding: var(--spacing-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    font-style: italic;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    overflow-y: auto;
    max-height: 300px;
    padding-right: var(--spacing-xs);

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    transition: background var(--transition-fast);

    &:hover {
      background: rgba(0, 0, 0, 0.02);
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__tag {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    background: rgba(var(--color-primary-rgb), 0.1);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    color: var(--color-primary);
  }

  &__count {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }

  &__bar-wrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__bar {
    flex: 1;
    height: 6px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: var(--radius-full);
    overflow: hidden;
    
    @media (prefers-color-scheme: dark) {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &__fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    
    &--full {
      background: var(--color-success);
    }
  }

  &__rate {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--text-secondary);
    min-width: 32px;
    text-align: right;
  }
}
</style>
