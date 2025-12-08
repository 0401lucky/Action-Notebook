import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import * as fc from 'fast-check'
import {
  useVirtualScroll,
  calculateTotalHeight,
  calculateVisibleRange,
  calculateItemPositions,
  getItemHeight
} from './useVirtualScroll'

describe('useVirtualScroll Property Tests', () => {
  /**
   * **Feature: ux-performance, Property 3: 虚拟滚动渲染数量约束**
   * *对于任意* 包含 N 个项目的虚拟列表（N > 50），实际渲染的 DOM 元素数量
   * 应等于可视区域项目数加上缓冲区大小的两倍，且远小于 N。
   * **Validates: Requirements 4.1**
   */
  it('Property 3: 虚拟滚动渲染数量约束', () => {
    fc.assert(
      fc.property(
        // 生成 51-200 个项目
        fc.integer({ min: 51, max: 200 }),
        // 项目高度 30-100px
        fc.integer({ min: 30, max: 100 }),
        // 容器高度 200-600px
        fc.integer({ min: 200, max: 600 }),
        // 缓冲区大小 1-10
        fc.integer({ min: 1, max: 10 }),
        // 滚动位置比例 0-1
        fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
        (itemCount, itemHeight, containerHeight, bufferSize, scrollRatio) => {
          // 创建测试数据
          const items = ref(Array.from({ length: itemCount }, (_, i) => ({ id: i })))
          const containerHeightRef = ref(containerHeight)

          const { visibleItems, totalHeight, scrollTop } = useVirtualScroll({
            items,
            itemHeight,
            containerHeight: containerHeightRef,
            bufferSize
          })

          // 设置滚动位置
          const maxScroll = Math.max(0, totalHeight.value - containerHeight)
          scrollTop.value = Math.floor(maxScroll * scrollRatio)

          // 计算可视区域内的项目数
          const visibleCount = Math.ceil(containerHeight / itemHeight)
          // 最大渲染数量 = 可视数量 + 2 * 缓冲区
          const maxRenderedCount = visibleCount + 2 * bufferSize

          // 验证：渲染数量应小于等于最大渲染数量
          expect(visibleItems.value.length).toBeLessThanOrEqual(maxRenderedCount + 1)
          // 验证：渲染数量应远小于总项目数
          expect(visibleItems.value.length).toBeLessThan(itemCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: ux-performance, Property 4: 虚拟滚动缓冲区正确性**
   * *对于任意* 虚拟列表滚动位置，渲染的项目应包含可视区域内的所有项目，
   * 以及上下各 bufferSize 个缓冲项目（在边界处可能更少）。
   * **Validates: Requirements 4.3**
   */
  it('Property 4: 虚拟滚动缓冲区正确性', () => {
    fc.assert(
      fc.property(
        // 生成 20-100 个项目
        fc.integer({ min: 20, max: 100 }),
        // 项目高度 40-80px
        fc.integer({ min: 40, max: 80 }),
        // 容器高度 200-400px
        fc.integer({ min: 200, max: 400 }),
        // 缓冲区大小 3-8
        fc.integer({ min: 3, max: 8 }),
        // 滚动位置比例 0.1-0.9（避免边界）
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
        (itemCount, itemHeight, containerHeight, bufferSize, scrollRatio) => {
          const items = Array.from({ length: itemCount }, (_, i) => ({ id: i }))
          
          // 计算总高度和滚动位置
          const totalHeight = itemCount * itemHeight
          const maxScroll = Math.max(0, totalHeight - containerHeight)
          const scrollTop = Math.floor(maxScroll * scrollRatio)

          // 计算可视范围
          const { startIndex, endIndex } = calculateVisibleRange(
            items,
            itemHeight,
            scrollTop,
            containerHeight,
            bufferSize
          )

          // 计算理论上的可视起始和结束索引（不含缓冲区）
          const theoreticalStart = Math.floor(scrollTop / itemHeight)
          const theoreticalEnd = Math.ceil((scrollTop + containerHeight) / itemHeight)

          // 验证：起始索引应包含缓冲区（但不小于0）
          const expectedStart = Math.max(0, theoreticalStart - bufferSize)
          expect(startIndex).toBe(expectedStart)

          // 验证：结束索引应包含缓冲区（但不超过总数）
          const expectedEnd = Math.min(itemCount, theoreticalEnd + bufferSize)
          expect(endIndex).toBe(expectedEnd)

          // 验证：所有可视区域内的项目都被包含
          for (let i = theoreticalStart; i < Math.min(theoreticalEnd, itemCount); i++) {
            expect(i).toBeGreaterThanOrEqual(startIndex)
            expect(i).toBeLessThan(endIndex)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: ux-performance, Property 5: 虚拟滚动高度计算正确性**
   * *对于任意* 项目高度函数和项目列表，虚拟列表的总高度应等于所有项目高度之和。
   * **Validates: Requirements 4.4**
   */
  it('Property 5: 虚拟滚动高度计算正确性 - 固定高度', () => {
    fc.assert(
      fc.property(
        // 项目数量 1-500
        fc.integer({ min: 1, max: 500 }),
        // 项目高度 20-150px
        fc.integer({ min: 20, max: 150 }),
        (itemCount, itemHeight) => {
          const items = Array.from({ length: itemCount }, (_, i) => ({ id: i }))
          
          // 计算总高度
          const totalHeight = calculateTotalHeight(items, itemHeight)
          
          // 验证：总高度 = 项目数 * 项目高度
          expect(totalHeight).toBe(itemCount * itemHeight)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: ux-performance, Property 5: 虚拟滚动高度计算正确性**
   * 动态高度版本
   * **Validates: Requirements 4.4**
   */
  it('Property 5: 虚拟滚动高度计算正确性 - 动态高度', () => {
    fc.assert(
      fc.property(
        // 生成 1-100 个项目，每个项目有随机高度
        fc.array(
          fc.integer({ min: 30, max: 150 }),
          { minLength: 1, maxLength: 100 }
        ),
        (heights) => {
          const items = heights.map((h, i) => ({ id: i, height: h }))
          
          // 动态高度函数
          const itemHeightFn = (item: { id: number; height: number }) => item.height
          
          // 计算总高度
          const totalHeight = calculateTotalHeight(items, itemHeightFn)
          
          // 验证：总高度 = 所有项目高度之和
          const expectedHeight = heights.reduce((sum, h) => sum + h, 0)
          expect(totalHeight).toBe(expectedHeight)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 测试项目位置计算的正确性
   */
  it('calculateItemPositions returns correct cumulative positions', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 30, max: 150 }),
          { minLength: 1, maxLength: 50 }
        ),
        (heights) => {
          const items = heights.map((h, i) => ({ id: i, height: h }))
          const itemHeightFn = (item: { id: number; height: number }) => item.height
          
          const positions = calculateItemPositions(items, itemHeightFn)
          
          // 验证：第一个位置应为 0
          expect(positions[0]).toBe(0)
          
          // 验证：每个位置应等于前面所有项目高度之和
          let expectedPosition = 0
          for (let i = 0; i < items.length; i++) {
            expect(positions[i]).toBe(expectedPosition)
            expectedPosition += heights[i]
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * 测试 getItemHeight 辅助函数
   */
  it('getItemHeight works for both fixed and dynamic heights', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 200 }),
        fc.integer({ min: 0, max: 100 }),
        (height, index) => {
          const item = { id: index, customHeight: height }
          
          // 固定高度
          const fixedHeight = 50
          expect(getItemHeight(fixedHeight, item, index)).toBe(fixedHeight)
          
          // 动态高度
          const dynamicHeightFn = (i: typeof item) => i.customHeight
          expect(getItemHeight(dynamicHeightFn, item, index)).toBe(height)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * 测试空列表边界情况
   */
  it('handles empty list correctly', () => {
    const items = ref<{ id: number }[]>([])
    const containerHeight = ref(400)

    const { visibleItems, totalHeight } = useVirtualScroll({
      items,
      itemHeight: 50,
      containerHeight,
      bufferSize: 5
    })

    expect(visibleItems.value.length).toBe(0)
    expect(totalHeight.value).toBe(0)
  })

  /**
   * 测试滚动到指定索引
   */
  it('scrollTo sets correct scroll position', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        fc.integer({ min: 30, max: 80 }),
        fc.integer({ min: 0, max: 9 }),
        (itemCount, itemHeight, targetIndex) => {
          const items = ref(Array.from({ length: itemCount }, (_, i) => ({ id: i })))
          const containerHeight = ref(300)

          const { scrollTo, scrollTop } = useVirtualScroll({
            items,
            itemHeight,
            containerHeight,
            bufferSize: 5
          })

          // 滚动到目标索引
          scrollTo(targetIndex)

          // 验证滚动位置
          expect(scrollTop.value).toBe(targetIndex * itemHeight)
        }
      ),
      { numRuns: 50 }
    )
  })
})
