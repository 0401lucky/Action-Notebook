<template>
  <div class="detail-view">
    <header class="detail-view__header">
      <BaseButton
        variant="secondary"
        @click="goBack"
      >
        <template #icon-left>←</template>
        返回归档
      </BaseButton>
    </header>

    <div v-if="loading" class="detail-view__loading">
      <LoadingSpinner size="md" />
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="detail-view__error">
      <p>{{ error }}</p>
      <BaseButton variant="primary" @click="goBack">返回归档列表</BaseButton>
    </div>

    <template v-else-if="record">
      <div class="detail-view__title-section">
        <h1 class="detail-view__title">{{ formatDate(record.date) }}</h1>
        <div v-if="record.mood" class="detail-view__mood">
          <span class="detail-view__mood-emoji">{{ moodEmojis[record.mood]?.emoji }}</span>
          <span class="detail-view__mood-label">{{ moodEmojis[record.mood]?.label }}</span>
        </div>
      </div>

      <div class="detail-view__meta">
        <span v-if="record.sealedAt" class="detail-view__sealed">
          🔒 封存于 {{ formatDateTime(record.sealedAt) }}
        </span>
        
        <!-- 解封编辑按钮 Requirements: 4.1 -->
        <BaseButton 
          v-if="record.isSealed"
          variant="primary"
          @click="showUnsealConfirm"
        >
          <template #icon-left>🔓</template>
          解封编辑
        </BaseButton>
      </div>

      <div class="detail-view__content">
        <!-- 任务区域 -->
        <BaseCard class="detail-view__section" :padded="true">
          <h2 class="detail-view__section-title">任务完成情况</h2>
          
          <ProgressBar
            :percentage="record.completionRate"
            :completed-count="completedCount"
            :total-count="taskCount"
            :animated="false"
          />

          <div class="detail-view__tasks">
            <TaskList
              :tasks="record.tasks"
              :editable="false"
            />
          </div>
        </BaseCard>

        <!-- 日记区域 -->
        <BaseCard class="detail-view__section" :padded="true">
          <h2 class="detail-view__section-title">今日复盘</h2>
          
          <!-- 新版日记条目列表 -->
          <div v-if="record.journalEntries && record.journalEntries.length > 0" class="detail-view__journal-entries">
            <div 
              v-for="entry in record.journalEntries" 
              :key="entry.id" 
              class="detail-view__journal-entry"
            >
              <div class="detail-view__journal-entry-header">
                <span class="detail-view__journal-entry-time">
                  {{ formatTime(entry.createdAt) }}
                </span>
                <span v-if="entry.mood" class="detail-view__journal-entry-mood">
                  {{ moodEmojis[entry.mood]?.emoji }}
                </span>
              </div>
              <p class="detail-view__journal-entry-content">{{ entry.content }}</p>
            </div>
          </div>
          <!-- 兼容旧版单条日记 -->
          <div v-else-if="record.journal" class="detail-view__journal">
            <p>{{ record.journal }}</p>
          </div>
          <div v-else class="detail-view__journal detail-view__journal--empty">
            <p>暂无日记内容</p>
          </div>
        </BaseCard>
      </div>
    </template>
    
    <!-- 解封确认对话框 Requirements: 2.1, 2.2, 2.3, 2.4 -->
    <ConfirmDialog
      v-model:visible="showUnsealDialog"
      title="解封编辑"
      message="解封后可以继续编辑此记录。确认要解封吗？"
      confirm-text="确认解封"
      cancel-text="取消"
      @confirm="handleUnsealConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArchiveStore } from '@/stores/archive'
import { useDailyStore } from '@/stores/daily'
import TaskList from '@/components/task/TaskList.vue'
import ProgressBar from '@/components/task/ProgressBar.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import { LoadingSpinner } from '@/components/common'
import type { DailyRecord } from '@/types'

const route = useRoute()
const router = useRouter()
const archiveStore = useArchiveStore()
const dailyStore = useDailyStore()

const record = ref<DailyRecord | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showUnsealDialog = ref(false)

const moodEmojis: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: '开心' },
  neutral: { emoji: '😐', label: '平淡' },
  sad: { emoji: '😢', label: '沮丧' },
  excited: { emoji: '🎉', label: '兴奋' },
  tired: { emoji: '😴', label: '疲惫' }
}

const completedCount = computed(() => 
  record.value?.tasks.filter(t => t.completed).length ?? 0
)

const taskCount = computed(() => record.value?.tasks.length ?? 0)

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  const recordId = route.params.id as string
  
  // 先尝试从已加载的数据中获取
  record.value = archiveStore.getRecordById(recordId)
  
  if (!record.value) {
    // 如果没有，等待数据库加载完成
    await archiveStore.loadRecordsAsync()
    record.value = archiveStore.getRecordById(recordId)
  }
  
  if (!record.value) {
    error.value = '未找到该记录'
  }
  loading.value = false
})

function goBack() {
  router.push({ name: 'archive' })
}

/**
 * 显示解封确认对话框
 * Requirements: 4.1
 */
function showUnsealConfirm() {
  showUnsealDialog.value = true
}

/**
 * 确认解封并跳转到今日页面
 * Requirements: 4.2, 4.3
 */
function handleUnsealConfirm() {
  if (!record.value) return
  
  // 加载记录并解封
  const success = dailyStore.loadAndUnsealRecord(record.value)
  
  if (success) {
    // 跳转到今日页面
    router.push({ name: 'home' })
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.detail-view {
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--spacing-page);
  max-width: 900px;
  margin: 0 auto;

  // 移动端安全区域
  @include until-sm {
    padding-bottom: calc(var(--spacing-page) + env(safe-area-inset-bottom, 0px));
  }

  &__header {
    margin-bottom: var(--spacing-section);
    animation: fadeInDown 0.6s ease-out;
  }

  &__loading,
  &__error {
    @include flex-column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    @include glass-effect;
    border-radius: var(--radius-lg);
    color: var(--text-tertiary);
    text-align: center;
    gap: var(--spacing-md);

    @include until-sm {
      padding: var(--spacing-xl);
    }
  }



  &__title-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    animation: fadeIn 0.6s ease-out;

    // 移动端垂直布局
    @include until-sm {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-title);
    font-weight: var(--font-weight-bold);
    @include text-gradient;
  }

  &__mood {
    @include flex-center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    @include glass-effect;
    border-radius: var(--radius-full);
  }

  &__mood-emoji {
    font-size: var(--font-size-xl);
  }

  &__mood-label {
    font-size: var(--font-size-md);
    color: var(--text-secondary);
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-section);
    animation: fadeIn 0.6s ease-out 0.1s backwards;

    @include until-sm {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  &__sealed {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }

  &__content {
    @include flex-column;
    gap: var(--spacing-xl);
    animation: fadeInUp 0.6s ease-out 0.2s backwards;

    @include until-sm {
      gap: var(--spacing-lg);
    }
  }

  &__section {
    // BaseCard handles styles
  }

  &__section-title {
    margin: 0 0 var(--spacing-md);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);

    @include until-sm {
      font-size: var(--font-size-md);
    }
  }

  &__tasks {
    margin-top: var(--spacing-md);
  }

  &__journal {
    background: var(--bg-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    border: 1px solid var(--border-color);

    p {
      margin: 0;
      font-size: var(--font-size-md);
      line-height: var(--line-height-relaxed);
      color: var(--text-primary);
      white-space: pre-wrap;
    }

    &--empty {
      p {
        color: var(--text-tertiary);
        font-style: italic;
      }
    }
  }

  // 日记条目列表
  &__journal-entries {
    @include flex-column;
    gap: var(--spacing-md);
  }

  &__journal-entry {
    background: var(--bg-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    border: 1px solid var(--border-color);
  }

  &__journal-entry-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
  }

  &__journal-entry-time {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
  }

  &__journal-entry-mood {
    font-size: var(--font-size-md);
  }

  &__journal-entry-content {
    margin: 0;
    font-size: var(--font-size-md);
    line-height: var(--line-height-relaxed);
    color: var(--text-primary);
    white-space: pre-wrap;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
</style>
