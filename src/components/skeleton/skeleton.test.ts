import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import * as fc from 'fast-check'
import SkeletonLoader from './SkeletonLoader.vue'
import SkeletonCard from './SkeletonCard.vue'
import SkeletonList from './SkeletonList.vue'

describe('Skeleton Components Property Tests', () => {
  /**
   * **Feature: ux-performance, Property 1: 骨架屏加载状态一致性**
   * *对于任意* SkeletonLoader 组件实例，当 loading 属性为 true 时，
   * 组件应渲染骨架屏占位符；当 loading 为 false 时，组件应渲染实际内容插槽。
   * **Validates: Requirements 1.1, 1.2**
   */
  it('Property 1: 骨架屏加载状态一致性', () => {
    // 生成安全的文本内容，过滤掉 Vue 模板特殊字符
    const safeTextArb = fc.stringOf(
      fc.char().filter(c => !['<', '>', '{', '}', '"', "'", '`'].includes(c)),
      { minLength: 1, maxLength: 50 }
    ).filter(s => s.trim().length > 0)

    fc.assert(
      fc.property(
        fc.boolean(),
        safeTextArb,
        (loading, contentText) => {
          const wrapper = mount(SkeletonLoader, {
            props: { loading },
            slots: {
              default: `<div class="actual-content">${contentText}</div>`,
              skeleton: '<div class="skeleton-content">加载中...</div>'
            }
          })

          if (loading) {
            // 当 loading 为 true 时，应显示骨架屏内容
            expect(wrapper.find('.skeleton-content').exists()).toBe(true)
            expect(wrapper.find('.actual-content').exists()).toBe(false)
          } else {
            // 当 loading 为 false 时，应显示实际内容
            expect(wrapper.find('.actual-content').exists()).toBe(true)
            expect(wrapper.find('.skeleton-content').exists()).toBe(false)
          }

          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 测试 SkeletonCard 组件的行数配置
   * 验证组件根据 lines 属性渲染正确数量的占位行
   */
  it('SkeletonCard renders correct number of lines', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (lines) => {
          const wrapper = mount(SkeletonCard, {
            props: { lines }
          })

          const lineElements = wrapper.findAll('.skeleton-card__line')
          expect(lineElements.length).toBe(lines)

          wrapper.unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * 测试 SkeletonCard 组件的头像和图片占位符配置
   */
  it('SkeletonCard shows avatar and image placeholders based on props', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (showAvatar, showImage) => {
          const wrapper = mount(SkeletonCard, {
            props: { showAvatar, showImage }
          })

          const avatarElement = wrapper.find('.skeleton-card__avatar')
          const imageElement = wrapper.find('.skeleton-card__image')

          expect(avatarElement.exists()).toBe(showAvatar)
          expect(imageElement.exists()).toBe(showImage)

          wrapper.unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * 测试 SkeletonList 组件的数量配置
   * 验证组件根据 count 属性渲染正确数量的骨架卡片
   */
  it('SkeletonList renders correct number of skeleton cards', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (count) => {
          const wrapper = mount(SkeletonList, {
            props: { count }
          })

          const cardElements = wrapper.findAllComponents(SkeletonCard)
          expect(cardElements.length).toBe(count)

          wrapper.unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * 测试 SkeletonList 组件的 cardProps 传递
   * 验证 cardProps 正确传递到子组件
   */
  it('SkeletonList passes cardProps to child SkeletonCard components', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 8 }),
        fc.boolean(),
        fc.boolean(),
        (count, lines, showAvatar, showImage) => {
          const wrapper = mount(SkeletonList, {
            props: {
              count,
              cardProps: { lines, showAvatar, showImage }
            }
          })

          const cardComponents = wrapper.findAllComponents(SkeletonCard)
          expect(cardComponents.length).toBe(count)

          // 验证每个卡片都有正确的行数
          cardComponents.forEach(card => {
            const lineElements = card.findAll('.skeleton-card__line')
            expect(lineElements.length).toBe(lines)

            const avatarElement = card.find('.skeleton-card__avatar')
            const imageElement = card.find('.skeleton-card__image')
            expect(avatarElement.exists()).toBe(showAvatar)
            expect(imageElement.exists()).toBe(showImage)
          })

          wrapper.unmount()
        }
      ),
      { numRuns: 30 }
    )
  })
})
