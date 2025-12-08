<template>
  <div class="skeleton-list">
    <SkeletonCard
      v-for="i in count"
      :key="i"
      v-bind="cardProps"
      class="skeleton-list__item"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * SkeletonList 列表骨架屏组件
 * 渲染多个骨架卡片，用于列表加载占位
 * Requirements: 1.1
 */
import SkeletonCard from './SkeletonCard.vue'

interface SkeletonCardProps {
  lines?: number
  showAvatar?: boolean
  showImage?: boolean
}

interface Props {
  /** 骨架项数量，默认 3 */
  count?: number
  /** 传递给每个卡片的属性 */
  cardProps?: SkeletonCardProps
}

withDefaults(defineProps<Props>(), {
  count: 3,
  cardProps: () => ({})
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  
  &__item {
    width: 100%;
  }
}
</style>
