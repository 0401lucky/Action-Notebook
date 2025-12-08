<script setup lang="ts">
/**
 * 日记本书架组件
 * 
 * 以书架形式展示所有日记本，支持：
 * - 按月份分组显示
 * - compact 模式（仪表盘预览）
 * - 玻璃拟态风格
 * 
 * Requirements: 10.1, 10.2, 10.4, 11.4
 */
import { computed } from 'vue'
import type { DailyRecord } from '@/types'
import { groupRecordsByMonth } from '@/services/bookshelf'
import JournalBookCard from './JournalBookCard.vue'
import { EmptyState } from '@/components/common'

interface Props {
  /** 日记记录列表 */
  records: DailyRecord[]
  /** 最大显示数量（用于仪表盘预览） */
  maxItems?: number
  /** 紧凑模式（用于仪表盘） */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: undefined,
  compact: false
})

const emit = defineEmits<{
  (e: 'select', recordId: string): void
}>()

/**
 * 按月份分组的日记记录
 */
const monthGroups = computed(() => {
  // 如果有 maxItems 限制，先截取记录
  let recordsToGroup = props.records
  
  if (props.maxItems !== undefined && props.maxItems > 0) {
    // 按日期倒序排列后截取
    const sorted = [...props.records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    recordsToGroup = sorted.slice(0, props.maxItems)
  }
  
  return groupRecordsByMonth(recordsToGroup)
})

/**
 * 紧凑模式下的扁平记录列表
 */
const flatRecords = computed(() => {
  if (!props.compact) return []
  
  // 按日期倒序排列
  const sorted = [...props.records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  return props.maxItems ? sorted.slice(0, props.maxItems) : sorted
})

/**
 * 处理日记本点击
 */
function handleBookClick(recordId: string): void {
  emit('select', recordId)
}
</script>

<template>
  <div 
    class="journal-bookshelf"
    :class="{ 'journal-bookshelf--compact': compact }"
  >
    <!-- 紧凑模式：直接显示书本列表 -->
    <template v-if="compact">
      <div class="journal-bookshelf__shelf journal-bookshelf__shelf--compact">
        <div class="journal-bookshelf__books">
          <JournalBookCard
            v-for="record in flatRecords"
            :key="record.id"
            :record="record"
            :compact="true"
            @click="handleBookClick(record.id)"
          />
        </div>
        <!-- 书架底板 -->
        <div class="journal-bookshelf__shelf-board"></div>
      </div>
    </template>

    <!-- 完整模式：按月份分组显示 -->
    <template v-else>
      <div 
        v-for="group in monthGroups" 
        :key="group.month"
        class="journal-bookshelf__month-group"
      >
        <!-- 月份标题 -->
        <h3 class="journal-bookshelf__month-title">
          {{ group.label }}
        </h3>
        
        <!-- 书架 -->
        <div class="journal-bookshelf__shelf">
          <div class="journal-bookshelf__books">
            <JournalBookCard
              v-for="record in group.records"
              :key="record.id"
              :record="record"
              @click="handleBookClick(record.id)"
            />
          </div>
          <!-- 书架底板 -->
          <div class="journal-bookshelf__shelf-board"></div>
        </div>
      </div>

      <!-- 空状态 -->
      <EmptyState
        v-if="monthGroups.length === 0"
        type="journal"
        title="还没有日记本"
        description="封存今日记录后，日记本会出现在这里"
        :show-action="false"
      />
    </template>
  </div>
</template>


<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.journal-bookshelf {
  @include flex-column;
  gap: var(--spacing-xl);

  // 紧凑模式
  &--compact {
    gap: 0;
  }

  // 月份分组
  &__month-group {
    @include flex-column;
    gap: var(--spacing-md);
  }

  // 月份标题
  &__month-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    padding-left: var(--spacing-sm);
    border-left: 3px solid var(--color-primary);
  }

  // 书架
  &__shelf {
    position: relative;
    @include glass-effect;
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    padding-bottom: calc(var(--spacing-lg) + 12px);
    box-shadow: var(--glass-shadow);

    &--compact {
      padding: var(--spacing-md);
      padding-bottom: calc(var(--spacing-md) + 8px);
      border-radius: var(--radius-md);
    }
  }

  // 书本容器
  &__books {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    align-items: flex-end;
    min-height: 160px;

    .journal-bookshelf--compact & {
      min-height: 120px;
      gap: var(--spacing-sm);
    }
  }

  // 书架底板
  &__shelf-board {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 12px;
    background: linear-gradient(
      180deg,
      var(--color-primary-dark) 0%,
      var(--color-primary) 50%,
      var(--color-primary-dark) 100%
    );
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    box-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.15),
      inset 0 2px 4px rgba(255, 255, 255, 0.1);

    .journal-bookshelf__shelf--compact & {
      height: 8px;
      border-radius: 0 0 var(--radius-md) var(--radius-md);
    }
  }

  // 空状态
  &__empty {
    @include flex-column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    @include glass-effect;
    border-radius: var(--radius-lg);
    text-align: center;
  }

  &__empty-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
    opacity: 0.6;
  }

  &__empty-text {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
  }

  &__empty-hint {
    margin: var(--spacing-sm) 0 0;
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }
}
</style>
