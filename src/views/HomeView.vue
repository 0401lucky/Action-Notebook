<template>
  <div class="home-view">
    <header class="home-view__header">
      <h1 class="home-view__title">行动手账</h1>
      <p class="home-view__date">{{ store.currentRecord?.date || '今日' }}</p>
    </header>

    <div class="home-view__content">
      <!-- 任务区域 -->
      <section class="home-view__tasks">
        <ProgressBar
          :percentage="store.completionRate"
          :completed-count="store.completedCount"
          :total-count="store.taskCount"
          :animated="true"
        />

        <TaskInput
          :disabled="store.isSealed"
          @add="handleAddTask"
        />

        <!-- 任务列表骨架屏 -->
        <SkeletonLoader :loading="isLoading">
          <template #skeleton>
            <SkeletonList :count="3" :card-props="{ lines: 2 }" />
          </template>
          <TaskList
            :tasks="store.currentRecord?.tasks || []"
            :editable="!store.isSealed"
            @toggle="handleToggleTask"
            @delete="handleDeleteTask"
            @reorder="handleReorderTasks"
          />
        </SkeletonLoader>
      </section>

      <!-- 日记区域 -->
      <SkeletonLoader :loading="isLoading" class="home-view__journal-wrapper">
        <template #skeleton>
          <BaseCard class="home-view__journal" :padded="true">
            <SkeletonCard :lines="5" :show-image="false" />
          </BaseCard>
        </template>
        <BaseCard class="home-view__journal" :padded="true">
          <JournalEditor
            :entries="store.sortedJournalEntries"
            :readonly="store.isSealed"
            @add="handleAddJournalEntry"
            @edit="handleEditJournalEntry"
            @delete="handleDeleteJournalEntry"
          />

          <SealButton />
        </BaseCard>
      </SkeletonLoader>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 今日页面视图
 * 包含任务列表和日记编辑器
 * 
 * Requirements: 1.1, 1.2, 1.3 (骨架屏加载状态)
 */
import { onMounted, toRef, ref } from 'vue'
import { useDailyStore } from '@/stores/daily'
import { useAutoSave } from '@/composables/useAutoSave'
import TaskInput from '@/components/task/TaskInput.vue'
import TaskList from '@/components/task/TaskList.vue'
import ProgressBar from '@/components/task/ProgressBar.vue'
import JournalEditor from '@/components/journal/JournalEditor.vue'
import SealButton from '@/components/journal/SealButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import { SkeletonLoader, SkeletonCard, SkeletonList } from '@/components/skeleton'
import type { Priority, MoodType, Task } from '@/types'

const store = useDailyStore()

// 加载状态
const isLoading = ref(true)

// 使用自动保存 composable，优化 LocalStorage 写入频率
// 通过防抖机制减少频繁写入，同时确保数据在 500ms 内持久化
// 自动监听 currentRecord 变化并保存，无需手动调用
// 传入 isDataLoading 状态，数据加载期间不触发保存
useAutoSave(toRef(store, 'currentRecord'), toRef(store, 'isDataLoading'))

/**
 * 加载今日数据
 * 加载完成后隐藏骨架屏
 */
async function loadData(): Promise<void> {
  isLoading.value = true
  
  try {
    store.loadToday()
    // 最小加载时间，让过渡动画更自然
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

function handleAddTask(payload: { description: string; priority: Priority; tags: string[] }) {
  store.addTask(payload.description, payload.priority, payload.tags)
}

function handleToggleTask(id: string) {
  store.toggleTask(id)
}

function handleDeleteTask(id: string) {
  store.removeTask(id)
}

function handleReorderTasks(tasks: Task[]) {
  store.updateTaskOrder(tasks)
}

function handleUpdateJournal(content: string) {
  store.updateJournal(content)
}

function handleUpdateMood(mood: MoodType) {
  store.updateMood(mood)
}

// 日记条目操作
function handleAddJournalEntry(entry: { content: string; mood: MoodType | null }) {
  store.addJournalEntry(entry.content, entry.mood)
}

function handleEditJournalEntry(id: string, content: string) {
  store.editJournalEntry(id, content)
}

function handleDeleteJournalEntry(id: string) {
  store.deleteJournalEntry(id)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.home-view {
  min-height: 100vh;
  min-height: 100dvh; // 动态视口高度，适配移动端浏览器
  padding: var(--spacing-page);
  max-width: 1400px;
  margin: 0 auto;

  // 移动端安全区域
  @include until-sm {
    padding-bottom: calc(var(--spacing-page) + env(safe-area-inset-bottom, 0px));
  }

  &__header {
    text-align: center;
    margin-bottom: var(--spacing-section);
    animation: fadeInDown 0.5s ease-out;
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-title);
    font-weight: var(--font-weight-bold);
    @include text-gradient;
  }

  &__date {
    margin: var(--spacing-xs) 0 0;
    font-size: var(--font-size-subtitle);
    color: var(--text-secondary);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-section);

    // 平板端双栏布局 (>768px)
    @include md {
      flex-direction: row;
      align-items: flex-start;
      gap: var(--spacing-lg);
    }

    // 大屏幕增加间距
    @include lg {
      gap: var(--spacing-xl);
    }
  }

  &__tasks {
    @include flex-column;
    gap: var(--spacing-md);
    flex: 1;
    min-width: 0;
    animation: fadeInUp 0.5s ease-out 0.1s backwards;

    // 平板端优化比例
    @include tablet-only {
      flex: 1.2;
    }

    @include lg {
      flex: 1;
    }
  }

  &__journal-wrapper {
    animation: fadeInUp 0.5s ease-out 0.2s backwards;
    
    // 平板端优化宽度
    @include tablet-only {
      flex: 1;
      max-width: 380px;
      min-width: 320px;
    }

    // 大屏幕
    @include lg {
      flex: 1;
      max-width: 500px;
    }
  }

  &__journal {
    @include flex-column;
    gap: var(--spacing-md);
    // background handled by BaseCard

    // 移动端全宽
    @include until-sm {
      margin: 0 calc(-1 * var(--spacing-page));
      border-radius: 0;
      padding: var(--spacing-md) var(--spacing-page);
    }
  }
}

// 动画关键帧
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
