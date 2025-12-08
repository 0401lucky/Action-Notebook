/**
 * 虚拟滚动组合式函数
 * 实现长列表的虚拟滚动，仅渲染可视区域内的项目
 * 
 * **Feature: ux-performance, Property 3: 虚拟滚动渲染数量约束**
 * **Feature: ux-performance, Property 4: 虚拟滚动缓冲区正确性**
 * **Feature: ux-performance, Property 5: 虚拟滚动高度计算正确性**
 */

import { ref, computed, type Ref, type ComputedRef, type CSSProperties } from 'vue'

export interface UseVirtualScrollOptions<T> {
  items: Ref<T[]>                                              // 数据列表
  itemHeight: number | ((item: T, index: number) => number)    // 项目高度（固定或动态）
  containerHeight: Ref<number>                                 // 容器高度
  bufferSize?: number                                          // 缓冲区大小，默认 5
}

export interface VirtualItem<T> {
  item: T
  index: number
  style: CSSProperties
}

export interface UseVirtualScrollReturn<T> {
  visibleItems: ComputedRef<VirtualItem<T>[]>   // 可视项目列表
  totalHeight: ComputedRef<number>              // 总高度
  scrollTo: (index: number) => void             // 滚动到指定索引
  onScroll: (e: Event) => void                  // 滚动事件处理
  scrollTop: Ref<number>                        // 当前滚动位置
}

/**
 * 计算单个项目的高度
 */
export function getItemHeight<T>(
  itemHeight: number | ((item: T, index: number) => number),
  item: T,
  index: number
): number {
  if (typeof itemHeight === 'function') {
    return itemHeight(item, index)
  }
  return itemHeight
}

/**
 * 计算所有项目的总高度
 */
export function calculateTotalHeight<T>(
  items: T[],
  itemHeight: number | ((item: T, index: number) => number)
): number {
  if (typeof itemHeight === 'number') {
    return items.length * itemHeight
  }
  return items.reduce((total, item, index) => {
    return total + itemHeight(item, index)
  }, 0)
}

/**
 * 计算项目位置（累积高度）
 */
export function calculateItemPositions<T>(
  items: T[],
  itemHeight: number | ((item: T, index: number) => number)
): number[] {
  const positions: number[] = []
  let currentPosition = 0
  
  for (let i = 0; i < items.length; i++) {
    positions.push(currentPosition)
    currentPosition += getItemHeight(itemHeight, items[i], i)
  }
  
  return positions
}

/**
 * 计算可视范围内的项目索引
 */
export function calculateVisibleRange<T>(
  items: T[],
  itemHeight: number | ((item: T, index: number) => number),
  scrollTop: number,
  containerHeight: number,
  bufferSize: number
): { startIndex: number; endIndex: number } {
  if (items.length === 0) {
    return { startIndex: 0, endIndex: 0 }
  }

  let startIndex = 0
  let endIndex = 0
  
  if (typeof itemHeight === 'number') {
    // 固定高度：直接计算
    startIndex = Math.floor(scrollTop / itemHeight)
    endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight)
  } else {
    // 动态高度：遍历查找
    let accumulatedHeight = 0
    
    // 查找起始索引
    for (let i = 0; i < items.length; i++) {
      const height = itemHeight(items[i], i)
      if (accumulatedHeight + height > scrollTop) {
        startIndex = i
        break
      }
      accumulatedHeight += height
    }
    
    // 查找结束索引
    accumulatedHeight = 0
    for (let i = 0; i < items.length; i++) {
      accumulatedHeight += itemHeight(items[i], i)
      if (accumulatedHeight >= scrollTop + containerHeight) {
        endIndex = i + 1
        break
      }
    }
    
    if (endIndex === 0) {
      endIndex = items.length
    }
  }
  
  // 应用缓冲区
  startIndex = Math.max(0, startIndex - bufferSize)
  endIndex = Math.min(items.length, endIndex + bufferSize)
  
  return { startIndex, endIndex }
}

/**
 * 虚拟滚动组合式函数
 */
export function useVirtualScroll<T>(options: UseVirtualScrollOptions<T>): UseVirtualScrollReturn<T> {
  const { items, itemHeight, containerHeight, bufferSize = 5 } = options
  
  // 当前滚动位置
  const scrollTop = ref(0)
  
  // 计算总高度
  const totalHeight = computed(() => {
    return calculateTotalHeight(items.value, itemHeight)
  })
  
  // 计算可视项目
  const visibleItems = computed<VirtualItem<T>[]>(() => {
    const { startIndex, endIndex } = calculateVisibleRange(
      items.value,
      itemHeight,
      scrollTop.value,
      containerHeight.value,
      bufferSize
    )
    
    const result: VirtualItem<T>[] = []
    const positions = calculateItemPositions(items.value, itemHeight)
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = items.value[i]
      if (item === undefined) continue
      
      const height = getItemHeight(itemHeight, item, i)
      const top = positions[i] ?? 0
      
      result.push({
        item,
        index: i,
        style: {
          position: 'absolute',
          top: `${top}px`,
          left: 0,
          right: 0,
          height: `${height}px`
        }
      })
    }
    
    return result
  })
  
  // 滚动事件处理
  const onScroll = (e: Event) => {
    const target = e.target as HTMLElement
    scrollTop.value = target.scrollTop
  }
  
  // 滚动到指定索引
  const scrollTo = (index: number) => {
    if (index < 0 || index >= items.value.length) return
    
    const positions = calculateItemPositions(items.value, itemHeight)
    scrollTop.value = positions[index] ?? 0
  }
  
  return {
    visibleItems,
    totalHeight,
    scrollTo,
    onScroll,
    scrollTop
  }
}

export default useVirtualScroll
