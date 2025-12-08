<script setup lang="ts">
import { computed } from 'vue'
import type { DailyRecord } from '@/types'
import BaseCard from '@/components/common/BaseCard.vue'
import { stripHtmlTags } from '@/services/richText'

interface Props {
  record: DailyRecord
}

const props = defineProps<Props>()

const moodEmojis: Record<string, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  excited: '🎉',
  tired: '😴'
}

/**
 * 获取日记预览文本（纯文本）
 * 优先使用 journalEntries，回退到旧的 journal 字段
 * 使用 stripHtmlTags 移除 HTML 标签，显示纯文本摘要
 * Requirements: 6.2
 */
const journalPreview = computed(() => {
  // 优先使用新的 journalEntries
  if (props.record.journalEntries && props.record.journalEntries.length > 0) {
    // 取最新的一条日记内容，移除 HTML 标签
    const latestEntry = props.record.journalEntries[0]
    return stripHtmlTags(latestEntry.content)
  }
  // 回退到旧的 journal 字段，移除 HTML 标签
  return stripHtmlTags(props.record.journal || '')
})

/**
 * 是否有日记内容
 */
const hasJournal = computed(() => {
  return journalPreview.value.trim().length > 0
})

/**
 * 日记条目数量
 */
const journalCount = computed(() => {
  return props.record.journalEntries?.length || (props.record.journal ? 1 : 0)
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
</script>

<template>
  <BaseCard class="archive-card" :hoverable="true" :padded="true">
    <div class="archive-card__header">
      <div class="archive-card__date-wrapper">
        <span class="archive-card__date">{{ formatDate(record.date) }}</span>
        <span class="archive-card__weekday">{{ new Date(record.date).toLocaleDateString('zh-CN', { weekday: 'long' }) }}</span>
      </div>
      <span v-if="record.mood" class="archive-card__mood" :title="record.mood">
        {{ moodEmojis[record.mood] || '' }}
      </span>
    </div>

    <div class="archive-card__stats">
      <div class="archive-card__progress">
        <div class="archive-card__progress-bar">
          <div 
            class="archive-card__progress-fill"
            :style="{ width: `${record.completionRate}%` }"
            :class="{'archive-card__progress-fill--full': record.completionRate === 100}"
          />
        </div>
        <span class="archive-card__progress-text">{{ record.completionRate }}%</span>
      </div>
      <span class="archive-card__task-count">
        {{ record.tasks.filter(t => t.completed).length }}/{{ record.tasks.length }} 任务
      </span>
    </div>

    <p v-if="hasJournal" class="archive-card__journal">
      {{ truncateText(journalPreview, 100) }}
      <span v-if="journalCount > 1" class="archive-card__journal-count">
        共 {{ journalCount }} 条
      </span>
    </p>
    <p v-else class="archive-card__journal archive-card__journal--empty">
      暂无日记
    </p>

    <div v-if="record.tasks.length > 0" class="archive-card__tags">
      <span
        v-for="tag in [...new Set(record.tasks.flatMap(t => t.tags))].slice(0, 3)"
        :key="tag"
        class="archive-card__tag"
      >
        #{{ tag }}
      </span>
      <span v-if="[...new Set(record.tasks.flatMap(t => t.tags))].length > 3" class="archive-card__tag-more">
        +{{ [...new Set(record.tasks.flatMap(t => t.tags))].length - 3 }}
      </span>
    </div>
  </BaseCard>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
@use '@/assets/styles/responsive.scss' as *;

.archive-card {
  height: 100%;
  @include flex-column;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    .archive-card__mood {
      transform: scale(1.1) rotate(5deg);
    }
  }

  &__header {
    @include flex-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
  }

  &__date-wrapper {
    @include flex-column;
  }

  &__date {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    line-height: 1.2;

    @include until-sm {
      font-size: var(--font-size-md);
    }
  }

  &__weekday {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin-top: 2px;
  }

  &__mood {
    font-size: 2rem;
    line-height: 1;
    transition: transform var(--transition-spring);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));

    @include until-sm {
      font-size: 1.5rem;
    }
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);

    @include until-sm {
      gap: var(--spacing-sm);
    }
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
  }

  &__progress-bar {
    flex: 1;
    height: 8px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    
    &--full {
      background: var(--color-success);
    }
  }

  &__progress-text {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    min-width: 36px;
    text-align: right;
  }

  &__task-count {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    white-space: nowrap;
    background: var(--bg-secondary);
    padding: 2px 6px;
    border-radius: 4px;
  }

  &__journal {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 0 var(--spacing-lg);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;

    &--empty {
      color: var(--text-tertiary);
      font-style: italic;
    }
  }

  &__journal-count {
    display: inline-block;
    margin-left: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    background: rgba(99, 102, 241, 0.1);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-top: auto;
  }

  &__tag {
    padding: 4px 10px;
    background: rgba(99, 102, 241, 0.1); // Using primary color RGB manually or variable if available
    color: var(--color-primary);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    transition: background var(--transition-fast);

    &:hover {
      background: rgba(99, 102, 241, 0.2);
    }
  }

  &__tag-more {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    padding: 4px 6px;
  }
}
</style>
