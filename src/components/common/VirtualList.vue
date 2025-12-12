<template>
  <div
    ref="containerRef"
    class="virtual-list"
    :style="{ height: `${containerHeight}px` }"
    @scroll="handleScroll"
  >
    <div
      class="virtual-list__spacer"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        v-for="{ item, index, style } in visibleItems"
        :key="getItemKey(item, index)"
        class="virtual-list__item"
        :style="style"
      >
        <slot :item="item" :index="index" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
/**
 * VirtualList 虚拟滚动列表组件
 * 仅渲染可视区域内的项目，优化长列表性能
 * Requirements: 4.1, 4.3
 */
import { ref, computed } from 'vue'
import { useVirtualScroll } from '@/composables/useVirtualScroll'

interface Props {
  /** 数据列表 */
  items: T[]
  /** 项目高度（固定值或计算函数） */
  itemHeight: number | ((item: T, index: number) => number)
  /** 缓冲区大小，默认 5 */
  bufferSize?: number
  /** 唯一标识字段，默认 'id' */
  keyField?: string
  /** 容器高度，默认 400px */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  bufferSize: 5,
  keyField: 'id',
  height: 400
})

const emit = defineEmits<{
  (e: 'scroll', scrollTop: number): void
  (e: 'reach-end'): void
}>()

// 容器引用
const containerRef = ref<HTMLElement | null>(null)

// 容器高度
const containerHeight = computed(() => props.height)

// 响应式 items
const itemsRef = computed(() => props.items)
const containerHeightRef = computed(() => containerHeight.value)

// 使用虚拟滚动 composable
const { visibleItems, totalHeight, scrollTop, onScroll } = useVirtualScroll({
  items: itemsRef,
  itemHeight: props.itemHeight,
  containerHeight: containerHeightRef,
  bufferSize: props.bufferSize
})

// 获取项目的唯一键
const getItemKey = (item: T, index: number): string | number => {
  if (props.keyField && typeof item === 'object' && item !== null) {
    const key = (item as Record<string, unknown>)[props.keyField]
    if (key !== undefined) {
      return String(key)
    }
  }
  return index
}

// 处理滚动事件
const handleScroll = (e: Event) => {
  onScroll(e)
  emit('scroll', scrollTop.value)
  
  // 检测是否滚动到底部
  const target = e.target as HTMLElement
  const threshold = 50 // 距离底部 50px 时触发
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - threshold) {
    emit('reach-end')
  }
}

// 暴露方法给父组件
defineExpose({
  scrollTo: (index: number) => {
    if (containerRef.value && index >= 0 && index < props.items.length) {
      // 计算目标位置
      let targetTop = 0
      if (typeof props.itemHeight === 'number') {
        targetTop = index * props.itemHeight
      } else {
        for (let i = 0; i < index; i++) {
          targetTop += props.itemHeight(props.items[i], i)
        }
      }
      containerRef.value.scrollTop = targetTop
    }
  },
  scrollToTop: () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = 0
    }
  },
  scrollToBottom: () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.virtual-list {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  
  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--color-bg-secondary);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
    
    &:hover {
      background: var(--color-text-secondary);
    }
  }
  
  &__spacer {
    position: relative;
    width: 100%;
  }
  
  &__item {
    width: 100%;
    box-sizing: border-box;
  }
}
</style>
