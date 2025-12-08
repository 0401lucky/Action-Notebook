import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import * as fc from 'fast-check'
import EmptyState from './EmptyState.vue'

// 空状态类型
const emptyStateTypes = ['task', 'journal', 'archive', 'search'] as const
type EmptyStateType = typeof emptyStateTypes[number]

// 默认配置映射（与组件内部配置保持一致）
const emptyStateConfig: Record<EmptyStateType, {
  icon: string
  title: string
  description: string
  actionText: string | null
}> = {
  task: {
    icon: 'clipboard-list',
    title: '暂无任务',
    description: '点击下方按钮添加第一个任务',
    actionText: '添加任务'
  },
  journal: {
    icon: 'book-open',
    title: '暂无日记',
    description: '开始记录你的第一篇日记吧',
    actionText: '写日记'
  },
  archive: {
    icon: 'archive',
    title: '暂无归档',
    description: '完成并封存的记录会显示在这里',
    actionText: null
  },
  search: {
    icon: 'search',
    title: '未找到结果',
    description: '尝试使用其他关键词搜索',
    actionText: '清除搜索'
  }
}

describe('EmptyState Component Property Tests', () => {
  /**
   * **Feature: ux-performance, Property 2: 空状态类型配置完整性**
   * *对于任意* EmptyState 组件的 type 属性值（task、journal、archive、search），
   * 组件应显示对应的图标、标题和描述文案，且当 showAction 为 true 时应渲染操作按钮。
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
   */
  it('Property 2: 空状态类型配置完整性', () => {
    // 生成空状态类型的 arbitrary
    const typeArb = fc.constantFrom(...emptyStateTypes)
    
    fc.assert(
      fc.property(
        typeArb,
        fc.boolean(),
        (type, showAction) => {
          const config = emptyStateConfig[type]
          
          const wrapper = mount(EmptyState, {
            props: { type, showAction }
          })

          // 验证标题显示正确
          const titleElement = wrapper.find('.empty-state__title')
          expect(titleElement.exists()).toBe(true)
          expect(titleElement.text()).toBe(config.title)

          // 验证描述显示正确
          const descElement = wrapper.find('.empty-state__description')
          expect(descElement.exists()).toBe(true)
          expect(descElement.text()).toBe(config.description)

          // 验证图标 SVG 存在
          const svgElement = wrapper.find('.empty-state__svg')
          expect(svgElement.exists()).toBe(true)

          // 验证操作按钮逻辑
          const actionButton = wrapper.find('.empty-state__action')
          if (showAction && config.actionText) {
            expect(actionButton.exists()).toBe(true)
            expect(actionButton.text()).toBe(config.actionText)
          } else {
            expect(actionButton.exists()).toBe(false)
          }

          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 测试自定义标题和描述覆盖默认配置
   */
  it('自定义标题和描述覆盖默认配置', () => {
    // 生成安全的文本内容（不含前导/尾随空格，避免 HTML trim 问题）
    const safeTextArb = fc.stringOf(
      fc.char().filter(c => !['<', '>', '{', '}', '"', "'", '`', ' ', '\t', '\n'].includes(c)),
      { minLength: 1, maxLength: 50 }
    ).filter(s => s.length > 0)

    const typeArb = fc.constantFrom(...emptyStateTypes)

    fc.assert(
      fc.property(
        typeArb,
        safeTextArb,
        safeTextArb,
        (type, customTitle, customDescription) => {
          const wrapper = mount(EmptyState, {
            props: {
              type,
              title: customTitle,
              description: customDescription
            }
          })

          // 验证自定义标题
          const titleElement = wrapper.find('.empty-state__title')
          expect(titleElement.text()).toBe(customTitle)

          // 验证自定义描述
          const descElement = wrapper.find('.empty-state__description')
          expect(descElement.text()).toBe(customDescription)

          wrapper.unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * 测试操作按钮点击事件触发
   */
  it('操作按钮点击触发 action 事件', () => {
    // 只测试有操作按钮的类型
    const typesWithAction = emptyStateTypes.filter(t => emptyStateConfig[t].actionText !== null)
    const typeArb = fc.constantFrom(...typesWithAction)

    fc.assert(
      fc.property(
        typeArb,
        (type) => {
          const wrapper = mount(EmptyState, {
            props: { type, showAction: true }
          })

          const actionButton = wrapper.find('.empty-state__action')
          expect(actionButton.exists()).toBe(true)

          // 点击按钮
          actionButton.trigger('click')

          // 验证事件触发
          expect(wrapper.emitted('action')).toBeTruthy()
          expect(wrapper.emitted('action')?.length).toBe(1)

          wrapper.unmount()
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * 测试自定义操作按钮文案
   */
  it('自定义操作按钮文案', () => {
    // 生成安全的文本内容（不含前导/尾随空格，避免 HTML trim 问题）
    const safeTextArb = fc.stringOf(
      fc.char().filter(c => !['<', '>', '{', '}', '"', "'", '`', ' ', '\t', '\n'].includes(c)),
      { minLength: 1, maxLength: 20 }
    ).filter(s => s.length > 0)

    const typeArb = fc.constantFrom(...emptyStateTypes)

    fc.assert(
      fc.property(
        typeArb,
        safeTextArb,
        (type, customActionText) => {
          const wrapper = mount(EmptyState, {
            props: {
              type,
              actionText: customActionText,
              showAction: true
            }
          })

          const actionButton = wrapper.find('.empty-state__action')
          expect(actionButton.exists()).toBe(true)
          expect(actionButton.text()).toBe(customActionText)

          wrapper.unmount()
        }
      ),
      { numRuns: 50 }
    )
  })
})
