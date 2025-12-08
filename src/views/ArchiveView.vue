<script setup lang="ts">
/**
 * 归档视图
 * 显示历史归档记录，支持搜索和虚拟滚动
 * 
 * Requirements: 1.1, 1.2, 1.3 (骨架屏加载状态)
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArchiveStore } from '@/stores/archive'
import ArchiveCard from '@/components/archive/ArchiveCard.vue'
import SearchFilter from '@/components/archive/SearchFilter.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import VirtualList from '@/components/common/VirtualList.vue'
import { SkeletonLoader, SkeletonList } from '@/components/skeleton'
import type { SearchQuery, DailyRecord } from '@/types'

const router = useRouter()
const store = useArchiveStore()

// 加载状态
const isLoading = ref(true)

const searchQuery = ref<SearchQuery>({
  startDate: null,
  endDate: null,
  mood: null,
  keyword: '',
  tags: []
})

const isSearching = ref(false)
const searchResults = ref<DailyRecord[]>([])

const displayRecords = computed(() => {
  if (isSearching.value) {
    return searchResults.value
  }
  return store.sortedRecords
})

// 虚拟滚动阈值：超过 50 条记录时启用（Requirements 4.1）
const VIRTUAL_SCROLL_THRESHOLD = 50
const useVirtualScrollEnabled = computed(() => displayRecords.value.length > VIRTUAL_SCROLL_THRESHOLD)

// 归档卡片高度（固定高度用于虚拟滚动）
const ARCHIVE_CARD_HEIGHT = 220

// 缓冲区大小（Requirements 4.3：上下各 5 条记录）
const BUFFER_SIZE = 5

// 响应式容器高度
const containerHeight = ref(600)

// 计算虚拟列表容器高度（基于视口高度）
const calculateContainerHeight = () => {
  // 视口高度减去头部、筛选器和底部安全区域
  const viewportHeight = window.innerHeight
  const headerHeight = 180 // 头部 + 筛选器大约高度
  const bottomPadding = 100 // 底部安全区域
  containerHeight.value = Math.max(400, viewportHeight - headerHeight - bottomPadding)
}

/**
 * 加载归档数据
 * 等待数据库加载完成，确保 journalEntries 被正确加载
 */
async function loadData(): Promise<void> {
  isLoading.value = true
  
  try {
    // 使用异步方法等待数据库加载完成
    await store.loadRecordsAsync()
    // 最小加载时间，让过渡动画更自然
    await new Promise(resolve => setTimeout(resolve, 300))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
  calculateContainerHeight()
  window.addEventListener('resize', calculateContainerHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateContainerHeight)
})

function handleSearch() {
  isSearching.value = true
  searchResults.value = store.searchRecords(searchQuery.value)
}

function handleReset() {
  isSearching.value = false
  searchResults.value = []
}

function navigateToDetail(record: DailyRecord) {
  router.push({ name: 'detail', params: { id: record.id } })
}

// 处理空状态操作（清除搜索）
function handleEmptyAction() {
  if (isSearching.value) {
    handleReset()
  }
}
</script>

<template>
  <div class="archive-view">
    <header class="archive-view__header">
      <h1 class="archive-view__title">历史归档</h1>
      <p class="archive-view__subtitle">回顾过往的点滴，见证成长的足迹</p>
    </header>

    <div class="archive-view__filter-container">
      <SearchFilter
        v-model="searchQuery"
        @search="handleSearch"
        @reset="handleReset"
      />
    </div>

    <div class="archive-view__content">
      <!-- 骨架屏加载状态 -->
      <SkeletonLoader :loading="isLoading">
        <template #skeleton>
          <div class="archive-view__grid">
            <SkeletonList :count="6" :card-props="{ lines: 3 }" />
          </div>
        </template>

        <!-- 空状态：使用通用 EmptyState 组件 -->
        <BaseCard v-if="displayRecords.length === 0" class="archive-view__empty-card">
          <EmptyState
            :type="isSearching ? 'search' : 'archive'"
            :description="isSearching ? '没有找到匹配的记录，尝试其他关键词' : '完成并封存的记录会显示在这里'"
            :show-action="isSearching"
            @action="handleEmptyAction"
          />
        </BaseCard>

        <!-- 虚拟滚动模式：超过 50 条记录时启用（Requirements 4.1） -->
        <VirtualList
          v-else-if="useVirtualScrollEnabled"
          :items="displayRecords"
          :item-height="ARCHIVE_CARD_HEIGHT"
          :buffer-size="BUFFER_SIZE"
          :height="containerHeight"
          key-field="id"
          class="archive-view__virtual-list"
        >
          <template #default="{ item }">
            <div class="archive-view__virtual-item">
              <ArchiveCard
                :record="item"
                @click="navigateToDetail(item)"
              />
            </div>
          </template>
        </VirtualList>

        <!-- 普通网格模式：50 条以内 -->
        <div v-else class="archive-view__grid">
          <ArchiveCard
            v-for="record in displayRecords"
            :key="record.id"
            :record="record"
            @click="navigateToDetail(record)"
          />
        </div>
        
        <div v-if="isSearching && displayRecords.length > 0" class="archive-view__results-info">
          找到 {{ displayRecords.length }} 条匹配记录
        </div>
      </SkeletonLoader>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;
@use '@/assets/styles/responsive.scss' as *;

.archive-view {
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--spacing-page);
  max-width: 1200px;
  margin: 0 auto;
  
  // 移动端安全区域
  @include until-sm {
    padding-bottom: calc(var(--spacing-page) + env(safe-area-inset-bottom, 0px) + 80px); // 增加底部空间防止被导航栏遮挡
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

  &__filter-container {
    margin-bottom: var(--spacing-xl);
    animation: fadeIn 0.6s ease-out 0.2s backwards;
  }

  &__content {
    animation: fadeInUp 0.6s ease-out 0.4s backwards;
  }

  &__empty-card {
    min-height: 300px;
    @include flex-center;
  }

  &__grid {
    display: grid;
    gap: var(--spacing-lg);
    grid-template-columns: 1fr;

    // 大手机双列
    @include sm {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);
    }

    // 平板端优化
    @include tablet-only {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-lg);
    }

    // 大屏幕三列
    @include lg {
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-xl);
    }
  }

  &__virtual-list {
    border-radius: var(--radius-lg);
    background: var(--bg-secondary);
    padding: var(--spacing-md);
  }

  &__virtual-item {
    padding: var(--spacing-sm) 0;
  }

  &__results-info {
    margin-top: var(--spacing-lg);
    text-align: center;
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    font-weight: var(--font-weight-medium);
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
