<template>
  <BaseCard class="task-selector" :padded="true">
    <div class="task-selector__header">
      <span class="task-selector__title">关联任务</span>
      <button 
        v-if="selectedTask"
        class="task-selector__clear"
        @click="clearSelection"
        aria-label="取消关联"
      >
        ✕
      </button>
    </div>

    <!-- 当前选中的任务 -->
    <div v-if="selectedTask" class="task-selector__selected">
      <span class="task-selector__icon">📋</span>
      <span class="task-selector__task-name">{{ selectedTask.description }}</span>
    </div>

    <!-- 任务选择下拉 -->
    <div v-else class="task-selector__dropdown">
      <button 
        class="task-selector__trigger"
        @click="toggleDropdown"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
      >
        <span class="task-selector__placeholder">
          {{ incompleteTasks.length > 0 ? '选择要专注的任务...' : '暂无未完成任务' }}
        </span>
        <span class="task-selector__arrow" :class="{ 'task-selector__arrow--open': isOpen }">
          ▼
        </span>
      </button>

      <!-- 下拉列表 -->
      <Transition name="dropdown">
        <ul 
          v-if="isOpen && incompleteTasks.length > 0"
          class="task-selector__list"
          role="listbox"
        >
          <li
            v-for="task in incompleteTasks"
            :key="task.id"
            class="task-selector__item"
            role="option"
            @click="selectTask(task)"
          >
            <span class="task-selector__item-priority" :class="`task-selector__item-priority--${task.priority}`">
              ●
            </span>
            <span class="task-selector__item-text">{{ task.description }}</span>
          </li>
        </ul>
      </Transition>
    </div>

    <!-- 自由专注提示 -->
    <p class="task-selector__hint">
      {{ selectedTask ? '专注时长将记录到此任务' : '也可以不选择任务，进行自由专注' }}
    </p>
  </BaseCard>
</template>

<script setup lang="ts">
/**
 * TaskSelector - 任务选择器组件
 * 
 * 显示今日未完成任务列表，支持选择/取消选择任务。
 * 
 * Requirements: 4.1, 4.2, 4.3
 * - 4.1: 显示今日未完成任务列表供选择
 * - 4.2: 在计时界面显示当前关联的任务名称
 * - 4.3: 允许无任务关联的自由专注
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDailyStore } from '@/stores/daily'
import { usePomodoroStore } from '@/stores/pomodoro'
import type { Task } from '@/types'
import BaseCard from '@/components/common/BaseCard.vue'

const dailyStore = useDailyStore()
const pomodoroStore = usePomodoroStore()

// 下拉框状态
const isOpen = ref(false)

/**
 * 今日未完成的任务列表
 * Requirements: 4.1
 */
const incompleteTasks = computed(() => {
  if (!dailyStore.currentRecord) return []
  return dailyStore.currentRecord.tasks.filter(task => !task.completed)
})

/**
 * 当前选中的任务
 * Requirements: 4.2
 */
const selectedTask = computed(() => {
  if (!pomodoroStore.selectedTaskId) return null
  if (!dailyStore.currentRecord) return null
  return dailyStore.currentRecord.tasks.find(
    task => task.id === pomodoroStore.selectedTaskId
  ) || null
})

/**
 * 切换下拉框
 */
function toggleDropdown(): void {
  if (incompleteTasks.value.length > 0) {
    isOpen.value = !isOpen.value
  }
}

/**
 * 选择任务
 * Requirements: 4.2
 */
function selectTask(task: Task): void {
  pomodoroStore.selectTask(task)
  isOpen.value = false
}

/**
 * 清除选择
 * Requirements: 4.3
 */
function clearSelection(): void {
  pomodoroStore.selectTask(null)
}

/**
 * 点击外部关闭下拉框
 */
function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('.task-selector__dropdown')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>


<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.task-selector {
  // BaseCard handles container styles

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }

  &__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
  }

  &__clear {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: var(--spacing-xs);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);

    &:hover {
      color: var(--color-danger);
      background: var(--color-danger-light);
    }
  }

  &__selected {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-primary-fade);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-primary);
  }

  &__icon {
    font-size: var(--font-size-lg);
  }

  &__task-name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__dropdown {
    position: relative;
  }

  &__trigger {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover {
      border-color: var(--color-primary);
    }
    
    &:focus {
      @include focus-ring;
    }
  }

  &__placeholder {
    font-size: var(--font-size-base);
    color: var(--text-tertiary);
  }

  &__arrow {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    transition: transform var(--transition-fast);

    &--open {
      transform: rotate(180deg);
    }
  }

  &__list {
    position: absolute;
    top: calc(100% + var(--spacing-xs));
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 100;
    list-style: none;
    margin: 0;
    padding: var(--spacing-xs);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast);

    &:hover {
      background: var(--bg-hover);
    }
  }

  &__item-priority {
    font-size: var(--font-size-xs);

    &--high {
      color: var(--priority-high);
    }

    &--medium {
      color: var(--priority-medium);
    }

    &--low {
      color: var(--priority-low);
    }
  }

  &__item-text {
    font-size: var(--font-size-base);
    color: var(--text-primary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__hint {
    margin-top: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    text-align: center;
  }
}

// 下拉动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-fast);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
