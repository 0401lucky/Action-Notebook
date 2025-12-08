<template>
  <div class="task-list task-list__surface">
    <div class="task-list__header">
      <div class="task-list__title">任务列表</div>
      <div class="task-list__meta">
        <span class="task-list__count">{{ sortedTasks.length }} 项</span>
        <span v-if="editable" class="task-list__hint">可拖拽排序</span>
      </div>
    </div>

    <EmptyState
      v-if="sortedTasks.length === 0"
      type="task"
      :show-action="false"
      description="在上方输入框添加你的第一个任务"
    />
    
    <TransitionGroup
      v-else-if="!editable"
      name="list-item"
      tag="div"
      class="task-list__container"
    >
      <div
        v-for="(task, index) in sortedTasks"
        :key="task.id"
        class="task-list__item-wrapper"
        :style="{ '--item-index': index }"
      >
        <TaskItem
          :task="task"
          :editable="editable"
          @toggle="handleToggle"
          @delete="handleDelete"
        />
      </div>
    </TransitionGroup>
    
    <draggable
      v-else
      v-model="localTasks"
      item-key="id"
      handle=".task-list__drag-handle"
      ghost-class="task-list__ghost"
      :disabled="!editable"
      :animation="200"
      @end="handleDragEnd"
    >
      <template #item="{ element, index }">
        <div 
          class="task-list__item-wrapper"
          :style="{ '--item-index': index }"
        >
          <div v-if="editable" class="task-list__drag-handle" title="拖拽排序">
            <svg viewBox="0 0 24 24">
              <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </div>
          <TaskItem
            :task="element"
            :editable="editable"
            @toggle="handleToggle"
            @delete="handleDelete"
          />
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import TaskItem from './TaskItem.vue'
import { EmptyState } from '@/components/common'
import type { Task } from '@/types'

interface Props {
  tasks: Task[]
  editable?: boolean
}

interface Emits {
  (e: 'reorder', tasks: Task[]): void
  (e: 'toggle', id: string): void
  (e: 'delete', id: string): void
  (e: 'add'): void
}

const props = withDefaults(defineProps<Props>(), {
  editable: true
})

const emit = defineEmits<Emits>()

// Local copy for draggable
const localTasks = ref<Task[]>([])

// Sort tasks by priority (high > medium > low), then by order
const sortedTasks = computed(() => {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return [...props.tasks].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return a.order - b.order
  })
})

// Sync local tasks with sorted tasks
watch(
  sortedTasks,
  (newTasks) => {
    localTasks.value = [...newTasks]
  },
  { immediate: true, deep: true }
)

function handleDragEnd() {
  // Emit reordered tasks with updated order values
  const reorderedTasks = localTasks.value.map((task, index) => ({
    ...task,
    order: index
  }))
  emit('reorder', reorderedTasks)
}

function handleToggle(id: string) {
  emit('toggle', id)
}

function handleDelete(id: string) {
  emit('delete', id)
}
</script>

<style scoped lang="scss">
.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  
  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    color: var(--text-tertiary);
    font-size: var(--font-size-md);
    text-align: center;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    border: 2px dashed var(--border-color);
  }
  
  &__item-wrapper {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  &__drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-top: var(--spacing-sm);
    color: var(--text-tertiary);
    cursor: grab;
    opacity: 0.5;
    transition: opacity var(--transition-fast);
    
    svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    
    &:hover {
      opacity: 1;
    }
    
    &:active {
      cursor: grabbing;
    }
  }
  
  &__ghost {
    opacity: 0.5;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
  }
  
  &__container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  &__surface {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-sm);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
  }

  &__title {
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__count {
    padding: 2px 10px;
    border-radius: var(--radius-full);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }

  &__hint {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }
}

// 列表项动画
.list-item-enter-active,
.list-item-leave-active {
  transition: all 0.3s ease;
}

.list-item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-item-move {
  transition: transform 0.3s ease;
}
</style>
