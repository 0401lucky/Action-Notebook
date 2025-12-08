<template>
  <div class="stats-view">
    <header class="stats-view__header">
      <h1 class="stats-view__title">数据统计</h1>
      <p class="stats-view__subtitle">洞察你的行为模式，发现更好的自己</p>
    </header>

    <BaseCard v-if="!stats || store.records.length === 0" class="stats-view__empty-card">
      <EmptyState
        icon="📊"
        message="暂无统计数据，封存每日记录后将在这里显示"
        action-text="开始记录"
        action-route="/"
      />
    </BaseCard>

    <template v-else>
      <div class="stats-view__summary">
        <BaseCard class="stats-summary-card" :hoverable="true" :padded="true">
          <div class="stats-summary-card__icon">📝</div>
          <div class="stats-summary-card__content">
            <span class="stats-summary-card__value">{{ stats.totalTasks }}</span>
            <span class="stats-summary-card__label">总任务数</span>
          </div>
        </BaseCard>
        
        <BaseCard class="stats-summary-card" :hoverable="true" :padded="true">
          <div class="stats-summary-card__icon">✅</div>
          <div class="stats-summary-card__content">
            <span class="stats-summary-card__value">{{ stats.completedTasks }}</span>
            <span class="stats-summary-card__label">已完成任务</span>
          </div>
        </BaseCard>
        
        <BaseCard class="stats-summary-card" :hoverable="true" :padded="true">
          <div class="stats-summary-card__icon">📈</div>
          <div class="stats-summary-card__content">
            <span class="stats-summary-card__value">{{ overallCompletionRate }}%</span>
            <span class="stats-summary-card__label">总完成率</span>
          </div>
        </BaseCard>
        
        <BaseCard class="stats-summary-card" :hoverable="true" :padded="true">
          <div class="stats-summary-card__icon">🔥</div>
          <div class="stats-summary-card__content">
            <span class="stats-summary-card__value">{{ stats.consecutiveDays }}</span>
            <span class="stats-summary-card__label">连续活跃天数</span>
          </div>
        </BaseCard>
      </div>

      <BaseCard class="stats-view__section stats-view__section--chart">
        <template #header>
          <div class="stats-view__section-header">
            <h3 class="stats-view__section-title">完成率趋势</h3>
            <div class="stats-view__period-selector">
              <button
                :class="['period-btn', { 'period-btn--active': selectedPeriod === 7 }]"
                @click="setPeriod(7)"
              >
                近7天
              </button>
              <button
                :class="['period-btn', { 'period-btn--active': selectedPeriod === 30 }]"
                @click="setPeriod(30)"
              >
                近30天
              </button>
            </div>
          </div>
        </template>
        <CompletionChart :data="trendData" />
      </BaseCard>

      <div class="stats-view__charts-row">
        <BaseCard class="stats-view__section">
          <template #header>
            <h3 class="stats-view__section-title">心情分布</h3>
          </template>
          <MoodChart :data="stats.moodDistribution" />
        </BaseCard>

        <BaseCard class="stats-view__section">
          <template #header>
            <h3 class="stats-view__section-title">标签统计</h3>
          </template>
          <TagStats :data="stats.tagStats" />
        </BaseCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArchiveStore } from '@/stores/archive'
import { calculateStatistics, calculateCompletionTrend } from '@/services/stats'
import CompletionChart from '@/components/stats/CompletionChart.vue'
import MoodChart from '@/components/stats/MoodChart.vue'
import TagStats from '@/components/stats/TagStats.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import EmptyState from '@/components/dashboard/EmptyState.vue'
import type { Statistics } from '@/types'

const store = useArchiveStore()

const stats = ref<Statistics | null>(null)
const selectedPeriod = ref<7 | 30>(7)

const trendData = computed(() => {
  if (!store.records.length) return []
  return calculateCompletionTrend(store.records, selectedPeriod.value)
})

const overallCompletionRate = computed(() => {
  if (!stats.value || stats.value.totalTasks === 0) return 0
  return Math.round((stats.value.completedTasks / stats.value.totalTasks) * 100)
})

onMounted(async () => {
  // 等待数据库加载完成，确保 journalEntries 被正确加载
  await store.loadRecordsAsync()
  stats.value = calculateStatistics(store.records)
})

function setPeriod(period: 7 | 30) {
  selectedPeriod.value = period
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
@use '@/assets/styles/responsive.scss' as *;

.stats-view {
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--spacing-page);
  max-width: 1200px;
  margin: 0 auto;

  @include until-sm {
    padding-bottom: calc(var(--spacing-page) + env(safe-area-inset-bottom, 0px) + 80px);
  }

  &__header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
    animation: fadeInDown 0.6s ease-out;
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-title);
    font-weight: var(--font-weight-bold);
    @include text-gradient;
    letter-spacing: -0.5px;
  }

  &__subtitle {
    margin: var(--spacing-xs) 0 0;
    font-size: var(--font-size-subtitle);
    color: var(--text-secondary);
    font-weight: var(--font-weight-regular);

    @include until-sm {
      font-size: var(--font-size-sm);
    }
  }

  &__empty-card {
    min-height: 300px;
    @include flex-center;
  }

  &__summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
    animation: fadeInUp 0.6s ease-out 0.2s backwards;

    @include md {
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-lg);
    }
  }

  &__section {
    margin-bottom: var(--spacing-lg);
    animation: fadeInUp 0.6s ease-out 0.4s backwards;
    
    &-header {
      @include flex-between;
      width: 100%;
    }

    &-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0;
    }
  }

  &__charts-row {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    animation: fadeInUp 0.6s ease-out 0.6s backwards;

    @include tablet-up {
      flex-direction: row;
      
      .stats-view__section {
        flex: 1;
        margin-bottom: 0;
      }
    }
  }

  &__period-selector {
    display: flex;
    gap: var(--spacing-xs);
    background: rgba(0, 0, 0, 0.05);
    padding: 4px;
    border-radius: var(--radius-full);
    
    @media (prefers-color-scheme: dark) {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.stats-summary-card {
  display: flex;
  align-items: center;
  // BaseCard handles padding, but we might want row layout
  
  // Override BaseCard default slot layout if needed, but BaseCard is just a div
  // We need to style the content inside
  
  :deep(.card-content) {
    display: flex;
    align-items: center;
    width: 100%;
  }

  @include until-sm {
    :deep(.card-content) {
      flex-direction: column;
      text-align: center;
    }
  }

  &__icon {
    font-size: 2rem;
    margin-right: var(--spacing-md);
    width: 48px;
    height: 48px;
    @include flex-center;
    background: rgba(255, 255, 255, 0.5);
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-sm);

    @include until-sm {
      margin-right: 0;
      margin-bottom: var(--spacing-sm);
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
    }
  }

  &__content {
    @include flex-column;
  }

  &__value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    line-height: 1.2;

    @include until-sm {
      font-size: var(--font-size-xl);
    }
  }

  &__label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-top: 2px;
  }
}

.period-btn {
  padding: 4px 12px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    color: var(--text-primary);
  }

  &--active {
    background: var(--bg-primary);
    color: var(--color-primary);
    box-shadow: var(--shadow-sm);
    font-weight: var(--font-weight-bold);
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
