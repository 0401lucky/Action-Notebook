<script setup lang="ts">
/**
 * 日记本卡片组件
 * 
 * 以书本样式展示单个日记记录，包含：
 * - 日期标签
 * - 心情 emoji 装饰
 * - 条目数量
 * - 内容预览（纯文本）
 * - 悬浮动画效果
 * 
 * Requirements: 6.2, 11.1, 11.2, 11.3
 */
import type { DailyRecord } from '@/types'
import { getJournalEntryCount, getPrimaryMood } from '@/services/bookshelf'
import { stripHtmlTags } from '@/services/richText'

interface Props {
  /** 日记记录 */
  record: DailyRecord
  /** 紧凑模式（用于仪表盘预览） */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

// 心情 emoji 映射
const moodEmojis: Record<string, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  excited: '🎉',
  tired: '😴'
}

/**
 * 格式化日期显示
 * @param dateStr 日期字符串 YYYY-MM-DD
 * @returns 格式化的日期
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

/**
 * 获取星期几
 * @param dateStr 日期字符串
 * @returns 星期几
 */
function getWeekday(dateStr: string): string {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}

/**
 * 获取心情 emoji
 */
function getMoodEmoji(): string {
  const mood = getPrimaryMood(props.record)
  return mood ? moodEmojis[mood] || '' : ''
}

/**
 * 获取日记条目数量
 */
function getEntryCount(): number {
  return getJournalEntryCount(props.record)
}

/**
 * 获取日记内容预览（纯文本）
 * 使用 stripHtmlTags 移除 HTML 标签，显示纯文本摘要
 * Requirements: 6.2
 */
function getContentPreview(): string {
  // 优先使用新的 journalEntries
  if (props.record.journalEntries && props.record.journalEntries.length > 0) {
    // 取最新的一条日记内容
    const latestEntry = props.record.journalEntries[0]
    const plainText = stripHtmlTags(latestEntry.content)
    // 截取前 30 个字符作为预览
    return plainText.length > 30 ? plainText.slice(0, 30) + '...' : plainText
  }
  // 回退到旧的 journal 字段
  if (props.record.journal) {
    const plainText = stripHtmlTags(props.record.journal)
    return plainText.length > 30 ? plainText.slice(0, 30) + '...' : plainText
  }
  return ''
}

/**
 * 处理点击事件
 */
function handleClick(): void {
  emit('click')
}
</script>

<template>
  <div 
    class="journal-book-card"
    :class="{ 'journal-book-card--compact': compact }"
    @click="handleClick"
  >
    <!-- 书脊装饰 -->
    <div class="journal-book-card__spine"></div>
    
    <!-- 书本主体 -->
    <div class="journal-book-card__body">
      <!-- 心情装饰 -->
      <div v-if="getMoodEmoji()" class="journal-book-card__mood">
        {{ getMoodEmoji() }}
      </div>
      
      <!-- 日期信息 -->
      <div class="journal-book-card__date">
        <span class="journal-book-card__day">{{ formatDate(record.date) }}</span>
        <span class="journal-book-card__weekday">{{ getWeekday(record.date) }}</span>
      </div>
      
      <!-- 条目数量 -->
      <div class="journal-book-card__count">
        <span class="journal-book-card__count-number">{{ getEntryCount() }}</span>
        <span class="journal-book-card__count-label">条日记</span>
      </div>
      
      <!-- 内容预览（纯文本） -->
      <div v-if="getContentPreview() && !compact" class="journal-book-card__preview">
        {{ getContentPreview() }}
      </div>
      
      <!-- 完成率指示 -->
      <div class="journal-book-card__progress">
        <div 
          class="journal-book-card__progress-fill"
          :style="{ width: `${record.completionRate}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>


<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.journal-book-card {
  position: relative;
  width: 120px;
  height: 160px;
  cursor: pointer;
  perspective: 1000px;
  transition: transform var(--transition-normal);

  &:hover {
    transform: translateY(-8px) rotateY(-5deg);
    
    .journal-book-card__body {
      box-shadow: 
        var(--shadow-lg),
        8px 8px 20px rgba(0, 0, 0, 0.15);
    }
    
    .journal-book-card__spine {
      transform: translateX(-2px);
    }
    
    .journal-book-card__mood {
      transform: scale(1.2) rotate(10deg);
    }
  }

  &:active {
    transform: scale(0.95);
  }

  // 紧凑模式
  &--compact {
    width: 90px;
    height: 120px;

    .journal-book-card__body {
      padding: var(--spacing-sm);
    }

    .journal-book-card__mood {
      font-size: 1.2rem;
      top: var(--spacing-xs);
      right: var(--spacing-xs);
    }

    .journal-book-card__day {
      font-size: var(--font-size-sm);
    }

    .journal-book-card__weekday {
      font-size: var(--font-size-xs);
    }

    .journal-book-card__count-number {
      font-size: var(--font-size-lg);
    }

    .journal-book-card__count-label {
      font-size: 10px;
    }
  }

  // 书脊
  &__spine {
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--color-primary-dark) 0%,
      var(--color-primary) 50%,
      var(--color-primary-dark) 100%
    );
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    box-shadow: inset -2px 0 4px rgba(0, 0, 0, 0.2);
    transition: transform var(--transition-normal);
  }

  // 书本主体
  &__body {
    position: absolute;
    left: 10px;
    top: 0;
    right: 0;
    bottom: 0;
    @include glass-effect;
    border-left: none;
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    padding: var(--spacing-md);
    @include flex-column;
    justify-content: space-between;
    box-shadow: var(--shadow-md);
    transition: box-shadow var(--transition-normal);
    overflow: hidden;

    // 纸张纹理效果
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 20px,
        rgba(0, 0, 0, 0.02) 20px,
        rgba(0, 0, 0, 0.02) 21px
      );
      pointer-events: none;
    }
  }

  // 心情装饰
  &__mood {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    font-size: 1.5rem;
    line-height: 1;
    transition: transform var(--transition-bounce);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    z-index: 1;
  }

  // 日期信息
  &__date {
    @include flex-column;
    gap: 2px;
  }

  &__day {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    line-height: 1.2;
  }

  &__weekday {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }

  // 条目数量
  &__count {
    @include flex-column;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  &__count-number {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    line-height: 1;
  }

  &__count-label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin-top: 2px;
  }

  // 内容预览
  &__preview {
    font-size: 10px;
    color: var(--text-tertiary);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-top: var(--spacing-xs);
    padding-top: var(--spacing-xs);
    border-top: 1px dashed var(--border-color);
  }

  // 完成率进度条
  &__progress {
    height: 4px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: var(--radius-full);
    overflow: hidden;

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &__progress-fill {
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--color-primary) 0%,
      var(--color-accent) 100%
    );
    border-radius: var(--radius-full);
    transition: width 0.5s ease;
  }
}
</style>
