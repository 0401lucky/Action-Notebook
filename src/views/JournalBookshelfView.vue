<script setup lang="ts">
/**
 * 日记本书架页面
 * 
 * 完整的日记本书架页面，以书架形式展示所有日记本
 * 
 * Requirements: 10.1, 13.3
 */
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArchiveStore } from '@/stores/archive'
import JournalBookshelf from '@/components/journal/JournalBookshelf.vue'
import { SkeletonLoader, SkeletonCard } from '@/components/skeleton'

const router = useRouter()
const archiveStore = useArchiveStore()

// 获取所有已封存的日记记录
const sealedRecords = computed(() => archiveStore.records)

// 加载状态
const isLoading = computed(() => archiveStore.isLoading)

// 加载归档数据（等待数据库加载完成）
onMounted(async () => {
  await archiveStore.loadRecordsAsync()
})

/**
 * 处理日记本选择，跳转到详情页
 */
function handleSelectJournal(recordId: string): void {
  router.push(`/detail/${recordId}`)
}
</script>

<template>
  <div class="journal-bookshelf-view">
    <!-- 页面标题 -->
    <header class="journal-bookshelf-view__header">
      <h1 class="journal-bookshelf-view__title">
        <span class="journal-bookshelf-view__title-icon">📚</span>
        我的日记本
      </h1>
      <p class="journal-bookshelf-view__subtitle">
        记录生活的点点滴滴
      </p>
    </header>

    <!-- 日记本书架 -->
    <main class="journal-bookshelf-view__content">
      <SkeletonLoader :loading="isLoading">
        <!-- 加载中显示骨架屏 -->
        <template #skeleton>
          <div class="journal-bookshelf-view__skeleton">
            <SkeletonCard v-for="i in 3" :key="i" />
          </div>
        </template>
        
        <!-- 日记本书架 -->
        <JournalBookshelf
          :records="sealedRecords"
          @select="handleSelectJournal"
        />
      </SkeletonLoader>
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.journal-bookshelf-view {
  min-height: 100vh;
  padding: var(--spacing-page);
  padding-top: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;

  // 页面头部
  &__header {
    margin-bottom: var(--spacing-xl);
    text-align: center;
    animation: fadeInDown 0.6s ease-out;
  }

  &__title {
    @include flex-center;
    gap: var(--spacing-sm);
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    @include text-gradient;
  }

  &__title-icon {
    font-size: 1.2em;
  }

  &__subtitle {
    margin: var(--spacing-sm) 0 0;
    font-size: var(--font-size-md);
    color: var(--text-secondary);
  }

  // 内容区域
  &__content {
    animation: fadeInUp 0.4s ease-out;
  }

  // 骨架屏
  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
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

// 响应式布局
@include until-md {
  .journal-bookshelf-view {
    padding: var(--spacing-md);
    padding-top: var(--spacing-lg);

    &__title {
      font-size: var(--font-size-xl);
    }

    &__subtitle {
      font-size: var(--font-size-sm);
    }
  }
}
</style>
