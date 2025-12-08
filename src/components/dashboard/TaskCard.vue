<template>
  <BaseCard class="task-card" :hoverable="true">
    <template #header>
      <div class="task-card__header-content">
        <h3 class="task-card__title">📋 今日任务</h3>
        <span v-if="tasks.length > 0" class="task-card__progress">
          {{ completedCount }}/{{ tasks.length }} 已完成
        </span>
      </div>
    </template>

    <div class="task-card__content-wrapper">
      <!-- 任务列表 -->
      <div v-if="tasks.length > 0" class="task-card__content">
        <ul class="task-card__list">
          <li 
            v-for="task in displayedTasks" 
            :key="task.id"
            class="task-card__item"
            :class="{ 'task-card__item--completed': task.completed }"
          >
            <label class="task-card__checkbox-label">
              <input
                type="checkbox"
                :checked="task.completed"
                class="task-card__checkbox"
                @change="handleToggleTask(task.id)"
              />
              <span class="task-card__checkbox-custom"></span>
              <span class="task-card__description">{{ task.description }}</span>
            </label>
          </li>
        </ul>

        <!-- 查看全部链接 -->
        <router-link 
          v-if="showViewAll" 
          to="/home" 
          class="task-card__view-all"
        >
          查看全部 ({{ tasks.length }})
        </router-link>
      </div>

      <!-- 空状态 -->
      <EmptyState
        v-else
        icon="✨"
        message="还没有任务哦，添加一个开始今天的计划吧 ✨"
        action-text="添加任务"
        action-route="/home"
      />
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
/**
 * 今日任务卡片组件
 * 显示今日任务列表，支持勾选完成，使用玻璃拟态风格
 */
import { computed } from 'vue'
import { useDailyStore } from '@/stores/daily'
import { EmptyState } from '@/components/dashboard'
import BaseCard from '@/components/common/BaseCard.vue'

// 最大显示任务数
const MAX_DISPLAY_TASKS = 5

const dailyStore = useDailyStore()

// 获取今日任务
const tasks = computed(() => dailyStore.currentRecord?.tasks ?? [])

// 已完成任务数
const completedCount = computed(() => 
  tasks.value.filter(t => t.completed).length
)

// 显示的任务（最多 5 个）
const displayedTasks = computed(() => 
  tasks.value.slice(0, MAX_DISPLAY_TASKS)
)

// 是否显示"查看全部"链接
const showViewAll = computed(() => tasks.value.length > MAX_DISPLAY_TASKS)

// 切换任务完成状态
function handleToggleTask(taskId: string) {
  dailyStore.toggleTask(taskId)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.task-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__header-content {
    @include flex-between;
    width: 100%;
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  &__progress {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    background: var(--bg-tertiary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
  }
  
  &__content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__content {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    flex: 1;
  }

  &__item {
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-color-light);
    transition: opacity var(--transition-fast);

    &:last-child {
      border-bottom: none;
    }

    &--completed {
      .task-card__description {
        text-decoration: line-through;
        color: var(--text-tertiary);
      }
    }
  }

  &__checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    gap: var(--spacing-sm);
    padding: 4px 0;
  }

  &__checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .task-card__checkbox-custom {
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      border-color: transparent;

      &::after {
        opacity: 1;
        transform: scale(1);
      }
    }

    &:focus + .task-card__checkbox-custom {
      box-shadow: 0 0 0 3px var(--color-primary-fade);
    }
  }

  &__checkbox-custom {
    position: relative;
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    transition: all var(--transition-fast);
    flex-shrink: 0;

    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      color: white;
      font-size: 12px;
      font-weight: bold;
      opacity: 0;
      transition: all var(--transition-fast);
    }
  }

  &__description {
    font-size: var(--font-size-base);
    color: var(--text-primary);
    line-height: var(--line-height-normal);
    word-break: break-word;
    transition: color var(--transition-fast);
  }

  &__view-all {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    color: var(--color-primary);
    text-decoration: none;
    border-radius: var(--radius-md);
    background: var(--bg-tertiary);
    transition: all var(--transition-fast);

    &:hover {
      background: var(--color-primary);
      color: var(--text-inverse);
    }
  }
}
</style>
