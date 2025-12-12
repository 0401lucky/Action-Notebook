<template>
  <div class="dashboard">
    <!-- 欢迎区域 - 占满宽度 -->
    <WelcomeHeader class="dashboard__welcome" />

    <!-- 卡片网格区域 -->
    <div class="dashboard__grid">
      <!-- 今日任务卡片 -->
      <SkeletonLoader :loading="isLoading" class="dashboard__card">
        <template #skeleton>
          <SkeletonCard :lines="4" class="dashboard__skeleton-card" />
        </template>
        <TaskCard />
      </SkeletonLoader>

      <!-- 最近日记卡片 -->
      <SkeletonLoader :loading="isLoading" class="dashboard__card">
        <template #skeleton>
          <SkeletonCard :lines="3" :show-image="true" class="dashboard__skeleton-card" />
        </template>
        <JournalCard />
      </SkeletonLoader>

      <!-- 数据概览卡片 - 占满宽度 -->
      <SkeletonLoader :loading="isLoading" class="dashboard__card dashboard__card--full">
        <template #skeleton>
          <div class="dashboard__stats-skeleton">
            <SkeletonCard :lines="2" />
          </div>
        </template>
        <StatsCard
          :weekly-completed-tasks="weeklyStats.completedTasks"
          :weekly-journal-days="weeklyStats.journalDays"
          :consecutive-days="consecutiveDays"
        />
      </SkeletonLoader>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 仪表盘主视图
 * 整合所有子组件，实现响应式布局和数据加载协调
 * 
 * Requirements: 5.1, 5.4, 5.5, 6.3
 * Requirements: 1.1, 1.2, 1.3 (骨架屏加载状态)
 */

import { computed, onMounted, ref } from 'vue'
import { useDailyStore } from '@/stores/daily'
import { useArchiveStore } from '@/stores/archive'
import { useProfileStore } from '@/stores/profile'
import { useAuthStore } from '@/stores/auth'
import { calculateWeeklyStats, calculateConsecutiveDays } from '@/services/dashboard'
import {
  WelcomeHeader,
  TaskCard,
  JournalCard,
  StatsCard
} from '@/components/dashboard'
import { SkeletonLoader, SkeletonCard } from '@/components/skeleton'

// Stores
const dailyStore = useDailyStore()
const archiveStore = useArchiveStore()
const profileStore = useProfileStore()
const authStore = useAuthStore()

// 加载状态
const isLoading = ref(true)

/**
 * 计算本周统计数据
 * 包含本周完成任务数和本周日记天数
 */
const weeklyStats = computed(() => {
  // 合并今日记录和归档记录
  const allRecords = [...archiveStore.records]
  
  // 如果今日记录存在且不在归档中，添加到计算
  if (dailyStore.currentRecord) {
    const todayInArchive = allRecords.some(
      r => r.id === dailyStore.currentRecord?.id
    )
    if (!todayInArchive) {
      allRecords.push(dailyStore.currentRecord)
    }
  }
  
  return calculateWeeklyStats(allRecords)
})

/**
 * 计算连续打卡天数
 */
const consecutiveDays = computed(() => {
  return calculateConsecutiveDays(archiveStore.records)
})

/**
 * 加载所有数据
 * 等待数据库加载完成，确保 journalEntries 被正确加载
 */
async function loadAllData(): Promise<void> {
  isLoading.value = true
  
  try {
    // 并行加载今日数据和归档数据
    const loadPromises: Promise<void>[] = [
      // 加载今日数据
      (async () => {
        dailyStore.loadToday()
        await dailyStore.loadTodayAsync()
      })(),
      // 加载归档数据（等待数据库加载完成）
      archiveStore.loadRecordsAsync()
    ]
    
    // 加载用户资料（如果已登录）
    if (authStore.user?.id) {
      loadPromises.push(profileStore.loadProfile(authStore.user.id).then(() => {}))
    }
    
    await Promise.all(loadPromises)
    
    // 最小加载时间，确保骨架屏有足够的显示时间
    await new Promise(resolve => setTimeout(resolve, 300))
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadAllData()
})
</script>


<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
@use '@/assets/styles/responsive.scss' as *;

.dashboard {
  min-height: 100vh;
  // background: var(--bg-gradient); // Handled by App.vue
  
  // 最大宽度限制，居中显示
  max-width: 1200px;
  margin: 0 auto;

  &__welcome {
    margin-bottom: var(--spacing-lg);
  }

  &__grid {
    display: grid;
    gap: var(--spacing-lg);
    
    // 桌面端：双列布局
    grid-template-columns: repeat(2, 1fr);
    
    @include until-md {
      grid-template-columns: 1fr;
    }
  }

  &__card {
    // 卡片默认占一列
    
    // 全宽卡片（统计卡片）
    &--full {
      grid-column: 1 / -1;
      
      @include until-md {
        grid-column: 1;
      }
    }
  }

  // 骨架屏卡片样式
  &__skeleton-card {
    min-height: 200px;
  }

  // 统计卡片骨架屏样式
  &__stats-skeleton {
    display: flex;
    gap: var(--spacing-md);
    
    :deep(.skeleton-card) {
      flex: 1;
      min-height: 100px;
    }
    
    @include until-sm {
      flex-direction: column;
    }
  }
}
</style>
