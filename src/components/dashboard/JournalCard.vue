<template>
  <BaseCard class="journal-card" :hoverable="true">
    <template #header>
      <div class="journal-card__header-content">
        <h3 class="journal-card__title">📚 我的日记本</h3>
        <!-- 查看全部链接 -->
        <router-link 
          v-if="showViewAll" 
          to="/journals" 
          class="journal-card__view-all-link"
        >
          查看全部
        </router-link>
      </div>
    </template>

    <div class="journal-card__content-wrapper">
      <!-- 迷你书架预览 -->
      <div v-if="displayedJournals.length > 0" class="journal-card__content">
        <JournalBookshelf
          :records="displayedJournals"
          :max-items="MAX_DISPLAY_JOURNALS"
          :compact="true"
          @select="navigateToDetail"
        />
      </div>

      <!-- 空状态 -->
      <EmptyState
        v-else
        icon="📚"
        message="还没有日记本，封存今日记录后会出现在这里"
        action-text="写日记"
        action-route="/"
      />
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
/**
 * 日记本卡片组件
 * 使用迷你书架预览显示最近的日记本，支持点击跳转详情
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useArchiveStore } from '@/stores/archive'
import { EmptyState } from '@/components/dashboard'
import { JournalBookshelf } from '@/components/journal'
import BaseCard from '@/components/common/BaseCard.vue'

// 最大显示日记数
const MAX_DISPLAY_JOURNALS = 3

const router = useRouter()
const archiveStore = useArchiveStore()

// 获取已封存的日记记录（按日期降序排列）
const sealedRecords = computed(() => archiveStore.sortedRecords)

// 总日记数
const totalCount = computed(() => sealedRecords.value.length)

// 显示的日记（最多 3 条）
const displayedJournals = computed(() => 
  sealedRecords.value.slice(0, MAX_DISPLAY_JOURNALS)
)

// 是否显示"查看全部"链接
const showViewAll = computed(() => totalCount.value > 0)

/**
 * 跳转到日记详情页
 * @param recordId 日记记录 ID
 */
function navigateToDetail(recordId: string): void {
  router.push(`/detail/${recordId}`)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.journal-card {
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

  &__view-all-link {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
    text-decoration: none;
    transition: all var(--transition-fast);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);

    &:hover {
      background: var(--color-primary);
      color: var(--text-inverse);
    }
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
}
</style>
