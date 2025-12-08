<template>
  <div
    class="task-item"
    :class="{
      'task-item--completed': task.completed,
      'task-item--high': task.priority === 'high',
      'task-item--medium': task.priority === 'medium',
      'task-item--low': task.priority === 'low'
    }"
  >
    <div class="task-item__checkbox">
      <input
        :id="`task-${task.id}`"
        type="checkbox"
        :checked="task.completed"
        :disabled="!editable"
        @change="handleToggle"
      />
      <label :for="`task-${task.id}`" ref="checkmarkRef" class="task-item__checkmark">
        <svg v-if="task.completed" viewBox="0 0 24 24" class="task-item__check-icon">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </label>
    </div>
    
    <div class="task-item__content">
      <div class="task-item__main">
        <span
          class="task-item__priority-indicator"
          :title="`优先级: ${priorityLabel}`"
        />
        <span
          class="task-item__description strikethrough"
          :class="{ completed: task.completed }"
        >
          {{ task.description }}
        </span>
      </div>
      
      <div v-if="task.tags.length > 0" class="task-item__tags">
        <span
          v-for="tag in task.tags"
          :key="tag"
          class="task-item__tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>
    
    <button
      v-if="editable"
      type="button"
      class="task-item__delete"
      title="删除任务"
      @click="handleDelete"
    >
      <svg viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAnimation } from '@/composables'
import type { Task } from '@/types'

interface Props {
  task: Task
  editable?: boolean
}

interface Emits {
  (e: 'toggle', id: string): void
  (e: 'delete', id: string): void
}

const props = withDefaults(defineProps<Props>(), {
  editable: true
})

const emit = defineEmits<Emits>()

const { animateTaskComplete } = useAnimation()
const checkmarkRef = ref<HTMLElement | null>(null)

const priorityLabel = computed(() => {
  const labels = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[props.task.priority]
})

async function handleToggle() {
  if (props.editable) {
    // 如果是从未完成变为完成，播放动画
    if (!props.task.completed && checkmarkRef.value) {
      await animateTaskComplete(checkmarkRef.value)
    }
    emit('toggle', props.task.id)
  }
}

function handleDelete() {
  if (props.editable) {
    emit('delete', props.task.id)
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;

.task-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--glass-bg);
  backdrop-filter: var(--backdrop-blur);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  border-left: 4px solid var(--border-color);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
  
  // 移动端触摸优化
  min-height: 56px;
  -webkit-tap-highlight-color: transparent;

  @include until-sm {
    padding: var(--spacing-md);
    gap: var(--spacing-sm);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    background: rgba(255, 255, 255, 0.8);
  }

  &:active {
    transform: scale(0.99);
  }

  &--high {
    border-left-color: var(--priority-high);
    background: linear-gradient(to right, rgba(239, 68, 68, 0.05), transparent);
  }

  &--medium {
    border-left-color: var(--priority-medium);
    background: linear-gradient(to right, rgba(245, 158, 11, 0.05), transparent);
  }

  &--low {
    border-left-color: var(--priority-low);
    background: linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent);
  }

  &--completed {
    opacity: 0.7;
    background: var(--bg-tertiary);
    border-left-color: var(--text-disabled);
    box-shadow: none;
    transform: none !important;

    .task-item__description {
      color: var(--text-tertiary);
    }
  }

  &__checkbox {
    position: relative;
    flex-shrink: 0;
    padding-top: 2px;

    input[type='checkbox'] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }
  }

  &__checkmark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color);
    border-radius: 50%;
    background: var(--bg-primary);
    cursor: pointer;
    transition: all var(--transition-bounce);

    @include until-sm {
      width: 28px;
      height: 28px;
    }

    input:checked + & {
      background: var(--color-primary);
      border-color: var(--color-primary);
      transform: scale(1.1);
    }

    input:disabled + & {
      cursor: not-allowed;
      opacity: 0.5;
    }

    &:hover {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px var(--color-primary-fade);
    }
  }

  &__check-icon {
    width: 14px;
    height: 14px;
    fill: white;
    animation: check-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }

  &__main {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__priority-indicator {
    display: none; // Hidden as we use border-left
  }

  &__description {
    color: var(--text-primary);
    font-size: var(--font-size-md);
    word-break: break-word;
    line-height: 1.5;
    font-weight: var(--font-weight-medium);
    transition: color var(--transition-normal);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__tag {
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__delete {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all var(--transition-fast);
    opacity: 0; // Hidden by default on desktop

    @include until-sm {
      opacity: 1; // Always visible on mobile
      width: 36px;
      height: 36px;
    }

    svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    &:hover {
      background: var(--color-danger-light);
      color: var(--color-danger);
    }

    .task-item:hover & {
      opacity: 1;
    }
  }
}

.strikethrough {
  position: relative;
  display: inline-block;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 0;
    height: 2px;
    background-color: var(--text-tertiary);
    transition: width var(--transition-normal);
    opacity: 0.6;
  }

  &.completed::after {
    width: 100%;
  }
}

@keyframes check-pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}
</style>
