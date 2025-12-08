<template>
  <div class="journal-entry-list">
    <TransitionGroup name="entry-list" tag="div" class="entries-container">
      <JournalEntryItem
        v-for="entry in sortedEntries"
        :key="entry.id"
        :entry="entry"
        :readonly="readonly"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </TransitionGroup>
    
    <!-- 空状态 -->
    <div v-if="entries.length === 0" class="empty-state">
      <span class="empty-icon">📝</span>
      <p class="empty-text">还没有日记条目，开始记录今天的想法吧</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { JournalEntry } from '@/types'
import { sortEntriesByTime } from '@/services/journal'
import JournalEntryItem from './JournalEntryItem.vue'

/**
 * 日记条目列表组件
 * 按时间倒序显示所有日记条目
 * 
 * Requirements: 6.3
 */

interface Props {
  entries: JournalEntry[]
  readonly?: boolean
}

interface Emits {
  (e: 'edit', id: string, content: string): void
  (e: 'delete', id: string): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// 按时间倒序排列（最新的在上面）
const sortedEntries = computed(() => {
  return sortEntriesByTime(props.entries)
})

// 处理编辑事件
function handleEdit(id: string, content: string) {
  emit('edit', id, content)
}

// 处理删除事件
function handleDelete(id: string) {
  emit('delete', id)
}
</script>

<style scoped lang="scss">
.journal-entry-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.entries-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-sm);
    opacity: 0.6;
  }

  .empty-text {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
}

/* 列表动画 */
.entry-list-enter-active,
.entry-list-leave-active {
  transition: all 0.3s ease;
}

.entry-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.entry-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.entry-list-move {
  transition: transform 0.3s ease;
}
</style>
